# Smart Invoice Mobile App

A React Native mobile application for managing Excel invoice templates with AI and OCR capabilities.

## Features

- **Template Management**: Create, view, edit, and delete Excel invoice templates
- **Excel File Upload**: Upload and manage Excel template files with field mappings
- **File Download**: Download Excel templates for offline use
- **Field Mapping**: Configure where invoice data should be placed in Excel cells
- **Material Design UI**: Clean, modern interface using React Native Paper

## Screens

1. **Template List Screen**: View all available templates with CRUD operations
2. **Create Template Screen**: Form to create new templates with field mappings
3. **Template Detail Screen**: View template details, upload Excel files, and manage templates

## Tech Stack

- **React Native 0.72.6**: Cross-platform mobile framework
- **React Navigation**: Screen navigation and routing
- **React Native Paper**: Material Design UI components
- **React Native Document Picker**: File selection functionality

## Installation

```bash
cd mobile
npm install

# For iOS
npx react-native run-ios

# For Android
npx react-native run-android
```

## Backend Integration

The app connects to a Go backend API running on `http://localhost:8080/api/v1` with the following endpoints:

- `GET /templates` - List all templates
- `POST /templates` - Create a new template
- `GET /templates/:id` - Get template details
- `DELETE /templates/:id` - Delete a template
- `POST /templates/:id/upload` - Upload Excel file
- `GET /templates/:id/download` - Download Excel file

## Project Structure

```
mobile/
├── src/
│   ├── screens/
│   │   ├── TemplateListScreen.js
│   │   ├── CreateTemplateScreen.js
│   │   └── TemplateDetailScreen.js
│   └── services/
│       └── ApiService.js
├── App.js
├── package.json
└── metro.config.js
```

## Configuration

Make sure the backend API is running on port 8080 before starting the mobile app. The API base URL can be changed in `src/services/ApiService.js`.

## Development

The app uses Material Design principles and is optimized for both iOS and Android platforms. All API calls are handled through the `ApiService` class for easy maintenance and testing.

```
mobile/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # Screen components
│   ├── navigation/      # Navigation configuration
│   ├── services/        # API and external services
│   ├── store/           # State management (Redux/Context)
│   ├── utils/           # Utility functions
│   ├── constants/       # App constants
│   └── assets/          # Images, fonts, etc.
├── android/             # Android-specific code
├── ios/                 # iOS-specific code
├── __tests__/           # Test files
└── package.json         # Dependencies
```

## Getting Started

1. Install dependencies: `npm install`
2. iOS setup: `cd ios && pod install`
3. Run on iOS: `npx react-native run-ios`
4. Run on Android: `npx react-native run-android`
5. Run tests: `npm test`
