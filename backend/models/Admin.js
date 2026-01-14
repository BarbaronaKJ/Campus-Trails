const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Admin Schema - Separate collection for administrators
 * Stored separately from users for better organization
 */
const adminSchema = new mongoose.Schema({
  // Username (optional, can use email instead)
  username: {
    type: String,
    trim: true,
    sparse: true,
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
  
  // Role is always 'admin' for this collection
  role: {
    type: String,
    enum: ['admin'],
    default: 'admin'
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
  
  // Password reset token (for forgot password functionality)
  resetPasswordToken: {
    type: String,
    default: null
  },
  
  // Password reset token expiration timestamp
  resetPasswordExpires: {
    type: Date,
    default: null
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
  collection: 'admins' // Separate collection for admins
});

// Update the updatedAt field before saving
adminSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method to find admin by email
adminSchema.statics.findByEmail = async function(email) {
  return await this.findOne({ email: email.toLowerCase() });
};

// Static method to find admin by username
adminSchema.statics.findByUsername = async function(username) {
  return await this.findOne({ username });
};

// Static method to find admin by credentials (username/email and password)
adminSchema.statics.findByCredentials = async function(usernameOrEmail, password) {
  if (!usernameOrEmail || !password) {
    const error = new Error('Invalid login credentials');
    error.statusCode = 401;
    throw error;
  }

  let admin = await this.findOne({ email: usernameOrEmail.toLowerCase() });
  
  if (!admin) {
    admin = await this.findOne({ username: usernameOrEmail });
  }
  
  if (!admin) {
    const error = new Error('Invalid login credentials');
    error.statusCode = 401;
    throw error;
  }
  
  const isPasswordValid = await admin.comparePassword(password);
  if (!isPasswordValid) {
    const error = new Error('Invalid login credentials');
    error.statusCode = 401;
    throw error;
  }
  
  return admin;
};

// Method to generate password reset token
adminSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  
  return resetToken;
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
