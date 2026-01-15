/**
 * Script to add test tracking data (searchCount and pathfindingCount) to users
 * This can be used to test the Dashboard tracking functionality
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function addTestTrackingData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get email from command line (optional)
    const email = process.argv[2];
    const searchCount = parseInt(process.argv[3]) || 5;
    const pathfindingCount = parseInt(process.argv[4]) || 3;

    let users;

    if (email) {
      // Update specific user
      users = await User.find({ email: email.toLowerCase() });
      if (users.length === 0) {
        console.error(`❌ User with email ${email} not found`);
        process.exit(1);
      }
      console.log(`📋 Found user: ${email}\n`);
    } else {
      // Update all users
      users = await User.find({});
      console.log(`📋 Found ${users.length} users\n`);
    }

    let updatedCount = 0;

    for (const user of users) {
      // Initialize activity if it doesn't exist
      if (!user.activity) {
        user.activity = {
          savedPins: [],
          feedbackHistory: [],
          searchCount: 0,
          pathfindingCount: 0,
          lastActiveDate: user.updatedAt || new Date()
        };
      }

      // Set test values
      const oldSearchCount = user.activity.searchCount || 0;
      const oldPathfindingCount = user.activity.pathfindingCount || 0;

      user.activity.searchCount = searchCount;
      user.activity.pathfindingCount = pathfindingCount;
      user.activity.lastActiveDate = new Date();

      user.markModified('activity');
      await user.save();

      console.log(`✅ Updated ${user.email}:`);
      console.log(`   searchCount: ${oldSearchCount} -> ${user.activity.searchCount}`);
      console.log(`   pathfindingCount: ${oldPathfindingCount} -> ${user.activity.pathfindingCount}`);
      console.log('');

      updatedCount++;
    }

    console.log(`\n✅ Test data added successfully!`);
    console.log(`   Updated: ${updatedCount} user(s)`);
    console.log(`   Search count: ${searchCount}`);
    console.log(`   Pathfinding count: ${pathfindingCount}`);

    // Verify totals
    const allUsers = await User.find({});
    let totalSearches = 0;
    let totalPathfinding = 0;

    for (const user of allUsers) {
      totalSearches += user.activity?.searchCount || 0;
      totalPathfinding += user.activity?.pathfindingCount || 0;
    }

    console.log(`\n📊 Dashboard Totals (after update):`);
    console.log(`   Total Searches: ${totalSearches}`);
    console.log(`   Total Pathfinding Routes: ${totalPathfinding}`);
    console.log(`   Average Searches Per User: ${(totalSearches / allUsers.length).toFixed(1)}`);
    console.log(`   Average Pathfinding Per User: ${(totalPathfinding / allUsers.length).toFixed(1)}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

console.log('📋 Add Test Tracking Data Script');
console.log('');
console.log('Usage:');
console.log('  node backend/scripts/addTestTrackingData.js [email] [searchCount] [pathfindingCount]');
console.log('');
console.log('Examples:');
console.log('  # Add test data to all users (default: 5 searches, 3 pathfinding)');
console.log('  node backend/scripts/addTestTrackingData.js');
console.log('');
console.log('  # Add test data to specific user');
console.log('  node backend/scripts/addTestTrackingData.js user@example.com');
console.log('');
console.log('  # Add custom counts to all users');
console.log('  node backend/scripts/addTestTrackingData.js "" 10 5');
console.log('');
console.log('  # Add custom counts to specific user');
console.log('  node backend/scripts/addTestTrackingData.js user@example.com 10 5');
console.log('');

addTestTrackingData();
