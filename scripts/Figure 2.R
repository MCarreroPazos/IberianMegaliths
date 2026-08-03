# Figure 2. Distribution of all C14 dates and material type bias ----
# Libraries and set-up ----
library(sf)
if (!requireNamespace("rnaturalearthhires", quietly = TRUE))
  remotes::install_github("ropensci/rnaturalearthhires")
library(rnaturalearth)
library(spatstat)
library(here)

# Load basemaps ----
iberia <- ne_countries(
  country = c("spain", "portugal"),
  returnclass = "sf",
  scale = 10
)
iberia <- st_cast(st_geometry(iberia), "POLYGON")
iberia <- iberia[st_coordinates(st_centroid(iberia))[, "X"] > -10]
iberia <- st_union(
  iberia[st_area(iberia) > units::set_units(50000000, "m^2")]
)
iberia <- st_transform(iberia, 25829)
franceandorra <- st_cast(
  st_geometry(ne_countries(
    country = "france", returnclass = "sf", scale = 10
  )), "POLYGON"
)
franceandorra <- franceandorra[
  st_area(franceandorra) == units::set_units(
    max(st_area(franceandorra)), "m^2"
  )
]
franceandorra <- st_union(
  franceandorra,
  st_geometry(ne_countries(
    country = "andorra", returnclass = "sf", scale = 10
  ))
)
franceandorra <- st_transform(franceandorra, 25829)
northafrica <- ne_countries(
  country = c("morocco", "algeria"),
  returnclass = "sf", scale = 10
)
northafrica <- st_cast(st_geometry(northafrica), "POLYGON")
northafrica <- st_union(
  northafrica[st_area(northafrica) > units::set_units(50000000, "m^2")]
)
northafrica <- st_transform(northafrica, 25829)
andorra <- st_cast(
  st_geometry(ne_countries(
    country = "andorra", returnclass = "sf", scale = 10
  )), "POLYGON"
)
andorra <- st_transform(andorra, 25829)
iberia_andorra <- st_union(iberia, andorra)

# Load radiocarbon dates and convert to spatial data ----
dates <- read.csv(
  here("data", "C14dates_Iberia_raw.csv"),
  sep = ";", dec = ","
)
dates[dates$LabNumber == "UBAR-630", "Northings_Y"] <-
  dates[dates$LabNumber == "UBAR-630", "Northings_Y"] - 1000
dates <- st_as_sf(dates, coords = c(4, 5))
st_crs(dates) <- 25829 # LAEA ETRS89
set.seed(123)
dates <- st_jitter(dates, 2) # jitter all dates by 2m
charcoaldates <- dates[dates$Material == "Charcoal", ]
otherdates <- dates[dates$Material != "Charcoal", ]

# Spatial density of all dates ----
mysd <- scalesize <- 40000
cellres <- 1000
dates_ppp <- ppp(
  st_coordinates(dates)[, 1],
  st_coordinates(dates)[, 2],
  as.owin(iberia_andorra)
)
dates_dens <- density(dates_ppp, eps = cellres, sigma = mysd, edge = FALSE)
charcoaldates_ppp <- ppp(
  st_coordinates(charcoaldates)[, 1],
  st_coordinates(charcoaldates)[, 2],
  as.owin(iberia)
)
charcoaldates_dens <- density(
  charcoaldates_ppp,
  eps = cellres,
  sigma = mysd,
  edge = FALSE
)

# Relative risk of charcoal as percentage, with denominator cutoff ----
cutoff <- 1e-10
dates_dens_na <- dates_dens
dates_dens_na[as.matrix(dates_dens) < cutoff] <- NA
charcoaldates_perc <- charcoaldates_dens / dates_dens_na * 100
dates_dens_per100sqkm <- dates_dens_na *
  (dates_dens$xstep * dates_dens$ystep) * 100

# Plot ----
cm2 <- colourmap(
  col = rev(heat.colors(10)),
  range = c(min(charcoaldates_perc), max(charcoaldates_perc))
)
png(filename = here("figures", "Figure 2.png"), width = 700, height = 800)
par(mfrow = c(2, 1))
par(mar = c(0.1, 0.1, 0.1, 0.1))
# panel 1
plot(iberia_andorra, border = NA, col = "grey75")
plot(franceandorra, col = "grey90", border = NA, add = TRUE)
plot(northafrica, col = "grey90", border = NA, add = TRUE)
plotlim <- par("usr") # x1 x2 y1 y2
xlimramp <- c(1600000, 1650000)
ylimramp <- c((plotlim[3] + 650000), (plotlim[3] + 850000))
plot(dates_dens_per100sqkm, add = TRUE)
plot(iberia_andorra, border = "grey75", col = NA, lwd = 0.5, add = TRUE)
plot(
  st_geometry(dates),
  add = TRUE,
  col = "black",
  pch = 1,
  cex = 0.3,
  lwd = 0.5
)
xmax <- max(dates_dens_per100sqkm)
xticks <- seq(0, xmax, xmax / 4)
to <- c(ylimramp[1], ylimramp[2])
xrange <- range(seq(0, xmax, xmax / 4))
mfac <- (to[2] - to[1]) / (xrange[2] - xrange[1])
xticksrs <- to[1] + (xticks - xrange[1]) * mfac
xticks_text <- signif(xticks, digits = 3)
xticks_text[1] <- "0"
plot(
  colourmap(Kovesi$values[[29]], range = c(0, xmax)),
  vertical = TRUE,
  main = "",
  ylim = ylimramp,
  xlim = xlimramp,
  axes = FALSE,
  add = TRUE
)
# Add custom axis with proper labels ----
axis(4, at = xticksrs, labels = xticks_text, cex.axis = 1, las = 2)
text(
  1625000, 4840000, "dates/100 sqkm",
  cex = 1, font = 2, col = "black"
)
xpos <- 1600000
ypos <- 4100000
scalesize <- mysd * 6
x <- seq(0 - (scalesize / 2), 0 + (scalesize / 2), 100)
xx <- x + xpos
y <- dnorm(x, mean = 0, sd = mysd)
yy <- (y / max(y) * (scalesize * 0.6)) + ypos
xsd <- seq(0 - mysd, 0 + mysd, 100)
xxsd <- xsd + xpos
ysd <- dnorm(xsd, mean = 0, sd = mysd)
yysd <- (ysd / max(ysd) * (scalesize * 0.6)) + ypos
xxsd <- xxsd[median(seq_along(xxsd)):length(xxsd)]
yysd <- yysd[median(seq_along(yysd)):length(yysd)]
polygon(
  c(xx, max(xx), min(xx), min(xx)),
  c(yy, ypos, ypos, yy[1]),
  col = "grey75",
  border = NA
)
polygon(
  c(xxsd, max(xxsd), min(xxsd), min(xxsd)),
  c(yysd, ypos, ypos, yysd[1]),
  col = "grey50",
  border = NA
)
text(
  xpos, ypos - 20000,
  expression(paste(sigma, "=40 km", sep = "")),
  cex = 0.7, col = "black"
)
lines(c(xpos, xpos), c(ypos, max(yy)), col = "grey50")
text(
  xpos, ypos + 170000, "N",
  cex = 1.2, font = 2, col = "black"
)
text(
  x = 1175000, y = 4450000, "insufficient\ndata",
  srt = 65, cex = 1, font = 3
)
text(350000, 4000000, "A", cex = 1.5, font = 2, col = "black")
box()
# panel 2 ----
plot(iberia_andorra, border = NA, col = "grey75")
plot(franceandorra, col = "grey90", border = NA, add = TRUE)
plot(northafrica, col = "grey90", border = NA, add = TRUE)
plot(charcoaldates_perc, col = cm2, add = TRUE)
plot(iberia_andorra, border = "grey75", col = NA, lwd = 0.5, add = TRUE)
plot(
  st_geometry(dates[
    dates$Material %in% c("Human bone", "Human teeth"),
  ]),
  add = TRUE,
  col = "cyan",
  pch = 19,
  cex = 1
)
plot(
  st_geometry(charcoaldates),
  add = TRUE,
  col = "black",
  pch = 19,
  cex = 1
)
plot(
  st_geometry(dates[!dates$Material %in% c(
    "Charcoal",
    "Human bone",
    "Human teeth"
  ), ]),
  add = TRUE,
  col = "purple",
  pch = 4,
  cex = 0.5
)
legend(
  xpos - 140000,
  ypos + 220000,
  legend = c("charcoal", "human bone/teeth", "other"),
  bty = "n",
  col = c("black", "cyan", "purple"),
  pch = c(19, 19, 4),
  pt.cex = c(0.6, 0.6, 0.7),
  cex = 1
)
text(100000, 75000, "A", cex = 1.2, font = 2, col = "black")
plot(
  cm2,
  vertical = TRUE,
  main = "",
  ylim = ylimramp,
  xlim = xlimramp,
  cex.axis = 1,
  las = 2,
  labelmap = function(x) round(x, digits = 0),
  add = TRUE
)
text(
  1625000, 4825000, "% charcoal",
  cex = 1, font = 2, col = "black"
)
text(350000, 4000000, "B", cex = 1.5, font = 2, col = "black")
text(
  x = 1175000, y = 4450000, "insufficient\ndata",
  srt = 65, cex = 1, font = 3
)
box()
dev.off()

# Session information for reproducibility ----
si <- sessionInfo()
# print(si)
