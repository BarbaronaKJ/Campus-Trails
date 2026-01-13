/**
 * Vercel Serverless Function - Main API Handler
 * Handles all API routes as a single Express app
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS === '*' ? '*' : process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route (both /health and /api/health)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Campus Trails API Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Campus Trails API Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// MongoDB Connection (cached for serverless)
let cachedDb = null;
let isConnecting = false;

const connectDB = async () => {
  // Return cached connection if available
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  // If already connecting, wait for it
  if (isConnecting) {
    await new Promise(resolve => {
      const checkConnection = setInterval(() => {
        if (cachedDb && mongoose.connection.readyState === 1) {
          clearInterval(checkConnection);
          resolve();
        }
      }, 100);
    });
    return cachedDb;
  }

  isConnecting = true;

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    cachedDb = mongoose.connection;
    console.log('✅ MongoDB Atlas connected successfully');
    
    // Handle disconnection
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
      cachedDb = null;
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err);
      cachedDb = null;
    });

    isConnecting = false;
    return cachedDb;
  } catch (error) {
    isConnecting = false;
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
};

// API Routes
app.use('/api/pins', require('../backend/routes/pins'));
app.use('/api/auth', require('../backend/routes/auth'));
app.use('/api/campuses', require('../backend/routes/campuses'));
app.use('/api/feedbacks', require('../backend/routes/feedbacks'));

// Vercel serverless function handler
module.exports = async (req, res) => {
  // Log incoming request for debugging
  console.log(`📥 ${req.method} ${req.url}`);
  
  // Connect to MongoDB before handling request
  try {
    await connectDB();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }

  // Handle the request with Express
  // Note: Express app handles all routes including /api/* and /health
  // Vercel passes the full path, so /api/pins becomes /api/pins in Express
  return app(req, res);
};
