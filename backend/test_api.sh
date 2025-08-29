#!/bin/bash

# Smart Invoice Backend API Test Script
echo "🧪 Testing Smart Invoice Backend API"
echo "===================================="

BASE_URL="http://localhost:8080"

echo ""
echo "1. Testing Health Check..."
curl -s "$BASE_URL/health" | jq .

echo ""
echo "2. Creating a new template..."
TEMPLATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/templates" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Basic Invoice Template",
    "description": "A simple invoice template for testing",
    "field_mappings": {
      "vendor_name": "B1",
      "invoice_number": "B2", 
      "invoice_date": "B3",
      "total_amount": "B4",
      "line_items_start": "A7"
    }
  }')

echo "$TEMPLATE_RESPONSE" | jq .

# Extract template ID for subsequent tests
TEMPLATE_ID=$(echo "$TEMPLATE_RESPONSE" | jq -r '.template.id')
echo ""
echo "Template ID: $TEMPLATE_ID"

echo ""
echo "3. Listing all templates..."
curl -s "$BASE_URL/api/v1/templates" | jq .

echo ""
echo "4. Getting specific template..."
curl -s "$BASE_URL/api/v1/templates/$TEMPLATE_ID" | jq .

echo ""
echo "5. Updating template..."
curl -s -X PUT "$BASE_URL/api/v1/templates/$TEMPLATE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description for the invoice template"
  }' | jq .

echo ""
echo "6. Testing file upload (if sample template exists)..."
if [ -f "uploads/templates/sample_template.xlsx" ]; then
  curl -s -X POST "$BASE_URL/api/v1/templates/$TEMPLATE_ID/upload" \
    -F "file=@uploads/templates/sample_template.xlsx" | jq .
  
  echo ""
  echo "7. Testing file download..."
  curl -s -o "downloaded_template.xlsx" "$BASE_URL/api/v1/templates/$TEMPLATE_ID/download"
  if [ -f "downloaded_template.xlsx" ]; then
    echo "✅ File downloaded successfully"
    ls -la downloaded_template.xlsx
  else
    echo "❌ File download failed"
  fi
else
  echo "⚠️  Sample template not found. Run 'cd examples && go run create_sample_template.go' first"
fi

echo ""
echo "8. Soft deleting template..."
curl -s -X DELETE "$BASE_URL/api/v1/templates/$TEMPLATE_ID" | jq .

echo ""
echo "9. Verifying template is hidden (should return empty list)..."
curl -s "$BASE_URL/api/v1/templates" | jq .

echo ""
echo "✅ API tests completed!"
