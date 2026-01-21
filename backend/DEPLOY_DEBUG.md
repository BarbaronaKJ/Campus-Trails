# Deployment Debug CLI

A comprehensive debugging tool for Node.js/Express deployment verification.

## Usage

### Full Check (Recommended)
```bash
npm run debug
# or
npm run debug:full
# or
node scripts/debug-deploy.js
```

### Individual Checks
```bash
# Check environment variables only
npm run debug:env

# Check database connection only
npm run debug:db

# Check API server only
npm run debug:api
```

## What It Checks

### 1. Environment Variables
- ✅ Required variables: `MONGODB_URI`, `JWT_SECRET`
- ⚠️ Optional variables: `CORS_ORIGINS`, `NODE_ENV`, email settings, admin credentials
- Masks sensitive values in output

### 2. Dependencies
- Verifies all required npm packages are installed:
  - express
  - mongoose
  - cors
  - dotenv
  - jsonwebtoken
  - bcryptjs
  - nodemailer

### 3. Database Connection
- Tests MongoDB connection
- Lists available collections
- Verifies required collections exist (pins, users, campuses, admins)
- Provides troubleshooting tips on failure

### 4. API Server
- Tests server startup
- Verifies health endpoint (`/health`)
- Verifies root endpoint (`/`)
- Handles port conflicts gracefully

### 5. File Structure
- Checks for required files:
  - `server.js`
  - `package.json`
  - Route files
  - Model files
  - Middleware files

## Output

The CLI provides color-coded output:
- ✅ Green: Success
- ❌ Red: Error/Failure
- ⚠️ Yellow: Warning
- ℹ️ Blue: Information

## Exit Codes

- `0`: All checks passed - ready for deployment
- `1`: One or more checks failed - fix issues before deploying

## Example Output

```
╔════════════════════════════════════════════════════════════╗
║     Campus Trails Backend - Deployment Debug CLI          ║
╚════════════════════════════════════════════════════════════╝

============================================================
🔍 Environment Variables Check
============================================================

ℹ️  Checking required environment variables...
✅ MONGODB_URI: mongodb+srv://user:****@cluster.mongodb.net/db
✅ JWT_SECRET: ***************************

============================================================
📦 Dependencies Check
============================================================

ℹ️  Checking required npm packages...
✅ express: v4.18.2
✅ mongoose: v8.0.3
...

============================================================
📊 Deployment Readiness Report
============================================================

Total checks: 15
✅ Passed: 15
🎉 All checks passed! Server is ready for deployment.
```

## Integration with CI/CD

You can integrate this into your deployment pipeline:

```bash
# In your CI/CD script
npm run debug:full || exit 1
```

## Troubleshooting

### Database Connection Fails
1. Verify `MONGODB_URI` is correct
2. Check if your IP is whitelisted in MongoDB Atlas
3. Verify network connectivity
4. Check MongoDB Atlas cluster status

### Port Already in Use
- This is OK if the server is already running
- The debug tool will detect this and continue

### Missing Dependencies
- Run `npm install` to install all required packages
- The debug tool will list which packages are missing

## Notes

- The debug tool uses a temporary test server for API checks
- Database connection is closed after testing
- Sensitive values (passwords, tokens) are masked in output
- The tool exits with code 0 on success, 1 on failure
