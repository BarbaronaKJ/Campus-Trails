# APK Build Checklist

## Pre-Build Checks ✅

### 1. Code Quality
- [x] No syntax errors (verified with `node -c App.js`)
- [x] All imports are correct
- [x] All required functions are defined (validateUsername, validatePassword)
- [x] Secret question/answer implementation complete
- [x] Registration includes secret question/answer

### 2. Dependencies
- [x] All required packages installed
- [x] Expo SDK 52 compatible packages
- [x] react-native-webview included (for future use)
- [x] All native modules properly configured

### 3. Assets
- [x] icon.png exists
- [x] splash-icon.png exists
- [x] ustp-cdo-map.png exists
- [x] USTP.jpg exists
- [x] logo-no-bg.png exists

### 4. Configuration
- [x] app.json properly configured
- [x] eas.json configured for APK builds
- [x] metro.config.js configured
- [x] .gitignore updated

### 5. Known Warnings (Non-Critical)
- ⚠️ `@expo/config-plugins` in devDependencies (can be ignored, used by Expo)
- ⚠️ Some unmaintained packages (react-native-image-pan-zoom, react-native-image-zoom-viewer) - but they work
- ⚠️ Some packages not in React Native Directory (bcryptjs, cors, dotenv, express, jsonwebtoken, mongoose, nodemailer) - these are backend packages, safe to ignore

## Features to Test After Build

### Authentication
- [ ] User registration (with secret question/answer)
- [ ] User login
- [ ] Forgot password (secret question flow)
- [ ] Password reset
- [ ] Logout

### Core Features
- [ ] Map display (USTP-CDO campus)
- [ ] Pin display and interaction
- [ ] Search functionality
- [ ] Filter pins by category
- [ ] View all pins
- [ ] Pathfinding (Point A to Point B)
- [ ] Saved pins
- [ ] Campus selection

### User Features
- [ ] User profile
- [ ] Profile picture upload
- [ ] Settings
- [ ] Notifications
- [ ] Feedback submission
- [ ] About Us section

### Data Sync
- [ ] Pins sync from API
- [ ] Campuses sync from API
- [ ] User data sync
- [ ] Offline functionality (cached data)

## Build Commands

### For Preview/Testing APK:
```bash
eas build --platform android --profile preview
```

### For Production APK:
```bash
eas build --platform android --profile production
```

### Local Build (if configured):
```bash
npx expo run:android
```

## Common Build Issues & Solutions

### Issue: Missing assets
**Solution:** Ensure all assets referenced in code exist in `assets/` folder

### Issue: Native module errors
**Solution:** Run `npx expo prebuild --clean` then rebuild

### Issue: Metro bundler errors
**Solution:** Clear cache: `npx expo start --clear`

### Issue: API connection errors
**Solution:** Ensure `API_BASE_URL` environment variable is set correctly

## Post-Build Testing

1. **Install APK** on Android device
2. **Test all authentication flows**
3. **Test map and pin interactions**
4. **Test search and pathfinding**
5. **Test user profile features**
6. **Test offline functionality**
7. **Check for crashes or errors**

## Notes

- The app uses Expo SDK 52
- New Architecture is enabled (`newArchEnabled: true`)
- Deep linking is configured (`campustrails://`)
- Push notifications are configured
- QR code scanning requires development build (not available in Expo Go)
