# Smart Invoice Backend - Excel Template Management

A minimal Go backend service for managing Excel templates with basic CRUD operations.

## Features

- ✅ **Template Management**: Create, read, update, delete Excel templates
- ✅ **File Upload**: Upload .xlsx files and associate with templates
- ✅ **Field Mapping**: Define how data maps to Excel cells
- ✅ **File Download**: Download template files
- ✅ **PostgreSQL Storage**: Store template metadata in database
- ✅ **REST API**: Simple JSON API endpoints

## Quick Start

### 1. Setup Database
```bash
# Start PostgreSQL (using Docker)
docker run --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=smart_invoice -p 5432:5432 -d postgres

# Or use existing PostgreSQL instance
```

### 2. Environment Variables
```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Run the Service
```bash
go mod tidy
go run cmd/api/main.go
```

Server starts on `http://localhost:8080`

## API Endpoints

### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/templates` | List all templates |
| GET | `/api/v1/templates/:id` | Get template by ID |
| POST | `/api/v1/templates` | Create new template |
| PUT | `/api/v1/templates/:id` | Update template |
| DELETE | `/api/v1/templates/:id` | Delete template |
| POST | `/api/v1/templates/:id/upload` | Upload Excel file |
| GET | `/api/v1/templates/:id/download` | Download Excel file |

### Example Usage

#### 1. Create a Template
```bash
curl -X POST http://localhost:8080/api/v1/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Basic Invoice Template",
    "description": "Simple invoice template",
    "field_mappings": {
      "vendor_name": "B1",
      "invoice_number": "B2", 
      "invoice_date": "B3",
      "total_amount": "B4"
    }
  }'
```

#### 2. Upload Excel File
```bash
curl -X POST http://localhost:8080/api/v1/templates/{template_id}/upload \
  -F "file=@template.xlsx"
```

#### 3. List Templates
```bash
curl http://localhost:8080/api/v1/templates
```

#### 4. Download Template
```bash
curl http://localhost:8080/api/v1/templates/{template_id}/download -o template.xlsx
```

## Template Structure

Templates consist of:
- **Metadata**: Name, description, created/updated dates
- **Field Mappings**: JSON object mapping field names to Excel cell references
- **File**: Actual .xlsx file stored on disk

### Field Mapping Example
```json
{
  "vendor_name": "B1",
  "invoice_number": "B2", 
  "invoice_date": "B3",
  "total_amount": "B4",
  "line_items_start": "A7"
}
```

## Database Schema

```sql
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_url VARCHAR(512),
    field_mappings JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Dependencies

- `gin-gonic/gin` - HTTP web framework
- `lib/pq` - PostgreSQL driver  
- `xuri/excelize/v2` - Excel file processing
- `google/uuid` - UUID generation
- `joho/godotenv` - Environment variable loading
