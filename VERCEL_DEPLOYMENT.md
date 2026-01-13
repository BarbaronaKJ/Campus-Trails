# Vercel Deployment Guide

This guide explains how to deploy the Campus Trails backend API to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. MongoDB Atlas database (already configured)
3. GitHub repository connected to Vercel

## Deployment Steps

### 1. Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

### 2. Configure Environment Variables

In your Vercel project dashboard, add the following environment variables:

**Required:**
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT token generation
- `CORS_ORIGINS` - Allowed CORS origins (use `*` for all or comma-separated URLs)

**Optional (for email functionality):**
- `EMAIL_HOST` - SMTP host (e.g., `smtp.gmail.com`)
- `EMAIL_PORT` - SMTP port (e.g., `587`)
- `EMAIL_USER` - Your email address
- `EMAIL_PASS` - Your email app password
- `RESET_PASSWORD_URL` - URL for password reset links (e.g., `https://your-domain.vercel.app/reset-password`)

**To add environment variables:**
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable for **Production**, **Preview**, and **Development** environments

### 3. Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: Leave as root (`.`)
   - **Build Command**: Leave empty (Vercel will auto-detect)
   - **Output Directory**: Leave empty
5. Add environment variables (see step 2)
6. Click **Deploy**

#### Option B: Deploy via CLI

```bash
# Login to Vercel
vercel login

# Deploy (first time)
vercel

# Deploy to production
vercel --prod
```

### 4. Verify Deployment

After deployment, test your API endpoints:

- Health check: `https://your-project.vercel.app/health`
- Pins API: `https://your-project.vercel.app/api/pins?campusId=YOUR_CAMPUS_ID`
- Auth API: `https://your-project.vercel.app/api/auth/login`

## Project Structure

```
Campus-Trails/
├── api/
│   ├── index.js          # Main serverless function handler
│   └── health.js          # Health check endpoint
├── backend/
│   ├── models/           # Mongoose models
│   ├── routes/           # Express routes
│   └── utils/            # Utility functions
├── vercel.json           # Vercel configuration
└── package.json          # Dependencies (includes backend deps)
```

## API Endpoints

All endpoints are prefixed with `/api`:

- `GET /api/pins` - Get all pins
- `GET /api/pins/:id` - Get pin by ID
- `POST /api/pins` - Create new pin
- `PUT /api/pins/:id` - Update pin
- `DELETE /api/pins/:id` - Delete pin
- `GET /api/auth/me` - Get current user
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/campuses` - Get all campuses
- `GET /api/campuses/:id` - Get campus by ID
- `POST /api/feedbacks` - Create feedback
- `GET /health` - Health check

## Updating Frontend API URL

After deployment, update your frontend `services/api.js` to use the Vercel URL:

```javascript
// Update API_BASE_URL to your Vercel deployment URL
const API_BASE_URL = 'https://your-project.vercel.app';
```

## Troubleshooting

### MongoDB Connection Issues

- Ensure `MONGODB_URI` is set correctly in Vercel environment variables
- Check that MongoDB Atlas allows connections from Vercel IPs (use `0.0.0.0/0` for all IPs)
- Verify the connection string format: `mongodb+srv://username:password@cluster.mongodb.net/database`

### CORS Issues

- Set `CORS_ORIGINS` environment variable to your frontend URL
- Use `*` for development (not recommended for production)
- For multiple origins, use comma-separated values: `https://app1.com,https://app2.com`

### Function Timeout

- Vercel free tier has a 10-second timeout for serverless functions
- Hobby tier has a 60-second timeout
- Consider optimizing database queries if you hit timeouts

### Cold Starts

- First request after inactivity may be slower (cold start)
- This is normal for serverless functions
- Consider using Vercel Pro for better performance

## Monitoring

- Check Vercel dashboard for deployment logs
- Monitor function execution times
- Set up error tracking (Sentry, etc.) for production

## Continuous Deployment

Vercel automatically deploys when you push to:
- `main` branch → Production
- Other branches → Preview deployments

Each push creates a new deployment with a unique URL.
