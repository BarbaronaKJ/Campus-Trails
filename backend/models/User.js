const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false, // Don't return password by default
  },
  profilePicture: {
    type: String,
    default: null, // Cloudinary URL
  },
  // User activity and preferences
  activity: {
    savedPins: [{
      id: Number,
      title: String,
      description: String,
      x: Number,
      y: Number,
    }],
    feedbackHistory: [{
      id: Number,
      pinId: Number,
      pinTitle: String,
      rating: { type: Number, min: 1, max: 5, default: 5 },
      comment: {
        type: String,
        validate: {
          validator: function(v) {
            if (!v) return true; // Allow empty comments
            const trimmed = v.trim();
            return trimmed.length > 5 && trimmed.length <= 250;
          },
          message: 'Comment must be more than 5 characters and not exceed 250 characters'
        }
      },
      date: { type: Date, default: Date.now },
    }],
    firstActiveDate: { type: Date, default: Date.now },
    lastActiveDate: { type: Date, default: Date.now },
  },
  // User settings
  settings: {
    darkMode: { type: Boolean, default: false },
    alerts: {
      facilityUpdates: { type: Boolean, default: true },
      securityAlerts: { type: Boolean, default: true },
    },
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update last active date
userSchema.methods.updateLastActive = async function() {
  this.activity.lastActiveDate = new Date();
  await this.save();
};

// Static method to find user by username or email
userSchema.statics.findByCredentials = async function(usernameOrEmail, password) {
  // Try to find by username first, then by email
  const user = await this.findOne({
    $or: [
      { username: usernameOrEmail },
      { email: usernameOrEmail.toLowerCase() }
    ]
  }).select('+password'); // Include password field

  if (!user) {
    throw new Error('Invalid login credentials');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid login credentials');
  }

  // Update last active date
  await user.updateLastActive();

  return user;
};

// Remove password before returning user as JSON
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
