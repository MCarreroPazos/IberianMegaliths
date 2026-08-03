# Figure 5. Trapezoidal model of Iberian megalith activity by region ----

# Load R packages ----
needed_packages <- c("oxcAAR", "here", "rcarbon")
install.packages(setdiff(needed_packages, rownames(installed.packages())),
                 repos = "https://cloud.r-project.org")
library(oxcAAR)
library(here)
library(rcarbon)

# Set OxCal path ----
oxcal_path <- here("OxCal", "bin", "OxCalWin.exe")
setOxcalExecutablePath(oxcal_path)

# Load custom functions ----
source(here("src", "oxcalScriptCreator.R"))
source(here("src", "oxcalParsing.R"))
source(here("src", "oxcalWorkflow.R"))

# Set output directories
dir.create(here("oxcalscripts"), showWarnings = FALSE)
dir.create(here("oxcalresults"), showWarnings = FALSE)
dir.create(here("figures"), showWarnings = FALSE)

# Set global parameters for the models
nsim <- 100000
region_names <- c("North", "East", "South", "Ebro basin", "Tagus basins", "Duero basins")

# Part 1. Load raw data and select the earliest date per site ----
dates   <- read.csv(here("data", "C14dates_Iberia_raw.csv"), sep = ";", na = "n/a")
dates   <- dates[dates$Excluded == "No", ]

# Calibrate all dates to filter by median calibrated age
dates_cal_all <- calibrate(
  x = dates$C14,
  errors = dates$STD,
  calCurves = "intcal20")
# Median calibrated age expressed as calendar BCE years
dates$MedianBCE <- summary(dates_cal_all)$MedianBP - 1950

# Exclude dates outside the 6000 BCE to 2500 BCE range (Neolithic, Chalcolitc to Bronze Age period)
dates <- dates[dates$MedianBCE >= 2500 & dates$MedianBCE <= 6000, ]

earliest <- do.call(rbind, lapply(split(dates, dates$Site), function(d)
  d[which.max(d$C14), , drop = FALSE]))
rownames(earliest) <- NULL
earliest$LabNumber <- make.unique(as.character(earliest$LabNumber))

# Part 2. Run one OxCal trapezoidal model per region ----
posteriors_list <- run_regional_trapezoid(
  region_names   = region_names,
  dates_earliest = earliest,
  oxcal_path     = oxcal_path,
  scripts_dir    = here("oxcalscripts"),
  results_dir    = here("oxcalresults"),
  nsim           = nsim,
  n_cores        = 20)   # Threadripper PRO 7965WX: 20 dedicated physical cores


# Convert to BCE and scale the results
to_bce <- function(v) -v # OxCal BC/AD to BCE
reScale <- function(x) # normalise to [0, 1]
  (x - min(x, na.rm = TRUE)) / (max(x, na.rm = TRUE) - min(x, na.rm = TRUE))

# Define a colour palette and graph labels
param_names <- c("onset", "peak", "decline", "disappear")

param_cols <- c(onset = "#2166ac", # first megalithic activity
                peak = "#1a9641", # peak use density
                decline = "#d7191c", # start of decline
                disappear = "#7b2d8b") # end of megalithic activity

param_labels <- c(onset = "Onset",
                  peak = "Peak density",
                  decline = "Decline",
                  disappear = "Disappear")

# Phase band height as fraction of the inter-region spacing (< 1 = no overlap)
phase_band_h <- 0.80

# Sort regions by median onset: earliest BCE at top, latest at bottom
onset_medians <- sapply(region_names, function(n) {
  vals <- to_bce(posteriors_list[[n]][["onset"]])
  median(vals[is.finite(vals)], na.rm = TRUE)
})
region_names <- region_names[order(onset_medians, decreasing = TRUE)]

# Pre-compute densities for each region and parameter
nreg     <- length(region_names)
dens_all <- vector("list", nreg)
names(dens_all) <- region_names

for (n in region_names) {
  bce <- lapply(posteriors_list[[n]], to_bce)
  dens_all[[n]] <- lapply(bce[param_names], function(v) {
    v <- v[is.finite(v)]
    density(v, adjust = 1.5, n = 1024)
  })
}

# Set the limits of the x axis
xlim_global <- c(2500, 6000)
at_major <- seq(6000, 2500, by = -500)
at_minor <- seq(6000, 2500, by = -100)

# Part 3. Make the plot (Figure 5) ----
png(file = here("figures", "Figure 5.png"),
    width = 2000, height = 1300, res = 130)
par(mar = c(5.5, 9, 5.5, 4),
    mgp = c(3, 1.4, 0),
    cex.axis = 1.15,
    cex.lab = 1.20,
    cex.main = 1.40)
plot(0, 0,
     xlim = rev(xlim_global),
     ylim = c(0.5, nreg + phase_band_h + 1.4),
     type = "n",
     xlab = "", ylab = "",
     axes = FALSE,
     main = "")

# X axis (bottom)
axis(1, at = at_major, labels = at_major, tck = -0.025, padj = -0.4)
axis(1, at = at_minor, labels = NA,       tck = -0.012)
mtext("BCE", side = 1, line = 3.2, cex = 1.2)

# X axis (top)
axis(3, at = at_major, labels = at_major, tck = -0.025, padj =  0.4)
axis(3, at = at_minor, labels = NA,       tck = -0.012)
mtext("BCE", side = 3, line = 3.2, cex = 1.2)

# Add Vertical lines connecting X axes
abline(v = seq(6000, 2500, by = -1000), col = adjustcolor("grey40", alpha.f = 0.3), lty = 3, lwd = 1.2)
abline(v = seq(6000, 2500, by = -500),  col = adjustcolor("grey60", alpha.f = 0.2), lty = 3, lwd = 0.6)

# Density of phases across regions
for (i in seq_along(region_names)) {
  n <- region_names[i]
  k <- nreg + 1 - i # reverse so region_names[1] is on top

  # Baseline for phase bands
  abline(h = k, col = "grey80", lty = 1, lwd = 0.7)
  region_dates <- earliest[earliest$Region == n, ]
  points(
    region_dates$MedianBCE,
    rep(k + 0.02, nrow(region_dates)),
    pch = 124,
    col = "black",
    cex = 0.65,
    lwd = 2,
    xpd = FALSE
  )
    
  for (p in param_names) {
    d <- dens_all[[n]][[p]]
    y_norm <- reScale(d$y) # normalise to [0, 1]
    y_top <- y_norm * phase_band_h + k # offset to phase band position
    y_base <- rep(k, length(d$y))

    # Fill the area under the curve
    polygon(c(d$x, rev(d$x)), c(y_top, y_base),
            col = adjustcolor(param_cols[p], alpha.f = 0.30),
            border = NA)
    # Create the density outline
    lines(d$x, y_top, col = param_cols[p], lwd = 2.0)

    # Add a median dot on the curve
    bce_vals <- to_bce(posteriors_list[[n]][[p]])
    med <- median(bce_vals[is.finite(bce_vals)], na.rm = TRUE)
    med_y <- approx(d$x, y_top, xout = med)$y
    points(med, med_y,
           pch = 21, bg = param_cols[p], col = "white",
           cex = 1.3, lwd = 1.6)
  }

  # Add the region labels on the left y axis
  mtext(n, side = 2, at = k, las = 2,
        line = 0.4, cex = 1.05, font = 2)
}

# Part 4. Add legend and schematic trapezoid ----

# 1. Create legend
leg_info <- legend(x = "topleft", inset = c(0.01, 0.01), 
                   legend = param_labels,
                   col = param_cols,
                   lwd = 2.2, lty = 1,
                   pch = 21, pt.bg = param_cols, pt.cex = 1.3,
                   bty = "n", cex = 0.95)

# 2. Add the schematic trapezoid
# Calculate the shift needed to place the trapezoid just right of the legend
margin_bce <- 50
box_xleft <- leg_info$rect$left + leg_info$rect$w - margin_bce
shift_x <- box_xleft - 3850

# Place trapezoid at the same vertical level as the legend (centered within its box)
leg_mid    <- leg_info$rect$top - leg_info$rect$h / 2
sch_x      <- c(3600, 3450, 3150, 2750) + shift_x
sch_y_low  <- leg_mid - 0.30
sch_y_high <- leg_mid + 0.30


# Draw the trapezoid outline
lines(x = c(sch_x[1], sch_x[2], sch_x[3], sch_x[4], sch_x[1]), 
      y = c(sch_y_low, sch_y_high, sch_y_high, sch_y_low, sch_y_low), 
      col = "grey40", lwd = 1.2)

# Add the parameter dots
points(sch_x, c(sch_y_low, sch_y_high, sch_y_high, sch_y_low), 
       pch = 21, bg = param_cols, col = "white", cex = 1.4, lwd = 1.5)

# Labels with same cex as standard legend (0.95)
text(sch_x[1], sch_y_low - 0.12, "Onset",     cex = 0.95, font = 3, adj = c(0.5, 1))
text(sch_x[2], sch_y_high + 0.12, "Peak",      cex = 0.95, font = 3, adj = c(0.5, 0))
text(sch_x[3], sch_y_high + 0.12, "Decline",   cex = 0.95, font = 3, adj = c(0.5, 0))
text(sch_x[4], sch_y_low - 0.12, "Disappear", cex = 0.95, font = 3, adj = c(0.5, 1))

box(bty = "o")
dev.off()

# Part 5. Save the summary table of posterior medians and 95% intervals ----
summary_table <- do.call(rbind, lapply(region_names, function(n) {
  row <- data.frame(Region = n)
  for (p in param_names) {
    vals <- to_bce(posteriors_list[[n]][[p]])
    vals <- vals[is.finite(vals)]
    row[[paste0(p, "_median")]] <- round(median(vals, na.rm = TRUE))
    row[[paste0(p, "_lo95")]] <- round(quantile(vals, 0.025, na.rm = TRUE))
    row[[paste0(p, "_hi95")]] <- round(quantile(vals, 0.975, na.rm = TRUE))
  }
  row$Amodel <- posteriors_list[[n]]$Amodel #includes the agreement index
  row
}))

write.csv(summary_table,
          file = here("esm", "Table_S2.csv"),
          row.names = FALSE)

# Session information for reproducibility
si <- sessionInfo()
print(si)
