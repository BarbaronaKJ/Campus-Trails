# Render Migration Summary

## ✅ Completed Changes

### 1. Created Render Configuration Files

**`render.yaml`**
- Defines Render web service configuration
- Sets build and start commands
- Configures environment variables (with placeholders for secrets)

**`Procfile`**
- Simple start command for Render
- Runs: `cd backend && npm start`

### 2. Updated API Service (`services/api.js`)

**Changes:**
- ✅ Added `RENDER_URL` constant (default: `https://campus-trails-api.onrender.com`)
- ✅ Updated `determineApiBaseUrl()` to use Render URL for production builds (`!__DEV__`)
- ✅ Updated comments to reference Render instead of Vercel
- ✅ Added fallback to Render URL if no local options available

**Production Build Behavior:**
- When building APK (`!__DEV__`), the app will automatically use `RENDER_URL`
- No code changes needed after deployment - just update the `RENDER_URL` constant

### 3. Backend Server (`backend/server.js`)

**Already Compatible:**
- ✅ Uses `process.env.PORT || 3000` (Render sets PORT automatically)
- ✅ No changes needed - already Render-ready

### 4. Created Documentation

**`RENDER_DEPLOYMENT.md`**
- Complete step-by-step deployment guide
- Environment variables setup
- Troubleshooting section
- MongoDB Atlas configuration
- APK build instructions

## 🔧 Next Steps

### Step 1: Deploy to Render

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Migrate to Render hosting"
   git push origin main
   ```

2. **Deploy on Render:**
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will detect `render.yaml` automatically
   - Click "Apply"

3. **Set Environment Variables:**
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `JWT_SECRET` - Your JWT secret key
   - `CORS_ORIGINS` - Already set to `*` in render.yaml
   - Email variables (if using email features)

4. **Wait for deployment** (5-10 minutes)

### Step 2: Get Your Render URL

After deployment, your service URL will be:
```
https://campus-trails-api.onrender.com
```
(Or similar, depending on service name availability)

### Step 3: Update Mobile App

1. **Update `services/api.js`:**
   ```javascript
   const RENDER_URL = 'https://your-actual-render-url.onrender.com';
   ```

2. **Test locally:**
   ```bash
   # Set LOCAL_IP to null to test Render connection
   const LOCAL_IP = null;
   
   npx expo start
   # Test in Expo Go - should connect to Render
   ```

### Step 4: Build APK

```bash
# Build APK - will automatically use Render URL
eas build --platform android --profile production
```

The APK will automatically connect to your Render backend!

## 📝 Important Notes

### Free Tier Limitations

- **Service Sleeps**: Free tier services sleep after 15 minutes of inactivity
- **First Request**: Takes ~30 seconds to wake up after sleep
- **Solution**: Use [UptimeRobot](https://uptimerobot.com) to ping every 14 minutes, or upgrade to paid plan

### MongoDB Atlas

- **Whitelist IPs**: Add `0.0.0.0/0` to MongoDB Atlas Network Access (allows all IPs)
- **Or**: Add Render's specific IP ranges (check Render docs)

### Environment Variables

All sensitive variables are marked `sync: false` in `render.yaml`, meaning you must set them manually in Render dashboard:
- `MONGODB_URI`
- `JWT_SECRET`
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` (if using email)

## 🔄 Migration from Vercel

### What Changed

- ✅ Production URL: Vercel → Render
- ✅ Deployment: Serverless functions → Regular Node.js service
- ✅ Configuration: `vercel.json` → `render.yaml` + `Procfile`

### What Stayed the Same

- ✅ API routes structure
- ✅ Database connection
- ✅ Authentication flow
- ✅ Mobile app code (except API URL)

### Old Files (Can Keep for Reference)

- `vercel.json` - Vercel configuration (no longer used)
- `api/index.js` - Vercel serverless function (no longer used)

You can delete these after confirming Render deployment works, or keep them for reference.

## ✅ Verification Checklist

After deployment, verify:

- [ ] Render service is running (green status)
- [ ] Health endpoint works: `https://your-url.onrender.com/health`
- [ ] MongoDB connection successful (check Render logs)
- [ ] API endpoints respond correctly
- [ ] Mobile app connects to Render (test in Expo Go)
- [ ] APK build uses Render URL (check logs)
- [ ] APK connects to database successfully

## 🐛 Troubleshooting

See `RENDER_DEPLOYMENT.md` for detailed troubleshooting guide.

Common issues:
- **Build fails**: Check Node version, dependencies
- **Can't connect**: Verify Render URL in `services/api.js`
- **MongoDB error**: Check IP whitelist, connection string
- **CORS error**: Verify `CORS_ORIGINS=*` in environment variables

## 📚 Documentation

- **Deployment Guide**: `RENDER_DEPLOYMENT.md`
- **Network Issues**: `NETWORK_TROUBLESHOOTING.md`
- **APK Build**: `APK_BUILD_GUIDE.md`
