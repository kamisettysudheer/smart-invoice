# Mobile App (React Native)

Cross-platform mobile application for iOS and Android that provides:
- Camera integration for document capture
- Image gallery selection
- Document preview and editing
- Offline capability with sync
- User authentication

## Structure

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
