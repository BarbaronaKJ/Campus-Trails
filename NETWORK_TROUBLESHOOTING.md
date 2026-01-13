# Network Troubleshooting Guide

## Current Status
- ✅ Backend server: Running
- ✅ Port 3000: Listening on all interfaces (`*:3000`)
- ✅ LOCAL_IP: `http://10.0.0.36:3000`
- ❌ Phone cannot reach computer

## Quick Fixes

### Option 1: Allow Firewall (Recommended)

**Linux (UFW):**
```bash
sudo ufw allow 3000
sudo ufw status  # Verify it's allowed
```

**Linux (firewalld):**
```bash
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

**Mac:**
1. System Preferences → Security & Privacy → Firewall
2. Click "Firewall Options"
3. Add Node.js or allow incoming connections on port 3000

**Windows:**
1. Windows Defender Firewall → Advanced Settings
2. Inbound Rules → New Rule
3. Port → TCP → 3000 → Allow

### Option 2: Test from Phone Browser

1. **Make sure phone and computer are on same WiFi**
2. **Open phone browser** (Chrome/Safari)
3. **Navigate to:** `http://10.0.0.36:3000/health`
4. **Expected result:** 
   ```json
   {"success":true,"message":"Campus Trails API Server is running"}
   ```

**If browser works but app doesn't:**
- Check Expo Go network permissions
- Restart Expo Go app
- Clear Expo Go cache

**If browser doesn't work:**
- Firewall is blocking (use Option 1)
- Different WiFi networks
- Router blocking device-to-device communication

### Option 3: Use NGROK (Bypasses Firewall)

NGROK creates a secure tunnel that bypasses firewall issues.

1. **Install NGROK:**
   ```bash
   # Download from https://ngrok.com/download
   # Or install via package manager
   ```

2. **Configure (first time only):**
   ```bash
   ngrok config add-authtoken YOUR_TOKEN
   # Get token from https://dashboard.ngrok.com/get-started/your-authtoken
   ```

3. **Start NGROK in a new terminal:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL:**
   Example: `https://xxxx-xx-xx-xx-xx.ngrok-free.app`

5. **Update `services/api.js`:**
   ```javascript
   const NGROK_URL = 'https://xxxx-xx-xx-xx-xx.ngrok-free.app';
   const LOCAL_IP = null; // Disable LOCAL_IP when using NGROK
   ```

6. **Restart Expo:**
   ```bash
   npx expo start
   ```

### Option 4: Check WiFi Network

1. **Verify same network:**
   - Computer WiFi: Check in network settings
   - Phone WiFi: Check in phone settings
   - Must match exactly

2. **Check router settings:**
   - Some routers block device-to-device communication
   - Look for "AP Isolation" or "Client Isolation" setting
   - Disable it if enabled

3. **Try different network:**
   - Mobile hotspot (phone as hotspot, computer connects)
   - Different WiFi network
   - Test if issue persists

## Diagnostic Commands

### Check if port is accessible:
```bash
# From computer
curl http://10.0.0.36:3000/health

# From phone (if you have terminal access)
curl http://10.0.0.36:3000/health
```

### Check firewall status:
```bash
# Linux (UFW)
sudo ufw status

# Linux (firewalld)
sudo firewall-cmd --list-ports

# Check what's listening
netstat -tuln | grep 3000
# or
ss -tuln | grep 3000
```

### Verify IP address:
```bash
# Linux/Mac
ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1'

# Or
ifconfig | grep "inet " | grep -v 127.0.0.1
```

## Common Issues

### "Network request failed" but backend is running
- **Cause:** Firewall blocking port 3000
- **Fix:** Allow port 3000 in firewall (Option 1)

### Browser works but app doesn't
- **Cause:** Expo Go network permissions
- **Fix:** Restart Expo Go, check app permissions

### Works on emulator but not physical device
- **Cause:** Emulator uses `10.0.2.2`, physical device needs real IP
- **Fix:** Set `LOCAL_IP` correctly (already done)

### IP address keeps changing
- **Cause:** DHCP assigns new IP on reconnect
- **Fix:** 
  - Set static IP in router settings
  - Or use NGROK (Option 3) - IP doesn't matter

## Recommended Solution

**For quick testing:** Use NGROK (Option 3)
- No firewall configuration needed
- Works from any network
- Secure HTTPS tunnel

**For production/local development:** Fix firewall (Option 1)
- Better performance
- No external service needed
- More control

## Next Steps

1. **Try Option 1 first** (allow firewall) - fastest fix
2. **Test from phone browser** - confirms network connectivity
3. **If still fails, use NGROK** - guaranteed to work

## Files to Check

- `services/api.js` - LOCAL_IP and NGROK_URL configuration
- `backend/server.js` - Server listening configuration
- Firewall settings - Port 3000 access
