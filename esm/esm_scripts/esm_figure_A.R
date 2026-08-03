# ESM_2 - Figure A
# Load R packages -----
library(sf)
library(rnaturalearth)
library(rnaturalearthdata)
library(ggplot2)
library(here)

# Set seed for reproducibility
set.seed(123)

# Part 1. Create spatial window ----
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

# Transform to UTM 29N
window_utm <- st_transform(iberia_andorra, 32629)

# Part 2. Create grid ----
gridPts <- st_sample(window_utm, size = 1000, type = "regular")
gridPts <- st_sf(geometry = gridPts)
st_crs(gridPts) <- 32629

# Calculate grid statistics
grid_coords <- st_coordinates(gridPts)
grid_bbox <- st_bbox(gridPts)

# Calculate approximate spacing
x_range <- diff(range(grid_coords[, "X"]))
y_range <- diff(range(grid_coords[, "Y"]))
approx_spacing <- sqrt((x_range * y_range) / nrow(gridPts))

# Part 3. Visualization ----
# Transform to geographic coordinates for better visualization
iberia_geo <- st_transform(iberia_andorra, 4326)
gridPts_geo <- st_transform(gridPts, 4326)

# Part 4. Create plot with UTM coordinates
p_utm <- ggplot() +
    geom_sf(data = window_utm, fill = "#ecf0f1", color = "#34495e", linewidth = 0.5) +
    geom_sf(data = gridPts, color = "#e74c3c", size = 0.5, alpha = 0.5) +
    # Add coordinate grid
    theme_minimal() +
    theme(plot.title = element_text(face = "bold", size = 14),
        axis.title = element_text(face = "bold"),
        panel.grid.major = element_line(color = "gray80", linewidth = 0.3)) +
    labs(title = "Grid in UTM ETRS89 29N Coordinates",
        subtitle = sprintf("%d points, ~%.0f m spacing", nrow(gridPts), approx_spacing),
        x = "Easting (m)",
        y = "Northing (m)")

plot(p_utm)

# Session information for reproducibility
si <- sessionInfo()
print(si)
