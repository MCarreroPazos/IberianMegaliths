# ESM_2 - Figure B
# Regional bayesian trapezoidal model comparison for chamber contexts

# Load R packages -----
library(here)
library(oxcAAR)
library(rcarbon)
library(grDevices)
library(graphics)
library(stats)
library(parallel)

# Set execution flags -----
# Change to TRUE to re-run all OxCal MCMC models from scratch
force_recompute <- FALSE

oxcal_path <- here("OxCal", "bin", "OxCalWin.exe")
setOxcalExecutablePath(oxcal_path)

source(here("src", "oxcalScriptCreator.R"))
source(here("src", "oxcalParsing.R"))

regions_test <- c("Duero basins", "South", "Tagus basins")
subsets_test <- c("chamber_bone", "chamber_charcoal", "chamber_combined")
region_labels <- c(Duero_basins = "Duero basins", South = "South", Tagus_basins = "Tagus basins")

# Check if RDS files exist
all_rds_exist <- all(sapply(subsets_test, function(s) {
  all(sapply(c("Duero_basins", "South", "Tagus_basins"), function(r) {
    file.exists(here("oxcalresults", s, paste0("trapezoid_regional_", r, ".rds")))
  }))
}))

# Optional Recompute Block -----
if (force_recompute || !all_rds_exist) {
  message("Running chamber trapezoidal OxCal models with Charcoal Outlier Model...")
  raw_df <- read.csv(here("data", "C14dates_Iberia_raw.csv"), sep = ";", encoding = "UTF-8", stringsAsFactors = FALSE)
  
  jobs <- list()
  for (s in subsets_test) {
    for (r in c("Duero_basins", "South", "Tagus_basins")) {
      fn_oxcal <- here("oxcalscripts", s, paste0("trapezoid_regional_", r, ".oxcal"))
      if (!file.exists(fn_oxcal)) next
      
      lines <- readLines(fn_oxcal)
      dlines <- grep("R_Date", lines, value = TRUE)
      labs <- character()
      for (dl in dlines) {
        m <- regmatches(dl, regexec('R_Date\\("([^"]+)"', dl))[[1]]
        if (length(m) >= 2) labs <- c(labs, m[2])
      }
      
      sub_df <- do.call(rbind, lapply(labs, function(l) {
        raw_df[raw_df$LabNumber == l, ][1, ]
      }))
      
      jobs[[paste(s, r, sep = "___")]] <- list(
        subset = s,
        region = r,
        labs = sub_df$LabNumber,
        c14 = as.numeric(sub_df$C14),
        std = as.numeric(sub_df$STD),
        mat = sub_df$Material)
    }
  }
  
  run_job_internal <- function(job, ox_path, root_dir) {
    library(oxcAAR)
    setOxcalExecutablePath(ox_path)
    source(file.path(root_dir, "src", "oxcalScriptCreator.R"))
    source(file.path(root_dir, "src", "oxcalParsing.R"))
    
    s <- job$subset
    r <- job$region
    
    mat_vec <- if (s == "chamber_charcoal") {
      rep("Charcoal", length(job$labs))
    } else if (s == "chamber_bone") {
      rep("Human bone", length(job$labs))
    } else {
      job$mat
    }
    
    fn_script <- file.path(root_dir, "oxcalscripts", s, paste0("trapezoid_regional_", r, ".oxcal"))
    fn_rds    <- file.path(root_dir, "oxcalresults", s, paste0("trapezoid_regional_", r, ".rds"))
    
    oxcalRegionalTrapezoidScript(
      region_name           = r,
      c14ages               = job$c14,
      errors                = job$std,
      lab_ids               = job$labs,
      materials             = mat_vec,
      fn                    = fn_script,
      iterations            = 100000,
      convergence_threshold = 95)
    
    tmpdir <- tempfile(pattern = paste0("ox_", s, "_", r, "_"))
    dir.create(tmpdir)
    oldwd <- setwd(tmpdir)
    on.exit({
      setwd(oldwd)
      try(unlink(tmpdir, recursive = TRUE), silent = TRUE)
    }, add = TRUE)
    
    res_file <- executeOxcalScript(paste(readLines(fn_script, warn = FALSE), collapse = "\n"))
    parsed   <- parse_oxcal_output(readLines(res_file, warn = FALSE))
    post     <- extract_regional_posteriors(parsed, r, 100000)
    saveRDS(post, fn_rds)
    return(r)
  }
  
  n_cores <- min(length(jobs), detectCores() - 1, 9)
  root_dir <- here()
  cl <- makeCluster(n_cores)
  clusterExport(cl, c("jobs", "oxcal_path", "run_job_internal", "root_dir"), envir = environment())
  parLapply(cl, jobs, function(jb) run_job_internal(jb, oxcal_path, root_dir))
  stopCluster(cl)
}

# Color palette (same as Figure 5 and Figure 6) -----
param_cols <- c(
  onset     = "#2166ac",
  peak      = "#1a9641",
  decline   = "#d7191c",
  disappear = "#7b2d8b")

param_names   <- c("onset", "peak", "decline", "disappear")
param_labels  <- c("Onset", "Peak", "Decline", "Disappear")
param_offsets <- c(onset = 0.35, peak = 0.12, decline = -0.12, disappear = -0.35)

# Helper function
to_bce <- function(v) -v

# Quantile summary function (same as Figure 6.R)
qstats <- function(post, param) {
  v <- to_bce(post[[param]])
  v <- v[is.finite(v)]
  c(lo95 = quantile(v, 0.025, names = FALSE),
    lo50 = quantile(v, 0.25,  names = FALSE),
    med  = median(v),
    hi50 = quantile(v, 0.75,  names = FALSE),
    hi95 = quantile(v, 0.975, names = FALSE))
}

# Load posteriors for the 3 chamber datasets
ch_bone_list     <- list()
ch_charcoal_list <- list()
ch_combined_list <- list()

for (reg in regions_test) {
  fname <- paste0("trapezoid_regional_", gsub(" ", "_", reg), ".rds")
  fp_b  <- here("oxcalresults", "chamber_bone",     fname)
  fp_c  <- here("oxcalresults", "chamber_charcoal", fname)
  fp_m  <- here("oxcalresults", "chamber_combined", fname)
  
  if (file.exists(fp_b)) ch_bone_list[[reg]]     <- readRDS(fp_b)
  if (file.exists(fp_c)) ch_charcoal_list[[reg]] <- readRDS(fp_c)
  if (file.exists(fp_m)) ch_combined_list[[reg]] <- readRDS(fp_m)
}

# Sort regions by combined onset median (earliest at top)
onset_med <- sapply(regions_test, function(r) {
  if (is.null(ch_combined_list[[r]])) return(NA)
  median(to_bce(ch_combined_list[[r]][["onset"]]), na.rm = TRUE)
})
regions_ord <- regions_test[order(onset_med, decreasing = TRUE)]
nreg        <- length(regions_ord)

# Bar drawing function (exact same as Figure 6.R)
post.bar <- function(x, i, h, col) {
  # 95% HPDI
  rect(xleft = x["lo95"], xright = x["hi95"],
       ybottom = i - h/6, ytop = i + h/6,
       border = adjustcolor(col, 0.60), col = adjustcolor(col, 0.60), lwd = 0.5)
  # 50% HPDI
  rect(xleft = x["lo50"], xright = x["hi50"],
       ybottom = i - h/2.5, ytop = i + h/2.5,
       border = adjustcolor(col, 0.60), col = adjustcolor(col, 0.60), lwd = 0.5)
  # Median (grey vertical line)
  lines(c(x["med"], x["med"]), c(i - h/2, i + h/2),
        lwd = 2.5, col = "grey44")
}

# Layout parameters
h_bar  <- 0.18
xlim_p <- c(6000, 2500)  # reversed: older dates on left
at_maj <- seq(6000, 2500, by = -500)

y_comb_of <- function(ri) (nreg - ri + 1) * 4.0
y_char_of <- function(ri) (nreg - ri + 1) * 4.0 - 1.0
y_bone_of <- function(ri) (nreg - ri + 1) * 4.0 - 2.0
ylim_p    <- c(-2.5, nreg * 4.0 + 1.5)

dir.create(here("esm"), showWarnings = FALSE, recursive = TRUE)

# Output image path: esm/Figure_B.png
out_png <- here("esm", "Figure_B.png")

png(file = out_png,
    width = 1600, height = 1200, res = 160)

par(mar  = c(4, 9, 3, 1),
    mgp  = c(2, 0.7, 0),
    cex.axis = 0.95,
    cex.lab  = 1.05)

plot(NULL,
     xlim = xlim_p,
     ylim = ylim_p,
     xlab = "",
     ylab = "",
     axes = FALSE,
     main = "")

# Horizontal separators between regions
abline(h = seq(5.5, by = 4.0, length.out = nreg - 1),
       col = "darkgrey", lty = 2, lwd = 1.0)

# X axes
axis(1, at = at_maj, labels = at_maj, tck = -0.015, padj = -0.2)
axis(3, at = at_maj, labels = at_maj, tck = -0.015, padj =  0.2)
mtext("BCE", side = 1, line = 2.2, cex = 1.1)
mtext("BCE", side = 3, line = 1.8, cex = 1.1)

# Draw bars for each region
for (ri in seq_along(regions_ord)) {
  reg    <- regions_ord[ri]
  y_comb <- y_comb_of(ri)
  y_char <- y_char_of(ri)
  y_bone <- y_bone_of(ri)
  
  for (p in param_names) {
    col   <- param_cols[p]
    p_off <- param_offsets[p]
    
    # Combined
    if (!is.null(ch_combined_list[[reg]])) {
      s <- qstats(ch_combined_list[[reg]], p)
      if (all(is.finite(s))) post.bar(s, y_comb + p_off, h_bar, col)
    }
    # Charcoal
    if (!is.null(ch_charcoal_list[[reg]])) {
      s <- qstats(ch_charcoal_list[[reg]], p)
      if (all(is.finite(s))) post.bar(s, y_char + p_off, h_bar, col)
    }
    # Bone/teeth
    if (!is.null(ch_bone_list[[reg]])) {
      s <- qstats(ch_bone_list[[reg]], p)
      if (all(is.finite(s))) post.bar(s, y_bone + p_off, h_bar, col)
    }
  }
  
  # Sub-labels for dataset variations on left
  text(5950, y_comb, "Chamber Combined", cex = 0.75, adj = 0, font = 3)
  text(5950, y_char, "Chamber Charcoal", cex = 0.75, adj = 0, font = 3)
  text(5950, y_bone, "Chamber Bone/teeth", cex = 0.75, adj = 0, font = 3)
  
  # Region label
  y_mid <- (y_comb + y_bone) / 2
  mtext(reg, side = 2, at = y_mid, las = 2, line = 1.5, cex = 1.0, font = 2)
}

box(bty = "o", lwd = 1.2)

# Legend HPDI at bottom left (matching Figure 6.R)
y0 <- -1.0
ex_x <- c(lo95=4800, lo50=4500, med=4200, hi50=3800, hi95=3300)
post.bar(ex_x, y0, 0.7, "grey60")

arrows(x0=ex_x["lo95"], x1=ex_x["hi95"], y0=y0 - 0.7, y1=y0 - 0.7, angle = 90, code = 3, length = 0.03, lwd = 1.2)
arrows(x0=ex_x["lo50"], x1=ex_x["hi50"], y0=y0 - 1.2, y1=y0 - 1.2, angle = 90, code = 3, length = 0.03, lwd = 1.2)

text(ex_x["lo95"] + 100, y0 - 0.7, "95% HPDI", cex = 0.75, adj = c(1, 0.5))
text(ex_x["lo50"] + 100, y0 - 1.2, "50% HPDI", cex = 0.75, adj = c(1, 0.5))

lines(c(ex_x["med"], ex_x["med"] + 200), c(y0+0.5, y0+1.2))
text(ex_x["med"] + 250, y0+1.2, "Median posterior", cex = 0.75, adj = c(1, 0.5))

# Legend Phase Parameters
legend(x = "bottomleft", inset = c(0.02, 0.02),
       legend = param_labels,
       fill   = adjustcolor(param_cols, 0.60),
       border = NA,
       bty    = "n",
       cex    = 0.95,
       title  = expression(bold("Phase parameter")))

dev.off()