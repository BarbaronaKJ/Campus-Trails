# Local Testing Setup Guide

## Overview
This guide explains how to test the app locally instead of using Vercel.

## Configuration Priority

The API URL is determined in this order:

1. **LOCAL_IP** (highest priority) - For physical devices on same network
2. **NGROK_URL** - For physical devices via tunnel
3. **Platform localhost** - For emulators/simulators only
4. **Vercel URL** - Only used in production APK builds

## Setup for Local Testing

### Option 1: Physical Device on Same Network (Recommended)

1. **Find your computer's local IP address:**

   **Linux/Mac:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   # or
   ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1'
   ```

   **Windows:**
   ```cmd
   ipconfig | findstr IPv4
   ```

   Example output: `192.168.1.100`

2. **Update `services/api.js`:**
   ```javascript
   const LOCAL_IP = 'http://192.168.1.100:3000'; // Replace with your IP
   ```

3. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```
   Server should start on `http://localhost:3000`

4. **Make sure:**
   - Your phone and computer are on the **same WiFi network**
   - Your computer's firewall allows connections on port 3000
   - The backend server is running

5. **Test in Expo Go:**
   ```bash
   npx expo start
   ```
   Scan QR code with Expo Go app

### Option 2: NGROK Tunnel (For Different Networks)

1. **Install NGROK:**
   ```bash
   # Download from https://ngrok.com/download
   # Or install via package manager
   ```

2. **Configure NGROK:**
   ```bash
   ngrok config add-authtoken YOUR_TOKEN
   ```

3. **Start backend server:**
   ```bash
   cd backend
   npm start
   ```

4. **Start NGROK in another terminal:**
   ```bash
   ngrok http 3000
   ```

5. **Copy the HTTPS URL:**
   Example: `https://xxxx-xx-xx-xx-xx.ngrok-free.app`

6. **Update `services/api.js`:**
   ```javascript
   const NGROK_URL = 'https://xxxx-xx-xx-xx-xx.ngrok-free.app';
   ```

7. **Test in Expo Go:**
   ```bash
   npx expo start
   ```

### Option 3: Emulator/Simulator (Easiest)

No configuration needed! Just:

1. **Start backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Start Expo:**
   ```bash
   npx expo start
   ```

3. **Press:**
   - `a` for Android emulator
   - `i` for iOS simulator

The app will automatically use:
- `http://10.0.2.2:3000` (Android emulator)
- `http://localhost:3000` (iOS simulator)

## Troubleshooting

### "Network request failed" on Physical Device

1. **Check LOCAL_IP is set correctly:**
   - Make sure it's your computer's IP, not `localhost`
   - Format: `http://192.168.1.100:3000` (no trailing slash)

2. **Check backend is running:**
   ```bash
   curl http://localhost:3000/health
   ```

3. **Check firewall:**
   - Linux: `sudo ufw allow 3000`
   - Mac: System Preferences → Security → Firewall
   - Windows: Windows Defender Firewall → Allow app

4. **Check same network:**
   - Phone and computer must be on same WiFi
   - Try pinging your computer from phone (if possible)

5. **Check backend CORS:**
   - Make sure `CORS_ORIGINS=*` in `backend/.env`

### "Connection refused" or "ECONNREFUSED"

- Backend server is not running
- Wrong IP address
- Port 3000 is blocked by firewall

### "404 Not Found"

- Backend routes are not set up correctly
- Check `backend/routes/` files exist
- Check `backend/server.js` has routes mounted

## Quick Start Checklist

- [ ] Backend server running (`cd backend && npm start`)
- [ ] LOCAL_IP or NGROK_URL set in `services/api.js` (for physical devices)
- [ ] Phone and computer on same WiFi (for LOCAL_IP)
- [ ] Firewall allows port 3000
- [ ] Test: `curl http://YOUR_IP:3000/health` works

## Files Modified

- ✅ `services/api.js` - Updated to prioritize local testing
  - Added `LOCAL_IP` configuration
  - Removed automatic Vercel URL for Expo Go
  - Added console logging for debugging

## Notes

- **LOCAL_IP** takes highest priority when set
- **NGROK_URL** is used if LOCAL_IP is null
- **Platform localhost** is used for emulators/simulators
- **Vercel URL** is only used in production APK builds (`!__DEV__`)
