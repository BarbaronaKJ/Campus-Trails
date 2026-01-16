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
    const userId = req.user?.userId;

    if (!userId) {
      console.error('❌ No userId in req.user:', req.user);
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!pushToken || typeof pushToken !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Push token is required and must be a string'
      });
    }

    // Update user's push token
    const user = await User.findById(userId);
    if (!user) {
      console.error(`❌ User not found with ID: ${userId}`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Ensure notificationPreferences exists
    if (!user.notificationPreferences) {
      user.notificationPreferences = {
        enabled: true,
        announcements: true,
        updates: true,
        reminders: true
      };
    }
    
    // Update push token
    user.pushToken = pushToken.trim();
    user.updatedAt = new Date();
    
    try {
      // Use updateOne for more reliable update
      const updateResult = await User.updateOne(
        { _id: userId },
        { 
          $set: { 
            pushToken: pushToken.trim(),
            updatedAt: new Date()
          }
        }
      );
      
      if (updateResult.matchedCount === 0) {
        console.error(`❌ User not found for push token update: ${userId}`);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      console.log(`✅ Push token registered for user: ${user.email} (${user._id})`);
    } catch (saveError) {
      console.error('❌ Error saving user push token:', saveError);
      console.error('Save error details:', {
        userId: user._id,
        email: user.email,
        errorMessage: saveError.message,
        errorName: saveError.name,
        errorStack: saveError.stack
      });
      throw saveError;
    }

    res.json({
      success: true,
      message: 'Push token registered successfully'
    });
  } catch (error) {
    console.error('❌ Error registering push token:', error);
    console.error('Error stack:', error.stack);
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
        'notificationPreferences.enabled': true
      });
    } else if (targetAudience === 'students') {
      targetUsers = await User.find({ 
        role: 'student',
        'notificationPreferences.enabled': true
      });
    } else if (targetAudience === 'admins') {
      targetUsers = await User.find({ 
        role: 'admin',
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

    if (targetUsers.length === 0) {
      notification.status = 'failed';
      notification.errors = ['No target users found'];
      await notification.save();
      
      return res.json({
        success: false,
        message: 'No target users found',
        notificationId: notification._id
      });
    }

    // Store notification in each user's profile instead of sending push notifications
    const notificationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const notificationEntry = {
      id: notificationId,
      title,
      body,
      type,
      data,
      read: false,
      createdAt: new Date()
    };

    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    // Add notification to each user's notifications array
    for (const user of targetUsers) {
      try {
        // Initialize notifications array if it doesn't exist
        if (!user.activity) {
          user.activity = {};
        }
        if (!user.activity.notifications) {
          user.activity.notifications = [];
        }

        // Check if notification already exists (avoid duplicates)
        const exists = user.activity.notifications.find(n => n.id === notificationId);
        if (exists) {
          continue;
        }

        // Add notification to beginning of array (newest first)
        user.activity.notifications.unshift(notificationEntry);
        
        // Keep only last 100 notifications per user
        if (user.activity.notifications.length > 100) {
          user.activity.notifications = user.activity.notifications.slice(0, 100);
        }

        await user.save();
        successCount++;
      } catch (error) {
        failureCount++;
        errors.push(`User ${user._id}: ${error.message || 'Unknown error'}`);
        console.error(`❌ Error storing notification for user ${user._id}:`, error);
      }
    }

    // Update notification status
    await notification.updateDeliveryStatus(successCount, failureCount, errors);

    console.log(`✅ Notifications stored: ${successCount} success, ${failureCount} failed`);

    res.json({
      success: true,
      message: `Notification stored for ${successCount} users`,
      notificationId: notification._id,
      successCount,
      failureCount,
      totalRecipients: targetUsers.length
    });
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

/**
 * GET /api/notifications/user
 * Get notifications for the logged-in user
 */
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('activity.notifications');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const notifications = (user.activity?.notifications || []).map(notif => ({
      id: notif.id,
      title: notif.title,
      body: notif.body,
      type: notif.type,
      data: notif.data || {},
      read: notif.read || false,
      date: notif.createdAt || notif.date
    }));

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('❌ Error getting user notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/notifications/user/:notificationId/read
 * Mark a notification as read
 */
router.put('/user/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.activity || !user.activity.notifications) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    const notification = user.activity.notifications.find(n => n.id === notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.read = true;
    await user.save();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/notifications/user/:notificationId
 * Delete a notification for the logged-in user
 */
router.delete('/user/:notificationId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.activity || !user.activity.notifications) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    const initialLength = user.activity.notifications.length;
    user.activity.notifications = user.activity.notifications.filter(n => n.id !== notificationId);

    if (user.activity.notifications.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await user.save();

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/notifications/user
 * Clear all notifications for the logged-in user
 */
router.delete('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.activity) {
      user.activity = {};
    }
    user.activity.notifications = [];
    await user.save();

    res.json({
      success: true,
      message: 'All notifications cleared'
    });
  } catch (error) {
    console.error('❌ Error clearing notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
