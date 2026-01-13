# Render Deployment Guide

This guide will help you deploy the Campus Trails backend API to Render and configure the mobile app to use it.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com) (free tier available)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **MongoDB Atlas**: Database should be set up and accessible
4. **Environment Variables**: Have your MongoDB URI and other secrets ready

## Step 1: Prepare Your Repository

1. **Ensure all files are committed:**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Verify these files exist:**
   - ✅ `render.yaml` (Render configuration)
   - ✅ `Procfile` (Start command)
   - ✅ `backend/server.js` (Main server file)
   - ✅ `backend/package.json` (Dependencies)

## Step 2: Deploy to Render

### Option A: Using render.yaml (Recommended)

1. **Go to Render Dashboard:**
   - Visit [dashboard.render.com](https://dashboard.render.com)
   - Click "New +" → "Blueprint"

2. **Connect GitHub Repository:**
   - Select your repository
   - Render will detect `render.yaml` automatically
   - Click "Apply"

3. **Review Configuration:**
   - Service name: `campus-trails-api`
   - Build command: `cd backend && npm install`
   - Start command: `cd backend && npm start`
   - Environment: Node

4. **Set Environment Variables:**
   - Click on your service
   - Go to "Environment" tab
   - Add these variables:
     ```
     NODE_ENV=production
     PORT=10000 (Render sets this automatically, but good to have)
     MONGODB_URI=your_mongodb_atlas_connection_string
     JWT_SECRET=your_jwt_secret_key
     CORS_ORIGINS=*
     EMAIL_HOST=your_smtp_host (if using email)
     EMAIL_PORT=587 (if using email)
     EMAIL_USER=your_email (if using email)
     EMAIL_PASS=your_email_password (if using email)
     ```

5. **Deploy:**
   - Click "Manual Deploy" → "Deploy latest commit"
   - Wait for build to complete (5-10 minutes)

### Option B: Manual Setup

1. **Create New Web Service:**
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service:**
   - **Name**: `campus-trails-api`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free (or paid if you need more resources)

3. **Set Environment Variables** (same as Option A)

4. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment

## Step 3: Get Your Render URL

After deployment completes:

1. **Find your service URL:**
   - In Render Dashboard, click on your service
   - Your URL will be: `https://campus-trails-api.onrender.com` (or similar)
   - Copy this URL

2. **Test the deployment:**
   - Open browser: `https://your-service.onrender.com/health`
   - Should return: `{"success":true,"message":"Campus Trails API Server is running"}`

## Step 4: Update Mobile App Configuration

1. **Update `services/api.js`:**
   ```javascript
   // Replace the RENDER_URL with your actual Render URL
   const RENDER_URL = 'https://your-service.onrender.com';
   ```

2. **Verify production build uses Render:**
   - In `services/api.js`, the `determineApiBaseUrl()` function should return `RENDER_URL` when `!__DEV__`
   - This ensures APK builds use Render URL

3. **Test locally first:**
   ```bash
   # Set LOCAL_IP to null in services/api.js
   const LOCAL_IP = null;
   
   # Start Expo
   npx expo start
   
   # Test in Expo Go - should connect to Render
   ```

## Step 5: Build APK with Render URL

1. **Verify configuration:**
   ```bash
   # Check services/api.js
   grep -A 5 "RENDER_URL" services/api.js
   ```

2. **Build APK:**
   ```bash
   # Using EAS Build
   eas build --platform android --profile production
   
   # Or local build
   cd android && ./gradlew assembleRelease
   ```

3. **Test APK:**
   - Install APK on device
   - App should connect to Render backend
   - Test login, fetching pins, etc.

## Step 6: MongoDB Atlas Configuration

1. **Whitelist Render IP:**
   - Go to MongoDB Atlas Dashboard
   - Network Access → Add IP Address
   - Add `0.0.0.0/0` (allows all IPs) OR
   - Add Render's IP ranges (check Render docs for current IPs)

2. **Verify Connection:**
   - Check Render logs for MongoDB connection status
   - Should see: `✅ MongoDB Atlas connected successfully`

## Troubleshooting

### Build Fails

**Error: "Build command failed"**
- Check `backend/package.json` has all dependencies
- Verify Node version in Render (should be 18+)
- Check build logs in Render dashboard

**Error: "Module not found"**
- Ensure `backend/package.json` has all required dependencies
- Check if dependencies are in `dependencies` not `devDependencies`

### Deployment Fails

**Error: "Cannot connect to MongoDB"**
- Verify `MONGODB_URI` is set correctly in Render
- Check MongoDB Atlas IP whitelist includes Render IPs
- Test MongoDB URI locally first

**Error: "Port already in use"**
- Render sets `PORT` automatically via environment variable
- Ensure `backend/server.js` uses `process.env.PORT || 3000`
- Don't hardcode port number

### App Can't Connect to Render

**Error: "Network request failed"**
- Verify Render URL is correct in `services/api.js`
- Check Render service is running (not sleeping)
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds

**Error: "CORS error"**
- Verify `CORS_ORIGINS=*` in Render environment variables
- Check `backend/server.js` CORS configuration

### Service Keeps Sleeping (Free Tier)

**Issue: First request is slow**
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Consider upgrading to paid plan for always-on service

**Solution:**
- Use a service like [UptimeRobot](https://uptimerobot.com) to ping your service every 14 minutes
- Or upgrade to Render paid plan ($7/month)

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode | `production` |
| `PORT` | Auto | Port number (Render sets this) | `10000` |
| `MONGODB_URI` | Yes | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Yes | Secret for JWT tokens | `your-secret-key` |
| `CORS_ORIGINS` | Yes | Allowed CORS origins | `*` |
| `EMAIL_HOST` | No | SMTP host (if using email) | `smtp.gmail.com` |
| `EMAIL_PORT` | No | SMTP port | `587` |
| `EMAIL_USER` | No | SMTP username | `your-email@gmail.com` |
| `EMAIL_PASS` | No | SMTP password | `your-password` |

## Render URL Format

Your Render service URL will be:
```
https://[service-name].onrender.com
```

Example:
```
https://campus-trails-api.onrender.com
```

## API Endpoints

After deployment, your API endpoints will be:
- Health: `https://your-service.onrender.com/health`
- Pins: `https://your-service.onrender.com/api/pins`
- Auth: `https://your-service.onrender.com/api/auth`
- Campuses: `https://your-service.onrender.com/api/campuses`
- Feedbacks: `https://your-service.onrender.com/api/feedbacks`

## Next Steps

1. ✅ Deploy to Render
2. ✅ Update `services/api.js` with Render URL
3. ✅ Test connection from Expo Go
4. ✅ Build APK and test
5. ✅ Monitor Render logs for any issues
6. ✅ Set up uptime monitoring (optional, for free tier)

## Support

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Render Status**: [status.render.com](https://status.render.com)
- **MongoDB Atlas**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)

## Migration from Vercel

If you were previously using Vercel:

1. ✅ Remove `vercel.json` (or keep for reference)
2. ✅ Remove `api/index.js` (or keep for reference)
3. ✅ Update `services/api.js` to use Render URL
4. ✅ Deploy to Render
5. ✅ Test thoroughly before removing Vercel deployment
