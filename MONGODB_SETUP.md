# MongoDB Integration Setup Guide

This guide will help you set up MongoDB Atlas integration for the Campus Trails mobile app.

## Overview

The app now supports fetching pin data from MongoDB Atlas instead of using the local `pinsData.js` file. This allows you to:
- Edit pin data directly in MongoDB Compass or Atlas
- Update pin positions, descriptions, images, and categories without code changes
- Manage the pathfinding network by editing the `neighbors` array
- Optimize Cloudinary images with `f_auto,q_auto` parameters

## Quick Start

### 1. Backend Setup (5 minutes)

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   Create a `.env` file in the `backend` folder with your MongoDB Atlas connection string:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/campus-trails?retryWrites=true&w=majority
   PORT=3000
   CORS_ORIGINS=*
   ```

4. **Start the server:**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

### 2. Migrate Local Data to MongoDB

Run the migration script to import all pins from `pinsData.js`:

```bash
node scripts/migratePins.js
```

### 3. Update Mobile App Configuration

1. **Install expo-image (if not already installed):**
   ```bash
   npm install expo-image
   ```

2. **Update API Base URL:**
   Edit `services/api.js` and update the `API_BASE_URL`:
   ```javascript
   // For Android emulator: use 'http://10.0.2.2:3000'
   // For iOS simulator: use 'http://localhost:3000'
   // For physical device: use your computer's IP (e.g., 'http://192.168.1.100:3000')
   let API_BASE_URL = __DEV__ 
     ? 'http://localhost:3000' // Change this for your setup
     : 'https://your-production-api.com';
   ```

3. **Enable API Fetching:**
   In `App.js`, the `usePins` hook is already configured to fetch from the API. Set `useApi: false` to disable API fetching and use local data only:
   ```javascript
   const { pins, loading, error, isUsingLocalFallback } = usePins(true); // true = use API
   ```

## MongoDB Atlas Setup (Detailed)

### Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free" or "Sign Up"
3. Fill in your details and verify your email

### Step 2: Create a Cluster

1. Choose "Build a Database"
2. Select **FREE (M0) tier**
3. **Important**: Choose **Singapore (ap-southeast-1)** region for best performance in the Philippines
4. Name your cluster (e.g., "CampusTrails")
5. Click "Create Cluster" (takes 2-3 minutes)

### Step 3: Create Database User

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Authentication Method: "Password"
4. Create a username (e.g., `campustrails`)
5. Create a strong password (save it!)
6. Database User Privileges: "Read and write to any database"
7. Click "Add User"

### Step 4: Whitelist IP Address

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For development/testing:
   - Click "Allow Access from Anywhere" (adds `0.0.0.0/0`)
   - ⚠️ **Note**: This allows access from any IP. For production, use specific IPs.
4. Click "Confirm"

### Step 5: Get Connection String

1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Driver: Node.js
5. Version: 5.5 or later
6. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Replace `<username>` with your database username
8. Replace `<password>` with your database password
9. Add database name: `campus-trails` (or your preferred name)
   ```
   mongodb+srv://campustrails:yourpassword@cluster0.xxxxx.mongodb.net/campus-trails?retryWrites=true&w=majority
   ```

### Step 6: Update Backend .env File

Add the connection string to `backend/.env`:

```env
MONGODB_URI=mongodb+srv://campustrails:yourpassword@cluster0.xxxxx.mongodb.net/campus-trails?retryWrites=true&w=majority
PORT=3000
CORS_ORIGINS=*
```

## Editing Pins in MongoDB

### Using MongoDB Compass

1. **Download MongoDB Compass:**
   - Download from [MongoDB Compass](https://www.mongodb.com/try/download/compass)
   - Install and launch

2. **Connect to Atlas:**
   - Paste your connection string
   - Click "Connect"
   - Enter your database user credentials if prompted

3. **Navigate to Database:**
   - Select your database (e.g., `campus-trails`)
   - Click on `pins` collection

4. **Edit a Pin:**
   - Click on any pin document
   - Edit any field:
     - **title**: Short label (e.g., "ME", "1")
     - **description**: Full description
     - **x, y**: Map coordinates
     - **image**: Cloudinary URL (will be auto-optimized)
     - **category**: Filter category
     - **neighbors**: Array of connected pin IDs for pathfinding
     - **buildingNumber**: Building number (1-52)
   - Click "Update" to save

### Using MongoDB Atlas Web Interface

1. Go to MongoDB Atlas dashboard
2. Click "Browse Collections"
3. Select your database → `pins` collection
4. Click on any document to edit
5. Make changes and save

## Image Optimization

All Cloudinary URLs are automatically optimized with `f_auto,q_auto`:

**Before:**
```
https://res.cloudinary.com/dun83uvdm/image/upload/v1768037837/building1.jpg
```

**After (Automatic):**
```
https://res.cloudinary.com/dun83uvdm/image/upload/f_auto,q_auto/v1768037837/building1.jpg
```

Benefits:
- **f_auto**: Automatic format selection (WebP for modern devices)
- **q_auto**: Automatic quality optimization (saves data for students)

### Adding f_auto,q_auto Manually

When adding images in MongoDB, you can add `f_auto,q_auto` manually:

1. Find the `/upload/` part of your Cloudinary URL
2. Add `f_auto,q_auto/` right after `/upload/`
3. Example: `.../upload/f_auto,q_auto/v1768037837/image.jpg`

## Offline Support with expo-image

The app uses `expo-image` for automatic image caching:

1. **First Load**: Images are downloaded from Cloudinary and cached to device storage
2. **Subsequent Loads**: Images load from cache (offline support)
3. **Automatic Management**: Cache is managed automatically by expo-image

No additional configuration needed!

## Testing the API

### Test Backend Server

```bash
# Health check
curl http://localhost:3000/health

# Get all pins
curl http://localhost:3000/api/pins

# Get pin by ID
curl http://localhost:3000/api/pins/1

# Get pins by category
curl http://localhost:3000/api/pins/category/Buildings
```

### Test in Mobile App

1. Start the backend server (`npm start` in `backend` folder)
2. Update `API_BASE_URL` in `services/api.js` with your IP address
3. Run the mobile app: `npm start`
4. Check console for API fetch status:
   - ✅ `Loaded X pins from MongoDB API` - Success!
   - ⚠️ `Failed to fetch pins from API, using local fallback` - Check connection

## Troubleshooting

### Backend Won't Start

**Error: "MONGODB_URI environment variable is not set"**
- Make sure you created a `.env` file in the `backend` folder
- Check that `MONGODB_URI` is spelled correctly

**Error: "Authentication failed"**
- Verify username and password in connection string
- Check database user exists in MongoDB Atlas

**Error: "IP not whitelisted"**
- Go to MongoDB Atlas → Network Access
- Add your IP address or `0.0.0.0/0` for all IPs

### Mobile App Can't Connect to API

**Error: "Network request failed"**

**For Android Emulator:**
- Use `http://10.0.2.2:3000` instead of `localhost:3000`

**For iOS Simulator:**
- Use `http://localhost:3000`

**For Physical Device:**
1. Find your computer's local IP address:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```
2. Use `http://YOUR_IP_ADDRESS:3000` (e.g., `http://192.168.1.100:3000`)
3. Make sure your phone and computer are on the same WiFi network
4. Check firewall settings (allow port 3000)

### Images Not Loading

- Check that Cloudinary URLs are valid
- Verify internet connection
- Check expo-image is installed: `npm list expo-image`
- Clear cache and reload app

## Production Deployment

For production:

1. **Deploy Backend:**
   - Use services like Heroku, Railway, or AWS
   - Set environment variables in your hosting platform
   - Update `API_BASE_URL` in mobile app to production URL

2. **Secure MongoDB Atlas:**
   - Remove `0.0.0.0/0` from IP whitelist
   - Add only your production server IPs
   - Use strong passwords
   - Enable database authentication

3. **Update CORS:**
   - Set `CORS_ORIGINS` to your production app URL
   - Don't use `*` in production

4. **Image Optimization:**
   - Ensure all Cloudinary URLs include `f_auto,q_auto`
   - Monitor Cloudinary usage

## Need Help?

- Check `backend/README.md` for detailed backend documentation
- Check MongoDB Atlas logs in the dashboard
- Check server console for errors
- Verify environment variables are set correctly
