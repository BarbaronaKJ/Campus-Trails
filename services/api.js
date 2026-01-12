/**
 * API Service for Campus Trails
 * Handles all API requests to the backend server
 */

// API Base URL - Update this with your backend server URL
// For development: 'http://localhost:3000' (when testing on emulator/simulator)
// For production: 'https://your-backend-domain.com' (your deployed backend URL)
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

// NGROK URL - Update this with your NGROK HTTPS URL when testing on physical devices
// Get your NGROK URL by running: ngrok http 3000
// Example: 'https://xxxx-xx-xx-xx-xx.ngrok-free.app'
const NGROK_URL =   'https://hypermagical-uncondoned-elfrieda.ngrok-free.dev'; // Set to your NGROK URL (e.g., 'https://xxxx-xx-xx-xx-xx.ngrok-free.app') or null to use default

// Determine the correct API URL based on platform
const determineApiBaseUrl = () => {
  // If NGROK URL is set, use it (for physical device testing)
  if (NGROK_URL) {
    return NGROK_URL;
  }

  if (!__DEV__) {
    // Production - update with your deployed backend URL
    return 'https://your-backend-domain.com';
  }

  // Development mode - use platform-specific URLs
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    // For physical Android device, replace with your computer's local IP (e.g., 'http://192.168.1.100:3000')
    // Or set NGROK_URL above for NGROK tunneling
    return 'http://10.0.2.2:3000';
  } else if (Platform.OS === 'ios') {
    // iOS simulator can use localhost
    // For physical iOS device, replace with your computer's local IP (e.g., 'http://192.168.1.100:3000')
    // Or set NGROK_URL above for NGROK tunneling
    return 'http://localhost:3000';
  } else {
    // Web platform
    return 'http://localhost:3000';
  }
};

let API_BASE_URL = determineApiBaseUrl();

/**
 * Fetch all pins from the backend API (including invisible waypoints for pathfinding)
 * @param {boolean} includeInvisible - Whether to include invisible waypoints (default: true for pathfinding)
 * @returns {Promise<Array>} Array of pin objects
 */
export const fetchPins = async (includeInvisible = true) => {
  try {
    // Fetch all pins including invisible ones (needed for pathfinding)
    const url = `${API_BASE_URL}/api/pins${includeInvisible ? '?includeInvisible=true' : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
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

    const data = await response.json();
    
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

    const data = await response.json();
    
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
 * @returns {Promise<Object>} { user, token }
 */
export const register = async (username, email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

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

    const data = await response.json();

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

    const data = await response.json();

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

    const data = await response.json();

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
    const response = await fetch(`${API_BASE_URL}/api/auth/activity`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(activityData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update activity');
    }

    return data.data; // Updated user object
  } catch (error) {
    console.error('Update activity error:', error);
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

    const data = await response.json();

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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to logout');
    }

    return data; // { success: true, message: 'Logged out successfully' }
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};
