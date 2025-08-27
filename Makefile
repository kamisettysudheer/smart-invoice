.PHONY: help build up down logs clean test lint format deps

# Default target
help: ## Show this help message
	@echo "Smart Invoice - Development Commands"
	@echo "======================================"
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development
deps: ## Install all dependencies
	@echo "Installing dependencies..."
	@if [ -d "backend" ]; then cd backend && go mod tidy; fi
	@if [ -d "ocr-service" ]; then cd ocr-service && pip install -r requirements.txt; fi
	@if [ -d "mobile" ]; then cd mobile && npm install; fi

build: ## Build all Docker images
	@echo "Building Docker images..."
	docker-compose build --parallel

up: ## Start all services
	@echo "Starting all services..."
	docker-compose up -d
	@echo "Services started. Check status with 'make status'"

down: ## Stop all services
	@echo "Stopping all services..."
	docker-compose down

restart: down up ## Restart all services

logs: ## Show logs from all services
	docker-compose logs -f

status: ## Show status of all services
	docker-compose ps

##@ Testing
test: ## Run all tests
	@echo "Running tests..."
	@if [ -d "backend" ]; then cd backend && go test ./...; fi
	@if [ -d "ocr-service" ]; then cd ocr-service && pytest; fi
	@if [ -d "mobile" ]; then cd mobile && npm test; fi

test-backend: ## Run backend tests only
	@if [ -d "backend" ]; then cd backend && go test -v ./...; fi

test-ocr: ## Run OCR service tests only
	@if [ -d "ocr-service" ]; then cd ocr-service && pytest -v; fi

test-mobile: ## Run mobile tests only
	@if [ -d "mobile" ]; then cd mobile && npm test; fi

##@ Code Quality
lint: ## Run linting on all services
	@echo "Running linting..."
	@if [ -d "backend" ]; then cd backend && golangci-lint run; fi
	@if [ -d "ocr-service" ]; then cd ocr-service && flake8 src/ tests/; fi
	@if [ -d "mobile" ]; then cd mobile && npm run lint; fi

format: ## Format code in all services
	@echo "Formatting code..."
	@if [ -d "backend" ]; then cd backend && go fmt ./...; fi
	@if [ -d "ocr-service" ]; then cd ocr-service && black src/ tests/; fi
	@if [ -d "mobile" ]; then cd mobile && npm run format; fi

##@ Database
db-migrate: ## Run database migrations
	@echo "Running database migrations..."
	docker-compose exec backend go run ./cmd/migrate

db-seed: ## Seed database with test data
	@echo "Seeding database..."
	docker-compose exec backend go run ./cmd/seed

db-reset: ## Reset database (WARNING: This will delete all data)
	@echo "Resetting database..."
	docker-compose exec postgres psql -U postgres -d smart_invoice -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	@make db-migrate
	@make db-seed

##@ Cleanup
clean: ## Clean up containers, images, and volumes
	@echo "Cleaning up..."
	docker-compose down -v
	docker system prune -f
	docker volume prune -f

clean-all: ## Clean everything including images
	@echo "Cleaning everything..."
	docker-compose down -v --rmi all
	docker system prune -a -f
	docker volume prune -f

##@ Monitoring
health: ## Check health of all services
	@echo "Checking service health..."
	@curl -s http://localhost:8080/health | jq . || echo "Backend not responding"
	@curl -s http://localhost:8000/health | jq . || echo "OCR service not responding"
	@curl -s http://localhost/health | jq . || echo "Nginx not responding"

##@ Mobile Development
mobile-ios: ## Run mobile app on iOS simulator
	@if [ -d "mobile" ]; then cd mobile && npx react-native run-ios; fi

mobile-android: ## Run mobile app on Android emulator
	@if [ -d "mobile" ]; then cd mobile && npx react-native run-android; fi

mobile-bundle-ios: ## Build iOS bundle
	@if [ -d "mobile" ]; then cd mobile && npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output ios/main.jsbundle; fi

mobile-bundle-android: ## Build Android bundle
	@if [ -d "mobile" ]; then cd mobile && npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle; fi

##@ Production
deploy-staging: ## Deploy to staging environment
	@echo "Deploying to staging..."
	# Add staging deployment commands here

deploy-prod: ## Deploy to production environment
	@echo "Deploying to production..."
	# Add production deployment commands here

backup: ## Backup database
	@echo "Creating database backup..."
	docker-compose exec postgres pg_dump -U postgres smart_invoice > backup_$$(date +%Y%m%d_%H%M%S).sql
