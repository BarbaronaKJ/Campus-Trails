# Fix Vercel 404 Errors

## Problem
Getting 404 errors when calling API endpoints:
```
Error: Server returned non-JSON response: The page could not be found NOT_FOUND
```

## Root Cause
Vercel is returning a 404 page instead of routing to the serverless function. This happens when:
1. The routes in `vercel.json` don't match the request paths
2. The deployment doesn't have the latest code
3. The serverless function isn't being invoked correctly

## Solution Applied

### 1. Updated `vercel.json`
Added explicit routes for API endpoints:
```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/health",
      "dest": "/api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/api/index.js"
    }
  ]
}
```

### 2. Added Request Logging
Added logging in `api/index.js` to debug incoming requests:
```javascript
console.log(`📥 ${req.method} ${req.url}`);
```

## Next Steps

### ⚠️ CRITICAL: Redeploy to Vercel

The changes won't take effect until you redeploy:

**Option 1: Git Push (Recommended)**
```bash
git add vercel.json api/index.js
git commit -m "Fix Vercel routing for API endpoints"
git push
```
Vercel will automatically redeploy if connected to your Git repo.

**Option 2: Vercel CLI**
```bash
vercel --prod
```

**Option 3: Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Redeploy" → "Redeploy"

### Verify Deployment

After redeploying, test the endpoints:

1. **Health Check:**
   ```
   https://test-campus-trails.vercel.app/health
   ```
   Should return: `{"success":true,"message":"Campus Trails API Server is running"}`

2. **API Endpoints:**
   ```
   https://test-campus-trails.vercel.app/api/pins
   https://test-campus-trails.vercel.app/api/campuses
   ```

### Debugging

If still getting 404 after redeploy:

1. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → Functions
   - Check the logs for incoming requests
   - Look for the `📥` log messages

2. **Verify File Structure:**
   ```
   api/
     └── index.js  (must exist)
   vercel.json  (must exist in root)
   ```

3. **Check Environment Variables:**
   - Vercel Dashboard → Settings → Environment Variables
   - Ensure `MONGODB_URI` is set
   - Ensure `JWT_SECRET` is set

4. **Test Locally:**
   ```bash
   cd backend
   npm start
   # Test: http://localhost:3000/api/pins
   ```

## Files Modified

- ✅ `vercel.json` - Added explicit API routes
- ✅ `api/index.js` - Added request logging

## Expected Behavior After Fix

- ✅ `/health` → Returns health check JSON
- ✅ `/api/pins` → Returns pins data
- ✅ `/api/campuses` → Returns campuses data
- ✅ `/api/auth/login` → Handles login requests
- ✅ All other `/api/*` routes → Routed to Express app

## Notes

- Vercel serverless functions need explicit route matching
- The catch-all route `/(.*)` should be last
- Express app handles the `/api/*` prefix internally
- MongoDB connection is cached for performance
