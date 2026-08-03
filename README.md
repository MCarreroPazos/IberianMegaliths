# Material type bias affects radiocarbon-based diffusion models for the origin and spread of Iberian megalithic complex

[![R Version](https://img.shields.io/badge/R-≥4.3.2-blue.svg)](https://www.r-project.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](LICENSE-DATA)

## Overview

This repository contains the R code and data for the manuscript:

> **"Material type bias affects radiocarbon-based diffusion models for the origin and spread of Iberian megalithic complex"**  
> Carrero-Pazos, M., Bevan, A., Crema, E.R., Rodríguez-Rellán, C., Díaz-Rodríguez, M., Martín Seijo, M., Fábregas Valcarce, R. (2026).

> Megalithic monuments refer to large, often mounded, structures made of both earth and worked stone slabs that were frequently used as collective burial places in prehistoric Europe. The Iberian Peninsula was an early centre for such monuments, boasting one of the largest concentrations of sites in Europe, with activity generally spanning 5000-2500 BCE. Debates since the 19th century have been centred on whether these monuments originated from a single source or emerged independently in different territories. This paper addresses this question using over 1,000 radiocarbon dates from 337 Iberian megalithic sites.
> 
> Our results indicate that material type bias, specifically charcoal over-representation, can distort the kinds of spatial origin models with radiocarbon that are now popular. Using a Bayesian trapezoidal model, we identify a polycentric model consistent with an initial “latent phase” of proto-megalithic experimentation, starting as early as ca. 5500 BCE. While southern and interior regions of Iberia exhibit a significant interval between initial emergence and peak constructive density, the North was characterized by a rapid and explosive adoption during the late 5th millennium BCE. We challenge current single-source diffusion models and demonstrate that spatial modelling of radiocarbon datasets requires rigorous chronometric filtering. Specifically, in regions where acidic soils prevent bone preservation, such as Northwestern Iberia, systematic dating programs integrating traditional radiocarbon with alternative methods like optically stimulated luminescence (OSL) are essential to obtain a high-resolution picture of early monumentality.

📄 **Read the rendered manuscript:** [View manuscript.html](https://htmlpreview.github.io/?https://github.com/miguelcarrero/IberianMegaliths/blob/main/manuscript/manuscript.html)

---

## Project Structure

```
IberianMegaliths/
├── bin/                              # Pre-built executables (OxCal software)
├── data/
│   └── C14dates_Iberia_raw.csv       # Main radiocarbon database
├── scripts/
│   ├── Figure 2.R                    # Spatial density and charcoal bias maps
│   ├── Figure 3.R                    # Quantile regression origin modelling
│   ├── Figure 4.R                    # Sensitivity analysis (old-wood correction)
│   ├── Figure 5.R                    # Bayesian trapezoidal models by region
│   └── Figure 6.R                    # Regional comparisons (bone/teeth only vs full dataset)
├── src/                              # Functions for OxCal workflow
│   ├── oxcalWorkflow.R               # OxCal execution and trapezoid models 
│   ├── oxcalScriptCreator.R          # OxCal script generation
│   ├── oxcalParsing.R                # OxCal output parsing and posterior extraction
│   └── README.md                     # Source functions documentation
├── esm/                              # Electronic Supplementary Material
│   ├── README.md                     # ESM documentation
│   ├── Table_S1.csv                  # Model comparison table S1
│   ├── Table_S2.csv                  # Trapezoidal model posteriors (Full dataset)
│   ├── Table_S3.csv                  # Trapezoidal model posteriors (Bone/teeth subset)
│   ├── esm_1_Database_description.docx # Database description (ESM 1)
│   ├── esm_2_Technical_descriptions.docx # Technical supplementary text & figures (ESM 2)
│   └── esm_scripts/                  # Scripts for supplementary figures and tables
│       ├── esm_figure_A.R            # Grid points map (Figure A)
│       ├── esm_figure_B.R            # Chamber-only trapezoidal model comparison (Figure B)
│       └── Table_S1_Model_Comparison.R # Statistics for Table S1
├── _manuscript_reproducible_Quarto/  # Quarto reproducible manuscript
│   ├── manuscript.qmd                # Master compilation file
│   ├── index.qmd                     # Metadata
│   ├── 01-introduction.qmd           # Section 1: Introduction
│   ├── 02-materials-methods.qmd      # Section 2: Materials & Methods
│   ├── 03-results.qmd                # Section 3: Results
│   ├── 04-discussion.qmd             # Section 4: Discussion & Conclusion
│   ├── 05-data-availability.qmd      # Data availability statement
│   ├── 99-references.qmd             # References container
│   ├── 100-post-references.qmd       # Post-references section
│   ├── references.bib                # BibTeX bibliography database
│   ├── apa.csl                       # APA citation style format
│   ├── _quarto.yml                   # Quarto layout configuration
│   └── styles.css                    # Custom CSS styling
├── figures/                          # Final manuscript figures (PNG)
├── manuscript/                       # Compiled manuscript output (.docx and .html)
├── OxCal/                            # Local OxCal installation (Bayesian modelling)
├── oxcalresults/                     # Pre-computed MCMC posteriors (.rds) and CSV summaries
├── oxcalscripts/                     # Generated OxCal scripts for each region
├── docker/                           # Environment for reproducibility
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── Makefile
│   ├── docker-helper.ps1
│   ├── init_renv.R
│   ├── run_all.R
│   └── README.md
├── CITATION.cff                      # Citation metadata
├── codemeta.json                     # Software metadata
├── LICENSE                           # MIT License (code)
├── LICENSE-DATA                      # CC-BY 4.0 License (data)
├── .gitignore
├── .here                             # Project root for the `here` package
├── .Rprofile                         # R session configuration
└── README.md
```

---

## Scripts and figures

| Script | Figure / Output | Description |
|---|---|---|
| [`scripts/Figure 2.R`](scripts/Figure%202.R) | Fig. 2 | Spatial density of all C14 dates & charcoal bias (% charcoal per cell) |
| [`scripts/Figure 3.R`](scripts/Figure%203.R) | Fig. 3 | Quantile regression ($\tau = 0.9$) of geographic origin — IDW surface of $\Delta\text{AICs}$ |
| [`scripts/Figure 4.R`](scripts/Figure%204.R) | Fig. 4 | Sensitivity curve: how old-wood corrections shift the inferred origin |
| [`scripts/Figure 5.R`](scripts/Figure%205.R) | Fig. 5 | Bayesian trapezoidal models (one per region) — onset/peak/decline/disappear posteriors |
| [`scripts/Figure 6.R`](scripts/Figure%206.R) | Fig. 6 | Regional comparisons: bone/teeth-only baseline versus full dataset |
| [`esm/esm_scripts/esm_figure_A.R`](esm/esm_scripts/esm_figure_A.R) | ESM Fig. A | Grid points map used for spatial search |
| [`esm/esm_scripts/esm_figure_B.R`](esm/esm_scripts/esm_figure_B.R) | ESM Fig. B | Chamber-only trapezoidal model comparison |
| [`esm/esm_scripts/Table_S1_Model_Comparison.R`](esm/esm_scripts/Table_S1_Model_Comparison.R) | Table S1 | Model comparison statistics for Supplementary Table S1 |

---

## Session information

Each script outputs `sessionInfo()` at the end, documenting the exact R version, package versions, operating system and locale settings used during analysis.

---

## Long-term reproducibility with Docker

For guaranteed bit-for-bit reproducibility a complete Docker environment is provided.
**See [`docker/README.md`](docker/README.md) for full usage details.**

---

## Main R Packages used

| Package | Purpose |
|---|---|
| [rcarbon](https://github.com/ercrema/rcarbon) | Radiocarbon calibration and SPD analysis |
| [oxcAAR](https://github.com/ISAAKiel/oxcAAR) | R interface to OxCal Bayesian modelling |
| [sf](https://github.com/r-spatial/sf) | Simple features / spatial data handling |
| [spatstat](http://spatstat.org/) | Spatial point pattern analysis & KDE |
| [quantreg](https://cran.r-project.org/package=quantreg) | Quantile regression |
| [rnaturalearth](https://docs.ropensci.org/rnaturalearth/) | Boundary base maps |
| [ggplot2](https://ggplot2.tidyverse.org/) | Data visualisation |
| [here](https://here.r-lib.org/) | Portable file paths |
| [era](https://github.com/joeroe/era) | Year-based chronological transformations |

Radiocarbon calibration uses **IntCal20** (Reimer et al. 2020). Bayesian modelling uses **OxCal 4.x** with the trapezoid model of Lee & Bronk Ramsey (2012).

---

## Citation

If you use this code or data, please cite:

```bibtex
@article{Carrero-Pazos2026,
  title   = {Material type bias affects radiocarbon-based diffusion models
             for the origin and spread of Iberian megalithic complex},
  author  = {Carrero-Pazos, M. and Bevan, A. and Crema, E.R. and
             Rodríguez-Rellán, C. and Díaz-Rodríguez, M. and
             Martín Seijo, M. and Fábregas Valcarce, R.},
  journal = {[Journal name]},
  year    = {2026},
  volume  = {XX},
  pages   = {XX--XX},
  doi     = {10.XXXX/XXXXX}
}
```

**Code repository:** https://github.com/miguelcarrero/IberianMegaliths  
**Data repository:** [Zenodo DOI to be added]

---

## License

| Component | License |
|---|---|
| Code | [MIT](LICENSE) |
| Data | [CC-BY 4.0](LICENSE-DATA) |
| Manuscript text | All rights reserved |

---

## Main contact

**Miguel Carrero-Pazos** — [miguel.carrero@usc.es](mailto:miguel.carrero@usc.es)  
Department of History, University of Santiago de Compostela (GEPN-AAT / CISPAC), Spain  
ORCID: [0000-0001-9203-9954](https://orcid.org/0000-0001-9203-9954)

---

## Acknowledgments

This research has received funding from:
- The European Union's Horizon 2020 research and innovation programme under the Marie Sklodowska-Curie grant agreement **No. 886793** (MSCA-IF-EF-ST 2019, PI: Miguel Carrero-Pazos, UCL Institute of Archaeology).
- **"MegaLands"**: Paisajes Megalíticos: Explorando los factores humanos y ambientales de las sociedades neolíticas en el noroeste de la Península Ibérica (V-II milenio a.C.), **PID2024-156264NA-I00** funded by MICIU/AEI/10.13039/501100011033/FEDER, UE (PI: Miguel Carrero Pazos, Noemí Silva Sánchez).
- **"DISCOVER"**: Detección automática de monumentos tumulares e megalíticos mediante tecnoloxía LiDAR e Intelixencia Artificial (Impulso USC 2025-PU014, PI: Miguel Carrero Pazos).

---

**Last updated:** 3 August 2026