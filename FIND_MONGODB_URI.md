# Where to Find MONGODB_URI

## 📍 Current Location

Your `MONGODB_URI` is stored in:
```
backend/.env
```

**Note**: This file is gitignored (not in Git) for security reasons.

## 🔍 How to Find Your MONGODB_URI

### Option 1: Check Your Local .env File

1. **Open the file:**
   ```bash
   cd backend
   cat .env
   # or
   nano .env
   # or open in your code editor
   ```

2. **Look for this line:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/campus-trails?retryWrites=true&w=majority
   ```

### Option 2: Get It from MongoDB Atlas (If You Don't Have It)

1. **Go to MongoDB Atlas Dashboard:**
   - Visit: https://cloud.mongodb.com/
   - Sign in to your account

2. **Navigate to Your Cluster:**
   - Click "Database" in the left sidebar
   - You should see your cluster (e.g., "Cluster0")

3. **Get Connection String:**
   - Click "Connect" button on your cluster
   - Choose "Connect your application"
   - Select:
     - **Driver**: Node.js
     - **Version**: 5.5 or later
   - Copy the connection string

4. **Format the Connection String:**
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

5. **Replace Placeholders:**
   - Replace `<username>` with your database username
   - Replace `<password>` with your database password
   - Add database name after `.net/`:
     ```
     mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/campus-trails?retryWrites=true&w=majority
     ```

6. **Save to backend/.env:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/campus-trails?retryWrites=true&w=majority
   ```

## 🔐 For Render Deployment

When deploying to Render, you need to add `MONGODB_URI` as an environment variable:

1. **Copy your MONGODB_URI** from `backend/.env`

2. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Click on your service (or create new one)

3. **Add Environment Variable:**
   - Go to "Environment" tab
   - Click "Add Environment Variable"
   - **Key**: `MONGODB_URI`
   - **Value**: Paste your connection string
   - Click "Save Changes"

4. **Important**: Make sure your MongoDB Atlas Network Access allows Render's IPs:
   - Go to MongoDB Atlas → Network Access
   - Add `0.0.0.0/0` (allows all IPs) OR
   - Add Render's specific IP ranges (check Render docs)

## 📋 Example .env File Structure

Your `backend/.env` should look like this:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/campus-trails?retryWrites=true&w=majority

# Server Configuration
PORT=3000

# CORS Configuration
CORS_ORIGINS=*

# JWT Secret (for authentication)
JWT_SECRET=your-secure-jwt-secret-here

# Email Configuration (optional, for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## ⚠️ Security Notes

1. **Never commit `.env` to Git** - It's already in `.gitignore`
2. **Never share your MONGODB_URI** publicly
3. **Use strong passwords** for database users
4. **For production**: Restrict IP whitelist (don't use `0.0.0.0/0`)

## 🆘 Troubleshooting

### "MONGODB_URI environment variable is not set"
- Make sure `backend/.env` file exists
- Check the file is in the `backend/` folder (not root)
- Verify `MONGODB_URI=` line is present and not commented out

### "Authentication failed"
- Verify username and password in connection string
- Check database user exists in MongoDB Atlas
- Make sure password doesn't have special characters that need URL encoding

### "IP not whitelisted"
- Go to MongoDB Atlas → Network Access
- Add your IP or `0.0.0.0/0` for all IPs
- Wait 1-2 minutes for changes to propagate

## 📚 Related Documentation

- **MongoDB Setup**: See `MONGODB_SETUP.md`
- **Render Deployment**: See `RENDER_DEPLOYMENT.md`
- **Backend Setup**: See `backend/README.md`
