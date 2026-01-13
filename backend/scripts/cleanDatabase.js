/**
 * Clean Database Script
 * 
 * This script cleans all collections in the CampusTrails database
 * WARNING: This will delete ALL data from the database!
 * 
 * Run: node backend/scripts/cleanDatabase.js
 */

const mongoose = require('mongoose');
const Pin = require('../models/Pin');
const Campus = require('../models/Campus');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const cleanDatabase = async () => {
  try {
    // Check for MONGODB_URI
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set. Please create a .env file in the backend folder.');
    }

    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ Connected to MongoDB Atlas');
    console.log(`   Database: ${mongoose.connection.name}\n`);

    // Get collection names
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    console.log(`📋 Found ${collectionNames.length} collections: ${collectionNames.join(', ')}\n`);

    // Delete all documents from each collection
    console.log('🧹 Cleaning database...\n');
    
    for (const collectionName of collectionNames) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        if (count > 0) {
          await collection.deleteMany({});
          console.log(`   ✅ Deleted ${count} documents from '${collectionName}'`);
        } else {
          console.log(`   ℹ️  Collection '${collectionName}' is already empty`);
        }
      } catch (error) {
        console.error(`   ❌ Error cleaning collection '${collectionName}':`, error.message);
      }
    }

    console.log('\n✅ Database cleaned successfully!');
    console.log('   You can now run the migration script to insert data:\n');
    console.log('   node backend/scripts/migratePins.js\n');

  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
};

// Run the cleanup
cleanDatabase();
