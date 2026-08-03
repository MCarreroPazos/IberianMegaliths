# ESM Table S1: Model comparison ----
library(sf)
library(quantreg)
library(dplyr)
library(here)
library(rnaturalearth)
library(rcarbon)

# Part 1: Load and Prepare Data ----
dates <- read.csv2(here("data", "C14dates_Iberia_raw.csv"), na.strings = "n/a", check.names = FALSE)
dates <- dates[dates$Excluded == "No", ]

dates$Eastings_X <- as.numeric(as.character(dates[["Eastings_X"]]))
dates$Northings_Y <- as.numeric(as.character(dates[["Northings_Y"]]))
dates$C14 <- as.numeric(as.character(dates[["C14"]]))
dates$STD <- as.numeric(as.character(dates[["STD"]]))

dates <- dates[!is.na(dates$Eastings_X) & !is.na(dates$Northings_Y) & !is.na(dates$C14), ]

# Calibrate
dates_cal <- calibrate(x = dates$C14, errors = dates$STD, normalised = TRUE, calCurves = "intcal20")
dates$medianBP <- as.numeric(summary(dates_cal)$MedianBP)

# Define Spatial Scenarios ----
is_charcoal <- grepl("charcoal", dates$Material, ignore.case = TRUE)
is_nw <- dates$Eastings_X < 750000
is_target <- is_charcoal & is_nw

dates$BP_raw <- dates$medianBP
dates$BP_corr <- dates$medianBP
dates$BP_corr[is_target] <- dates$medianBP[is_target] - 500
dates_bone <- dates[grepl("bone|human|tooth|teeth", dates$Material, ignore.case = TRUE), ]

# Part 2: Geographic Context ----
iberia <- ne_countries(country = c("spain", "portugal"), returnclass = "sf", scale = 10)
iberia <- st_union(st_transform(iberia, 25829))

# Part 3: Fixed Origin Points ----
pt_sw <- st_sfc(st_point(c(-8.18245, 37.25054)), crs = 4326) %>% st_transform(25829)
pt_ch <- st_sfc(st_point(c(-6.21189, 36.44627)), crs = 4326) %>% st_transform(25829)
pt_ne <- st_sfc(st_point(c(2.516088, 42.031588)), crs = 4326) %>% st_transform(25829)

fixed_points <- list(
  Southwest = st_coordinates(pt_sw),
  Campo_Hockey = st_coordinates(pt_ch),
  Northeast = st_coordinates(pt_ne)
)

# Part 4: Evaluation Loop ----
scenarios <- list(
  Raw = list(data = dates, bp = "BP_raw", constrained = FALSE),
  Corrected_500y = list(data = dates, bp = "BP_corr", constrained = FALSE),
  Bone_Only = list(data = dates_bone, bp = "medianBP", constrained = TRUE)
)

results_master <- data.frame()

for (scen_name in names(scenarios)) {
  message(sprintf("Processing Scenario: %s", scen_name))
  scen_conf <- scenarios[[scen_name]]
  d <- scen_conf$data
  bp_vec <- d[[scen_conf$bp]]
  coords_d <- as.matrix(d[, c("Eastings_X", "Northings_Y")])
  
  # Define Search Area
  if (scen_conf$constrained) {
    # Constrain search area only for Bone Only scenario
    d_sf <- st_as_sf(d, coords = c("Eastings_X", "Northings_Y"), crs = 25829)
    d_buffer <- st_union(st_buffer(d_sf, 100000))
    search_area <- st_intersection(iberia, d_buffer)
  } else {
    search_area <- iberia
  }
  
  grid_pts <- st_sample(search_area, size = 1000, type = "regular")
  grid_coords <- st_coordinates(grid_pts)
  
  # Data-driven Search
  aics_grid <- numeric(nrow(grid_coords))
  for (i in 1:nrow(grid_coords)) {
    dist_i <- sqrt((coords_d[,1] - grid_coords[i,1])^2 + (coords_d[,2] - grid_coords[i,2])^2)
    try({
      m <- rq(bp_vec ~ dist_i, tau = 0.9)
      if (coefficients(m)[2] < 0) aics_grid[i] <- AIC(m) else aics_grid[i] <- NA
    }, silent = TRUE)
  }
  
  best_idx <- which.min(aics_grid)
  best_pt <- grid_coords[best_idx, ]
  best_dist <- sqrt((coords_d[,1] - best_pt[1])^2 + (coords_d[,2] - best_pt[2])^2)
  m_best <- rq(bp_vec ~ best_dist, tau = 0.9)
  
  results_master <- rbind(results_master, data.frame(
    Scenario = scen_name,
    Model = "Data-driven",
    AIC = AIC(m_best),
    Slope = coefficients(m_best)[2],
    Velocity_km_y = -1 / (coefficients(m_best)[2] / 1000),
    Easting = best_pt[1],
    Northing = best_pt[2]
  ))
  
  # Fixed Points
  for (orig_name in names(fixed_points)) {
    pt <- fixed_points[[orig_name]]
    dist_f <- sqrt((coords_d[,1] - pt[1])^2 + (coords_d[,2] - pt[2])^2)
    m_f <- rq(bp_vec ~ dist_f, tau = 0.9)
    results_master <- rbind(results_master, data.frame(
      Scenario = scen_name,
      Model = orig_name,
      AIC = AIC(m_f),
      Slope = coefficients(m_f)[2],
      Velocity_km_y = ifelse(coefficients(m_f)[2] < 0, -1 / (coefficients(m_f)[2] / 1000), NA),
      Easting = pt[1],
      Northing = pt[2]
    ))
  }
}

# Final calculations
results_master <- results_master %>%
  group_by(Scenario) %>%
  mutate(DeltaAIC = AIC - min(AIC[Slope < 0], na.rm = TRUE)) %>%
  arrange(Scenario, AIC)

write.csv2(results_master, here("esm", "Table_S1_Origin_Comparison.csv"), row.names = FALSE)