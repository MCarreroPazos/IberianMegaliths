# Source Functions (`src/`)

This folder contains the functions used by the analytical scripts in `scripts/`.

---

## Overview
### `oxcalWorkflow.R`
**Purpose:** Manages OxCal execution
| `run_regional_trapezoid()`. Runs **one OxCal trapezoid model per region** using only the earliest date per site. Returns 4 posterior distributions per region: *Onset*, *Peak*, *Decline*, *Disappear*. The results are cached as `.rds` in `oxcalresults/`.

---
### `oxcalScriptCreator.R`
**Purpose:** Generates the OxCal `.oxcal` script files that are passed to the OxCal executable.
| `oxcalRegionalTrapezoidScript()`. Generates a **regional-level** trapezoid script with one date per site. Produces the 4 trapezoid boundary posteriors (*Onset*, *Peak*, *Decline*, *Disappear*) per region.

---
### `oxcalParsing.R`
**Purpose:** Processes raw JavaScript output files produced by OxCal and extracts posterior probability distributions.
| `extract_regional_posteriors()`. Extracts the 4 named posteriors (*Onset*, *Peak*, *Decline*, *Disappear*) for a given region from a parsed OxCal output object.
| `parse_oxcal_output()`. Reads an OxCal `.js` output file and returns a structured list of posterior arrays.
| `draw_samples()`. Draws random samples from a posterior probability distribution (used for density estimation).