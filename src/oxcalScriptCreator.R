oxcalScriptGen = function(id,c14age,errors,group,site,fn,interval=100,mcnsim=5000,mcname,model=c("gaussian","uniform","trapezoid"))
{
  export <- file(fn) #create export file
  siteNames =  unique(site)
  nsite = length(siteNames)
  
  
  cat("Plot(){\n",file=fn,append=FALSE) #Start Sequence#
  cat('Outlier_Model("",N(0,2),0,"s");\n',file=fn,append=TRUE)
  cat("Phase(){\n",file=fn,append=TRUE) #Start Sequence#
  
  for (k in 1:nsite)
  {
    i = which(site == siteNames[k])
    c14.phase = c14age[i]
    errors.phase = errors[i]
    id.phase = id[i]
    group.phase = group[i]
    
    
    # Phase Boundary Start####
    cat("Sequence(){\n", file = fn, append = TRUE) #Start Sequence#
    if (model=="gaussian")
    {
     cat(paste0('Sigma_Boundary("Start ', siteNames[k], '");\n'), file = fn, append = TRUE)
    }
    if (model=="uniform")
    {
      cat(paste0('Boundary("Start ', siteNames[k], '");\n'), file = fn, append = TRUE)
    }
    if (model=="trapezoid")
    {
      cat(paste0('Boundary("Start ', siteNames[k], '"){\n'), file = fn, append = TRUE)
      cat(paste0('Start("Start of Start ', siteNames[k], '");\n'), file = fn, append = TRUE)
      cat(paste0('Transition("Period of Start ', siteNames[k], '");\n'), file = fn, append = TRUE)
      cat(paste0('End("End of Start ', siteNames[k], '");\n'), file = fn, append = TRUE)
      cat('};\n', file = fn, append = TRUE)
    }
    
    
    # Actual Dates#####
    cat(paste0('Phase("', siteNames[k], '")\n'), file = fn, append = TRUE)
    cat('{\n', file = fn, append = TRUE)
    
    #start with dates to be combined
    cb = which(!is.na(group.phase))
    
    if (length(cb)>0) 
    {
      combos = unique(group.phase[cb])
      
      for (g in 1:length(combos))
      {
        cat(paste0('R_Combine("Combination',combos[g],'")\n'),file=fn,append=TRUE)
        cat('{\n',file=fn,append=TRUE)
        
        ### Continue from here should loop through all dates within a combine group
        gg = which(group.phase==combos[g])
        
        for (ggg in 1:length(gg))
        {
          cat(paste('R_Date(','\"',id.phase[gg[ggg]],'\",',c14.phase[gg[ggg]],',',errors.phase[gg[ggg]],'){Outlier(0.05);};\n', sep = ""),file = fn, append = TRUE)
        } 
        
        cat('};\n',file=fn,append=TRUE)
      }
      
      id.phase = id.phase[-cb]
      c14.phase = c14.phase[-cb]
      errors.phase = errors.phase[-cb]
    }
    
    #then all other dates
    for (x in 1:length(c14.phase))
    {
      cat(paste('R_Date(','\"',id.phase[x],'\",',c14.phase[x],',',errors.phase[x],');\n', sep = ""),file = fn, append = TRUE)
    }
    cat('};\n', file = fn, append = TRUE)
    
    # Phase Boundary End
    if (model=="gaussian")
    {
      cat(paste0('Sigma_Boundary("End ', siteNames[k], '");\n'), file = fn, append = TRUE)
    }
    if (model=="uniform")
    {
      cat(paste0('Boundary("End ', siteNames[k], '");\n'), file = fn, append = TRUE)
    }
    if (model=="trapezoid")
    {
      cat(paste0('Boundary("End ', siteNames[k], '"){\n'), file = fn, append = TRUE)
      cat(paste0('Start("Start of End ', siteNames[k], '");\n'), file = fn, append = TRUE)
      cat(paste0('Transition("Period of End ', siteNames[k], '");\n'), file = fn, append = TRUE)
      cat(paste0('End("End of End ', siteNames[k], '");\n'), file = fn, append = TRUE)
      cat('};\n', file = fn, append = TRUE)
    }
    cat('};\n', file = fn, append = TRUE)
  }
  cat('};\n', file = fn, append = TRUE) 
  
  
  # MCMC Samples
  cat(paste("MCMC_Sample(\"", mcname, "\",", interval, ",", mcnsim, "){\n", sep = ""),file = fn,append = TRUE)
  
  if (model=="gaussian"|model=="uniform")
  {
    for (k in 1:nsite)
    {
      cat(paste0('Date("=Start ', siteNames[k], '");\n'), file = fn, append = TRUE)
      cat(paste0('Date("=End ', siteNames[k], '");\n'), file = fn, append = TRUE)
    }
  }
  
  if (model=="trapezoid")
  {
    for (k in 1:nsite)
    {
      cat(paste0('Date("=Start of Start ', siteNames[k], '");\n'),file = fn,append = TRUE)
      cat(paste0('Date("=End of Start ', siteNames[k], '");\n'),file = fn,append = TRUE)
      cat(paste0('Date("=Start of End ', siteNames[k], '");\n'),file = fn,append = TRUE)
      cat(paste0('Date("=End of End ', siteNames[k], '");\n'), file = fn, append = TRUE)
    }
  }
  cat('};\n', file = fn, append = TRUE)
  cat('};\n', file = fn, append = TRUE)
  
  
  close(export)
}

# ---------------------------------------------------------------------------
# Regional trapezoidal model script generator (Lee & Bronk Ramsey 2012)
# One script per region; each date = earliest per site
# Returns 4 posteriors: Onset, Peak, Decline, Disappear
# ---------------------------------------------------------------------------
oxcalRegionalTrapezoidScript <- function(region_name, c14ages, errors, lab_ids, fn, iterations = 30000, convergence_threshold = 95) {
  safe <- gsub("[^A-Za-z0-9]", "_", region_name)
  con  <- file(fn, "w")
  on.exit(close(con))

  cat("Plot(){\n",                                                file = con)
  cat(sprintf('  Options(){ MCMC_Iterations=%d; Convergence=%d; };\n', iterations, convergence_threshold), file = con)
  cat('  Outlier_Model("",N(0,2),0,"s");\n',                     file = con)
  cat("  Sequence(){\n",                                          file = con)

  # Start (onset) trapezoid boundary -----------------------------------------
  cat(sprintf('    Boundary("MidStart_%s"){\n', safe),            file = con)
  cat(sprintf('      Transition("Duration_Start_%s");\n', safe),  file = con)
  cat(sprintf('      Start("Onset_%s");\n',    safe),             file = con)
  cat(sprintf('      End("Peak_%s");\n',       safe),             file = con)
  cat("    };\n",                                                  file = con)

  # Phase: one date per site --------------------------------------------------
  cat(sprintf('    Phase("%s"){\n', safe),                        file = con)
  for (i in seq_along(c14ages)) {
    cat(sprintf('      R_Date("%s",%d,%d){Outlier(0.05);};\n',
                lab_ids[i], round(c14ages[i]), round(errors[i])), file = con)
  }
  cat("    };\n",                                                  file = con)

  # End (disappear) trapezoid boundary ----------------------------------------
  cat(sprintf('    Boundary("MidEnd_%s"){\n', safe),              file = con)
  cat(sprintf('      Start("Decline_%s");\n',   safe),            file = con)
  cat(sprintf('      Transition("Duration_End_%s");\n', safe),    file = con)
  cat(sprintf('      End("Disappear_%s");\n',  safe),             file = con)
  cat("    };\n",                                                  file = con)

  cat("  };\n", file = con)  # close Sequence
  cat("};\n",   file = con)  # close Plot
  invisible(fn)
}

