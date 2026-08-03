# Reproducible Manuscript — Quarto

This folder contains the fully reproducible manuscript compiled with [Quarto](https://quarto.org/), corresponding to:

> Carrero-Pazos, M., Bevan, A., Crema, E.R., Rodríguez-Rellán, C., Díaz-Rodríguez, M., Martín Seijo, M., Fábregas Valcarce, R. (2026). *Material type bias affects radiocarbon-based diffusion models for the origin and spread of Iberian megaliths*. [Journal name].

---

## Contents

| File | Description |
|---|---|
| `_quarto.yml` | Quarto project configuration (output format, bibliography, CSS) |
| `manuscript.qmd` | Master file — compiles all chapters into a single document |
| `index.qmd` | Abstract and author information |
| `01-introduction.qmd` | Introduction |
| `02-materials-methods.qmd` | Materials and Methods |
| `03-results.qmd` | Results |
| `04-discussion.qmd` | Discussion and Conclusions |
| `99-references.qmd` | References page |
| `references.bib` | BibTeX bibliography |
| `styles.css` | Custom HTML styles |
| `figures/` | Figures embedded in the manuscript |
| `manuscript.html` | Pre-compiled HTML output (included for convenience) |

---

## Requirements

1. **Quarto** ≥ 1.4 — [Download from quarto.org](https://quarto.org/docs/get-started/)
2. **R** ≥ 4.3.2 and **RStudio** (recommended)
3. Required R packages:
   ```r
   install.packages(c("here", "knitr", "rmarkdown", "quarto"))
   ```
4. The manuscript embeds figures from `figures/` in the project root — run the figure scripts first if they are missing:
   ```r
   source("scripts/Figure 2.R")
   source("scripts/Figure 3.R")
   source("scripts/Figure 4.R")
   source("scripts/Figure 5.R")
   ```

---

## How to Render

### Option 1: From RStudio
1. Open the project root in RStudio (the `.here` file anchors the working directory).
2. Open `manuscript.qmd`.
3. Click **Render** (or press `Ctrl+Shift+K`).

### Option 2: From the R console
```r
quarto::quarto_render("_manuscript_reproducible_Quarto/manuscript.qmd")
```

### Option 3: From a terminal
```bash
cd _manuscript_reproducible_Quarto
quarto render manuscript.qmd
```

---

## Output

The rendered manuscript is generated as a single self-contained HTML file:

- `_manuscript_reproducible_Quarto/manuscript.html`

In the main project workflow (e.g. via Docker), this file is copied to `manuscript/manuscript.html`.

---

**Last updated:** 03 August 2026
