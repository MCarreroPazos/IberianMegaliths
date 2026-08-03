# Makefile to automate common project tasks

.PHONY: help build run clean test rstudio figures

# Default command: show help
help:
	@echo "==============================================  "
	@echo "Iberian Megaliths - Available Commands"
	@echo "=============================================="
	@echo ""
	@echo "  make build      - Build Docker image"
	@echo "  make run        - Run all analyses"
	@echo "  make rstudio    - Start RStudio Server"
	@echo "  make figures    - Generate all figures"
	@echo "  make test       - Test reproducibility"
	@echo "  make clean      - Clean temporary files"
	@echo "  make init-renv  - Initialize renv (first time)"
	@echo ""

# Build Docker image
build:
	docker-compose build

# Run all analyses
run:
	docker-compose run --rm r-analysis Rscript docker/run_all.R

# Start RStudio Server
rstudio:
	@echo "Starting RStudio Server at http://localhost:8787"
	docker-compose up rstudio


# Generate all figures
figures:
	docker-compose run --rm r-analysis Rscript docker/run_all.R

# Test reproducibility (clean build + run)
test:
	docker-compose build --no-cache
	docker-compose run --rm r-analysis Rscript docker/run_all.R

# Clean temporary files
clean:
	rm -rf figures/*.png figures/*.pdf
	docker-compose down
	docker image prune -f

# Initialize renv (first time only)
init-renv:
	docker-compose run --rm r-analysis Rscript docker/init_renv.R

# Update renv snapshot
snapshot:
	docker-compose run --rm r-analysis Rscript -e "renv::snapshot()"

# Restore packages from renv.lock
restore:
	docker-compose run --rm r-analysis Rscript -e "renv::restore()"
