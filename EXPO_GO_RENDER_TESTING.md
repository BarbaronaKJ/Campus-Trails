# Expo Go Testing with Render

## ✅ Configuration Complete

Your app is now configured to use Render URL when testing with Expo Go!

## Current Settings

```javascript
// services/api.js
const LOCAL_IP = null;        // ✅ Set to null for Expo Go
const NGROK_URL = null;       // ✅ Set to null for Expo Go
const RENDER_URL = 'https://campus-trails-api.onrender.com'; // ✅ Your Render URL
```

## How It Works

### URL Priority for Expo Go:

1. **LOCAL_IP** (if set) - For same network testing
2. **NGROK_URL** (if set) - For tunnel testing
3. **Render URL** (default) - ✅ **Used automatically when LOCAL_IP and NGROK_URL are null**

### Detection Logic:

- The app detects Expo Go using `Constants.executionEnvironment === 'storeClient'`
- When running in Expo Go with no local options, it automatically uses Render URL
- No configuration needed - just set LOCAL_IP and NGROK_URL to `null`

## Testing Steps

### 1. Verify Configuration

Make sure in `services/api.js`:
```javascript
const LOCAL_IP = null;
const NGROK_URL = null;
const RENDER_URL = 'https://campus-trails-api.onrender.com';
```

### 2. Start Expo

```bash
npx expo start
```

### 3. Scan QR Code

- Open Expo Go app on your phone
- Scan the QR code
- App will load

### 4. Check Console

You should see in the console:
```
🌐 Expo Go detected - Using Render URL: https://campus-trails-api.onrender.com
🌐 API Base URL: https://campus-trails-api.onrender.com
```

### 5. Test API Connection

The app will automatically:
- ✅ Connect to Render backend
- ✅ Fetch campuses from Render
- ✅ Fetch pins from Render
- ✅ Handle authentication via Render
- ✅ Send/receive notifications via Render

## Troubleshooting

### App Still Using Localhost

**Problem**: App tries to use `http://localhost:3000` or `http://10.0.2.2:3000`

**Solution**: 
1. Make sure `LOCAL_IP = null` and `NGROK_URL = null`
2. Restart Expo: `npx expo start --clear`
3. Check console for "Expo Go detected" message

### Network Request Failed

**Problem**: App can't connect to Render

**Solutions**:
1. **Check Render Status**: Visit `https://campus-trails-api.onrender.com/health`
   - Should return: `{"success":true,"message":"Campus Trails API Server is running"}`
   
2. **Check Internet**: Make sure phone has internet connection
   
3. **Check Render Service**: 
   - Free tier services sleep after 15 minutes
   - First request after sleep takes ~30 seconds
   - Wait a moment and try again

4. **Check CORS**: Render should have `CORS_ORIGINS=*` in environment variables

### Expo Go Not Detected

**Problem**: App doesn't detect Expo Go

**Solution**: 
- Make sure you're using Expo Go app (not a development build)
- Check `Constants.executionEnvironment` in console
- Should be `'storeClient'` for Expo Go

## Switching Between Local and Render

### Use Render (Expo Go):
```javascript
const LOCAL_IP = null;
const NGROK_URL = null;
```

### Use Local Backend (Same Network):
```javascript
const LOCAL_IP = 'http://10.0.0.36:3000'; // Your local IP
const NGROK_URL = null;
```

### Use NGROK (Tunnel):
```javascript
const LOCAL_IP = null;
const NGROK_URL = 'https://xxxx.ngrok-free.app';
```

## Testing Checklist

- [ ] `LOCAL_IP = null` in `services/api.js`
- [ ] `NGROK_URL = null` in `services/api.js`
- [ ] `RENDER_URL` is correct (no trailing slash)
- [ ] Render service is running (check `/health` endpoint)
- [ ] Phone has internet connection
- [ ] Expo Go app is installed
- [ ] Console shows "Expo Go detected - Using Render URL"
- [ ] App can fetch data from Render

## Expected Console Output

When running in Expo Go, you should see:

```
🌐 Expo Go detected - Using Render URL: https://campus-trails-api.onrender.com
🌐 API Base URL: https://campus-trails-api.onrender.com
🔍 Fetching campuses from: https://campus-trails-api.onrender.com/api/campuses
✅ Loaded X campuses from MongoDB API
```

## Next Steps

1. ✅ Configuration is complete
2. 🧪 Test with Expo Go
3. ✅ Verify API calls work
4. ✅ Test login/authentication
5. ✅ Test all features

## Notes

- **Free Tier**: Render free tier services sleep after 15 minutes of inactivity
- **First Request**: May take 30 seconds to wake up
- **Production**: APK builds always use Render URL (regardless of `__DEV__`)

## Support

If you encounter issues:
1. Check Render service status
2. Check console logs for API URL being used
3. Verify Render environment variables are set
4. Test Render health endpoint in browser
