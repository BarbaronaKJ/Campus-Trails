/**
 * Debug script for pathfinding routes tracking
 * Shows current pathfinding counts for all users and allows testing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function debugPathfinding() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const command = process.argv[2] || 'show';

    switch (command) {
      case 'show':
        await showPathfindingStats();
        break;
      case 'reset':
        await resetPathfindingCounts();
        break;
      case 'test':
        const email = process.argv[3];
        const count = parseInt(process.argv[4]) || 1;
        await testPathfinding(email, count);
        break;
      case 'help':
        showHelp();
        break;
      default:
        console.log(`❌ Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

async function showPathfindingStats() {
  console.log('📊 Pathfinding Routes Statistics\n');
  console.log('=' .repeat(60));

  // Get all users
  const users = await User.find({}).sort({ 'activity.pathfindingCount': -1 });

  if (users.length === 0) {
    console.log('No users found in database');
    return;
  }

  let totalPathfinding = 0;
  let usersWithPathfinding = 0;
  let usersWithoutActivity = 0;

  console.log('\n📋 Individual User Stats:');
  console.log('-'.repeat(60));
  console.log(`${'Email'.padEnd(35)} | ${'Pathfinding Count'.padEnd(20)} | ${'Search Count'.padEnd(15)}`);
  console.log('-'.repeat(60));

  for (const user of users) {
    const pathfindingCount = user.activity?.pathfindingCount || 0;
    const searchCount = user.activity?.searchCount || 0;
    const hasActivity = user.activity ? '✅' : '❌';

    if (pathfindingCount > 0) {
      usersWithPathfinding++;
    }

    if (!user.activity) {
      usersWithoutActivity++;
    }

    totalPathfinding += pathfindingCount;

    // Only show users with pathfinding or highlight issues
    if (pathfindingCount > 0 || !user.activity) {
      const email = (user.email || 'N/A').substring(0, 34);
      const pathfindingStr = pathfindingCount.toString().padEnd(20);
      const searchStr = searchCount.toString().padEnd(15);
      console.log(`${email.padEnd(35)} | ${pathfindingStr} | ${searchStr} ${hasActivity}`);
    }
  }

  console.log('-'.repeat(60));
  console.log('\n📈 Summary Statistics:');
  console.log('=' .repeat(60));
  console.log(`Total Users: ${users.length}`);
  console.log(`Users with Pathfinding Routes: ${usersWithPathfinding}`);
  console.log(`Users without Activity Object: ${usersWithoutActivity}`);
  console.log(`Total Pathfinding Routes: ${totalPathfinding}`);
  console.log(`Average Pathfinding Routes per User: ${(totalPathfinding / users.length).toFixed(2)}`);
  
  if (usersWithPathfinding > 0) {
    const avgForActiveUsers = totalPathfinding / usersWithPathfinding;
    console.log(`Average for Users with Routes: ${avgForActiveUsers.toFixed(2)}`);
  }

  // Show users with missing activity
  if (usersWithoutActivity > 0) {
    console.log('\n⚠️  Users Missing Activity Object:');
    users.forEach(user => {
      if (!user.activity) {
        console.log(`   - ${user.email} (${user._id})`);
      }
    });
  }

  // Show recent activity
  console.log('\n🕐 Recent Activity (Last 24 hours):');
  console.log('-'.repeat(60));
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let recentCount = 0;
  
  users.forEach(user => {
    if (user.activity?.lastActiveDate) {
      const lastActive = new Date(user.activity.lastActiveDate);
      if (lastActive >= oneDayAgo) {
        recentCount++;
        const pathfindingCount = user.activity.pathfindingCount || 0;
        const searchCount = user.activity.searchCount || 0;
        console.log(`   ${user.email}: ${pathfindingCount} routes, ${searchCount} searches`);
      }
    }
  });

  if (recentCount === 0) {
    console.log('   No activity in the last 24 hours');
  }

  console.log('\n' + '='.repeat(60));
}

async function resetPathfindingCounts() {
  console.log('🔄 Resetting all pathfinding counts to 0...\n');

  const users = await User.find({});
  let updated = 0;

  for (const user of users) {
    if (!user.activity) {
      user.activity = {
        savedPins: [],
        feedbackHistory: [],
        searchCount: user.activity?.searchCount || 0,
        pathfindingCount: 0,
        lastActiveDate: new Date()
      };
    } else {
      user.activity.pathfindingCount = 0;
    }

    user.markModified('activity');
    await user.save();
    updated++;
  }

  console.log(`✅ Reset pathfinding counts for ${updated} users`);
  console.log('📊 Updated statistics:');
  await showPathfindingStats();
}

async function testPathfinding(email, count) {
  if (!email) {
    console.error('❌ Error: Email is required');
    console.log('Usage: node backend/scripts/debugPathfinding.js test <email> [count]');
    return;
  }

  console.log(`🧪 Testing pathfinding tracking for ${email}...\n`);

  const user = await User.findOne({ email: email.toLowerCase() });
  
  if (!user) {
    console.error(`❌ User with email ${email} not found`);
    return;
  }

  const oldCount = user.activity?.pathfindingCount || 0;
  const newCount = oldCount + count;

  // Initialize activity if needed
  if (!user.activity) {
    user.activity = {
      savedPins: [],
      feedbackHistory: [],
      searchCount: 0,
      pathfindingCount: 0,
      lastActiveDate: new Date()
    };
  }

  user.activity.pathfindingCount = newCount;
  user.activity.lastActiveDate = new Date();
  user.markModified('activity');

  await user.save();

  // Also update directly with MongoDB
  await User.updateOne(
    { _id: user._id },
    { 
      $set: { 
        'activity.pathfindingCount': newCount,
        'activity.lastActiveDate': new Date()
      }
    }
  );

  // Verify
  const updatedUser = await User.findById(user._id).lean();
  const verifiedCount = updatedUser.activity?.pathfindingCount || 0;

  console.log('✅ Test update complete:');
  console.log(`   Old count: ${oldCount}`);
  console.log(`   New count: ${newCount}`);
  console.log(`   Verified in DB: ${verifiedCount}`);
  
  if (verifiedCount === newCount) {
    console.log('   ✅ Database update verified successfully!');
  } else {
    console.log('   ⚠️  WARNING: Database count mismatch!');
  }
}

function showHelp() {
  console.log('📋 Pathfinding Routes Debug Script\n');
  console.log('Usage: node backend/scripts/debugPathfinding.js [command] [options]\n');
  console.log('Commands:');
  console.log('  show                    Show pathfinding statistics (default)');
  console.log('  reset                   Reset all pathfinding counts to 0');
  console.log('  test <email> [count]    Add test pathfinding count to a user');
  console.log('  help                    Show this help message\n');
  console.log('Examples:');
  console.log('  node backend/scripts/debugPathfinding.js');
  console.log('  node backend/scripts/debugPathfinding.js show');
  console.log('  node backend/scripts/debugPathfinding.js reset');
  console.log('  node backend/scripts/debugPathfinding.js test user@example.com');
  console.log('  node backend/scripts/debugPathfinding.js test user@example.com 5');
}

// Run the script
if (require.main === module) {
  debugPathfinding();
}

module.exports = { debugPathfinding };
