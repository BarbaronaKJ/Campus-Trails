const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema - Stores identity and cross-campus activity
 */
const userSchema = new mongoose.Schema({
  // Username (optional, can use email instead)
  username: {
    type: String,
    trim: true,
    sparse: true, // Allows null, but enforces uniqueness when present
    unique: true,
    index: true
  },
  
  // Email address
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  
  // Hashed password
  password: {
    type: String,
    required: true
  },
  
  // User role: "super_admin", "admin", or "student"
  // Controls Vercel panel access and permissions
  // super_admin: Full access, can delete/edit admins
  // admin: Regular admin access
  // student: Regular user
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'student'],
    default: 'student'
  },
  
  // Profile picture URL (Cloudinary URL)
  profilePicture: {
    type: String,
    trim: true,
    default: null
  },
  
  // Display name (optional, defaults to username or email)
  displayName: {
    type: String,
    trim: true,
    default: null
  },
  
  // Secret question for password recovery
  secretQuestion: {
    type: String,
    enum: [
      'What is the name of your first pet?',
      'What city were you born in?',
      'What is your mother\'s maiden name?',
      'What was the name of your elementary school?',
      'What is your favorite food?',
      'What is the name of your best friend?',
      'What is your favorite movie?',
      'What is your favorite book?',
      'What is your favorite color?',
      'What is your favorite sport?'
    ],
    default: null
  },
  secretAnswer: {
    type: String,
    trim: true,
    default: null
  },
  
  // Saved Pins array (cross-campus saved items) - DEPRECATED: Use activity.savedPins instead
  savedPins: [{
    pinId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pin',
      required: true
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campus',
      required: true
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Push notification token (Expo push token)
  pushToken: {
    type: String,
    trim: true,
    default: null,
    index: true
  },
  
  // Notification preferences
  notificationPreferences: {
    enabled: {
      type: Boolean,
      default: true
    },
    announcements: {
      type: Boolean,
      default: true
    },
    updates: {
      type: Boolean,
      default: true
    },
    reminders: {
      type: Boolean,
      default: true
    }
  },
  
  // User activity (saved pins, feedback history, tracking)
  activity: {
    // Saved pins array (can store full pin objects or pin IDs)
    savedPins: {
      type: [mongoose.Schema.Types.Mixed], // Mixed type to allow both pin objects and IDs
      default: []
    },
    // Feedback history array
    feedbackHistory: {
      type: [{
        id: {
          type: Number,
          required: true
        },
        pinId: {
          type: mongoose.Schema.Types.Mixed, // Can be number or string
          required: true
        },
        pinTitle: {
          type: String,
          required: true,
          trim: true
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5
        },
        comment: {
          type: String,
          required: true,
          trim: true,
          minlength: 6,
          maxlength: 250
        },
        date: {
          type: Date,
          required: true,
          default: Date.now
        },
        status: {
          type: String,
          enum: ['new', 'reviewed', 'resolved', 'archived'],
          default: 'new'
        }
      }],
      default: []
    },
    // Search count tracking
    searchCount: {
      type: Number,
      default: 0,
      min: 0
    },
    // Pathfinding count tracking
    pathfindingCount: {
      type: Number,
      default: 0,
      min: 0
    },
    // Last active date
    lastActiveDate: {
      type: Date,
      default: Date.now
    },
    // Notifications array - stores notifications sent to this user
    notifications: {
      type: [{
        id: {
          type: String,
          required: true
        },
        title: {
          type: String,
          required: true,
          trim: true
        },
        body: {
          type: String,
          trim: true,
          default: ''
        },
        type: {
          type: String,
          enum: ['announcement', 'update', 'reminder', 'custom'],
          default: 'announcement'
        },
        data: {
          type: mongoose.Schema.Types.Mixed,
          default: {}
        },
        read: {
          type: Boolean,
          default: false
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }],
      default: []
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Additional indexes (unique indexes are already defined in schema fields)
userSchema.index({ role: 1 });

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get saved pins filtered by campus
userSchema.methods.getSavedPinsByCampus = function(campusId) {
  return this.savedPins.filter(sp => sp.campusId.toString() === campusId.toString());
};

// Method to check if a pin is saved
userSchema.methods.isPinSaved = function(pinId) {
  return this.savedPins.some(sp => sp.pinId.toString() === pinId.toString());
};

// Method to add a saved pin
userSchema.methods.addSavedPin = function(pinId, campusId) {
  // Check if already saved
  if (this.isPinSaved(pinId)) {
    return false; // Already saved
  }
  
  this.savedPins.push({
    pinId,
    campusId,
    savedAt: new Date()
  });
  
  return true; // Successfully added
};

// Method to remove a saved pin
userSchema.methods.removeSavedPin = function(pinId) {
  const initialLength = this.savedPins.length;
  this.savedPins = this.savedPins.filter(sp => sp.pinId.toString() !== pinId.toString());
  return this.savedPins.length < initialLength; // Return true if removed
};

// Static method to find user by email
userSchema.statics.findByEmail = async function(email) {
  return await this.findOne({ email: email.toLowerCase() });
};

// Static method to find user by username
userSchema.statics.findByUsername = async function(username) {
  return await this.findOne({ username });
};

// Static method to find user by credentials (username/email and password)
userSchema.statics.findByCredentials = async function(usernameOrEmail, password) {
  if (!usernameOrEmail || !password) {
    const error = new Error('Invalid login credentials');
    error.statusCode = 401;
    throw error;
  }

  // Try to find user by email first (case-insensitive)
  let user = await this.findOne({ email: usernameOrEmail.toLowerCase() });
  
  // If not found by email, try to find by username (case-sensitive for username)
  if (!user) {
    user = await this.findOne({ username: usernameOrEmail });
  }
  
  // If user not found, throw error
  if (!user) {
    const error = new Error('Invalid login credentials');
    error.statusCode = 401;
    throw error;
  }
  
  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    const error = new Error('Invalid login credentials');
    error.statusCode = 401;
    throw error;
  }
  
  // Return user (password is already hashed, so it's safe to return)
  return user;
};

// Static method to create user (with password hashing)
userSchema.statics.createUser = async function(userData) {
  const user = new this(userData);
  await user.save();
  // Return user without password
  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

// Method to verify secret answer (case-insensitive)
userSchema.methods.verifySecretAnswer = async function(answer) {
  if (!this.secretAnswer || !answer) {
    return false;
  }
  // Compare case-insensitively
  return this.secretAnswer.toLowerCase().trim() === answer.toLowerCase().trim();
};

const User = mongoose.model('User', userSchema);

module.exports = User;