.PHONY: build run test clean deps sample-template help

# Default target
help: ## Show this help message
	@echo "Smart Invoice Backend Commands"
	@echo "=============================="
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

deps: ## Install dependencies
	go mod tidy
	go mod download

build: ## Build the application
	go build -o bin/smart-invoice-api ./cmd/api

run: ## Run the application
	go run ./cmd/api

run-bg: ## Run the application in background
	nohup go run ./cmd/api > server.log 2>&1 &
	@echo "Server started in background. Check server.log for output."

test: ## Run tests
	go test ./...

clean: ## Clean build artifacts
	rm -rf bin/
	rm -f server.log
	rm -f downloaded_template.xlsx

sample-template: ## Generate sample Excel template
	cd examples && go run create_sample_template.go

db-start: ## Start PostgreSQL with Docker
	docker run --name smart-invoice-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=smart_invoice -p 5432:5432 -d postgres:15-alpine

db-stop: ## Stop PostgreSQL container
	docker stop smart-invoice-postgres || true
	docker rm smart-invoice-postgres || true

test-api: ## Run API tests (requires server to be running)
	./test_api.sh

dev: deps sample-template run ## Full development setup

# Production targets
prod-build: ## Build for production
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o bin/smart-invoice-api ./cmd/api

docker-build: ## Build Docker image
	docker build -t smart-invoice-backend -f ../backend.Dockerfile .

docker-run: ## Run with Docker
	docker-compose -f ../docker-compose.yml up backend
