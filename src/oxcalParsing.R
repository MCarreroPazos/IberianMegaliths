# Functions to parse OxCal JS/CSV output and extract MCMC samples

#' Parse OxCal JS output lines
#' @param lines character vector of lines from an OxCal .csv/.js file
#' @return a list with names, posterior starts, resolutions, and probabilities
parse_oxcal_output <- function(lines) {
  idx_name <- list(); idx_ps <- list(); idx_pr <- list(); idx_pp <- list(); idx_conv <- list()
  
  for (line in lines) {
    # Extract name
    m <- regexec('ocd\\[(\\d+)\\]\\.name="([^"]*)"', line, perl = TRUE)
    cap <- regmatches(line, m)[[1]]
    if (length(cap) == 3) { idx_name[[cap[2]]] <- cap[3]; next }
    
    # Extract posterior start
    m <- regexec('ocd\\[(\\d+)\\]\\.posterior\\.start=([\\d.eE+\\-]+)', line, perl = TRUE)
    cap <- regmatches(line, m)[[1]]
    if (length(cap) == 3) { idx_ps[[cap[2]]] <- as.numeric(cap[3]); next }
    
    # Extract posterior resolution
    m <- regexec('ocd\\[(\\d+)\\]\\.posterior\\.resolution=([\\d.eE+\\-]+)', line, perl = TRUE)
    cap <- regmatches(line, m)[[1]]
    if (length(cap) == 3) { idx_pr[[cap[2]]] <- as.numeric(cap[3]); next }
    
    # Extract convergence
    m <- regexec('ocd\\[(\\d+)\\]\\.posterior\\.convergence=([\\d.eE+\\-]+)', line, perl = TRUE)
    cap <- regmatches(line, m)[[1]]
    if (length(cap) == 3) { idx_conv[[cap[2]]] <- as.numeric(cap[3]); next }

    # Extract posterior probability array
    m <- regexec('ocd\\[(\\d+)\\]\\.posterior\\.prob=\\[([^\\]]+)\\]', line, perl = TRUE)
    cap <- regmatches(line, m)[[1]]
    if (length(cap) == 3) { 
      idx_pp[[cap[2]]] <- as.numeric(strsplit(cap[3], ",\\s*")[[1]])
      next 
    }
    
    # Extract AModel
    m <- regexec('model\\.modelAgreement=([\\d.eE+\\-]+)', line, perl = TRUE)
    cap <- regmatches(line, m)[[1]]
    if (length(cap) == 2) { 
      idx_amodel <- as.numeric(cap[2])
      next 
    }
  }
  
  return(list(
    names      = idx_name, 
    post_start = idx_ps, 
    post_res   = idx_pr, 
    post_prob  = idx_pp,
    convergence = idx_conv,
    amodel     = if(exists("idx_amodel")) idx_amodel else NA_real_
  ))
}

#' Draw random samples from a parsed posterior
#' @param parsed list returned by parse_oxcal_output
#' @param label character string of the parameter name in OxCal
#' @param nsim number of samples to draw
#' @return numeric vector of samples
draw_samples <- function(parsed, label, nsim) {
  # Map label to index
  name_to_idx <- setNames(names(parsed$names), unlist(parsed$names))
  idx <- name_to_idx[[label]]
  
  if (is.null(idx)) return(rep(NA_real_, nsim))
  
  ps   <- parsed$post_start[[idx]]
  pr   <- parsed$post_res[[idx]]
  prob <- parsed$post_prob[[idx]]
  
  if (is.null(ps) || is.null(pr) || is.null(prob)) return(rep(NA_real_, nsim))
  
  # Clean probabilities
  prob[is.na(prob) | prob < 0] <- 0
  if (sum(prob) == 0) return(rep(NA_real_, nsim))
  
  # Generate calendar years and sample
  years <- ps + (seq_along(prob) - 1L) * pr
  return(sample(years, nsim, replace = TRUE, prob = prob / sum(prob)))
}

#' Build MCMC matrix for all sites in a parsed result
#' @param parsed list returned by parse_oxcal_output
#' @param nsim number of samples
#' @return matrix (nsim x 2*Nsites)
extract_mcmc_matrix <- function(parsed, nsim) {
  all_names   <- unlist(parsed$names)
  idx_with_pp <- names(parsed$post_prob)
  
  # Find all valid site-boundary pairs
  ss_names <- grep("^Start of Start ", all_names, value = TRUE)
  ee_names <- grep("^End of End ",     all_names, value = TRUE)
  
  sids <- intersect(
    sub("^Start of Start ", "", ss_names), 
    sub("^End of End ",     "", ee_names)
  )
  
  if (length(sids) == 0) return(NULL)
  
  # Build matrix
  mat <- matrix(NA_real_, nrow = nsim, ncol = 2L * length(sids))
  for (i in seq_along(sids)) {
    mat[, 2L*i - 1L] <- draw_samples(parsed, paste("Start of Start", sids[i]), nsim)
    mat[, 2L*i     ] <- draw_samples(parsed, paste("End of End",     sids[i]), nsim)
  }
  
  return(mat)
}

#' Extract the 4 regional trapezoidal posteriors from a parsed OxCal output
#' @param parsed      list returned by parse_oxcal_output()
#' @param region_name character string matching the region used in the script
#' @param nsim        number of samples to draw
#' @return named list: onset, peak, decline, disappear (BC/AD calendar years)
extract_regional_posteriors <- function(parsed, region_name, nsim) {
  safe <- gsub("[^A-Za-z0-9]", "_", region_name)
  
  # Helper to get convergence for a label
  get_conv <- function(label) {
    name_to_idx <- setNames(names(parsed$names), unlist(parsed$names))
    idx <- name_to_idx[[label]]
    if (is.null(idx)) return(NA_real_)
    val <- parsed$convergence[[idx]]
    if (is.null(val)) return(NA_real_)
    return(val)
  }

  list(
    onset     = draw_samples(parsed, paste0("Onset_",     safe), nsim),
    peak      = draw_samples(parsed, paste0("Peak_",      safe), nsim),
    decline   = draw_samples(parsed, paste0("Decline_",   safe), nsim),
    disappear = draw_samples(parsed, paste0("Disappear_", safe), nsim),
    convergence = c(
      onset     = get_conv(paste0("Onset_",     safe)),
      peak      = get_conv(paste0("Peak_",      safe)),
      decline   = get_conv(paste0("Decline_",   safe)),
      disappear = get_conv(paste0("Disappear_", safe))
    ),
    Amodel = parsed$amodel
  )
}
