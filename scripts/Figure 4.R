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
library(parallel)

# Part 1. Data Preparation ----
# Read data
dates <- read.csv2(
  file = here("data", "C14dates_Iberia_raw.csv"),
  header = TRUE,
  sep = ";")

dates <- dates[dates$Excluded == "No", ]

# Calibrate dates ----
dates_cal <- calibrate(
  x = dates$C14,
  errors = dates$STD,
  normalised = TRUE,
  calCurves = "intcal20")

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
  "POLYGON")

andorra <- st_transform(andorra, 25829)
iberia_andorra <- st_union(iberia, andorra)

# Convert to spatial points ----
dates <- st_as_sf(dates, coords = c(4, 5))
st_crs(dates) <- 25829
set.seed(123)
dates <- st_jitter(dates, 2)

# Separate charcoal dates ----
charcoaldates <- dates[grepl("charcoal|Charcoal", dates$Material,
                             ignore.case = TRUE), ]

# Calculate spatial density for charcoal areas ----
mysd <- 40000
cellres <- 1000
dates_ppp <- ppp(
  st_coordinates(dates)[, 1],
  st_coordinates(dates)[, 2],
  as.owin(iberia_andorra))

dates_dens <- density(dates_ppp, eps = cellres, sigma = mysd, edge = FALSE)
charcoaldates_ppp <- ppp(
  st_coordinates(charcoaldates)[, 1],
  st_coordinates(charcoaldates)[, 2],
  as.owin(iberia))

charcoaldates_dens <- density(charcoaldates_ppp,
                              eps = cellres,
                              sigma = mysd, edge = FALSE)

cutoff <- 1e-10
dates_dens_na <- dates_dens
dates_dens_na[as.matrix(dates_dens) < cutoff] <- NA
charcoaldates_perc <- charcoaldates_dens / dates_dens_na * 100

# Identify areas of high charcoal (>=70%) ----
charcoal_perc_raster <- raster(charcoaldates_perc)
high_charcoal_mask <- charcoal_perc_raster >= 70
high_charcoal_mask[is.na(high_charcoal_mask)] <- FALSE
high_charcoal_coords <- rasterToPoints(high_charcoal_mask,
                                       fun = function(x) x == 1)

# Transform to UTM 29N ----
window_utm <- st_transform(iberia_andorra, 32629)
high_charcoal_sf <- st_as_sf(as.data.frame(high_charcoal_coords[, 1:2]), 
                             coords = c("x", "y"), 
                             crs = 25829)

high_charcoal_sf <- st_transform(high_charcoal_sf, 32629)
high_charcoal_buffer <- st_buffer(st_union(high_charcoal_sf), dist = 1000)

# Match Figure 3 data and define NW ----
# Use the same bounding box as Figure 3 for consistency
bbox <- st_bbox(c(xmin = 388528.4, ymin = 3935709, xmax = 1570529.0, ymax = 4903406), 
                crs = 32629)
window_utm <- st_as_sfc(bbox)

# Filter dates within window of analysis
dates_utm <- st_transform(dates, 32629)
dates_in_window <- st_intersects(dates_utm, window_utm, sparse = FALSE)[, 1]
dates_utm <- dates_utm[dates_in_window, ]

# Identify NW dates for correction ----
# NW is defined as the Easting < 750,000 (covering Portugal and Galicia)
is_charcoal_utm <- grepl("charcoal|Charcoal", dates_utm$Material, ignore.case = TRUE)
is_in_nw <- st_coordinates(dates_utm)[, 1] < 750000
is_target_date <- is_charcoal_utm & is_in_nw

# Create grid for the analysis ----
gridPts <- st_sample(window_utm, size = 1000, type = "regular")
gridPts <- st_sf(geometry = gridPts)
distMat_all <- st_distance(dates_utm, gridPts)

# Part 2. Monte Carlo Sensitivity analysis with Calibrated Distribution Sampling ----
n_sim           <- 500       # Number of Monte Carlo draws per correction level
n_cores         <- 20        # This was run on a Workstation Threadripper PRO 7965WX
force_recompute <- FALSE     # If this is set to TRUE, it will recalculate. If FALSE, it loads saved .rds present in /simresults folder

# Save results
cache_dir  <- here("simresults")
dir.create(cache_dir, showWarnings = FALSE)
cache_file <- file.path(cache_dir, sprintf("figure4_mc_sim_N%d.rds", n_sim))

if (!force_recompute && file.exists(cache_file)) {
  all_sim_df <- readRDS(cache_file)
} else {
  dates_cal_utm <- calibrate(
    x = dates_utm$C14,
    errors = dates_utm$STD,
    normalised = TRUE,
    calCurves = "intcal20")
  
  set.seed(456)
  # Matrix of dimension: n_sim x nrow(dates_utm)
  cal_samples <- sampleDates(dates_cal_utm, nsim = n_sim, verbose = FALSE)$sdates
  
  corrections <- seq(0, 1200, by = 100)

  
  # Set up cluster for parallel calcuation
  cl <- makePSOCKcluster(min(n_cores, length(corrections)))
  
  # Worker function to evaluate all n_sim iterations for a single correction level
  eval_corr_worker <- function(corr, cal_samples, is_target_date, distMat_all, gridPts, n_sim) {
    iter_results <- data.frame(
      Correction = rep(corr, n_sim),
      Iteration  = seq_len(n_sim),
      CenterX    = numeric(n_sim),
      CenterY    = numeric(n_sim),
      MinAIC     = numeric(n_sim))
    
    for (b in seq_len(n_sim)) {
      sampled_bp <- cal_samples[b, ]
      # Subtract correction from NW charcoal dates in calendar dates (BP)
      sampled_bp[is_target_date] <- sampled_bp[is_target_date] - corr
      
      AICs <- numeric(nrow(gridPts))
      for (i in seq_len(nrow(gridPts))) {
        m <- tryCatch({
          mod <- quantreg::rq(sampled_bp ~ distMat_all[, i], tau = 0.9)
          if (coefficients(mod)[2] >= 0) NULL else mod
        }, error = function(e) NULL)
        AICs[i] <- if (!is.null(m)) AIC(m) else NA
      }
      
      min_idx <- which.min(AICs)
      best_pt <- sf::st_coordinates(gridPts)[min_idx, ]
      iter_results$CenterX[b] <- best_pt[1]
      iter_results$CenterY[b] <- best_pt[2]
      iter_results$MinAIC[b]  <- AICs[min_idx]
    }
    return(iter_results)
  }
  
  # Export required variables to cluster
  clusterExport(cl,
                c("cal_samples", "is_target_date", "distMat_all", "gridPts", "n_sim", "eval_corr_worker"),
                envir = environment())
  
  all_sim_list <- parLapply(cl, corrections, function(corr) {
    eval_corr_worker(corr, cal_samples, is_target_date, distMat_all, gridPts, n_sim)
  })
  stopCluster(cl)
  
  all_sim_df <- do.call(rbind, all_sim_list)
  saveRDS(all_sim_df, cache_file)
}

# Part 3. Statistical analysis and uncertainty envelope ----
THRESHOLD_EASTING <- 700000

# Summarize Monte Carlo envelope per correction step
envelope_df <- all_sim_df %>%
  group_by(Correction) %>%
  summarize(
    CenterX_med  = median(CenterX, na.rm = TRUE),
    CenterX_lo50 = quantile(CenterX, 0.25, na.rm = TRUE),
    CenterX_hi50 = quantile(CenterX, 0.75, na.rm = TRUE),
    CenterX_lo95 = quantile(CenterX, 0.025, na.rm = TRUE),
    CenterX_hi95 = quantile(CenterX, 0.975, na.rm = TRUE),
    Prob_NW      = mean(CenterX <= THRESHOLD_EASTING, na.rm = TRUE),
    .groups = "drop")

# Critical threshold: where median center X crosses the threshold
tipping_row <- envelope_df %>% filter(CenterX_med > THRESHOLD_EASTING) %>% slice(1)
tipping_val <- if (nrow(tipping_row) > 0) tipping_row$Correction else NA

# Range where 95% envelope crosses the threshold
crossing_rows_lo <- envelope_df %>% filter(CenterX_hi95 > THRESHOLD_EASTING) %>% slice(1)
crossing_rows_hi <- envelope_df %>% filter(CenterX_lo95 > THRESHOLD_EASTING) %>% slice(1)
tipping_lo <- if (nrow(crossing_rows_lo) > 0) crossing_rows_lo$Correction else NA
tipping_hi <- if (nrow(crossing_rows_hi) > 0) crossing_rows_hi$Correction else NA

# Part 4. Visualization (Figure 4) ----
p1 <- ggplot(envelope_df, aes(x = Correction)) +
  # Tree longevity areas
  annotate("rect",
           xmin = 0, xmax = 100, ymin = -Inf, ymax = Inf,
           fill = "green", alpha = 0.1) +
  annotate("rect",
           xmin = 100, xmax = 1200, ymin = -Inf, ymax = Inf,
           fill = "red", alpha = 0.1) +
  # Threshold line
  geom_hline(
    yintercept = THRESHOLD_EASTING,
    linetype = "dotted", color = "gray40", linewidth = 0.8) +
  annotate("text",
           x = 1100, y = THRESHOLD_EASTING + 15000,
           label = "NW/E Threshold",
           color = "gray40", size = 3, hjust = 1) +
  # 95% Monte Carlo uncertainty envelope
  geom_ribbon(aes(ymin = CenterX_lo95, ymax = CenterX_hi95),
              fill = "#2c3e50", alpha = 0.15) +
  # 50% Monte Carlo uncertainty envelope
  geom_ribbon(aes(ymin = CenterX_lo50, ymax = CenterX_hi50),
              fill = "#2c3e50", alpha = 0.25) +
  # Median curve and points
  geom_line(aes(y = CenterX_med), linewidth = 1.4, color = "#2c3e50") +
  geom_point(aes(y = CenterX_med), size = 3, color = "#2c3e50") +
  # Species Labels
  annotate("text",
           x = 50, y = max(envelope_df$CenterX_hi95, na.rm = TRUE), label = "Short-Lived\n(Corylus/Betula)",
           color = "darkgreen", fontface = "italic", hjust = 0.5, vjust = 1) +
  annotate("text",
           x = 550, y = max(envelope_df$CenterX_hi95, na.rm = TRUE), label = "Old Wood Effect Range\n(Quercus sp.)",
           color = "darkred", fontface = "italic", hjust = 0.5, vjust = 1) +
  # Critical threshold line and annotation
  {
    if (!is.na(tipping_val)) {
      list(
        geom_vline(xintercept = tipping_val, linetype = "dashed", color = "red", linewidth = 1),
        annotate("text",
                 x = tipping_val + 20, y = min(envelope_df$CenterX_lo95, na.rm = TRUE),
                 label = sprintf("Critical threshold (median): ~%d y", tipping_val),
                 color = "red", angle = 90, hjust = 0, vjust = -0.2, size = 3.5))
    }
  } +
  scale_y_continuous(labels = scales::comma) +
  scale_x_continuous(breaks = seq(0, 1200, 200)) +
  theme_minimal() +
  theme(
    plot.title    = element_text(face = "bold", size = 14),
    plot.subtitle = element_text(size = 11, color = "gray30"),
    axis.title    = element_text(face = "bold")) +
  labs(
    title = "",
    subtitle = "",
    x = "Magnitude of Correction (Years)",
    y = "Easting (UTM 29N) of Optimal Center")

ggsave(here("figures", "Figure 4.png"), p1, width = 10, height = 7, dpi = 300)

# Session information for reproducibility
si <- sessionInfo()
