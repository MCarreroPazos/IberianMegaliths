# install.R - R package dependencies for Binder environment

options(repos = c(CRAN = "https://cloud.r-project.org"))

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

# High-resolution Natural Earth map data
if (!requireNamespace("rnaturalearthhires", quietly = TRUE)) {
  remotes::install_github("ropensci/rnaturalearthhires")
}
