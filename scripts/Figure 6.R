# Figure 6. Regional trapezoidal model comparison by material

# Load libraries
library(here)
library(oxcAAR)
library(rcarbon)

# Define colour palette (consistent with Figure 5)
param_cols <- c(
  onset     = "#2166ac",
  peak      = "#1a9641",
  decline   = "#d7191c",
  disappear = "#7b2d8b"
)
param_names  <- c("onset", "peak", "decline", "disappear")
param_labels <- c("Onset", "Peak", "Decline", "Disappear")
param_offsets <- c(onset = 0.35, peak = 0.12, decline = -0.12, disappear = -0.35)

all_regions <- c("North", "Duero basins", "East", "Ebro basin", "South", "Tagus basins")

# Minimum site threshold to run/plot a material subset
MIN_SITES <- 5

# --- Part 1. Setup OxCal paths and functions ---
oxcal_path <- here("OxCal", "bin", "OxCalWin.exe")
setOxcalExecutablePath(oxcal_path)

source(here("src", "oxcalScriptCreator.R"))
source(here("src", "oxcalParsing.R"))
source(here("src", "oxcalWorkflow.R"))

dir.create(here("oxcalresults", "bone_only"), showWarnings = FALSE, recursive = TRUE)
dir.create(here("oxcalscripts", "bone_only"), showWarnings = FALSE, recursive = TRUE)
dir.create(here("oxcalresults", "charcoal_only"), showWarnings = FALSE, recursive = TRUE)
dir.create(here("oxcalscripts", "charcoal_only"), showWarnings = FALSE, recursive = TRUE)

# --- Part 2. Load and filter dates ---
dates_raw <- read.csv(here("data", "C14dates_Iberia_raw.csv"), sep = ";", na = "n/a")
dates_raw <- dates_raw[dates_raw$Excluded == "No", ]

# Calibrate all dates to filter by median calibrated age (6000 BCE to 2500 BCE)
dates_cal <- calibrate(x = dates_raw$C14, errors = dates_raw$STD, calCurves = "intcal20")
dates_raw$MedianBCE <- summary(dates_cal)$MedianBP - 1950
dates_valid <- dates_raw[dates_raw$MedianBCE >= 2500 & dates_raw$MedianBCE <= 6000, ]

# Select earliest date per site
earliest_all <- do.call(rbind, lapply(split(dates_valid, dates_valid$Site), function(d) d[which.max(d$C14), , drop = FALSE]))
rownames(earliest_all) <- NULL
earliest_all$LabNumber <- make.unique(as.character(earliest_all$LabNumber))

# Subsets
bone_materials <- c("Human bone", "Animal bone", "Human teeth", "Bone", "Tooth")
earliest_bone <- earliest_all[earliest_all$Material %in% bone_materials, ]
earliest_char <- earliest_all[grepl("charcoal", earliest_all$Material, ignore.case = TRUE), ]

# Identify regions meeting the minimum sample size threshold
sites_bone_count <- table(earliest_bone$Region)
sites_char_count <- table(earliest_char$Region)

regions_bone_run <- names(sites_bone_count)[sites_bone_count >= MIN_SITES]
regions_char_run <- names(sites_char_count)[sites_char_count >= MIN_SITES]

# --- Part 3. Run regional trapezoidal models (Threadripper 20 cores) ---
# 1. Bone only
if (length(regions_bone_run) > 0) {
  run_regional_trapezoid(
    region_names    = regions_bone_run,
    dates_earliest  = earliest_bone,
    oxcal_path      = oxcal_path,
    scripts_dir     = here("oxcalscripts", "bone_only"),
    results_dir     = here("oxcalresults", "bone_only"),
    nsim            = 100000,
    n_cores         = 20,
    force_recompute = FALSE) # To recompute change this to TRUE
}

# 2. Charcoal only
if (length(regions_char_run) > 0) {
  run_regional_trapezoid(
    region_names    = regions_char_run,
    dates_earliest  = earliest_char,
    oxcal_path      = oxcal_path,
    scripts_dir     = here("oxcalscripts", "charcoal_only"),
    results_dir     = here("oxcalresults", "charcoal_only"),
    nsim            = 100000,
    n_cores         = 20,
    force_recompute = FALSE) # To recompute change this to TRUE
}

# 3. All dates
# Note: Already computed by Figure 5.R in oxcalresults/
run_regional_trapezoid(
  region_names    = all_regions,
  dates_earliest  = earliest_all,
  oxcal_path      = oxcal_path,
  scripts_dir     = here("oxcalscripts"),
  results_dir     = here("oxcalresults"),
  nsim            = 100000,
  n_cores         = 20,
  force_recompute = FALSE) # To recompute change this to TRUE

# --- Part 4. Load posteriors ---
to_bce <- function(v) -v

full_list <- list()
bone_list <- list()
char_list <- list()

for (reg in all_regions) {
  safe   <- gsub("[^A-Za-z0-9]", "_", reg)
  fname  <- paste0("trapezoid_regional_", safe, ".rds")
  fp_f   <- here("oxcalresults", fname)
  fp_b   <- here("oxcalresults", "bone_only", fname)
  fp_c   <- here("oxcalresults", "charcoal_only", fname)

  if (file.exists(fp_f)) full_list[[reg]] <- readRDS(fp_f)
  if (reg %in% regions_bone_run && file.exists(fp_b)) bone_list[[reg]] <- readRDS(fp_b)
  if (reg %in% regions_char_run && file.exists(fp_c)) char_list[[reg]] <- readRDS(fp_c)
}

# Quantile summary function
qstats <- function(post, param) {
  v <- to_bce(post[[param]])
  v <- v[is.finite(v)]
  c(lo95 = quantile(v, 0.025, names = FALSE),
    lo50 = quantile(v, 0.25,  names = FALSE),
    med  = median(v),
    hi50 = quantile(v, 0.75,  names = FALSE),
    hi95 = quantile(v, 0.975, names = FALSE))
}

# Sort regions by full-dataset onset median (earliest at top)
onset_med <- sapply(all_regions, function(r) {
  if (is.null(full_list[[r]])) return(NA)
  median(to_bce(full_list[[r]][["onset"]]), na.rm = TRUE)
})
regions_ord <- all_regions[order(onset_med, decreasing = TRUE)]
nreg <- length(regions_ord)

# Bar plotting helper
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
        lwd = 2.2, col = "grey40")
}

# --- Part 5. Layout and Rendering ---
h_bar  <- 0.22
xlim_p <- c(6000, 2500)  # reversed: older dates on the left
at_maj <- seq(6000, 2500, by = -500)
at_min <- seq(6000, 2500, by = -100)

# Three bars per region:
# Upper: All dates
# Middle: Charcoal only
# Lower: Bone / teeth only
y_full_of <- function(ri) (nreg - ri + 1) * 3.8 + 0.9
y_char_of <- function(ri) (nreg - ri + 1) * 3.8
y_bone_of <- function(ri) (nreg - ri + 1) * 3.8 - 0.9
ylim_p    <- c(-3.2, nreg * 3.8 + 3.2)

png(file = here("figures", "Figure 6.png"),
    width = 1800, height = 1450, res = 160)

par(mar  = c(4.5, 9.5, 3.5, 1.5),
    mgp  = c(2.2, 0.7, 0),
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
abline(h = seq(4.8, by = 3.8, length.out = nreg - 1),
       col = "darkgrey", lty = 2, lwd = 0.9)

# X axes
axis(1, at = at_maj, labels = at_maj, tck = -0.015, padj = -0.2)
axis(3, at = at_maj, labels = at_maj, tck = -0.015, padj =  0.2)
mtext("BCE", side = 1, line = 2.4, cex = 1.1)
mtext("BCE", side = 3, line = 1.9, cex = 1.1)

# Draw bars for each region
for (ri in seq_along(regions_ord)) {
  reg    <- regions_ord[ri]
  y_full <- y_full_of(ri)
  y_char <- y_char_of(ri)
  y_bone <- y_bone_of(ri)

  # 1. Full dataset (Combined + Charcoal Outlier model)
  if (!is.null(full_list[[reg]])) {
    for (p in param_names) {
      s <- qstats(full_list[[reg]], p)
      if (all(is.finite(s))) post.bar(s, y_full + param_offsets[p], h_bar, param_cols[p])
    }
  }

  # 2. Charcoal only (or blank if insufficient)
  if (!is.null(char_list[[reg]])) {
    for (p in param_names) {
      s <- qstats(char_list[[reg]], p)
      if (all(is.finite(s))) post.bar(s, y_char + param_offsets[p], h_bar, param_cols[p])
    }
  } else {
    text(4250, y_char, "(Insufficient charcoal data)", col = "grey65", cex = 0.75, font = 3)
  }

  # 3. Bone only (or blank if insufficient)
  if (!is.null(bone_list[[reg]])) {
    for (p in param_names) {
      s <- qstats(bone_list[[reg]], p)
      if (all(is.finite(s))) post.bar(s, y_bone + param_offsets[p], h_bar, param_cols[p])
    }
  } else {
    text(4250, y_bone, "(No bone data)", col = "grey65", cex = 0.75, font = 3)
  }

  # Region label on y-axis
  y_mid <- y_char
  mtext(reg, side = 2, at = y_mid, las = 2, line = 1.5, cex = 1.05, font = 2)
}

box(bty = "o", lwd = 1.2)

# Place dataset labels at bottom
ri_bottom <- nreg
text(5950, y_full_of(ri_bottom), "All dates", cex = 0.85, adj = 0, font = 1)
text(5950, y_char_of(ri_bottom), "Charcoal only",           cex = 0.85, adj = 0, font = 1)
text(5950, y_bone_of(ri_bottom), "Bone / teeth only",        cex = 0.85, adj = 0, font = 1)

# Legend HPDI scale bar
y0 <- -1.8
ex_x <- c(lo95=4900, lo50=4600, med=4300, hi50=3900, hi95=3400)
post.bar(ex_x, y0, 0.75, "grey60")

arrows(x0=ex_x["lo95"], x1=ex_x["hi95"], y0=y0 - 0.7, y1=y0 - 0.7, angle = 90, code = 3, length = 0.03, lwd = 1.2)
arrows(x0=ex_x["lo50"], x1=ex_x["hi50"], y0=y0 - 1.2, y1=y0 - 1.2, angle = 90, code = 3, length = 0.03, lwd = 1.2)

text(ex_x["lo95"] + 100, y0 - 0.7, "95% HPDI", cex = 0.75, adj = c(1, 0.5))
text(ex_x["lo50"] + 100, y0 - 1.2, "50% HPDI", cex = 0.75, adj = c(1, 0.5))

lines(c(ex_x["med"], ex_x["med"] + 200), c(y0 + 0.5, y0 + 1.2))
text(ex_x["med"] + 250, y0 + 1.2, "Median posterior", cex = 0.75, adj = c(1, 0.5))

# Legend Phase Parameters
legend(x = "bottomleft", inset = c(0.02, 0.02),
       legend = param_labels,
       fill   = adjustcolor(param_cols, 0.60),
       border = NA,
       bty    = "n",
       cex    = 0.95,
       title  = expression(bold("Phase parameter")))

dev.off()

# --- Part 6. Save comprehensive summary table (Table S3 in esm folder) ---
table_rows <- list()
for (reg in all_regions) {
  # 1. Full dates
  if (!is.null(full_list[[reg]])) {
    r_full <- data.frame(Region = reg, Dataset = "All dates (Charcoal outlier model)")
    for (p in param_names) {
      s <- qstats(full_list[[reg]], p)
      r_full[[paste0(p, "_median")]] <- round(s["med"])
      r_full[[paste0(p, "_lo95")]]   <- round(s["lo95"])
      r_full[[paste0(p, "_hi95")]]   <- round(s["hi95"])
    }
    r_full$Amodel <- full_list[[reg]]$Amodel
    table_rows[[length(table_rows) + 1]] <- r_full
  }

  # 2. Charcoal only
  if (!is.null(char_list[[reg]])) {
    r_char <- data.frame(Region = reg, Dataset = "Charcoal only")
    for (p in param_names) {
      s <- qstats(char_list[[reg]], p)
      r_char[[paste0(p, "_median")]] <- round(s["med"])
      r_char[[paste0(p, "_lo95")]]   <- round(s["lo95"])
      r_char[[paste0(p, "_hi95")]]   <- round(s["hi95"])
    }
    r_char$Amodel <- char_list[[reg]]$Amodel
    table_rows[[length(table_rows) + 1]] <- r_char
  }

  # 3. Bone dates
  if (!is.null(bone_list[[reg]])) {
    r_bone <- data.frame(Region = reg, Dataset = "Bone / teeth only")
    for (p in param_names) {
      s <- qstats(bone_list[[reg]], p)
      r_bone[[paste0(p, "_median")]] <- round(s["med"])
      r_bone[[paste0(p, "_lo95")]]   <- round(s["lo95"])
      r_bone[[paste0(p, "_hi95")]]   <- round(s["hi95"])
    }
    r_bone$Amodel <- bone_list[[reg]]$Amodel
    table_rows[[length(table_rows) + 1]] <- r_bone
  }
}

table_s3 <- do.call(rbind, table_rows)
write.csv(table_s3,
          file = here("esm", "Table_S3.csv"),
          row.names = FALSE)
