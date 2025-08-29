# Deploy Smart Invoice Mobile App to Render

## 📋 Prerequisites
- Render account (https://render.com)
- GitHub repository with your code
- Backend API deployed (for API integration)

## 🚀 Deployment Steps

### 1. Connect GitHub Repository
1. Log in to Render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub account
4. Select your `smart-invoice` repository

### 2. Configure Deployment Settings
```yaml
# Basic Settings
Name: smart-invoice-mobile
Environment: Docker
Region: Oregon (or closest to your users)
Branch: main

# Build Settings
Build Command: (leave empty - Docker handles this)
Start Command: (leave empty - Docker handles this)
```

### 3. Dockerfile Configuration
The included `Dockerfile` will:
- ✅ Build Expo web version of your React Native app
- ✅ Serve via optimized nginx server
- ✅ Include health checks
- ✅ Handle client-side routing
- ✅ Compress assets with gzip

### 4. Environment Variables
Add these in Render dashboard under "Environment":

```bash
NODE_ENV=production
EXPO_PUBLIC_API_URL=https://your-backend-api.onrender.com/api/v1
```

**Important**: Replace `your-backend-api.onrender.com` with your actual backend URL.

### 5. Update API Service Configuration
Update your mobile app's API base URL:

In `src/services/ApiService.js`:
```javascript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
```

### 6. Deploy
1. Click "Create Web Service"
2. Render will automatically:
   - Pull your code
   - Build the Docker container
   - Deploy the web app

## 🌐 Access Your App
After deployment, your mobile app will be available at:
```
https://smart-invoice-mobile.onrender.com
```

## 📱 Mobile Access
Users can access your app via:
1. **Web Browser**: Direct URL access on any device
2. **PWA**: Can be installed as an app on mobile devices
3. **QR Code**: Generate QR code for easy mobile access

## 🔧 Build Commands Reference
```bash
# Local development
npm start                 # Start Expo dev server
npm run web              # Start web development

# Production build
npm run build            # Build for production
npm run build:production # Build with optimization

# Docker build (local testing)
docker build -t smart-invoice-mobile .
docker run -p 80:80 smart-invoice-mobile
```

## 🛠️ Troubleshooting

### Build Failures
- Check that all dependencies are in `package.json`
- Verify Expo configuration in `app.json`
- Ensure build script exists

### Runtime Errors
- Check environment variables
- Verify API URL is accessible
- Check browser console for errors

### Performance Issues
- Assets are automatically compressed
- Nginx caching is configured
- Health checks ensure uptime

## 📊 Monitoring
- Render provides built-in logging
- Health check endpoint: `/health`
- Monitor build times and performance

Your React Native app is now deployed as a web application accessible from any device! 🎉
