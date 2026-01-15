/**
 * Script to initialize searchCount and pathfindingCount for existing users
 * Run this once to add these fields to users who don't have them
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function initializeActivityFields() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all users
    const users = await User.find({});
    console.log(`📋 Found ${users.length} users\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      let needsUpdate = false;

      // Initialize activity if it doesn't exist
      if (!user.activity) {
        user.activity = {
          savedPins: [],
          feedbackHistory: [],
          searchCount: 0,
          pathfindingCount: 0,
          lastActiveDate: user.updatedAt || new Date()
        };
        needsUpdate = true;
        console.log(`  ✅ Initialized activity for ${user.email}`);
      } else {
        // Check if searchCount exists
        if (user.activity.searchCount === undefined || user.activity.searchCount === null) {
          user.activity.searchCount = 0;
          needsUpdate = true;
          console.log(`  ✅ Added searchCount for ${user.email}`);
        }

        // Check if pathfindingCount exists
        if (user.activity.pathfindingCount === undefined || user.activity.pathfindingCount === null) {
          user.activity.pathfindingCount = 0;
          needsUpdate = true;
          console.log(`  ✅ Added pathfindingCount for ${user.email}`);
        }

        // Ensure lastActiveDate exists
        if (!user.activity.lastActiveDate) {
          user.activity.lastActiveDate = user.updatedAt || new Date();
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        user.markModified('activity');
        await user.save();
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Updated: ${updatedCount} users`);
    console.log(`   Skipped: ${skippedCount} users (already had fields)`);

    // Verify
    const verifyUsers = await User.find({});
    let hasAllFields = 0;
    let missingFields = 0;

    for (const user of verifyUsers) {
      if (user.activity?.searchCount !== undefined && 
          user.activity?.pathfindingCount !== undefined) {
        hasAllFields++;
      } else {
        missingFields++;
        console.log(`  ⚠️  User ${user.email} still missing fields`);
      }
    }

    console.log(`\n🔍 Verification:`);
    console.log(`   Users with all fields: ${hasAllFields}`);
    console.log(`   Users missing fields: ${missingFields}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

initializeActivityFields();
