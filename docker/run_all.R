# Master script to reproduce all analysis and manuscript in Docker

# 1. Set up environment
if (dir.exists("/home/rstudio/IberianMegaliths")) {
  setwd("/home/rstudio/IberianMegaliths")
} else if (requireNamespace("here", quietly = TRUE)) {
  setwd(here::here())
}

# 2. Run main figures
message("Generating Figure 2")
source("scripts/Figure 2.R")
message("Generating Figure 3")
source("scripts/Figure 3.R")
message("Generating Figure 4")
source("scripts/Figure 4.R")
message("Generating Figure 5")
source("scripts/Figure 5.R")
message("Generating Figure 6")
source("scripts/Figure 6.R")

# 3. Generate manuscript
message("Compiling reproducible manuscript with Quarto...")
system("quarto render _manuscript_reproducible_Quarto/manuscript.qmd")

# Copy to final location
if(!dir.exists("manuscript")) dir.create("manuscript")
file.copy("_manuscript_reproducible_Quarto/manuscript.html", "manuscript/manuscript.html", overwrite = TRUE)


