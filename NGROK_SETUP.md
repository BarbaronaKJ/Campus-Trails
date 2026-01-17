# NGROK Setup Guide for Campus Trails

This guide will help you set up NGROK to expose your backend API to your mobile phone.

## Prerequisites
- NGROK installed (if not installed: https://ngrok.com/download)
- Backend server running on port 3000

## Step 1: Configure NGROK Auth Token ✅ COMPLETED

Your NGROK auth token has been configured successfully!

The auth token was added to: `/home/barbs/.config/ngrok/ngrok.yml`

## Step 2: Start Your Backend Server

Make sure your backend server is running:

```bash
cd backend
npm start
```

The server should be running on `http://localhost:3000`

You should see:
```
✅ MongoDB Atlas connected successfully
🚀 Campus Trails API Server started successfully!
   Server running on port 3000
```

## Step 3: Start NGROK Tunnel

In a **new terminal window**, start NGROK:

```bash
ngrok http 3000
```

You'll see output like this:
```
Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://xxxx-xx-xx-xx-xx.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Copy the HTTPS URL** from the "Forwarding" line (e.g., `https://xxxx-xx-xx-xx-xx.ngrok-free.app`)

## Step 4: Update API Configuration

1. Open `services/api.js`
2. Find the `NGROK_URL` constant (around line 18-19)
3. Set it to your NGROK HTTPS URL:

```javascript
const NGROK_URL = 'https://xxxx-xx-xx-xx-xx.ngrok-free.app'; // Replace with your NGROK URL
```

**Example:**
```javascript
const NGROK_URL = 'https://abc123def456.ngrok-free.app';
```

4. Save the file

## Step 5: Restart Your React Native App

1. Stop your React Native app (if running)
2. Restart it:
   ```bash
   npm start
   ```
3. Reload the app on your mobile device

The app should now connect to your backend through NGROK!

## Step 6: Test the Connection

You can verify the connection is working by:

1. **Check NGROK Web Interface**: Open `http://127.0.0.1:4040` in your browser to see incoming requests
2. **Test in your app**: Try to load pins or login - you should see requests in the NGROK web interface
3. **Check backend logs**: Your backend server should show incoming requests

## Important Notes

⚠️ **NGROK Free Plan Limitations:**
- The URL changes every time you restart NGROK (unless you have a paid plan)
- You'll need to update the URL in `services/api.js` each time
- Free plan has session limits

💡 **Tip:** Consider using a paid NGROK plan with a static domain to avoid updating the URL each time.

## Troubleshooting

### Connection Refused
- Make sure your backend server is running on port 3000
- Check that NGROK is running and shows "online" status
- Verify the NGROK URL is correct in `services/api.js`

### NGROK Error: "authtoken is required"
- The auth token was already configured, but if you see this error, run:
  ```bash
  ngrok config add-authtoken 38864qeqL0MtbDcmCygN1ufzl8r_AAd31MUaCHBLwt7K8PN8
  ```

### API Not Working
- Verify the NGROK URL is correct and accessible
- Check the NGROK web interface (`http://127.0.0.1:4040`) for errors
- Make sure the URL in `services/api.js` matches the URL shown by NGROK

### Mobile Device Can't Connect
- Make sure your phone is connected to the internet (not just local network)
- Verify the NGROK URL uses HTTPS (not HTTP)
- Check that you copied the full URL including `https://`

### URL Changes Each Time
- This is normal for the free NGROK plan
- Update the `NGROK_URL` in `services/api.js` each time you restart NGROK
- Consider upgrading to a paid plan for a static domain

## Updating the URL

Each time you restart NGROK, you'll get a new URL:

1. Start NGROK: `ngrok http 3000`
2. Copy the new HTTPS URL from the output
3. Update `NGROK_URL` in `services/api.js`
4. Save the file
5. Restart your React Native app

## Quick Reference

```bash
# Start backend server
cd backend && npm start

# Start NGROK (in new terminal)
ngrok http 3000

# Update services/api.js with the NGROK URL
# Restart React Native app
```

## Need Help?

- Check NGROK web interface: `http://127.0.0.1:4040`
- Check backend server logs for errors
- Verify MongoDB connection is working
- Make sure all services are running
