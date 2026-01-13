# Testing with Expo Go

## ✅ What Works in Expo Go

- ✅ All app features (pins, map, search, navigation, pathfinding)
- ✅ Deep links: `campustrails://pin/123`
- ✅ User authentication and API calls
- ✅ All modals and UI features

## ⚠️ What Doesn't Work in Expo Go

- ❌ QR code scanner (requires native code from development build)
  - The QR scanner button will show a helpful message explaining this
  - Deep links work as an alternative way to open pins

## 🔗 Testing Deep Links in Expo Go

### Method 1: Using the HTML Test File

1. Start Expo: `npm start`
2. Open the app in Expo Go on your phone
3. Open `test-deep-links.html` in your phone's browser
4. Click any link to test deep linking

### Method 2: Direct Browser URL

Type in your phone's browser:
```
campustrails://pin/9
```

### Method 3: ADB Command (for Expo Go)

Expo Go uses a different package name, so use:
```bash
adb shell am start -W -a android.intent.action.VIEW -d 'campustrails://pin/9' host.exp.exponent
```

Note: Replace `host.exp.exponent` with the actual Expo Go package if different.

## 📱 Deep Link Examples

- `campustrails://pin/9` - Opens Building 9 (ICT Building)
- `campustrails://pin/1` - Opens Building 1 (Arts & Culture)
- `campustrails://pin/3` - Opens Building 3 (College of Medicine)
- `campustrails://pin/0` - Opens Main Entrance
- `campustrails://qr/ict_bldg_001` - Opens by QR code (if set in database)

## 🏗️ Building for Production (Later)

When you're ready to build a standalone app with QR scanner support:

1. **Install Java 21** (required for Android builds):
   ```bash
   sudo pacman -S jdk21-openjdk
   export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
   ```

2. **Build the app**:
   ```bash
   npx expo run:android
   ```

3. **Or use EAS Build** (cloud build, no local Java needed):
   ```bash
   eas build --profile development --platform android
   ```

## 💡 Tips

- Deep links work perfectly in Expo Go for testing
- QR scanner functionality can be tested later with a development build
- All other features work exactly as they will in production
