# Figure 4 - Sensitivity Curve Analysis ----
# Load libraries
library(sf)
library(sp)
library(raster)
library(rcarbon)
library(quantreg)
library(rnaturalearth)
library(rnaturalearthdata)
library(spatstat)
library(dplyr)
library(ggplot2)
library(here)

# Part 1. Data Preparation ----
# Read data
dates <- read.csv2(
  file = here("data", "C14dates_Iberia_raw.csv"),
  header = TRUE,
  sep = ";"
)
dates <- dates[dates$Excluded == "No", ]

# Calibrate dates ----
dates_cal <- calibrate(
  x = dates$C14,
  errors = dates$STD,
  normalised = TRUE,
  calCurves = "intcal20"
)
dates$medianBP <- summary(dates_cal)$MedianBP

# Create spatial window ----
spdf_spain <- ne_countries(country = "spain", scale = 10, returnclass = "sf")
spdf_portugal <- ne_countries(country = "portugal", scale = 10, returnclass = "sf")
iberia <- st_union(spdf_spain, spdf_portugal)
iberia <- st_cast(st_geometry(iberia), "POLYGON")
iberia <- iberia[st_coordinates(st_centroid(iberia))[, "X"] > -10]
iberia <- st_union(iberia[st_area(iberia) > units::set_units(50000000, "m^2")])
iberia <- st_transform(iberia, 25829)
andorra <- st_cast(
  st_geometry(ne_countries(country = "andorra", scale = 10, returnclass = "sf")),
  "POLYGON"
)
andorra <- st_transform(andorra, 25829)
iberia_andorra <- st_union(iberia, andorra)

# Convert to spatial points ----
dates <- st_as_sf(dates, coords = c(4, 5))
st_crs(dates) <- 25829
set.seed(123)
dates <- st_jitter(dates, 2)

# Separate charcoal dates ----
charcoaldates <- dates[grepl("charcoal|Charcoal", dates$Material,
  ignore.case = TRUE
), ]

# Calculate spatial density for charcoal areas ----
mysd <- 40000
cellres <- 1000
dates_ppp <- ppp(
  st_coordinates(dates)[, 1],
  st_coordinates(dates)[, 2],
  as.owin(iberia_andorra)
)
dates_dens <- density(dates_ppp, eps = cellres, sigma = mysd, edge = FALSE)
charcoaldates_ppp <- ppp(
  st_coordinates(charcoaldates)[, 1],
  st_coordinates(charcoaldates)[, 2],
  as.owin(iberia)
)
charcoaldates_dens <- density(charcoaldates_ppp,
  eps = cellres,
  sigma = mysd, edge = FALSE
)
cutoff <- 1e-10
dates_dens_na <- dates_dens
dates_dens_na[as.matrix(dates_dens) < cutoff] <- NA
charcoaldates_perc <- charcoaldates_dens / dates_dens_na * 100

# Identify high-charcoal zones (>=70%) ----
charcoal_perc_raster <- raster(charcoaldates_perc)
high_charcoal_mask <- charcoal_perc_raster >= 70
high_charcoal_mask[is.na(high_charcoal_mask)] <- FALSE
high_charcoal_coords <- rasterToPoints(high_charcoal_mask,
  fun = function(x) x == 1
)

# Transform to UTM 29N ----
window_utm <- st_transform(iberia_andorra, 32629)
high_charcoal_sf <- st_as_sf(as.data.frame(high_charcoal_coords[, 1:2]), 
                             coords = c("x", "y"), 
                             crs = 25829)
high_charcoal_sf <- st_transform(high_charcoal_sf, 32629)
high_charcoal_buffer <- st_buffer(st_union(high_charcoal_sf), dist = 1000)

# Match Figure 3 data and define NW targets ----
# Use the same bounding box as Figure 3 for consistency
bbox <- st_bbox(c(xmin = 388528.4, ymin = 3935709, xmax = 1570529.0, ymax = 4903406), 
                crs = 32629)
window_utm <- st_as_sfc(bbox)
# Filter dates within window of analysis
dates_utm <- st_transform(dates, 32629)
dates_in_window <- st_intersects(dates_utm, window_utm, sparse = FALSE)[, 1]
dates_utm <- dates_utm[dates_in_window, ]

# Identify dates for correction: Charcoal in the Northwest ----
# NW is defined as Easting < 750,000 (covers Portugal and Galicia)
is_charcoal_utm <- grepl("charcoal|Charcoal", dates_utm$Material, ignore.case = TRUE)
is_in_nw <- st_coordinates(dates_utm)[, 1] < 750000
is_target_date <- is_charcoal_utm & is_in_nw

# Create grid for the analysis ----
gridPts <- st_sample(window_utm, size = 1000, type = "regular")
gridPts <- st_sf(geometry = gridPts)
distMat_all <- st_distance(dates_utm, gridPts)

# Part 2: Sensitivity analysis loop -----
corrections <- seq(0, 1200, by = 100)
results <- data.frame(
  Correction = numeric(),
  MinAIC = numeric(),
  CenterX = numeric(),
  CenterY = numeric()
)

for (corr in corrections) {
  message(sprintf("Testing correction: -%d years...", corr))
  dates_temp <- dates_utm
  dates_temp$medianBP[is_target_date] <- dates_temp$medianBP[is_target_date] - corr
  AICs <- numeric(nrow(gridPts))
    for (i in seq_len(nrow(gridPts))) {
      # Using tau=0.9 with negative slope (origin constraint)
      m <- tryCatch(
        {
          mod <- rq(dates_temp$medianBP ~ distMat_all[, i], tau = 0.9)
          # We only accept the model if the slope is negative (age decreases with distance)
          if (coefficients(mod)[2] >= 0) {
            NULL
          } else {
            mod
          }
        },
        error = function(e) {
          return(NULL)
        }
      )
      if (!is.null(m)) {
        AICs[i] <- AIC(m)
      } else {
        AICs[i] <- NA
      }
    }
  # Find the best center
  min_idx <- which.min(AICs)
  best_aic <- AICs[min_idx]
  best_pt <- st_coordinates(gridPts)[min_idx, ]
  results <- rbind(results, data.frame(
    Correction = corr,
    MinAIC = best_aic,
    CenterX = best_pt[1],
    CenterY = best_pt[2]
  ))
}

# Part 3: Statistical analysis -----
# Define critical threshold (700000m = transition from NW to Central/E)
THRESHOLD_EASTING <- 700000

# Statistical definition of threshold:
# First correction value where CenterX exceeds the threshold
tipping_point_row <- results[results$CenterX > THRESHOLD_EASTING, ][1, ]
tipping_val <- ifelse(is.na(tipping_point_row$Correction), NA, tipping_point_row$Correction)
# Bootstrap confidence intervals for threshold (1000 iterations)
set.seed(456) # Different seed for bootstrap
n_boot <- 1000
tipping_boot <- numeric(n_boot)

# Calculate confidence intervals
for (b in seq_len(n_boot)) {
  # Resample dates with replacement
  boot_idx <- sample(seq_len(nrow(dates_utm)), replace = TRUE)
  dates_boot <- dates_utm[boot_idx, ]
  # Test at tipping_val only
  if (!is.na(tipping_val)) {
    # Test corrections around threshold point
    test_corrections <- seq(max(0, tipping_val - 200), tipping_val + 200, by = 50)
    boot_results <- data.frame(Correction = test_corrections, CenterX = NA)
    for (j in seq_along(test_corrections)) {
      corr <- test_corrections[j]
      dates_temp <- dates_boot
      dates_temp$medianBP[is_target_date[boot_idx]] <-
        dates_temp$medianBP[is_target_date[boot_idx]] - corr
      # Find best center (use a subset of grid)
      sample_grid <- sample(seq_len(nrow(gridPts)), 200)
      AICs <- numeric(length(sample_grid))

      for (k in seq_along(sample_grid)) {
        i <- sample_grid[k]
        m <- tryCatch(
          {
            mod <- rq(dates_temp$medianBP ~ distMat_all[boot_idx, i], tau = 0.9)
            if (coefficients(mod)[2] >= 0) NULL else mod
          },
          error = function(e) NULL
        )
        AICs[k] <- if (!is.null(m)) AIC(m) else NA
      }

      best_idx <- sample_grid[which.min(AICs)]
      boot_results$CenterX[j] <- st_coordinates(gridPts)[best_idx, 1]
    }

    # Find critical threshold in bootstrap
    boot_tip <- boot_results[boot_results$CenterX > THRESHOLD_EASTING, ][1, ]
    tipping_boot[b] <- ifelse(is.na(boot_tip$Correction), NA, boot_tip$Correction)
  }

  if (b %% 100 == 0) message(sprintf("Bootstrap iteration %d/%d", b, n_boot))
}

# Calculate confidence interval
tipping_boot_clean <- tipping_boot[!is.na(tipping_boot)]
if (length(tipping_boot_clean) > 10) {
  tipping_ci <- quantile(tipping_boot_clean, c(0.025, 0.975))
  message(sprintf(
    "\nCritical threshold: %d years (95%% CI: %d-%d years)\n",
    tipping_val, round(tipping_ci[1]), round(tipping_ci[2])
  ))
} else {
  tipping_ci <- c(NA, NA)
  message("\nWarning: Bootstrap failed to converge. Using point estimate only.\n")
}

# Critical threshold statistics
tipping_stats <- data.frame(
  TippingPoint = tipping_val,
  CI_Lower = tipping_ci[1],
  CI_Upper = tipping_ci[2],
  Threshold_Easting = THRESHOLD_EASTING,
  Method = "Bootstrap (n=1000)"
)

# Part 4: Visualization -----
p1 <- ggplot(results, aes(x = Correction, y = CenterX)) +
  annotate("rect",
    xmin = 0, xmax = 100, ymin = -Inf, ymax = Inf,
    fill = "green", alpha = 0.1
  ) +
  annotate("rect",
    xmin = 300, xmax = 1000, ymin = -Inf, ymax = Inf,
    fill = "red", alpha = 0.1
  ) +
  ## Main curve
  geom_line(linewidth = 1.5, color = "#2c3e50") +
  geom_point(size = 3, color = "#2c3e50") +
  ## Threshold line
  geom_hline(
    yintercept = THRESHOLD_EASTING,
    linetype = "dotted", color = "gray40", linewidth = 0.8
  ) +
  annotate("text",
    x = 1100, y = THRESHOLD_EASTING + 15000,
    label = "NW/E Threshold",
    color = "gray40", size = 3, hjust = 1
  ) +
  ## Species Labels
  annotate("text",
    x = 50, y = max(results$CenterX), label = "Short-Lived\n(Corylus/Betula)",
    color = "darkgreen", fontface = "italic", hjust = 0.5, vjust = 1
  ) +
  annotate("text",
    x = 650, y = max(results$CenterX), label = "Old Wood Effect Range\n(Quercus sp.)",
    color = "darkred", fontface = "italic", hjust = 0.5, vjust = 1
  ) +
  # Critical threshold with confidence interval
  {
    if (!is.na(tipping_val)) {
      list(
        geom_vline(
          xintercept = tipping_val, linetype = "dashed",
          color = "red", linewidth = 1
        ),
        if (!is.na(tipping_ci[1])) {
          annotate("rect",
            xmin = tipping_ci[1], xmax = tipping_ci[2],
            ymin = -Inf, ymax = Inf,
            fill = "red", alpha = 0.05
          )
        },
        annotate("text",
          x = tipping_val + 20, y = min(results$CenterX),
          label = sprintf(
            "Critical threshold\n%d y (95%% CI: %d-%d)",
            tipping_val, round(tipping_ci[1]), round(tipping_ci[2])
          ),
          color = "red", angle = 90, hjust = 0, vjust = -0.2, size = 3.5
        )
      )
    }
  } +
  scale_y_continuous(labels = scales::comma) +
  scale_x_continuous(breaks = seq(0, 1200, 200)) +
  theme_minimal() +
  theme(
    plot.title = element_text(face = "bold", size = 14),
    plot.subtitle = element_text(size = 11, color = "gray30"),
    axis.title = element_text(face = "bold")
  ) +
  labs(
    title = "",
    subtitle = "Model shift from Northwest (Low X) to East (High X) relative to tree lifespans",
    x = "Magnitude of Correction (Years)",
    y = "Easting (UTM 29N) of Optimal Center"
  )

ggsave(here("figures", "Figure 4.png"), p1, width = 10, height = 7, dpi = 300)

# Session information for reproducibility
si <- sessionInfo()
# print(si)
