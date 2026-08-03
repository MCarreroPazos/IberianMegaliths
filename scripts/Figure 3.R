# Figure 3. Modeling the geographical origin and spread -----
# Quantile regression of all dates (using median calBP)

## Libraries and set-up
library(spatstat)
library(oxcAAR)
library(rcarbon)
library(dplyr)
library(sp)
library(sf)
library(rnaturalearth)
library(raster)
library(quantreg)
library(gstat)
library(ggplot2)
library(tidyverse)
library(here)

# Also need rnaturalearthhires
remotes::install_github("ropensci/rnaturalearthhires")

install.packages(
  "rnaturalearthhires",
  repos = "https://ropensci.r-universe.dev",
  type = "source")

## Read raw data -----
dates <- read.csv(here("data", "C14dates_Iberia_raw.csv"), 
                  sep = ";", 
                  na = "n/a")
## Select only non-excluded dates
dates <- subset(dates, Excluded == "No")
## Create specific site ID
dates$SiteID <- paste0("S", as.numeric(as.factor(dates$Site)))

# Calibrate dates -----
dates_cal <- calibrate(
  x = dates$C14,
  errors = dates$STD,
  normalised = TRUE,
  calMatrix = TRUE,
  calCurves = "intcal20"
)
cal_sum_dates <- summary(dates_cal)
medianBP <- cbind(cal_sum_dates$DateID, cal_sum_dates$MedianBP)
medianBP <- as.numeric(medianBP[, 2])

## Read Site Coordinates and Compute Distance from Grid
sites.coords <- dplyr::select(dates, 
                              SiteID, 
                              Eastings_X, 
                              Northings_Y) # In ETRS_1989_UTM_Zone_29N
coordinates(sites.coords) <- c("Eastings_X", "Northings_Y")
proj4string(sites.coords) <- CRS("+proj=utm +zone=29 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs")

## Create window of analyses
spdf_spain <- ne_countries(country = "spain", 
                           scale = 10, 
                           returnclass = "sf")
spdf_portugal <- ne_countries(country = "portugal", 
                              scale = 10, 
                              returnclass = "sf")
window <- st_union(spdf_spain, spdf_portugal)
window <- st_transform(window, crs = "+proj=utm +zone=29 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs")
bbox <- cbind(c(388528.4, 3935709), c(1570529.0, 4903406))
b_poly <- st_as_sfc(st_bbox(c(xmin = bbox[1, 1], 
                              ymin = bbox[1, 2], 
                              xmax = bbox[2, 1], 
                              ymax = bbox[2, 2]), 
                            crs = st_crs(window)))
window <- st_intersection(window, b_poly)
## Convert to Spatial object for compatibility with sp-based functions
window <- as(window, "Spatial")

## Create grid points
gridPts <- spsample(window, n = 5000, type = "regular")

## Compute distances between grid points and sites
distMat <- spDists(sites.coords, 
                   gridPts, 
                   longlat = FALSE)

## Quantile Regression Loop ----
AICs <- numeric(length(gridPts))
tau <- 0.9
coeff <- numeric(length(gridPts))
for (i in seq_along(gridPts)) {
  CalBP <- medianBP
  geoDist <- distMat[, i]
  tmp_model <- rq(CalBP ~ geoDist, tau = tau)
  AICs[i] <- AIC(tmp_model)
  coeff[i] <- coefficients(tmp_model)[2]
}
gridPts <- as(gridPts, "SpatialPointsDataFrame")
gridPts@data <- data.frame(AICs = AICs, 
                           DeltaAIC = AICs - min(AICs), 
                           Coeff = coeff)

# Interpolation via IDW ----
## Create grid for interpolation (50,000 points)
grd <- as.data.frame(spsample(gridPts, "regular", n = 50000))
names(grd) <- c("X", "Y")
coordinates(grd) <- c("X", "Y")
gridded(grd) <- TRUE # Create SpatialPixel object
fullgrid(grd) <- TRUE # Create SpatialGrid object

## Add P's projection information to the empty grid
proj4string(gridPts) <- proj4string(gridPts)
proj4string(grd) <- proj4string(gridPts)
idw.dAIC <- gstat::idw(DeltaAIC ~ 1, 
                       gridPts, 
                       newdata = grd, 
                       nmin = 8, 
                       nmax = 12)
idw.dAIC.r <- raster(idw.dAIC)
idw.dAIC.m <- mask(idw.dAIC.r, window)
idw.coeff <- gstat::idw(Coeff ~ 1, 
                        gridPts, 
                        newdata = grd, 
                        nmin = 8, 
                        nmax = 12)
idw.coeff <- raster(idw.coeff)
idw.coeff.m <- mask(idw.coeff, 
                    window)

# Make the plot -----
pal <- c("blue", "yellow", "orange", "red") # Set palette
IdWSurface.dAIC <- rasterToPoints(idw.dAIC.m, xy = TRUE) %>%
  as_tibble() %>%
  gather(var, value, -x, -y)
IdWSurface.coeff <- rasterToPoints(idw.coeff.m, xy = TRUE) %>%
  as_tibble() %>%
  gather(var, value, -x, -y)

## Plot figure
plot0 <- ggplot() +
  geom_tile(data = IdWSurface.dAIC, 
            mapping = aes(x = x, y = y, fill = value)) +
  scale_fill_gradientn(colours = pal, na.value = "white", 
                       limits = c(0, 175), 
                       breaks = c(0, 5, 10, 15, 50, 175)) +
  geom_sf(data = st_as_sf(window), fill = NA) +
  theme_bw() +
  geom_contour(data = IdWSurface.coeff, mapping = aes(x = x, y = y, z = value), 
               breaks = 0, col = "black", linetype = 2) +
  labs(x = "", y = "", title = "IDW AICs Interpolation (all 14C dates, median calBP)", 
       fill = bquote("AICs")) +
  coord_sf(xlim = extent(window)[1:2], 
           ylim = extent(window)[3:4], 
           datum = sf::st_crs(window)) +
  theme(
    panel.background = element_rect(fill = "white", color = "gray50"),
    axis.text.y = element_text(angle = 90, hjust = 0.7),
    axis.text.x = element_text(angle = 0, hjust = 0.7),
    legend.text = element_text(size = 10),
    legend.position = "right",
    legend.key.width = unit(1, "line"),
    legend.key.height = unit(4, "line")
  ) +
  guides(shape = guide_legend(override.aes = list(size = 10))) +
  annotate("text", x = 780000, y = 4570000, label = "Positive Beta") +
  geom_point(data = dates, aes(x = Eastings_X, y = Northings_Y), 
             colour = "black", 
             shape = 19, 
             size = 0.5) +
  annotate("text", 
           x = 1000000, 
           y = 4300000, 
           label = "Negative Beta") +
  annotate("text", 
           x = 700000, 
           y = 4760000, 
           label = "Lowest AIC")

## Save the figure
ggsave(filename = here("figures", "Figure 3.png"),
  plot = plot0,
  width = 13,
  height = 8,
  dpi = 300,
  units = "in")

# Session information for reproducibility
si <- sessionInfo()
# print(si)
