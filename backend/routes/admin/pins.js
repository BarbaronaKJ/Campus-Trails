const express = require('express');
const { authenticateToken } = require('../../middleware/adminAuth');
const Pin = require('../../models/Pin');
const Campus = require('../../models/Campus');
const mongoose = require('mongoose');

const router = express.Router();

// Get all pins with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { campusId, pinType, search, page = 1, limit = 50, includeInvisible } = req.query;
    const query = {};

    if (campusId) {
      query.campusId = new mongoose.Types.ObjectId(campusId);
    }

    if (pinType) {
      query.pinType = pinType;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { qrCode: { $regex: search, $options: 'i' } }
      ];
    }

    // If includeInvisible is not explicitly true, only show visible pins (explicitly true)
    if (includeInvisible !== 'true') {
      query.isVisible = true;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const pins = await Pin.find(query)
      .populate('campusId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Pin.countDocuments(query);

    res.json({
      success: true,
      pins,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get pins error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single pin
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const pin = await Pin.findById(req.params.id).populate('campusId', 'name');
    if (!pin) {
      return res.status(404).json({ success: false, message: 'Pin not found' });
    }
    res.json({ success: true, pin });
  } catch (error) {
    console.error('Get pin error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create pin
router.post('/', authenticateToken, async (req, res) => {
  try {
    const pinData = req.body;

    // Validate campus
    if (!mongoose.Types.ObjectId.isValid(pinData.campusId)) {
      return res.status(400).json({ success: false, message: 'Invalid campus ID' });
    }

    const campus = await Campus.findById(pinData.campusId);
    if (!campus) {
      return res.status(404).json({ success: false, message: 'Campus not found' });
    }

    // Auto-generate ID if not provided
    if (!pinData.id) {
      // Get the highest existing ID for this campus and increment
      const maxPin = await Pin.findOne({ campusId: pinData.campusId })
        .sort({ id: -1 })
        .select('id')
        .lean();
      
      if (maxPin && typeof maxPin.id === 'number') {
        pinData.id = maxPin.id + 1;
      } else {
        // If no pins exist or IDs are not numbers, start from 1
        pinData.id = 1;
      }
    }

    const pin = new Pin(pinData);
    await pin.save();

    res.status(201).json({ success: true, pin });
  } catch (error) {
    console.error('Create pin error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Pin with this ID already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update pin neighbors (connections) - MUST come before /:id route
router.put('/:id/neighbors', authenticateToken, async (req, res) => {
  try {
    const { neighbors } = req.body;
    
    console.log('Update neighbors request:', {
      pinId: req.params.id,
      neighbors: neighbors,
      neighborsType: Array.isArray(neighbors) ? 'array' : typeof neighbors,
      neighborsLength: Array.isArray(neighbors) ? neighbors.length : 'N/A'
    });
    
    if (!Array.isArray(neighbors)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Neighbors must be an array',
        received: typeof neighbors
      });
    }

    // Validate pin ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid pin ID' });
    }

    const pin = await Pin.findById(req.params.id);
    if (!pin) {
      return res.status(404).json({ success: false, message: 'Pin not found' });
    }

    // Normalize neighbors array - ensure all values are properly formatted
    // Neighbors can be ObjectIds, strings, or numbers
    const normalizedNeighbors = neighbors.map(n => {
      // If it's already a valid format, keep it
      if (mongoose.Types.ObjectId.isValid(n)) {
        return n;
      }
      // If it's a number, keep it as number
      if (typeof n === 'number') {
        return n;
      }
      // If it's a string that looks like a number, convert to number
      if (typeof n === 'string' && !isNaN(n) && !isNaN(parseFloat(n))) {
        const num = parseFloat(n);
        // If it's a whole number, return as number, otherwise keep as string
        return num % 1 === 0 ? num : n;
      }
      // Otherwise keep as string
      return String(n);
    });

    // Get the pin's ID (for pathfinding, use pin.id, not _id)
    const currentPinId = pin.id;
    
    // Get the old neighbors list to detect what was removed
    const oldNeighbors = pin.neighbors || [];

    // Update neighbors for this pin
    pin.neighbors = normalizedNeighbors;
    pin.updatedAt = Date.now();
    await pin.save();

    // AUTOMATICALLY update reverse connections (bidirectional)
    // 1. Add reverse connections for new neighbors
    // 2. Remove reverse connections for removed neighbors
    
    // Find all unique neighbor IDs (both old and new) to process
    const allNeighborIds = [...new Set([...oldNeighbors.map(n => String(n)), ...normalizedNeighbors.map(n => String(n))])];
    
    for (const neighborIdStr of allNeighborIds) {
      try {
        // Convert back to original type (number, string, or ObjectId)
        let neighborId = neighborIdStr;
        if (!isNaN(neighborIdStr) && !isNaN(parseFloat(neighborIdStr))) {
          neighborId = neighborIdStr.includes('.') ? parseFloat(neighborIdStr) : parseInt(neighborIdStr, 10);
        }
        
        // Find the neighbor pin by its id (for pathfinding) or _id
        const neighborPin = await Pin.findOne({
          $or: [
            { id: neighborId },
            { _id: mongoose.Types.ObjectId.isValid(neighborId) ? neighborId : null }
          ]
        });

        if (neighborPin) {
          const neighborNeighbors = neighborPin.neighbors || [];
          const wasConnected = oldNeighbors.some(n => String(n) === neighborIdStr);
          const isNowConnected = normalizedNeighbors.some(n => String(n) === neighborIdStr);
          
          // Check if current pin is in neighbor's neighbors array
          const currentPinInNeighbor = neighborNeighbors.some(n => {
            // Compare using id field (for pathfinding)
            if (neighborPin.id !== undefined && currentPinId !== undefined) {
              return String(n) === String(currentPinId) || n === currentPinId;
            }
            // Fallback to _id comparison
            return String(n) === String(pin._id) || n === pin._id;
          });

          if (isNowConnected && !currentPinInNeighbor) {
            // Add reverse connection (new connection)
            neighborPin.neighbors = [...neighborNeighbors, currentPinId || pin._id];
            neighborPin.updatedAt = Date.now();
            await neighborPin.save();
            console.log(`Added reverse connection: ${neighborPin.title || neighborPin._id} now connects to ${pin.title || pin._id}`);
          } else if (!isNowConnected && wasConnected && currentPinInNeighbor) {
            // Remove reverse connection (connection was removed)
            neighborPin.neighbors = neighborNeighbors.filter(n => {
              // Compare using id field (for pathfinding)
              if (neighborPin.id !== undefined && currentPinId !== undefined) {
                return String(n) !== String(currentPinId) && n !== currentPinId;
              }
              // Fallback to _id comparison
              return String(n) !== String(pin._id) && n !== pin._id;
            });
            neighborPin.updatedAt = Date.now();
            await neighborPin.save();
            console.log(`Removed reverse connection: ${neighborPin.title || neighborPin._id} no longer connects to ${pin.title || pin._id}`);
          }
        }
      } catch (neighborError) {
        // Log error but don't fail the entire operation
        console.error(`Error updating reverse connection for neighbor ${neighborIdStr}:`, neighborError);
      }
    }

    // Populate campusId for response
    await pin.populate('campusId', 'name');

    console.log('Neighbors updated successfully:', {
      pinId: pin._id,
      pinTitle: pin.title,
      pinIdForPathfinding: currentPinId,
      neighborsCount: pin.neighbors.length
    });

    res.json({ success: true, pin });
  } catch (error) {
    console.error('Update neighbors error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update pin - MUST come after /:id/neighbors route (less specific route last)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Debug: Log floors data if present
    if (req.body.floors && Array.isArray(req.body.floors)) {
      console.log('Updating pin floors:', req.params.id);
      req.body.floors.forEach((floor, floorIdx) => {
        if (floor.rooms && Array.isArray(floor.rooms)) {
          floor.rooms.forEach((room, roomIdx) => {
            if (room.besideRooms && room.besideRooms.length > 0) {
              console.log(`Floor ${floor.level}, Room ${room.name}: besideRooms =`, room.besideRooms);
            }
          });
        }
      });
    }

    // For nested updates like floors.rooms.besideRooms, we need to ensure Mongoose handles them correctly
    // Mongoose requires explicit handling of nested array updates
    const updateData = { ...req.body, updatedAt: Date.now() };
    
    // If floors are being updated, we need to update them explicitly to preserve besideRooms
    if (updateData.floors && Array.isArray(updateData.floors)) {
      // Find the pin first to get the current state
      const existingPin = await Pin.findById(req.params.id);
      if (!existingPin) {
        return res.status(404).json({ success: false, message: 'Pin not found' });
      }
      
      // Update floors array directly on the document
      existingPin.floors = updateData.floors.map(floor => ({
        level: floor.level,
        floorPlan: floor.floorPlan || null,
        rooms: floor.rooms ? floor.rooms.map(room => {
          const updatedRoom = {
            name: room.name,
            image: room.image || null,
            description: room.description || null,
            qrCode: room.qrCode || null,
            order: room.order !== undefined ? room.order : 0,
            besideRooms: Array.isArray(room.besideRooms) ? [...room.besideRooms] : [] // Ensure it's always an array
          };
          
          // Debug: Log stairs/elevator besideRooms being saved
          const roomName = (room.name || '').toUpperCase();
          const roomDesc = (room.description || '').toUpperCase();
          const isStairs = roomName.includes('STAIRS') || roomName.includes('STAIR') || roomName.startsWith('S ') || roomName === 'S' || roomDesc.includes('STAIRS') || roomDesc.includes('STAIR');
          const isElevator = roomName.includes('ELEVATOR') || roomName.startsWith('E ') || roomName === 'E' || roomDesc.includes('ELEVATOR');
          
          if ((isStairs || isElevator) && updatedRoom.besideRooms.length > 0) {
            console.log(`💾 Saving ${isStairs ? 'STAIRS' : 'ELEVATOR'}: Floor ${floor.level}, Room ${room.name}, besideRooms:`, updatedRoom.besideRooms);
          }
          
          return updatedRoom;
        }) : []
      }));
      
      // Update other fields if present
      if (updateData.title) existingPin.title = updateData.title;
      if (updateData.description !== undefined) existingPin.description = updateData.description;
      if (updateData.image !== undefined) existingPin.image = updateData.image;
      if (updateData.x !== undefined) existingPin.x = updateData.x;
      if (updateData.y !== undefined) existingPin.y = updateData.y;
      if (updateData.category !== undefined) existingPin.category = updateData.category;
      if (updateData.qrCode !== undefined) existingPin.qrCode = updateData.qrCode;
      if (updateData.isVisible !== undefined) existingPin.isVisible = updateData.isVisible;
      if (updateData.neighbors !== undefined) existingPin.neighbors = updateData.neighbors;
      if (updateData.buildingNumber !== undefined) existingPin.buildingNumber = updateData.buildingNumber;
      
      existingPin.updatedAt = Date.now();
      
      // Save the document explicitly
      await existingPin.save();
    } else {
      // For non-floors updates, use regular update
      await Pin.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );
    }

    // Get the final pin state for response (ensure we have the saved data)
    const pin = await Pin.findById(req.params.id).populate('campusId', 'name');
    
    if (!pin) {
      return res.status(404).json({ success: false, message: 'Pin not found' });
    }

    // Debug: Verify besideRooms was saved
    if (pin.floors && Array.isArray(pin.floors)) {
      console.log('Verifying saved pin floors:');
      pin.floors.forEach((floor, floorIdx) => {
        if (floor.rooms && Array.isArray(floor.rooms)) {
          floor.rooms.forEach((room, roomIdx) => {
            if (room.besideRooms && room.besideRooms.length > 0) {
              console.log(`✅ Saved - Floor ${floor.level}, Room ${room.name}: besideRooms =`, room.besideRooms);
            } else if (room.name && (room.name.includes('S2') || room.name.includes('E1') || room.name.includes('S1'))) {
              console.log(`⚠️ Floor ${floor.level}, Room ${room.name}: besideRooms =`, room.besideRooms || 'undefined');
            }
          });
        }
      });
    }

    res.json({ success: true, pin });
  } catch (error) {
    console.error('Update pin error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Delete pin
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const pin = await Pin.findByIdAndDelete(req.params.id);
    if (!pin) {
      return res.status(404).json({ success: false, message: 'Pin not found' });
    }
    res.json({ success: true, message: 'Pin deleted successfully' });
  } catch (error) {
    console.error('Delete pin error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
