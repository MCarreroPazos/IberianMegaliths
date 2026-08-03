# Workflow functions for parallel OxCal execution ----

#' Worker for single region execution ----
#' @keywords internal
run_region_worker <- function(region_name, dates_all, model, interval, mcnsim, 
                             oxcal_path_in, scripts_dir, results_dir) {
  library(oxcAAR); library(here)
  setOxcalExecutablePath(oxcal_path_in)
  source(here('src', 'oxcalScriptCreator.R'))
  
  region_data <- dates_all[dates_all$Region == region_name, ]
  script_path <- file.path(scripts_dir, paste0("script_", region_name, ".oxcal"))
  output_path <- file.path(results_dir, paste0("MCMC_", model, "_", region_name, ".csv"))
  
  oxcalScriptGen(
    id = region_data$LabNumber, c14age = region_data$C14, errors = region_data$STD,
    group = NULL, site = region_data$SiteID, fn = script_path,
    interval = interval, mcnsim = mcnsim,
    mcname = paste0("MCMC_", model, "_", region_name), model = model
  )
  
  script_text <- paste(readLines(script_path), collapse = "\n")
  tmpdir      <- tempfile(pattern = gsub(" ", "_", region_name))
  dir.create(tmpdir); oldwd <- setwd(tmpdir); on.exit(setwd(oldwd))
  
  result_file <- executeOxcalScript(script_text)
  file.copy(result_file, output_path, overwrite = TRUE)
  return(output_path)
}

#' Worker for single site execution ----
#' @keywords internal
run_one_site_worker <- function(sid, s_data, ox_path, mc, int, mod) {
  library(oxcAAR); library(here)
  setOxcalExecutablePath(ox_path)
  source(here('src', 'oxcalScriptCreator.R'))
  source(here('src', 'oxcalParsing.R'))
  
  sub_data <- s_data[s_data$SiteID == sid, ]
  if (nrow(sub_data) < 2) return(NULL)
  
  tmp_fn <- tempfile(pattern = sid, fileext = ".oxcal")
  tryCatch({
    oxcalScriptGen(
      id = sub_data$LabNumber, c14age = sub_data$C14, errors = sub_data$STD,
      group = NULL, site = sub_data$SiteID, fn = tmp_fn,
      interval = int, mcnsim = mc,
      mcname = paste0("MCMC_", mod, "_", sid), model = mod
    )
    res_file <- executeOxcalScript(paste(readLines(tmp_fn, warn = FALSE), collapse = "\n"))
    parsed   <- parse_oxcal_output(readLines(res_file, warn = FALSE))
    
    list(sid = sid, 
         start_samples = draw_samples(parsed, paste("Start of Start", sid), mc),
         end_samples   = draw_samples(parsed, paste("End of End",     sid), mc))
  }, error = function(e) return(list(sid = sid, error = e$message)))
}

# Main functions ---

#' Run multiple regions in parallel
#' @param region_names vector of region names
#' @param dates_all data frame with all dates
#' @param model OxCal model type
#' @param interval thinning interval
#' @param mcnsim number of simulations
#' @param n_cores number of cores to use
#' @param oxcal_path path to OxCal executable
#' @param scripts_dir directory to save OxCal scripts
#' @param results_dir directory to save OxCal results
run_oxcal_regions_parallel <- function(region_names, dates_all, model, interval, mcnsim, 
                                        n_cores, oxcal_path, scripts_dir, results_dir) {
  
  needed <- region_names[!sapply(region_names, function(n) 
    file.exists(file.path(results_dir, paste0("MCMC_", model, "_", n, ".csv"))))]
  
  if (length(needed) == 0) {
    message("All regions already computed — skipping OxCal.")
    return(invisible(NULL))
  }
  
  message(sprintf("Running OxCal for %d regions on %d cores...", length(needed), n_cores))
  
  cl <- parallel::makePSOCKcluster(min(n_cores, length(needed)))
  on.exit(parallel::stopCluster(cl), add = TRUE)
  
  # Export the worker function and all required variables from the current environment
  parallel::clusterExport(cl, 
                          c("run_region_worker", "dates_all", "model", "interval", 
                            "mcnsim", "oxcal_path", "scripts_dir", "results_dir"),
                          envir = environment())
  
  parallel::parLapply(cl, needed, function(n) {
    run_region_worker(n, dates_all, model, interval, mcnsim, oxcal_path, scripts_dir, results_dir)
  })
  
  message("Regional OxCal runs completed.")
}

#' Run multiple sites in parallel (Site-by-Site)
#' @return list of results with start/end samples
run_oxcal_sites_parallel <- function(site_ids, site_data, model, interval, mcnsim, 
                                     n_cores, oxcal_path) {
  
  message(sprintf("Running %d sites on %d cores (site-by-site)...", length(site_ids), n_cores))
  
  cl <- parallel::makePSOCKcluster(n_cores)
  on.exit(parallel::stopCluster(cl), add = TRUE)
  
  # Export the worker function and all required variables from the current environment
  parallel::clusterExport(cl, 
                          c("run_one_site_worker", "site_data", "model", "interval", 
                            "mcnsim", "oxcal_path"),
                          envir = environment())
  
  results <- parallel::parLapply(cl, site_ids, function(sid) {
    run_one_site_worker(sid, site_data, oxcal_path, mcnsim, interval, model)
  })
  
  return(results)
}

# ---------------------------------------------------------------------------
# Regional trapezoidal model runner (Lee, Bronk Ramsey 2012)
# One OxCal script per region. Results cached as .rds and reloaded on re-runs.

#' Run the regional trapezoidal model for all regions (parallelised if n_cores > 1)
#' @param region_names          character vector of region names
#' @param dates_earliest        data.frame filtered to one (earliest) date per site
#' @param oxcal_path            path to OxCalWin.exe
#' @param scripts_dir           directory for .oxcal scripts
#' @param results_dir           directory for cached .rds posteriors
#' @param nsim                  posterior samples to draw per parameter
#' @param n_cores               number of CPU cores to use for parallel processing
#' @param convergence_threshold OxCal Convergence option (95 = default strict; 0 = disabled for speed)
#' @return named list; each element has onset/peak/decline/disappear samples
run_regional_trapezoid <- function(region_names, dates_earliest, oxcal_path,
                                   scripts_dir, results_dir, nsim = 10000, n_cores = 6,
                                   convergence_threshold = 95) {

  library(parallel)
  setOxcalExecutablePath(oxcal_path)
  
  # Identify which regions need calculation and load cached ones
  needed <- c()
  out <- vector("list", length(region_names))
  names(out) <- region_names

  for (region_name in region_names) {
    safe   <- gsub("[^A-Za-z0-9]", "_", region_name)
    fn_rds <- file.path(results_dir, paste0("trapezoid_regional_", safe, ".rds"))

    if (file.exists(fn_rds)) {
      message(sprintf("[%s] Loading cached posteriors.", region_name))
      out[[region_name]] <- readRDS(fn_rds)
      next
    }

    # Subset dates
    rdata <- dates_earliest[dates_earliest$Region == region_name, ]
    if (nrow(rdata) < 3) {
      message(sprintf("[%s] Fewer than 3 dates — skipping.", region_name))
      next
    }
    needed <- c(needed, region_name)
  }

  if (length(needed) == 0) {
    return(out)
  }

  # If only one region or n_cores <= 1, run sequentially
  if (length(needed) == 1 || n_cores <= 1) {
    for (region_name in needed) {
      safe   <- gsub("[^A-Za-z0-9]", "_", region_name)
      fn_rds <- file.path(results_dir, paste0("trapezoid_regional_", safe, ".rds"))
      fn_script <- file.path(scripts_dir, paste0("trapezoid_regional_", safe, ".oxcal"))
      rdata <- dates_earliest[dates_earliest$Region == region_name, ]
      
      message(sprintf("[%s] Running OxCal sequentially (%d dates)...", region_name, nrow(rdata)))
      oxcalRegionalTrapezoidScript(
        region_name           = region_name,
        c14ages               = rdata$C14,
        errors                = rdata$STD,
        lab_ids               = rdata$LabNumber,
        fn                    = fn_script,
        iterations            = nsim,
        convergence_threshold = convergence_threshold
      )
      
      tryCatch({
        tmpdir <- tempfile(pattern = safe)
        dir.create(tmpdir)
        oldwd  <- setwd(tmpdir)
        
        result_file <- executeOxcalScript(
          paste(readLines(fn_script, warn = FALSE), collapse = "\n")
        )
        setwd(oldwd)
        unlink(tmpdir, recursive = TRUE)
        
        parsed <- parse_oxcal_output(readLines(result_file, warn = FALSE))
        post   <- extract_regional_posteriors(parsed, region_name, nsim)
        
        conv_min <- min(post$convergence, na.rm = TRUE)
        message(sprintf("[%s] Done (Convergence: %.1f).", region_name, conv_min))
        
        saveRDS(post, fn_rds)
        out[[region_name]] <- post
      }, error = function(e) {
        message(sprintf("[%s] ERROR: %s", region_name, e$message))
        try(setwd(oldwd), silent = TRUE)
      })
    }
    return(out)
  }

  # Otherwise, run in parallel using PSOCK cluster
  message(sprintf("Running regional trapezoidal OxCal models in parallel for %d regions on %d cores...", 
                  length(needed), min(n_cores, length(needed))))
  
  cl <- makePSOCKcluster(min(n_cores, length(needed)))
  on.exit(stopCluster(cl), add = TRUE)
  
  # Export everything needed to the cluster
  clusterExport(cl,
                c("dates_earliest", "oxcal_path", "scripts_dir", "results_dir", "nsim",
                  "convergence_threshold"),
                envir = environment())
  
  worker_func <- function(region_name) {
    library(oxcAAR)
    library(here)
    setOxcalExecutablePath(oxcal_path)
    source(here("src", "oxcalScriptCreator.R"))
    source(here("src", "oxcalParsing.R"))
    
    safe   <- gsub("[^A-Za-z0-9]", "_", region_name)
    fn_rds <- file.path(results_dir, paste0("trapezoid_regional_", safe, ".rds"))
    fn_script <- file.path(scripts_dir, paste0("trapezoid_regional_", safe, ".oxcal"))
    
    rdata <- dates_earliest[dates_earliest$Region == region_name, ]
    
    oxcalRegionalTrapezoidScript(
      region_name           = region_name,
      c14ages               = rdata$C14,
      errors                = rdata$STD,
      lab_ids               = rdata$LabNumber,
      fn                    = fn_script,
      iterations            = nsim,
      convergence_threshold = convergence_threshold
    )
    
    tmpdir <- tempfile(pattern = safe)
    dir.create(tmpdir)
    oldwd  <- setwd(tmpdir)
    on.exit({
      setwd(oldwd)
      try(unlink(tmpdir, recursive = TRUE), silent = TRUE)
    }, add = TRUE)
    
    result_file <- executeOxcalScript(
      paste(readLines(fn_script, warn = FALSE), collapse = "\n")
    )
    
    parsed <- parse_oxcal_output(readLines(result_file, warn = FALSE))
    post   <- extract_regional_posteriors(parsed, region_name, nsim)
    
    saveRDS(post, fn_rds)
    # Return only a confirmation to avoid PSOCK socket serialization deadlock
    # on Windows with large posterior objects. Parent reads from disk instead
    return(region_name)
  }
  
  parLapply(cl, needed, worker_func)
  
  # Read all results from disk
  for (region_name in needed) {
    safe   <- gsub("[^A-Za-z0-9]", "_", region_name)
    fn_rds <- file.path(results_dir, paste0("trapezoid_regional_", safe, ".rds"))
    if (file.exists(fn_rds)) {
      out[[region_name]] <- readRDS(fn_rds)
      conv_min <- min(out[[region_name]]$convergence, na.rm = TRUE)
      message(sprintf("[%s] Done (Convergence: %.1f).", region_name, conv_min))
    } else {
      message(sprintf("[%s] WARNING: RDS not found after parallel run.", region_name))
    }
  }
  
  return(out)
}
