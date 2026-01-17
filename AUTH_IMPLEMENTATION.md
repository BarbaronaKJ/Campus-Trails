# User Authentication Implementation ✅

## Summary
User login and registration functionality has been fully implemented with MongoDB database integration. Users can now register, login, and have their data (saved pins, feedback history, settings) synced with the database.

## Backend Implementation

### 1. User Model (`backend/models/User.js`)
- ✅ User schema with username, email, password (hashed with bcrypt)
- ✅ Profile picture support (Cloudinary URL)
- ✅ Activity tracking (saved pins, feedback history, active dates)
- ✅ Settings (dark mode, alert preferences)
- ✅ Password hashing before save (bcrypt with salt rounds: 12)
- ✅ Password comparison method for login
- ✅ Methods to update last active date
- ✅ JSON serialization without password

### 2. Auth Routes (`backend/routes/auth.js`)
- ✅ **POST /api/auth/register** - Register new user
  - Validates username (min 3 chars), email, password
  - Checks password strength (capital letter + symbol)
  - Checks for duplicate username/email
  - Returns user data and JWT token
  
- ✅ **POST /api/auth/login** - Login user
  - Accepts username OR email for login
  - Validates credentials
  - Returns user data and JWT token
  - Updates last active date
  
- ✅ **GET /api/auth/me** - Get current user (protected)
  - Requires Bearer token in Authorization header
  - Returns current user profile
  
- ✅ **PUT /api/auth/profile** - Update profile (protected)
  - Update profile picture and settings
  - Requires authentication token
  
- ✅ **PUT /api/auth/activity** - Update activity (protected)
  - Sync saved pins and feedback history to database
  - Requires authentication token

### 3. Dependencies Installed
- ✅ `bcryptjs` - Password hashing
- ✅ `jsonwebtoken` - JWT token generation

### 4. Server Configuration (`backend/server.js`)
- ✅ Auth routes added: `/api/auth`

## Frontend Implementation

### 1. API Service (`services/api.js`)
- ✅ `register(username, email, password)` - Register new user
- ✅ `login(usernameOrEmail, password)` - Login user
- ✅ `getCurrentUser(token)` - Get current user profile
- ✅ `updateUserProfile(token, profileData)` - Update profile
- ✅ `updateUserActivity(token, activityData)` - Sync activity data

### 2. App.js Updates
- ✅ **Authentication State**:
  - `isLoggedIn` - Login status
  - `authToken` - JWT token
  - `currentUser` - Current user data
  - `authLoading` - Loading state for auth operations
  - `authError` - Error messages

- ✅ **Login Handler**:
  - Validates username and password
  - Calls login API
  - Stores token and user data
  - Saves to localStorage for persistence
  - Updates user profile, saved pins, feedback history, and settings
  - Shows error messages if login fails

- ✅ **Registration Handler**:
  - Validates all fields (username, email, password, confirm password)
  - Checks password strength (capital letter + symbol)
  - Calls register API
  - Stores token and user data
  - Saves to localStorage for persistence
  - Shows error messages if registration fails

- ✅ **Session Restoration** (useEffect):
  - Checks localStorage for auth token on app load
  - Validates token with API
  - Restores user session if token is valid
  - Clears invalid/expired tokens

- ✅ **Save Pin Handler** (Updated):
  - Saves locally (localStorage)
  - Syncs with database if user is logged in
  - Updates current user data after sync

- ✅ **Feedback Handler** (Updated):
  - Saves locally (localStorage)
  - Syncs with database if user is logged in
  - Updates current user data after sync

- ✅ **Logout Handler**:
  - Clears auth state
  - Removes token from localStorage
  - Resets user data

## Database Schema

### User Document Structure
```javascript
{
  username: String (unique, min 3 chars),
  email: String (unique, lowercase),
  password: String (hashed, min 6 chars),
  profilePicture: String (Cloudinary URL, optional),
  activity: {
    savedPins: [{ id, title, description, x, y }],
    feedbackHistory: [{ id, pinId, pinTitle, rating, comment, date }],
    firstActiveDate: Date,
    lastActiveDate: Date
  },
  settings: {
    darkMode: Boolean,
    alerts: {
      facilityUpdates: Boolean,
      securityAlerts: Boolean,
      eventReminders: Boolean
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Setup Instructions

### 1. Backend Setup
1. **Add JWT_SECRET to `.env`**:
   ```bash
   cd backend
   # Add to .env file:
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d  # Optional: token expiration (default: 7 days)
   ```

2. **Start Backend Server**:
   ```bash
   cd backend
   npm install  # Should already be done, but run if needed
   npm start    # or npm run dev for nodemon
   ```

### 2. Frontend Setup
1. **Update API Base URL** (if needed):
   - For physical devices: Update `API_BASE_URL` in `services/api.js` to your computer's IP address
   - For emulator/simulator: `http://localhost:3000` works

2. **Start Frontend**:
   ```bash
   npm start
   ```

## Usage

### Registration
1. Click user icon in footer
2. Select "Register" tab
3. Enter:
   - Username (min 3 characters)
   - Email (valid format)
   - Password (must have capital letter + symbol, min 6 chars)
   - Confirm Password
4. Click "Register"
5. On success, user is automatically logged in

### Login
1. Click user icon in footer
2. Enter username/email and password
3. Click "Login"
4. On success, user data is loaded and synced

### Auto-Login
- If user has a valid token in localStorage, they are automatically logged in on app load
- Token is validated with the backend before restoring session

### Data Sync
- **Saved Pins**: Automatically synced to database when user saves/removes a pin (if logged in)
- **Feedback**: Automatically synced to database when user submits feedback (if logged in)
- **Settings**: Stored in user document in database
- **Offline/Guest Mode**: Data is still saved locally in localStorage, but not synced to database

### Logout
1. Open User Profile modal
2. Go to Account Settings tab
3. Click "Logout" button
4. Confirm logout
5. User session is cleared and redirected to login

## Security Features

- ✅ **Password Hashing**: bcrypt with 12 salt rounds
- ✅ **JWT Tokens**: Secure token-based authentication
- ✅ **Token Validation**: Tokens are validated on every protected route
- ✅ **Password Requirements**: Capital letter + symbol required
- ✅ **Input Validation**: Username, email, password validation on both frontend and backend
- ✅ **Error Handling**: Proper error messages without exposing sensitive info

## Testing

### Test Registration
```bash
# Using curl or Postman
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test123!"
}
```

### Test Login
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "testuser",  # or "email": "test@example.com"
  "password": "Test123!"
}
```

### Test Protected Route
```bash
GET http://localhost:3000/api/auth/me
Authorization: Bearer <your-jwt-token>
```

## Next Steps (Optional Enhancements)

- [ ] Add password reset functionality
- [ ] Add email verification
- [ ] Add refresh token mechanism
- [ ] Add rate limiting for auth routes
- [ ] Add account deletion functionality
- [ ] Add profile picture upload with Cloudinary
- [ ] Add social login (Google, Facebook)

## Notes

- **JWT Secret**: Change `JWT_SECRET` in production to a strong, random string
- **Token Expiration**: Default is 7 days. Adjust `JWT_EXPIRES_IN` in `.env` if needed
- **Password Strength**: Currently requires capital letter + symbol. Can be adjusted in validation
- **Offline Support**: App works offline (localStorage) but syncs when online and logged in

## Troubleshooting

### "Invalid token" error
- Token may have expired (default: 7 days)
- Clear localStorage and login again
- Check `JWT_SECRET` matches between backend restarts

### "Connection refused" error
- Make sure backend server is running (`npm start` in `backend/` folder)
- Check `API_BASE_URL` in `services/api.js` matches your backend URL
- For physical devices, use your computer's IP address instead of `localhost`

### "Username already exists" error
- Username must be unique
- Try a different username
- Check MongoDB for existing users

### Registration/Login not working
- Check backend server logs for errors
- Verify MongoDB connection is working
- Check that all required fields are filled
- Verify password meets requirements (capital letter + symbol)
