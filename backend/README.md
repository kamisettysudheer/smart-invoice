# Backend Service (Go)

Go-based REST API service that handles:
- User authentication and management
- Invoice processing coordination
- Excel template management
- File upload/download
- Integration with OCR service

## Structure

```
backend/
├── cmd/
│   ├── api/          # Main API server
│   ├── migrate/      # Database migrations
│   └── seed/         # Database seeding
├── internal/
│   ├── api/          # HTTP handlers and routes
│   ├── auth/         # Authentication middleware
│   ├── config/       # Configuration management
│   ├── database/     # Database connection and models
│   ├── excel/        # Excel processing logic
│   ├── services/     # Business logic
│   └── storage/      # File storage abstraction
├── pkg/
│   ├── logger/       # Logging utilities
│   └── validator/    # Request validation
├── configs/          # Configuration files
├── migrations/       # SQL migration files
└── tests/           # Test files
```

## Getting Started

1. Install dependencies: `go mod tidy`
2. Run tests: `go test ./...`
3. Run locally: `go run ./cmd/api`
4. Build: `go build -o bin/api ./cmd/api`
