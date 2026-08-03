# Figure 6. Bone/teeth only versus full dataset trapezoidal model comparison
library(here)
library(oxcAAR)
library(rcarbon)

# Define colour palette (same as figure 5)
param_cols <- c(
  onset     = "#2166ac",
  peak      = "#1a9641",
  decline   = "#d7191c",
  disappear = "#7b2d8b"
)
param_names  <- c("onset", "peak", "decline", "disappear")
param_labels <- c("Onset", "Peak", "Decline", "Disappear")
param_offsets <- c(onset = 0.3, peak = 0.1, decline = -0.1, disappear = -0.3)

regions_bone <- c("East", "Tagus basins", "South", "Ebro basin")

# --- Generate bone-teeth only models ---
oxcal_path <- here("OxCal", "bin", "OxCalWin.exe")
setOxcalExecutablePath(oxcal_path)

source(here("src", "oxcalScriptCreator.R"))
source(here("src", "oxcalParsing.R"))
source(here("src", "oxcalWorkflow.R"))

dir.create(here("oxcalresults", "bone_only"), showWarnings = FALSE, recursive = TRUE)
dir.create(here("oxcalscripts", "bone_only"), showWarnings = FALSE, recursive = TRUE)

dates <- read.csv(here("data", "C14dates_Iberia_raw.csv"), sep = ";", na = "n/a")
dates <- dates[dates$Excluded == "No", ]

# Filter for bone and teeth only
bone_materials <- c("Human bone", "Animal bone", "Human teeth", "Bone", "Tooth")
dates <- dates[dates$Material %in% bone_materials, ]

# Calibrate all dates to filter by median calibrated age
dates_cal <- calibrate(x = dates$C14, errors = dates$STD, calCurves = "intcal20")
dates$MedianBCE <- summary(dates_cal)$MedianBP - 1950

# Exclude dates outside the 6000 BCE to 2500 BCE range (Neolithic, Chalcolithic to Bronze Age period)
dates <- dates[dates$MedianBCE >= 2500 & dates$MedianBCE <= 6000, ]

earliest <- do.call(rbind, lapply(split(dates, dates$Site), function(d) d[which.max(d$C14), , drop = FALSE]))
rownames(earliest) <- NULL
earliest$LabNumber <- make.unique(as.character(earliest$LabNumber))

# Run trapezoidal model for bone/teeth only dataset (cached if exists)
run_regional_trapezoid(
  region_names   = regions_bone,
  dates_earliest = earliest,
  oxcal_path     = oxcal_path,
  scripts_dir    = here("oxcalscripts", "bone_only"),
  results_dir    = here("oxcalresults", "bone_only"),
  nsim           = 100000,
  n_cores        = 20)

to_bce <- function(v) -v

# Load posteriors
full_list <- list()
bone_list <- list()
for (reg in regions_bone) {
  fname  <- paste0("trapezoid_regional_", gsub(" ", "_", reg), ".rds")
  fp_f   <- here("oxcalresults",              fname)
  fp_b   <- here("oxcalresults", "bone_only", fname)
  if (file.exists(fp_f)) full_list[[reg]] <- readRDS(fp_f)
  if (file.exists(fp_b)) bone_list[[reg]] <- readRDS(fp_b)
}

# Quantile summary
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
onset_med <- sapply(regions_bone, function(r) {
  if (is.null(full_list[[r]])) return(NA)
  median(to_bce(full_list[[r]][["onset"]]), na.rm = TRUE)
})
regions_ord <- regions_bone[order(onset_med, decreasing = TRUE)]
nreg <- length(regions_ord)

# Use the same layout as Crema's et al. 2022, Figure 3B
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
h_bar  <- 0.2         
xlim_p <- c(6000, 2500)  # reversed: older dates on the left
at_maj <- seq(6000, 2500, by = -500)
at_min <- seq(6000, 2500, by = -250)

y_full_of <- function(ri) (nreg - ri + 1) * 3        # upper bar
y_bone_of <- function(ri) (nreg - ri + 1) * 3 - 1    # lower bar
ylim_p    <- c(-2.5, nreg * 3 + 2.0)

# Plot figure 6 and save it to figures folder
png(file = here("figures", "Figure 6.png"),
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
abline(h = seq(4, by = 3, length.out = nreg - 1),
       col = "darkgrey", lty = 2, lwd = 1.0)

# X axes
axis(1, at = at_maj, labels = at_maj, tck = -0.015, padj = -0.2)
axis(3, at = at_maj, labels = at_maj, tck = -0.015, padj =  0.2)
mtext("BCE", side = 1, line = 2.2, cex = 1.1)
mtext("BCE", side = 3, line = 1.8, cex = 1.1)

# Draw bars
for (ri in seq_along(regions_ord)) {
  reg    <- regions_ord[ri]
  y_full <- y_full_of(ri)
  y_bone <- y_bone_of(ri)

  for (p in param_names) {
    col <- param_cols[p]
    p_off <- param_offsets[p]
    # Full dataset
    if (!is.null(full_list[[reg]])) {
      s <- qstats(full_list[[reg]], p)
      if (all(is.finite(s))) post.bar(s, y_full + p_off, h_bar, col)
    }
    # Bone only
    if (!is.null(bone_list[[reg]])) {
      s <- qstats(bone_list[[reg]], p)
      if (all(is.finite(s))) post.bar(s, y_bone + p_off, h_bar, col)
    }
  }

  # Region labels
  y_mid <- (y_full + y_bone) / 2
  mtext(reg, side = 2, at = y_mid, las = 2, line = 1.5, cex = 1.1, font = 2)
}

box(bty = "o", lwd = 1.2)

# Place legend at bottom left
ri_bottom <- nreg
text(5900, y_full_of(ri_bottom), "All dates", cex = 1.0, adj = 0)
text(5900, y_bone_of(ri_bottom), "Bone / teeth", cex = 1.0, adj = 0)
y0 <- -1.0
ex_x <- c(lo95=4800, lo50=4500, med=4200, hi50=3800, hi95=3300)
post.bar(ex_x, y0, 0.7, "grey60")

# Brackets
arrows(x0=ex_x["lo95"], x1=ex_x["hi95"], y0=y0 - 0.7, y1=y0 - 0.7, angle = 90, code = 3, length = 0.03, lwd = 1.2)
arrows(x0=ex_x["lo50"], x1=ex_x["hi50"], y0=y0 - 1.2, y1=y0 - 1.2, angle = 90, code = 3, length = 0.03, lwd = 1.2)

text(ex_x["lo95"] + 100, y0 - 0.7, "95% HPDI", cex = 0.75, adj = c(1, 0.5), bg = "white")
text(ex_x["lo50"] + 100, y0 - 1.2, "50% HPDI", cex = 0.75, adj = c(1, 0.5), bg = "white")

# Median line pointer
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

# Save summary table of posterior medians and 95% intervals (Table S3 in esm folder)
table_rows <- list()
for (reg in regions_bone) {
  # Full dates
  if (!is.null(full_list[[reg]])) {
    r_full <- data.frame(Region = reg, Dataset = "All dates")
    for (p in param_names) {
      s <- qstats(full_list[[reg]], p)
      r_full[[paste0(p, "_median")]] <- round(s["med"])
      r_full[[paste0(p, "_lo95")]]   <- round(s["lo95"])
      r_full[[paste0(p, "_hi95")]]   <- round(s["hi95"])
    }
    r_full$Amodel <- full_list[[reg]]$Amodel
    table_rows[[length(table_rows) + 1]] <- r_full
  }
  
  # Bone dates
  if (!is.null(bone_list[[reg]])) {
    r_bone <- data.frame(Region = reg, Dataset = "Bone / teeth")
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
