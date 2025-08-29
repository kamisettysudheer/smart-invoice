# Smart Invoice Mobile App - Setup & Running Guide

## ✅ What We've Built

A complete React Native mobile application for Excel invoice template management with the following features:

### 📱 Mobile App Components
- **Template List Screen**: View all templates with pull-to-refresh, search, and CRUD operations
- **Create Template Screen**: Form to create new templates with field mapping configuration
- **Template Detail Screen**: View template details, upload Excel files, download templates

### 🔧 Technical Stack
- **React Native 0.73.6** with Expo SDK 50
- **React Navigation** for screen routing
- **React Native Paper** for Material Design UI
- **Expo Document Picker** for file selection
- **Go Backend API** for template management

### 🌐 Backend Integration
- RESTful API endpoints for full CRUD operations
- File upload/download for Excel templates
- JSON-based storage with field mapping support

## 🚀 Running the Mobile App

### Prerequisites
1. **Node.js** (v16 or higher)
2. **Expo Go app** installed on your mobile device
3. **Go backend** running on port 8080

### Step 1: Start the Backend API
```bash
cd ../backend
go run cmd/api/main.go
```
✅ Backend should be running on http://localhost:8080

### Step 2: Install Mobile Dependencies (if not done)
```bash
cd mobile
npm install
```

### Step 3: Start Expo Development Server
```bash
# Option 1: Try Expo (recommended)
npx expo start

# Option 2: If file watching issues occur, use web mode
npx expo start --web

# Option 3: Alternative with tunnel for remote access
npx expo start --tunnel
```

### Step 4: Open on Mobile Device
1. **Android**: Open Expo Go app and scan the QR code
2. **iOS**: Open Camera app and scan the QR code, then open with Expo Go
3. **Web**: Browser will automatically open at http://localhost:19006

## 📁 Project Structure
```
mobile/
├── src/
│   ├── screens/
│   │   ├── TemplateListScreen.js     # Main list with CRUD operations
│   │   ├── CreateTemplateScreen.js   # Template creation form
│   │   └── TemplateDetailScreen.js   # Detail view with file upload
│   └── services/
│       └── ApiService.js             # HTTP client for backend API
├── App.js                            # Main app with navigation
├── app.json                          # Expo configuration
├── package.json                      # Dependencies and scripts
├── babel.config.js                   # Babel configuration
└── metro.config.js                   # Metro bundler config
```

## 🔧 API Endpoints Used
- `GET /api/v1/templates` - List all templates
- `POST /api/v1/templates` - Create new template
- `GET /api/v1/templates/:id` - Get template details
- `DELETE /api/v1/templates/:id` - Delete template
- `POST /api/v1/templates/:id/upload` - Upload Excel file
- `GET /api/v1/templates/:id/download` - Download Excel file

## 🛠️ Troubleshooting

### File Watching Issues (EMFILE)
If you encounter "too many open files" errors:
```bash
ulimit -n 65536
npx expo start --web
```

### Network Issues
- Ensure backend is running on port 8080
- Check that mobile device and computer are on same WiFi network
- Try using tunnel mode: `npx expo start --tunnel`

### Package Compatibility
If you see version warnings:
```bash
npx expo install --fix
```

## 📝 Features Implemented

### ✅ Template Management
- Create templates with field mappings (vendor_name, invoice_number, etc.)
- View template list with search and refresh
- Delete templates with confirmation
- Template detail view with metadata

### ✅ File Operations
- Upload Excel files (.xlsx, .xls) to templates
- Download Excel templates for offline use
- File validation and error handling
- Progress indicators during uploads

### ✅ User Experience
- Material Design interface
- Loading states and error handling
- Pull-to-refresh functionality
- Intuitive navigation between screens
- Form validation and user feedback

## 🎯 Next Steps (Future Enhancements)
- Add camera integration for invoice capture
- Implement OCR for data extraction
- Add offline capability with sync
- Include user authentication
- Add invoice processing workflow

The mobile app is now ready for use! The backend API is fully functional and the mobile interface provides a complete template management experience.
