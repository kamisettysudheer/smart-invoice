# Smart Invoice - AI-Powered Receipt Processing App

An intelligent mobile application that captures invoices/receipts, extracts data using AI + OCR, and automatically fills Excel templates.

## Architecture

- **Mobile App**: React Native (iOS/Android)
- **Backend API**: Go (REST API)
- **OCR/AI Service**: Python (FastAPI)
- **Database**: PostgreSQL
- **Storage**: AWS S3 / Local storage

## Project Structure

```
├── mobile/          # React Native mobile app
├── backend/         # Go API service
├── ocr-service/     # Python OCR/AI service
├── infrastructure/  # Docker, K8s, terraform configs
├── docs/           # Documentation
└── .github/        # CI/CD workflows
```

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for mobile development)
- Go 1.21+ (for backend development)
- Python 3.11+ (for OCR service)

### Quick Start
```bash
# Clone the repository
git clone <repo-url>
cd smart-invoice

# Start all services with Docker Compose
docker-compose up -d

# For mobile development
cd mobile
npm install
npx react-native run-ios  # or run-android
```

## Development Workflow

1. Create feature branch from `main`
2. Make changes and commit
3. Push branch - CI pipeline runs automatically
4. Create PR - triggers additional checks
5. Merge to `main` - deploys to staging
6. Tag release - deploys to production

## CI/CD Status

[![Backend CI](https://github.com/kamisettysudheer/smart-invoice/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/kamisettysudheer/smart-invoice/actions/workflows/backend-ci.yml)
[![OCR Service CI](https://github.com/kamisettysudheer/smart-invoice/actions/workflows/ocr-ci.yml/badge.svg)](https://github.com/kamisettysudheer/smart-invoice/actions/workflows/ocr-ci.yml)
[![Mobile CI](https://github.com/kamisettysudheer/smart-invoice/actions/workflows/mobile-ci.yml/badge.svg)](https://github.com/kamisettysudheer/smart-invoice/actions/workflows/mobile-ci.yml)
