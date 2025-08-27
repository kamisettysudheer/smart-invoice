# OCR/AI Service (Python)

FastAPI-based microservice that handles:
- Image preprocessing and enhancement
- OCR text extraction using Tesseract
- AI-powered data extraction and structuring
- Confidence scoring and validation

## Structure

```
ocr-service/
├── src/
│   ├── main.py          # FastAPI application
│   ├── api/             # API routes
│   ├── core/            # Core configuration
│   ├── services/        # Business logic
│   │   ├── ocr/         # OCR processing
│   │   ├── ai/          # AI data extraction
│   │   └── preprocessing/ # Image preprocessing
│   ├── models/          # Pydantic models
│   └── utils/           # Utility functions
├── tests/               # Test files
├── configs/             # Configuration files
├── requirements.txt     # Python dependencies
└── requirements-dev.txt # Development dependencies
```

## Getting Started

1. Install dependencies: `pip install -r requirements.txt`
2. Run tests: `pytest`
3. Run locally: `uvicorn src.main:app --reload`
4. View docs: http://localhost:8000/docs
