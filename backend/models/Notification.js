const mongoose = require('mongoose');

/**
 * Notification Schema - Stores notification history
 * Used for admin panel to track sent notifications
 */
const notificationSchema = new mongoose.Schema({
  // Notification title
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  // Notification body/message
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  
  // Notification type: 'announcement', 'update', 'reminder', 'custom'
  type: {
    type: String,
    enum: ['announcement', 'update', 'reminder', 'custom'],
    default: 'announcement'
  },
  
  // Target audience: 'all', 'students', 'admins', or specific user IDs
  targetAudience: {
    type: String,
    enum: ['all', 'students', 'admins'],
    default: 'all'
  },
  
  // Specific user IDs (if targeting specific users)
  targetUserIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Data payload (for deep linking, navigation, etc.)
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Sender (admin user who sent the notification)
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Delivery status
  status: {
    type: String,
    enum: ['pending', 'sending', 'sent', 'failed', 'partial'],
    default: 'pending'
  },
  
  // Number of successful deliveries
  successCount: {
    type: Number,
    default: 0
  },
  
  // Number of failed deliveries
  failureCount: {
    type: Number,
    default: 0
  },
  
  // Total number of recipients
  totalRecipients: {
    type: Number,
    default: 0
  },
  
  // Scheduled send time (null for immediate)
  scheduledFor: {
    type: Date,
    default: null
  },
  
  // Actual send time
  sentAt: {
    type: Date,
    default: null
  },
  
  // Error messages (if any failures)
  errors: [{
    type: String
  }],
  
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
  collection: 'notifications'
});

// Indexes for efficient queries
notificationSchema.index({ sentBy: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ scheduledFor: 1 });

// Static method to create notification
notificationSchema.statics.createNotification = async function(notificationData) {
  const notification = new this(notificationData);
  await notification.save();
  return notification;
};

// Static method to get notifications by sender
notificationSchema.statics.getBySender = async function(senderId, limit = 50) {
  return await this.find({ sentBy: senderId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sentBy', 'email displayName')
    .lean();
};

// Static method to get recent notifications
notificationSchema.statics.getRecent = async function(limit = 50) {
  return await this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sentBy', 'email displayName')
    .lean();
};

// Method to update delivery status
notificationSchema.methods.updateDeliveryStatus = async function(successCount, failureCount, errors = []) {
  this.successCount = successCount;
  this.failureCount = failureCount;
  this.errors = errors;
  this.totalRecipients = successCount + failureCount;
  
  if (failureCount === 0) {
    this.status = 'sent';
  } else if (successCount === 0) {
    this.status = 'failed';
  } else {
    this.status = 'partial';
  }
  
  this.sentAt = new Date();
  await this.save();
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
