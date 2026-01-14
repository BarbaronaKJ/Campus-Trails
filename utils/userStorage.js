/**
 * User Storage Utilities
 * Handles persistent storage for user profile data, settings, and activity tracking
 * Uses AsyncStorage for React Native (works on both mobile and web)
 */

// Use AsyncStorage for React Native (works on both mobile and web)
import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory storage fallback
let userStorage = {
  // User profile data
  profile: {
    username: '',
    email: '',
    profilePicture: null, // Cloudinary URL
    joinDate: new Date().toISOString(),
  },
  
  // Activity tracking
  activity: {
    savedPins: [],
    feedbackHistory: [],
    notifications: [], // Store received notifications
    firstActiveDate: new Date().toISOString(),
    lastActiveDate: new Date().toISOString(),
  },
  
  // Settings
  settings: {
    darkMode: false,
    alerts: {
      facilityUpdates: true,
      securityAlerts: true,
    },
  },
};

/**
 * Load user data from storage
 */
export const loadUserData = async () => {
  try {
    const stored = await AsyncStorage.getItem('campus_trails_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all fields exist
      userStorage = {
        profile: { ...userStorage.profile, ...(parsed.profile || {}) },
        activity: { 
          ...userStorage.activity, 
          ...(parsed.activity || {}),
          savedPins: parsed.activity?.savedPins || [],
          feedbackHistory: parsed.activity?.feedbackHistory || [],
          notifications: parsed.activity?.notifications || [],
        },
        settings: { ...userStorage.settings, ...(parsed.settings || {}) },
      };
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
  return userStorage;
};

/**
 * Save user data to storage
 */
export const saveUserData = async (data) => {
  try {
    userStorage = { ...userStorage, ...data };
    const dataToSave = JSON.stringify(userStorage);
    await AsyncStorage.setItem('campus_trails_user', dataToSave);
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    return false;
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (profileData) => {
  userStorage.profile = { ...userStorage.profile, ...profileData };
  return await saveUserData({ profile: userStorage.profile });
};

/**
 * Add saved pin
 */
export const addSavedPin = async (pin) => {
  if (!userStorage.activity.savedPins.find(p => p.id === pin.id)) {
    userStorage.activity.savedPins.push(pin);
    await saveUserData({ activity: userStorage.activity });
  }
};

/**
 * Remove saved pin
 */
export const removeSavedPin = async (pinId) => {
  userStorage.activity.savedPins = userStorage.activity.savedPins.filter(p => p.id !== pinId);
  await saveUserData({ activity: userStorage.activity });
};

/**
 * Add feedback
 */
export const addFeedback = async (feedback) => {
  const feedbackEntry = {
    id: Date.now(),
    pinId: feedback.pinId,
    pinTitle: feedback.pinTitle,
    rating: feedback.rating || 5,
    comment: feedback.comment || '',
    date: new Date().toISOString(),
    feedbackType: feedback.feedbackType || 'report', // 'suggestion' or 'report'
  };
  if (!userStorage.activity.feedbackHistory) {
    userStorage.activity.feedbackHistory = [];
  }
  userStorage.activity.feedbackHistory.push(feedbackEntry);
  await saveUserData({ activity: userStorage.activity });
  return feedbackEntry;
};

/**
 * Get activity statistics
 */
export const getActivityStats = () => {
  const firstDate = new Date(userStorage.activity.firstActiveDate || Date.now());
  const lastDate = new Date(userStorage.activity.lastActiveDate || Date.now());
  const daysDiff = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1;
  
  return {
    totalBookmarks: (userStorage.activity.savedPins || []).length,
    reviewsWritten: (userStorage.activity.feedbackHistory || []).length,
    daysActive: Math.max(1, daysDiff),
  };
};

/**
 * Update activity date
 */
export const updateActivityDate = async () => {
  userStorage.activity.lastActiveDate = new Date().toISOString();
  if (!userStorage.activity.firstActiveDate) {
    userStorage.activity.firstActiveDate = new Date().toISOString();
  }
  await saveUserData({ activity: userStorage.activity });
};

/**
 * Update settings
 */
export const updateSettings = async (settings) => {
  userStorage.settings = { ...userStorage.settings, ...settings };
  return await saveUserData({ settings: userStorage.settings });
};

/**
 * Get current user data
 */
export const getUserData = () => {
  return { ...userStorage };
};

/**
 * Add notification to storage
 */
export const addNotification = async (notification) => {
  if (!userStorage.activity.notifications) {
    userStorage.activity.notifications = [];
  }
  
  // Extract notification data from Expo notification structure
  // Expo notifications have: notification.request.content.title/body/data
  // Or direct: notification.title/body/data
  const content = notification.request?.content || notification;
  const title = content.title || notification.title || 'Notification';
  const body = content.body || notification.body || '';
  const data = content.data || notification.data || {};
  const notificationId = notification.id || notification.request?.identifier || Date.now().toString();
  
  const notificationEntry = {
    id: notificationId,
    title: title,
    body: body,
    data: data,
    date: new Date().toISOString(),
    read: false,
  };
  
  // Check if notification already exists (avoid duplicates)
  const exists = userStorage.activity.notifications.find(n => n.id === notificationId);
  if (exists) {
    console.log('⚠️ Notification already exists, skipping:', notificationId);
    return exists;
  }
  
  // Add to beginning of array (newest first)
  userStorage.activity.notifications.unshift(notificationEntry);
  // Keep only last 100 notifications
  if (userStorage.activity.notifications.length > 100) {
    userStorage.activity.notifications = userStorage.activity.notifications.slice(0, 100);
  }
  await saveUserData({ activity: userStorage.activity });
  console.log('✅ Notification stored:', notificationEntry);
  return notificationEntry;
};

/**
 * Remove notification from storage
 */
export const removeNotification = async (notificationId) => {
  if (!userStorage.activity.notifications) {
    return false;
  }
  const initialLength = userStorage.activity.notifications.length;
  userStorage.activity.notifications = userStorage.activity.notifications.filter(
    n => n.id !== notificationId
  );
  if (userStorage.activity.notifications.length < initialLength) {
    await saveUserData({ activity: userStorage.activity });
    return true;
  }
  return false;
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  if (!userStorage.activity.notifications) {
    return false;
  }
  const notification = userStorage.activity.notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    await saveUserData({ activity: userStorage.activity });
    return true;
  }
  return false;
};

/**
 * Get all notifications
 */
export const getNotifications = () => {
  return userStorage.activity.notifications || [];
};

/**
 * Get unread notifications count
 */
export const getUnreadNotificationsCount = () => {
  if (!userStorage.activity.notifications) {
    return 0;
  }
  return userStorage.activity.notifications.filter(n => !n.read).length;
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = async () => {
  userStorage.activity.notifications = [];
  await saveUserData({ activity: userStorage.activity });
};

// Initialize on load (async) - only for browser/web environments
// For React Native, call loadUserData() and updateActivityDate() manually in App.js useEffect
if (typeof window !== 'undefined') {
  // Load user data on initialization
  loadUserData().catch(console.error);
  // Update activity date on initialization
  updateActivityDate().catch(console.error);
}
