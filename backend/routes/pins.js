const express = require('express');
const router = express.Router();
const Pin = require('../models/Pin');

/**
 * GET /api/pins
 * Fetch all visible pins from the database (excludes invisible waypoints by default)
 * Query Parameters:
 *   - includeInvisible: true/false (default: false) - Include invisible waypoints for pathfinding
 * Response: Array of pin documents (visible only, unless includeInvisible=true)
 */
router.get('/', async (req, res) => {
  try {
    // Check if client wants invisible pins (for pathfinding)
    const includeInvisible = req.query.includeInvisible === 'true' || req.query.includeInvisible === '1';
    const pins = await Pin.getAllPins(includeInvisible);
    
    // Optimize Cloudinary URLs before sending
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
    
    res.json({
      success: true,
      count: optimizedPins.length,
      includeInvisible: includeInvisible,
      data: optimizedPins
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
 * Fetch a single pin by ID
 * Response: Pin document
 */
router.get('/:id', async (req, res) => {
  try {
    const pinId = req.params.id;
    // Handle both string and number IDs
    const pin = await Pin.findOne({ 
      id: isNaN(pinId) ? pinId : Number(pinId) 
    }).lean();
    
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
    
    res.json({
      success: true,
      data: pin
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
 * Fetch visible pins by category (excludes invisible waypoints)
 * Query Parameters:
 *   - includeInvisible: true/false (default: false) - Include invisible waypoints
 * Response: Array of pins in the specified category
 */
router.get('/category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const includeInvisible = req.query.includeInvisible === 'true' || req.query.includeInvisible === '1';
    const pins = await Pin.getPinsByCategory(category, includeInvisible);
    
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
        : pin.image
    }));
    
    res.json({
      success: true,
      count: optimizedPins.length,
      category,
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
 * POST /api/pins
 * Create a new pin (for admin use)
 * Request Body: { id, x, y, title, description, image, category, neighbors, buildingNumber }
 */
router.post('/', async (req, res) => {
  try {
    const pinData = req.body;
    
    // Validate required fields
    if (!pinData.id || !pinData.title || !pinData.description || !pinData.image) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: id, title, description, image'
      });
    }
    
    // Check if pin with same ID already exists
    const existingPin = await Pin.findOne({ id: pinData.id });
    if (existingPin) {
      return res.status(409).json({
        success: false,
        message: `Pin with ID ${pinData.id} already exists`
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
 * Request Body: { x, y, title, description, image, category, neighbors, buildingNumber }
 */
router.put('/:id', async (req, res) => {
  try {
    const pinId = req.params.id;
    const updateData = req.body;
    
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
      { id: isNaN(pinId) ? pinId : Number(pinId) },
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

module.exports = router;
