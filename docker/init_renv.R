# Script to initialize renv and capture current project state
# Run this script ONCE to create renv.lock

# Install renv if not installed
if (!requireNamespace("renv", quietly = TRUE)) {
    install.packages("renv")
}

# Initialize renv
renv::init()

# List of main project packages
# (renv will automatically detect dependencies)
packages <- c(
    # Data manipulation
    "dplyr",
    "tidyr",
    "readr",
    "here",

    # Spatial analysis
    "sf",
    "sp",
    "raster",
    "terra",
    "gstat",
    "spatstat",
    "maptools",
    "rgdal",
    "rgeos",

    # Geographic data
    "rnaturalearth",
    "rnaturalearthdata",

    # Radiocarbon dates
    "rcarbon",
    "Bchron",

    # Visualization
    "ggplot2",
    "viridis",
    "scales",
    "gridExtra",
    "cowplot",

    # Quantile regression
    "quantreg",

    # Utilities
    "knitr",
    "rmarkdown"
)

# Install packages if not installed
for (pkg in packages) {
    if (!requireNamespace(pkg, quietly = TRUE)) {
        install.packages(pkg)
    }
}

# Create snapshot of current state
renv::snapshot()

cat("\n==============================================\n")
cat("✓ renv initialized correctly\n")
cat("✓ Packages installed and registered\n")
cat("✓ renv.lock created\n")
cat("\nNext steps:\n")
cat("1. Review renv.lock\n")
cat("2. Build Docker image: docker-compose build\n")
cat("3. Test reproducibility: docker-compose run --rm r-analysis R\n")
cat("==============================================\n")
