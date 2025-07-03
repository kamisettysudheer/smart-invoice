# 📝 Smart Invoice Exploration Notes & TODOs

## 1. Core Features Implementation

- [ ] **Invoice Builder UI & Logic** (Frontend, Backend)  
  - Form for client, line items, tax, discounts, due date, notes, status  
  - Auto-increment invoice number  
  **Estimation:** 3-4 days (5 points)

- [ ] **Templating System** (Frontend, Backend)  
  - Built-in HTML/Excel templates  
  - Upload custom Excel template with placeholders  
  - Template versioning & preview  
  **Estimation:** 4-5 days (8 points)

- [ ] **File Generation** (Backend)  
  - PDF from HTML, Excel from template  
  - Dynamic token replacement  
  **Estimation:** 3 days (5 points)

- [ ] **Branding Options** (Frontend, Backend)  
  - Logo upload, tax rate, footer, signature, currency/date format  
  **Estimation:** 2 days (3 points)

- [ ] **Bulk Data Upload & API** (Backend)  
  - Upload JSON/CSV to bulk generate invoices  
  - REST API endpoints  
  **Estimation:** 3 days (5 points)

## 2. Key Modules Breakdown

- [ ] **Invoice Engine**: Totals, taxes, discounts logic (2 points)
- [ ] **Template Processor**: Token replacement, template loading (3 points)
- [ ] **File Exporter**: PDF/Excel generation (3 points)
- [ ] **Uploader**: Excel template upload (2 points)
- [ ] **Preview Renderer**: Invoice preview before download (2 points)
- [ ] **API Layer**: REST endpoints (3 points)

## 3. Optional/Future Enhancements

- [ ] User system (auth, user-specific templates) (5 points)
- [ ] Webhooks for payment status (2 points)
- [ ] Payment integration (Stripe/Razorpay) (4 points)
- [ ] Recurring invoices/subscriptions (3 points)
- [ ] Email sending (2 points)
- [ ] CLI tool or NPM package (3 points)
- [ ] Multilingual/multi-currency (3 points)
- [ ] GPT-based smart filler (4 points)

## 4. Tech/Infra Tasks

- [ ] Dockerize backend & frontend (2 points)
- [ ] Set up CI/CD (GitHub Actions) (2 points)
- [ ] Deployment (Railway/GCP) (2 points)

---

### ⏳ **Total Estimation:**


## Next Steps
1. Set up DB schema for invoices, templates, users
2. Scaffold Go backend (API, file handling, template logic)
3. Scaffold React frontend (invoice builder, template upload, preview)
4. Implement core invoice builder and PDF/Excel generation
5. Add template upload & preview
6. Add branding and settings
7. Expose REST APIs and test with sample data
8. Dockerize and deploy MVP


> **Tip:** Tackle one module at a time. Start with invoice builder and file generation, then add template and branding features.

---

## 🔍 Module Deep Dive

### 1. Invoice Engine
* **Data Model:** Invoice, LineItem, Client, Tax, Discount, Status, Dates
* **Logic:**
  - Calculate subtotal, tax, discount, total
  - Auto-increment invoice number
  - Status transitions (Draft, Sent, Paid, Overdue)
* **Validation:** Required fields, valid numbers, date checks
* **Extensibility:** Support for custom fields (future)

### 2. Template Processor
* **Token System:** Define and document all supported tokens (e.g., `{{client_name}}`, `{{total}}`)
* **Template Types:** HTML (for PDF), Excel (.xlsx)
* **Parsing:**
  - Load template file
  - Replace tokens with invoice data
  - Handle missing/invalid tokens gracefully
* **Versioning:** Store template versions, allow preview before save

### 3. File Exporter
* **PDF Generation:**
  - Use HTML template + data → PDF (e.g., wkhtmltopdf)
  - Support for logo, branding, custom styles
* **Excel Generation:**
  - Use Excel template + data → .xlsx (xuri/excelize)
  - Dynamic cell replacement
* **Download/Storage:** Serve file for download, optionally store in DB or cloud

### 4. Uploader
* **Frontend:** File input for Excel template upload
* **Backend:**
  - Validate file type/size
  - Parse and check for required tokens
  - Store template metadata (name, version, owner)

### 5. Preview Renderer
* **Live Preview:**
  - Render invoice with selected template and data before export
  - Show errors for missing data/tokens
* **Frontend:** Use iframe or modal for PDF/HTML preview, Excel preview as table

### 6. API Layer
* **REST Endpoints:**
  - CRUD for invoices, templates
  - File upload/download
  - Bulk invoice generation
* **Validation & Auth:**
  - Input validation, error handling
  - (Optional) JWT-based user auth

### 7. Branding Options
* **Logo Upload:** Image upload, preview, and storage
* **Settings:** Tax rate, footer, signature, currency, date format
* **Persistence:** Save per user/org (if multi-user)

### 8. Bulk Data Upload
* **Supported Formats:** JSON, CSV
* **Mapping:** Map columns/fields to invoice data
* **Batch Processing:** Generate multiple invoices, return status for each

---

> For each module, break work into backend (Go) and frontend (React) subtasks. Add tests for all business logic and API endpoints.
