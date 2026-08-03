# Docker — Reproducible Environment

This folder contains all the reproducible environment needed to the **complete reproducibility** of the paper:

> Carrero-Pazos, M. et al. (2026). *Material type bias affects radiocarbon-based diffusion models for the origin and spread of Iberian megaliths*. [Journal name].

---

## Contents

| File | Description |
|---|---|
| `Dockerfile` | Docker image definition (R via `rocker/verse`) |
| `docker-compose.yml` | Service orchestration (analysis + RStudio Server) |
| `.dockerignore` | Files excluded from the Docker build context |
| `Makefile` | Convenience targets for Mac/Linux users |
| `docker-helper.ps1` | PowerShell helper script for Windows users |
| `run_all.R` | Master R script — runs all 6 figure scripts and compiles the manuscript |
| `init_renv.R` | Optional: initialise `renv` for package locking |

---
## Quick Start

### 1. Build the image
```
cd docker
docker-compose build
```

### 2. Run all analyses and generate the manuscript
```bash
docker-compose run --rm r-analysis Rscript docker/run_all.R
```

### 3. Interactive R session
```bash
docker-compose run --rm r-analysis R
```

### 4. RStudio Server (interactive development)
```bash
docker-compose up rstudio
# Open in browser: http://localhost:8787
# Default credentials: rstudio / rstudio
```

---

## What `run_all.R` does

Sequentially sources the five main figure scripts, then renders the Quarto manuscript:

1. `scripts/Figure 2.R` 
2. `scripts/Figure 3.R`
3. `scripts/Figure 4.R` 
4. `scripts/Figure 5.R` 
5. `scripts/Figure 6.R` 

Output locations (mounted as host volumes):
- **Figures** → `figures/`
- **Manuscript** → `manuscript/manuscript.html`
- **OxCal posteriors** → `oxcalresults/`

---

## Testing Full Reproducibility

```bash
# Clean rebuild from scratch (no cache) + full analysis run
cd docker
docker-compose build --no-cache
docker-compose run --rm r-analysis Rscript docker/run_all.R
```