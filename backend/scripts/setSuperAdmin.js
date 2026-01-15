/**
 * Script to set a user as super_admin
 * 
 * Usage: node scripts/setSuperAdmin.js <email>
 * Example: node scripts/setSuperAdmin.js kenth.barbarona9@gmail.com
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function setSuperAdmin() {
  try {
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB\n');

    // Get email from command line arguments
    const email = process.argv[2];

    if (!email) {
      console.error('❌ Error: Email is required');
      console.log('   Usage: node scripts/setSuperAdmin.js <email>');
      console.log('   Example: node scripts/setSuperAdmin.js kenth.barbarona9@gmail.com');
      process.exit(1);
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`❌ Error: User with email "${email}" not found`);
      process.exit(1);
    }

    // Get previous role
    const previousRole = user.role;
    
    // Update user role to super_admin
    user.role = 'super_admin';
    await user.save();

    console.log(`✅ Successfully set user as super_admin!`);
    console.log(`   Username: ${user.username || 'N/A'}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   User ID: ${user._id}`);
    console.log(`   Previous role: ${previousRole}`);
    console.log(`   New role: super_admin\n`);
    console.log('💡 You can now log out and log back in to see the Super Admins tab!');

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Run the script
setSuperAdmin();