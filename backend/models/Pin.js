const mongoose = require('mongoose');

/**
 * Pin Schema - Represents a building/facility pin on the campus map
 * All fields are editable directly in MongoDB Compass or Atlas
 */
const pinSchema = new mongoose.Schema({
  // Unique identifier for the pin (can be number or string)
  id: {
    type: mongoose.Schema.Types.Mixed, // Allows both Number and String
    required: true,
    unique: true,
    index: true
  },
  
  // Position on the map (x, y coordinates)
  x: {
    type: Number,
    required: true,
    default: 0
  },
  
  y: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Display title (short label, e.g., "ME", "1", "SL1")
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  // Full description (e.g., "Main Entrance", "BLDG 1 | Arts & Culture Building")
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  // Image URL (Cloudinary URL or local asset path)
  // When storing Cloudinary URLs, ensure f_auto,q_auto parameters are included for optimization
  // Format: https://res.cloudinary.com/xxx/image/upload/f_auto,q_auto/v1768037837/image.jpg
  image: {
    type: String,
    required: true,
    trim: true
  },
  
  // Category for filtering (e.g., "Academic Core Zone", "Essential Services", "Amenities")
  category: {
    type: String,
    trim: true,
    default: 'Other',
    index: true // Index for faster filtering
  },
  
  // Neighbors array for pathfinding (array of pin IDs that connect to this pin)
  neighbors: {
    type: [mongoose.Schema.Types.Mixed], // Allows both Number and String IDs
    default: [],
    index: true
  },
  
  // Optional: Building number (for buildings 1-52)
  buildingNumber: {
    type: Number,
    default: null,
    index: true
  },
  
  // Invisible waypoints: used for pathfinding but not displayed to users
  isInvisible: {
    type: Boolean,
    default: false
  },
  
  // Timestamps for tracking updates
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically manage createdAt and updatedAt
});

// Update the updatedAt field before saving
pinSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries by category, buildingNumber, and visibility
pinSchema.index({ category: 1, buildingNumber: 1 });
pinSchema.index({ isInvisible: 1 });

// Method to optimize Cloudinary image URL if not already optimized
pinSchema.methods.getOptimizedImage = function() {
  if (!this.image) return this.image;
  
  // If it's already a Cloudinary URL and doesn't have optimization parameters
  if (this.image.includes('res.cloudinary.com') && !this.image.includes('f_auto,q_auto')) {
    const uploadIndex = this.image.indexOf('/upload/');
    if (uploadIndex !== -1) {
      const baseUrl = this.image.substring(0, uploadIndex + '/upload/'.length);
      const pathAfterUpload = this.image.substring(uploadIndex + '/upload/'.length);
      return `${baseUrl}f_auto,q_auto/${pathAfterUpload}`;
    }
  }
  
  return this.image;
};

// Static method to get all pins sorted by ID (visible only by default)
pinSchema.statics.getAllPins = async function(includeInvisible = false) {
  // Filter out invisible waypoints unless explicitly requested
  // Query: exclude pins where isInvisible is explicitly true
  const query = includeInvisible ? {} : { isInvisible: { $ne: true } };
  return await this.find(query).sort({ id: 1 }).lean();
};

// Static method to get all pins including invisible ones (for pathfinding)
pinSchema.statics.getAllPinsForPathfinding = async function() {
  return await this.find({}).sort({ id: 1 }).lean();
};

// Static method to get pins by category (visible only)
pinSchema.statics.getPinsByCategory = async function(category, includeInvisible = false) {
  const query = { category };
  if (!includeInvisible) {
    query.isInvisible = { $ne: true };
  }
  return await this.find(query).sort({ id: 1 }).lean();
};

// Static method to get pin by ID
pinSchema.statics.getPinById = async function(id) {
  return await this.findOne({ id }).lean();
};

module.exports = mongoose.model('Pin', pinSchema);
