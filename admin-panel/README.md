# Campus Trails Admin Panel

Admin panel for managing Campus Trails app data remotely via Render.

## Features

- **Authentication**: Secure admin login with JWT tokens
- **Dashboard**: Overview of statistics (pins, users, campuses, etc.)
- **Pins Management**: Full CRUD for facilities and waypoints
- **Users Management**: View and manage app users
- **Campuses Management**: Manage campus data and map images
- **Notifications**: Send push notifications to app users
- **Feedbacks**: View and manage user feedback
- **Developers**: Manage developer information for About Us section

## Prerequisites

- Node.js 16+ and npm
- MongoDB Atlas account (or local MongoDB)
- Render account for deployment

## Local Setup

1. **Clone the repository** (or navigate to the admin panel directory):
   ```bash
   cd Campus-Trails-Admin
   ```

2. **Install backend dependencies**:
   ```bash
   npm install
   ```

3. **Install frontend dependencies**:
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Configure environment variables**:
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=5000
   CORS_ORIGINS=http://localhost:3000
   NODE_ENV=development
   ```

5. **Create an admin user**:
   You need to create an admin user in your MongoDB database. Use the main backend's auth routes or MongoDB directly:
   ```javascript
   // User model with role: 'admin'
   {
     email: 'admin@example.com',
     password: 'hashed_password',
     role: 'admin'
   }
   ```

6. **Run the development server**:
   ```bash
   # Terminal 1: Backend
   npm run dev

   # Terminal 2: Frontend
   cd client
   npm start
   ```

7. **Access the admin panel**:
   Open http://localhost:3000 and login with your admin credentials.

## Render Deployment

### Step 1: Prepare for Deployment

1. **Update environment variables** for production:
   ```env
   NODE_ENV=production
   MONGODB_URI=your_production_mongodb_uri
   JWT_SECRET=your_production_jwt_secret
   PORT=5000
   REACT_APP_API_URL=https://your-admin-panel.onrender.com/api/admin
   CORS_ORIGINS=https://your-admin-panel.onrender.com
   ```

2. **Update client API URL** in `client/src/context/AuthContext.js` and `client/src/services/api.js`:
   - Replace `http://localhost:5000` with your Render URL
   - Or use environment variable `REACT_APP_API_URL`

### Step 2: Deploy to Render

1. **Create a new Web Service** on Render:
   - Connect your GitHub repository (or push code to a repo)
   - Select "Node" as the environment

2. **Configure the build**:
   - **Build Command**: `npm install && cd client && npm install && npm run build`
   - **Start Command**: `npm start`

3. **Set Environment Variables** in Render Dashboard:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret (same as main backend)
   - `PORT`: 5000
   - `NODE_ENV`: production
   - `REACT_APP_API_URL`: `https://your-service-name.onrender.com/api/admin`
   - `CORS_ORIGINS`: `https://your-service-name.onrender.com`

4. **Deploy**:
   - Render will automatically build and deploy your app
   - Once deployed, access it at `https://your-service-name.onrender.com`

### Step 3: Create Admin User

After deployment, create an admin user:

1. Use MongoDB Atlas to manually create an admin user, OR
2. Use your main backend API to register a user, then update their role to 'admin' in MongoDB:
   ```javascript
   db.users.updateOne(
     { email: "admin@example.com" },
     { $set: { role: "admin" } }
   )
   ```

## Project Structure

```
Campus-Trails-Admin/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # Auth context
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── App.js
│   └── package.json
├── models/                 # Mongoose models
├── routes/                 # Express routes
├── middleware/             # Auth middleware
├── server.js              # Express server
├── render.yaml            # Render configuration
├── Procfile               # Process file for Render
└── package.json
```

## API Endpoints

All endpoints require authentication (Bearer token in Authorization header).

- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/auth/verify` - Verify token
- `GET /api/admin/pins` - Get all pins
- `POST /api/admin/pins` - Create pin
- `PUT /api/admin/pins/:id` - Update pin
- `DELETE /api/admin/pins/:id` - Delete pin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/campuses` - Get all campuses
- `POST /api/admin/campuses` - Create campus
- `POST /api/admin/notifications/send` - Send notification
- `GET /api/admin/feedbacks` - Get all feedbacks
- `GET /api/admin/developers` - Get all developers
- `POST /api/admin/developers` - Create developer

## Security Notes

- All admin routes require JWT authentication
- Only users with `role: 'admin'` can access the admin panel
- JWT tokens expire after 7 days
- CORS is configured to only allow specified origins
- Use HTTPS in production (Render provides this automatically)

## Troubleshooting

1. **Build fails on Render**:
   - Check that all dependencies are in `package.json`
   - Ensure `client/package.json` exists
   - Check build logs in Render dashboard

2. **API calls fail**:
   - Verify `REACT_APP_API_URL` environment variable is set correctly
   - Check CORS settings in server.js
   - Verify JWT token is being sent in Authorization header

3. **Cannot login**:
   - Ensure you have created an admin user in the database
   - Verify JWT_SECRET matches between admin panel and main backend
   - Check that user role is set to 'admin'

## License

ISC
