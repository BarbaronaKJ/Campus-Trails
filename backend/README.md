# Campus Trails Backend API

Node.js/Express backend server that connects the Campus Trails mobile app to MongoDB Atlas for dynamic pin data management.

## Features

- **MongoDB Atlas Integration**: Cloud-hosted database for pin data
- **RESTful API**: CRUD operations for pins
- **Image Optimization**: Automatic Cloudinary URL optimization with `f_auto,q_auto` parameters
- **Flexible Pin Management**: Edit all pin fields directly in MongoDB Compass or Atlas

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account (free tier available)
- MongoDB Compass (optional, for visual database management)

## Setup Instructions

### 1. MongoDB Atlas Setup

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account (M0 cluster is free)

2. **Create a Cluster**
   - Choose the **Singapore region** for better performance in the Philippines
   - Choose the free M0 tier
   - Wait for cluster creation (2-3 minutes)

3. **Database Access (Create User)**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create username and password (save these!)
   - Set privileges to "Read and write to any database"
   - Click "Add User"

4. **Network Access (Whitelist IP)**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - For development/testing: Click "Allow Access from Anywhere" (adds `0.0.0.0/0`)
   - ⚠️ **Note**: `0.0.0.0/0` allows access from any IP. For production, use specific IPs.

5. **Get Connection String**
   - Go to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<database-name>` with `campus-trails` (or your preferred name)

   Example connection string:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/campus-trails?retryWrites=true&w=majority
   ```

### 2. Backend Server Setup

1. **Navigate to backend folder**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file**
   Create a `.env` file in the `backend` folder:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/campus-trails?retryWrites=true&w=majority
   PORT=3000
   CORS_ORIGINS=*
   ```

   Replace `username`, `password`, and cluster URL with your actual MongoDB Atlas credentials.

4. **Start the server**
   ```bash
   # Development mode (with auto-reload using nodemon)
   npm run dev

   # Production mode
   npm start
   ```

   You should see:
   ```
   ✅ MongoDB Atlas connected successfully
   🚀 Campus Trails API Server started successfully!
      Server running on port 3000
      Health check: http://localhost:3000/health
      API endpoint: http://localhost:3000/api/pins
   ```

### 3. Migrate Local Pin Data to MongoDB

After setting up the server, migrate your local `pinsData.js` to MongoDB:

```bash
# From the backend folder
node scripts/migratePins.js
```

This script will:
- Read all pins from `pinsData.js`
- Optimize Cloudinary URLs with `f_auto,q_auto`
- Insert them into MongoDB
- Handle duplicates and errors gracefully

## API Endpoints

### GET `/health`
Health check endpoint to verify server is running.

**Response:**
```json
{
  "success": true,
  "message": "Campus Trails API Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### GET `/api/pins`
Fetch all pins from the database.

**Response:**
```json
{
  "success": true,
  "count": 50,
  "data": [
    {
      "id": 0,
      "x": 900,
      "y": 1115,
      "title": "ME",
      "description": "Main Entrance",
      "image": "https://res.cloudinary.com/xxx/image/upload/f_auto,q_auto/v1768038877/image.jpg",
      "category": "Main Entrance",
      "neighbors": [1001, 1001.1],
      "buildingNumber": null,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    },
    ...
  ]
}
```

### GET `/api/pins/:id`
Fetch a single pin by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "x": 1580,
    "y": 630,
    "title": "1",
    "description": "BLDG 1 | Arts & Culture Building",
    "image": "https://res.cloudinary.com/xxx/image/upload/f_auto,q_auto/v1768037837/building1_m5gci2.jpg",
    "category": "Buildings",
    "neighbors": [1009],
    "buildingNumber": 1,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

### GET `/api/pins/category/:category`
Fetch pins by category.

**Response:**
```json
{
  "success": true,
  "count": 10,
  "category": "Buildings",
  "data": [...]
}
```

### POST `/api/pins`
Create a new pin (for admin use).

**Request Body:**
```json
{
  "id": 53,
  "x": 1600,
  "y": 700,
  "title": "53",
  "description": "BLDG 53 | New Building",
  "image": "https://res.cloudinary.com/xxx/image/upload/v1768039999/newbuilding.jpg",
  "category": "Buildings",
  "neighbors": [1009, 1010],
  "buildingNumber": 53
}
```

### PUT `/api/pins/:id`
Update an existing pin (for admin use).

**Request Body:**
```json
{
  "x": 1620,
  "y": 720,
  "description": "BLDG 53 | Updated Building Name",
  "category": "Essential Services"
}
```

## Editing Pins in MongoDB

### Using MongoDB Compass

1. **Download MongoDB Compass**
   - Download from [MongoDB Compass](https://www.mongodb.com/try/download/compass)
   - Install and open MongoDB Compass

2. **Connect to MongoDB Atlas**
   - Use your connection string from MongoDB Atlas
   - Click "Connect" and enter your credentials

3. **Navigate to Your Database**
   - Select your database (e.g., `campus-trails`)
   - Click on the `pins` collection

4. **Edit Pins**
   - Click on any pin document to view/edit
   - Edit any field directly:
     - **title & description**: Update text
     - **x & y**: Change pin positions on the map
     - **image**: Update Cloudinary URL
     - **category**: Change filter category
     - **neighbors**: Update pathfinding network (array of IDs)
   - Click "Update" to save changes

### Using MongoDB Atlas Web Interface

1. Go to MongoDB Atlas dashboard
2. Click "Browse Collections"
3. Select your database and `pins` collection
4. Click on any document to edit
5. Make changes and save

## Pin Schema Fields

All fields are editable directly in MongoDB:

| Field | Type | Description | Editable |
|-------|------|-------------|----------|
| `id` | Mixed (Number/String) | Unique identifier | ✅ Yes (be careful - must be unique) |
| `x` | Number | X coordinate on map | ✅ Yes |
| `y` | Number | Y coordinate on map | ✅ Yes |
| `title` | String | Short label (e.g., "ME", "1") | ✅ Yes |
| `description` | String | Full description | ✅ Yes |
| `image` | String | Cloudinary URL or local path | ✅ Yes |
| `category` | String | Filter category | ✅ Yes |
| `neighbors` | Array | Connected pin IDs for pathfinding | ✅ Yes |
| `buildingNumber` | Number | Building number (1-52) | ✅ Yes (optional) |
| `createdAt` | Date | Creation timestamp | Auto-generated |
| `updatedAt` | Date | Last update timestamp | Auto-updated |

## Image Optimization

All Cloudinary URLs are automatically optimized with `f_auto,q_auto` parameters:

- **Before**: `https://res.cloudinary.com/xxx/image/upload/v1768037837/building1.jpg`
- **After**: `https://res.cloudinary.com/xxx/image/upload/f_auto,q_auto/v1768037837/building1.jpg`

This ensures:
- **f_auto**: Automatic format selection (WebP for modern browsers)
- **q_auto**: Automatic quality optimization (saves data for students)

## Testing the API

### Using cURL

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

### Using Postman or Browser

- Open `http://localhost:3000/health` in your browser
- Open `http://localhost:3000/api/pins` to see all pins

## Troubleshooting

### Connection Error: "MongoServerError: Authentication failed"
- Verify your MongoDB username and password in the `.env` file
- Make sure you've created a database user in MongoDB Atlas

### Connection Error: "MongoServerError: IP not whitelisted"
- Go to MongoDB Atlas → Network Access
- Add your current IP address or `0.0.0.0/0` for all IPs

### Connection Timeout
- Check your internet connection
- Verify the MongoDB Atlas cluster is running
- Ensure you're using the correct connection string format

### CORS Errors in Mobile App
- Update `CORS_ORIGINS` in `.env` to include your mobile app's origin
- For development, `*` allows all origins (not recommended for production)

## Production Deployment

For production deployment:

1. **Use Environment Variables**: Never commit `.env` files
2. **Restrict IP Whitelist**: Use specific IPs instead of `0.0.0.0/0`
3. **Use HTTPS**: Deploy backend with SSL/TLS
4. **Update CORS**: Set `CORS_ORIGINS` to your production app URL
5. **Monitor Performance**: Use MongoDB Atlas monitoring tools
6. **Backup Database**: Enable automatic backups in MongoDB Atlas

## Support

For issues or questions:
1. Check MongoDB Atlas logs
2. Check server console for errors
3. Verify environment variables are set correctly
4. Ensure network access is configured properly
