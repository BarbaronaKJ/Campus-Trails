const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Load .env file from backend directory
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS === '*' ? '*' : process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route - API information
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Campus Trails API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
      endpoints: {
      health: '/health',
      api: {
        pins: '/api/pins',
        auth: '/api/auth',
        campuses: '/api/campuses',
        feedbacks: '/api/feedbacks',
        suggestions_and_feedbacks: '/api/suggestions_and_feedbacks',
        notifications: '/api/notifications',
        developers: '/api/developers'
      },
      admin: {
        auth: '/api/admin/auth',
        pins: '/api/admin/pins',
        users: '/api/admin/users',
        campuses: '/api/admin/campuses',
        notifications: '/api/admin/notifications',
        feedbacks: '/api/admin/feedbacks',
        suggestions_and_feedbacks: '/api/admin/suggestions_and_feedbacks',
        developers: '/api/admin/developers'
      }
    },
    documentation: 'See API documentation for endpoint details'
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Campus Trails API Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/pins', require('./routes/pins'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/campuses', require('./routes/campuses'));
app.use('/api/feedbacks', require('./routes/feedbacks')); // For feedbackHistory (pin reports)
app.use('/api/suggestions_and_feedbacks', require('./routes/suggestions_and_feedbacks')); // For About Us suggestions
app.use('/api/notifications', require('./routes/notifications'));

// Public developers endpoint (no auth required for app)
app.get('/api/developers', async (req, res) => {
  try {
    const Developer = require('./models/Developer');
    console.log('📥 Fetching developers from database...');
    const developers = await Developer.find({}).sort({ order: 1 });
    console.log(`✅ Found ${developers.length} developers in database`);
    console.log('Developers:', developers.map(d => ({ name: d.name, email: d.email })));
    res.json({ success: true, developers });
  } catch (error) {
    console.error('❌ Get developers error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Admin Panel API Routes
app.use('/api/admin/auth', require('./routes/admin/auth'));
app.use('/api/admin/pins', require('./routes/admin/pins'));
app.use('/api/admin/users', require('./routes/admin/users'));
app.use('/api/admin/admins', require('./routes/admin/admins')); // Separate admins collection
app.use('/api/admin/campuses', require('./routes/admin/campuses'));
app.use('/api/admin/notifications', require('./routes/admin/notifications'));
app.use('/api/admin/feedbacks', require('./routes/admin/feedbacks')); // For feedbackHistory
app.use('/api/admin/suggestions_and_feedbacks', require('./routes/admin/suggestions_and_feedbacks')); // For About Us suggestions
app.use('/api/admin/developers', require('./routes/admin/developers'));

// MongoDB Connection
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      // These options are recommended for MongoDB Atlas
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });

    console.log('✅ MongoDB Atlas connected successfully');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('   Please check your MONGODB_URI in the .env file');
    console.error('   Make sure your IP address is whitelisted in MongoDB Atlas (0.0.0.0/0 for all IPs)');
    process.exit(1);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log('\n🚀 Campus Trails API Server started successfully!');
      console.log(`   Server running on port ${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/health`);
      console.log(`   API endpoint: http://localhost:${PORT}/api/pins`);
      console.log('\n📝 Note: Make sure your mobile app is configured to use this API endpoint\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();

module.exports = app;
