# Expo Go Network Request Fix

## Problem
When testing the app in Expo Go on physical devices, network requests were failing with:
```
Error fetching pins from API: [TypeError: Network request failed]
Error fetching campuses from API: [TypeError: Network request failed]
```

## Root Cause
Expo Go runs on physical devices and cannot access:
- `localhost:3000` (only works on simulators/emulators)
- `10.0.2.2:3000` (only works on Android emulator)

Physical devices need either:
- A publicly accessible URL (like Vercel)
- NGROK tunnel
- Local network IP address

## Solution Applied

### Updated `services/api.js`

1. **Imported `expo-constants`** to detect Expo Go environment
2. **Added Expo Go detection** using `Constants.executionEnvironment === 'storeClient'`
3. **Default to Vercel URL** when running in Expo Go

### API URL Selection Logic

```javascript
// Priority order:
1. Production builds (APK) → Vercel URL
2. NGROK_URL (if set) → Use NGROK for local testing
3. Expo Go (storeClient) → Vercel URL (for physical devices)
4. Emulators/Simulators → localhost/10.0.2.2
```

### Configuration

- **Expo Go on Physical Device**: Uses `https://test-campus-trails.vercel.app`
- **Android Emulator**: Uses `http://10.0.2.2:3000` (if NGROK_URL is null)
- **iOS Simulator**: Uses `http://localhost:3000` (if NGROK_URL is null)
- **APK Build**: Uses `https://test-campus-trails.vercel.app`
- **NGROK**: If `NGROK_URL` is set, it takes priority (for local backend testing)

## Testing

### In Expo Go (Physical Device)
```bash
npx expo start
# Scan QR code with Expo Go app
# App will automatically use Vercel URL
```

### In Emulator/Simulator
```bash
npx expo start
# Press 'a' for Android emulator or 'i' for iOS simulator
# App will use localhost/10.0.2.2 (if backend is running locally)
```

### With Local Backend (NGROK)
```bash
# 1. Start backend
cd backend && npm start

# 2. Start NGROK
ngrok http 3000

# 3. Update services/api.js
const NGROK_URL = 'https://your-ngrok-url.ngrok-free.app';

# 4. Start Expo
npx expo start
```

## Files Modified

- ✅ `services/api.js` - Added Expo Go detection and Vercel URL fallback

## Benefits

- ✅ Works out of the box in Expo Go on physical devices
- ✅ No configuration needed for most users
- ✅ Still supports local development with NGROK
- ✅ Maintains compatibility with emulators/simulators
- ✅ Production APK builds unaffected

## Notes

- The Vercel backend must be running and accessible
- For local backend testing on physical devices, use NGROK
- Emulators/simulators can still use localhost if backend is running locally
