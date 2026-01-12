# Backend Setup Instructions

## Error: MONGODB_URI environment variable is not set

This error means you need to create a `.env` file with your MongoDB Atlas connection string.

## Step-by-Step Setup

### Step 1: Install Dependencies (if not already done)

```bash
cd backend
npm install
```

**Check if installed:**
- ✅ If `node_modules` folder exists, dependencies are installed
- ❌ If `node_modules` doesn't exist, run `npm install`

### Step 2: Get MongoDB Atlas Connection String

You have two options:

#### Option A: You Already Have MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Sign in to your account
3. Click "Connect" on your cluster
4. Choose "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database password
7. Replace `<database-name>` with `campus-trails` (or your preferred name)

Example connection string:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/campus-trails?retryWrites=true&w=majority
```

#### Option B: Set Up MongoDB Atlas (First Time)

**2a. Create MongoDB Atlas Account (Free)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free" or "Sign Up"
3. Create an account (free tier available)

**2b. Create a Cluster**
1. Click "Build a Database"
2. Select **FREE (M0)** tier
3. Choose **Singapore (ap-southeast-1)** region (best for Philippines)
4. Name your cluster (e.g., "CampusTrails")
5. Click "Create Cluster" (takes 2-3 minutes)

**2c. Create Database User**
1. Go to "Database Access" → "Add New Database User"
2. Authentication: "Password"
3. Username: Create one (e.g., `campustrails`)
4. Password: Create a strong password (SAVE IT!)
5. Database User Privileges: "Read and write to any database"
6. Click "Add User"

**2d. Whitelist IP Address**
1. Go to "Network Access" → "Add IP Address"
2. Click "Allow Access from Anywhere" (adds `0.0.0.0/0`)
   - ⚠️ This allows all IPs. For production, use specific IPs.
3. Click "Confirm"

**2e. Get Connection String**
1. Go to "Database" → Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database password
5. Replace `<database-name>` with `campus-trails`

Example:
```
mongodb+srv://campustrails:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/campus-trails?retryWrites=true&w=majority
```

### Step 3: Create .env File

**3a. Create the file:**
```bash
cd backend
touch .env
```

**3b. Add your MongoDB connection string:**

Open `.env` file and add:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/campus-trails?retryWrites=true&w=majority
PORT=3000
CORS_ORIGINS=*
```

**Replace:**
- `username` with your MongoDB Atlas username
- `password` with your MongoDB Atlas password
- `cluster0.xxxxx` with your actual cluster URL
- `campus-trails` with your database name

**Example:**
```env
MONGODB_URI=mongodb+srv://campustrails:MySecurePassword123@cluster0.abc123.mongodb.net/campus-trails?retryWrites=true&w=majority
PORT=3000
CORS_ORIGINS=*
```

**3c. Save the file**

### Step 4: Verify .env File

**Check if file exists:**
```bash
cd backend
ls -la | grep .env
```

You should see `.env` in the list.

**Check file contents (be careful with passwords!):**
```bash
cat .env
```

Make sure `MONGODB_URI` is set correctly.

### Step 5: Start the Server

```bash
cd backend
npm start
```

**Expected output:**
```
✅ MongoDB Atlas connected successfully
   Database: campus-trails
   Host: cluster0.xxxxx.mongodb.net
🚀 Campus Trails API Server started successfully!
   Server running on port 3000
   Health check: http://localhost:3000/health
   API endpoint: http://localhost:3000/api/pins
```

### Step 6: Test the Server

Open a new terminal and test:

```bash
# Health check
curl http://localhost:3000/health

# Get all pins (may be empty if not migrated yet)
curl http://localhost:3000/api/pins
```

Or open in browser: `http://localhost:3000/health`

## Common Issues

### Issue 1: "MONGODB_URI environment variable is not set"
**Solution:** Create `.env` file in `backend/` folder with `MONGODB_URI=...`

### Issue 2: "Authentication failed"
**Solution:** 
- Check username and password in connection string
- Make sure database user exists in MongoDB Atlas

### Issue 3: "IP not whitelisted"
**Solution:**
- Go to MongoDB Atlas → Network Access
- Add your IP address or use `0.0.0.0/0` for all IPs

### Issue 4: "Connection timeout"
**Solution:**
- Check internet connection
- Verify cluster is running in MongoDB Atlas
- Check connection string format

### Issue 5: ".env file not found"
**Solution:**
- Make sure you're in the `backend/` folder
- Create `.env` file: `touch .env`
- Add `MONGODB_URI=...` to the file

## Quick Command Summary

```bash
# 1. Navigate to backend folder
cd backend

# 2. Install dependencies (if not done)
npm install

# 3. Create .env file
touch .env

# 4. Edit .env file (use your editor)
nano .env
# or
code .env
# or
vim .env

# 5. Add this to .env:
# MONGODB_URI=your_connection_string_here
# PORT=3000
# CORS_ORIGINS=*

# 6. Start server
npm start
```

## Next Steps

Once the server is running:

1. **Migrate local data to MongoDB:**
   ```bash
   node scripts/migratePins.js
   ```

2. **Update mobile app API URL:**
   - Edit `services/api.js` in root folder
   - Update `API_BASE_URL` with your server URL

3. **Test API endpoints:**
   - Health: `http://localhost:3000/health`
   - All pins: `http://localhost:3000/api/pins`

## Need Help?

- Check `backend/README.md` for detailed documentation
- Check `MONGODB_SETUP.md` in root folder for MongoDB Atlas setup
- Verify `.env` file exists and has correct format
- Check MongoDB Atlas dashboard for connection status
