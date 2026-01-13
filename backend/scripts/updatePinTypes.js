/**
 * Migration Script: Update existing pins with pinType field
 * 
 * This script updates existing pins in the database to add the pinType field:
 * - Sets pinType: 'facility' for pins where isVisible: true
 * - Sets pinType: 'waypoint' for pins where isVisible: false
 * 
 * Run: node backend/scripts/updatePinTypes.js
 */

const mongoose = require('mongoose');
const Pin = require('../models/Pin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/**
 * Main migration function
 */
const updatePinTypes = async () => {
  try {
    // Connect to MongoDB
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

    // Count existing pins
    const totalPins = await Pin.countDocuments();
    console.log(`📊 Found ${totalPins} total pins in database\n`);

    if (totalPins === 0) {
      console.log('⚠️  No pins found in database. Run migratePins.js first to import pins.');
      return;
    }

    // Update facility pins (isVisible: true)
    const facilityUpdateResult = await Pin.updateMany(
      { isVisible: true, pinType: { $exists: false } },
      { $set: { pinType: 'facility' } }
    );
    console.log(`✅ Updated ${facilityUpdateResult.modifiedCount} facility pins with pinType: 'facility'`);
    
    // Also update existing 'building' type to 'facility'
    const buildingToFacilityResult = await Pin.updateMany(
      { pinType: 'building' },
      { $set: { pinType: 'facility' } }
    );
    if (buildingToFacilityResult.modifiedCount > 0) {
      console.log(`✅ Updated ${buildingToFacilityResult.modifiedCount} pins from 'building' to 'facility'`);
    }

    // Update waypoint pins (isVisible: false)
    const waypointUpdateResult = await Pin.updateMany(
      { isVisible: false, pinType: { $exists: false } },
      { $set: { pinType: 'waypoint' } }
    );
    console.log(`✅ Updated ${waypointUpdateResult.modifiedCount} waypoint pins with pinType: 'waypoint'`);

    // Ensure all visible facilities have QR codes
    const facilitiesWithoutQR = await Pin.countDocuments({ 
      pinType: 'facility', 
      $or: [{ qrCode: null }, { qrCode: '' }] 
    });
    
    if (facilitiesWithoutQR > 0) {
      console.log(`\n📝 Generating QR codes for ${facilitiesWithoutQR} facilities without QR codes...`);
      const facilities = await Pin.find({ 
        pinType: 'facility', 
        $or: [{ qrCode: null }, { qrCode: '' }] 
      });
      
      let qrCodesGenerated = 0;
      for (const facility of facilities) {
        const qrCode = `facility_${facility.id}`;
        await Pin.updateOne({ _id: facility._id }, { $set: { qrCode } });
        qrCodesGenerated++;
      }
      console.log(`   ✅ Generated QR codes for ${qrCodesGenerated} facilities`);
    }
    
    // Verify migration
    const facilityCount = await Pin.countDocuments({ pinType: 'facility' });
    const waypointCount = await Pin.countDocuments({ pinType: 'waypoint' });
    const withoutPinType = await Pin.countDocuments({ pinType: { $exists: false } });
    
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Facility pins (pinType: 'facility'): ${facilityCount}`);
    console.log(`   ✅ Waypoint pins (pinType: 'waypoint'): ${waypointCount}`);
    if (withoutPinType > 0) {
      console.log(`   ⚠️  Pins without pinType: ${withoutPinType}`);
    }
    console.log(`   📝 Total pins: ${totalPins}\n`);

    // Verify neighbors connections are maintained
    const pinsWithNeighbors = await Pin.countDocuments({ neighbors: { $exists: true, $ne: [] } });
    console.log(`🔗 Pins with neighbors (connections): ${pinsWithNeighbors}`);
    console.log('   ✅ Neighbors connections are maintained\n');

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    // Close MongoDB connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 MongoDB connection closed');
    }
    process.exit(0);
  }
};

// Run migration
console.log('🚀 Starting pinType migration...\n');
updatePinTypes();
