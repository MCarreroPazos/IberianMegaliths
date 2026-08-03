# PowerShell script to facilitate Docker usage on Windows
# Usage: .\docker-helper.ps1 [command]

param(
    [Parameter(Position = 0)]
    [string]$Command = "help"
)

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

# Banner
function Show-Banner {
    Write-Host ""
    Write-Info "=============================================="
    Write-Info "  Iberian Megaliths - Docker Helper"
    Write-Info "=============================================="
    Write-Host ""
}

# Check if Docker is installed
function Test-Docker {
    try {
        $null = docker --version
        return $true
    }
    catch {
        Write-Error "Error: Docker is not installed or not in PATH"
        Write-Info "Install Docker Desktop from: https://www.docker.com/products/docker-desktop"
        return $false
    }
}

# Check if Docker is running
function Test-DockerRunning {
    try {
        $null = docker ps 2>&1
        return $true
    }
    catch {
        Write-Error "Error: Docker is not running"
        Write-Info "Start Docker Desktop and try again"
        return $false
    }
}

# Available commands
function Show-Help {
    Show-Banner
    Write-Host "Available commands:"
    Write-Host ""
    Write-Info "  build        " -NoNewline; Write-Host "- Build Docker image"
    Write-Info "  run          " -NoNewline; Write-Host "- Run all analyses"
    Write-Info "  rstudio      " -NoNewline; Write-Host "- Start RStudio Server (http://localhost:8787)"
    Write-Info "  shell        " -NoNewline; Write-Host "- Open interactive R session"
    Write-Info "  test         " -NoNewline; Write-Host "- Test complete reproducibility"
    Write-Info "  clean        " -NoNewline; Write-Host "- Clean containers and images"
    Write-Info "  status       " -NoNewline; Write-Host "- View container status"
    Write-Info "  logs         " -NoNewline; Write-Host "- View service logs"
    Write-Info "  init-renv    " -NoNewline; Write-Host "- Initialize renv (first time)"
    Write-Info "  help         " -NoNewline; Write-Host "- Show this help"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\docker-helper.ps1 build"
    Write-Host "  .\docker-helper.ps1 run"
    Write-Host "  .\docker-helper.ps1 rstudio"
    Write-Host ""
}

# Build image
function Invoke-Build {
    Write-Info "Building Docker image..."
    docker-compose build
    if ($LASTEXITCODE -eq 0) {
        Write-Success "✓ Image built successfully"
    }
    else {
        Write-Error "✗ Error building image"
    }
}

# Run analyses
function Invoke-Run {
    Write-Info "Running all analyses..."
    Write-Warning "This may take ~1.5 hours"
    docker-compose run --rm r-analysis Rscript docker/run_all.R
    if ($LASTEXITCODE -eq 0) {
        Write-Success "✓ Analysis completed"
        Write-Info "Check ../figures/ folder for results"
    }
    else {
        Write-Error "✗ Error during analysis"
    }
}

# Start RStudio
function Invoke-RStudio {
    Write-Info "Starting RStudio Server..."
    Write-Info "Open your browser at: http://localhost:8787"
    Write-Warning "Press Ctrl+C to stop"
    docker-compose up rstudio
}


# Interactive shell
function Invoke-Shell {
    Write-Info "Starting interactive R session..."
    Write-Info "Type 'q()' to exit"
    docker-compose run --rm r-analysis R
}

# Test reproducibility
function Invoke-Test {
    Write-Info "Testing complete reproducibility..."
    Write-Warning "This will rebuild the image from scratch"
    docker-compose build --no-cache
    docker-compose run --rm r-analysis Rscript docker/run_all.R
    if ($LASTEXITCODE -eq 0) {
        Write-Success "✓ Reproducibility test successful"
    }
    else {
        Write-Error "✗ Reproducibility test failed"
    }
}

# Clean up
function Invoke-Clean {
    Write-Warning "This will remove unused containers and images"
    $confirm = Read-Host "Continue? (y/n)"
    if ($confirm -eq 'y' -or $confirm -eq 'Y') {
        docker-compose down
        docker image prune -f
        Write-Success "✓ Cleanup completed"
    }
    else {
        Write-Info "Operation cancelled"
    }
}

# View status
function Invoke-Status {
    Write-Info "Running containers:"
    docker ps
    Write-Host ""
    Write-Info "Available images:"
    docker images | Select-String "iberian-megaliths"
}

# View logs
function Invoke-Logs {
    $service = Read-Host "Which service? (r-analysis/rstudio)"
    docker-compose logs $service
}

# Initialize renv
function Invoke-InitRenv {
    Write-Info "Initializing renv..."
    docker-compose run --rm r-analysis Rscript docker/init_renv.R
    if ($LASTEXITCODE -eq 0) {
        Write-Success "✓ renv initialized"
    }
    else {
        Write-Error "✗ Error initializing renv"
    }
}

# Main
Show-Banner

# Check Docker
if (-not (Test-Docker)) { exit 1 }
if (-not (Test-DockerRunning)) { exit 1 }

# Change to docker directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Execute command
switch ($Command.ToLower()) {
    "build" { Invoke-Build }
    "run" { Invoke-Run }
    "rstudio" { Invoke-RStudio }
    "shell" { Invoke-Shell }
    "test" { Invoke-Test }
    "clean" { Invoke-Clean }
    "status" { Invoke-Status }
    "logs" { Invoke-Logs }
    "init-renv" { Invoke-InitRenv }
    "help" { Show-Help }
    default { 
        Write-Error "Unknown command: $Command"
        Show-Help 
    }
}
