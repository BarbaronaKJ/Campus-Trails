const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Pin = require('../models/Pin');

/**
 * GET /api/pins
 * Fetch pins from the database (excludes invisible waypoints by default)
 * Query Parameters:
 *   - campusId: (optional) Filter by campus ID
 *   - includeInvisible: true/false (default: false) - Include invisible waypoints for pathfinding
 * Response: Array of pin documents (visible only, unless includeInvisible=true)
 */
router.get('/', async (req, res) => {
  try {
    const campusId = req.query.campusId || null;
    const includeInvisible = req.query.includeInvisible === 'true' || req.query.includeInvisible === '1';
    
    // Fetch pins using the new schema (all pins in one collection with isVisible flag)
    const query = campusId ? { campusId } : {};
    if (!includeInvisible) {
      query.isVisible = true;
    }
    
    const pins = await Pin.find(query).sort({ id: 1 }).lean();
    
    // Debug: Log besideRooms for stairs/elevators to verify data is being returned
    pins.forEach(pin => {
      if (pin.floors && Array.isArray(pin.floors)) {
        pin.floors.forEach(floor => {
          if (floor.rooms && Array.isArray(floor.rooms)) {
            floor.rooms.forEach(room => {
              const roomName = (room.name || '').toUpperCase();
              const roomDesc = (room.description || '').toUpperCase();
              const isStairs = roomName.includes('STAIRS') || roomName.includes('STAIR') || roomName.startsWith('S ') || roomName === 'S' || roomDesc.includes('STAIRS') || roomDesc.includes('STAIR');
              const isElevator = roomName.includes('ELEVATOR') || roomName.startsWith('E ') || roomName === 'E' || roomDesc.includes('ELEVATOR');
              
              if ((isStairs || isElevator) && room.besideRooms && Array.isArray(room.besideRooms) && room.besideRooms.length > 0) {
                console.log(`📤 API Response - ${isStairs ? 'STAIRS' : 'ELEVATOR'}: Pin ${pin.id}, Floor ${floor.level}, Room ${room.name}, besideRooms:`, room.besideRooms);
              }
            });
          }
        });
      }
    });
    
    // Separate visible pins and invisible waypoints for response metadata
    const visiblePins = pins.filter(pin => pin.isVisible === true);
    const invisibleWaypoints = pins.filter(pin => pin.isVisible === false);
    
    // Optimize Cloudinary URLs for pins before sending
    const optimizedPins = pins.map(pin => ({
      ...pin,
      image: pin.image?.includes('res.cloudinary.com') && !pin.image.includes('f_auto,q_auto')
        ? (() => {
            const uploadIndex = pin.image.indexOf('/upload/');
            if (uploadIndex !== -1) {
              const baseUrl = pin.image.substring(0, uploadIndex + '/upload/'.length);
              const pathAfterUpload = pin.image.substring(uploadIndex + '/upload/'.length);
              return `${baseUrl}f_auto,q_auto/${pathAfterUpload}`;
            }
            return pin.image;
          })()
        : pin.image
    }));
    
    // For backward compatibility, add isInvisible flag to invisible pins
    const pinsWithFlags = optimizedPins.map(pin => ({
      ...pin,
      isInvisible: !pin.isVisible // Backward compatibility
    }));
    
    res.json({
      success: true,
      count: pinsWithFlags.length,
      pinCount: visiblePins.length,
      waypointCount: invisibleWaypoints.length,
      includeInvisible: includeInvisible,
      data: pinsWithFlags
    });
  } catch (error) {
    console.error('Error fetching pins:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pins from database',
      error: error.message
    });
  }
});

/**
 * GET /api/pins/:id
 * Fetch a single pin by ID (legacy ID or _id)
 * Query Parameters:
 *   - campusId: (optional) Filter by campus ID
 * Response: Pin document
 */
/**
 * GET /api/pins/qr/:qrCode
 * Fetch a pin by QR code identifier
 * Response: Pin document
 */
router.get('/qr/:qrCode', async (req, res) => {
  try {
    const { qrCode } = req.params;
    
    if (!qrCode) {
      return res.status(400).json({
        success: false,
        message: 'QR code is required'
      });
    }

    const pin = await Pin.findOne({ qrCode }).lean();
    
    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'Pin not found for the given QR code'
      });
    }

    // Optimize Cloudinary URL
    let optimizedImage = pin.image;
    if (pin.image?.includes('res.cloudinary.com') && !pin.image.includes('f_auto,q_auto')) {
      const uploadIndex = pin.image.indexOf('/upload/');
      if (uploadIndex !== -1) {
        const baseUrl = pin.image.substring(0, uploadIndex + '/upload/'.length);
        const pathAfterUpload = pin.image.substring(uploadIndex + '/upload/'.length);
        optimizedImage = `${baseUrl}f_auto,q_auto/${pathAfterUpload}`;
      }
    }

    const pinWithOptimizedImage = {
      ...pin,
      image: optimizedImage,
      isInvisible: !pin.isVisible // Backward compatibility
    };

    res.json({
      success: true,
      data: pinWithOptimizedImage
    });
  } catch (error) {
    console.error('Error fetching pin by QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pin',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/pins/room/:roomId
 * Fetch a room by QR code identifier (format: buildingId_floorLevel_roomName)
 * Response: Room data with building information
 */
router.get('/room/:roomId', async (req, res) => {
  try {
    let { roomId } = req.params;
    
    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    // Extract roomId from deep link format if present: campustrails://room/{roomId}
    if (roomId.startsWith('campustrails://room/')) {
      roomId = roomId.replace('campustrails://room/', '');
    }

    // Parse room ID format: buildingId_f{floorLevel}_roomName
    const parts = roomId.split('_f');
    if (parts.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID format'
      });
    }

    const buildingId = parts[0];
    const floorAndRoom = parts[1];
    const floorMatch = floorAndRoom.match(/^(\d+)_(.+)$/);
    
    if (!floorMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID format'
      });
    }

    const floorLevel = parseInt(floorMatch[1]);
    // Convert underscores back to spaces and normalize
    let roomName = floorMatch[2].replace(/_/g, ' ').trim();
    
    console.log(`🔍 Looking for room: "${roomName}" on floor ${floorLevel} in building ${buildingId}`);

    // Find the building
    const building = await Pin.findOne({ 
      $or: [
        { id: buildingId },
        { _id: mongoose.Types.ObjectId.isValid(buildingId) ? buildingId : null }
      ]
    }).lean();

    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Building not found for the given room'
      });
    }

    // Find the room in the building's floors
    let foundRoom = null;
    let foundFloor = null;

    if (building.floors && Array.isArray(building.floors)) {
      for (const floor of building.floors) {
        if (floor.level === floorLevel && floor.rooms) {
          // First, try to match by qrCode field if it exists
          foundRoom = floor.rooms.find(r => {
            if (!r.qrCode) return false;
            
            // Extract roomId from stored QR code if it's a deep link
            let storedQrCode = r.qrCode;
            if (storedQrCode.startsWith('campustrails://room/')) {
              storedQrCode = storedQrCode.replace('campustrails://room/', '');
            }
            
            // Match by extracted roomId
            if (storedQrCode === roomId) {
              return true;
            }
            
            // Also check if qrCode matches the room ID format
            const qrParts = storedQrCode.split('_f');
            if (qrParts.length >= 2) {
              const qrFloorAndRoom = qrParts[1];
              const qrFloorMatch = qrFloorAndRoom.match(/^(\d+)_(.+)$/);
              if (qrFloorMatch && parseInt(qrFloorMatch[1]) === floorLevel) {
                const qrRoomName = qrFloorMatch[2].replace(/_/g, ' ').trim();
                if (qrRoomName.toLowerCase() === roomName.toLowerCase()) {
                  return true;
                }
              }
            }
            return false;
          });
          
          // If not found by qrCode, try matching by name
          if (!foundRoom) {
            // Try multiple matching strategies for room name
            foundRoom = floor.rooms.find(r => {
              if (!r.name) return false;
              const rName = String(r.name).trim();
              const searchName = String(roomName).trim();
              
              // Normalize both names for comparison
              const normalizeName = (name) => {
                // Remove common prefixes like "CR | ", "9-", etc.
                let normalized = name.replace(/^(CR\s*\|\s*|9-|41-|etc\.\s*)/i, '');
                // Replace multiple spaces/underscores with single underscore
                normalized = normalized.replace(/[\s_]+/g, '_');
                // Remove special characters and convert to lowercase
                normalized = normalized.replace(/[^\w]/g, '').toLowerCase();
                return normalized;
              };
              
              const rNameNormalized = normalizeName(rName);
              const searchNameNormalized = normalizeName(searchName);
              
              // Exact match
              if (rName === searchName) return true;
              // Case-insensitive match
              if (rName.toLowerCase() === searchName.toLowerCase()) return true;
              // Normalized match (handles spaces, underscores, prefixes)
              if (rNameNormalized === searchNameNormalized) return true;
              // Partial match - check if search name is contained in room name (normalized)
              if (rNameNormalized.includes(searchNameNormalized) || searchNameNormalized.includes(rNameNormalized)) return true;
              // Match room name without prefixes (e.g., "COMFORT ROOM" matches "CR | COMFORT ROOM")
              const rNameWithoutPrefix = rName.replace(/^[^|]+\|\s*/i, '').trim();
              if (rNameWithoutPrefix.toLowerCase() === searchName.toLowerCase()) return true;
              // Match description if name doesn't match
              if (r.description) {
                const rDesc = String(r.description).trim();
                if (rDesc.toLowerCase() === searchName.toLowerCase()) return true;
                const rDescNormalized = normalizeName(rDesc);
                if (rDescNormalized === searchNameNormalized) return true;
              }
              return false;
            });
          }
          
          if (foundRoom) {
            foundFloor = floor;
            break;
          }
        }
      }
    }

    if (!foundRoom) {
      // Log available rooms for debugging
      const availableRooms = [];
      if (building.floors && Array.isArray(building.floors)) {
        building.floors.forEach(floor => {
          if (floor.level === floorLevel && floor.rooms) {
            floor.rooms.forEach(r => {
              if (r.name) {
                availableRooms.push(`"${r.name}"`);
              }
            });
          }
        });
      }
      console.log(`❌ Room not found. Available rooms on floor ${floorLevel}:`, availableRooms);
      
      return res.status(404).json({
        success: false,
        message: `Room not found in the building. Searched for: "${roomName}" on floor ${floorLevel}. Available rooms: ${availableRooms.join(', ')}`
      });
    }
    
    console.log(`✅ Found room: "${foundRoom.name}" on floor ${floorLevel}`);

    // Optimize building image URL
    let optimizedImage = building.image;
    if (building.image?.includes('res.cloudinary.com') && !building.image.includes('f_auto,q_auto')) {
      const uploadIndex = building.image.indexOf('/upload/');
      if (uploadIndex !== -1) {
        const baseUrl = building.image.substring(0, uploadIndex + '/upload/'.length);
        const pathAfterUpload = building.image.substring(uploadIndex + '/upload/'.length);
        optimizedImage = `${baseUrl}f_auto,q_auto/${pathAfterUpload}`;
      }
    }

    // Optimize room image URL if present
    if (foundRoom.image?.includes('res.cloudinary.com') && !foundRoom.image.includes('f_auto,q_auto')) {
      const uploadIndex = foundRoom.image.indexOf('/upload/');
      if (uploadIndex !== -1) {
        const baseUrl = foundRoom.image.substring(0, uploadIndex + '/upload/'.length);
        const pathAfterUpload = foundRoom.image.substring(uploadIndex + '/upload/'.length);
        foundRoom.image = `${baseUrl}f_auto,q_auto/${pathAfterUpload}`;
      }
    }

    res.json({
      success: true,
      data: {
        room: foundRoom,
        building: {
          ...building,
          image: optimizedImage
        },
        floor: foundFloor,
        floorLevel
      }
    });
  } catch (error) {
    console.error('Error fetching room by QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching room',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pinId = req.params.id;
    const campusId = req.query.campusId || null;
    
    // Use the model's static method to find pin by ID
    const pin = await Pin.getPinById(pinId, campusId);
    
    if (!pin) {
      return res.status(404).json({
        success: false,
        message: `Pin with ID ${pinId} not found`
      });
    }
    
    // Optimize Cloudinary URL if needed
    if (pin.image?.includes('res.cloudinary.com') && !pin.image.includes('f_auto,q_auto')) {
      const uploadIndex = pin.image.indexOf('/upload/');
      if (uploadIndex !== -1) {
        const baseUrl = pin.image.substring(0, uploadIndex + '/upload/'.length);
        const pathAfterUpload = pin.image.substring(uploadIndex + '/upload/'.length);
        pin.image = `${baseUrl}f_auto,q_auto/${pathAfterUpload}`;
      }
    }
    
    // Add isInvisible for backward compatibility
    const pinWithFlags = {
      ...pin,
      isInvisible: !pin.isVisible
    };
    
    res.json({
      success: true,
      data: pinWithFlags
    });
  } catch (error) {
    console.error('Error fetching pin:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pin from database',
      error: error.message
    });
  }
});

/**
 * GET /api/pins/category/:category
 * Fetch pins by category (excludes invisible waypoints by default)
 * Query Parameters:
 *   - campusId: (REQUIRED) Filter by campus ID
 *   - includeInvisible: true/false (default: false) - Include invisible waypoints
 * Response: Array of pins in the specified category
 */
router.get('/category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const campusId = req.query.campusId;
    const includeInvisible = req.query.includeInvisible === 'true' || req.query.includeInvisible === '1';
    
    // campusId is required for category filtering
    if (!campusId) {
      return res.status(400).json({
        success: false,
        message: 'campusId query parameter is required'
      });
    }
    
    // Fetch pins by category using the new schema
    const pins = await Pin.getPinsByCategory(campusId, category, includeInvisible);
    
    // Optimize Cloudinary URLs
    const optimizedPins = pins.map(pin => ({
      ...pin,
      image: pin.image?.includes('res.cloudinary.com') && !pin.image.includes('f_auto,q_auto')
        ? (() => {
            const uploadIndex = pin.image.indexOf('/upload/');
            if (uploadIndex !== -1) {
              const baseUrl = pin.image.substring(0, uploadIndex + '/upload/'.length);
              const pathAfterUpload = pin.image.substring(uploadIndex + '/upload/'.length);
              return `${baseUrl}f_auto,q_auto/${pathAfterUpload}`;
            }
            return pin.image;
          })()
        : pin.image,
      isInvisible: !pin.isVisible // Backward compatibility
    }));
    
    res.json({
      success: true,
      count: optimizedPins.length,
      category,
      campusId,
      includeInvisible: includeInvisible,
      data: optimizedPins
    });
  } catch (error) {
    console.error('Error fetching pins by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pins by category',
      error: error.message
    });
  }
});

/**
 * GET /api/pins/search
 * Search pins by title (filters by campusId)
 * Query Parameters:
 *   - campusId: (REQUIRED) Filter by campus ID
 *   - q: (REQUIRED) Search query string
 *   - includeInvisible: true/false (default: false) - Include invisible waypoints
 * Response: Array of matching pins
 */
router.get('/search', async (req, res) => {
  try {
    const campusId = req.query.campusId;
    const searchQuery = req.query.q || req.query.query;
    const includeInvisible = req.query.includeInvisible === 'true' || req.query.includeInvisible === '1';
    
    // campusId and search query are required
    if (!campusId) {
      return res.status(400).json({
        success: false,
        message: 'campusId query parameter is required'
      });
    }
    
    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        message: 'q or query parameter is required for search'
      });
    }
    
    // Search pins using the new schemaS
    const pins = await Pin.searchPins(campusId, searchQuery, includeInvisible);
    
    // Optimize Cloudinary URLs
    const optimizedPins = pins.map(pin => ({
      ...pin,
      image: pin.image?.includes('res.cloudinary.com') && !pin.image.includes('f_auto,q_auto')
        ? (() => {
            const uploadIndex = pin.image.indexOf('/upload/');
            if (uploadIndex !== -1) {
              const baseUrl = pin.image.substring(0, uploadIndex + '/upload/'.length);
              const pathAfterUpload = pin.image.substring(uploadIndex + '/upload/'.length);
              return `${baseUrl}f_auto,q_auto/${pathAfterUpload}`;
            }
            return pin.image;
          })()
        : pin.image,
      isInvisible: !pin.isVisible // Backward compatibility
    }));
    
    res.json({
      success: true,
      count: optimizedPins.length,
      query: searchQuery,
      campusId,
      includeInvisible: includeInvisible,
      data: optimizedPins
    });
  } catch (error) {
    console.error('Error searching pins:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching pins',
      error: error.message
    });
  }
});

/**
 * POST /api/pins
 * Create a new pin (for admin use)
 * Request Body: { campusId, id, x, y, title, description, image, category, isVisible, qrCode, neighbors, buildingNumber, floors }
 */
router.post('/', async (req, res) => {
  try {
    const pinData = req.body;
    
    // Validate required fields
    if (!pinData.campusId || !pinData.id || !pinData.title) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: campusId, id, title'
      });
    }
    
    // Set defaults
    if (pinData.isVisible === undefined) {
      pinData.isVisible = true; // Default to visible
    }
    
    // Check if pin with same ID and campusId already exists
    const existingPin = await Pin.findOne({ id: pinData.id, campusId: pinData.campusId });
    if (existingPin) {
      return res.status(409).json({
        success: false,
        message: `Pin with ID ${pinData.id} already exists for this campus`
      });
    }
    
    // Optimize Cloudinary URL if provided
    if (pinData.image?.includes('res.cloudinary.com') && !pinData.image.includes('f_auto,q_auto')) {
      const uploadIndex = pinData.image.indexOf('/upload/');
      if (uploadIndex !== -1) {
        const baseUrl = pinData.image.substring(0, uploadIndex + '/upload/'.length);
        const pathAfterUpload = pinData.image.substring(uploadIndex + '/upload/'.length);
        pinData.image = `${baseUrl}f_auto,q_auto/${pathAfterUpload}`;
      }
    }
    
    const pin = await Pin.create(pinData);
    
    res.status(201).json({
      success: true,
      message: 'Pin created successfully',
      data: pin
    });
  } catch (error) {
    console.error('Error creating pin:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating pin',
      error: error.message
    });
  }
});

/**
 * PUT /api/pins/:id
 * Update an existing pin (for admin use)
 * Query Parameters:
 *   - campusId: (optional) Filter by campus ID
 * Request Body: { x, y, title, description, image, category, isVisible, qrCode, neighbors, buildingNumber, floors }
 */
router.put('/:id', async (req, res) => {
  try {
    const pinId = req.params.id;
    const campusId = req.query.campusId || null;
    const updateData = req.body;
    
    // Build query
    const query = {};
    if (mongoose.Types.ObjectId.isValid(pinId)) {
      query._id = pinId;
    } else {
      query.id = isNaN(pinId) ? pinId : Number(pinId);
    }
    if (campusId) {
      query.campusId = campusId;
    }
    
    // Optimize Cloudinary URL if provided
    if (updateData.image?.includes('res.cloudinary.com') && !updateData.image.includes('f_auto,q_auto')) {
      const uploadIndex = updateData.image.indexOf('/upload/');
      if (uploadIndex !== -1) {
        const baseUrl = updateData.image.substring(0, uploadIndex + '/upload/'.length);
        const pathAfterUpload = updateData.image.substring(uploadIndex + '/upload/'.length);
        updateData.image = `${baseUrl}f_auto,q_auto/${pathAfterUpload}`;
      }
    }
    
    const pin = await Pin.findOneAndUpdate(
      query,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!pin) {
      return res.status(404).json({
        success: false,
        message: `Pin with ID ${pinId} not found`
      });
    }
    
    res.json({
      success: true,
      message: 'Pin updated successfully',
      data: pin
    });
  } catch (error) {
    console.error('Error updating pin:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating pin',
      error: error.message
    });
  }
});

/**
 * DELETE /api/pins/:id
 * Delete a pin (for admin use)
 * Query Parameters:
 *   - campusId: (optional) Filter by campus ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const pinId = req.params.id;
    const campusId = req.query.campusId || null;
    
    // Build query
    const query = {};
    if (mongoose.Types.ObjectId.isValid(pinId)) {
      query._id = pinId;
    } else {
      query.id = isNaN(pinId) ? pinId : Number(pinId);
    }
    if (campusId) {
      query.campusId = campusId;
    }
    
    const pin = await Pin.findOneAndDelete(query);
    
    if (!pin) {
      return res.status(404).json({
        success: false,
        message: `Pin with ID ${pinId} not found`
      });
    }
    
    res.json({
      success: true,
      message: 'Pin deleted successfully',
      data: pin
    });
  } catch (error) {
    console.error('Error deleting pin:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting pin',
      error: error.message
    });
  }
});

module.exports = router;
