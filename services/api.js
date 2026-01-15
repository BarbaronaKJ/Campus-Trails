/**
 * API Service for Campus Trails
 * Handles all API requests to the backend server
 */

// API Base URL - Update this with your backend server URL
// For development: 'http://localhost:3000' (when testing on emulator/simulator)
// For production: Render URL (set RENDER_URL constant below after deployment)
// For physical device testing: Use NGROK or your computer's local IP address (e.g., 'http://192.168.1.100:3000')
// 
// NGROK Setup:
// 1. Configure auth token: ngrok config add-authtoken YOUR_TOKEN
// 2. Start backend server: cd backend && npm start
// 3. Start NGROK: ngrok http 3000
// 4. Copy the HTTPS URL (e.g., https://xxxx-xx-xx-xx-xx.ngrok-free.app)
// 5. Set NGROK_URL environment variable or update the URL below
//
// Note: For Android emulator, use 10.0.2.2 instead of localhost
// Note: For iOS simulator, use localhost
// Note: For physical devices, use NGROK URL or your computer's local network IP address

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// NGROK URL - Update this with your NGROK HTTPS URL when testing on physical devices
// Get your NGROK URL by running: ngrok http 3000
// Example: 'https://xxxx-xx-xx-xx-xx.ngrok-free.app'
// IMPORTANT: Set to null for production APK builds to use Render URL
const NGROK_URL = null; // Set to null for production, or your NGROK URL for development testing

// LOCAL IP ADDRESS - Update this with your computer's local network IP for physical device testing
// Find your IP: 
//   Linux/Mac: ifconfig | grep "inet " | grep -v 127.0.0.1
//   Windows: ipconfig | findstr IPv4
// Example: 'http://192.168.1.100:3000'
// Set to null to use NGROK or Vercel
const LOCAL_IP = null; // Your local IP
// RENDER URL - Update this with your Render deployment URL
// After deploying to Render, you'll get a URL like: https://campus-trails-api.onrender.com
// IMPORTANT: Replace this with your actual Render URL after deployment
const RENDER_URL = 'https://campus-trails-api.onrender.com'; // Update this after deployment (no trailing slash)

// Determine the correct API URL based on platform and environment
const determineApiBaseUrl = () => {
  // For production builds (APK), always use Render URL
  // __DEV__ is a React Native global that's true in development, false in production
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;
  if (!isDev) {
    // Production - Render deployment URL
    console.log('🌐 Production build - Using Render URL:', RENDER_URL);
    return RENDER_URL;
  }

  // Check if running in Expo Go
  const isExpoGo = Constants.executionEnvironment === 'storeClient';
  
  // Development mode - Priority order:
  // For Expo Go (physical devices):
  //   1. LOCAL_IP (if set, for same network testing)
  //   2. NGROK_URL (if set, for tunnel testing)
  //   3. Render URL (default for Expo Go)
  // For Emulators/Simulators:
  //   1. LOCAL_IP (if set)
  //   2. NGROK_URL (if set)
  //   3. Platform-specific localhost

  // Priority 1: Use local IP if set (for physical devices on same network)
  if (LOCAL_IP) {
    console.log('🌐 Using LOCAL_IP:', LOCAL_IP);
    return LOCAL_IP;
  }

  // Priority 2: Use NGROK if set (for physical devices via tunnel)
  if (NGROK_URL) {
    console.log('🌐 Using NGROK_URL:', NGROK_URL);
    return NGROK_URL;
  }

  // Priority 3: For Expo Go, use Render URL (physical devices can't access localhost)
  if (isExpoGo) {
    console.log('🌐 Expo Go detected - Using Render URL:', RENDER_URL);
    return RENDER_URL;
  }

  // Priority 4: Use platform-specific localhost for emulators/simulators
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    const url = 'http://10.0.2.2:3000';
    console.log('🌐 Using Android emulator URL:', url);
    return url;
  } else if (Platform.OS === 'ios') {
    // iOS simulator can use localhost
    const url = 'http://localhost:3000';
    console.log('🌐 Using iOS simulator URL:', url);
    return url;
  } else {
    // Web platform
    const url = 'http://localhost:3000';
    console.log('🌐 Using web platform URL:', url);
    return url;
  }
};

let API_BASE_URL = determineApiBaseUrl();

// Log the API URL being used (for debugging)
console.log('🌐 API Base URL:', API_BASE_URL);

/**
 * Helper function to safely parse JSON response
 * @param {Response} response - Fetch response object
 * @returns {Promise<Object>} Parsed JSON data
 */
const safeJsonParse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  // Check if response is JSON
  if (contentType && contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (error) {
      // If JSON parsing fails, get text for debugging
      const text = await response.text();
      console.error('JSON parse error. Response text:', text.substring(0, 200));
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
    }
  } else {
    // Response is not JSON (likely HTML error page or plain text)
    const text = await response.text();
    console.error('Non-JSON response received. Content-Type:', contentType);
    console.error('Response text:', text.substring(0, 200));
    
    // Try to extract error message from HTML or return generic error
    if (text.includes('404') || text.includes('Not Found')) {
      throw new Error('API endpoint not found. Please check the server URL.');
    } else if (text.includes('CORS') || text.includes('Access-Control')) {
      throw new Error('CORS error: Server may not be configured correctly.');
    } else if (text.includes('502') || text.includes('Bad Gateway')) {
      throw new Error('Server is temporarily unavailable. Please try again later.');
    } else {
      throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
    }
  }
};

/**
 * Fetch all pins from the backend API (including invisible waypoints for pathfinding)
 * @param {boolean} includeInvisible - Whether to include invisible waypoints (default: true for pathfinding)
 * @returns {Promise<Array>} Array of pin objects
 */
export const fetchPins = async (includeInvisible = true) => {
  try {
    // Fetch all pins including invisible ones (needed for pathfinding)
    const url = `${API_BASE_URL}/api/pins${includeInvisible ? '?includeInvisible=true' : ''}`;
    console.log('🔍 Fetching pins from:', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('❌ API Error Response:', errorText.substring(0, 200));
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await safeJsonParse(response);
    
    if (data.success) {
      return data.data || [];
    } else {
      throw new Error(data.message || 'Failed to fetch pins');
    }
  } catch (error) {
    console.error('Error fetching pins from API:', error);
    throw error;
  }
};

/**
 * Fetch a single pin by ID from the backend API
 * @param {string|number} pinId - The ID of the pin to fetch
 * @returns {Promise<Object>} Pin object
 */
export const fetchPinById = async (pinId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pins/${pinId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await safeJsonParse(response);
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch pin');
    }
  } catch (error) {
    console.error(`Error fetching pin ${pinId} from API:`, error);
    throw error;
  }
};

/**
 * Fetch a pin by QR code from the backend API
 * @param {string} qrCode - The QR code identifier
 * @returns {Promise<Object>} Pin object
 */
export const fetchPinByQrCode = async (qrCode) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pins/qr/${qrCode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await safeJsonParse(response);
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Pin not found');
    }
  } catch (error) {
    console.error(`Error fetching pin by QR code ${qrCode}:`, error);
    throw error;
  }
};

/**
 * Fetch pins by category from the backend API
 * @param {string} category - The category to filter by
 * @returns {Promise<Array>} Array of pin objects in the specified category
 */
export const fetchPinsByCategory = async (category) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pins/category/${encodeURIComponent(category)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await safeJsonParse(response);
    
    if (data.success) {
      return data.data || [];
    } else {
      throw new Error(data.message || 'Failed to fetch pins by category');
    }
  } catch (error) {
    console.error(`Error fetching pins by category ${category} from API:`, error);
    throw error;
  }
};

/**
 * Check if the API server is accessible
 * @returns {Promise<boolean>} True if server is accessible, false otherwise
 */
export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

/**
 * Update API base URL (useful for switching between dev/prod or IP addresses)
 * @param {string} url - The new API base URL
 */
export const setApiBaseUrl = (url) => {
  API_BASE_URL = url;
  console.log('API Base URL updated to:', url);
};

// Export the current API base URL for reference
export const getApiBaseUrl = () => API_BASE_URL;

/**
 * Authentication API endpoints
 */

/**
 * Register a new user
 * @param {string} username - Username (min 3 characters)
 * @param {string} email - Email address
 * @param {string} password - Password (must have capital letter and symbol)
 * @param {string} secretQuestion - Secret question for password recovery
 * @param {string} secretAnswer - Secret answer for password recovery
 * @returns {Promise<Object>} { user, token }
 */
export const register = async (username, email, password, secretQuestion, secretAnswer) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password, secretQuestion, secretAnswer }),
    });

    const data = await safeJsonParse(response);

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return data.data; // { user, token }
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Login user
 * @param {string} usernameOrEmail - Username or email
 * @param {string} password - Password
 * @returns {Promise<Object>} { user, token }
 */
export const login = async (usernameOrEmail, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: usernameOrEmail, email: usernameOrEmail, password }),
    });

    const data = await safeJsonParse(response);

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return data.data; // { user, token }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Get current user profile (requires authentication token)
 * @param {string} token - JWT authentication token
 * @returns {Promise<Object>} User object
 */
export const getCurrentUser = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await safeJsonParse(response);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get user profile');
    }

    return data.data; // User object
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

/**
 * Update user profile (requires authentication token)
 * @param {string} token - JWT authentication token
 * @param {Object} profileData - Profile data to update (profilePicture, settings)
 * @returns {Promise<Object>} Updated user object
 */
export const updateUserProfile = async (token, profileData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    const data = await safeJsonParse(response);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }

    return data.data; // Updated user object
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

/**
 * Update user activity (saved pins, feedback) (requires authentication token)
 * @param {string} token - JWT authentication token
 * @param {Object} activityData - Activity data to update (savedPins, feedbackHistory)
 * @returns {Promise<Object>} Updated user object
 */
export const updateUserActivity = async (token, activityData) => {
  try {
    console.log('📤 Sending activity update:', activityData);
    console.log('📤 API URL:', `${API_BASE_URL}/api/auth/activity`);
    
    const response = await fetch(`${API_BASE_URL}/api/auth/activity`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(activityData),
    });

    console.log('📥 Response status:', response.status, response.statusText);

    const data = await safeJsonParse(response);

    if (!response.ok) {
      console.error('❌ Activity update failed:', data);
      throw new Error(data.message || 'Failed to update activity');
    }

    console.log('✅ Activity update successful:', data);
    return data.data; // Updated user object
  } catch (error) {
    console.error('❌ Update activity error:', error);
    console.error('Error details:', error.message);
    throw error;
  }
};

/**
 * Change user password (requires authentication token)
 * @param {string} token - JWT authentication token
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Success response
 */
export const changePassword = async (token, oldPassword, newPassword) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    const data = await safeJsonParse(response);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to change password');
    }

    return data; // { success: true, message: 'Password changed successfully' }
  } catch (error) {
    console.error('Change password error:', error);
    throw error;
  }
};

/**
 * Request password reset (forgot password) - Get secret question
 * @param {string} email - User's email address
 * @returns {Promise<Object>} Success response with secretQuestion
 */
export const forgotPassword = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await safeJsonParse(response);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get secret question');
    }

    return data; // { success: true, secretQuestion: '...', message: '...' }
  } catch (error) {
    console.error('Forgot password error:', error);
    throw error;
  }
};

/**
 * Reset password using secret answer
 * @param {string} email - User's email address
 * @param {string} secretAnswer - Secret answer to verify identity
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Success response
 */
export const resetPassword = async (email, secretAnswer, newPassword) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, secretAnswer, newPassword }),
    });

    const data = await safeJsonParse(response);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to reset password');
    }

    return data; // { success: true, message: 'Password has been reset successfully...' }
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

/**
 * Logout user (requires authentication token)
 * @param {string} token - JWT authentication token (optional, for server-side logging)
 * @returns {Promise<Object>} Success response
 */
export const logout = async (token) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Include token if provided (for server-side logging)
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers,
    });

    const data = await safeJsonParse(response);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to logout');
    }

    return data; // { success: true, message: 'Logged out successfully' }
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Campuses API endpoints
 */

/**
 * Fetch all campuses from the backend API
 * @returns {Promise<Array>} Array of campus objects with { name, order, active }
 */
export const fetchCampuses = async () => {
  try {
    const url = `${API_BASE_URL}/api/campuses`;
    console.log('🔍 Fetching campuses from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('❌ API Error Response:', errorText.substring(0, 200));
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await safeJsonParse(response);
    
    if (data.success) {
      // Return full campus objects (includes mapImageUrl)
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch campuses');
    }
  } catch (error) {
    if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
      console.error('🌐 Network error - check:');
      console.error('  1. Backend server is running: cd backend && npm start');
      console.error('  2. LOCAL_IP is set correctly in services/api.js');
      console.error('  3. Phone and computer are on same WiFi network');
      console.error('  4. Firewall allows connections on port 3000');
      console.error('  5. Test from phone browser: http://' + API_BASE_URL.replace('http://', '') + '/health');
      throw new Error('Network request failed: Check backend server and network configuration');
    }
    console.error('Error fetching campuses from API:', error);
    throw error;
  }
};

/**
 * Fetch all campuses (including inactive) from the backend API
 * @returns {Promise<Array>} Array of campus objects with { name, order, active }
 */
export const fetchAllCampuses = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/campuses/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await safeJsonParse(response);
    
    if (data.success) {
      return data.data.map(campus => campus.name);
    } else {
      throw new Error(data.message || 'Failed to fetch campuses');
    }
  } catch (error) {
    console.error('Error fetching all campuses from API:', error);
    throw error;
  }
};

// ==================== NOTIFICATION API ====================

/**
 * Register push notification token
 * @param {string} token - Expo push token
 * @param {string} authToken - JWT authentication token
 * @returns {Promise<Object>} Response data
 */
export const registerPushToken = async (token, authToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ pushToken: token }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await safeJsonParse(response);
    return data;
  } catch (error) {
    console.error('Error registering push token:', error);
    throw error;
  }
};

/**
 * Send push notification (admin only)
 * @param {Object} notificationData - Notification data
 * @param {string} authToken - JWT authentication token
 * @returns {Promise<Object>} Response data
 */
export const sendNotification = async (notificationData, authToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(notificationData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await safeJsonParse(response);
    return data;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

/**
 * Get notification history (admin only)
 * @param {string} authToken - JWT authentication token
 * @param {number} limit - Number of notifications to fetch
 * @returns {Promise<Array>} Array of notifications
 */
export const getNotificationHistory = async (authToken, limit = 50) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/history?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await safeJsonParse(response);
    return data.notifications || [];
  } catch (error) {
    console.error('Error fetching notification history:', error);
    throw error;
  }
};

/**
 * Update notification preferences
 * @param {Object} preferences - Notification preferences
 * @param {string} authToken - JWT authentication token
 * @returns {Promise<Object>} Response data
 */
export const updateNotificationPreferences = async (preferences, authToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(preferences),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await safeJsonParse(response);
    return data;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};

/**
 * Get notification preferences
 * @param {string} authToken - JWT authentication token
 * @returns {Promise<Object>} Notification preferences
 */
export const getNotificationPreferences = async (authToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/preferences`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await safeJsonParse(response);
    return data.preferences || {
      enabled: true,
      announcements: true,
      updates: true,
      reminders: true
    };
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    throw error;
  }
};

/**
 * Submit suggestion or feedback (from About Us)
 * @param {string} authToken - JWT authentication token
 * @param {Object} suggestionData - { campusId, message, type }
 * @returns {Promise<Object>} Created suggestion/feedback
 */
export const submitSuggestionAndFeedback = async (authToken, suggestionData) => {
  try {
    const apiBaseUrl = determineApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}/api/suggestions_and_feedbacks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(suggestionData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to submit suggestion/feedback: ${response.status} ${errorText}`);
    }

    const data = await safeJsonParse(response);
    return data;
  } catch (error) {
    console.error('Error submitting suggestion/feedback:', error);
    throw error;
  }
};

/**
 * Fetch developers from API
 * @returns {Promise<Array>} Array of developer objects
 */
export const fetchDevelopers = async () => {
  try {
    const apiBaseUrl = determineApiBaseUrl();
    const url = `${apiBaseUrl}/api/developers`;
    console.log('🌐 Fetching developers from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Developers API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Developers API error response:', errorText);
      throw new Error(`Failed to fetch developers: ${response.status} ${response.statusText}`);
    }

    const data = await safeJsonParse(response);
    console.log('📦 Developers API response data:', data);
    
    const developers = data.developers || data.data || [];
    console.log('✅ Extracted developers:', developers.length, developers);
    
    return developers;
  } catch (error) {
    console.error('❌ Error fetching developers:', error);
    console.error('Error details:', error.message);
    // Return empty array on error, app will use fallback
    return [];
  }
};

/**
 * Anonymous Analytics Tracking (No authentication required)
 * Complies with privacy guidelines - no PII collected
 */

// Track anonymous search
export const trackAnonymousSearch = async (campusId, query, resultCount = 0) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analytics/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campusId,
        query,
        resultCount
      }),
    });

    const data = await safeJsonParse(response);
    return data;
  } catch (error) {
    console.error('Error tracking anonymous search:', error);
    // Don't throw - tracking failure shouldn't affect app functionality
    return { success: false };
  }
};

// Track anonymous pathfinding route (Point A to B)
export const trackAnonymousPathfinding = async (campusId, startPoint, endPoint, pathLength = 0) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analytics/pathfinding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campusId,
        startPoint: {
          pinId: startPoint.pinId,
          title: startPoint.title || '',
          description: startPoint.description || ''
        },
        endPoint: {
          pinId: endPoint.pinId,
          title: endPoint.title || '',
          description: endPoint.description || ''
        },
        pathLength
      }),
    });

    const data = await safeJsonParse(response);
    return data;
  } catch (error) {
    console.error('Error tracking anonymous pathfinding:', error);
    // Don't throw - tracking failure shouldn't affect app functionality
    return { success: false };
  }
};
