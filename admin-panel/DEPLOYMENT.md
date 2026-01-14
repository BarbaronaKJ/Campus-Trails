# Admin Panel Deployment Guide - Render

## 🚀 Quick Start: Deploy to Render

### Prerequisites
- ✅ MongoDB database connected (you mentioned it's already connected)
- ✅ Render account
- ✅ GitHub repository with the admin panel code

---

## Step 1: Configure Render Service

### Option A: Using render.yaml (Recommended)

The `render.yaml` file is already configured. Just make sure:

1. **Your Render service name matches**: `campus-trails-admin`
   - If different, update `render.yaml` line 3: `name: your-service-name`

2. **Update the URL in render.yaml** (line 19 and 21):
   - Replace `https://campus-trails-admin.onrender.com` with your actual Render URL
   - This will be `https://your-service-name.onrender.com`

### Option B: Manual Configuration

If not using `render.yaml`, configure manually in Render dashboard:

- **Environment**: Node
- **Build Command**: `npm install && cd client && npm install && npm run build`
- **Start Command**: `npm start`
- **Root Directory**: `/` (root)

---

## Step 2: Set Environment Variables in Render Dashboard

Go to your Render service → **Environment** tab and add these variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Required for production mode |
| `MONGODB_URI` | `your_mongodb_connection_string` | Your MongoDB connection string |
| `JWT_SECRET` | `your-super-secret-jwt-key` | **MUST match your main backend's JWT_SECRET** |
| `PORT` | `5000` | Render will override this, but set it anyway |
| `REACT_APP_API_URL` | `https://your-service-name.onrender.com/api/admin` | **Replace with your actual Render URL** |
| `CORS_ORIGINS` | `https://your-service-name.onrender.com` | **Replace with your actual Render URL** |

### Important Notes:
- ✅ **JWT_SECRET** must be the **same** as your main backend's JWT_SECRET
- ✅ **REACT_APP_API_URL** must match your Render service URL
- ✅ **MONGODB_URI** should be your production MongoDB connection string

---

## Step 3: Deploy

1. **Push your code to GitHub** (if not already done)
2. **Connect repository to Render** (or let Render auto-deploy)
3. **Render will automatically**:
   - Run: `npm install` (backend dependencies)
   - Run: `cd client && npm install` (frontend dependencies)
   - Run: `npm run build` (build React app)
   - Run: `npm start` (start server)

4. **Wait for deployment to complete**
   - Check the **Logs** tab in Render dashboard
   - You should see: `✅ MongoDB connected`
   - You should see: `🚀 Admin Panel Server running on port 5000`

---

## Step 4: Create Admin User

After deployment, you need to create an admin user. Choose one method:

### Method 1: Using MongoDB Atlas (Easiest)

1. Go to MongoDB Atlas → Browse Collections
2. Find your `users` collection
3. Click **Insert Document**
4. Add a document with:
   ```json
   {
     "email": "admin@example.com",
     "password": "$2a$10$YourHashedPasswordHere",
     "role": "admin"
   }
   ```
   
   **OR** update an existing user:
   ```json
   {
     "$set": {
       "role": "admin"
     }
   }
   ```

### Method 2: Using Script (Recommended)

1. **Create admin user locally first** (if you have Node.js):
   ```bash
   cd /home/barbs/GitHub/Campus-Trails-Admin
   node scripts/createAdmin.js admin@example.com yourpassword
   ```

2. **Then deploy**, or run the script on Render using a one-time script

### Method 3: Using Main Backend API

1. Register a user using your main backend API
2. Update the user's role to `admin` in MongoDB:
   ```javascript
   db.users.updateOne(
     { email: "user@example.com" },
     { $set: { role: "admin" } }
   )
   ```

---

## Step 5: Test the Deployment

### 1. Test Health Endpoint
Visit: `https://your-service-name.onrender.com/health`

Expected response:
```json
{
  "success": true,
  "message": "Admin Panel API is running"
}
```

### 2. Test Root Path
Visit: `https://your-service-name.onrender.com/`

Expected: The React admin panel login page should load

### 3. Test Login
1. Go to: `https://your-service-name.onrender.com/`
2. Enter your admin credentials
3. You should be logged in and see the dashboard

---

## 🔧 Troubleshooting

### Issue: "Cannot GET /" Error

**Cause**: React app wasn't built or `NODE_ENV` isn't set to `production`

**Solution**:
1. Check Render logs → Look for build errors
2. Verify `NODE_ENV=production` is set in Render environment variables
3. Check if `client/build` directory was created (check logs)
4. Try manual build locally: `cd client && npm run build`

### Issue: "Login Failed" Error

**Possible Causes**:
1. ❌ No admin user exists
   - **Solution**: Create admin user (Step 4)
   
2. ❌ JWT_SECRET doesn't match main backend
   - **Solution**: Verify `JWT_SECRET` in Render matches main backend
   
3. ❌ Wrong email/password
   - **Solution**: Verify credentials
   
4. ❌ User role is not 'admin'
   - **Solution**: Update user role in MongoDB to 'admin'

5. ❌ Backend not running
   - **Solution**: Check Render logs for server errors

### Issue: React App Shows but API Calls Fail

**Cause**: `REACT_APP_API_URL` is incorrect

**Solution**:
1. Check `REACT_APP_API_URL` in Render environment variables
2. Should be: `https://your-service-name.onrender.com/api/admin`
3. Check browser console (F12) for API errors
4. Verify CORS settings

### Issue: MongoDB Connection Error

**Cause**: `MONGODB_URI` is incorrect or database is not accessible

**Solution**:
1. Verify `MONGODB_URI` in Render environment variables
2. Check MongoDB Atlas Network Access → Allow Render IPs (or allow all IPs for testing)
3. Verify database user has correct permissions

### Issue: Build Fails on Render

**Check**:
1. All dependencies are in `package.json` and `client/package.json`
2. Node.js version is compatible (16+)
3. Build logs for specific error messages
4. Try building locally: `cd client && npm run build`

---

## 📋 Quick Checklist

Before deployment:
- [ ] MongoDB is connected and accessible
- [ ] `render.yaml` has correct service name
- [ ] `render.yaml` has correct URLs (if using)
- [ ] Code is pushed to GitHub
- [ ] Repository is connected to Render

After deployment:
- [ ] Environment variables are set in Render dashboard
- [ ] `NODE_ENV=production` is set
- [ ] `JWT_SECRET` matches main backend
- [ ] `REACT_APP_API_URL` matches your Render URL
- [ ] Build completed successfully (check logs)
- [ ] Server is running (check logs for "Server running")
- [ ] MongoDB connected (check logs for "MongoDB connected")
- [ ] Admin user created in database
- [ ] Health endpoint works: `/health`
- [ ] Root path loads: `/`
- [ ] Login works

---

## 🎯 Summary

1. **Set environment variables** in Render dashboard
2. **Deploy** (Render will build automatically)
3. **Create admin user** in MongoDB
4. **Test** health endpoint, root path, and login
5. **Done!** Your admin panel is live 🎉

---

## 📞 Need Help?

- Check Render logs first (most common source of issues)
- Verify all environment variables are set correctly
- Ensure MongoDB is accessible from Render
- Make sure `JWT_SECRET` matches your main backend
- Test health endpoint: `/health`
- Check browser console (F12) for frontend errors
