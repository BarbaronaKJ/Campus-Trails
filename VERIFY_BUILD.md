# Pre-Build Verification Checklist

Use this checklist to ensure everything is configured correctly before building the APK.

## ✅ API Configuration

- [ ] `services/api.js` - NGROK_URL is set to `null`
- [ ] `services/api.js` - Production URL is `https://test-campus-trails.vercel.app`
- [ ] All API endpoints use `API_BASE_URL` variable

## ✅ Vercel Deployment

- [ ] Backend is deployed: https://test-campus-trails.vercel.app
- [ ] Health check works: https://test-campus-trails.vercel.app/health
- [ ] All environment variables are set in Vercel dashboard:
  - [ ] `MONGODB_URI`
  - [ ] `JWT_SECRET`
  - [ ] `JWT_EXPIRES_IN`
  - [ ] `CORS_ORIGINS`
  - [ ] `NODE_ENV=production`
  - [ ] `CLOUDINARY_CLOUD_NAME`
  - [ ] `CLOUDINARY_API_KEY`
  - [ ] `CLOUDINARY_API_SECRET`

## ✅ Database (MongoDB Atlas)

- [ ] Database name is "CampusTrails" (not "campus-trails")
- [ ] Connection string is correct
- [ ] IP whitelist includes 0.0.0.0/0 (or Vercel IPs)
- [ ] Database user has read/write permissions
- [ ] Test connection from Vercel functions

## ✅ App Configuration

- [ ] `app.json` - Package name: `com.b4rb.interactivemap`
- [ ] `app.json` - Version is correct
- [ ] `app.json` - Icon exists: `./assets/icon.png`
- [ ] `app.json` - Splash screen exists: `./assets/splash-icon.png`
- [ ] `app.json` - Deep linking scheme: `campustrails`
- [ ] `eas.json` - Build profiles are configured

## ✅ Dependencies

- [ ] All dependencies are installed: `npm install`
- [ ] No dependency conflicts
- [ ] Native modules are properly configured:
  - [ ] `expo-barcode-scanner` in plugins
  - [ ] `react-native-qrcode-svg` installed

## ✅ Testing

- [ ] Test API endpoints manually:
  ```bash
  curl https://test-campus-trails.vercel.app/health
  curl https://test-campus-trails.vercel.app/api/pins
  ```
- [ ] Test authentication flow
- [ ] Test database operations
- [ ] Test image uploads (Cloudinary)

## ✅ Build Configuration

- [ ] EAS CLI is installed: `npm install -g eas-cli`
- [ ] Logged in to Expo: `eas login`
- [ ] Project is linked: `eas init` (if needed)
- [ ] `eas.json` is configured correctly

## Quick Verification Commands

```bash
# Check API health
curl https://test-campus-trails.vercel.app/health

# Check if logged in to Expo
eas whoami

# Check EAS configuration
eas build:configure

# Test build locally (optional)
npx expo prebuild
```

## Common Issues and Solutions

### API Not Working in APK
- **Issue**: NGROK_URL is still set
- **Fix**: Set `NGROK_URL = null` in `services/api.js`

### Database Connection Failed
- **Issue**: Wrong database name or connection string
- **Fix**: Verify `MONGODB_URI` in Vercel, ensure database is "CampusTrails"

### Build Fails
- **Issue**: Missing dependencies or configuration
- **Fix**: Run `npm install`, check `eas.json`, verify `app.json`

### Authentication Not Working
- **Issue**: JWT_SECRET not set or incorrect
- **Fix**: Verify environment variables in Vercel dashboard

---

**Once all items are checked, you're ready to build!**

Run: `eas build --platform android --profile preview`
