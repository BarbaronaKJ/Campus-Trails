# APK Build Guide for Campus Trails

This guide will help you build a production APK for the Campus Trails app with all integrations (API, Database, Vercel) working correctly.

## Prerequisites

1. **Expo Account**: Sign up at https://expo.dev
2. **EAS CLI**: Install globally
   ```bash
   npm install -g eas-cli
   ```
3. **Expo Account Login**:
   ```bash
   eas login
   ```

## Pre-Build Checklist

### ✅ 1. API Configuration
- [x] API URL is set to Vercel production URL: `https://test-campus-trails.vercel.app`
- [x] NGROK_URL is set to `null` in `services/api.js` (for production builds)
- [x] All API endpoints are using the correct base URL

### ✅ 2. Vercel Deployment
- [x] Backend is deployed to Vercel: `https://test-campus-trails.vercel.app`
- [x] Environment variables are set in Vercel dashboard:
  - `MONGODB_URI` - Your MongoDB Atlas connection string
  - `JWT_SECRET` - Your JWT secret key
  - `JWT_EXPIRES_IN` - Token expiration (e.g., "7d")
  - `CORS_ORIGINS` - Set to "*" or specific origins
  - `NODE_ENV` - Set to "production"
  - `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
  - `CLOUDINARY_API_KEY` - Your Cloudinary API key
  - `CLOUDINARY_API_SECRET` - Your Cloudinary API secret

### ✅ 3. Database Configuration
- [x] MongoDB Atlas cluster is running
- [x] Database name is "CampusTrails" (not "campus-trails")
- [x] IP whitelist includes Vercel serverless function IPs (0.0.0.0/0 for all)
- [x] Database user has proper permissions

### ✅ 4. App Configuration
- [x] `app.json` has correct package name: `com.b4rb.interactivemap`
- [x] App version is set correctly
- [x] Icon and splash screen assets exist
- [x] Deep linking scheme is configured: `campustrails://`

## Building the APK

### Step 1: Configure EAS Build

The `eas.json` file is already configured. Review it:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

### Step 2: Build Preview APK (Recommended for Testing)

```bash
eas build --platform android --profile preview
```

This will:
- Build an APK file (not AAB)
- Allow internal distribution
- Use the preview profile

### Step 3: Build Production APK

```bash
eas build --platform android --profile production
```

**Note**: Production builds create AAB files by default. To get an APK from production build, you'll need to modify `eas.json`:

```json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### Step 4: Monitor Build Progress

EAS will provide a build URL. You can:
- Monitor progress in the terminal
- View build logs at the provided URL
- Check status at https://expo.dev

### Step 5: Download APK

Once the build completes:
1. Visit the build URL provided by EAS
2. Download the APK file
3. Install on Android device (enable "Install from unknown sources" if needed)

## Testing the APK

### 1. API Connectivity
- Open the app
- Check if pins load from the API
- Verify login/registration works
- Test feedback submission

### 2. Database Operations
- Create a new account
- Save some pins
- Submit feedback
- Verify data persists in MongoDB

### 3. Vercel Backend
- Check Vercel logs for API requests
- Verify all endpoints respond correctly
- Test authentication flow

### 4. Deep Linking
- Test QR code scanning (requires development build for native modules)
- Test deep link URLs: `campustrails://pin/9`

## Troubleshooting

### Issue: API calls fail in APK
**Solution**: 
- Verify `NGROK_URL` is set to `null` in `services/api.js`
- Check Vercel deployment is live
- Verify CORS settings in Vercel

### Issue: Database connection errors
**Solution**:
- Check MongoDB Atlas IP whitelist
- Verify `MONGODB_URI` in Vercel environment variables
- Check database name is "CampusTrails"

### Issue: Authentication not working
**Solution**:
- Verify JWT_SECRET is set in Vercel
- Check token expiration settings
- Verify API endpoints are correct

### Issue: QR Scanner not working
**Solution**:
- QR scanner requires a development build (not Expo Go)
- The APK build includes native modules
- Verify `expo-barcode-scanner` is in `app.json` plugins

## Environment Variables Checklist

### Vercel Dashboard Environment Variables:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/CampusTrails?retryWrites=true&w=majority
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGINS=*
NODE_ENV=production
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Build Commands Summary

```bash
# Login to Expo
eas login

# Build preview APK (for testing)
eas build --platform android --profile preview

# Build production APK
eas build --platform android --profile production

# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]
```

## Important Notes

1. **First Build**: The first build may take 15-20 minutes. Subsequent builds are faster.

2. **Build Credits**: EAS Build uses credits. Free tier includes limited builds.

3. **Native Modules**: The app uses `expo-barcode-scanner` which requires a development build (not Expo Go).

4. **API URL**: The app automatically uses Vercel URL in production builds (`!__DEV__`).

5. **Testing**: Always test the APK thoroughly before distribution.

## Post-Build Verification

- [ ] APK installs successfully on Android device
- [ ] App opens without crashes
- [ ] API calls work (pins load, login works)
- [ ] Database operations work (save pins, submit feedback)
- [ ] Authentication works (login, register, logout)
- [ ] Deep linking works (if applicable)
- [ ] All features function correctly

## Support

If you encounter issues:
1. Check EAS build logs
2. Check Vercel function logs
3. Check MongoDB Atlas logs
4. Review error messages in the app

---

**Last Updated**: January 2026
**Vercel URL**: https://test-campus-trails.vercel.app
**Database**: MongoDB Atlas - CampusTrails
