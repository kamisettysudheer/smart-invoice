# Smart Invoice

A modern invoice management system built with Go backend and React frontend.

## Features

- Generate professional invoices
- Export to PDF and Excel formats
- Template management
- Database storage
- RESTful API

## Project Structure

```
smart-invoice/
│
├── backend/                 # Go backend server
│   ├── main.go             # Entry point
│   ├── handlers/           # HTTP request handlers
│   ├── templates/          # Invoice templates
│   ├── services/           # Business logic services
│   │   ├── pdf/           # PDF generation service
│   │   └── excel/         # Excel export service
│   └── db/                # Database models and migrations
│
├── frontend/               # React frontend application
│   ├── src/               # Source code
│   │   ├── components/    # React components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   └── utils/        # Utility functions
│   └── public/templates/  # Static template files
│
├── docker-compose.yml     # Docker compose configuration
└── README.md             # This file
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Go 1.19+ (for local development)
- Node.js 18+ (for local development)

### Running with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Local Development

#### Backend
```bash
cd backend
go mod init smart-invoice
go mod tidy
go run main.go
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

## API Endpoints

- `GET /` - Health check
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/:id` - Get invoice by ID
- `GET /api/invoices/:id/pdf` - Download invoice as PDF
- `GET /api/invoices/:id/excel` - Download invoice as Excel

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
