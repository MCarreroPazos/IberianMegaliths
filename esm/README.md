# Electronic Supplementary Material (ESM)

This directory contains additional documentation, supplementary data tables, and scripts supporting the manuscript:

> Carrero-Pazos, M., Bevan, A., Crema, E.R., Rodríguez-Rellán, C., Díaz-Rodríguez, M., Martín Seijo, M., Fábregas Valcarce, R. (2026). *Material type bias affects radiocarbon-based diffusion models for the origin and spread of Iberian megalithic complex*.

---

## Contents

### Data & Supplementary Tables
- **`Table_S1.csv`** — Comparative table of inferred origin locations, AIC values, regression slopes ($\beta_1$), and estimated diffusion velocities from quantile regression models across three analytical scenarios (raw radiocarbon dataset, charcoal corrected by −500 years, and bone/teeth-only subset).
- **`Table_S2.csv`** — Posterior transition parameter estimates (onset, peak start, peak end, disappearance) and Bayesian model agreement indices ($A_{\text{model}}$) for regional trapezoidal models (full radiocarbon dataset).
- **`Table_S3.csv`** — Posterior transition parameter estimates and agreement indices for regional Bayesian trapezoidal models (bone/teeth-only subset).

### Supplementary Documents
- **`esm_1_Database_description.docx`** — **ESM 1 (Database description)**: Details of the compiled radiocarbon dataset (1,219 dates from 392 monuments), compilation criteria, data sources (IDEArqC14, CronoloGEA, SIAC, etc.), inclusion/exclusion protocols, and architectural typologies.
- **`esm_2_Technical_descriptions.docx`** — **ESM 2 (Technical descriptions)**: Technical details on the unconstrained search grid algorithm over 1,000 points (Section 2.1), wood species taxon longevity and charcoal calibration thresholds in NW Iberia (Section 2.2), and control experiment comparing dates restricted to burial chamber contexts (Section 2.3).

### Supplementary Scripts (`esm_scripts/`)
| Script | Description |
|---|---|
| `esm_figure_A.R` | R code to generate the map of 1,000 regular grid search points over Iberia (UTM Zone 29N) for quantile regression. |
| `esm_figure_B.R` | R code to generate the control experiment figure comparing chamber-only charcoal vs. bone/teeth trapezoidal models (Section 2.3 of ESM 2). |
| `Table_S1_Model_Comparison.R` | R code to compute AIC values, ΔAIC, regression slopes, and estimated diffusion velocities for Supplementary Table S1. |

---