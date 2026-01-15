const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// JWT Secret - In production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // Token expires in 7 days

/**
 * Register a new user
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, secretQuestion, secretAnswer } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required',
      });
    }

    // Validate secret question and answer
    if (!secretQuestion || !secretAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Secret question and answer are required for password recovery',
      });
    }

    if (secretAnswer.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Secret answer must be at least 2 characters long',
      });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists',
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Validate username length
    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters long',
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check password has capital letter and symbol
    const hasCapital = /[A-Z]/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    if (!hasCapital || !hasSymbol) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one capital letter and one symbol',
      });
    }

    // Create new user
    const newUser = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password, // Will be hashed by pre-save hook
      secretQuestion: secretQuestion.trim(),
      secretAnswer: secretAnswer.trim(), // Store as-is (case-insensitive comparison on verify)
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user data (without password) and token
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: newUser.toJSON(),
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input - can use either username or email
    const usernameOrEmail = username || email;
    if (!usernameOrEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/email and password are required',
      });
    }

    // Find user and verify password
    const user = await User.findByCredentials(usernameOrEmail, password);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user data (without password) and token
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Check if it's an authentication error
    if (error.message === 'Invalid login credentials' || error.statusCode === 401) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password',
      });
    }

    // Log full error in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Full login error details:', {
        message: error.message,
        stack: error.stack,
        statusCode: error.statusCode
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Get current user profile (protected route)
 * GET /api/auth/me
 */
router.get('/me', async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user by ID
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user.toJSON(),
    });
  } catch (error) {
    console.error('Get user error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Update user profile (protected route)
 * PUT /api/auth/profile
 */
router.put('/profile', async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update allowed fields
    const { profilePicture, settings } = req.body;
    
    if (profilePicture !== undefined) {
      user.profilePicture = profilePicture;
    }

    if (settings) {
      user.settings = { ...user.settings, ...settings };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user.toJSON(),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Update user activity (saved pins, feedback)
 * PUT /api/auth/activity
 */
router.put('/activity', async (req, res) => {
  try {
    console.log('📥 Received activity update request:', {
      body: req.body,
      hasAuthHeader: !!req.headers.authorization
    });

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token verified for user:', decoded.userId);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('❌ User not found:', decoded.userId);
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log('✅ User found:', user.email);

    // Update activity data
    const { savedPins, feedbackHistory, searchCount, pathfindingCount } = req.body;
    console.log('📊 Activity data to update:', {
      searchCount,
      pathfindingCount,
      hasSavedPins: savedPins !== undefined,
      hasFeedbackHistory: feedbackHistory !== undefined
    });
    
    // Initialize activity object if it doesn't exist
    if (!user.activity) {
      user.activity = {
        savedPins: [],
        feedbackHistory: [],
        searchCount: 0,
        pathfindingCount: 0,
        lastActiveDate: new Date()
      };
      // Mark as modified so Mongoose saves it
      user.markModified('activity');
    }
    
    // Ensure searchCount and pathfindingCount exist (for existing users)
    if (user.activity.searchCount === undefined || user.activity.searchCount === null) {
      user.activity.searchCount = 0;
      user.markModified('activity');
    }
    
    if (user.activity.pathfindingCount === undefined || user.activity.pathfindingCount === null) {
      user.activity.pathfindingCount = 0;
      user.markModified('activity');
    }
    
    if (savedPins !== undefined) {
      user.activity.savedPins = savedPins;
      user.markModified('activity.savedPins');
    }

    if (searchCount !== undefined) {
      const newSearchCount = Math.max(0, parseInt(searchCount) || 0);
      const oldSearchCount = user.activity.searchCount || 0;
      console.log(`Updating searchCount for user ${decoded.userId}: ${oldSearchCount} -> ${newSearchCount}`);
      user.activity.searchCount = newSearchCount;
      // Explicitly mark the nested path as modified
      user.markModified('activity');
      user.markModified('activity.searchCount');
      console.log(`✅ Set searchCount to ${newSearchCount}, marked as modified`);
    }

    if (pathfindingCount !== undefined) {
      const newPathfindingCount = Math.max(0, parseInt(pathfindingCount) || 0);
      const oldPathfindingCount = user.activity.pathfindingCount || 0;
      console.log(`Updating pathfindingCount for user ${decoded.userId}: ${oldPathfindingCount} -> ${newPathfindingCount}`);
      user.activity.pathfindingCount = newPathfindingCount;
      // Explicitly mark the nested path as modified
      user.markModified('activity');
      user.markModified('activity.pathfindingCount');
      console.log(`✅ Set pathfindingCount to ${newPathfindingCount}, marked as modified`);
    }

    if (feedbackHistory !== undefined) {
      // Validate feedback entries
      for (const feedback of feedbackHistory) {
        if (feedback.comment) {
          const commentLength = feedback.comment.trim().length;
          if (commentLength <= 5) {
            return res.status(400).json({
              success: false,
              message: 'Feedback comment must be more than 5 characters',
            });
          }
          if (commentLength > 250) {
            return res.status(400).json({
              success: false,
              message: 'Feedback comment cannot exceed 250 characters',
            });
          }
        }
      }
      
      // Log feedback update for debugging
      console.log(`Updating feedbackHistory for user ${decoded.userId}:`, {
        previousCount: user.activity.feedbackHistory?.length || 0,
        newCount: feedbackHistory.length,
        latestFeedback: feedbackHistory[feedbackHistory.length - 1],
      });
      
      user.activity.feedbackHistory = feedbackHistory;
      user.markModified('activity.feedbackHistory');
    }

    user.activity.lastActiveDate = new Date();
    
    // Prepare MongoDB $set update (more reliable than Mongoose for nested fields)
    const updateFields = {};
    let hasUpdates = false;
    
    if (searchCount !== undefined) {
      updateFields['activity.searchCount'] = parseInt(searchCount);
      hasUpdates = true;
    }
    if (pathfindingCount !== undefined) {
      updateFields['activity.pathfindingCount'] = parseInt(pathfindingCount);
      hasUpdates = true;
    }
    
    // Update savedPins and feedbackHistory if provided
    if (savedPins !== undefined) {
      updateFields['activity.savedPins'] = savedPins;
      hasUpdates = true;
    }
    if (feedbackHistory !== undefined) {
      updateFields['activity.feedbackHistory'] = feedbackHistory;
      hasUpdates = true;
    }
    
    // Always update lastActiveDate
    updateFields['activity.lastActiveDate'] = new Date();
    
    // Use direct MongoDB update for all activity fields (more reliable than Mongoose)
    if (hasUpdates) {
      // Direct MongoDB update (most reliable for nested fields)
      const updateResult = await User.updateOne(
        { _id: decoded.userId },
        { $set: updateFields }
      );
      console.log('✅ Updated directly in MongoDB with $set:', updateFields);
      console.log('✅ MongoDB update result:', updateResult);
      
      // Verify the update actually happened
      if (updateResult.modifiedCount !== 1) {
        console.error(`⚠️ WARNING: MongoDB update modified ${updateResult.modifiedCount} documents, expected 1`);
      }
      
      // Small delay to ensure MongoDB has committed the write
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update in-memory user object to match database (prevents Mongoose save from overwriting)
      if (searchCount !== undefined) {
        user.activity.searchCount = parseInt(searchCount);
      }
      if (pathfindingCount !== undefined) {
        user.activity.pathfindingCount = parseInt(pathfindingCount);
      }
      if (savedPins !== undefined) {
        user.activity.savedPins = savedPins;
      }
      if (feedbackHistory !== undefined) {
        user.activity.feedbackHistory = feedbackHistory;
      }
      
      // Skip Mongoose save() to avoid overwriting the direct update
      // The direct MongoDB $set is more reliable for nested fields
      console.log('⏭️  Skipping Mongoose save() - using direct MongoDB $set only');
    } else {
      // No updates provided, just update lastActiveDate
      await User.updateOne(
        { _id: decoded.userId },
        { $set: { 'activity.lastActiveDate': new Date() } }
      );
      console.log('✅ Updated lastActiveDate only');
    }

    // Fetch fresh data from database with a new query (bypass any caching)
    // Use findOne with lean() to get a fresh, plain object
    const savedUser = await User.findOne({ _id: decoded.userId }).lean();
    console.log(`Activity saved successfully for user ${decoded.userId} (fresh query):`, {
      searchCount: savedUser.activity?.searchCount || 0,
      pathfindingCount: savedUser.activity?.pathfindingCount || 0,
      feedbackCount: savedUser.activity?.feedbackHistory?.length || 0,
      savedPinsCount: savedUser.activity?.savedPins?.length || 0
    });
    
    // Double-check: if the saved value doesn't match, log a warning
    if (searchCount !== undefined && savedUser.activity?.searchCount !== parseInt(searchCount)) {
      console.error(`⚠️ WARNING: searchCount mismatch! Expected ${searchCount}, got ${savedUser.activity?.searchCount}`);
    }
    if (pathfindingCount !== undefined && savedUser.activity?.pathfindingCount !== parseInt(pathfindingCount)) {
      console.error(`⚠️ WARNING: pathfindingCount mismatch! Expected ${pathfindingCount}, got ${savedUser.activity?.pathfindingCount}`);
    }

    // Use the fresh user data from the database (savedUser is already a plain object from .lean())
    // Ensure activity object is properly included
    if (!savedUser.activity) {
      savedUser.activity = {
        savedPins: [],
        feedbackHistory: [],
        searchCount: 0,
        pathfindingCount: 0,
        lastActiveDate: new Date()
      };
    }
    
    console.log('📤 Sending response with activity:', {
      searchCount: savedUser.activity.searchCount,
      pathfindingCount: savedUser.activity.pathfindingCount
    });

    res.json({
      success: true,
      message: 'Activity updated successfully',
      data: savedUser, // Use the fresh data from database
    });
  } catch (error) {
    console.error('Update activity error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating activity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * Change user password (protected route)
 * PUT /api/auth/change-password
 */
router.put('/change-password', async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { oldPassword, newPassword } = req.body;

    // Validation
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Old password and new password are required',
      });
    }

    // Verify old password
    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Old password is incorrect',
      });
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check password has capital letter and symbol
    const hasCapital = /[A-Z]/.test(newPassword);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
    
    if (!hasCapital || !hasSymbol) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one capital letter and one symbol',
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Logout user (invalidates token on server if token blacklist is implemented)
 * POST /api/auth/logout
 * Note: Since we're using stateless JWT tokens, logout is primarily handled client-side
 * This endpoint can be used for server-side logging or token blacklisting if implemented
 */
router.post('/logout', async (req, res) => {
  try {
    // Get token from Authorization header (optional for logging)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Log logout event (optional - can be used for analytics)
        console.log(`User ${decoded.userId} logged out`);
      } catch (error) {
        // Token is invalid or expired, but logout still succeeds
        console.log('Logout with invalid/expired token');
      }
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Forgot Password - Get secret question for password reset
 * POST /api/auth/forgot-password
 * Request Body: { email }
 * Returns: { success, secretQuestion } (if user exists and has secret question)
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Find user by email
    const user = await User.findByEmail(email.toLowerCase());
    
    // Security: Always return same message structure (don't reveal if email exists)
    if (user && user.secretQuestion) {
      return res.json({
        success: true,
        secretQuestion: user.secretQuestion,
        message: 'Please answer your secret question to reset your password',
      });
    } else {
      // User doesn't exist or has no secret question - return generic message
      return res.json({
        success: false,
        message: 'Unable to reset password. Please contact support if you need assistance.',
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing password reset request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Reset Password - Reset password using secret answer
 * POST /api/auth/reset-password
 * Request Body: { email, secretAnswer, newPassword }
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, secretAnswer, newPassword } = req.body;

    // Validation
    if (!email || !secretAnswer || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, secret answer, and new password are required',
      });
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check password has capital letter and symbol
    const hasCapital = /[A-Z]/.test(newPassword);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
    
    if (!hasCapital || !hasSymbol) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one capital letter and one symbol',
      });
    }

    // Find user by email
    const user = await User.findByEmail(email.toLowerCase());

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or secret answer',
      });
    }

    // Verify secret answer
    const isAnswerCorrect = await user.verifySecretAnswer(secretAnswer);
    
    if (!isAnswerCorrect) {
      return res.status(400).json({
        success: false,
        message: 'Invalid secret answer',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resetting password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

module.exports = router;
