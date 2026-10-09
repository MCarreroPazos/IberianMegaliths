# Electronic Supplementary Material (ESM)

This directory contains additional documentation, supplementary data tables, and scripts supporting the manuscript:

> Carrero-Pazos, M., Bevan, A., Crema, E.R., Rodríguez-Rellán, C., Díaz-Rodríguez, M., Martín Seijo, M., Fábregas Valcarce, R. (2026). *Material type bias affects radiocarbon-based diffusion models for the origin and spread of Iberian megalithic complex*. *PLOS ONE*.

------------------------------------------------------------------------

## Contents

### Data & Supplementary Tables

-   **`Table_S1.csv`** — Comparative table of origin locations, AIC values, regression slopes and estimated diffusion velocities from quantile regression models across three analytical scenarios (raw radiocarbon dataset, charcoal corrected by −500 years, and bone/teeth-only subset). The data-driven bone centroid is situated in the south-central interior (Toledo/Madrid/Ciudad Real).
-   **`Table_S2.csv`** — Posterior transition parameter estimates (onset, peak start, peak end, disappearance) and Bayesian model agreement indices ($A_{\text{model}}$) for regional trapezoidal models (full radiocarbon dataset evaluated with the OxCal Charcoal Outlier model).
-   **`Table_S3.csv`** — Material comparison of posterior transition parameter estimates across all six Iberian regions evaluating three distinct subsets: All dates, Charcoal only, and Bone/teeth only.
-   **`Table_S4.csv`** — Csv List of the 172 discarded radiocarbon dates following five objective exclusion criteria:
    -   **C1: Non-megalithic architectures** ($n = 41$)
    -   **C2: Chronological boundaries (too early - too old)** ($n = 53$)
    -   **C3: Contextually anomalous or aberrant dates** ($n = 38$)
    -   **C4: Insufficient contextual or provenance data** ($n = 26$)
    -   **C5: High uncertainty** ($n = 14$)

### Supplementary Documents

-   **`esm_1_Database_description.docx`** — **ESM 1 (Database description)**: Details of the compiled radiocarbon dataset (1,219 dates from 392 monuments), compilation criteria, data sources (IDEArqC14, CronoloGEA, SIAC, etc.) and exclusion reasons.
-   **`esm_2_Technical_descriptions.docx`** — **ESM 2 (Technical descriptions)**: Technical details on the unconstrained search grid algorithm over 1,000 points (Section 2.1), wood species taxon longevity and charcoal calibration thresholds in NW Iberia (Section 2.2). We also include a bayesian phase model of dates restricted to burial chamber contexts (Section 2.3).

### Supplementary Scripts (`esm_scripts/`)

| Script | Output | Description |
|------------------------|------------------------|------------------------|
| `esm_figure_A.R` | ESM Fig. A | R code to generate the map of 1,000 regular grid search points over Iberia for quantile regression. |
| `esm_figure_B.R` | ESM Fig. B | R code to generate the figure comparing only charcoal coming from chamber contexts versus bone/teeth |
| `Table_S1_Model_Comparison.R` | `esm/Table_S1.csv` | R code to compute the AIC values, ΔAIC, regression slopes and diffusion velocities for Supplementary Table S1. |

------------------------------------------------------------------------
