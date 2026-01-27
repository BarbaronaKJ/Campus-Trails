/**
 * Migration Script: Generate QR codes for all existing rooms
 *
 * This script generates QR codes for all rooms that don't have one.
 * Format: campustrails://room/buildingId_f{floorLevel}_normalizedRoomName
 *
 * Run: node backend/scripts/generateRoomQrCodes.js
 */

const mongoose = require('mongoose');
const Pin = require('../models/Pin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/**
 * Generate QR code for a room
 * Format: campustrails://room/buildingId_f{floorLevel}_normalizedRoomName
 */
const generateRoomQrCode = (buildingId, floorLevel, roomName) => {
    if (!roomName || !roomName.trim()) {
        return null;
    }

    // Normalize room name: remove common prefixes like "CR | ", "9-", "41-", etc.
    let normalizedName = roomName.trim();
    normalizedName = normalizedName.replace(/^(CR\s*\|\s*|9-|41-|etc\.\s*)/i, '');

    // Replace spaces with underscores and convert to uppercase
    normalizedName = normalizedName.replace(/\s+/g, '_').toUpperCase();

    // Generate QR code in format: campustrails://room/buildingId_f{floorLevel}_normalizedRoomName
    const roomId = `${buildingId}_f${floorLevel}_${normalizedName}`;
    return `campustrails://room/${roomId}`;
};

/**
 * Main migration function
 */
const generateRoomQrCodes = async () => {
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
        console.log('✅ Connected to MongoDB Atlas\n');

        // Find all pins with floors and rooms
        const pins = await Pin.find({
            floors: { $exists: true, $ne: [] }
        }).lean();

        console.log(`📋 Found ${pins.length} buildings with floors\n`);

        let totalRooms = 0;
        let roomsWithoutQr = 0;
        let qrCodesGenerated = 0;

        for (const pin of pins) {
            if (!pin.floors || !Array.isArray(pin.floors)) continue;

            let pinUpdated = false;
            const updatedFloors = pin.floors.map(floor => {
                if (!floor.rooms || !Array.isArray(floor.rooms)) {
                    return floor;
                }

                const updatedRooms = floor.rooms.map(room => {
                    totalRooms++;

                    // Check if room has QR code (also update old format to new format)
                    const needsUpdate = !room.qrCode || 
                                      room.qrCode.trim() === '' || 
                                      (!room.qrCode.startsWith('campustrails://room/') && room.qrCode.includes('_f'));
                    
                    if (needsUpdate) {
                        if (!room.qrCode || room.qrCode.trim() === '') {
                            roomsWithoutQr++;
                        }

                        // Generate QR code in new format
                        const qrCode = generateRoomQrCode(pin.id, floor.level, room.name);

                        if (qrCode) {
                            qrCodesGenerated++;
                            console.log(`✅ Generated QR code for room "${room.name}" (Floor ${floor.level}, Building ${pin.id}): ${qrCode}`);

                            return {
                                ...room,
                                qrCode: qrCode
                            };
                        }
                    }

                    return room;
                });

                if (updatedRooms.some((r, idx) => r.qrCode !== floor.rooms[idx]?.qrCode)) {
                    pinUpdated = true;
                    return {
                        ...floor,
                        rooms: updatedRooms
                    };
                }

                return floor;
            });

            // Update pin if any rooms were modified
            if (pinUpdated) {
                await Pin.findByIdAndUpdate(pin._id, {
                    $set: { floors: updatedFloors }
                });
                console.log(`💾 Updated building ${pin.id} (${pin.title || pin.description || 'Untitled'})\n`);
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`   📋 Total rooms processed: ${totalRooms}`);
        console.log(`   ⚠️  Rooms without QR codes: ${roomsWithoutQr}`);
        console.log(`   ✅ QR codes generated: ${qrCodesGenerated}`);
        console.log('\n✅ Migration completed successfully!');

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
            console.log('\n🔌 Disconnected from MongoDB');
        }
        process.exit(0);
    }
};

// Run migration
generateRoomQrCodes();
