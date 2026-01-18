# Express Server Setup Documentation

This document describes the Express.js server configuration and setup for Campus Trails API.

## Location
**Primary File**: `backend/server.js`  
**Entry Point**: `node backend/server.js` or via Vercel serverless function

## Overview
The Express server provides a RESTful API for the Campus Trails mobile application, handling authentication, pin data, campuses, feedback, and admin operations.

## Server Configuration

### Port
- **Default**: `3000`
- **Environment Variable**: `process.env.PORT`
- Falls back to 3000 if not set

### Middleware
1. **CORS**: 
   - Configurable origins via `CORS_ORIGINS` env var
   - Supports `*` or comma-separated list
   - Credentials enabled

2. **JSON Parser**: `express.json()`
3. **URL Encoded**: `express.urlencoded({ extended: true })`

## Routes

### Root Route
- **GET** `/`: API information and endpoint listing

### Health Check
- **GET** `/health`: Server status check

### API Routes (Public)
- **`/api/pins`**: Pin/building data (with pathfinding waypoints)
- **`/api/auth`**: User authentication (register, login, profile)
- **`/api/campuses`**: Campus information
- **`/api/feedbacks`**: User feedback/reports
- **`/api/suggestions_and_feedbacks`**: App suggestions
- **`/api/notifications`**: User notifications
- **`/api/analytics`**: Anonymous usage tracking
- **`/api/developers`**: Developer information (public)

### Admin Routes (Protected)
- **`/api/admin/auth`**: Admin authentication
- **`/api/admin/pins`**: Pin management
- **`/api/admin/users`**: User management
- **`/api/admin/admins`**: Admin user management
- **`/api/admin/campuses`**: Campus management
- **`/api/admin/notifications`**: Notification management
- **`/api/admin/feedbacks`**: Feedback management
- **`/api/admin/suggestions_and_feedbacks`**: Suggestions management
- **`/api/admin/developers`**: Developer management

## MongoDB Connection

### Configuration
- **Environment Variable**: `MONGODB_URI`
- **Connection Options**:
  - `serverSelectionTimeoutMS: 5000`
  - `socketTimeoutMS: 45000`

### Connection Function
```javascript
const connectDB = async () => {
  // Connects to MongoDB Atlas
  // Handles errors and logging
  // Exits process on failure
};
```

### Connection Events
- **`disconnected`**: Logs warning, attempts reconnect
- **`error`**: Logs error details

## Server Startup

### `startServer()`
1. Connects to MongoDB
2. Starts Express server on configured port
3. Logs startup information
4. Handles errors gracefully

### Graceful Shutdown
- **SIGTERM**: Closes MongoDB connection and exits
- **SIGINT** (Ctrl+C): Closes MongoDB connection and exits

## Environment Variables

Required:
- `MONGODB_URI`: MongoDB connection string

Optional:
- `PORT`: Server port (default: 3000)
- `CORS_ORIGINS`: Comma-separated allowed origins or `*`

## File Structure

```
backend/
  ├── server.js          # Main server file
  ├── models/            # Mongoose models
  ├── routes/            # API route handlers
  │   ├── pins.js
  │   ├── auth.js
  │   ├── campuses.js
  │   └── admin/         # Admin routes
  └── middleware/        # Custom middleware
```

## Deployment

### Local Development
```bash
cd backend
node server.js
```

### Vercel Serverless
The server is also exported as a serverless function in `api/index.js` for Vercel deployment.

### Render/Heroku
Standard Node.js deployment - ensure `MONGODB_URI` and `PORT` are set in environment.

## Related Files
- `backend/models/`: All Mongoose schemas
- `backend/routes/`: Route handlers
- `backend/middleware/auth.js`: Authentication middleware
- `api/index.js`: Vercel serverless wrapper
