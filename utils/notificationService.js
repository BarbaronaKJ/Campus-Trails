/**
 * Push Notification Service
 * Handles push notification registration, permissions, and token management
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NOTIFICATION_TOKEN_KEY = '@campus_trails:notification_token';
const NOTIFICATION_PERMISSION_KEY = '@campus_trails:notification_permission';

/**
 * Register for push notifications and get Expo push token
 * @returns {Promise<{token: string|null, permissionStatus: string, error?: string}>} Object with token, permission status, and optional error
 */
export const registerForPushNotificationsAsync = async () => {
  try {
    // Check if running on a physical device
    if (!Device.isDevice) {
      console.log('⚠️ Push notifications only work on physical devices');
      return { token: null, permissionStatus: 'undetermined', error: 'Not a physical device' };
    }

    // Check existing permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // If permission denied, return with status
    if (finalStatus !== 'granted') {
      console.log('❌ Failed to get push notification permission. Status:', finalStatus);
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, finalStatus);
      return { token: null, permissionStatus: finalStatus, error: 'Permission denied' };
    }

    // Permission is granted, now try to get the token
    try {
      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '48792f3f-3508-4f6d-85b4-66e6300d739f', // From app.json extra.eas.projectId
      });

      const token = tokenData.data;
      console.log('✅ Push notification token:', token);

      // Save token to AsyncStorage
      await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token);
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'granted');

      // Configure Android channel for notifications
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });
      }

      return { token, permissionStatus: 'granted' };
    } catch (tokenError) {
      console.error('❌ Error getting Expo push token:', tokenError);
      // Permission is granted but token retrieval failed
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'granted');
      return { token: null, permissionStatus: 'granted', error: 'Failed to get push token: ' + tokenError.message };
    }
  } catch (error) {
    console.error('❌ Error registering for push notifications:', error);
    // Check permission status even if there was an error
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return { token: null, permissionStatus: status, error: error.message };
    } catch (permError) {
      return { token: null, permissionStatus: 'undetermined', error: error.message };
    }
  }
};

/**
 * Get stored notification token
 * @returns {Promise<string|null>} Stored token or null
 */
export const getStoredNotificationToken = async () => {
  try {
    const token = await AsyncStorage.getItem(NOTIFICATION_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('❌ Error getting stored notification token:', error);
    return null;
  }
};

/**
 * Check if notification permission is granted
 * @returns {Promise<boolean>} True if permission is granted
 */
export const checkNotificationPermission = async () => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('❌ Error checking notification permission:', error);
    return false;
  }
};

/**
 * Request notification permission
 * @returns {Promise<boolean>} True if permission is granted
 */
export const requestNotificationPermission = async () => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Set up notification listeners
 * @param {Function} onNotificationReceived - Callback when notification is received
 * @param {Function} onNotificationTapped - Callback when notification is tapped
 * @returns {Array} Array of subscription objects to unsubscribe later
 */
export const setupNotificationListeners = (onNotificationReceived, onNotificationTapped) => {
  // Listener for notifications received while app is foregrounded
  const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
    console.log('📬 Notification received:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // Listener for when user taps on a notification
  const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('👆 Notification tapped:', response);
    if (onNotificationTapped) {
      onNotificationTapped(response);
    }
  });

  return [receivedListener, responseListener];
};

/**
 * Remove notification listeners
 * @param {Array} listeners - Array of subscription objects from setupNotificationListeners
 */
export const removeNotificationListeners = (listeners) => {
  listeners.forEach((listener) => {
    Notifications.removeNotificationSubscription(listener);
  });
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = async () => {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('❌ Error clearing notifications:', error);
  }
};

/**
 * Get notification badge count
 * @returns {Promise<number>} Badge count
 */
export const getBadgeCount = async () => {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('❌ Error getting badge count:', error);
    return 0;
  }
};

/**
 * Set notification badge count
 * @param {number} count - Badge count to set
 */
export const setBadgeCount = async (count) => {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('❌ Error setting badge count:', error);
  }
};

/**
 * Schedule a local notification (for testing)
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data
 * @param {number} seconds - Seconds until notification (default: 2)
 */
export const scheduleLocalNotification = async (title, body, data = {}, seconds = 2) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: {
        seconds,
      },
    });
  } catch (error) {
    console.error('❌ Error scheduling local notification:', error);
  }
};
