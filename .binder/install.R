# install.R - R package dependencies for Binder environment

# Ensure CRAN mirror points to Posit Package Manager for precompiled Linux binaries
if (is.null(getOption("repos")) || identical(getOption("repos"), c(CRAN = "@CRAN@"))) {
  options(repos = c(CRAN = "https://packagemanager.posit.co/cran/__linux__/noble/2024-10-01"))
}

pkgs <- c(
  "sf",
  "sp",
  "gstat",
  "raster",
  "rcarbon",
  "quantreg",
  "rnaturalearth",
  "rnaturalearthdata",
  "spatstat",
  "dplyr",
  "tidyr",
  "tidyverse",
  "ggplot2",
  "here",
  "oxcAAR",
  "remotes",
  "knitr",
  "rmarkdown"
)

new_pkgs <- pkgs[!(pkgs %in% installed.packages()[, "Package"])]
if (length(new_pkgs) > 0) {
  install.packages(new_pkgs)
}

# High-resolution Natural Earth map data from r-universe
if (!requireNamespace("rnaturalearthhires", quietly = TRUE)) {
  install.packages("rnaturalearthhires", repos = "https://ropensci.r-universe.dev")
}

