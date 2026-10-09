---
editor_options: 
  markdown: 
    wrap: 72
---

# Material type bias affects radiocarbon-based diffusion models for the origin and spread of Iberian megalithic complex

[![R
Version](https://img.shields.io/badge/R-≥4.3.2-blue.svg)](https://www.r-project.org/)
[![License:
MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![License: CC BY
4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](LICENSE-DATA)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.21772034.svg)](https://doi.org/10.5281/zenodo.21772034)

## Overview

This repository contains the data, R scripts, and a reproducible Quarto
manuscript file supporting the article:

> **"Material type bias affects radiocarbon-based diffusion models for
> the origin and spread of Iberian megalithic complex"**\
> Carrero-Pazos, M., Bevan, A., Crema, E.R., Rodríguez-Rellán, C.,
> Díaz-Rodríguez, M., Martín Seijo, M., Fábregas Valcarce, R. (2026).
> *PLOS ONE*.

Abstract: Megalithic monuments refer to large, often mounded, structures
made of both earth and worked stone slabs that were frequently used as
collective burial places in prehistoric Europe. The Iberian Peninsula
was an early centre for such monuments, boasting one of the largest
concentrations of sites in Europe, with activity generally spanning
5000-2500 BCE. Debates since the 19th century have been centred on
whether these monuments originated from a single source or emerged
independently in different territories. This paper addresses this
question using over 1,000 radiocarbon dates from 337 Iberian megalithic
sites. Our results indicate that material type bias, specifically
charcoal over-representation, can distort the kinds of spatial origin
models with radiocarbon that are now popular. Using a Bayesian
trapezoidal model, we identify a polycentric model consistent with an
initial “latent phase” of proto-megalithic experimentation, starting as
early as ca. 5500 BCE. While southern and interior regions of Iberia
exhibit a significant interval between initial emergence and peak
constructive density, the North was characterized by a rapid and
explosive adoption during the late 5th millennium BCE. We challenge
current single-source diffusion models and demonstrate that spatial
modelling of radiocarbon datasets requires rigorous chronometric
filtering. Specifically, in regions where acidic soils prevent bone
preservation, such as Northwestern Iberia, systematic dating programs
integrating traditional radiocarbon with alternative methods like
optically stimulated luminescence (OSL) are essential to obtain a
high-resolution picture of early monumentality.

**Read the manuscript (pre-review version):** [View
manuscript.html](https://mcarreropazos.github.io/IberianMegaliths/manuscript/manuscript.html)

------------------------------------------------------------------------

## How to Navigate the Codebase

To facilitate navigation and rapid peer-review inspection, the
repository is organized into distinct, modular functional layers:

```         
IberianMegaliths/
├── bin/                              # Pre-built executables - OxCal software
├── data/                             # Raw data
│   └── C14dates_Iberia_raw.csv         # Radiocarbon database
├── scripts/                          # Main scripts for figures
│   ├── Figure 2.R                      # Spatial density (KDE) and charcoal percentage maps
│   ├── Figure 3.R                      # Unconstrained quantile regression origin modeling
│   ├── Figure 4.R                      # Monte Carlo calibrated sensitivity analysis (old-wood offsets)
│   ├── Figure 5.R                      # Regional Bayesian trapezoidal models
│   └── Figure 6.R                      # Material sample and regional comparison
├── src/                              # OxCal engine and helper functions
│   ├── oxcalScriptCreator.R            # Generates OxCalscripts
│   ├── oxcalWorkflow.R                 # High-performance parallel execution of regional MCMC models
│   ├── oxcalParsing.R                  # Extracts and parses MCMC posteriors from OxCal outputs
│   └── README.md                       # Source documentation
├── oxcalresults/                     # Pre-computed MCMC posterior distributions (.rds)
├── simresults/                       # Pre-computed Monte Carlo simulation envelope for Figure 4
├── esm/                              # Electronic Supplementary Material (ESM)
│   ├── Table_S1.csv                    # Diffusion model comparisons, slopes, and velocities (km/yr)
│   ├── Table_S2.csv                    # Regional trapezoid posteriors (Full dataset)
│   ├── Table_S3.csv                    # Regional trapezoid posteriors classified by material sample
│   ├── Table_S4.csv                    # Discarded C14 dates
│   ├── esm_1_Database_description.docx # Description of data sources, curation, and exclusion criteria
│   ├── esm_2_Technical_descriptions.docx # Spatial grid parameters and taxonomic wood lifespans
│   └── esm_scripts/                  # Scripts for supplementary tables and figures
│       ├── esm_figure_A.R              # Grid points map (Figure A)
│       ├── esm_figure_B.R              # Chamber-only control experiment (Figure B)
│       └── Table_S1_Model_Comparison.R # Quantile regression statistics for Table S1
├── figures/                          # Rendered publication figures (PNG)
├── _manuscript_reproducible_Quarto/  # Fully reproducible Quarto manuscript source files (.qmd)
└── README.md
```

------------------------------------------------------------------------

## Steps for Figures

| Paper output | R script | Input data | Final output |
|------------------|------------------|------------------|------------------|
| **Figure 2** | `scripts/Figure 2.R` | `data/C14dates_Iberia_raw.csv` | `figures/Figure 2.png` |
| **Figure 3** | `scripts/Figure 3.R` | `data/C14dates_Iberia_raw.csv` | `figures/Figure 3.png` |
| **Figure 4** | `scripts/Figure 4.R` | `data/C14dates_Iberia_raw.csv` | `figures/Figure 4.png` |
| **Figure 5** | `scripts/Figure 5.R` | `data/C14dates_Iberia_raw.csv` | `figures/Figure 5.png`, `esm/Table_S2.csv` |
| **Figure 6** | `scripts/Figure 6.R` | `data/C14dates_Iberia_raw.csv` | `figures/Figure 6.png`, `esm/Table_S3.csv` |

------------------------------------------------------------------------

## How to run the code (reproducibility guide)

All analyses were written in R (R 4.5.1 and $\ge 4.3.2$) using portable
paths via the `here` library. Two execution modes are planed depending
on available time and hardware resources.

### Option 1: Quick reproduction

Pre-computed simulation and MCMC posterior chains are saved in
`oxcalresults/` and `simresults/`. Running the scripts in this mode
reproduces all final manuscript figures and summary tables in just a few
seconds:

``` r
# In R console (from project root):
source("scripts/Figure 2.R")
source("scripts/Figure 3.R")
source("scripts/Figure 4.R")  # Automatically loads cached MC draws from simresults/
source("scripts/Figure 5.R")  # Loads MCMC posteriors from oxcalresults/
source("scripts/Figure 6.R")  # Loads MCMC posteriors from oxcalresults/
source("esm/esm_scripts/Table_S1_Model_Comparison.R")
```

### Option 2: Recomputation

*Requires a local OxCal installation and multi-core CPU (we tested it on
an AMD Threadripper PRO 7965WX Workstation with 20 cores).*

1.  **Compute Monte Carlo sensitivity approach (Figure 4):** In
    `scripts/Figure 4.R`, set `force_recompute <- TRUE` and run the
    script. This will perform $N=500$ Monte Carlo IntCal20 calibrated
    draws (`rcarbon::sampleDates()`) across correction steps and 1,000
    grid points (\~6.5 million quantile regressions), re-saving
    `simresults/figure4_mc_sim_N500.rds`.

2.  **Compute Bayesian Regional Trapezoids in OxCal:** Execute
    `src/oxcalWorkflow.R`. This will compile CQL models with
    calendar-time charcoal outlier priors (`Exp(1, -10, 0)`), running
    100,000 MCMC iterations across all the six Iberian regions. It will
    save new `.rds` posteriors into `oxcalresults/`.

------------------------------------------------------------------------

## Session Information

Each script outputs `sessionInfo()` at the end, documenting the exact R
version, packages and operating system used during the process.

------------------------------------------------------------------------

## Long-term reproducibility with Docker

For guaranteed bit-for-bit reproducibility a complete Docker environment
is provided.\
**See [`docker/README.md`](docker/README.md) for full usage details.**

------------------------------------------------------------------------

## Main R packages used

| Package | Purpose |
|------------------------------------|------------------------------------|
| [rcarbon](https://github.com/ercrema/rcarbon) | For radiocarbon calibration and Monte Carlo sampling |
| [oxcAAR](https://github.com/ISAAKiel/oxcAAR) | R interface for OxCal modelling |
| [sf](https://github.com/r-spatial/sf) | For spatial data handling |
| [spatstat](http://spatstat.org/) | For spatial point analysis and KDEs |
| [quantreg](https://cran.r-project.org/package=quantreg) | For the quantile regression |
| [rnaturalearth](https://docs.ropensci.org/rnaturalearth/) | Public domain boundary base maps |
| [ggplot2](https://ggplot2.tidyverse.org/) | For data visualisation |
| [here](https://here.r-lib.org/) | For portable file paths |
| [era](https://github.com/joeroe/era) | For chronological transformations |

Radiocarbon calibration uses **IntCal20** (Reimer et al., 2020).
Bayesian modelling uses **OxCal 4.4.4** with the trapezoid model of Lee
& Bronk Ramsey (2012).

------------------------------------------------------------------------

## Citation

If you use this code or data, please cite:

``` bibtex
@article{Carrero-Pazos2026,
  title   = {Material type bias affects radiocarbon-based diffusion models
             for the origin and spread of Iberian megalithic complex},
  author  = {Carrero-Pazos, M. and Bevan, A. and Crema, E.R. and
             Rodríguez-Rellán, C. and Díaz-Rodríguez, M. and
             Martín Seijo, M. and Fábregas Valcarce, R.},
  journal = {PLOS ONE},
  year    = {2026},
  doi     = {10.5281/zenodo.21772034}
}
```

**Code repository:**
<https://github.com/mcarreropazos/IberianMegaliths>\
**Data repository:** <https://doi.org/10.5281/zenodo.21772034>

------------------------------------------------------------------------

## License

| Component       | License                   |
|-----------------|---------------------------|
| Code            | [MIT](LICENSE)            |
| Data            | [CC-BY 4.0](LICENSE-DATA) |
| Manuscript text | All rights reserved       |

------------------------------------------------------------------------

## Main Contact

**Miguel Carrero-Pazos** —
[miguel.carrero\@usc.es](mailto:miguel.carrero@usc.es)\
Department of History, University of Santiago de Compostela (GEPN-AAT /
CISPAC), Spain\
ORCID: [0000-0001-9203-9954](https://orcid.org/0000-0001-9203-9954)

------------------------------------------------------------------------

## Acknowledgments

This research has received funding from: - The European Union's Horizon
2020 research and innovation programme under the Marie Sklodowska-Curie
grant agreement **No. 886793** (MSCA-IF-EF-ST 2019, PI: Miguel
Carrero-Pazos, UCL Institute of Archaeology). - **"MegaLands"**:
Paisajes Megalíticos: Explorando los factores humanos y ambientales de
las sociedades neolíticas en el noroeste de la Península Ibérica (V-II
milenio a.C.), **PID2024-156264NA-I00** funded by
MICIU/AEI/10.13039/501100011033/FEDER, UE (PI: Miguel Carrero Pazos,
Noemí Silva Sánchez). - **"DISCOVER"**: Detección automática de
monumentos tumulares e megalíticos mediante tecnoloxía LiDAR e
Intelixencia Artificial (Impulso USC 2025-PU014, PI: Miguel Carrero
Pazos).

------------------------------------------------------------------------

**Last updated:** October 2026 (PLOS ONE Minor Revision)
