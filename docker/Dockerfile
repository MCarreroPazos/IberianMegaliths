# Dockerfile for project reproducibility: IberianMegaliths
# Based on Rocker Project with specific R version

# Use specific R version (4.5.1) — matches the development environment
# Rocker maintains versioned images permanently
FROM rocker/verse:4.5.1

# Project Metadata
LABEL maintainer="miguel.carrero@usc.es"
LABEL description="Material type bias affects radiocarbon-based diffusion models for the origin and spread of Iberian megalithic complex - Reproducible environment"
LABEL version="1.1"

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV RENV_VERSION=1.0.3

# Install system dependencies needed for spatial packages and Quarto
RUN apt-get update && apt-get install -y \
    curl \
    gdebi-core \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    libudunits2-dev \
    libxml2-dev \
    libcurl4-openssl-dev \
    libssl-dev \
    libfontconfig1-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    libfreetype6-dev \
    libpng-dev \
    libtiff5-dev \
    libjpeg-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Quarto CLI
RUN curl -LO https://quarto.org/download/latest/quarto-linux-amd64.deb
RUN gdebi -n quarto-linux-amd64.deb
RUN rm quarto-linux-amd64.deb

# Create working directory
WORKDIR /home/rstudio/IberianMegaliths

# Install required R packages directly
RUN R -e "install.packages(c( \
    'sf', \
    'sp', \
    'gstat', \
    'raster', \
    'rcarbon', \
    'quantreg', \
    'rnaturalearth', \
    'rnaturalearthdata', \
    'rnaturalearthhires', \
    'spatstat', \
    'dplyr', \
    'tidyr', \
    'tidyverse', \
    'ggplot2', \
    'cowplot', \
    'scales', \
    'here', \
    'remotes', \
    'oxcAAR', \
    'bookdown', \
    'rmarkdown', \
    'knitr' \
    ), repos='https://cloud.r-project.org')"

# Copy the rest of the project
COPY . .

# Set correct permissions
RUN chown -R rstudio:rstudio /home/rstudio/IberianMegaliths

# Expose port for RStudio Server (if used)
EXPOSE 8787

# Default command: start R
CMD ["R"]
