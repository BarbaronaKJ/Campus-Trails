const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/notifications/register
 * Register/update user's push notification token
 */
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const { pushToken } = req.body;
    const userId = req.user.userId;

    if (!pushToken) {
      return res.status(400).json({
        success: false,
        message: 'Push token is required'
      });
    }

    // Update user's push token
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.pushToken = pushToken;
    await user.save();

    console.log(`✅ Push token registered for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Push token registered successfully'
    });
  } catch (error) {
    console.error('❌ Error registering push token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register push token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/notifications/send
 * Send push notification to users (admin only)
 * This will be used by the admin panel later
 */
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { title, body, type = 'announcement', targetAudience = 'all', targetUserIds = [], data = {} } = req.body;
    const senderId = req.user.userId;

    // Check if user is admin
    const sender = await User.findById(senderId);
    if (!sender || sender.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can send notifications'
      });
    }

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required'
      });
    }

    // Create notification record
    const notification = await Notification.createNotification({
      title,
      body,
      type,
      targetAudience,
      targetUserIds,
      data,
      sentBy: senderId,
      status: 'sending'
    });

    // Get target users based on audience
    let targetUsers = [];
    if (targetAudience === 'all') {
      targetUsers = await User.find({ 
        pushToken: { $ne: null },
        'notificationPreferences.enabled': true
      });
    } else if (targetAudience === 'students') {
      targetUsers = await User.find({ 
        role: 'student',
        pushToken: { $ne: null },
        'notificationPreferences.enabled': true
      });
    } else if (targetAudience === 'admins') {
      targetUsers = await User.find({ 
        role: 'admin',
        pushToken: { $ne: null },
        'notificationPreferences.enabled': true
      });
    }

    // If specific user IDs provided, filter to those users
    if (targetUserIds && targetUserIds.length > 0) {
      targetUsers = targetUsers.filter(user => 
        targetUserIds.includes(user._id.toString())
      );
    }

    // Filter by notification preferences
    targetUsers = targetUsers.filter(user => {
      const prefs = user.notificationPreferences || {};
      if (type === 'announcement' && prefs.announcements === false) return false;
      if (type === 'update' && prefs.updates === false) return false;
      if (type === 'reminder' && prefs.reminders === false) return false;
      return true;
    });

    notification.totalRecipients = targetUsers.length;

    // Send notifications via Expo Push Notification Service
    const pushTokens = targetUsers.map(user => user.pushToken).filter(Boolean);
    
    if (pushTokens.length === 0) {
      notification.status = 'failed';
      notification.errors = ['No valid push tokens found'];
      await notification.save();
      
      return res.json({
        success: false,
        message: 'No valid push tokens found',
        notificationId: notification._id
      });
    }

    // Send to Expo Push Notification Service
    const messages = pushTokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data
    }));

    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages)
      });

      const result = await response.json();

      // Process results
      if (Array.isArray(result.data)) {
        result.data.forEach((receipt, index) => {
          if (receipt.status === 'ok') {
            successCount++;
          } else {
            failureCount++;
            errors.push(`Token ${index}: ${receipt.message || 'Unknown error'}`);
          }
        });
      } else {
        // Single message response
        if (result.status === 'ok') {
          successCount = pushTokens.length;
        } else {
          failureCount = pushTokens.length;
          errors.push(result.message || 'Unknown error');
        }
      }

      // Update notification status
      await notification.updateDeliveryStatus(successCount, failureCount, errors);

      console.log(`✅ Notification sent: ${successCount} success, ${failureCount} failed`);

      res.json({
        success: true,
        message: `Notification sent to ${successCount} users`,
        notificationId: notification._id,
        successCount,
        failureCount,
        totalRecipients: pushTokens.length
      });
    } catch (error) {
      console.error('❌ Error sending push notifications:', error);
      failureCount = pushTokens.length;
      errors.push(error.message);
      
      await notification.updateDeliveryStatus(0, failureCount, errors);

      res.status(500).json({
        success: false,
        message: 'Failed to send notifications',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        notificationId: notification._id
      });
    }
  } catch (error) {
    console.error('❌ Error in send notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/notifications/history
 * Get notification history (admin only)
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const sender = await User.findById(req.user.userId);
    if (!sender || sender.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view notification history'
      });
    }

    const limit = parseInt(req.query.limit) || 50;
    const notifications = await Notification.getRecent(limit);

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('❌ Error getting notification history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/notifications/preferences
 * Update user's notification preferences
 */
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { enabled, announcements, updates, reminders } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update preferences
    if (enabled !== undefined) {
      user.notificationPreferences.enabled = enabled;
    }
    if (announcements !== undefined) {
      user.notificationPreferences.announcements = announcements;
    }
    if (updates !== undefined) {
      user.notificationPreferences.updates = updates;
    }
    if (reminders !== undefined) {
      user.notificationPreferences.reminders = reminders;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Notification preferences updated',
      preferences: user.notificationPreferences
    });
  } catch (error) {
    console.error('❌ Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/notifications/preferences
 * Get user's notification preferences
 */
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('notificationPreferences');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      preferences: user.notificationPreferences || {
        enabled: true,
        announcements: true,
        updates: true,
        reminders: true
      }
    });
  } catch (error) {
    console.error('❌ Error getting notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
