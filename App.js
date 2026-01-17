import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Image, ImageBackground, Modal, Text, TouchableOpacity, Pressable, TextInput, FlatList, Dimensions, ScrollView, Switch, Animated, BackHandler, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageZoom from 'react-native-image-pan-zoom';
import { FontAwesome as Icon } from '@expo/vector-icons';
import Svg, { Circle, Text as SvgText, Polyline, G, Image as SvgImage } from 'react-native-svg';
import * as Linking from 'expo-linking';
import QRCode from 'react-native-qrcode-svg';

// Conditionally import BarCodeScanner (only available in development builds)
let BarCodeScanner = null;
try {
  BarCodeScanner = require('expo-barcode-scanner').BarCodeScanner;
} catch (error) {
  console.log('BarCodeScanner native module not available (requires development build)');
}
import { styles } from './styles';
import { aStarPathfinding } from './utils/pathfinding';
import { allCategoryKeys, pinMatchesSelected, categoryPinIds } from './utils/categoryFilter';
// Campuses are now fetched from MongoDB API instead of constants
// Rooms are now stored in database (Pin model floors/rooms structure)
import { interpolateColor, interpolateBlueColor, interpolateRedColor, THROTTLE_MS } from './utils/colorInterpolation';
import { getPinCategory, getCategorizedPins } from './utils/pinCategories';
import { getAllRooms, getFilteredPins, getFilteredRooms, getSearchResults } from './utils/searchUtils';
import { handlePinPress as handlePinPressUtil, savePin as savePinUtil, handleCampusChange as handleCampusChangeUtil } from './utils/handlers';
import { getOptimizedImage, clearImageCache, ExpoImage } from './utils/imageUtils';
import { usePins } from './utils/usePins';
import { getProfilePictureUrl, uploadToCloudinaryDirect, CLOUDINARY_CONFIG } from './utils/cloudinaryUtils';
import * as ImagePicker from 'expo-image-picker';
import { loadUserData, saveUserData, addFeedback, addSavedPin, removeSavedPin, getActivityStats, updateSettings, updateProfile, addNotification, removeNotification, getNotifications, clearAllNotifications, getUnreadNotificationsCount } from './utils/userStorage';
import { register, login, getCurrentUser, updateUserProfile, updateUserActivity, changePassword, logout, fetchCampuses, forgotPassword, resetPassword, fetchPinByQrCode, registerPushToken, fetchDevelopers, submitSuggestionAndFeedback, trackAnonymousSearch, trackAnonymousPathfinding, getUserNotifications, markNotificationAsRead, deleteNotification, clearAllUserNotifications } from './services/api';
import { useBackHandler } from './utils/useBackHandler';
import { 
  registerForPushNotificationsAsync, 
  setupNotificationListeners, 
  removeNotificationListeners 
} from './utils/notificationService';
import * as Notifications from 'expo-notifications';

const { width, height } = Dimensions.get('window');

// Developer data structure (will be editable from Admin Panel in the future)
// This can be moved to a database/API endpoint later
const developersData = [
  {
    id: 1,
    name: 'Kenth Jonard Barbarona',
    email: 'kenth.barbarona9@gmail.com',
    photo: null, // Will be Cloudinary URL when added via Admin Panel
    role: 'System Analyst'
  },
  {
    id: 2,
    name: 'Cyle Audrey Villarte',
    email: 'villartecyle@gmail.com',
    photo: null,
    role: 'Front-end Developer'
  },
  {
    id: 3,
    name: 'Rafael Estorosas',
    email: 'rafael.estorosas123@gmail.com',
    photo: null,
    role: 'Database Administrator'
  },
  {
    id: 4,
    name: 'Christian Ferdinand Reantillo',
    email: 'cferdinand164@gmail.com',
    photo: null,
    role: 'Backend Developer'
  },
  {
    id: 5,
    name: 'Gwynnever Tutor',
    email: 'tutor.gwynnever333@gmail.com',
    photo: null,
    role: 'Researcher/Writer'
  }
];

// Helper function to format floor names with proper ordinal suffixes
const getFloorName = (floorLevel) => {
  if (floorLevel === 0) return 'Ground Floor';
  const floorNumber = floorLevel + 1;
  const lastDigit = floorNumber % 10;
  const lastTwoDigits = floorNumber % 100;
  let suffix = 'th';
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    suffix = 'th';
  } else if (lastDigit === 1) {
    suffix = 'st';
  } else if (lastDigit === 2) {
    suffix = 'nd';
  } else if (lastDigit === 3) {
    suffix = 'rd';
  }
  return `${floorNumber}${suffix} Floor`;
};

const App = () => {
  // Fetch pins from MongoDB API with fallback to local pinsData
  // Set useApi to false to disable API fetching and use local data only
  const { pins, loading: pinsLoading, error: pinsError, isUsingLocalFallback, refetch: refetchPins } = usePins(true);

  // Campuses state - fetched from MongoDB API
  const [campuses, setCampuses] = useState(['USTP-CDO']); // Default fallback (array of names for backward compatibility)
  const [campusesData, setCampusesData] = useState([]); // Full campus objects with mapImageUrl
  const [currentCampus, setCurrentCampus] = useState(null); // Current campus object
  const [campusesLoading, setCampusesLoading] = useState(false);
  const [campusesError, setCampusesError] = useState(null);
  const [mapImageLoadError, setMapImageLoadError] = useState(false); // Track if map image failed to load

  const [selectedPin, setSelectedPin] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isSearchVisible, setSearchVisible] = useState(false);
  const [isCampusVisible, setCampusVisible] = useState(false);
  const [savedPins, setSavedPins] = useState([]);
  const [notifications, setNotifications] = useState([]); // Notifications state
  const [pushNotificationEnabled, setPushNotificationEnabled] = useState(false); // Track push notification status
  const [developers, setDevelopers] = useState(developersData); // Developers from API, fallback to hardcoded
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomScale, setZoomScale] = useState(1);
  // Zoom and pan state for programmatic control
  const [zoomToPin, setZoomToPin] = useState(null); // { pin, zoom, panX, panY }
  
  // Modals state
  const [isPinsModalVisible, setPinsModalVisible] = useState(false);
  // Settings Modal State (replaces About modal)
  const [isSettingsVisible, setSettingsVisible] = useState(false);
  const [settingsTab, setSettingsTab] = useState('general'); // 'general' | 'about' | 'help'
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // Path line style setting (dot, dash, or solid)
  const [pathLineStyle, setPathLineStyle] = useState('solid'); // 'dot', 'dash', or 'solid'
  
  // Color settings for active pins during pathfinding
  const [pointAColorLight, setPointAColorLight] = useState({ r: 239, g: 83, b: 80 }); // Light red default
  const [pointAColorDark, setPointAColorDark] = useState({ r: 198, g: 40, b: 40 }); // Dark red default
  const [pointBColorLight, setPointBColorLight] = useState({ r: 239, g: 83, b: 80 }); // Light red default
  const [pointBColorDark, setPointBColorDark] = useState({ r: 198, g: 40, b: 40 }); // Dark red default
  
  // Check for existing auth token on app load
  useEffect(() => {
    const restoreAuth = async () => {
      try {
        // Check if user explicitly logged out (don't restore if logout flag is set)
        const wasLoggedOut = await AsyncStorage.getItem('wasLoggedOut');
        if (wasLoggedOut === 'true') {
          // Clear the flag and all stored data, reset all state
          console.log('User was logged out - clearing all data and resetting state');
          await AsyncStorage.removeItem('wasLoggedOut');
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('currentUser');
          await AsyncStorage.removeItem('campus_trails_user'); // Clear user storage data
          
          // Reset all auth state to ensure clean logout
          setIsLoggedIn(false);
          setAuthToken(null);
          setCurrentUser(null);
          setUserProfile({ username: '', email: '', profilePicture: null });
          setSavedPins([]);
          setFeedbackHistory([]);
          
          // Show auth modal to allow login
          setAuthModalVisible(true);
          setUserProfileVisible(false);
          setAuthTab('login');
          
          return;
        }

        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUserStr = await AsyncStorage.getItem('currentUser');
        const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
        
        if (storedToken && storedUser) {
          // Verify token is still valid by fetching current user
          try {
            const user = await getCurrentUser(storedToken);
            
            // Token is valid, restore session
            console.log('Token valid - restoring session for user:', user.username);
            setAuthToken(storedToken);
            setCurrentUser(user);
            setIsLoggedIn(true);
            
            // Update user profile state
            setUserProfile({
              username: user.username,
              email: user.email || '',
              profilePicture: user.profilePicture || null,
            });
            
            // Update saved pins and feedback history
            // Ensure saved pins have image property by fetching full pin data
            if (user.activity) {
              const savedPinsFromDB = user.activity.savedPins || [];
              // If we have pins loaded, enrich saved pins with image data
              // Prioritize database description, but merge with full pin data for missing properties
              if (pins && pins.length > 0) {
                const enrichedSavedPins = savedPinsFromDB.map(savedPin => {
                  const fullPin = pins.find(p => p.id === savedPin.id);
                  if (fullPin) {
                    // Merge: prioritize savedPin (database) properties, but use fullPin for missing ones
                    return {
                      ...fullPin,
                      ...savedPin, // Database values take priority (description, name, etc.)
                      image: savedPin.image || fullPin.image, // Use savedPin image if available, else fullPin
                    };
                  }
                  return savedPin; // Use savedPin as-is if no fullPin found
                });
                setSavedPins(enrichedSavedPins);
              } else {
                setSavedPins(savedPinsFromDB);
              }
              const transformedFeedbacks = transformFeedbackData(user.activity.feedbackHistory);
              setFeedbackHistory(transformedFeedbacks);
            }
            
            // Update settings
            if (user.settings) {
              setAlertPreferences({
                facilityUpdates: user.settings.alerts?.facilityUpdates !== false,
                securityAlerts: user.settings.alerts?.securityAlerts !== false,
              });
            }
          } catch (error) {
            // Token is invalid, expired, or user deleted from DB - clear all stored auth
            console.error('Token validation failed - user may be deleted from DB:', error);
            
            // Clear all AsyncStorage data
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('currentUser');
            await AsyncStorage.removeItem('wasLoggedOut');
            await AsyncStorage.removeItem('campus_trails_user'); // Clear user storage data
            
            // Reset all auth state
            setIsLoggedIn(false);
            setAuthToken(null);
            setCurrentUser(null);
            setUserProfile({ username: '', email: '', profilePicture: null });
            setSavedPins([]);
            setFeedbackHistory([]);
            
            // Show auth modal to allow login
            setAuthModalVisible(true);
            setUserProfileVisible(false);
            setAuthTab('login');
          }
        } else {
          // No stored token/user - ensure clean state but DON'T show login screen automatically
          // User can access login through the footer button
          console.log('No stored auth data - user can login via footer button');
          setIsLoggedIn(false);
          setAuthToken(null);
          setCurrentUser(null);
          // Don't automatically show login screen on first launch
          // setAuthModalVisible(false);
          // setUserProfileVisible(false);
        }
      } catch (error) {
        console.error('Error restoring auth:', error);
        // On any error, clear everything but don't automatically show login
        // User can login via footer button
        try {
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('currentUser');
          await AsyncStorage.removeItem('wasLoggedOut');
          await AsyncStorage.removeItem('campus_trails_user');
        } catch (clearError) {
          console.error('Error clearing AsyncStorage:', clearError);
        }
        setIsLoggedIn(false);
        setAuthToken(null);
        setCurrentUser(null);
        // Don't automatically show login screen on error
        // setAuthModalVisible(false);
        // setUserProfileVisible(false);
      }
    };
    
    restoreAuth();
  }, []);

  // Function to load campuses from MongoDB API
  const loadCampuses = async () => {
    try {
      setCampusesLoading(true);
      setCampusesError(null);
      const fetchedCampuses = await fetchCampuses();
      
      // Ensure USTP-CDO has mapImageUrl in the campuses data
      const USTP_CDO_MAP_URL = 'https://res.cloudinary.com/dun83uvdm/image/upload/v1768333826/ustp-cdo-map_wdhsz4.png';
      const updatedCampuses = fetchedCampuses.map(campus => {
        if (campus.name === 'USTP-CDO' && !campus.mapImageUrl) {
          return {
            ...campus,
            mapImageUrl: USTP_CDO_MAP_URL
          };
        }
        return campus;
      });
      
      // Store full campus objects (with USTP-CDO mapImageUrl ensured)
      setCampusesData(updatedCampuses);
      // Also store names array for backward compatibility
      setCampuses(updatedCampuses.map(c => c.name));
      
      // Set initial campus to USTP-CDO (or first campus if USTP-CDO not found)
      const defaultCampus = updatedCampuses.find(c => c.name === 'USTP-CDO') || updatedCampuses[0];
      if (defaultCampus) {
        setCurrentCampus(defaultCampus);
      }
    } catch (error) {
      console.error('Failed to fetch campuses from API, using default:', error);
      setCampusesError(error.message);
      // Keep default campuses on error (fallback)
      const defaultCampusData = {
        name: 'USTP-CDO',
        mapImageUrl: 'https://res.cloudinary.com/dun83uvdm/image/upload/v1768333826/ustp-cdo-map_wdhsz4.png'
      };
      setCampusesData([defaultCampusData]);
      setCampuses(['USTP-CDO']);
      setCurrentCampus(defaultCampusData);
    } finally {
      setCampusesLoading(false);
    }
  };

  // Reset map image load error when campus changes
  useEffect(() => {
    setMapImageLoadError(false);
  }, [currentCampus?.name]);

  // Track last sync timestamps for efficient syncing
  const lastSyncRef = useRef({
    pins: 0,
    campuses: 0,
    developers: 0,
    user: 0
  });

  // Bandwidth-efficient data sync function (only syncs what's changed)
  const syncAllData = async (forceFullSync = false) => {
    try {
      const now = Date.now();
      const syncInterval = 15000; // 15 seconds
      const lastSync = lastSyncRef.current;
      
      // Skip if synced recently (unless forced)
      if (!forceFullSync) {
        const timeSinceLastSync = now - Math.max(lastSync.pins, lastSync.campuses, lastSync.user);
        if (timeSinceLastSync < syncInterval) {
          return; // Skip this sync, too soon
        }
      }

      // Only log on actual syncs (not skipped ones)
      if (forceFullSync || now - lastSync.pins >= syncInterval) {
        // Sync pins (essential data - sync frequently)
        if (refetchPins) {
          try {
            await refetchPins();
            lastSyncRef.current.pins = now;
          } catch (error) {
            console.error('❌ Error syncing pins:', error);
          }
        }
      }

      // Sync campuses (rarely changes - sync less frequently, every 2 minutes)
      if (forceFullSync || now - lastSync.campuses >= 120000) {
        try {
          await loadCampuses();
          lastSyncRef.current.campuses = now;
        } catch (error) {
          console.error('❌ Error syncing campuses:', error);
        }
      }

      // Sync developers (rarely changes - sync less frequently, every 5 minutes)
      if (forceFullSync || now - lastSync.developers >= 300000) {
        try {
          await loadDevelopers();
          lastSyncRef.current.developers = now;
        } catch (error) {
          console.error('❌ Error syncing developers:', error);
        }
      }

      // Sync user data if logged in (essential data - sync frequently)
      if (isLoggedIn && authToken && (forceFullSync || now - lastSync.user >= syncInterval)) {
        try {
          // Lightweight user data sync - only fetch essential fields
          const updatedUser = await getCurrentUser(authToken);
          setCurrentUser(updatedUser);
          
          // Update user profile state (only if changed)
          const newProfile = {
            username: updatedUser.username,
            email: updatedUser.email || '',
            profilePicture: updatedUser.profilePicture || null,
          };
          
          // Only update if profile actually changed
          if (JSON.stringify(newProfile) !== JSON.stringify(userProfile)) {
            setUserProfile(newProfile);
          }
          
          // Update saved pins and feedback history (only if changed)
          if (updatedUser.activity) {
            const savedPinsFromDB = updatedUser.activity.savedPins || [];
            const currentSavedPinsStr = JSON.stringify(savedPins);
            
            // Only update if saved pins changed
            if (JSON.stringify(savedPinsFromDB) !== currentSavedPinsStr) {
              // Enrich saved pins with full pin data if pins are loaded
              if (pins && pins.length > 0) {
                const enrichedSavedPins = savedPinsFromDB.map(savedPin => {
                  const fullPin = pins.find(p => p.id === savedPin.id);
                  if (fullPin) {
                    return {
                      ...fullPin,
                      ...savedPin,
                      image: savedPin.image || fullPin.image,
                    };
                  }
                  return savedPin;
                });
                setSavedPins(enrichedSavedPins);
              } else {
                setSavedPins(savedPinsFromDB);
              }
            }
            
            // Update feedback history (only if changed)
            const transformedFeedbacks = transformFeedbackData(updatedUser.activity.feedbackHistory);
            const currentFeedbacksStr = JSON.stringify(feedbackHistory);
            if (JSON.stringify(transformedFeedbacks) !== currentFeedbacksStr) {
              setFeedbackHistory(transformedFeedbacks);
            }
          }
          
          // Update settings (only if changed)
          if (updatedUser.settings) {
            const newAlertPrefs = {
              facilityUpdates: updatedUser.settings.alerts?.facilityUpdates !== false,
              securityAlerts: updatedUser.settings.alerts?.securityAlerts !== false,
            };
            if (JSON.stringify(newAlertPrefs) !== JSON.stringify(alertPreferences)) {
              setAlertPreferences(newAlertPrefs);
            }
          }
          
          lastSyncRef.current.user = now;
        } catch (error) {
          console.error('❌ Error syncing user data:', error);
        }
      }
    } catch (error) {
      console.error('❌ Error in sync:', error);
    }
  };

  // Fetch campuses from MongoDB API on component mount
  useEffect(() => {
    loadCampuses();
  }, []);

  // Initial sync when app opens (full sync)
  useEffect(() => {
    // Wait a bit for initial data to load, then do full sync
    const syncTimer = setTimeout(() => {
      syncAllData(true); // Force full sync on app open
    }, 1000); // Sync 1 second after app opens
    
    return () => clearTimeout(syncTimer);
  }, []); // Only run once on mount

  // Periodic sync every 15 seconds (bandwidth-efficient)
  useEffect(() => {
    // Only sync if app is active (not in background)
    let syncInterval;
    
    const setupSync = () => {
      syncInterval = setInterval(() => {
        // Only sync if app is in foreground
        syncAllData(false); // Lightweight sync
      }, 15000); // 15 seconds
    };

    setupSync();

    // Cleanup on unmount
    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - syncAllData handles its own dependencies internally

  // Function to load developers from API
  const loadDevelopers = async () => {
    try {
      console.log('🔄 Fetching developers from API...');
      const fetchedDevelopers = await fetchDevelopers();
      console.log('📦 Raw developers from API:', fetchedDevelopers);
      
      if (fetchedDevelopers && fetchedDevelopers.length > 0) {
        // Transform developers to match app format (add id field from _id)
        const transformedDevelopers = fetchedDevelopers.map(dev => ({
          id: dev._id?.toString() || dev.id?.toString() || String(Math.random()),
          name: dev.name || '',
          email: dev.email || '',
          photo: dev.photo || null,
          role: dev.role || 'Developer'
        }));
        console.log('✅ Loaded developers from API:', transformedDevelopers.length, transformedDevelopers);
        setDevelopers(transformedDevelopers);
      } else {
        console.log('⚠️ No developers from API (empty array), using fallback');
        // Only use fallback if API returns empty array
        setDevelopers(developersData);
      }
    } catch (error) {
      console.error('❌ Error loading developers from API:', error);
      console.error('Error details:', error.message, error.stack);
      // On error, still try to use fallback
      console.log('🔄 Using fallback developers data');
      setDevelopers(developersData);
    }
  };

  // Fetch developers from API on component mount
  useEffect(() => {
    loadDevelopers();
  }, []);

  // Refresh developers when About tab is opened
  useEffect(() => {
    if (settingsTab === 'about' && isSettingsVisible) {
      console.log('🔄 About tab opened - refreshing developers...');
      loadDevelopers();
    }
  }, [settingsTab, isSettingsVisible]);

  // Load notifications on mount and when login status changes
  useEffect(() => {
    const loadNotifications = async () => {
      if (isLoggedIn && authToken) {
        // Fetch from backend if logged in
        try {
          const backendNotifications = await getUserNotifications(authToken);
          setNotifications(backendNotifications);
        } catch (error) {
          console.error('Error loading notifications from backend:', error);
          // Fallback to local storage if backend fails
          const storedNotifications = getNotifications();
          setNotifications(storedNotifications);
        }
      } else {
        // Use local storage if not logged in
        const storedNotifications = getNotifications();
        setNotifications(storedNotifications);
      }
    };
    loadNotifications();
  }, [isLoggedIn, authToken]);

  // Push Notification Setup - Only for logged-in users
  useEffect(() => {
    let notificationListeners = [];

    // Only set up push notifications if user is logged in
    if (!isLoggedIn || !authToken) {
      console.log('ℹ️ Push notifications disabled: User not logged in');
      return;
    }

    // Register for push notifications
    const setupNotifications = async () => {
      try {
        const result = await registerForPushNotificationsAsync();
        if (result.token) {
          // Register token with backend
          try {
            await registerPushToken(result.token, authToken);
            setPushNotificationEnabled(true);
            console.log('✅ Push token registered with backend');
          } catch (error) {
            console.error('❌ Failed to register push token with backend:', error);
            // Permission is granted, but backend registration failed
            setPushNotificationEnabled(result.permissionStatus === 'granted');
          }
        } else {
          // Check if permission is actually granted (token might have failed for other reasons)
          const isPermissionGranted = result.permissionStatus === 'granted';
          setPushNotificationEnabled(isPermissionGranted);
          if (result.error && !isPermissionGranted) {
            console.log('⚠️ Push notification permission:', result.permissionStatus, result.error);
          } else if (result.error && isPermissionGranted) {
            console.log('⚠️ Permission granted but token retrieval failed:', result.error);
          }
        }
      } catch (error) {
        console.error('❌ Error setting up push notifications:', error);
        // Check permission status even if there was an error
        try {
          const { status } = await Notifications.getPermissionsAsync();
          setPushNotificationEnabled(status === 'granted');
        } catch (permError) {
          setPushNotificationEnabled(false);
        }
      }
    };

    // Set up notification listeners (only for logged-in users)
    notificationListeners = setupNotificationListeners(
      // On notification received (foreground)
      async (notification) => {
        console.log('📬 Notification received:', notification);
        console.log('📬 Notification structure:', JSON.stringify(notification, null, 2));
        // Only process if still logged in
        if (isLoggedIn && authToken) {
          try {
            // Note: Since we're no longer sending push notifications, this listener won't be triggered
            // But keeping the code for consistency - refresh from backend
            try {
              const backendNotifications = await getUserNotifications(authToken);
              setNotifications(backendNotifications);
            } catch (error) {
              console.error('Error refreshing notifications from backend:', error);
              const storedNotifications = getNotifications();
              setNotifications(storedNotifications);
            }
          } catch (error) {
            console.error('❌ Error storing notification:', error);
          }
        }
      },
      // On notification tapped
      (response) => {
        console.log('👆 Notification tapped:', response);
        // Only process if still logged in
        if (!isLoggedIn || !authToken) {
          console.log('ℹ️ Notification ignored: User not logged in');
          return;
        }
        
        const data = response.notification.request.content.data;
        
        // Note: Since we're no longer sending push notifications, this listener won't be triggered
        // But keeping the code for consistency - refresh from backend
        getUserNotifications(authToken).then(backendNotifications => {
          setNotifications(backendNotifications);
        }).catch(error => {
          console.error('Error refreshing notifications from backend:', error);
          const storedNotifications = getNotifications();
          setNotifications(storedNotifications);
        });
        
        // Handle deep linking based on notification data
        if (data) {
          // Example: Navigate to a specific pin
          if (data.pinId) {
            const pin = pins.find(p => p.id === data.pinId || p._id === data.pinId);
            if (pin) {
              handlePinPress(pin);
            }
          }
          // Example: Open a specific modal
          if (data.action === 'openProfile') {
            setUserProfileVisible(true);
            setUserProfileTab('notifications');
          }
        }
      }
    );

    // Initial setup
    setupNotifications();

    // Cleanup listeners on unmount or when user logs out
    return () => {
      removeNotificationListeners(notificationListeners);
    };
  }, [isLoggedIn, authToken]);

  // Register push token when user logs in and check status
  useEffect(() => {
    const registerTokenOnLogin = async () => {
      if (isLoggedIn && authToken) {
        try {
          const result = await registerForPushNotificationsAsync();
          if (result.token) {
            await registerPushToken(result.token, authToken);
            setPushNotificationEnabled(true);
            console.log('✅ Push token registered after login');
          } else {
            // Check if permission is actually granted
            const isPermissionGranted = result.permissionStatus === 'granted';
            setPushNotificationEnabled(isPermissionGranted);
            if (!isPermissionGranted) {
              console.log('⚠️ Push notification permission not granted. Status:', result.permissionStatus);
            } else {
              console.log('⚠️ Permission granted but token retrieval failed:', result.error);
            }
          }
        } catch (error) {
          console.error('❌ Failed to register push token after login:', error);
          // Check permission status even if there was an error
          try {
            const { status } = await Notifications.getPermissionsAsync();
            setPushNotificationEnabled(status === 'granted');
          } catch (permError) {
            setPushNotificationEnabled(false);
          }
        }
      } else {
        setPushNotificationEnabled(false);
      }
    };

    registerTokenOnLogin();
  }, [isLoggedIn, authToken]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [settingsTab, fadeAnim]);
  // Filter Modal State
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState({});
  
  // Pathfinding State
  const [pathfindingMode, setPathfindingMode] = useState(false);
  const [showPathfindingPanel, setShowPathfindingPanel] = useState(false);
  const [pointA, setPointA] = useState(null);
  const [pointB, setPointB] = useState(null);
  const [path, setPath] = useState([]);
  // Track if pathfinding panel should be rendered (for animation)
  const [pathfindingPanelRendered, setPathfindingPanelRendered] = useState(false);
  // Track if pins modal should be rendered (for animation)
  const [pinsModalRendered, setPinsModalRendered] = useState(false);
  const [pinsModalSearchQuery, setPinsModalSearchQuery] = useState('');
  // Pin Selector Modal State (for pathfinding location selection)
  const [isPinSelectorModalVisible, setPinSelectorModalVisible] = useState(false);
  const [pinSelectorModalRendered, setPinSelectorModalRendered] = useState(false);
  // Track if settings modal should be rendered (for animation)
  const [settingsRendered, setSettingsRendered] = useState(false);
  // Track if filter modal should be rendered (for animation)
  const [filterModalRendered, setFilterModalRendered] = useState(false);
  // Track if search modal should be rendered (for animation)
  const [searchRendered, setSearchRendered] = useState(false);
  // Track if campus modal should be rendered (for animation)
  const [campusRendered, setCampusRendered] = useState(false);
  // Track if pin detail modal should be rendered (for animation)
  const [pinDetailModalRendered, setPinDetailModalRendered] = useState(false);
  // Track if building details modal should be rendered (for animation)
  const [buildingDetailsRendered, setBuildingDetailsRendered] = useState(false);
  const [isBuildingDetailsVisible, setBuildingDetailsVisible] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(0); // Floor level (0 = Ground Floor, 1 = 2nd Floor, etc.)
  const [cameFromPinDetails, setCameFromPinDetails] = useState(false);
  const floorFromRoomRef = useRef(null); // Store floor level from room search
  const hasSetFloorFromRoom = useRef(false); // Track if we've already set floor from room search
  // User Auth Modal State (combines Login and Registration)
  const [isAuthModalVisible, setAuthModalVisible] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register' | 'forgot'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regSecretQuestion, setRegSecretQuestion] = useState('');
  const [regSecretAnswer, setRegSecretAnswer] = useState('');
  
  // Forgot password state
  const [forgotSecretQuestion, setForgotSecretQuestion] = useState('');
  const [forgotSecretAnswer, setForgotSecretAnswer] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [showSecretQuestionPicker, setShowSecretQuestionPicker] = useState(false);
  
  const secretQuestions = [
    'What is the name of your first pet?',
    'What city were you born in?',
    'What is your mother\'s maiden name?',
    'What was the name of your elementary school?',
    'What is your favorite food?',
    'What is the name of your best friend?',
    'What is your favorite movie?',
    'What is your favorite book?',
    'What is your favorite color?',
    'What is your favorite sport?'
  ];
  
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  
  // Animated driver for pathfinding panel slide-in/out
  const pathfindingSlideAnim = useRef(new Animated.Value(0)).current;
  // Animated driver for pins modal slide-in/out
  const pinsModalSlideAnim = useRef(new Animated.Value(0)).current;
  // Animated driver for pin selector modal slide-in/out
  const pinSelectorModalSlideAnim = useRef(new Animated.Value(0)).current;
  // Animated driver for settings modal slide-in/out
  const settingsSlideAnim = useRef(new Animated.Value(0)).current;
  // Animated driver for filter modal slide
  const filterModalSlideAnim = useRef(new Animated.Value(0)).current;
  // Animated driver for search modal fade
  const searchAnim = useRef(new Animated.Value(0)).current;
  // Animated driver for campus modal fade
  const campusAnim = useRef(new Animated.Value(0)).current;
  // Animated driver for pin detail modal scale/fade
  const pinDetailModalAnim = useRef(new Animated.Value(0)).current;
  // Animated driver for auth modal slide
  const authModalSlideAnim = useRef(new Animated.Value(0)).current;
  const [authModalRendered, setAuthModalRendered] = useState(false);
  
  // User Profile State
  const [isUserProfileVisible, setUserProfileVisible] = useState(false);
  const [userProfileTab, setUserProfileTab] = useState('saved'); // 'saved' | 'feedback' | 'notifications' | 'settings'
  const userProfileSlideAnim = useRef(new Animated.Value(0)).current;
  const [userProfileRendered, setUserProfileRendered] = useState(false);
  
  // Refresh notifications when notifications tab is opened
  useEffect(() => {
    if (userProfileTab === 'notifications' && isUserProfileVisible) {
      const refreshNotifications = async () => {
        if (isLoggedIn && authToken) {
          try {
            const backendNotifications = await getUserNotifications(authToken);
            setNotifications(backendNotifications);
          } catch (error) {
            console.error('Error refreshing notifications from backend:', error);
            // Fallback to local storage if backend fails
            const storedNotifications = getNotifications();
            setNotifications(storedNotifications);
          }
        } else {
          const storedNotifications = getNotifications();
          setNotifications(storedNotifications);
        }
      };
      refreshNotifications();
    }
  }, [userProfileTab, isUserProfileVisible, isLoggedIn, authToken]);
  
  // User Data State
  const [userProfile, setUserProfile] = useState({
    username: '',
    email: '',
    profilePicture: null, // Cloudinary URL
  });
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [daysActive, setDaysActive] = useState(1);
  
  // Alert Preferences State
  const [alertPreferences, setAlertPreferences] = useState({
    facilityUpdates: true,
    securityAlerts: true,
  });
  
  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  // Feedback Modal State
  const [isFeedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackType, setFeedbackType] = useState('report'); // 'report' or 'suggestion'
  const [feedbackModalRendered, setFeedbackModalRendered] = useState(false);
  const feedbackModalFadeAnim = useRef(new Animated.Value(0)).current;
  
  // Fullscreen Image Viewer State
  const [isFullscreenImageVisible, setFullscreenImageVisible] = useState(false);
  const [fullscreenImageSource, setFullscreenImageSource] = useState(null);
  
  // QR Code Scanner State
  const [isQrScannerVisible, setQrScannerVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  
  // QR Code Display State (for showing building QR codes)
  const [isQrCodeVisible, setQrCodeVisible] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  
  // Feedback Modal Animation (fade in/out)
  useEffect(() => {
    if (isFeedbackModalVisible) {
      // Set to initial opacity first (before render to avoid flash)
      feedbackModalFadeAnim.setValue(0);
      // Use requestAnimationFrame to ensure smooth render timing
      requestAnimationFrame(() => {
        setFeedbackModalRendered(true);
        // Animate in with fade
        requestAnimationFrame(() => {
          Animated.timing(feedbackModalFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        });
      });
    } else if (feedbackModalRendered) {
      // Animate out first
      Animated.timing(feedbackModalFadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Hide after animation completes
        setFeedbackModalRendered(false);
      });
    }
  }, [isFeedbackModalVisible, feedbackModalFadeAnim, feedbackModalRendered]);

  useEffect(() => {
    if (showPathfindingPanel) {
      // Set to bottom position first (before render to avoid flash)
      pathfindingSlideAnim.setValue(300);
      // Use requestAnimationFrame to ensure smooth render timing
      requestAnimationFrame(() => {
        setPathfindingPanelRendered(true);
        // Animate in with spring for smoothness
        requestAnimationFrame(() => {
          Animated.spring(pathfindingSlideAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        });
      });
    } else if (pathfindingPanelRendered) {
      // Animate out first
      Animated.timing(pathfindingSlideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Hide after animation completes
        setPathfindingPanelRendered(false);
      });
    }
  }, [showPathfindingPanel, pathfindingSlideAnim, pathfindingPanelRendered]);

  useEffect(() => {
    if (isPinsModalVisible) {
      // Set to bottom position first (before render to avoid flash)
      pinsModalSlideAnim.setValue(300);
      // Use requestAnimationFrame to ensure smooth render timing
      requestAnimationFrame(() => {
        setPinsModalRendered(true);
        // Animate in with spring for smoothness
        requestAnimationFrame(() => {
          Animated.spring(pinsModalSlideAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        });
      });
    } else if (pinsModalRendered) {
      // Animate out first
      Animated.timing(pinsModalSlideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Hide after animation completes
        setPinsModalRendered(false);
      });
    }
  }, [isPinsModalVisible, pinsModalSlideAnim, pinsModalRendered]);

  // Pin Selector Modal Animation (same as Pins Modal - slide from bottom)
  useEffect(() => {
    if (isPinSelectorModalVisible) {
      // Set to bottom position first (before render to avoid flash)
      pinSelectorModalSlideAnim.setValue(300);
      // Use requestAnimationFrame to ensure smooth render timing
      requestAnimationFrame(() => {
        setPinSelectorModalRendered(true);
        // Animate in with spring for smoothness
        requestAnimationFrame(() => {
          Animated.spring(pinSelectorModalSlideAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        });
      });
    } else if (pinSelectorModalRendered) {
      // Animate out first
      Animated.timing(pinSelectorModalSlideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Hide after animation completes
        setPinSelectorModalRendered(false);
      });
    }
  }, [isPinSelectorModalVisible, pinSelectorModalSlideAnim, pinSelectorModalRendered]);

  // Settings Modal Animation
  useEffect(() => {
    if (isSettingsVisible) {
      // Set to bottom position first (before render to avoid flash)
      settingsSlideAnim.setValue(height);
      // Use requestAnimationFrame to ensure smooth render timing
      requestAnimationFrame(() => {
        setSettingsRendered(true);
        // Animate in with spring for smoothness
        requestAnimationFrame(() => {
          Animated.spring(settingsSlideAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        });
      });
    } else if (settingsRendered) {
      // Animate out first
      Animated.timing(settingsSlideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Hide after animation completes
        setSettingsRendered(false);
      });
    }
  }, [isSettingsVisible, settingsSlideAnim, settingsRendered, height]);

  // Filter Modal Animation (slide from bottom like Settings modal)
  useEffect(() => {
    if (isFilterModalVisible) {
      // Set to bottom position first (before render to avoid flash)
      filterModalSlideAnim.setValue(height);
      // Use requestAnimationFrame to ensure smooth render timing
      requestAnimationFrame(() => {
        setFilterModalRendered(true);
        // Animate in with spring for smoothness
        requestAnimationFrame(() => {
          Animated.spring(filterModalSlideAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        });
      });
    } else if (filterModalRendered) {
      // Animate out first
      Animated.timing(filterModalSlideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Hide after animation completes
        setFilterModalRendered(false);
      });
    }
  }, [isFilterModalVisible, filterModalSlideAnim, filterModalRendered, height]);

  // Search Modal Animation
  useEffect(() => {
    if (isSearchVisible) {
      // Set to initial opacity first (before render to avoid flash)
      searchAnim.setValue(0);
      // Use requestAnimationFrame to ensure smooth render timing
      requestAnimationFrame(() => {
        setSearchRendered(true);
        // Animate in with spring for smoothness
        requestAnimationFrame(() => {
          Animated.spring(searchAnim, {
            toValue: 1,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        });
      });
    } else if (searchRendered) {
      // Animate out first
      Animated.timing(searchAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Hide after animation completes
        setSearchRendered(false);
      });
    }
  }, [isSearchVisible, searchAnim, searchRendered]);

  // Campus Modal Animation
  useEffect(() => {
    if (isCampusVisible) {
      // Set to initial opacity first (before render to avoid flash)
      campusAnim.setValue(0);
      // Use requestAnimationFrame to ensure smooth render timing
      requestAnimationFrame(() => {
        setCampusRendered(true);
        // Animate in with spring for smoothness
        requestAnimationFrame(() => {
          Animated.spring(campusAnim, {
            toValue: 1,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        });
      });
    } else if (campusRendered) {
      // Animate out first
      Animated.timing(campusAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Hide after animation completes
        setCampusRendered(false);
      });
    }
  }, [isCampusVisible, campusAnim, campusRendered]);

  // Building Details Modal Animation (slide in, fade out)
  const buildingDetailsSlideAnim = useRef(new Animated.Value(0)).current;
  const buildingDetailsFadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isBuildingDetailsVisible) {
      // Check if we have a floor level from room search and haven't set it yet
      console.log('Building Details Modal - useEffect triggered:', {
        isBuildingDetailsVisible,
        floorFromRoomRef: floorFromRoomRef.current,
        hasSetFloorFromRoom: hasSetFloorFromRoom.current,
        selectedPinId: selectedPin?.id,
        selectedPinFloors: selectedPin?.floors?.length || 0
      });
      
      if (floorFromRoomRef.current !== null && !hasSetFloorFromRoom.current) {
        const floorLevel = floorFromRoomRef.current;
        console.log('Building Details Modal - Setting floor from room search/ saved room:', floorLevel, '(', getFloorName(floorLevel), ')');
        // Set floor from room search
        setSelectedFloor(floorLevel);
        // Mark that we've set the floor from room search
        hasSetFloorFromRoom.current = true;
      } else if (floorFromRoomRef.current === null && !hasSetFloorFromRoom.current) {
        // Only set default floor if we didn't come from a room search
        // Set default floor to first floor from database when modal opens
        if (selectedPin?.floors && selectedPin.floors.length > 0) {
          const firstFloor = selectedPin.floors[0];
          console.log('Building Details Modal - Setting default floor:', firstFloor.level);
          setSelectedFloor(firstFloor.level);
        } else {
          console.log('Building Details Modal - Setting default floor: 0 (Ground Floor)');
          setSelectedFloor(0); // Default to Ground Floor (level 0)
        }
      }
      // Set to bottom position first (before render to avoid flash)
      buildingDetailsSlideAnim.setValue(300);
      buildingDetailsFadeAnim.setValue(0);
      // Use requestAnimationFrame to ensure smooth render timing
      requestAnimationFrame(() => {
        setBuildingDetailsRendered(true);
        // Animate in with spring for smoothness
        requestAnimationFrame(() => {
          Animated.parallel([
            Animated.spring(buildingDetailsSlideAnim, {
              toValue: 0,
              tension: 65,
              friction: 11,
              useNativeDriver: true,
            }),
            Animated.timing(buildingDetailsFadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        });
      });
    } else if (buildingDetailsRendered) {
      // Fade out first
      Animated.timing(buildingDetailsFadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Hide after animation completes
        setBuildingDetailsRendered(false);
        // Reset floor tracking when modal closes
        floorFromRoomRef.current = null;
        hasSetFloorFromRoom.current = false;
      });
    }
  }, [isBuildingDetailsVisible, buildingDetailsSlideAnim, buildingDetailsFadeAnim, buildingDetailsRendered, selectedPin]);

  // Auth Modal Animation (same as Settings Modal - slide from bottom)
  useEffect(() => {
    if (isAuthModalVisible) {
      // Set to bottom position first (before render to avoid flash)
      authModalSlideAnim.setValue(height);
      // Use requestAnimationFrame to ensure smooth render timing
      requestAnimationFrame(() => {
        setAuthModalRendered(true);
        // Animate in with spring for smoothness
        requestAnimationFrame(() => {
          Animated.spring(authModalSlideAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        });
      });
    } else if (authModalRendered) {
      // Animate out first
      Animated.timing(authModalSlideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Hide after animation completes
        setAuthModalRendered(false);
      });
    }
  }, [isAuthModalVisible, authModalSlideAnim, authModalRendered, height]);

  // Helper function to transform feedback data with proper pin title handling
  const transformFeedbackData = (feedbackHistoryFromDB) => {
    if (!feedbackHistoryFromDB || !Array.isArray(feedbackHistoryFromDB)) {
      return [];
    }
    
    return feedbackHistoryFromDB.map(feedback => {
      // pinId is populated from backend with id, title, category
      let pinTitle = feedback.pinId?.title || feedback.pinTitle || 'Unknown Building';
      let pinId = feedback.pinId?._id || feedback.pinId?.id || feedback.pinId;
      
      // If title looks like just a number, try to find the actual building name
      if (pinTitle && !isNaN(pinTitle)) {
        const localPin = pins.find(p => p.id == pinTitle || p._id == pinId || p.id == pinId);
        if (localPin && localPin.description) {
          pinTitle = localPin.description;
        } else if (localPin && localPin.title) {
          pinTitle = localPin.title;
        } else {
          pinTitle = `Building #${pinTitle}`;
        }
      }
      
      return {
        id: feedback.id || feedback._id,
        pinId: pinId,
        pinTitle: pinTitle,
        rating: feedback.rating || 5,
        comment: feedback.comment,
        date: feedback.date || feedback.createdAt || new Date().toISOString(),
      };
    });
  };

  // Sync data when View All Pins modal opens
  useEffect(() => {
    if (isPinsModalVisible && refetchPins) {
      const now = Date.now();
      // Only sync if last sync was more than 5 seconds ago (avoid redundant syncs)
      if (now - lastSyncRef.current.pins > 5000) {
        refetchPins().then(() => {
          lastSyncRef.current.pins = now;
        }).catch(error => {
          console.error('❌ Error syncing pins for View All Pins modal:', error);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPinsModalVisible]); // Remove refetchPins from dependencies to prevent infinite loop

  // Sync data when Search modal opens
  useEffect(() => {
    if (isSearchVisible && refetchPins) {
      const now = Date.now();
      // Only sync if last sync was more than 5 seconds ago
      if (now - lastSyncRef.current.pins > 5000) {
        refetchPins().then(() => {
          lastSyncRef.current.pins = now;
        }).catch(error => {
          console.error('❌ Error syncing pins for Search modal:', error);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSearchVisible]); // Remove refetchPins from dependencies to prevent infinite loop

  // Sync data when Filter modal opens
  useEffect(() => {
    if (isFilterModalVisible && refetchPins) {
      const now = Date.now();
      // Only sync if last sync was more than 5 seconds ago
      if (now - lastSyncRef.current.pins > 5000) {
        refetchPins().then(() => {
          lastSyncRef.current.pins = now;
        }).catch(error => {
          console.error('❌ Error syncing pins for Filter modal:', error);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFilterModalVisible]); // Remove refetchPins from dependencies to prevent infinite loop

  // Sync data when Building Details modal opens (lightweight - only if needed)
  useEffect(() => {
    if (isBuildingDetailsVisible) {
      const now = Date.now();
      
      // Sync pins (only if needed)
      if (refetchPins && now - lastSyncRef.current.pins > 5000) {
        refetchPins().then(() => {
          lastSyncRef.current.pins = now;
        }).catch(error => {
          console.error('❌ Error syncing pins for Building Details modal:', error);
        });
      }
      
      // Sync user data if logged in (for saved pins status - only if needed)
      if (isLoggedIn && authToken && now - lastSyncRef.current.user > 5000) {
        getCurrentUser(authToken)
          .then(updatedUser => {
            setCurrentUser(updatedUser);
            if (updatedUser.activity) {
              const savedPinsFromDB = updatedUser.activity.savedPins || [];
              if (pins && pins.length > 0) {
                const enrichedSavedPins = savedPinsFromDB.map(savedPin => {
                  const fullPin = pins.find(p => p.id === savedPin.id);
                  if (fullPin) {
                    return {
                      ...fullPin,
                      ...savedPin,
                      image: savedPin.image || fullPin.image,
                    };
                  }
                  return savedPin;
                });
                setSavedPins(enrichedSavedPins);
              } else {
                setSavedPins(savedPinsFromDB);
              }
            }
            lastSyncRef.current.user = now;
          })
          .catch(error => {
            console.error('❌ Error syncing user data for Building Details modal:', error);
          });
      }
    }
  }, [isBuildingDetailsVisible, refetchPins, isLoggedIn, authToken, pins]);

  // Sync data when Settings modal opens (lightweight - only if needed)
  useEffect(() => {
    if (isSettingsVisible && isLoggedIn && authToken) {
      const now = Date.now();
      // Only sync if last sync was more than 5 seconds ago
      if (now - lastSyncRef.current.user > 5000) {
        getCurrentUser(authToken)
          .then(updatedUser => {
            setCurrentUser(updatedUser);
            if (updatedUser.settings) {
              setAlertPreferences({
                facilityUpdates: updatedUser.settings.alerts?.facilityUpdates !== false,
                securityAlerts: updatedUser.settings.alerts?.securityAlerts !== false,
              });
            }
            lastSyncRef.current.user = now;
          })
          .catch(error => {
            console.error('❌ Error syncing user settings:', error);
          });
      }
    }
  }, [isSettingsVisible, isLoggedIn, authToken]);

  // Refresh user data when User Profile modal opens (lightweight - only if needed)
  useEffect(() => {
    if (isUserProfileVisible && isLoggedIn && authToken) {
      const now = Date.now();
      // Only sync if last sync was more than 5 seconds ago
      if (now - lastSyncRef.current.user > 5000) {
        // Refresh saved pins and feedback from database when modal opens
        const refreshUserData = async () => {
          try {
            const updatedUser = await getCurrentUser(authToken);
            setCurrentUser(updatedUser);
            
            if (updatedUser.activity) {
              // Update saved pins
              const savedPinsFromDB = updatedUser.activity.savedPins || [];
              if (pins && pins.length > 0) {
                const enrichedSavedPins = savedPinsFromDB.map(savedPin => {
                  const fullPin = pins.find(p => p.id === savedPin.id);
                  if (fullPin) {
                    // Merge: prioritize savedPin (database) properties, but use fullPin for missing ones
                    return {
                      ...fullPin,
                      ...savedPin, // Database values take priority (description, name, etc.)
                      image: savedPin.image || fullPin.image, // Use savedPin image if available, else fullPin
                    };
                  }
                  return savedPin; // Use savedPin as-is if no fullPin found
                });
                setSavedPins(enrichedSavedPins);
              } else {
                setSavedPins(savedPinsFromDB);
              }
              
              // Update feedback history with proper transformation
              const transformedFeedbacks = transformFeedbackData(updatedUser.activity.feedbackHistory);
              setFeedbackHistory(transformedFeedbacks);
              
              // Load notifications from backend
              try {
                const backendNotifications = await getUserNotifications(authToken);
                setNotifications(backendNotifications);
              } catch (error) {
                console.error('Error loading notifications from backend:', error);
                const storedNotifications = getNotifications();
                setNotifications(storedNotifications);
              }
            }
            
            lastSyncRef.current.user = now;
          } catch (error) {
            console.error('❌ Error refreshing user data in User Profile:', error);
          }
        };
        
        refreshUserData();
      }
    }
  }, [isUserProfileVisible, isLoggedIn, authToken, pins]);

  // User Profile Modal Animation (same as Settings Modal - slide from bottom)
  useEffect(() => {
    if (isUserProfileVisible) {
      // Set to bottom position first (before render to avoid flash)
      userProfileSlideAnim.setValue(height);
      // Use requestAnimationFrame to ensure smooth render timing
      requestAnimationFrame(() => {
        setUserProfileRendered(true);
        // Animate in with spring for smoothness
        requestAnimationFrame(() => {
          Animated.spring(userProfileSlideAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        });
      });
    } else if (userProfileRendered) {
      // Animate out first
      Animated.timing(userProfileSlideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Hide after animation completes
        setUserProfileRendered(false);
      });
    }
  }, [isUserProfileVisible, userProfileSlideAnim, userProfileRendered, height]);

  // Pin Detail Modal Animation
  useEffect(() => {
    if (isModalVisible) {
      // Set to bottom position first (before render to avoid flash)
      pinDetailModalAnim.setValue(height);
      // Use requestAnimationFrame to ensure smooth render timing
      requestAnimationFrame(() => {
        setPinDetailModalRendered(true);
        // Animate in with spring for smoothness
        requestAnimationFrame(() => {
          Animated.spring(pinDetailModalAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        });
      });
    } else if (pinDetailModalRendered) {
      // Skip animation if transitioning to Building Details Modal
      if (cameFromPinDetails) {
        // Hide immediately without animation
        setPinDetailModalRendered(false);
        setClickedPin(null); // Reset clicked pin when modal closes
      } else {
        // Animate out first
        Animated.timing(pinDetailModalAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          // Hide after animation completes
          setPinDetailModalRendered(false);
          setClickedPin(null); // Reset clicked pin when modal closes
        });
      }
    }
  }, [isModalVisible, pinDetailModalAnim, pinDetailModalRendered, cameFromPinDetails, height]);
  
  // Pathfinding location selector state
  const [activeSelector, setActiveSelector] = useState(null); // 'A' for start, 'B' for destination
  const [clickedPin, setClickedPin] = useState(null); // Track clicked pin for color change
  const [highlightedPinOnMap, setHighlightedPinOnMap] = useState(null); // Track pin to highlight on map
  
  // Color breathing animation for active pins (slow, smooth transition between sky blue and blue)
  const colorBreathAnim = useRef(new Animated.Value(0)).current;
  const [colorBreathValue, setColorBreathValue] = useState(0);
  const colorBreathAnimationRef = useRef(null);
  
  // Separate animations for pointA (red) and pointB (red)
  const pointAAnim = useRef(new Animated.Value(0)).current;
  const [pointAValue, setPointAValue] = useState(0);
  const pointAAnimationRef = useRef(null);
  
  const pointBAnim = useRef(new Animated.Value(0)).current;
  const [pointBValue, setPointBValue] = useState(0);
  const pointBAnimationRef = useRef(null);
  
  const lastUpdateTime = useRef(0);
  const lastUpdateTimeA = useRef(0);
  const lastUpdateTimeB = useRef(0);
  
  // Wrapper functions for color interpolation with current state
  const interpolateColorWrapper = (value) => interpolateColor(value);
  const interpolateBlueColorWrapper = (value) => interpolateRedColor(value, pointAColorLight, pointAColorDark);
  const interpolateRedColorWrapper = (value) => interpolateRedColor(value, pointBColorLight, pointBColorDark);
  
  // Animation for general active pins (highlighted, clicked)
  useEffect(() => {
    const hasActivePin = highlightedPinOnMap !== null || clickedPin !== null;
    
    if (hasActivePin) {
      colorBreathAnim.setValue(0);
      
      const listener = colorBreathAnim.addListener(({ value }) => {
        const now = Date.now();
        if (now - lastUpdateTime.current >= THROTTLE_MS) {
          setColorBreathValue(value);
          lastUpdateTime.current = now;
        }
      });
      
      colorBreathAnimationRef.current = Animated.loop(
        Animated.timing(colorBreathAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: false,
        })
      );
      colorBreathAnimationRef.current.start();
      
      return () => {
        colorBreathAnim.removeListener(listener);
        if (colorBreathAnimationRef.current) {
          colorBreathAnimationRef.current.stop();
        }
        lastUpdateTime.current = 0;
      };
    } else {
      if (colorBreathAnimationRef.current) {
        colorBreathAnimationRef.current.stop();
      }
      colorBreathAnim.setValue(0);
      setColorBreathValue(0);
      lastUpdateTime.current = 0;
    }
  }, [highlightedPinOnMap, clickedPin, colorBreathAnim]);
  
  // Animation for pointA and pointB images (up-down movement)
  useEffect(() => {
    if ((pointA || pointB) && pathfindingMode) {
      pointAAnim.setValue(0);
      pointBAnim.setValue(0);
      
      // Create up-down animation for point A
      if (pointA) {
        pointAAnimationRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(pointAAnim, {
              toValue: 1,
              duration: 1000, // Move down
              useNativeDriver: true,
            }),
            Animated.timing(pointAAnim, {
              toValue: 0,
              duration: 1000, // Move back up
              useNativeDriver: true,
            }),
          ])
        );
        pointAAnimationRef.current.start();
      }
      
      // Create up-down animation for point B
      if (pointB) {
        pointBAnimationRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(pointBAnim, {
              toValue: 1,
              duration: 1000, // Move down
              useNativeDriver: true,
            }),
            Animated.timing(pointBAnim, {
              toValue: 0,
              duration: 1000, // Move back up
              useNativeDriver: true,
            }),
          ])
        );
        pointBAnimationRef.current.start();
      }
      
      return () => {
        if (pointAAnimationRef.current) {
          pointAAnimationRef.current.stop();
        }
        if (pointBAnimationRef.current) {
          pointBAnimationRef.current.stop();
        }
        pointAAnim.setValue(0);
        pointBAnim.setValue(0);
      };
    } else {
      if (pointAAnimationRef.current) {
        pointAAnimationRef.current.stop();
      }
      if (pointBAnimationRef.current) {
        pointBAnimationRef.current.stop();
      }
      pointAAnim.setValue(0);
      pointBAnim.setValue(0);
    }
  }, [pointA, pointB, pathfindingMode, pointAAnim, pointBAnim]);
  
  // Deep Linking Handler - Handle QR code deep links
  useEffect(() => {
    // Handle initial URL (when app is opened via deep link)
    const getInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink(initialUrl);
      }
    };
    getInitialURL();

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, [pins]);

  // Handle deep link URL
  const handleDeepLink = async (url) => {
    try {
      console.log('Deep link received:', url);
      
      // Handle if URL is just the pin ID (from external QR scanner that extracted just the number)
      if (url && !url.includes('://') && !isNaN(url.trim())) {
        // Just a number - treat as pin ID
        const pinId = url.trim();
        const pin = pins.find(p => String(p.id) === String(pinId));
        if (pin) {
          handlePinPress(pin);
          return;
        }
      }
      
      // Parse the URL
      // Format: campustrails://pin/{pinId} or campustrails://qr/{qrCode}
      const parsed = Linking.parse(url);
      
      if (parsed.hostname === 'pin' && parsed.path) {
        // Direct pin ID link: campustrails://pin/123
        const pinId = parsed.path.replace('/', '').trim();
        const pin = pins.find(p => String(p.id) === String(pinId));
        if (pin) {
          handlePinPress(pin);
        } else {
          Alert.alert('Pin Not Found', `Pin with ID ${pinId} not found.`);
        }
      } else if (parsed.hostname === 'qr' && parsed.path) {
        // QR code link: campustrails://qr/{qrCode}
        const qrCode = parsed.path.replace('/', '').trim();
        await handleQrCodeScan(qrCode);
      } else if (parsed.scheme === 'campustrails' && parsed.path) {
        // Handle other campustrails:// URLs (fallback)
        const pathParts = parsed.path.split('/').filter(p => p);
        if (pathParts.length > 0) {
          const identifier = pathParts[pathParts.length - 1].trim();
          const pin = pins.find(p => String(p.id) === String(identifier) || p.qrCode === identifier);
          if (pin) {
            handlePinPress(pin);
          } else {
            Alert.alert('Pin Not Found', `Could not find pin for: ${identifier}`);
          }
        }
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
      Alert.alert('Error', 'Failed to process the link.');
    }
  };

  // Request camera permission for QR scanner (only if module is available)
  useEffect(() => {
    if (!BarCodeScanner) {
      setHasPermission(false);
      return;
    }
    
    (async () => {
      try {
        const { status } = await BarCodeScanner.requestPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch (error) {
        console.warn('BarCodeScanner not available (requires development build):', error);
        setHasPermission(false);
      }
    })();
  }, []);

  // Handle QR code scan (from scanner or deep link)
  const handleQrCodeScan = async (data) => {
    try {
      setScanned(true);
      
      // Check if it's a deep link URL
      if (data.startsWith('campustrails://')) {
        handleDeepLink(data);
        setQrScannerVisible(false);
        return;
      }
      
      // Check if it's a QR code identifier or pin ID
      // First, try to find in local pins (works offline)
      const localPin = pins.find(p => 
        String(p.id) === String(data) || 
        p.qrCode === data ||
        String(p.id) === String(data.replace('campustrails://pin/', '').replace('campustrails://qr/', ''))
      );
      
      if (localPin) {
        handlePinPress(localPin);
        setQrScannerVisible(false);
        return;
      }
      
      // If not found locally, try to fetch from API (requires internet)
      try {
        const pin = await fetchPinByQrCode(data);
        if (pin) {
          // Convert API pin format to app format if needed
          const appPin = {
            id: pin.id,
            x: pin.x,
            y: pin.y,
            title: pin.title,
            description: pin.description,
            image: pin.image,
            category: pin.category,
            isVisible: pin.isVisible,
            buildingNumber: pin.buildingNumber,
            floors: pin.floors || [],
            qrCode: pin.qrCode,
            ...pin
          };
          handlePinPress(appPin);
          setQrScannerVisible(false);
        }
      } catch (error) {
        // If QR code lookup fails, show error
        Alert.alert('Pin Not Found', `No pin found for QR code: ${data}\n\nMake sure you're connected to the internet or the QR code is valid.`);
        setScanned(false); // Allow scanning again
      }
    } catch (error) {
      console.error('Error handling QR code scan:', error);
      Alert.alert('Error', 'Failed to process QR code.');
      setScanned(false); // Allow scanning again
    }
  };

  // Handle Android back button
  useBackHandler({
    isBuildingDetailsVisible,
    cameFromPinDetails,
    isModalVisible,
    isFilterModalVisible,
    isSettingsVisible,
    isPinsModalVisible,
    showPathfindingPanel,
    isSearchVisible,
    isCampusVisible,
    isAuthModalVisible,
    isUserProfileVisible,
    isFeedbackModalVisible,
    isQrScannerVisible,
    isQrCodeVisible,
    setBuildingDetailsVisible,
    setModalVisible,
    setCameFromPinDetails,
    setFilterModalVisible,
    setSettingsVisible,
    setPinsModalVisible,
    setPinSelectorModalVisible,
    setShowPathfindingPanel,
    setPathfindingMode,
    setPath,
    setPointA,
    setPointB,
    setActiveSelector,
    setSearchVisible,
    setCampusVisible,
    setAuthModalVisible,
    setUserProfileVisible,
    setFeedbackModalVisible,
    setQrScannerVisible: setQrScannerVisible,
    setQrCodeVisible: setQrCodeVisible,
  });

  
  // Handle zoom to pin - workaround for react-native-image-pan-zoom limitations
  useEffect(() => {
    if (zoomToPin && zoomToPin.zoom) {
      // Since react-native-image-pan-zoom doesn't support direct programmatic control,
      // we use a workaround: force remount with a new key to reset the component
      // This is not ideal but works as a fallback
      // The pin is already highlighted, making it easy to find
      
      // Try to access internal state through ref
      if (imageZoomRef.current) {
        const ref = imageZoomRef.current;
        // Try to find and call internal methods
        if (ref._component) {
          // Access the internal component if available
          const internal = ref._component;
          if (internal.setNativeProps) {
            // Try to set native props directly
            // This is a workaround that may not work with all versions
          }
        }
      }
      
      // Force remount as fallback (resets zoom/pan but highlights pin)
      setImageZoomKey(prev => prev + 1);
      
      // Clear after a delay
      setTimeout(() => {
        setZoomToPin(null);
      }, 500);
    }
  }, [zoomToPin]);
  
  // ImageZoom ref for programmatic control
  const imageZoomRef = useRef(null);
  // Key for forcing ImageZoom remount when zooming to pin
  const [imageZoomKey, setImageZoomKey] = useState(0);
  
  // Alert Modal State
  const [showAlertModal, setShowAlertModal] = useState(false);

  // Building 9 room data
  const [alertMessage, setAlertMessage] = useState('');

  // Flatten all rooms from all buildings for search
  const allRooms = React.useMemo(() => {
    const rooms = [];
    pins.forEach(pin => {
      if (pin.floors && Array.isArray(pin.floors)) {
        pin.floors.forEach((floor) => {
          if (floor.rooms && Array.isArray(floor.rooms)) {
            floor.rooms.forEach(room => {
              rooms.push({
                ...room,
                floor: `Floor ${floor.level}`,
                floorLevel: floor.level,
                buildingId: pin.buildingNumber || pin.id,
                buildingPin: pin, // Store reference to the building pin
                type: 'room'
              });
            });
          }
        });
      }
    });
    return rooms;
  }, [pins]);

  const filteredPins = React.useMemo(() => getFilteredPins(pins, searchQuery), [pins, searchQuery]);
  const filteredRooms = React.useMemo(() => getFilteredRooms(allRooms, searchQuery), [allRooms, searchQuery]);

  // Combine pins and rooms for search results
  const searchResults = React.useMemo(() => 
    getSearchResults(filteredPins, filteredRooms, 2), 
    [filteredPins, filteredRooms]
  );

  // Track searches when user performs a search (has query and results)
  const lastTrackedSearchQuery = useRef('');
  useEffect(() => {
    const trackSearch = async () => {
      // Debug logging
      console.log('🔍 Search tracking check:', {
        isLoggedIn,
        hasAuthToken: !!authToken,
        hasCurrentUser: !!currentUser,
        searchQuery: searchQuery.trim(),
        searchResultsCount: searchResults.length,
        lastTracked: lastTrackedSearchQuery.current
      });

      // Track search if: has a search query, has results, and hasn't tracked this exact query yet
      if (searchQuery.trim() && searchResults.length > 0) {
        // Don't track the same search query multiple times
        if (searchQuery.trim() !== lastTrackedSearchQuery.current) {
          lastTrackedSearchQuery.current = searchQuery.trim();
          
          // Track for logged-in users (user-specific tracking)
          if (isLoggedIn && authToken && currentUser) {
            try {
              const currentCount = currentUser.activity?.searchCount || 0;
              const updatedSearchCount = currentCount + 1;
              console.log(`📊 Tracking search (logged-in): "${searchQuery.trim()}" - Count: ${currentCount} -> ${updatedSearchCount}`);
              
              await updateUserActivity(authToken, {
                searchCount: updatedSearchCount
              });
              
              console.log('✅ Search count updated successfully');
              
              // Refresh user data to get updated counts
              const updatedUser = await getCurrentUser(authToken);
              setCurrentUser(updatedUser);
              console.log('✅ User data refreshed, new searchCount:', updatedUser.activity?.searchCount);
            } catch (error) {
              console.error('❌ Error tracking search (logged-in):', error);
              console.error('Error details:', error.message, error.stack);
            }
          }
          
          // Track anonymously ONLY if NOT logged in (for analytics - no PII)
          // If logged in, user-specific tracking is already done above
          if (!isLoggedIn || !authToken) {
            try {
              // Get campus ID from currentCampus, or fallback to first pin's campus, or default to first campus
              let campusId = currentCampus?._id || currentCampus?.id || null;
              
              // Fallback: Get campus from first search result pin
              if (!campusId && searchResults.length > 0) {
                const firstPin = searchResults[0];
                campusId = firstPin.campusId?._id || firstPin.campusId?.id || firstPin.campusId || null;
              }
              
              // Fallback: Get campus from first available campus
              if (!campusId && campusesData.length > 0) {
                campusId = campusesData[0]._id || campusesData[0].id || null;
              }
              
              if (campusId) {
                await trackAnonymousSearch(campusId, searchQuery.trim(), searchResults.length);
                console.log('✅ Anonymous search tracked (user not logged in)');
              } else {
                console.log('⏭️  Skipping anonymous search tracking - no campus ID available');
              }
            } catch (error) {
              console.error('❌ Error tracking anonymous search:', error);
              // Don't show error - anonymous tracking failure shouldn't affect app
            }
          } else {
            console.log('⏭️  Skipping anonymous search tracking - user is logged in (using user-specific tracking)');
          }
        } else {
          console.log('⏭️  Skipping search tracking - already tracked this query');
        }
      } else {
        if (!searchQuery.trim()) {
          console.log('⏭️  Skipping search tracking - no search query');
        } else if (searchResults.length === 0) {
          console.log('⏭️  Skipping search tracking - no search results');
        }
      }
    };

    // Debounce search tracking (only track after user stops typing for 1 second)
    const timeoutId = setTimeout(trackSearch, 1000);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchResults.length, isLoggedIn, authToken, currentUser]);

  const handlePinPress = (pin) => {
    handlePinPressUtil(pin, setSelectedPin, setClickedPin, setHighlightedPinOnMap, {
      setSearchVisible,
      setCampusVisible,
      setFilterModalVisible,
      setShowPathfindingPanel,
      setSettingsVisible,
      setPinsModalVisible,
      setModalVisible
    });
  };

  const savePin = async () => {
    if (selectedPin) {
      // Check if user is logged in
      if (!isLoggedIn || !authToken) {
        Alert.alert(
          'Login Required',
          'You must be logged in to save pins. Please login to continue.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Login',
              onPress: () => {
                setModalVisible(false); // Close pin details modal
                setAuthModalVisible(true);
                setAuthTab('login');
              },
            },
          ]
        );
        return;
      }

      try {
        // Check if pin is already saved
        const isSaved = savedPins.some(p => p.id === selectedPin.id);
        let updatedSavedPins;
        
        if (!isSaved) {
          // Ensure selectedPin has all properties including image before saving
          const pinToSave = {
            ...selectedPin,
            image: selectedPin.image || null, // Preserve image property
          };
          
          // Add pin locally
          updatedSavedPins = [...savedPins, pinToSave];
          setSavedPins(updatedSavedPins);
          
          // Save to AsyncStorage (for offline/guest mode)
          await addSavedPin(pinToSave);
          
          // Sync with database if logged in
          if (isLoggedIn && authToken) {
            try {
              await updateUserActivity(authToken, {
                savedPins: updatedSavedPins,
              });
              // Update current user data
              const updatedUser = await getCurrentUser(authToken);
              setCurrentUser(updatedUser);
              // Ensure saved pins have image property from full pins array
              if (updatedUser.activity && updatedUser.activity.savedPins && pins && pins.length > 0) {
                const enrichedSavedPins = updatedUser.activity.savedPins.map(savedPin => {
                  const fullPin = pins.find(p => p.id === savedPin.id);
                  if (fullPin) {
                    // Merge: prioritize savedPin (database) properties, but use fullPin for missing ones
                    return {
                      ...fullPin,
                      ...savedPin, // Database values take priority (description, name, etc.)
                      image: savedPin.image || fullPin.image, // Use savedPin image if available, else fullPin
                    };
                  }
                  return savedPin; // Use savedPin as-is if no fullPin found
                });
                setSavedPins(enrichedSavedPins);
              }
            } catch (error) {
              console.error('Error syncing saved pin to database:', error);
              // Continue with local save even if database sync fails
            }
          }
          
          Alert.alert('Success', 'Pin saved successfully!');
        } else {
          // Remove pin locally
          updatedSavedPins = savedPins.filter(p => p.id !== selectedPin.id);
          setSavedPins(updatedSavedPins);
          
          // Remove from AsyncStorage
          await removeSavedPin(selectedPin.id);
          
          // Sync with database if logged in
          if (isLoggedIn && authToken) {
            try {
              await updateUserActivity(authToken, {
                savedPins: updatedSavedPins,
              });
              // Update current user data
              const updatedUser = await getCurrentUser(authToken);
              setCurrentUser(updatedUser);
            } catch (error) {
              console.error('Error syncing saved pin removal to database:', error);
              // Continue with local save even if database sync fails
            }
          }
          
          Alert.alert('Success', 'Pin removed from saved pins');
        }
      } catch (error) {
        console.error('Error saving pin:', error);
        Alert.alert('Error', 'Failed to save pin. Please try again.');
      }
    }
  };

  const handleCampusChange = (campus) => {
    handleCampusChangeUtil(setCampusVisible, campus, setCurrentCampus, campusesData);
    // Reset image load error when campus changes
    setMapImageLoadError(false);
  };

  // Handle profile picture upload (Direct Upload to Cloudinary)
  const handleProfilePictureUpload = async (imageUri) => {
    try {
      if (!isLoggedIn || !authToken) {
        Alert.alert('Error', 'Please login to change your profile picture');
        return;
      }

      // Show uploading status (we'll show success/error after)
      // Upload directly to Cloudinary (bypasses Express server)
      const uploadResult = await uploadToCloudinaryDirect(
        imageUri,
        CLOUDINARY_CONFIG.cloudName,
        CLOUDINARY_CONFIG.uploadPreset
      );

      // Use secure_url for MongoDB storage (we'll apply transformations on display)
      const newProfilePicture = uploadResult.secure_url;

      // Update local state immediately
      setUserProfile({
        ...userProfile,
        profilePicture: newProfilePicture,
      });

      // Update database via API (save only the URL, not transformations)
      await updateUserProfile(authToken, {
        profilePicture: newProfilePicture,
      });
      
      // Update current user data to reflect changes
      const updatedUser = await getCurrentUser(authToken);
      setCurrentUser(updatedUser);
      
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error('Profile picture upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload profile picture. Please check your Cloudinary upload preset configuration.');
    }
  };


  const toggleFilterModal = () => {
    setFilterModalVisible(!isFilterModalVisible);
    if (!isFilterModalVisible) {
      // Close other modals when opening filter
      setSearchVisible(false);
      setCampusVisible(false);
      setShowPathfindingPanel(false);
      setSettingsVisible(false);
      setPinsModalVisible(false);
      setModalVisible(false);
    }
  };


  const selectAllCategories = () => {
    const obj = {};
    allCategoryKeys.forEach(k => obj[k] = true);
    setSelectedCategories(obj);
  };

  const clearAllCategories = () => setSelectedCategories({});

  const toggleCategory = (cat) => {
    setSelectedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleSearch = () => {
    setSearchVisible(!isSearchVisible);
    if (!isSearchVisible) {
      // Close other modals when opening search
      setCampusVisible(false);
      setFilterModalVisible(false);
      setShowPathfindingPanel(false);
      setSettingsVisible(false);
      setPinsModalVisible(false);
      setModalVisible(false);
    }
  };
  
  const toggleCampus = () => {
    setCampusVisible(!isCampusVisible);
    if (!isCampusVisible) {
      // Close other modals when opening campus
      setSearchVisible(false);
      setFilterModalVisible(false);
      setShowPathfindingPanel(false);
      setSettingsVisible(false);
      setPinsModalVisible(false);
      setModalVisible(false);
    }
  };
  
  const togglePinsModal = () => {
    setPinsModalVisible(!isPinsModalVisible);
    // Clear search query when closing modal
    if (isPinsModalVisible) {
      setPinsModalSearchQuery('');
    }
    if (!isPinsModalVisible) {
      // Close other modals when opening pins modal
      setSearchVisible(false);
      setCampusVisible(false);
      setFilterModalVisible(false);
      setShowPathfindingPanel(false);
      setSettingsVisible(false);
      setModalVisible(false);
      setAuthModalVisible(false);
      // Clear activeSelector when opening normally (not from pathfinding)
      setActiveSelector(null);
    } else {
      // Clear activeSelector when closing
      setActiveSelector(null);
    }
  };

  const toggleAuthModal = () => {
    // If logged in, show User Profile instead of Auth Modal
    if (isLoggedIn && !isAuthModalVisible) {
      setUserProfileVisible(true);
      return;
    }
    // If not logged in or explicitly opening auth modal, show auth screen
    setAuthModalVisible(!isAuthModalVisible);
    if (!isAuthModalVisible) {
      // Close other modals when opening auth modal
      setSearchVisible(false);
      setCampusVisible(false);
      setFilterModalVisible(false);
      setShowPathfindingPanel(false);
      setSettingsVisible(false);
      setModalVisible(false);
      setPinsModalVisible(false);
      setUserProfileVisible(false);
      setAuthTab('login'); // Reset to login tab when opening
    }
  };

  // Force show auth modal (for logout scenarios)
  const forceShowAuthModal = () => {
    setAuthModalVisible(true);
    setUserProfileVisible(false);
    setAuthTab('login');
  };

  // Validation helper functions
  const validateUsername = (username) => {
    if (!username || username.length < 3) {
      return 'Username must be at least 3 characters';
    }
    return null;
  };

  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    // Check for capital letter
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one capital letter';
    }
    // Check for symbol (non-alphanumeric character)
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return 'Password must contain at least one symbol';
    }
    return null;
  };


  const resetPathfinding = () => {
    setPathfindingMode(false);
    setShowPathfindingPanel(false);
    setPointA(null);
    setPointB(null);
    setPath([]);
    // Clear highlighted pin when resetting pathfinding
    setHighlightedPinOnMap(null);
  };

  const handleStartPathfinding = async () => {
    if (!pointA || !pointB) {
      setAlertMessage('Please select both start and end points');
      setShowAlertModal(true);
      return;
    }

    // Force strict equality check to avoid self-selection issues
    if (pointA.id == pointB.id) {
      setAlertMessage('Start and end points cannot be the same');
      setShowAlertModal(true);
      return;
    }

    setTimeout(async () => {
      try {
        // Pass all pins (including invisible waypoints) to pathfinding algorithm
        const foundPath = aStarPathfinding(pointA.id, pointB.id, pins);
        
        if (foundPath.length > 0) {
          // DEBUGGING: Show path length in console (comment out for production)
          console.log(`Path found with ${foundPath.length} steps:`, foundPath.map(p => p.id));
          
          setPath(foundPath);
          setPathfindingMode(true);
          setShowPathfindingPanel(false);
          
          // Track pathfinding for logged-in users (user-specific tracking)
          if (isLoggedIn && authToken && currentUser) {
            try {
              const currentCount = currentUser.activity?.pathfindingCount || 0;
              const updatedPathfindingCount = currentCount + 1;
              console.log(`🗺️  Tracking pathfinding (logged-in): Count ${currentCount} -> ${updatedPathfindingCount}`);
              
              await updateUserActivity(authToken, {
                pathfindingCount: updatedPathfindingCount
              });
              
              console.log('✅ Pathfinding count updated successfully');
              
              // Refresh user data to get updated counts
              const updatedUser = await getCurrentUser(authToken);
              setCurrentUser(updatedUser);
              console.log('✅ User data refreshed, new pathfindingCount:', updatedUser.activity?.pathfindingCount);
            } catch (error) {
              console.error('❌ Error tracking pathfinding (logged-in):', error);
              console.error('Error details:', error.message, error.stack);
            }
          }
          
          // Track anonymously ONLY if NOT logged in (for analytics - no PII)
          // If logged in, user-specific tracking is already done above
          if (!isLoggedIn || !authToken) {
            try {
              // Get campus ID from currentCampus, or fallback to pin's campus, or default to first campus
              let campusId = currentCampus?._id || currentCampus?.id || null;
              
              // Fallback: Get campus from pointA or pointB pin
              if (!campusId && pointA) {
                const startPin = pins.find(p => (p.id || p._id) == pointA.id);
                campusId = startPin?.campusId?._id || startPin?.campusId?.id || startPin?.campusId || null;
              }
              
              if (!campusId && pointB) {
                const endPin = pins.find(p => (p.id || p._id) == pointB.id);
                campusId = endPin?.campusId?._id || endPin?.campusId?.id || endPin?.campusId || null;
              }
              
              // Fallback: Get campus from first available campus
              if (!campusId && campusesData.length > 0) {
                campusId = campusesData[0]._id || campusesData[0].id || null;
              }
              
              if (campusId && pointA && pointB) {
                // Find full pin data for start and end points
                const startPin = pins.find(p => (p.id || p._id) == pointA.id);
                const endPin = pins.find(p => (p.id || p._id) == pointB.id);
                
                await trackAnonymousPathfinding(
                  campusId,
                  {
                    pinId: pointA.id,
                    title: startPin?.title || pointA.title || '',
                    description: startPin?.description || pointA.description || ''
                  },
                  {
                    pinId: pointB.id,
                    title: endPin?.title || pointB.title || '',
                    description: endPin?.description || pointB.description || ''
                  },
                  foundPath.length
                );
                console.log(`✅ Anonymous pathfinding tracked (user not logged in): ${pointA.id} -> ${pointB.id} (${foundPath.length} steps)`);
              } else {
                if (!campusId) {
                  console.log('⏭️  Skipping anonymous pathfinding tracking - no campus ID available');
                } else {
                  console.log('⏭️  Skipping anonymous pathfinding tracking - missing point data');
                }
              }
            } catch (error) {
              console.error('❌ Error tracking anonymous pathfinding:', error);
              // Don't show error - anonymous tracking failure shouldn't affect app
            }
          } else {
            console.log('⏭️  Skipping anonymous pathfinding tracking - user is logged in (using user-specific tracking)');
          }
          // No alert on success - path is shown on map
        } else {
          Alert.alert('Pathfinding Error', 'No path found.');
        }
      } catch (error) {
        console.error(error);
        setAlertMessage('Error calculating path');
        setShowAlertModal(true);
      }
    }, 0);
  };

  const swapPoints = () => {
    const temp = pointA;
    setPointA(pointB);
    setPointB(temp);
  };

  const openLocationPicker = (selector) => {
    setActiveSelector(selector);
    // Close other modals when opening location picker
    setSearchVisible(false);
    setCampusVisible(false);
    setFilterModalVisible(false);
    setSettingsVisible(false);
    setModalVisible(false);
    setPinsModalVisible(false);
    // Open Pin Selector Modal for location selection
    setPinSelectorModalVisible(true);
  };

  // Calculate image dimensions
  const imageWidth = width * 1.5; 
  const imageHeight = (imageWidth * 1310) / 1920; 

  // Compute pins visible after applying category filters
  // Always include pathfinding active pins (pointA and pointB) even if filtered out
  // Exclude invisible waypoints from display (they're still in pins array for pathfinding)
  const visiblePinsForRender = pins.filter(pin => {
    // Exclude invisible waypoints from display
    if (pin.isInvisible === true) {
      return false;
    }
    // Always show pathfinding active pins
    if ((pointA && pin.id === pointA.id) || (pointB && pin.id === pointB.id)) {
      return true;
    }
    // Apply category filter for other pins
    return pinMatchesSelected(pin, selectedCategories);
  });

  // Helper function to get category for a pin (for View All Pins modal)
  // Organize pins by category for View All Pins modal
  // Filter to show only: Entrance, Buildings, Amenities
  const categorizedPins = React.useMemo(() => {
    if (!pins || pins.length === 0) return [];
    const allCategorized = getCategorizedPins(pins);
    
    // Filter to only show: Entrance (Main Entrance), Buildings, Amenities
    const allowedCategories = ['Main Entrance', 'Buildings', 'Amenities'];
    const filtered = allCategorized.filter(cat => allowedCategories.includes(cat.title));
    
    // Apply search filter if search query exists
    if (pinsModalSearchQuery.trim()) {
      const query = pinsModalSearchQuery.toLowerCase().trim();
      return filtered.map(category => ({
        ...category,
        pins: category.pins.filter(pin => {
          const title = (pin.title || '').toLowerCase();
          const description = (pin.description || '').toLowerCase();
          return title.includes(query) || description.includes(query);
        })
      })).filter(category => category.pins.length > 0); // Remove empty categories
    }
    
    return filtered;
  }, [pins, pinsModalSearchQuery]);

  return (
    <View style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        {/* QR Scanner button (left) to keep center button centered */}
        <TouchableOpacity 
          style={styles.headerButtonLeft} 
          onPress={async () => {
            // Check if BarCodeScanner is available (requires development build)
            if (!BarCodeScanner) {
              Alert.alert(
                'QR Scanner Not Available',
                'QR code scanning requires a development build.\n\nTo enable QR scanning:\n1. Run: npx expo prebuild\n2. Run: npx expo run:android\n\nOr use deep links: campustrails://pin/123',
                [{ text: 'OK' }]
              );
              return;
            }
            
            try {
              if (hasPermission === null) {
                try {
                  const { status } = await BarCodeScanner.requestPermissionsAsync();
                  setHasPermission(status === 'granted');
                  if (status === 'granted') {
                    setQrScannerVisible(true);
                    setScanned(false);
                  } else {
                    Alert.alert('Permission Needed', 'Camera permission is required to scan QR codes.');
                  }
                } catch (error) {
                  console.error('Error requesting camera permission:', error);
                  Alert.alert(
                    'QR Scanner Not Available',
                    'QR code scanning requires a development build. Please build the app using:\n\nnpx expo prebuild\nnpx expo run:android\n\nOr use deep links instead: campustrails://pin/123'
                  );
                }
                return;
              }
              if (hasPermission === false) {
                Alert.alert('Permission Denied', 'Please enable camera permission in settings to scan QR codes.');
                return;
              }
              setQrScannerVisible(true);
              setScanned(false);
            } catch (error) {
              console.error('Error opening QR scanner:', error);
              Alert.alert(
                'QR Scanner Not Available',
                'QR code scanning requires a development build. Please build the app using:\n\nnpx expo prebuild\nnpx expo run:android\n\nOr use deep links instead: campustrails://pin/123'
              );
            }
          }}
        >
          <Icon name="qrcode" size={20} color="white" />
        </TouchableOpacity>

        {/* Change Campus Button (Center) */}
        <TouchableOpacity style={styles.headerButtonCenter} onPress={toggleCampus}>
          <Icon name="exchange" size={20} color="white" />
          <Text 
            style={styles.buttonText}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.7}
          >
            {currentCampus?.name || 'USTP-CDO'}
          </Text>
        </TouchableOpacity>

        {/* Search Button (Right) */}
        <TouchableOpacity style={styles.headerButtonRight} onPress={toggleSearch}>
          <Icon name={isSearchVisible ? "times" : "search"} size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Filter Button (moved) - sits between Search and Pathfinding */}
      <TouchableOpacity style={styles.filterButtonBetween} onPress={toggleFilterModal}>
        <Icon name={Object.values(selectedCategories).some(val => val === true) ? "times" : "filter"} size={20} color="white" />
      </TouchableOpacity>

      {/* Pathfinding Toggle Button - Now positioned below Search button with same design */}
      <TouchableOpacity 
        style={styles.pathfindingButtonBelowSearch}
        onPress={() => {
          if (showPathfindingPanel || pathfindingMode) {
            resetPathfinding();
          } else {
            // Close other modals when opening pathfinding panel
            setSearchVisible(false);
            setCampusVisible(false);
            setFilterModalVisible(false);
            setSettingsVisible(false);
            setPinsModalVisible(false);
            setModalVisible(false);
            setShowPathfindingPanel(true);
            setPathfindingMode(false);
            setPath([]);
          }
        }}
      >
        <Icon name={(showPathfindingPanel || pathfindingMode) ? "times" : "location-arrow"} size={20} color="white" />
      </TouchableOpacity>

      {/* Bottom Pathfinding Navigation Card */}
      {pathfindingPanelRendered && (
        <Animated.View 
          style={[
            styles.bottomNavCard, 
            { 
              transform: [{ translateY: pathfindingSlideAnim }],
              opacity: pathfindingSlideAnim.interpolate({
                inputRange: [0, 150, 300],
                outputRange: [1, 0.5, 0],
              }),
            }
          ]}
        >
          {/* Header */}
          <Pressable style={styles.modalHeaderWhite} onPress={resetPathfinding}>
            <Text style={[styles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>Navigation</Text>
          </Pressable>
          <View style={styles.lineDark}></View>
          
          {/* Content */}
          <View style={{ backgroundColor: '#f5f5f5', padding: 20 }}>
          {/* Origin/Destination Display */}
          <View style={styles.locationRow}>
            <TouchableOpacity 
              style={styles.locationItem}
              onPress={() => openLocationPicker('A')}
            >
                <View style={[
                  styles.locationIconContainer,
                  {
                    backgroundColor: pointA && (showPathfindingPanel || pathfindingMode) 
                      ? interpolateBlueColorWrapper(pointAValue) 
                      : `rgb(${pointAColorDark.r}, ${pointAColorDark.g}, ${pointAColorDark.b})`
                  }
                ]}>
                  <Icon 
                    name="crosshairs" 
                    size={18} 
                    color="#ffffff" 
                  />
              </View>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Your place (Start)</Text>
                <Text style={styles.locationValue}>
                  {pointA ? pointA.description : 'Tap to select location...'}
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.swapButtonSmall} onPress={swapPoints}>
              <Icon name="exchange" size={18} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.locationRow}>
            <TouchableOpacity 
              style={styles.locationItem}
              onPress={() => openLocationPicker('B')}
            >
                <View style={[
                  styles.locationIconContainer,
                  {
                    backgroundColor: pointB && (showPathfindingPanel || pathfindingMode) 
                      ? interpolateRedColorWrapper(pointBValue) 
                      : `rgb(${pointBColorDark.r}, ${pointBColorDark.g}, ${pointBColorDark.b})`
                  }
                ]}>
                  <Icon 
                    name="map-marker" 
                    size={18} 
                    color="#ffffff" 
                  />
              </View>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Destination</Text>
                <Text style={styles.locationValue} numberOfLines={1}>
                  {pointB ? pointB.description : 'Tap to select destination...'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Go Now Button */}
          <TouchableOpacity 
            style={[styles.goNowButton, (!pointA || !pointB) && styles.goNowButtonDisabled]} 
            onPress={handleStartPathfinding}
            disabled={!pointA || !pointB}
          >
            <Icon name="paper-plane" size={20} color="white" style={{ marginRight: 8 }} />
            <Text 
              style={styles.goNowButtonText}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.7}
            >
              Go Now
            </Text>
          </TouchableOpacity>
        </View>
        </Animated.View>
      )}

      {/* Map with Zoom */}
      <View style={styles.imageContainer}>
        <ImageZoom
          key={imageZoomKey}
          ref={imageZoomRef}
          cropWidth={width}
          cropHeight={height}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          minScale={1}
          maxScale={3}
          enableCentering={false}
          cropOffset={0}
          onScaleChanged={(scale) => {
            setZoomScale(scale);
            // Clear zoom target when user manually changes zoom
            if (zoomToPin && Math.abs(scale - zoomToPin.zoom) > 0.2) {
              setZoomToPin(null);
            }
          }}
        >
          <View style={{ width: imageWidth, height: imageHeight }}>
            {(() => {
              // For USTP-CDO, use local image as fallback when:
              // 1. No mapImageUrl is available
              // 2. Image failed to load (no internet, no cache)
              const isUSTPCDO = currentCampus?.name === 'USTP-CDO';
              const shouldUseLocal = isUSTPCDO && (!currentCampus?.mapImageUrl || mapImageLoadError);
              
              if (shouldUseLocal) {
                return (
                  <Image
                    source={require('./assets/ustp-cdo-map.png')}
                    style={{ width: imageWidth, height: imageHeight }}
                    resizeMode="contain"
                  />
                );
              }
              
              // Try Cloudinary URL first (for USTP-CDO with mapImageUrl, or other campuses)
              if (currentCampus?.mapImageUrl) {
                return (
                  <ExpoImage
                    source={{ uri: currentCampus.mapImageUrl }}
                    style={{ width: imageWidth, height: imageHeight }}
                    contentFit="contain"
                    cachePolicy="disk"
                    priority="high"
                    onError={() => {
                      // If image fails to load and it's USTP-CDO, fallback to local image
                      if (currentCampus?.name === 'USTP-CDO') {
                        setMapImageLoadError(true);
                      }
                    }}
                  />
                );
              }
              
              // Fallback to local image if no mapImageUrl
              return (
                <Image
                  source={require('./assets/ustp-cdo-map.png')}
                  style={{ width: imageWidth, height: imageHeight }}
                  resizeMode="contain"
                />
              );
            })()}
            {/* Overlay SVG for Pins and Path */}
            <Svg 
              height={imageHeight} 
              width={imageWidth} 
              viewBox="0 0 1920 1310"
              style={StyleSheet.absoluteFill}
            >
              {/* Draw pathfinding path if exists */}
              {path.length > 0 && (
                <Polyline
                  points={path.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#E63946" // Shade of red
                  strokeWidth={Math.max(3, 12 / zoomScale)} 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={
                    pathLineStyle === 'dash' 
                      ? `${Math.max(8, 20 / zoomScale)} ${Math.max(12, 30 / zoomScale)}` 
                      : pathLineStyle === 'dot' 
                        ? `0 ${Math.max(16, 32 / zoomScale)}` 
                        : undefined
                  }
                  strokeDashoffset={pathLineStyle === 'dot' ? Math.max(8, 16 / zoomScale) : undefined}
                  opacity="1"
                />
              )}
              
              {visiblePinsForRender.map((pin, index) => {
                // HIDE INVISIBLE WAYPOINTS
                // We don't render the circle or text, but they are still used for the path line
                if (pin.isInvisible) return null;
                
                // Use _id if available (from database), otherwise use id with index for uniqueness
                // Always include index to ensure uniqueness even if multiple pins have same id
                const uniqueKey = pin._id ? `${pin._id.toString()}-${index}` : `pin-${pin.id}-${index}`;
                
                // Determine pin color based on state
                let fillColor = "#f0f0f0"; // Default light gray
                let strokeColor = "#4a4a4a"; // Medium gray outline
                let strokeWidth = 2.5;
                let radius = 20 / zoomScale;
                let isActive = false; // Track if pin is active for pulsing animation
                
                // Check if pin is highlighted on map (from "Show on Map" button)
                if (highlightedPinOnMap === pin.id) {
                  radius = 24 / zoomScale;
                  strokeWidth = 3;
                  isActive = true;
                }
                // Check if pin is clicked/selected
                else if (clickedPin === pin.id) {
                  radius = 24 / zoomScale;
                  strokeWidth = 3;
                  isActive = true;
                }
                // Check if pin is in pathfinding mode
                else if (showPathfindingPanel || pathfindingMode) {
                  if (pointA && pin.id === pointA.id) {
                    radius = 24 / zoomScale;
                    strokeWidth = 3;
                    isActive = true;
                    // Use red shades for pointA (static color, no animation)
                    fillColor = `rgb(${pointAColorLight.r}, ${pointAColorLight.g}, ${pointAColorLight.b})`;
                    const colorMatch = fillColor.match(/\d+/g);
                    if (colorMatch && colorMatch.length >= 3) {
                      const r = Math.max(0, Math.round(parseInt(colorMatch[0]) - 20));
                      const g = Math.max(0, Math.round(parseInt(colorMatch[1]) - 20));
                      const b = Math.max(0, Math.round(parseInt(colorMatch[2]) - 20));
                      strokeColor = `rgb(${r}, ${g}, ${b})`;
                    } else {
                      strokeColor = `rgb(${Math.max(0, pointAColorDark.r - 20)}, ${Math.max(0, pointAColorDark.g - 20)}, ${Math.max(0, pointAColorDark.b - 20)})`; // Fallback dark red
                    }
                  } else if (pointB && pin.id === pointB.id) {
                    radius = 24 / zoomScale;
                    strokeWidth = 3;
                    isActive = true;
                    // Use red shades for pointB (static color, no animation)
                    fillColor = `rgb(${pointBColorLight.r}, ${pointBColorLight.g}, ${pointBColorLight.b})`;
                    const colorMatch = fillColor.match(/\d+/g);
                    if (colorMatch && colorMatch.length >= 3) {
                      const r = Math.max(0, Math.round(parseInt(colorMatch[0]) - 20));
                      const g = Math.max(0, Math.round(parseInt(colorMatch[1]) - 20));
                      const b = Math.max(0, Math.round(parseInt(colorMatch[2]) - 20));
                      strokeColor = `rgb(${r}, ${g}, ${b})`;
                    } else {
                      strokeColor = `rgb(${Math.max(0, pointBColorDark.r - 20)}, ${Math.max(0, pointBColorDark.g - 20)}, ${Math.max(0, pointBColorDark.b - 20)})`; // Fallback dark red
                    }
                  } else if (path.some(p => p.id === pin.id)) {
                    fillColor = "#FFD700"; // Golden yellow for path waypoints
                    strokeColor = "#FFA500";
                    strokeWidth = 2.5;
                  }
                }
                
                // Apply breathing color animation for active pins (sky blue to blue) - only for non-pathfinding active pins
                // Note: pointA and pointB colors are already set above in pathfinding mode
                if (isActive && !(showPathfindingPanel || pathfindingMode)) {
                  fillColor = interpolateColorWrapper(colorBreathValue);
                  // Stroke color slightly darker than fill for better contrast
                  const colorMatch = fillColor.match(/\d+/g);
                  if (colorMatch && colorMatch.length >= 3) {
                    const r = Math.max(0, Math.round(parseInt(colorMatch[0]) - 20));
                    const g = Math.max(0, Math.round(parseInt(colorMatch[1]) - 20));
                    const b = Math.max(0, Math.round(parseInt(colorMatch[2]) - 20));
                    strokeColor = `rgb(${r}, ${g}, ${b})`;
                  } else {
                    strokeColor = "#0099CC"; // Fallback
                  }
                }
                
                // Calculate subtle pulsing radius for active pins (breathing effect) - skip for pathfinding pins
                let pulseValue = 0;
                let shouldPulse = false;
                if (isActive && !(showPathfindingPanel || pathfindingMode)) {
                  // Only pulse for non-pathfinding active pins
                  pulseValue = colorBreathValue;
                  shouldPulse = true;
                }
                const pulseRadius = shouldPulse ? radius + (Math.abs(Math.sin(pulseValue * Math.PI * 2)) * 8 / zoomScale) : 0;
                const pulseOpacity = shouldPulse ? Math.abs(Math.sin(pulseValue * Math.PI * 2)) * 0.3 : 0;
                
                // Calculate touch area radius (larger for better touch detection on Samsung)
                const touchRadius = Math.max(radius + 8, 28 / zoomScale);
                
                return (
                  <G 
                    key={uniqueKey} 
                    onPress={() => handlePinPress(pin)}
                    onPressIn={() => handlePinPress(pin)}
                  >
                    {/* Invisible larger circle for better touch detection (especially on Samsung) */}
                    <Circle
                      cx={pin.x}
                      cy={pin.y}
                      r={touchRadius}
                      fill="transparent"
                      stroke="transparent"
                      strokeWidth={0}
                      onPress={() => handlePinPress(pin)}
                      onPressIn={() => handlePinPress(pin)}
                    />
                    {/* Pulsing circle behind active pins - only for non-pathfinding pins */}
                    {shouldPulse && pulseRadius > 0 && (
                      <Circle
                        cx={pin.x}
                        cy={pin.y}
                        r={pulseRadius}
                        fill={fillColor}
                        opacity={pulseOpacity}
                      />
                    )}
                    {/* Pin Circle */}
                    <Circle
                      cx={pin.x}
                      cy={pin.y}
                      r={radius}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth / zoomScale}
                    />
                    {/* Building Number Text */}
                    <SvgText
                      x={pin.x}
                      y={pin.y + (4 / zoomScale)}
                      fill={fillColor === "#f0f0f0" || fillColor === "#ffffff" ? "#000000" : "#ffffff"}
                      fontSize={Math.max(13, 15 / zoomScale)}
                      fontWeight="bold"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                    >
                      {pin.title}
                    </SvgText>
                  </G>
                );
              })}
              
            </Svg>
            
            {/* TouchableOpacity overlays for better touch detection on Samsung devices */}
            {visiblePinsForRender.map((pin, index) => {
              // Skip invisible waypoints
              if (pin.isInvisible) return null;
              
              // Calculate touch area size (larger for better detection)
              const touchSize = Math.max(40, 56 / zoomScale);
              const pinRadius = Math.max(20, 24 / zoomScale);
              
              // Use _id if available (from database), otherwise use id with index for uniqueness
              // Always include index to ensure uniqueness even if multiple pins have same id
              const uniqueKey = pin._id ? `touch-${pin._id}-${index}` : `touch-${pin.id}-${index}`;
              
              return (
                <TouchableOpacity
                  key={uniqueKey}
                  style={{
                    position: 'absolute',
                    left: pin.x - touchSize / 2,
                    top: pin.y - touchSize / 2,
                    width: touchSize,
                    height: touchSize,
                    borderRadius: touchSize / 2,
                    backgroundColor: 'transparent',
                    // Ensure touch events work on Samsung
                    zIndex: 10,
                  }}
                  activeOpacity={0.7}
                  onPress={() => handlePinPress(pin)}
                  // Prevent conflicts with ImageZoom pan gestures
                  delayPressIn={0}
                  delayPressOut={0}
                />
              );
            })}
            
            {/* Pathfinding Point A and Point B Images - Outside SVG for better compatibility */}
            {pathfindingMode && path.length > 0 && (() => {
              const pointAPin = pointA ? visiblePinsForRender.find(p => p.id === pointA.id && !p.isInvisible) : null;
              const pointBPin = pointB ? visiblePinsForRender.find(p => p.id === pointB.id && !p.isInvisible) : null;
              
              // Convert SVG coordinates (viewBox "0 0 1920 1310") to actual image pixel space
              const svgViewBoxWidth = 1920;
              const svgViewBoxHeight = 1310;
              const scaleX = imageWidth / svgViewBoxWidth;
              const scaleY = imageHeight / svgViewBoxHeight;
              
              const imageSize = 45; // Base size in pixels
              const imageOffsetY = 55; // Offset above pin in pixels (increased to move images higher)
              
              // Calculate animated translateY for up-down movement (10 pixels range)
              const translateYRange = 10;
              const pointATranslateY = pointAAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, translateYRange],
              });
              const pointBTranslateY = pointBAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, translateYRange],
              });
              
              return (
                <>
                  {pointAPin && (
                    <Animated.Image
                      source={require('./assets/you-are-here.png')}
                      style={{
                        position: 'absolute',
                        left: (pointAPin.x * scaleX) - imageSize / 2,
                        top: (pointAPin.y * scaleY) - imageOffsetY,
                        width: imageSize,
                        height: imageSize,
                        zIndex: 100,
                        transform: [{ translateY: pointATranslateY }],
                      }}
                      resizeMode="contain"
                    />
                  )}
                  {pointBPin && (
                    <Animated.Image
                      source={require('./assets/destination.png')}
                      style={{
                        position: 'absolute',
                        left: (pointBPin.x * scaleX) - imageSize / 2,
                        top: (pointBPin.y * scaleY) - imageOffsetY,
                        width: imageSize,
                        height: imageSize,
                        zIndex: 100,
                        elevation: 100, // For Android
                        transform: [{ translateY: pointBTranslateY }],
                      }}
                      resizeMode="contain"
                    />
                  )}
                </>
              );
            })()}
          </View>
        </ImageZoom>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.footerButton} 
          onPress={() => {
            // Close other modals when opening settings
            setSearchVisible(false);
            setCampusVisible(false);
            setFilterModalVisible(false);
            setShowPathfindingPanel(false);
            setPinsModalVisible(false);
            setModalVisible(false);
            setSettingsVisible(true);
          }}>
          <Icon name="cog" size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.middleFooterButton} onPress={togglePinsModal}>
          <Icon name="list" size={20} color="white" />
          <Text 
            style={styles.buttonText}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.7}
          >
            View All Pins
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.footerButton} 
          onPress={() => {
            if (isLoggedIn) {
              // If logged in, show User Profile modal
              setUserProfileVisible(true);
            } else {
              // If not logged in, show Auth Modal
              toggleAuthModal();
            }
          }}
        >
          <Icon name="user" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* --- MODALS --- */}

      {/* Settings Modal */}
      <Modal
        visible={settingsRendered}
        transparent={true}
        animationType="none"
        onRequestClose={() => setSettingsVisible(false)}
      >
        {settingsRendered && (
          <Animated.View 
            style={[
              StyleSheet.absoluteFill,
              styles.settingsScreen,
              {
                transform: [{ translateY: settingsSlideAnim }],
              }
            ]}
          >
          <View style={styles.modalHeaderWhite}>
            <Text style={[styles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>Settings</Text>
          </View>
          <View style={styles.lineDark}></View>

          <View style={[styles.settingsTabRow, { backgroundColor: 'white', paddingHorizontal: 20, paddingBottom: 10 }]}>
            <TouchableOpacity onPress={() => setSettingsTab('general')} style={[styles.settingsTabButton, settingsTab === 'general' && styles.settingsTabActive, { flex: 1 }]}>
              <Text style={settingsTab === 'general' ? styles.settingsTabActiveText : { color: '#333' }}>General</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSettingsTab('about'); fadeAnim.setValue(0); }} style={[styles.settingsTabButton, settingsTab === 'about' && styles.settingsTabActive, { flex: 1 }]}>
              <Text style={settingsTab === 'about' ? styles.settingsTabActiveText : { color: '#333' }}>About Us</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSettingsTab('help'); fadeAnim.setValue(0); }} style={[styles.settingsTabButton, settingsTab === 'help' && styles.settingsTabActive, { flex: 1 }]}>
              <Text style={settingsTab === 'help' ? styles.settingsTabActiveText : { color: '#333' }}>Help</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.lineDark}></View>

          <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            {settingsTab === 'general' && (
              <Animated.ScrollView style={[styles.aboutContent, { opacity: fadeAnim }]}>
                {/* Pathfinding Category */}
                <View style={styles.settingsCategoryContainer}>
                  <Text style={styles.settingsCategoryTitle}>Pathfinding</Text>
                  
                  {/* Point A Color Picker */}
                  <View style={styles.settingItem}>
                  <View style={styles.settingItemContent}>
                    <Text style={styles.settingLabel}>Start Point Color (Point A)</Text>
                    <Text style={styles.settingDescription}>Select light and dark shades for the start point</Text>
                  </View>
                </View>
                <View style={[styles.colorPickerContainer, { marginTop: 15 }]}>
                  <View style={styles.colorPickerRow}>
                    <Text style={styles.colorPickerLabel}>Light:</Text>
                    <View style={styles.colorSwatchesContainer}>
                      {[
                        { r: 239, g: 83, b: 80, name: 'Red' },
                        { r: 255, g: 112, b: 67, name: 'Deep Orange' },
                        { r: 255, g: 152, b: 0, name: 'Amber' },
                        { r: 233, g: 30, b: 99, name: 'Pink' },
                        { r: 156, g: 39, b: 176, name: 'Purple' },
                        { r: 244, g: 67, b: 54, name: 'Light Red' },
                      ].map((color, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.colorSwatch,
                            {
                              backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                              borderWidth: pointAColorLight.r === color.r && pointAColorLight.g === color.g && pointAColorLight.b === color.b ? 3 : 1,
                              borderColor: pointAColorLight.r === color.r && pointAColorLight.g === color.g && pointAColorLight.b === color.b ? '#28a745' : '#ccc',
                            }
                          ]}
                          onPress={() => setPointAColorLight(color)}
                        />
                      ))}
                    </View>
                  </View>
                  <View style={styles.colorPickerRow}>
                    <Text style={styles.colorPickerLabel}>Dark:</Text>
                    <View style={styles.colorSwatchesContainer}>
                      {[
                        { r: 198, g: 40, b: 40, name: 'Red' },
                        { r: 244, g: 67, b: 54, name: 'Deep Red' },
                        { r: 211, g: 47, b: 47, name: 'Dark Red' },
                        { r: 194, g: 24, b: 91, name: 'Pink' },
                        { r: 123, g: 31, b: 162, name: 'Purple' },
                        { r: 183, g: 28, b: 28, name: 'Light Red' },
                      ].map((color, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.colorSwatch,
                            {
                              backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                              borderWidth: pointAColorDark.r === color.r && pointAColorDark.g === color.g && pointAColorDark.b === color.b ? 3 : 1,
                              borderColor: pointAColorDark.r === color.r && pointAColorDark.g === color.g && pointAColorDark.b === color.b ? '#28a745' : '#ccc',
                            }
                          ]}
                          onPress={() => setPointAColorDark(color)}
                        />
                      ))}
                    </View>
                  </View>
                </View>

                  {/* Point B Color Picker */}
                  <View style={styles.settingItem}>
                  <View style={styles.settingItemContent}>
                    <Text style={styles.settingLabel}>Destination Color (Point B)</Text>
                    <Text style={styles.settingDescription}>Select light and dark shades for the destination</Text>
                  </View>
                </View>
                <View style={[styles.colorPickerContainer, { marginTop: 15 }]}>
                  <View style={styles.colorPickerRow}>
                    <Text style={styles.colorPickerLabel}>Light:</Text>
                    <View style={styles.colorSwatchesContainer}>
                      {[
                        { r: 239, g: 83, b: 80, name: 'Red' },
                        { r: 255, g: 112, b: 67, name: 'Deep Orange' },
                        { r: 255, g: 152, b: 0, name: 'Amber' },
                        { r: 156, g: 39, b: 176, name: 'Purple' },
                        { r: 233, g: 30, b: 99, name: 'Pink' },
                        { r: 63, g: 81, b: 181, name: 'Indigo' },
                      ].map((color, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.colorSwatch,
                            {
                              backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                              borderWidth: pointBColorLight.r === color.r && pointBColorLight.g === color.g && pointBColorLight.b === color.b ? 3 : 1,
                              borderColor: pointBColorLight.r === color.r && pointBColorLight.g === color.g && pointBColorLight.b === color.b ? '#28a745' : '#ccc',
                            }
                          ]}
                          onPress={() => setPointBColorLight(color)}
                        />
                      ))}
                    </View>
                  </View>
                  <View style={styles.colorPickerRow}>
                    <Text style={styles.colorPickerLabel}>Dark:</Text>
                    <View style={styles.colorSwatchesContainer}>
                      {[
                        { r: 198, g: 40, b: 40, name: 'Red' },
                        { r: 216, g: 67, b: 21, name: 'Deep Orange' },
                        { r: 245, g: 124, b: 0, name: 'Amber' },
                        { r: 123, g: 31, b: 162, name: 'Purple' },
                        { r: 194, g: 24, b: 91, name: 'Pink' },
                        { r: 40, g: 53, b: 147, name: 'Indigo' },
                      ].map((color, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.colorSwatch,
                            {
                              backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                              borderWidth: pointBColorDark.r === color.r && pointBColorDark.g === color.g && pointBColorDark.b === color.b ? 3 : 1,
                              borderColor: pointBColorDark.r === color.r && pointBColorDark.g === color.g && pointBColorDark.b === color.b ? '#28a745' : '#ccc',
                            }
                          ]}
                          onPress={() => setPointBColorDark(color)}
                        />
                      ))}
                    </View>
                  </View>
                </View>
                </View>
                
                {/* Data & Database Category */}
                <View style={[styles.settingsCategoryContainer, { marginTop: 30, marginBottom: 20 }]}>
                  <Text style={styles.settingsCategoryTitle}>Data & Database</Text>
                  
                  <View style={styles.settingItem}>
                    <View style={styles.settingItemContent}>
                      <Text style={styles.settingLabel}>Refresh Data</Text>
                      <Text style={styles.settingDescription}>Reload all data from database (pins and user data)</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#28a745',
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 8,
                      marginTop: 10,
                      marginBottom: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      elevation: 3,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3.84,
                    }}
                    onPress={async () => {
                      try {
                        // Refresh pins from database
                        if (refetchPins) {
                          await refetchPins();
                        }
                        
                        // Refresh campuses from database
                        await loadCampuses();
                        
                        // Refresh user data from database if logged in
                        if (isLoggedIn && authToken) {
                          try {
                            const updatedUser = await getCurrentUser(authToken);
                            if (updatedUser) {
                              setCurrentUser(updatedUser);
                              setUserProfile({
                                username: updatedUser.username,
                                email: updatedUser.email || '',
                                profilePicture: updatedUser.profilePicture || null,
                              });
                              
                              // Update saved pins and feedback history
                              if (updatedUser.activity) {
                                if (updatedUser.activity.savedPins) {
                                  setSavedPins(updatedUser.activity.savedPins);
                                }
                                if (updatedUser.activity.feedbackHistory) {
                                  const transformedFeedbacks = transformFeedbackData(updatedUser.activity.feedbackHistory);
                                  setFeedbackHistory(transformedFeedbacks);
                                }
                              }
                            }
                          } catch (userError) {
                            console.error('Error refreshing user data:', userError);
                          }
                        }
                        
                        Alert.alert('Success', 'Data refreshed successfully from database');
                      } catch (error) {
                        console.error('Error refreshing data:', error);
                        Alert.alert('Error', 'Failed to refresh data. Please try again.');
                      }
                    }}
                  >
                    <Icon name="refresh" size={16} color="white" style={{ marginRight: 8 }} />
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>Refresh Data</Text>
                  </TouchableOpacity>
                </View>

                {/* Storage Category */}
                <View style={[styles.settingsCategoryContainer, { marginTop: 30, marginBottom: 20 }]}>
                  <Text style={styles.settingsCategoryTitle}>Storage</Text>
                  
                  <View style={styles.settingItem}>
                    <View style={styles.settingItemContent}>
                      <Text style={styles.settingLabel}>Clear Cache</Text>
                      <Text style={styles.settingDescription}>Clear all cached images to free up storage space</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#dc3545',
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 8,
                      marginTop: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      elevation: 3,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3.84,
                    }}
                    onPress={async () => {
                      Alert.alert(
                        'Clear Cache',
                        'Are you sure you want to clear all cached images? This will free up storage but images will need to be reloaded.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Clear',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                const success = await clearImageCache();
                                if (success) {
                                  Alert.alert('Success', 'Image cache cleared successfully');
                                } else {
                                  Alert.alert('Error', 'Failed to clear cache. This feature requires expo-image v1.12.8+');
                                }
                              } catch (error) {
                                console.error('Error clearing cache:', error);
                                Alert.alert('Error', 'Failed to clear cache');
                              }
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Icon name="trash" size={16} color="white" style={{ marginRight: 8 }} />
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>Clear Cache</Text>
                  </TouchableOpacity>
                </View>
              </Animated.ScrollView>
            )}

            {settingsTab === 'about' && (
              <Animated.ScrollView 
                style={[styles.aboutContent, { opacity: fadeAnim }]}
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
              >
                {/* App Title Section */}
                <View style={styles.aboutSection}>
                  <Text style={[styles.aboutTitle, { color: '#333', fontSize: 28, fontWeight: 'bold', marginBottom: 8 }]}>Campus Trails</Text>
                  <View style={[styles.aboutLine, { marginBottom: 20 }]}></View>
                </View>

                {/* Developers Section */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={[styles.aboutLabel, { color: '#555', fontSize: 18, fontWeight: '600', marginBottom: 20 }]}>Development Team</Text>
                  
                  {/* Developer Cards */}
                  {developers.map((developer) => (
                    <View
                      key={developer.id}
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        elevation: 2,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                      }}
                    >
                      {/* Developer Photo */}
                      <View
                        style={{
                          width: 70,
                          height: 70,
                          borderRadius: 35,
                          backgroundColor: '#e9ecef',
                          marginRight: 16,
                          overflow: 'hidden',
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderWidth: 2,
                          borderColor: '#28a745',
                        }}
                      >
                        {developer.photo ? (
                          <ExpoImage
                            source={{ uri: developer.photo }}
                            style={{ width: 70, height: 70 }}
                            contentFit="cover"
                            cachePolicy="disk"
                          />
                        ) : (
                          <Icon name="user" size={35} color="#6c757d" />
                        )}
                      </View>

                      {/* Developer Info */}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: 4,
                          }}
                        >
                          {developer.name}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <Icon name="envelope" size={12} color="#6c757d" style={{ marginRight: 6 }} />
                          <Text
                            style={{
                              fontSize: 13,
                              color: '#6c757d',
                            }}
                            numberOfLines={1}
                          >
                            {developer.email}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Icon name="code" size={12} color="#28a745" style={{ marginRight: 6 }} />
                          <Text
                            style={{
                              fontSize: 12,
                              color: '#28a745',
                              fontWeight: '500',
                            }}
                          >
                            {developer.role}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
                
                {/* Suggestions & Feedback Button */}
                <View style={[styles.settingsCategoryContainer, { marginTop: 30, marginBottom: 20 }]}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#28a745',
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      elevation: 3,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3.84,
                    }}
                    onPress={() => {
                      // Check if user is logged in
                      if (!isLoggedIn || !authToken) {
                        Alert.alert(
                          'Login Required',
                          'You must be logged in to submit suggestions and feedback. Please log in or create an account.',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'Login', 
                              onPress: () => {
                                setSettingsVisible(false);
                                setAuthModalVisible(true);
                              }
                            }
                          ]
                        );
                        return;
                      }
                      // Set feedback type to 'suggestion' and open feedback modal
                      setFeedbackType('suggestion');
                      setSelectedPin({ id: 'general', title: 'General', description: 'Campus Trails App' }); // General pin for suggestions
                      setFeedbackModalVisible(true);
                    }}
                  >
                    <Icon name="lightbulb-o" size={16} color="white" style={{ marginRight: 8 }} />
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>Suggestions & Feedback</Text>
                  </TouchableOpacity>
                </View>
              </Animated.ScrollView>
            )}

            {settingsTab === 'help' && (
              <Animated.ScrollView style={[styles.aboutContent, { opacity: fadeAnim }]}>
                {/* Map Navigation */}
                <View style={styles.settingsCategoryContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Icon name="map" size={20} color="#28a745" style={{ marginRight: 10 }} />
                    <Text style={styles.settingsCategoryTitle}>Map Navigation</Text>
                  </View>
                  <View style={styles.settingItem}>
                    <Text style={[styles.settingDescription, { lineHeight: 20 }]}>
                      • Tap on any facility pin (green markers) to view details{'\n'}
                      • Pinch to zoom in/out on the map{'\n'}
                      • Drag to pan around the campus{'\n'}
                      • Tap "View More Details" to see building floors and rooms
                    </Text>
                  </View>
                </View>

                {/* Search Feature */}
                <View style={styles.settingsCategoryContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Icon name="search" size={20} color="#28a745" style={{ marginRight: 10 }} />
                    <Text style={styles.settingsCategoryTitle}>Search</Text>
                  </View>
                  <View style={styles.settingItem}>
                    <Text style={[styles.settingDescription, { lineHeight: 20 }]}>
                      • Tap the search button (top right) to open search{'\n'}
                      • Type facility name or room number (e.g., "ICT999"){'\n'}
                      • Search results show floor information{'\n'}
                      • Tap a result to navigate directly to that location{'\n'}
                      • Room searches automatically open the correct floor
                    </Text>
                  </View>
                </View>

                {/* Pathfinding */}
                <View style={styles.settingsCategoryContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Icon name="location-arrow" size={20} color="#28a745" style={{ marginRight: 10 }} />
                    <Text style={styles.settingsCategoryTitle}>Pathfinding</Text>
                  </View>
                  <View style={styles.settingItem}>
                    <Text style={[styles.settingDescription, { lineHeight: 20 }]}>
                      • Tap the pathfinding button (below search button){'\n'}
                      • Select Point A (start location) from the map or list{'\n'}
                      • Select Point B (destination) from the map or list{'\n'}
                      • The app will show the shortest path between points{'\n'}
                      • Customize path colors in Settings → General
                    </Text>
                  </View>
                </View>

                {/* Filter Pins */}
                <View style={styles.settingsCategoryContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Icon name="filter" size={20} color="#28a745" style={{ marginRight: 10 }} />
                    <Text style={styles.settingsCategoryTitle}>Filter Pins</Text>
                  </View>
                  <View style={styles.settingItem}>
                    <Text style={[styles.settingDescription, { lineHeight: 20 }]}>
                      • Tap the filter button (between search and pathfinding){'\n'}
                      • Select categories to show only specific facility types{'\n'}
                      • Use "Select All" or "Clear All" for quick filtering{'\n'}
                      • Tap the filter button again to clear all filters
                    </Text>
                  </View>
                </View>

                {/* QR Code Scanner */}
                <View style={styles.settingsCategoryContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Icon name="qrcode" size={20} color="#28a745" style={{ marginRight: 10 }} />
                    <Text style={styles.settingsCategoryTitle}>QR Code Scanner</Text>
                  </View>
                  <View style={styles.settingItem}>
                    <Text style={[styles.settingDescription, { lineHeight: 20 }]}>
                      • Tap the QR code button (top left) to open scanner{'\n'}
                      • Point camera at a facility QR code{'\n'}
                      • The app will navigate to that facility automatically{'\n'}
                      • Note: Requires development build for full functionality{'\n'}
                      • Alternative: Use deep links (campustrails://pin/123)
                    </Text>
                  </View>
                </View>

                {/* Building Details */}
                <View style={styles.settingsCategoryContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Icon name="building" size={20} color="#28a745" style={{ marginRight: 10 }} />
                    <Text style={styles.settingsCategoryTitle}>Building Details</Text>
                  </View>
                  <View style={styles.settingItem}>
                    <Text style={[styles.settingDescription, { lineHeight: 20 }]}>
                      • Tap a facility pin, then tap "View More Details"{'\n'}
                      • Use floor buttons to switch between floors{'\n'}
                      • Browse rooms/areas on each floor{'\n'}
                      • Tap a room to save it or view details{'\n'}
                      • Use "Report a Problem" to report room issues
                    </Text>
                  </View>
                </View>

                {/* User Profile */}
                <View style={styles.settingsCategoryContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Icon name="user" size={20} color="#28a745" style={{ marginRight: 10 }} />
                    <Text style={styles.settingsCategoryTitle}>User Profile</Text>
                  </View>
                  <View style={styles.settingItem}>
                    <Text style={[styles.settingDescription, { lineHeight: 20 }]}>
                      • Tap the profile button (bottom right) to open profile{'\n'}
                      • Saved Pins: View all your bookmarked facilities and rooms{'\n'}
                      • Feedback: See your feedback history{'\n'}
                      • Notifications: Manage push notifications{'\n'}
                      • Account: Update profile, change password, or logout
                    </Text>
                  </View>
                </View>

                {/* Saving Pins */}
                <View style={styles.settingsCategoryContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Icon name="heart" size={20} color="#28a745" style={{ marginRight: 10 }} />
                    <Text style={styles.settingsCategoryTitle}>Saving Pins</Text>
                  </View>
                  <View style={styles.settingItem}>
                    <Text style={[styles.settingDescription, { lineHeight: 20 }]}>
                      • Tap a facility pin to open details{'\n'}
                      • Tap the heart icon to save the facility{'\n'}
                      • Saved facilities appear in Profile → Saved Pins{'\n'}
                      • Rooms can also be saved and will show floor information{'\n'}
                      • Remove saved pins by tapping the heart icon again
                    </Text>
                  </View>
                </View>

                {/* Feedback & Reports */}
                <View style={styles.settingsCategoryContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Icon name="comment" size={20} color="#28a745" style={{ marginRight: 10 }} />
                    <Text style={styles.settingsCategoryTitle}>Feedback & Reports</Text>
                  </View>
                  <View style={styles.settingItem}>
                    <Text style={[styles.settingDescription, { lineHeight: 20 }]}>
                      • Report a Problem: Tap "Report a Problem" in room details{'\n'}
                      • Suggestions & Feedback: Settings → About Us → Suggestions & Feedback{'\n'}
                      • Both require login to submit{'\n'}
                      • View your feedback history in Profile → Feedback
                    </Text>
                  </View>
                </View>

                {/* Notifications */}
                <View style={styles.settingsCategoryContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Icon name="bell" size={20} color="#28a745" style={{ marginRight: 10 }} />
                    <Text style={styles.settingsCategoryTitle}>Notifications</Text>
                  </View>
                  <View style={styles.settingItem}>
                    <Text style={[styles.settingDescription, { lineHeight: 20 }]}>
                      • Push notifications are only available for logged-in users{'\n'}
                      • Notifications are enabled automatically when you log in{'\n'}
                      • You must be logged in to receive push notifications{'\n'}
                      • View notifications in Profile → Notifications{'\n'}
                      • Tap a notification to view details{'\n'}
                      • Swipe to remove notifications{'\n'}
                      • Badge shows unread notification count
                    </Text>
                  </View>
                </View>

                {/* Settings */}
                <View style={styles.settingsCategoryContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Icon name="cog" size={20} color="#28a745" style={{ marginRight: 10 }} />
                    <Text style={styles.settingsCategoryTitle}>Settings</Text>
                  </View>
                  <View style={styles.settingItem}>
                    <Text style={[styles.settingDescription, { lineHeight: 20 }]}>
                      • Point A Color: Customize start point colors{'\n'}
                      • Point B Color: Customize destination colors{'\n'}
                      • Clear Cache: Free up storage space{'\n'}
                      • Refresh Data: Sync with server
                    </Text>
                  </View>
                </View>

                {/* Tips */}
                <View style={styles.settingsCategoryContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Icon name="lightbulb-o" size={20} color="#28a745" style={{ marginRight: 10 }} />
                    <Text style={styles.settingsCategoryTitle}>Tips & Tricks</Text>
                  </View>
                  <View style={styles.settingItem}>
                    <Text style={[styles.settingDescription, { lineHeight: 20 }]}>
                      • Search for room numbers to jump directly to that floor{'\n'}
                      • Save frequently visited facilities for quick access{'\n'}
                      • Use pathfinding to discover the shortest route{'\n'}
                      • Filter pins to focus on specific facility types{'\n'}
                      • Report issues to help improve campus facilities{'\n'}
                      • Check notifications for important campus updates
                    </Text>
                  </View>
                </View>
              </Animated.ScrollView>
            )}
          </View>
          </Animated.View>
        )}
      </Modal>

      {/* User Profile Modal - Bottom Slide-in Panel */}
      <Modal
        visible={userProfileRendered}
        transparent={true}
        animationType="none"
        onRequestClose={() => setUserProfileVisible(false)}
      >
        {userProfileRendered && (
          <>
            <Animated.View 
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: '#f5f5f5',
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  overflow: 'hidden',
                  transform: [{ translateY: userProfileSlideAnim }],
                  opacity: userProfileSlideAnim.interpolate({
                    inputRange: [0, 150, 300],
                    outputRange: [1, 0.5, 0],
                  }),
                }
              ]}
            >
              <View style={styles.modalHeaderWhite}>
                <Text style={[styles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>User Profile</Text>
              </View>
              <View style={styles.lineDark}></View>

              {/* Vertical Tab Navigation */}
              <View style={{ flexDirection: 'row', backgroundColor: '#f5f5f5', flex: 1 }}>
                {/* Left Side - Vertical Tab Buttons */}
                <View style={{ alignSelf: 'flex-start', backgroundColor: '#e9ecef', borderRightWidth: 1, borderRightColor: '#dee2e6' }}>
                  <View style={{ flex: 1 }}>
                    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                    <TouchableOpacity 
                      onPress={() => setUserProfileTab('saved')} 
                      style={[
                        styles.verticalTabButton,
                        userProfileTab === 'saved' && styles.verticalTabActive
                      ]}
                    >
                      <Icon 
                        name="heart" 
                        size={20} 
                        color={userProfileTab === 'saved' ? '#fff' : '#6c757d'} 
                        style={{ marginRight: 10 }}
                      />
                      <Text style={userProfileTab === 'saved' ? styles.verticalTabActiveText : styles.verticalTabText}>
                        Saved Pins
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      onPress={() => setUserProfileTab('feedback')} 
                      style={[
                        styles.verticalTabButton,
                        userProfileTab === 'feedback' && styles.verticalTabActive
                      ]}
                    >
                      <Icon 
                        name="star" 
                        size={20} 
                        color={userProfileTab === 'feedback' ? '#fff' : '#6c757d'} 
                        style={{ marginRight: 10 }}
                      />
                      <Text style={userProfileTab === 'feedback' ? styles.verticalTabActiveText : styles.verticalTabText}>
                        Feedback
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      onPress={() => setUserProfileTab('notifications')} 
                      style={[
                        styles.verticalTabButton,
                        userProfileTab === 'notifications' && styles.verticalTabActive
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Icon 
                          name="bell" 
                          size={20} 
                          color={userProfileTab === 'notifications' ? '#fff' : '#6c757d'} 
                          style={{ marginRight: 10 }}
                        />
                        <Text style={userProfileTab === 'notifications' ? styles.verticalTabActiveText : styles.verticalTabText}>
                          Notifications
                        </Text>
                      </View>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      onPress={() => setUserProfileTab('settings')} 
                      style={[
                        styles.verticalTabButton,
                        userProfileTab === 'settings' && styles.verticalTabActive
                      ]}
                    >
                      <Icon 
                        name="user" 
                        size={20} 
                        color={userProfileTab === 'settings' ? '#fff' : '#6c757d'} 
                        style={{ marginRight: 10 }}
                      />
                      <Text style={userProfileTab === 'settings' ? styles.verticalTabActiveText : styles.verticalTabText}>
                        Account
                      </Text>
                    </TouchableOpacity>
                    </ScrollView>
                  </View>
                </View>

                {/* Right Side - Tab Content */}
                <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
                {userProfileTab === 'saved' && (
                  <ScrollView contentContainerStyle={{ padding: 20 }}>
                    {savedPins.length === 0 ? (
                      <View style={{ alignItems: 'center', padding: 40 }}>
                        <Icon name="bookmark-o" size={48} color="#ccc" />
                        <Text style={{ marginTop: 16, color: '#666', fontSize: 16 }}>No saved pins yet</Text>
                        <Text style={{ marginTop: 8, color: '#999', fontSize: 14, textAlign: 'center' }}>Save pins from the map to view them here</Text>
                      </View>
                    ) : (() => {
                      // Group saved pins by building
                      // Separate buildings (facilities) from rooms
                      const buildings = [];
                      const rooms = [];
                      
                      savedPins.forEach((pin) => {
                        const isRoom = pin.type === 'room' || pin.buildingPin || pin.buildingId;
                        if (isRoom) {
                          rooms.push(pin);
                        } else {
                          buildings.push(pin);
                        }
                      });
                      
                      // Group rooms by their building
                      const roomsByBuilding = {};
                      rooms.forEach((room) => {
                        if (room.buildingPin) {
                          const buildingId = room.buildingPin.id || room.buildingId;
                          if (!roomsByBuilding[buildingId]) {
                            roomsByBuilding[buildingId] = [];
                          }
                          roomsByBuilding[buildingId].push(room);
                        } else {
                          // Room without buildingPin - add to ungrouped
                          if (!roomsByBuilding['ungrouped']) {
                            roomsByBuilding['ungrouped'] = [];
                          }
                          roomsByBuilding['ungrouped'].push(room);
                        }
                      });
                      
                      // Create ordered list: buildings first, then their rooms
                      const orderedPins = [];
                      
                      // Add buildings first
                      buildings.forEach((building) => {
                        orderedPins.push({ type: 'building', pin: building });
                        // Add rooms for this building if any
                        const buildingId = building.id;
                        if (roomsByBuilding[buildingId]) {
                          roomsByBuilding[buildingId].forEach((room) => {
                            orderedPins.push({ type: 'room', pin: room });
                          });
                          // Remove from roomsByBuilding so we don't add it again
                          delete roomsByBuilding[buildingId];
                        }
                      });
                      
                      // Add remaining rooms (buildings not saved, or ungrouped rooms)
                      Object.values(roomsByBuilding).forEach((roomList) => {
                        roomList.forEach((room) => {
                          orderedPins.push({ type: 'room', pin: room });
                        });
                      });
                      
                      return (
                        <>
                          {orderedPins.map((item, index) => {
                        const pin = item.pin;
                        const isRoom = item.type === 'room';
                        
                        // Check if this room should be grouped (indented) under a building
                        // A room is grouped if the previous item is a building and matches this room's building
                        let isGroupedRoom = false;
                        if (isRoom && index > 0) {
                          const prevItem = orderedPins[index - 1];
                          if (prevItem.type === 'building') {
                            const buildingId = prevItem.pin.id;
                            const roomBuildingId = pin.buildingPin?.id || pin.buildingId;
                            isGroupedRoom = buildingId === roomBuildingId;
                          } else if (prevItem.type === 'room') {
                            // Check if previous room was grouped and same building
                            const prevRoomBuildingId = prevItem.pin.buildingPin?.id || prevItem.pin.buildingId;
                            const currentRoomBuildingId = pin.buildingPin?.id || pin.buildingId;
                            // If previous room was grouped, check if we're still in the same building group
                            if (prevRoomBuildingId === currentRoomBuildingId && index > 1) {
                              // Check if there's a building before the previous room
                              let foundBuilding = false;
                              for (let i = index - 2; i >= 0; i--) {
                                if (orderedPins[i].type === 'building') {
                                  const buildingId = orderedPins[i].pin.id;
                                  isGroupedRoom = buildingId === currentRoomBuildingId;
                                  foundBuilding = true;
                                  break;
                                }
                              }
                            }
                          }
                        }
                        
                        return (
                        <TouchableOpacity
                          key={pin._id ? pin._id.toString() : `pin-${pin.id}-${index}`}
                          style={[
                            styles.facilityButton,
                            isRoom && {
                              borderLeftWidth: 2, // Reduced from 4 to 2
                              borderLeftColor: '#007bff',
                              marginLeft: isGroupedRoom ? 16 : 0, // Indent grouped rooms
                            }
                          ]}
                          onPress={() => {
                            if (isRoom) {
                              // For rooms, always open the building details modal
                              // Find the building pin - check if it's stored in pin.buildingPin or find it from pins
                              let buildingPin = pin.buildingPin;
                              
                              // If buildingPin is not available, try to find it from the pins array
                              if (!buildingPin && pin.buildingId) {
                                buildingPin = pins.find(p => p.id === pin.buildingId);
                              }
                              
                              // If still not found, try to find building by searching through all pins
                              if (!buildingPin && pins && pins.length > 0) {
                                for (const p of pins) {
                                  if (p.floors && Array.isArray(p.floors)) {
                                    for (const floor of p.floors) {
                                      if (floor.rooms && Array.isArray(floor.rooms)) {
                                        const roomFound = floor.rooms.find(r => 
                                          (r.id === pin.id || r.name === pin.name || r.id === pin.title || r.name === pin.title)
                                        );
                                        if (roomFound) {
                                          buildingPin = p;
                                          break;
                                        }
                                      }
                                    }
                                    if (buildingPin) break;
                                  }
                                }
                              }
                              
                              if (buildingPin) {
                                console.log('🔍 Saved room - Starting floor detection for:', {
                                  pinId: pin.id,
                                  pinTitle: pin.title,
                                  pinName: pin.name,
                                  savedFloorLevel: pin.floorLevel,
                                  buildingId: buildingPin.id,
                                  buildingDescription: buildingPin.description,
                                  buildingFloorsCount: buildingPin.floors?.length || 0
                                });
                                
                                // Find the floor level from the saved room - use same logic as search function
                                // Start with null (not undefined) to match search logic
                                let floorLevel = null;
                                
                                // Priority 1: Use saved floorLevel if available and valid
                                if (pin.floorLevel !== undefined && typeof pin.floorLevel === 'number') {
                                  floorLevel = pin.floorLevel;
                                  console.log('✅ Saved room - Using stored floorLevel:', floorLevel, 'for room:', pin.title || pin.name);
                                }
                                
                                // Priority 2: Find from building's floors (same logic as search)
                                if (floorLevel === null && buildingPin.floors && Array.isArray(buildingPin.floors)) {
                                  console.log('🔍 Saved room - Searching through', buildingPin.floors.length, 'floors for room:', pin.title || pin.name || pin.id);
                                  
                                  for (const floor of buildingPin.floors) {
                                    if (floor.rooms && Array.isArray(floor.rooms)) {
                                      console.log('🔍 Checking floor level', floor.level, 'with', floor.rooms.length, 'rooms');
                                      
                                      // Use same matching logic as search function with better normalization
                                      const roomFound = floor.rooms.find(r => {
                                        // Normalize room names (remove spaces, convert to lowercase for comparison)
                                        const normalizeString = (str) => str ? str.toString().replace(/\s+/g, '').toLowerCase() : '';
                                        
                                        const savedRoomName = normalizeString(pin.name || pin.title || pin.id);
                                        const dbRoomName = normalizeString(r.name);
                                        const dbRoomId = normalizeString(r.id);
                                        
                                        // Exact match (case-insensitive, space-insensitive)
                                        const nameMatch = savedRoomName && dbRoomName && savedRoomName === dbRoomName;
                                        // ID match
                                        const idMatch = pin.id && r.id && normalizeString(pin.id) === dbRoomId;
                                        // Title match
                                        const titleMatch = pin.title && r.name && normalizeString(pin.title) === dbRoomName;
                                        
                                        const match = nameMatch || idMatch || titleMatch;
                                        
                                        if (match) {
                                          console.log('✅ Match found!', {
                                            saved: pin.title || pin.name || pin.id,
                                            dbRoom: r.name || r.id,
                                            floorLevel: floor.level
                                          });
                                        }
                                        
                                        return match;
                                      });
                                      
                                      if (roomFound) {
                                        // Use floor.level directly (matches structure: level 0=Ground, 1=2nd, 2=3rd, etc.)
                                        floorLevel = floor.level;
                                        const floorName = getFloorName(floor.level);
                                        console.log('✅ Saved room - Found room in floor:', pin.title || pin.name, '→ Floor Level:', floorLevel, '(', floorName, ')');
                                        break;
                                      }
                                    }
                                  }
                                }
                                
                                // Fallback to first floor if not found
                                if (floorLevel === null) {
                                  floorLevel = buildingPin.floors?.[0]?.level || 0;
                                  console.log('⚠️ Saved room - Floor not found, using default:', pin.title || pin.name, '→ Floor Level:', floorLevel);
                                }
                                
                                // Validate floor level is a number (same as search function)
                                if (typeof floorLevel !== 'number') {
                                  console.error('❌ Invalid floor level:', floorLevel, 'for saved room:', pin.title || pin.name);
                                  floorLevel = buildingPin.floors?.[0]?.level || 0;
                                }
                                
                                console.log('🏢 Saved room - Final:', {
                                  room: pin.title || pin.name,
                                  building: buildingPin.description || buildingPin.title,
                                  floorLevel: floorLevel,
                                  floorName: getFloorName(floorLevel),
                                  buildingFloors: buildingPin.floors?.length || 0,
                                  availableFloors: buildingPin.floors?.map(f => `Level ${f.level}`).join(', ') || 'none'
                                });
                                
                                // Ensure buildingPin has isVisible property for modal rendering
                                const buildingPinWithVisibility = {
                                  ...buildingPin,
                                  isVisible: buildingPin.isVisible !== undefined ? buildingPin.isVisible : true
                                };
                                
                                console.log('📌 Saved room - Setting building pin:', {
                                  id: buildingPinWithVisibility.id,
                                  isVisible: buildingPinWithVisibility.isVisible,
                                  hasFloors: !!buildingPinWithVisibility.floors
                                });
                                
                                // Set the building pin FIRST before setting floor ref
                                setSelectedPin(buildingPinWithVisibility);
                                setClickedPin(buildingPinWithVisibility.id);
                                setHighlightedPinOnMap(null);
                                
                                // Close user profile modal
                                setUserProfileVisible(false);
                                
                                // Close other modals (including pin details modal)
                                setModalVisible(false);
                                setSearchVisible(false);
                                setCampusVisible(false);
                                setFilterModalVisible(false);
                                setShowPathfindingPanel(false);
                                setSettingsVisible(false);
                                setPinsModalVisible(false);
                                
                                // Open Building Details Modal with correct floor (same as search function)
                                setCameFromPinDetails(false);
                                
                                // Store floor level in ref for useEffect to use (must be set before opening modal)
                                // Floor level structure: 0=Ground, 1=2nd, 2=3rd, etc. (matches addFloorsAndRooms.js)
                                floorFromRoomRef.current = floorLevel;
                                hasSetFloorFromRoom.current = false; // Reset flag before opening
                                console.log('📌 Saved room - Stored floor level in ref:', floorLevel, '(will highlight', getFloorName(floorLevel), 'button)');
                                console.log('📌 Saved room - floorFromRoomRef.current =', floorFromRoomRef.current);
                                
                                // Set the floor immediately before opening modal to ensure floor button responds
                                setSelectedFloor(floorLevel);
                                console.log('📌 Saved room - setSelectedFloor called with:', floorLevel);
                                
                                // Open building details modal (useEffect will also set the floor from ref as backup)
                                setBuildingDetailsVisible(true);
                                console.log('📌 Saved room - Building Details Modal visibility set to:', true);
                                console.log('📌 Saved room - isBuildingDetailsVisible will be:', true);
                              } else {
                                // If building not found, show error
                                Alert.alert('Building Not Found', `Could not find building for room: ${pin.title || pin.name || pin.description}`);
                              }
                            } else {
                              // For non-room pins (buildings/facilities), open Building Details Modal directly
                              // Set the building pin
                              setSelectedPin(pin);
                              setClickedPin(pin.id);
                              setHighlightedPinOnMap(null);
                              
                              // Close user profile modal
                              setUserProfileVisible(false);
                              
                              // Close other modals (including pin details modal)
                              setModalVisible(false);
                              setSearchVisible(false);
                              setCampusVisible(false);
                              setFilterModalVisible(false);
                              setShowPathfindingPanel(false);
                              setSettingsVisible(false);
                              setPinsModalVisible(false);
                              
                              // Reset floor selection - will default to first floor in useEffect
                              floorFromRoomRef.current = null;
                              hasSetFloorFromRoom.current = false;
                              
                              // Set default floor (first floor from database, or Ground Floor)
                              if (pin.floors && pin.floors.length > 0) {
                                const firstFloor = pin.floors[0];
                                setSelectedFloor(firstFloor.level);
                              } else {
                                setSelectedFloor(0); // Default to Ground Floor
                              }
                              
                              // Open building details modal
                              setCameFromPinDetails(false);
                              setBuildingDetailsVisible(true);
                            }
                          }}
                        >
                          {(() => {
                            // Handle different image formats
                            if (!pin.image) {
                              return (
                                <View style={[styles.facilityButtonImage, { backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center' }]}>
                                  <Icon name="image" size={30} color="#999" />
                                </View>
                              );
                            }
                            
                            const imageSource = getOptimizedImage(pin.image);
                            
                            // If it's a local require (number type), use Image
                            if (typeof imageSource === 'number') {
                              return <Image source={imageSource} style={styles.facilityButtonImage} resizeMode="cover" />;
                            }
                            
                            // If it's an object without uri (local asset), use Image
                            if (imageSource && typeof imageSource === 'object' && !imageSource.uri) {
                              return <Image source={imageSource} style={styles.facilityButtonImage} resizeMode="cover" />;
                            }
                            
                            // If it's a string or object with uri (remote URL), use ExpoImage
                            if (typeof imageSource === 'string' || (imageSource && imageSource.uri)) {
                              return <ExpoImage source={typeof imageSource === 'string' ? { uri: imageSource } : imageSource} style={styles.facilityButtonImage} contentFit="cover" cachePolicy="disk" />;
                            }
                            
                            // Fallback to placeholder
                            return (
                              <View style={[styles.facilityButtonImage, { backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center' }]}>
                                <Icon name="image" size={30} color="#999" />
                              </View>
                            );
                          })()}
                          <View style={[styles.facilityButtonContent, { flex: 1 }]}>
                            <Text style={[
                              styles.facilityName,
                              isRoom && { fontWeight: '600' }
                            ]}>
                              {pin.description || pin.name}
                            </Text>
                          </View>
                        </TouchableOpacity>
                        );
                          })}
                        </>
                      );
                    })()}
                  </ScrollView>
                )}

                {userProfileTab === 'feedback' && (
                  <ScrollView 
                    style={{ flex: 1 }}
                    contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    {feedbackHistory.length === 0 ? (
                      <View style={{ alignItems: 'center', padding: 40, minHeight: height * 0.3 }}>
                        <Icon name="star-o" size={48} color="#ccc" />
                        <Text style={{ marginTop: 16, color: '#666', fontSize: 16 }}>No feedback yet</Text>
                        <Text style={{ marginTop: 8, color: '#999', fontSize: 14, textAlign: 'center' }}>Give feedback on buildings to see your review history here</Text>
                      </View>
                    ) : (
                      feedbackHistory.map((feedback) => (
                        <View key={feedback.id} style={styles.feedbackCard}>
                          <View style={styles.feedbackCardHeader}>
                            <Text style={styles.feedbackCardTitle} numberOfLines={2}>
                              {feedback.pinTitle}
                            </Text>
                            <View style={styles.feedbackCardStars}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Icon
                                  key={star}
                                  name={star <= feedback.rating ? 'star' : 'star-o'}
                                  size={18}
                                  color={star <= feedback.rating ? '#ffc107' : '#ddd'}
                                  style={{ marginLeft: 2 }}
                                />
                              ))}
                            </View>
                          </View>
                          {feedback.comment && (
                            <View style={{ marginBottom: 12 }}>
                              <ScrollView 
                                style={{ maxHeight: 120 }}
                                nestedScrollEnabled={true}
                                showsVerticalScrollIndicator={true}
                                bounces={false}
                              >
                                <Text style={styles.feedbackCardComment}>
                                  {feedback.comment}
                                </Text>
                              </ScrollView>
                            </View>
                          )}
                          <Text style={styles.feedbackCardDate}>
                            {new Date(feedback.date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </Text>
                        </View>
                      ))
                    )}
                  </ScrollView>
                )}

                {userProfileTab === 'notifications' && (
                  <ScrollView 
                    style={{ flex: 1 }}
                    contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    onScrollBeginDrag={async () => {
                      // Refresh notifications when user starts scrolling
                      if (isLoggedIn && authToken) {
                        try {
                          const backendNotifications = await getUserNotifications(authToken);
                          setNotifications(backendNotifications);
                        } catch (error) {
                          console.error('Error refreshing notifications:', error);
                          const storedNotifications = getNotifications();
                          setNotifications(storedNotifications);
                        }
                      } else {
                        const storedNotifications = getNotifications();
                        setNotifications(storedNotifications);
                      }
                    }}
                  >
                    {/* Push Notifications Toggle */}
                    {isLoggedIn && (
                      <View style={{
                        backgroundColor: '#f8f9fa',
                        padding: 16,
                        borderRadius: 8,
                        marginBottom: 20,
                        borderWidth: 1,
                        borderColor: '#e0e0e0'
                      }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.settingLabel, { marginBottom: 4 }]}>Push Notifications</Text>
                            <Text style={[styles.settingDescription, { fontSize: 12, color: pushNotificationEnabled ? '#28a745' : '#dc3545' }]}>
                              {pushNotificationEnabled ? '✓ Enabled' : '✗ Not enabled'}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={[
                              styles.authButton,
                              {
                                backgroundColor: pushNotificationEnabled ? '#28a745' : '#dc3545',
                                paddingHorizontal: 20,
                                paddingVertical: 10,
                                minWidth: 120
                              }
                            ]}
                            onPress={async () => {
                              try {
                                if (!isLoggedIn || !authToken) {
                                  Alert.alert('Login Required', 'Please log in to enable push notifications.');
                                  return;
                                }
                                
                                Alert.alert(
                                  'Enable Push Notifications',
                                  'This will request permission to send you push notifications. You can receive important campus updates and announcements.',
                                  [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                      text: 'Enable',
                                      onPress: async () => {
                                        try {
                                          const result = await registerForPushNotificationsAsync();
                                          if (result.token) {
                                            await registerPushToken(result.token, authToken);
                                            setPushNotificationEnabled(true);
                                            Alert.alert('Success', 'Push notifications enabled! You will now receive notifications.');
                                          } else {
                                            // Check the actual permission status
                                            if (result.permissionStatus === 'granted') {
                                              // Permission granted but token failed
                                              setPushNotificationEnabled(true);
                                              Alert.alert(
                                                'Permission Granted',
                                                'Push notification permission is granted, but there was an issue getting the token. Please try again later.',
                                                [{ text: 'OK' }]
                                              );
                                            } else if (result.permissionStatus === 'denied') {
                                              // Permission explicitly denied
                                              setPushNotificationEnabled(false);
                                              Alert.alert(
                                                'Permission Denied',
                                                'Push notification permission was denied. Please enable it in your device settings.',
                                                [{ text: 'OK' }]
                                              );
                                            } else {
                                              // Undetermined or other status
                                              setPushNotificationEnabled(false);
                                              Alert.alert(
                                                'Permission Not Granted',
                                                `Push notification permission status: ${result.permissionStatus}. ${result.error || 'Please try again.'}`,
                                                [{ text: 'OK' }]
                                              );
                                            }
                                          }
                                        } catch (error) {
                                          console.error('Error enabling push notifications:', error);
                                          // Check permission status even if there was an error
                                          try {
                                            const { status } = await Notifications.getPermissionsAsync();
                                            setPushNotificationEnabled(status === 'granted');
                                            if (status === 'granted') {
                                              Alert.alert('Permission Granted', 'Permission is granted but there was an error. Please try again.');
                                            } else {
                                              Alert.alert('Error', 'Failed to enable push notifications. Please try again.');
                                            }
                                          } catch (permError) {
                                            Alert.alert('Error', 'Failed to enable push notifications. Please try again.');
                                          }
                                        }
                                      }
                                    }
                                  ]
                                );
                              } catch (error) {
                                console.error('Error:', error);
                                Alert.alert('Error', 'Failed to enable push notifications.');
                              }
                            }}
                          >
                            <Text style={styles.authButtonText}>
                              {pushNotificationEnabled ? 'Re-enable' : 'Enable'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={[styles.settingDescription, { fontSize: 12, color: '#666', marginTop: 8 }]}>
                          Enable push notifications to receive important campus updates and announcements directly on your device.
                        </Text>
                      </View>
                    )}

                    {/* Notifications List */}
                    {notifications.length > 0 && (
                      <>
                        <TouchableOpacity
                          onPress={async () => {
                            if (isLoggedIn && authToken) {
                              try {
                                await clearAllUserNotifications(authToken);
                                setNotifications([]);
                              } catch (error) {
                                console.error('Error clearing notifications:', error);
                                Alert.alert('Error', 'Failed to clear notifications. Please try again.');
                              }
                            } else {
                              await clearAllNotifications();
                              setNotifications([]);
                            }
                          }}
                          style={{
                            alignSelf: 'flex-end',
                            padding: 8,
                            marginBottom: 10,
                          }}
                        >
                          <Text style={{ color: '#dc3545', fontSize: 14 }}>Clear All</Text>
                        </TouchableOpacity>
                        {notifications.map((notification) => (
                          <View 
                            key={notification.id} 
                            style={[
                              styles.feedbackCard,
                              { 
                                opacity: notification.read ? 0.7 : 1,
                                borderLeftWidth: notification.read ? 0 : 4,
                                borderLeftColor: '#007bff',
                                marginBottom: 12
                              }
                            ]}
                          >
                            <View style={styles.feedbackCardHeader}>
                              <Text style={[styles.feedbackCardTitle, { flex: 1 }]} numberOfLines={2}>
                                {notification.title}
                              </Text>
                              <TouchableOpacity
                                onPress={async () => {
                                  if (isLoggedIn && authToken) {
                                    try {
                                      await deleteNotification(notification.id, authToken);
                                      setNotifications(prev => prev.filter(n => n.id !== notification.id));
                                    } catch (error) {
                                      console.error('Error deleting notification:', error);
                                      Alert.alert('Error', 'Failed to delete notification. Please try again.');
                                    }
                                  } else {
                                    await removeNotification(notification.id);
                                    setNotifications(prev => prev.filter(n => n.id !== notification.id));
                                  }
                                }}
                                style={{
                                  padding: 8,
                                  marginLeft: 8,
                                }}
                              >
                                <Icon name="trash" size={18} color="#dc3545" />
                              </TouchableOpacity>
                            </View>
                            {notification.body && (
                              <View style={{ marginTop: 8, marginBottom: 8 }}>
                                <Text style={[styles.feedbackCardComment, { color: '#666' }]}>
                                  {notification.body}
                                </Text>
                              </View>
                            )}
                            {notification.data && Object.keys(notification.data).length > 0 && (
                              <TouchableOpacity
                                onPress={() => {
                                  const data = notification.data;
                                  if (data.pinId) {
                                    const pin = pins.find(p => p.id === data.pinId || p._id === data.pinId);
                                    if (pin) {
                                      handlePinPress(pin);
                                      setUserProfileVisible(false);
                                    }
                                  }
                                  if (data.action === 'openProfile') {
                                    // Already in profile
                                  }
                                }}
                                style={{
                                  marginTop: 8,
                                  padding: 8,
                                  backgroundColor: '#f0f0f0',
                                  borderRadius: 4,
                                }}
                              >
                                <Text style={{ color: '#007bff', fontSize: 12 }}>
                                  {notification.data.pinId ? 'View Building' : 'View Details'}
                                </Text>
                              </TouchableOpacity>
                            )}
                            <Text style={styles.feedbackCardDate}>
                              {new Date(notification.date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Text>
                          </View>
                        ))}
                      </>
                    )}
                  </ScrollView>
                )}

                {userProfileTab === 'settings' && (
                  <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                  >
                    <ScrollView
                      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                    >
                      {/* Profile Picture Section */}
                      <View style={{ alignItems: 'center', marginBottom: 30 }}>
                        <TouchableOpacity
                          onPress={async () => {
                            try {
                              // Request permissions first
                              const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                              if (mediaLibraryStatus !== 'granted') {
                                Alert.alert('Permission Required', 'We need access to your media library to select a profile picture.');
                                return;
                              }

                              const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
                              
                              // Show options
                              Alert.alert(
                                'Change Profile Picture',
                                'Select a source',
                                [
                                  {
                                    text: 'Camera',
                                    onPress: async () => {
                                      try {
                                        if (cameraStatus !== 'granted') {
                                          Alert.alert('Permission Required', 'We need access to your camera to take a photo.');
                                          return;
                                        }
                                        
                                        const result = await ImagePicker.launchCameraAsync({
                                          mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                          allowsEditing: true,
                                          aspect: [1, 1],
                                          quality: 0.8,
                                        });

                                        if (!result.canceled && result.assets && result.assets[0]) {
                                          await handleProfilePictureUpload(result.assets[0].uri);
                                        }
                                      } catch (error) {
                                        console.error('Camera error:', error);
                                        Alert.alert('Error', 'Failed to take photo. Please try again.');
                                      }
                                    }
                                  },
                                  {
                                    text: 'Gallery',
                                    onPress: async () => {
                                      try {
                                        const result = await ImagePicker.launchImageLibraryAsync({
                                          mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                          allowsEditing: true,
                                          aspect: [1, 1],
                                          quality: 0.8,
                                        });

                                        if (!result.canceled && result.assets && result.assets[0]) {
                                          await handleProfilePictureUpload(result.assets[0].uri);
                                        }
                                      } catch (error) {
                                        console.error('Gallery error:', error);
                                        Alert.alert('Error', 'Failed to select image. Please try again.');
                                      }
                                    }
                                  },
                                  { text: 'Cancel', style: 'cancel' }
                                ]
                              );
                            } catch (error) {
                              console.error('Image picker error:', error);
                              Alert.alert('Error', 'Failed to open image picker. Please try again.');
                            }
                          }}
                        >
                          <View style={{
                            width: 120,
                            height: 120,
                            borderRadius: 60,
                            backgroundColor: '#ddd',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 3,
                            borderColor: '#28a745',
                            overflow: 'hidden',
                          }}>
                            {userProfile.profilePicture ? (
                              <Image
                                source={{ uri: getProfilePictureUrl(userProfile.profilePicture, { circular: true, width: 200, height: 200 }) }}
                                style={{ width: 120, height: 120 }}
                                resizeMode="cover"
                              />
                            ) : (
                              <Icon name="user" size={60} color="#999" />
                            )}
                          </View>
                          <View style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: '#28a745',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 3,
                            borderColor: 'white',
                          }}>
                            <Icon name="camera" size={16} color="white" />
                          </View>
                        </TouchableOpacity>
                        <Text style={{ marginTop: 12, color: '#666', fontSize: 14 }}>
                          {userProfile.username || 'Tap to add profile picture'}
                        </Text>
                      </View>

                      {/* Password Change Section */}
                      <View style={styles.settingsCategoryContainer}>
                        <Text style={styles.settingsCategoryTitle}>Change Password</Text>
                        
                        <View style={[styles.settingItem, { width: '100%' }]}>
                          <View style={[styles.authPasswordContainer, { width: '100%' }]}>
                            <TextInput
                              style={[styles.authInput, { flex: 1, paddingRight: 40, width: '100%' }]}
                              placeholder="Enter old password"
                              secureTextEntry={!showOldPassword}
                              value={oldPassword}
                              onChangeText={setOldPassword}
                              placeholderTextColor="#999"
                            />
                            <TouchableOpacity 
                              onPress={() => setShowOldPassword(!showOldPassword)} 
                              style={[styles.authPasswordToggle, { position: 'absolute', right: 8 }]}
                            >
                              <Icon name={showOldPassword ? 'eye' : 'eye-slash'} size={16} color="#666" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={[styles.settingItem, { marginTop: 20 }]}>
                          <View style={styles.authPasswordContainer}>
                            <TextInput
                              style={[
                                styles.authInput, 
                                { flex: 1, paddingRight: 40, width: '100%' },
                                newPasswordError && { borderColor: '#dc3545', borderWidth: 1 }
                              ]}
                              placeholder="Enter new password"
                              secureTextEntry={!showNewPassword}
                              value={newPassword}
                              onChangeText={(text) => {
                                setNewPassword(text);
                                if (text.length > 0) {
                                  const error = validatePassword(text);
                                  setNewPasswordError(error || '');
                                } else {
                                  setNewPasswordError('');
                                }
                                // Clear confirm password error if passwords now match
                                if (confirmPassword && text === confirmPassword) {
                                  setConfirmPasswordError('');
                                }
                              }}
                              onBlur={() => {
                                if (newPassword.length > 0) {
                                  const error = validatePassword(newPassword);
                                  setNewPasswordError(error || '');
                                }
                              }}
                              placeholderTextColor="#999"
                            />
                            <TouchableOpacity 
                              onPress={() => setShowNewPassword(!showNewPassword)} 
                              style={[styles.authPasswordToggle, { position: 'absolute', right: 8 }]}
                            >
                              <Icon name={showNewPassword ? 'eye' : 'eye-slash'} size={16} color="#666" />
                            </TouchableOpacity>
                          </View>
                          {newPasswordError && newPassword.length > 0 && (
                            <View style={{ marginTop: 4 }}>
                              <Text style={{ color: '#dc3545', fontSize: 12 }}>{newPasswordError}</Text>
                            </View>
                          )}
                        </View>

                        <View style={[styles.settingItem, { marginTop: 20 }]}>
                          <View style={styles.authPasswordContainer}>
                            <TextInput
                              style={[
                                styles.authInput, 
                                { flex: 1, paddingRight: 40, width: '100%' },
                                confirmPasswordError && { borderColor: '#dc3545', borderWidth: 1 }
                              ]}
                              placeholder="Confirm new password"
                              secureTextEntry={!showConfirmPassword}
                              value={confirmPassword}
                              onChangeText={(text) => {
                                setConfirmPassword(text);
                                if (text.length > 0 && newPassword.length > 0) {
                                  if (text !== newPassword) {
                                    setConfirmPasswordError('Passwords do not match');
                                  } else {
                                    setConfirmPasswordError('');
                                  }
                                } else {
                                  setConfirmPasswordError('');
                                }
                              }}
                              onBlur={() => {
                                if (confirmPassword.length > 0 && newPassword.length > 0) {
                                  if (confirmPassword !== newPassword) {
                                    setConfirmPasswordError('Passwords do not match');
                                  } else {
                                    setConfirmPasswordError('');
                                  }
                                }
                              }}
                              placeholderTextColor="#999"
                            />
                            <TouchableOpacity 
                              onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
                              style={[styles.authPasswordToggle, { position: 'absolute', right: 8 }]}
                            >
                              <Icon name={showConfirmPassword ? 'eye' : 'eye-slash'} size={16} color="#666" />
                            </TouchableOpacity>
                          </View>
                          {confirmPassword.length > 0 && (
                            <View style={{ marginTop: 4 }}>
                              {confirmPasswordError ? (
                                <Text style={{ color: '#dc3545', fontSize: 12 }}>{confirmPasswordError}</Text>
                              ) : confirmPassword === newPassword && newPassword.length > 0 ? (
                                <Text style={{ color: '#28a745', fontSize: 12 }}>✓ Passwords match</Text>
                              ) : null}
                            </View>
                          )}
                        </View>

                        <TouchableOpacity
                          style={[styles.authButton, { marginTop: 20, backgroundColor: '#28a745' }]}
                          onPress={async () => {
                            try {
                              // Validate password fields
                              if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
                                Alert.alert('Error', 'Please fill in all password fields');
                                return;
                              }

                              // Validate new password format
                              const passwordError = validatePassword(newPassword);
                              if (passwordError) {
                                Alert.alert('Error', passwordError);
                                return;
                              }

                              // Check if new passwords match
                              if (newPassword !== confirmPassword) {
                                Alert.alert('Error', 'New passwords do not match');
                                return;
                              }

                              // Check if user is logged in
                              if (!authToken) {
                                Alert.alert('Error', 'Please login to change your password');
                                return;
                              }

                              // Call password change API
                              await changePassword(authToken, oldPassword, newPassword);
                              
                              Alert.alert('Success', 'Password changed successfully!');
                              setOldPassword('');
                              setNewPassword('');
                              setConfirmPassword('');
                              setNewPasswordError('');
                              setConfirmPasswordError('');
                            } catch (error) {
                              console.error('Password change error:', error);
                              const errorMessage = error?.message || error?.toString() || 'Failed to change password. Please check your old password and try again.';
                              Alert.alert('Error', errorMessage);
                            }
                          }}
                        >
                          <Text style={styles.authButtonText}>Change Password</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Logout Section */}
                      {isLoggedIn && (
                        <View style={[styles.settingsCategoryContainer, { marginTop: 30 }]}>
                          <TouchableOpacity
                            style={[styles.authButton, { marginTop: 10, backgroundColor: '#dc3545' }]}
                            onPress={() => {
                              Alert.alert(
                                'Logout',
                                'Are you sure you want to logout?',
                                [
                                  { text: 'Cancel', style: 'cancel' },
                                  {
                                    text: 'Logout',
                                    style: 'destructive',
                                    onPress: async () => {
                                      try {
                                        if (authToken) {
                                          try {
                                            await logout(authToken);
                                          } catch (error) {
                                            console.error('Logout API error:', error);
                                          }
                                        }
                                      } catch (error) {
                                        console.error('Logout API error:', error);
                                      }

                                      setIsLoggedIn(false);
                                      setAuthToken(null);
                                      setCurrentUser(null);
                                      setUserProfile({ username: '', email: '', profilePicture: null });
                                      setSavedPins([]);
                                      setFeedbackHistory([]);
                                      
                                      try {
                                        await AsyncStorage.setItem('wasLoggedOut', 'true');
                                        await AsyncStorage.removeItem('authToken');
                                        await AsyncStorage.removeItem('currentUser');
                                        await AsyncStorage.removeItem('campus_trails_user');
                                      } catch (storageError) {
                                        console.error('Error clearing AsyncStorage on logout:', storageError);
                                      }
                                      
                                      setUserProfileVisible(false);
                                      setAuthModalVisible(true);
                                      setAuthTab('login');
                                    }
                                  }
                                ]
                              );
                            }}
                          >
                            <Text style={styles.authButtonText}>Logout</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                    </ScrollView>
                  </KeyboardAvoidingView>
                )}
                </View>
              </View>
            </Animated.View>
          </>
        )}
      </Modal>

      {/* Feedback Modal with Fade Animation */}
      <Modal
        visible={feedbackModalRendered}
        transparent={true}
        animationType="none"
        onRequestClose={() => setFeedbackModalVisible(false)}
      >
        {feedbackModalRendered && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: feedbackModalFadeAnim,
              }
            ]}
          >
            <View 
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: '#f5f5f5',
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  overflow: 'hidden',
                }
              ]}
            >
            <View style={styles.modalHeaderWhite}>
              <Text style={[styles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>
                {feedbackType === 'suggestion' ? 'Suggestions & Feedback' : `Give Feedback - ${selectedPin?.description || selectedPin?.title}`}
              </Text>
            </View>
            <View style={styles.lineDark}></View>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
              <ScrollView style={{ padding: 20 }}>
                {/* Rating Section */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={[styles.settingLabel, { marginBottom: 12 }]}>Rating</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setFeedbackRating(star)}
                        style={{ padding: 8 }}
                      >
                        <Icon
                          name={star <= feedbackRating ? 'star' : 'star-o'}
                          size={32}
                          color={star <= feedbackRating ? '#ffc107' : '#ccc'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Comment Section */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={[styles.settingLabel, { marginBottom: 12 }]}>Comment</Text>
                  <TextInput
                    style={[styles.authInput, { minHeight: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                    placeholder={feedbackType === 'suggestion' ? "Enter your suggestion here... (max 1000 characters)" : "Enter your feedback here... (max 250 characters)"}
                    multiline
                    numberOfLines={4}
                    maxLength={feedbackType === 'suggestion' ? 1000 : 250}
                    value={feedbackComment}
                    onChangeText={setFeedbackComment}
                    placeholderTextColor="#999"
                  />
                  <Text style={{ color: '#666', fontSize: 12, marginTop: 4, textAlign: 'right' }}>
                    {feedbackComment.length}/{feedbackType === 'suggestion' ? 1000 : 250}
                  </Text>
                  {feedbackComment.length > 0 && feedbackComment.length <= 5 && (
                    <Text style={{ color: '#dc3545', fontSize: 12, marginTop: 4 }}>
                      {feedbackType === 'suggestion' ? 'Suggestion must be more than 5 characters' : 'Feedback must be more than 5 characters'}
                    </Text>
                  )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.authButton, 
                    { 
                      backgroundColor: '#28a745', 
                      marginTop: 10,
                      opacity: feedbackComment.trim().length > 5 ? 1 : 0.5,
                    }
                  ]}
                  disabled={feedbackComment.trim().length <= 5}
                  onPress={async () => {
                    try {
                      if (feedbackComment.trim().length <= 5) {
                        Alert.alert('Error', 'Feedback must be more than 5 characters');
                        return;
                      }

                      const maxLength = feedbackType === 'suggestion' ? 1000 : 250;
                      if (feedbackComment.trim().length > maxLength) {
                        Alert.alert('Error', `Feedback cannot exceed ${maxLength} characters`);
                        return;
                      }

                      // Only logged-in users can submit feedback
                      if (!isLoggedIn || !authToken) {
                        Alert.alert(
                          'Login Required',
                          'You must be logged in to send feedback. Please log in or create an account.',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'Login', 
                              onPress: () => {
                                setFeedbackModalVisible(false);
                                setAuthModalVisible(true);
                              }
                            }
                          ]
                        );
                        return;
                      }

                      // Handle suggestions from About Us (use new endpoint)
                      if (feedbackType === 'suggestion') {
                        console.log('Submitting suggestion/feedback via new endpoint...');
                        
                        try {
                          // Get current campus ID
                          const campusId = currentCampus?._id || campusesData.find(c => c.name === campuses[0])?._id;
                          if (!campusId) {
                            Alert.alert('Error', 'Unable to determine campus. Please try again.');
                            return;
                          }
                          
                          // Submit to suggestions_and_feedbacks endpoint
                          const result = await submitSuggestionAndFeedback(authToken, {
                            campusId: campusId,
                            message: feedbackComment.trim(),
                            type: 'suggestion'
                          });
                          
                          console.log('✅ Suggestion submitted successfully:', result);
                          
                          // Reset form
                          setFeedbackComment('');
                          setFeedbackRating(5);
                          setFeedbackType('report'); // Reset to default
                          
                          // Close feedback screen
                          setFeedbackModalVisible(false);
                          
                          // Show success popup
                          setTimeout(() => {
                            Alert.alert(
                              'Success',
                              'Thank you for your suggestion!',
                              [{ text: 'OK', style: 'default' }],
                              { cancelable: false }
                            );
                          }, 300);
                        } catch (error) {
                          console.error('❌ Error submitting suggestion:', error);
                          Alert.alert('Error', error.message || 'Failed to submit suggestion. Please try again.');
                        }
                        return;
                      }
                      
                      // Handle reports (pin-specific feedback) - use existing feedbackHistory flow
                      if (selectedPin && selectedPin.id !== 'general') {
                        // Create feedback entry - ensure all fields match backend schema
                        const feedbackEntry = {
                          id: Date.now(), // Number type
                          pinId: selectedPin.id, // Number type
                          pinTitle: selectedPin.description || selectedPin.title || 'Unknown', // String type
                          rating: feedbackRating, // Number type (1-5)
                          comment: feedbackComment.trim(), // String type (validated: > 5 and <= 250)
                          date: new Date().toISOString(), // ISO string for Date type
                          feedbackType: 'report', // Always 'report' for pin-specific feedback
                        };
                        
                        // Ensure all required fields are present
                        if (!feedbackEntry.pinId || !feedbackEntry.pinTitle || !feedbackEntry.comment) {
                          Alert.alert('Error', 'Invalid feedback data. Please try again.');
                          return;
                        }

                        try {
                          console.log('Starting feedback save process...');
                          console.log('Feedback entry:', feedbackEntry);
                          
                          // Get current user data from database to ensure we have the latest feedbackHistory
                          const currentUser = await getCurrentUser(authToken);
                          console.log('Current user from DB:', currentUser);
                          const currentFeedbackHistory = currentUser.activity?.feedbackHistory || [];
                          console.log('Current feedback history from DB:', currentFeedbackHistory);
                          
                          // Add new feedback entry to the current feedback history
                          const updatedFeedbackHistory = [...currentFeedbackHistory, feedbackEntry];
                          console.log('Updated feedback history to save:', updatedFeedbackHistory);
                          
                          // Save to MongoDB
                          console.log('Saving to MongoDB...');
                          const saveResult = await updateUserActivity(authToken, {
                            feedbackHistory: updatedFeedbackHistory,
                          });
                          console.log('Save result from API:', saveResult);
                          
                          // Verify the save by fetching updated user
                          console.log('Verifying save by fetching updated user...');
                          const updatedUser = await getCurrentUser(authToken);
                          console.log('Updated user from DB after save:', updatedUser);
                          console.log('Feedback history in updated user:', updatedUser.activity?.feedbackHistory);
                          
                          setCurrentUser(updatedUser);
                          
                          // Update local state with confirmed data from database
                          if (updatedUser.activity && updatedUser.activity.feedbackHistory) {
                            console.log('Setting feedback history from DB:', updatedUser.activity.feedbackHistory);
                            const transformedFeedbacks = transformFeedbackData(updatedUser.activity.feedbackHistory);
                            setFeedbackHistory(transformedFeedbacks);
                          } else {
                            console.log('No feedback history in DB response, using local:', updatedFeedbackHistory);
                            setFeedbackHistory(updatedFeedbackHistory);
                          }
                          
                          // Save to AsyncStorage (for offline access)
                          await addFeedback({
                            pinId: selectedPin.id,
                            pinTitle: feedbackEntry.pinTitle,
                            rating: feedbackRating,
                            comment: feedbackComment.trim(),
                            feedbackType: 'report',
                          });
                          
                          console.log('✅ Feedback saved successfully to MongoDB:', feedbackEntry);
                          
                          // Reset form first
                          setFeedbackComment('');
                          setFeedbackRating(5);
                          setFeedbackType('report'); // Reset to default
                          
                          // Close feedback screen
                          setFeedbackModalVisible(false);
                          
                          // Show success popup after a brief delay
                          setTimeout(() => {
                            Alert.alert(
                              'Success',
                              'Thank you for your feedback!',
                              [{ text: 'OK', style: 'default' }],
                              { cancelable: false }
                            );
                          }, 300);
                        } catch (error) {
                          console.error('❌ Error syncing feedback to database:', error);
                          console.error('Error details:', {
                            message: error.message,
                            stack: error.stack,
                            response: error.response,
                          });
                          
                          // Check if error is due to validation
                          if (error.message && error.message.includes('more than 5 characters')) {
                            Alert.alert('Error', 'Feedback must be more than 5 characters');
                            return;
                          }
                          if (error.message && error.message.includes('250 characters')) {
                            Alert.alert('Error', 'Feedback cannot exceed 250 characters');
                            return;
                          }
                          // Show error but don't save locally if database fails
                          Alert.alert('Error', error.message || 'Failed to save feedback to database. Please try again.');
                          return;
                        }
                      }
                    } catch (error) {
                      console.error('Error saving feedback:', error);
                      Alert.alert('Error', error.message || 'Failed to save feedback. Please try again.');
                    }
                  }}
                >
                  <Text style={styles.authButtonText}>Submit Feedback</Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
            </View>
          </Animated.View>
        )}
      </Modal>

      {/* Filter Modal (replaces QR scanner) */}
      <Modal
        visible={filterModalRendered}
        transparent={true}
        animationType="none"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        {filterModalRendered && (
          <Animated.View 
            style={[
              StyleSheet.absoluteFill,
              styles.settingsScreen,
              {
                transform: [{ translateY: filterModalSlideAnim }],
              }
            ]}
          >
            <View style={styles.modalHeaderWhite}>
              <Text style={[styles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>Filter Pins</Text>
            </View>
            <View style={styles.lineDark}></View>
            
            {/* Selection Controls */}
            <View style={styles.filterTopControls}>
              <TouchableOpacity onPress={selectAllCategories} style={styles.filterSelectAllButton}>
                <Text style={styles.filterSelectAllButtonText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearAllCategories} style={styles.filterClearAllButton}>
                <Text style={styles.filterClearAllButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>

            {/* Category Groups */}
            <ScrollView style={{ width: '100%', backgroundColor: '#f5f5f5', paddingHorizontal: 16 }}>
              {[
                { 
                  title: 'Building Legends', 
                  items: [
                    { name: 'Commercial Zone', color: '#FF0000' },
                    { name: 'Admin / Operation Zone', color: '#800080' },
                    { name: 'Academic Core Zone', color: '#0000FF' },
                    { name: 'Auxiliary Services Zone', color: '#808080' }
                  ]
                },
                { 
                  title: 'Essentials & Utilities', 
                  items: [
                    { name: 'Dining', color: '#FFA500' },
                    { name: 'Comfort Rooms (CR)', color: '#ADD8E6' }
                  ]
                },
                { 
                  title: 'Research', 
                  items: [
                    { name: 'Research Zones', color: '#9C27B0' }
                  ]
                },
                { 
                  title: 'Safety & Access', 
                  items: [
                    { name: 'Clinic', color: '#FF0000' },
                    { name: 'Parking', color: '#D3D3D3' },
                    { name: 'Security', color: '#0000FF' }
                  ]
                }
              ].map(group => (
                <View key={group.title} style={styles.categoryGroup}>
                  <View style={styles.categoryHeaderContainer}>
                    <Text style={styles.categoryHeaderText}>{group.title}</Text>
                    <View style={styles.categoryHeaderUnderline}></View>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    {group.items.map(item => {
                      // Map display names to database category names
                      const categoryMap = {
                        'Commercial Zone': 'Commercial Zone',
                        'Admin / Operation Zone': 'Admin/Operation Zone',
                        'Academic Core Zone': 'Academic Core Zone',
                        'Auxiliary Services Zone': 'Auxillary Services Zone',
                        'Dining': 'Dining',
                        'Comfort Rooms (CR)': 'Comfort Rooms',
                        'Research Zones': 'Research Zones',
                        'Clinic': 'Clinic',
                        'Parking': 'Parking',
                        'Security': 'Security'
                      };
                      const dbCategory = categoryMap[item.name] || item.name;
                      return (
                        <TouchableOpacity 
                          key={item.name} 
                          style={[
                            styles.filterCategoryButton,
                            { width: '48%' }, // 2 columns with small gap
                            selectedCategories[item.name] && styles.filterCategoryButtonSelected
                          ]} 
                          onPress={() => toggleCategory(item.name)}
                        >
                          <ImageBackground 
                            source={getOptimizedImage(require('./assets/USTP.jpg'))} 
                            style={styles.filterCategoryButtonImage}
                            resizeMode="cover"
                            imageStyle={styles.filterCategoryButtonImageStyle}
                          >
                            <View style={styles.filterCategoryButtonContent}>
                              <Text style={styles.filterCategoryButtonText}>{item.name}</Text>
                              {selectedCategories[item.name] && (
                                <Icon name="check" size={16} color="#4CAF50" style={{ marginLeft: 'auto' }} />
                              )}
                            </View>
                          </ImageBackground>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={{ backgroundColor: '#f5f5f5', paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 }}>
              <TouchableOpacity style={[styles.closeButton, { alignSelf: 'stretch', marginTop: 8 }]} onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.closeText}>Done</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </Modal>

      {/* Screen for Pin Details (Clicked from map) */}
      {pinDetailModalRendered && (
        <Pressable 
          style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}
          onPress={() => setModalVisible(false)}
        >
          <Animated.View 
            style={[
              styles.pinDetailModalPanel,
              {
                transform: [{ translateY: pinDetailModalAnim }],
                opacity: pinDetailModalAnim.interpolate({
                  inputRange: [0, height / 2, height],
                  outputRange: [1, 0.5, 0],
                }),
              }
            ]}
            onStartShouldSetResponder={() => true}
          >
              <View style={styles.modalHeaderWhite}>
                <Text style={[styles.modalTitleWhite, { marginBottom: 0, flex: 1, marginRight: 12, paddingRight: 4, fontSize: 12 }]} numberOfLines={2} ellipsizeMode="tail">{selectedPin?.description}</Text>
              </View>
              <View style={styles.lineDark}></View>
              <ScrollView 
                style={{ flex: 1, backgroundColor: '#f5f5f5' }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 }}
              >
                <View style={{ backgroundColor: '#f5f5f5', paddingBottom: 4 }}>
            {(() => {
              const imageSource = getOptimizedImage(selectedPin?.image);
              if (typeof imageSource === 'number' || (imageSource && typeof imageSource === 'object' && !imageSource.uri)) {
                // Local asset - use React Native Image
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setFullscreenImageSource(imageSource);
                      setFullscreenImageVisible(true);
                    }}
                    activeOpacity={0.9}
                  >
                    <Image source={imageSource} style={styles.pinImage} resizeMode="cover" />
                  </TouchableOpacity>
                );
              } else {
                // Remote URL - use ExpoImage for caching
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setFullscreenImageSource(imageSource);
                      setFullscreenImageVisible(true);
                    }}
                    activeOpacity={0.9}
                  >
                    <ExpoImage source={imageSource} style={styles.pinImage} contentFit="cover" cachePolicy="disk" />
                  </TouchableOpacity>
                );
              }
            })()}
                </View>
                <View style={[styles.actionButtons, { backgroundColor: '#f5f5f5', paddingVertical: 4 }]}>
                  <TouchableOpacity 
                    style={[styles.iconButton, { flex: 1, marginRight: 5, width: 0 }]} 
                    onPress={() => {
                      if (selectedPin) {
                        // Set current pin as destination
                        setPointB(selectedPin);
                        // Close pin detail modal
              setModalVisible(false);
                        // Close other modals
                        setSearchVisible(false);
                        setCampusVisible(false);
                        setFilterModalVisible(false);
                        setSettingsVisible(false);
                        setPinsModalVisible(false);
                        // Open pathfinding panel
                        setShowPathfindingPanel(true);
                        setPathfindingMode(false);
                        setPath([]);
                      }
                    }}
                  >
                    <Icon name="location-arrow" size={16} color="white" />
                    <Text style={[styles.buttonText, { fontSize: 11 }]} numberOfLines={1}>Navigate</Text>
              </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.iconButton, { flex: 1, marginLeft: 5, width: 0 }]} 
                    onPress={() => {
                      if (selectedPin) {
                        // Highlight pin on map
                        setHighlightedPinOnMap(selectedPin.id);
                        // Close pin detail modal
                        setModalVisible(false);
                        // Close other modals
                        setSearchVisible(false);
                        setCampusVisible(false);
                        setFilterModalVisible(false);
                        setSettingsVisible(false);
                        setPinsModalVisible(false);
                        // Note: react-native-image-pan-zoom doesn't support programmatic zoom/pan
                        // The pin is highlighted in cyan color, making it easy to locate
                        // User can manually zoom/pan to the highlighted pin
                        setZoomToPin({ pin: selectedPin });
                      }
                    }}
                  >
                    <Icon name="map-marker" size={16} color="white" />
                    <Text style={[styles.buttonText, { fontSize: 11 }]} numberOfLines={1}>Show on Map</Text>
              </TouchableOpacity>
            </View>
                <View style={{ backgroundColor: '#f5f5f5', paddingTop: 4 }}>
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={() => {
                      // Show building details modal for all visible facility pins
                      if (selectedPin && selectedPin.isVisible === true) {
                        setCameFromPinDetails(true);
                        // Close modal immediately without animation
                        setPinDetailModalRendered(false);
                        setModalVisible(false);
                        setBuildingDetailsVisible(true);
                        // Set first floor from database, or default to level 0
                        const firstFloor = selectedPin?.floors?.[0];
                        setSelectedFloor(firstFloor ? firstFloor.level : 0);
                      } else {
                        setModalVisible(false);
                      }
                    }}
                  >
                    <Text style={styles.buttonText}>View More Details</Text>
                  </TouchableOpacity>
                 </View>
              </ScrollView>
            </Animated.View>
        </Pressable>
      )}

      {/* Building Details Screen - Bottom Slide-in Panel */}
      <Modal
        visible={buildingDetailsRendered && selectedPin && selectedPin.isVisible === true}
        transparent={true}
        animationType="none"
        onRequestClose={() => {
          setBuildingDetailsVisible(false);
          if (cameFromPinDetails) {
            setCameFromPinDetails(false);
            setModalVisible(true);
          }
        }}
      >
        {buildingDetailsRendered && (
          <Animated.View 
            style={[
              StyleSheet.absoluteFill,
              styles.settingsScreen,
              {
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                overflow: 'hidden',
                transform: [{ translateY: buildingDetailsSlideAnim }],
                opacity: buildingDetailsFadeAnim,
              }
            ]}
          >
            <ScrollView 
              style={styles.buildingDetailsContent}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View style={styles.buildingDetailsImageContainer}>
                {(() => {
                  const imageSource = getOptimizedImage(selectedPin.image);
                  if (typeof imageSource === 'number' || (imageSource && typeof imageSource === 'object' && !imageSource.uri)) {
                    // Local asset - use React Native Image
                    return (
                      <TouchableOpacity
                        onPress={() => {
                          setFullscreenImageSource(imageSource);
                          setFullscreenImageVisible(true);
                        }}
                        activeOpacity={0.9}
                      >
                        <Image source={imageSource} style={styles.buildingDetailsImage} resizeMode="cover" />
                      </TouchableOpacity>
                    );
                  } else {
                    // Remote URL - use ExpoImage for caching
                    return (
                      <TouchableOpacity
                        onPress={() => {
                          setFullscreenImageSource(imageSource);
                          setFullscreenImageVisible(true);
                        }}
                        activeOpacity={0.9}
                      >
                        <ExpoImage source={imageSource} style={styles.buildingDetailsImage} contentFit="cover" cachePolicy="disk" />
                      </TouchableOpacity>
                    );
                  }
                })()}
        </View>
              
              <View style={styles.buildingDetailsNameContainer}>
                <Text style={styles.buildingDetailsName}>{selectedPin.description}</Text>
              </View>
              
              <Text style={styles.buildingDetailsSectionTitle}>FACILITY LAYOUT DETAILS:</Text>
              
              <View style={styles.floorButtonsContainer}>
                {selectedPin?.floors && selectedPin.floors.length > 0 ? (
                  selectedPin.floors.map((floor, index) => {
                    // Format floor name: level 0 = "Ground Floor", level 1+ = "2nd Floor", "3rd Floor", etc.
                    const floorName = getFloorName(floor.level);
                    
                    return (
                      <TouchableOpacity
                        key={floor.level}
                        style={[
                          styles.floorButton,
                          selectedFloor === floor.level && styles.floorButtonSelected,
                          // Remove right margin for every 4th button (index 3, 7, 11, etc.) to align to right
                          (index + 1) % 4 === 0 && { marginRight: 0 }
                        ]}
                        onPress={() => setSelectedFloor(floor.level)}
                      >
                        <Text style={[
                          styles.floorButtonText,
                          selectedFloor === floor.level && styles.floorButtonTextSelected
                        ]}>
                          {floorName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={styles.floorButtonText}>No floors available</Text>
                )}
              </View>
              
              <View style={styles.giveFeedbackButtonContainer}>
                <TouchableOpacity 
                  style={[styles.giveFeedbackButton, { flex: 1, marginRight: 8 }]}
                  onPress={() => {
                    if (selectedPin) {
                      // Check if user is logged in
                      if (!isLoggedIn || !authToken) {
                        Alert.alert(
                          'Login Required',
                          'You must be logged in to give feedback. Please log in or create an account.',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'Login', 
                              onPress: () => setAuthModalVisible(true) 
                            }
                          ]
                        );
                        return;
                      }
                      // Set feedback type to 'report' for room problems
                      setFeedbackType('report');
                      setFeedbackModalVisible(true);
                    }
                  }}
                >
                  <Icon name="comment" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.giveFeedbackButtonText}>Report a Problem</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{
                    width: 44,
                    height: 44,
                    padding: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#007bff',
                    borderWidth: 1,
                    borderColor: '#007bff',
                    borderRadius: 8,
                    marginLeft: 8,
                  }}
                  onPress={() => {
                    if (selectedPin) {
                      // Generate offline QR code data using pin ID
                      // Format: campustrails://pin/{pinId} for deep linking
                      const qrData = selectedPin.qrCode 
                        ? `campustrails://qr/${selectedPin.qrCode}`
                        : `campustrails://pin/${selectedPin.id}`;
                      setQrCodeData(qrData);
                      setQrCodeVisible(true);
                    }
                  }}
                >
                  <Icon name="qrcode" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{
                    width: 44,
                    height: 44,
                    padding: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: savedPins.some(p => p.id === selectedPin?.id) ? '#dc3545' : '#fff',
                    borderWidth: 1,
                    borderColor: savedPins.some(p => p.id === selectedPin?.id) ? '#dc3545' : '#333',
                    borderRadius: 8,
                    marginLeft: 8,
                  }}
                  onPress={() => {
                    if (selectedPin) {
                      savePin();
                    }
                  }}
                >
                  <Icon name={savedPins.some(p => p.id === selectedPin?.id) ? "heart" : "heart-o"} size={20} color={savedPins.some(p => p.id === selectedPin?.id) ? "#fff" : "#333"} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.roomsTitle}>Areas:</Text>
              {selectedPin?.floors?.find(f => f.level === selectedFloor)?.rooms?.map((room) => {
                // Get the current floor for this room
                const currentFloor = selectedPin?.floors?.find(f => f.level === selectedFloor);
                // Convert room to pin-like object for saving
                const roomAsPin = {
                  id: room.name || room.id,
                  title: room.name,
                  description: `${selectedPin?.description || selectedPin?.title || 'Building'} - ${room.description || ''}`,
                  image: selectedPin?.image || require('./assets/USTP.jpg'),
                  x: selectedPin?.x || 0,
                  y: selectedPin?.y || 0,
                  buildingPin: selectedPin, // Store building pin reference
                  buildingId: selectedPin?.id, // Store building ID
                  floorLevel: currentFloor?.level ?? selectedFloor, // Store floor level
                  type: 'room', // Mark as room type
                };
                const isRoomSaved = savedPins.some(p => p.id === (room.name || room.id));
                return (
                  <View key={room.name || room.id} style={styles.roomCard}>
                    <Image
                      source={getOptimizedImage(selectedPin?.image || require('./assets/USTP.jpg'))}
                      style={styles.roomCardImage}
                      resizeMode="cover"
                    />
                    <View style={styles.roomCardContent}>
                      <Text style={styles.roomNumber}>{room.name}</Text>
                      <Text style={styles.roomDescription}>{room.description}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={async (e) => {
                        e.stopPropagation();
                        
                        // Check if user is logged in
                        if (!isLoggedIn || !authToken) {
                          Alert.alert(
                            'Login Required',
                            'You must be logged in to save rooms. Please login to continue.',
                            [
                              {
                                text: 'Cancel',
                                style: 'cancel',
                              },
                              {
                                text: 'Login',
                                onPress: () => {
                                  setBuildingDetailsVisible(false); // Close building details modal
                                  setAuthModalVisible(true);
                                  setAuthTab('login');
                                },
                              },
                            ]
                          );
                          return;
                        }
                        
                        try {
                          if (isRoomSaved) {
                            // Remove room from saved pins
                            const roomId = room.name || room.id;
                            const updatedSavedPins = savedPins.filter(p => p.id !== roomId);
                            setSavedPins(updatedSavedPins);
                            await removeSavedPin(roomId);
                            
                            // Sync with database if logged in
                            if (isLoggedIn && authToken) {
                              try {
                                await updateUserActivity(authToken, {
                                  savedPins: updatedSavedPins,
                                });
                                // Refresh user data to ensure consistency
                                const updatedUser = await getCurrentUser(authToken);
                                setCurrentUser(updatedUser);
                                // Enrich saved pins with full pin data
                                if (updatedUser.activity && updatedUser.activity.savedPins && pins && pins.length > 0) {
                                  const enrichedSavedPins = updatedUser.activity.savedPins.map(savedPin => {
                                    // For rooms, check if it's a room by looking for room.name or room.id
                                    const fullPin = pins.find(p => p.id === savedPin.id);
                                    if (fullPin) {
                                      // Merge: prioritize savedPin (database) properties, but use fullPin for missing ones
                                      return {
                                        ...fullPin,
                                        ...savedPin, // Database values take priority (description, name, etc.)
                                        image: savedPin.image || fullPin.image, // Use savedPin image if available, else fullPin
                                      };
                                    }
                                    return savedPin; // Use savedPin as-is if no fullPin found
                                  });
                                  setSavedPins(enrichedSavedPins);
                                } else {
                                  setSavedPins(updatedSavedPins);
                                }
                              } catch (error) {
                                console.error('Error syncing saved room removal to database:', error);
                              }
                            }
                            Alert.alert('Success', 'Room removed from saved pins');
                          } else {
                            // Save room
                            const updatedSavedPins = [...savedPins, roomAsPin];
                            setSavedPins(updatedSavedPins);
                            await addSavedPin(roomAsPin);
                            
                            // Sync with database if logged in
                            if (isLoggedIn && authToken) {
                              try {
                                await updateUserActivity(authToken, {
                                  savedPins: updatedSavedPins,
                                });
                                // Refresh user data to ensure consistency
                                const updatedUser = await getCurrentUser(authToken);
                                setCurrentUser(updatedUser);
                                // Enrich saved pins with full pin data
                                if (updatedUser.activity && updatedUser.activity.savedPins && pins && pins.length > 0) {
                                  const enrichedSavedPins = updatedUser.activity.savedPins.map(savedPin => {
                                    // For rooms, check if it's a room by looking for room.name or room.id
                                    const fullPin = pins.find(p => p.id === savedPin.id);
                                    if (fullPin) {
                                      // Merge: prioritize savedPin (database) properties, but use fullPin for missing ones
                                      return {
                                        ...fullPin,
                                        ...savedPin, // Database values take priority (description, name, etc.)
                                        image: savedPin.image || fullPin.image, // Use savedPin image if available, else fullPin
                                      };
                                    }
                                    return savedPin; // Use savedPin as-is if no fullPin found
                                  });
                                  setSavedPins(enrichedSavedPins);
                                } else {
                                  setSavedPins(updatedSavedPins);
                                }
                              } catch (error) {
                                console.error('Error syncing saved room to database:', error);
                              }
                            }
                            Alert.alert('Success', 'Room saved successfully!');
                          }
                        } catch (error) {
                          console.error('Error saving room:', error);
                          Alert.alert('Error', 'Failed to save room. Please try again.');
                        }
                      }}
                      style={{
                        padding: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Icon name={isRoomSaved ? "heart" : "heart-o"} size={20} color={isRoomSaved ? "#dc3545" : "#999"} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}
      </Modal>

      {/* User Auth Modal - Login and Registration Tabs */}
      <Modal
        visible={authModalRendered}
        transparent={true}
        animationType="none"
        onRequestClose={toggleAuthModal}
      >
        {authModalRendered && (
          <>
            <Animated.View 
              style={[
                StyleSheet.absoluteFill,
                styles.settingsModalBackdrop,
                {
                  opacity: authModalSlideAnim.interpolate({
                    inputRange: [0, height / 2, height],
                    outputRange: [1, 0.5, 0],
                  }),
                }
              ]}
            />
            <Animated.View 
              style={[
                StyleSheet.absoluteFill,
                styles.authModalFullScreen,
                {
                  transform: [{ translateY: authModalSlideAnim }],
                }
              ]}
            >
              <KeyboardAvoidingView 
                style={styles.authModalFullScreen}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
              >
            {/* Header */}
            <View style={[styles.authModalHeader, { paddingTop: Platform.OS === 'ios' ? 50 : 20 }]}>
              <View style={{ flex: 1 }}></View>
            </View>

            {/* Tab Buttons */}
            <View style={styles.authTabRow}>
              <TouchableOpacity 
                onPress={() => {
                  setAuthTab('login');
                  setAuthError(null);
                }} 
                style={[styles.authTabButton, authTab === 'login' && styles.authTabActive, { flex: 1 }]}
              >
                <Text style={authTab === 'login' ? styles.authTabActiveText : styles.authTabInactiveText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  setAuthTab('register');
                  setAuthError(null);
                }} 
                style={[styles.authTabButton, authTab === 'register' && styles.authTabActive, { flex: 1 }]}
              >
                <Text style={authTab === 'register' ? styles.authTabActiveText : styles.authTabInactiveText}>Register</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.authModalContent}>
              <View style={styles.authContentWrapper}>
                {/* Logo - Smaller */}
                <View style={styles.authLogoContainer}>
                  <Image 
                    source={require('./assets/logo-no-bg.png')} 
                    style={styles.authLogoImage}
                    resizeMode="contain"
                  />
                </View>

                {/* Login Tab */}
                {authTab === 'login' && (
                  <View style={styles.authFormContainer}>
                  <View style={styles.authInputContainer}>
                    <Text style={styles.authInputLabel}>Username</Text>
                    <TextInput
                      style={styles.authInput}
                      placeholder="Enter username"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      placeholderTextColor="#999"
                    />
                  </View>

                  <View style={styles.authInputContainer}>
                    <Text style={styles.authInputLabel}>Password</Text>
                    <View style={styles.authPasswordContainer}>
                      <TextInput
                        style={[styles.authInput, { flex: 1, paddingRight: 40, width: '100%' }]}
                        placeholder="Enter password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        placeholderTextColor="#999"
                      />
                      <TouchableOpacity
                        style={[styles.authPasswordToggle, { position: 'absolute', right: 8 }]}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Icon name={showPassword ? "eye" : "eye-slash"} size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.authButton, authLoading && { opacity: 0.6 }]}
                    onPress={async () => {
                      try {
                        // Clear previous errors
                        setAuthError(null);
                        setAuthLoading(true);

                        // Validate username
                        const usernameError = validateUsername(username);
                        if (usernameError) {
                          setAuthError(usernameError);
                          setAuthLoading(false);
                          return;
                        }
                        
                        // Validate password
                        const passwordError = validatePassword(password);
                        if (passwordError) {
                          setAuthError(passwordError);
                          setAuthLoading(false);
                          return;
                        }
                        
                        // Call login API
                        const result = await login(username, password);
                        
                        // Store token and user data
                        setAuthToken(result.token);
                        setCurrentUser(result.user);
                        setIsLoggedIn(true);
                        
                        // Save to AsyncStorage for persistence
                        try {
                          await AsyncStorage.setItem('authToken', result.token);
                          await AsyncStorage.setItem('currentUser', JSON.stringify(result.user));
                          // Clear logout flag if it exists
                          await AsyncStorage.removeItem('wasLoggedOut');
                        } catch (storageError) {
                          console.error('Error saving to AsyncStorage:', storageError);
                        }
                        
                        // Update user profile state
                        setUserProfile({
                          username: result.user.username,
                          email: result.user.email || '',
                          profilePicture: result.user.profilePicture || null,
                        });
                        
                        // Load saved pins and feedback history from user activity
                        if (result.user.activity) {
                          const savedPinsFromDB = result.user.activity.savedPins || [];
                          // Enrich saved pins with full pin data if available
                          if (pins && pins.length > 0) {
                            const enrichedSavedPins = savedPinsFromDB.map(savedPin => {
                              const fullPin = pins.find(p => p.id === savedPin.id);
                              if (fullPin) {
                                // Merge: prioritize savedPin (database) properties, but use fullPin for missing ones
                                return {
                                  ...fullPin,
                                  ...savedPin, // Database values take priority (description, name, etc.)
                                  image: savedPin.image || fullPin.image, // Use savedPin image if available, else fullPin
                                };
                              }
                              return savedPin; // Use savedPin as-is if no fullPin found
                            });
                            setSavedPins(enrichedSavedPins);
                          } else {
                            setSavedPins(savedPinsFromDB);
                          }
                          const transformedFeedbacks = transformFeedbackData(result.user.activity.feedbackHistory);
                          setFeedbackHistory(transformedFeedbacks);
                        }
                        
                        // Update saved pins and feedback history
                        // Enrich saved pins with full pin data including images
                        if (result.user.activity) {
                          const savedPinsFromDB = result.user.activity.savedPins || [];
                          if (pins && pins.length > 0) {
                            const enrichedSavedPins = savedPinsFromDB.map(savedPin => {
                              const fullPin = pins.find(p => p.id === savedPin.id);
                              if (fullPin) {
                                // Merge: prioritize savedPin (database) properties, but use fullPin for missing ones
                                return {
                                  ...fullPin,
                                  ...savedPin, // Database values take priority (description, name, etc.)
                                  image: savedPin.image || fullPin.image, // Use savedPin image if available, else fullPin
                                };
                              }
                              return savedPin; // Use savedPin as-is if no fullPin found
                            });
                            setSavedPins(enrichedSavedPins);
                          } else {
                            setSavedPins(savedPinsFromDB);
                          }
                          const transformedFeedbacks = transformFeedbackData(result.user.activity.feedbackHistory);
                          setFeedbackHistory(transformedFeedbacks);
                        }
                        
                        // Update settings
                        if (result.user.settings) {
                          setAlertPreferences({
                            facilityUpdates: result.user.settings.alerts?.facilityUpdates !== false,
                            securityAlerts: result.user.settings.alerts?.securityAlerts !== false,
                          });
                        }
                        
                        // Close modal and reset form
                        setAuthModalVisible(false);
                        setUsername('');
                        setPassword('');
                        setAuthLoading(false);
                        
                        // Show User Profile modal after successful login
                        setTimeout(() => {
                          setUserProfileVisible(true);
                        }, 300);
                        
                        Alert.alert('Success', 'Login successful!');
                      } catch (error) {
                        console.error('Login error:', error);
                        setAuthError(error.message || 'Login failed. Please try again.');
                        setAuthLoading(false);
                      }
                    }}
                    disabled={authLoading}
                  >
                    <Text style={styles.authButtonText}>
                      {authLoading ? 'Logging in...' : 'Login'}
                    </Text>
                  </TouchableOpacity>
                  
                  {authError && (
                    <Text style={{ color: '#dc3545', fontSize: 12, marginTop: 10, textAlign: 'center' }}>
                      {authError}
                    </Text>
                  )}

                  <View style={styles.authLinksContainer}>
                    <TouchableOpacity onPress={() => {
                      setAuthTab('forgot');
                      setAuthError(null);
                      setRegEmail('');
                    }}>
                      <Text style={styles.authLink}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </View>
                )}

                {/* Register Tab */}
                {authTab === 'register' && (
                  <View style={styles.authFormContainer}>
                  <View style={styles.authInputContainer}>
                    <Text style={styles.authInputLabel}>Username</Text>
                    <TextInput
                      style={styles.authInput}
                      placeholder="Enter username"
                      value={regUsername}
                      onChangeText={setRegUsername}
                      autoCapitalize="none"
                      placeholderTextColor="#999"
                    />
                  </View>

                  <View style={styles.authInputContainer}>
                    <Text style={styles.authInputLabel}>Email</Text>
                    <TextInput
                      style={styles.authInput}
                      placeholder="Enter email address"
                      value={regEmail}
                      onChangeText={setRegEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      placeholderTextColor="#999"
                    />
                  </View>

                  <View style={styles.authInputContainer}>
                    <Text style={styles.authInputLabel}>Password</Text>
                    <View style={styles.authPasswordContainer}>
                      <TextInput
                        style={[styles.authInput, { flex: 1, paddingRight: 40, width: '100%' }]}
                        placeholder="Enter password"
                        value={regPassword}
                        onChangeText={setRegPassword}
                        secureTextEntry={!showRegPassword}
                        autoCapitalize="none"
                        placeholderTextColor="#999"
                      />
                      <TouchableOpacity
                        style={[styles.authPasswordToggle, { position: 'absolute', right: 8 }]}
                        onPress={() => setShowRegPassword(!showRegPassword)}
                      >
                        <Icon name={showRegPassword ? "eye" : "eye-slash"} size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.authInputContainer}>
                    <Text style={styles.authInputLabel}>Confirm Password</Text>
                    <View style={styles.authPasswordContainer}>
                      <TextInput
                        style={[styles.authInput, { flex: 1, paddingRight: 40, width: '100%' }]}
                        placeholder="Confirm password"
                        value={regConfirmPassword}
                        onChangeText={setRegConfirmPassword}
                        secureTextEntry={!showRegConfirmPassword}
                        autoCapitalize="none"
                        placeholderTextColor="#999"
                      />
                      <TouchableOpacity
                        style={[styles.authPasswordToggle, { position: 'absolute', right: 8 }]}
                        onPress={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      >
                        <Icon name={showRegConfirmPassword ? "eye" : "eye-slash"} size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.authInputContainer}>
                    <Text style={styles.authInputLabel}>Secret Question (for password recovery)</Text>
                    <TouchableOpacity
                      style={[styles.authInput, { justifyContent: 'center', minHeight: 50 }]}
                      onPress={() => setShowSecretQuestionPicker(true)}
                    >
                      <Text style={{ color: regSecretQuestion ? '#000' : '#999' }}>
                        {regSecretQuestion || 'Select a secret question...'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Secret Question Picker Modal */}
                  <Modal
                    visible={showSecretQuestionPicker}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowSecretQuestionPicker(false)}
                  >
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                      <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '50%' }}>
                        <View style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: '#ddd', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Select Secret Question</Text>
                          <TouchableOpacity onPress={() => setShowSecretQuestionPicker(false)}>
                            <Icon name="times" size={20} color="#666" />
                          </TouchableOpacity>
                        </View>
                        <FlatList
                          data={secretQuestions}
                          keyExtractor={(item, index) => index.toString()}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}
                              onPress={() => {
                                setRegSecretQuestion(item);
                                setShowSecretQuestionPicker(false);
                              }}
                            >
                              <Text style={{ fontSize: 14 }}>{item}</Text>
                            </TouchableOpacity>
                          )}
                        />
                      </View>
                    </View>
                  </Modal>

                  <View style={styles.authInputContainer}>
                    <Text style={styles.authInputLabel}>Secret Answer</Text>
                    <TextInput
                      style={styles.authInput}
                      placeholder="Enter your secret answer"
                      value={regSecretAnswer}
                      onChangeText={setRegSecretAnswer}
                      autoCapitalize="none"
                      placeholderTextColor="#999"
                    />
                  </View>

                  <TouchableOpacity 
                    style={[styles.authButton, authLoading && { opacity: 0.6 }]}
                    onPress={async () => {
                      try {
                        // Clear previous errors
                        setAuthError(null);
                        setAuthLoading(true);

                        // Check if all fields are filled
                        if (!regUsername || !regEmail || !regPassword || !regConfirmPassword || !regSecretQuestion || !regSecretAnswer) {
                          setAuthError('Please fill in all fields');
                          setAuthLoading(false);
                          return;
                        }
                        
                        if (regSecretAnswer.trim().length < 2) {
                          setAuthError('Secret answer must be at least 2 characters long');
                          setAuthLoading(false);
                          return;
                        }
                        
                        // Validate username
                        const usernameError = validateUsername(regUsername);
                        if (usernameError) {
                          setAuthError(usernameError);
                          setAuthLoading(false);
                          return;
                        }
                        
                        // Validate email
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(regEmail)) {
                          setAuthError('Please enter a valid email address');
                          setAuthLoading(false);
                          return;
                        }
                        
                        // Validate password
                        const passwordError = validatePassword(regPassword);
                        if (passwordError) {
                          setAuthError(passwordError);
                          setAuthLoading(false);
                          return;
                        }
                        
                        // Check if passwords match
                        if (regPassword !== regConfirmPassword) {
                          setAuthError('Passwords do not match');
                          setAuthLoading(false);
                          return;
                        }
                        
                        // Call register API
                        const result = await register(regUsername, regEmail, regPassword, regSecretQuestion, regSecretAnswer);
                        
                        // Reset form first
                        setRegUsername('');
                        setRegEmail('');
                        setRegPassword('');
                        setRegConfirmPassword('');
                        setRegSecretQuestion('');
                        setRegSecretAnswer('');
                        setAuthLoading(false);
                        
                        // Show success popup first (do NOT automatically login)
                        Alert.alert(
                          'Success',
                          'Registration successful! Welcome to Campus Trails! Please login to continue.',
                          [
                            {
                              text: 'OK',
                              style: 'default',
                              onPress: () => {
                                // After user closes success popup, switch to login tab
                                setAuthTab('login');
                                // Clear any errors
                                setAuthError(null);
                              }
                            }
                          ],
                          { cancelable: false }
                        );
                        
                        // Note: We don't automatically login or store tokens after registration
                        // User must login manually after successful registration
                      } catch (error) {
                        console.error('Registration error:', error);
                        setAuthError(error.message || 'Registration failed. Please try again.');
                        setAuthLoading(false);
                      }
                    }}
                    disabled={authLoading}
                  >
                    <Text style={styles.authButtonText}>
                      {authLoading ? 'Registering...' : 'Register'}
                    </Text>
                  </TouchableOpacity>
                  
                  {authError && (
                    <Text style={{ color: '#dc3545', fontSize: 12, marginTop: 10, textAlign: 'center' }}>
                      {authError}
                    </Text>
                  )}
                  </View>
                )}

                {/* Forgot Password Tab */}
                {authTab === 'forgot' && (
                  <View style={styles.authFormContainer}>
                    {!forgotSecretQuestion ? (
                      <>
                        <View style={styles.authInputContainer}>
                          <Text style={styles.authInputLabel}>Email</Text>
                          <TextInput
                            style={styles.authInput}
                            placeholder="Enter your email"
                            value={regEmail}
                            onChangeText={setRegEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            placeholderTextColor="#999"
                          />
                        </View>

                        <TouchableOpacity 
                          style={[styles.authButton, authLoading && { opacity: 0.6 }]}
                          onPress={async () => {
                            try {
                              setAuthError(null);
                              setAuthLoading(true);

                              if (!regEmail || regEmail.trim() === '') {
                                setAuthError('Please enter your email');
                                setAuthLoading(false);
                                return;
                              }

                              const response = await forgotPassword(regEmail.trim());
                              
                              if (response.success && response.secretQuestion) {
                                setForgotSecretQuestion(response.secretQuestion);
                                setAuthError(null);
                              } else {
                                setAuthError(response.message || 'Unable to reset password. Please contact support.');
                              }
                              setAuthLoading(false);
                            } catch (error) {
                              console.error('Forgot password error:', error);
                              setAuthError(error.message || 'Failed to get secret question. Please try again.');
                              setAuthLoading(false);
                            }
                          }}
                          disabled={authLoading}
                        >
                          <Text style={styles.authButtonText}>
                            {authLoading ? 'Loading...' : 'Get Secret Question'}
                          </Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <View style={styles.authInputContainer}>
                          <Text style={styles.authInputLabel}>Secret Question</Text>
                          <Text style={{ color: '#666', fontSize: 14, marginBottom: 10, fontStyle: 'italic' }}>
                            {forgotSecretQuestion}
                          </Text>
                        </View>

                        <View style={styles.authInputContainer}>
                          <Text style={styles.authInputLabel}>Secret Answer</Text>
                          <TextInput
                            style={styles.authInput}
                            placeholder="Enter your secret answer"
                            value={forgotSecretAnswer}
                            onChangeText={setForgotSecretAnswer}
                            autoCapitalize="none"
                            placeholderTextColor="#999"
                          />
                        </View>

                        <View style={styles.authInputContainer}>
                          <Text style={styles.authInputLabel}>New Password</Text>
                          <View style={styles.authPasswordContainer}>
                            <TextInput
                              style={[styles.authInput, { flex: 1, paddingRight: 40, width: '100%' }]}
                              placeholder="Enter new password"
                              value={forgotNewPassword}
                              onChangeText={setForgotNewPassword}
                              secureTextEntry={!showForgotPassword}
                              autoCapitalize="none"
                              placeholderTextColor="#999"
                            />
                            <TouchableOpacity
                              style={[styles.authPasswordToggle, { position: 'absolute', right: 8 }]}
                              onPress={() => setShowForgotPassword(!showForgotPassword)}
                            >
                              <Icon name={showForgotPassword ? "eye" : "eye-slash"} size={16} color="#666" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={styles.authInputContainer}>
                          <Text style={styles.authInputLabel}>Confirm New Password</Text>
                          <View style={styles.authPasswordContainer}>
                            <TextInput
                              style={[styles.authInput, { flex: 1, paddingRight: 40, width: '100%' }]}
                              placeholder="Confirm new password"
                              value={forgotConfirmPassword}
                              onChangeText={setForgotConfirmPassword}
                              secureTextEntry={!showForgotConfirmPassword}
                              autoCapitalize="none"
                              placeholderTextColor="#999"
                            />
                            <TouchableOpacity
                              style={[styles.authPasswordToggle, { position: 'absolute', right: 8 }]}
                              onPress={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                            >
                              <Icon name={showForgotConfirmPassword ? "eye" : "eye-slash"} size={16} color="#666" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <TouchableOpacity 
                          style={[styles.authButton, authLoading && { opacity: 0.6 }]}
                          onPress={async () => {
                            try {
                              setAuthError(null);
                              setAuthLoading(true);

                              if (!forgotSecretAnswer || !forgotNewPassword || !forgotConfirmPassword) {
                                setAuthError('Please fill in all fields');
                                setAuthLoading(false);
                                return;
                              }

                              const passwordError = validatePassword(forgotNewPassword);
                              if (passwordError) {
                                setAuthError(passwordError);
                                setAuthLoading(false);
                                return;
                              }

                              if (forgotNewPassword !== forgotConfirmPassword) {
                                setAuthError('Passwords do not match');
                                setAuthLoading(false);
                                return;
                              }

                              await resetPassword(regEmail.trim(), forgotSecretAnswer.trim(), forgotNewPassword);
                              
                              Alert.alert(
                                'Success',
                                'Password has been reset successfully! You can now login with your new password.',
                                [
                                  {
                                    text: 'OK',
                                    onPress: () => {
                                      setAuthTab('login');
                                      setRegEmail('');
                                      setForgotSecretQuestion('');
                                      setForgotSecretAnswer('');
                                      setForgotNewPassword('');
                                      setForgotConfirmPassword('');
                                    }
                                  }
                                ],
                                { cancelable: false }
                              );
                              setAuthLoading(false);
                            } catch (error) {
                              console.error('Reset password error:', error);
                              setAuthError(error.message || 'Failed to reset password. Please check your secret answer.');
                              setAuthLoading(false);
                            }
                          }}
                          disabled={authLoading}
                        >
                          <Text style={styles.authButtonText}>
                            {authLoading ? 'Resetting...' : 'Reset Password'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={{ marginTop: 10 }}
                          onPress={() => {
                            setForgotSecretQuestion('');
                            setForgotSecretAnswer('');
                            setForgotNewPassword('');
                            setForgotConfirmPassword('');
                            setAuthError(null);
                          }}
                        >
                          <Text style={{ color: '#666', fontSize: 12, textAlign: 'center' }}>
                            ← Back to email input
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                    
                    {authError && (
                      <Text style={{ color: '#dc3545', fontSize: 12, marginTop: 10, textAlign: 'center' }}>
                        {authError}
                      </Text>
                    )}

                    <View style={{ marginTop: 20, alignItems: 'center' }}>
                      <Text style={{ color: '#666', fontSize: 12, textAlign: 'center' }}>
                        Remember your password?{' '}
                        <Text 
                          style={{ color: '#28a745', textDecorationLine: 'underline' }}
                          onPress={() => {
                            setAuthTab('login');
                            setRegEmail('');
                            setForgotSecretQuestion('');
                            setForgotSecretAnswer('');
                            setForgotNewPassword('');
                            setForgotConfirmPassword('');
                          }}
                        >
                          Login here
                        </Text>
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
              </KeyboardAvoidingView>
            </Animated.View>
          </>
        )}
      </Modal>

      {/* Main Search Modal */}
      {searchRendered && (
        <Animated.View 
          style={[
            styles.searchContainer,
            {
              opacity: searchAnim,
              transform: [
                {
                  translateY: searchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            }
          ]}
        >
          <View style={styles.modalHeaderWhite}>
            <Text style={[styles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>Search</Text>
          </View>
          <View style={styles.lineDark}></View>
          <View style={{ backgroundColor: '#f5f5f5', padding: 10 }}>
          <TextInput
            placeholder="Search for..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          <FlatList
              data={searchResults}
              keyExtractor={(item, index) => item.type === 'room' ? `room-${item.id}-${index}` : item.id.toString()}
            renderItem={({ item }) => (
                <TouchableOpacity 
                  onPress={() => {
                    if (item.type === 'room') {
                      // Find the building that contains this room
                      // Prefer buildingPin from item (already has floors data)
                      let buildingPin = item.buildingPin;
                      
                      // If not available, find it from pins array
                      if (!buildingPin) {
                        buildingPin = pins.find(p => 
                          (p.buildingNumber || p.id) === item.buildingId ||
                          p.id === item.buildingId ||
                          String(p.buildingNumber || p.id) === String(item.buildingId)
                        );
                      }
                      
                      if (buildingPin) {
                        // Find the floor level based on the structure in addFloorsAndRooms.js:
                        // level: 0 = Ground Floor
                        // level: 1 = 2nd Floor (where ICT 202 is)
                        // level: 2 = 3rd Floor
                        // etc.
                        let floorLevel = null;
                        
                        // First, try to get it directly from the room item (most reliable)
                        if (typeof item.floorLevel === 'number') {
                          floorLevel = item.floorLevel;
                          console.log('✅ Room search - Using floorLevel from item:', item.name, '→ Floor Level:', floorLevel, '(0=Ground, 1=2nd, 2=3rd, etc.)');
                        } else {
                          // If not in item, search through building floors to find which floor contains this room
                          // This matches the structure in addFloorsAndRooms.js where each floor has a level property
                          if (buildingPin.floors && Array.isArray(buildingPin.floors)) {
                            console.log('🔍 Searching through', buildingPin.floors.length, 'floors for room:', item.name);
                            for (const floor of buildingPin.floors) {
                              if (floor.rooms && Array.isArray(floor.rooms)) {
                                const roomFound = floor.rooms.find(r => {
                                  const roomNameMatch = r.name && item.name && 
                                    (r.name === item.name || r.name.toLowerCase() === item.name.toLowerCase());
                                  const roomIdMatch = (r.id && item.id && r.id === item.id);
                                  return roomNameMatch || roomIdMatch;
                                });
                                if (roomFound) {
                                  // Use floor.level directly (matches structure: level 0=Ground, 1=2nd, 2=3rd, etc.)
                                  floorLevel = floor.level;
                                  const floorName = getFloorName(floor.level);
                                  console.log('✅ Room search - Found room in floor:', item.name, '→ Floor Level:', floorLevel, '(', floorName, ')');
                                  break;
                                }
                              }
                            }
                          }
                          
                          // Fallback to first floor if not found
                          if (floorLevel === null) {
                            floorLevel = buildingPin.floors?.[0]?.level || 0;
                            console.log('⚠️ Room search - Floor not found, using default:', item.name, '→ Floor Level:', floorLevel);
                          }
                        }
                        
                        // Validate floor level is a number
                        if (typeof floorLevel !== 'number') {
                          console.error('❌ Invalid floor level:', floorLevel, 'for room:', item.name);
                          floorLevel = buildingPin.floors?.[0]?.level || 0;
                        }
                        
                        console.log('🏢 Room search - Final:', {
                          room: item.name,
                          building: buildingPin.description || buildingPin.title,
                          floorLevel: floorLevel,
                          floorName: getFloorName(floorLevel),
                          buildingFloors: buildingPin.floors?.length || 0,
                          availableFloors: buildingPin.floors?.map(f => `Level ${f.level}`).join(', ') || 'none'
                        });
                        
                        // Set the building pin
                        setSelectedPin(buildingPin);
                        setClickedPin(buildingPin.id);
                        setHighlightedPinOnMap(null);
                        
                        // Close search modal
                        setSearchVisible(false);
                        // Close other modals
                        setCampusVisible(false);
                        setFilterModalVisible(false);
                        setShowPathfindingPanel(false);
                        setSettingsVisible(false);
                        setPinsModalVisible(false);
                        
                        // Open Building Details Modal with correct floor
                        setCameFromPinDetails(false);
                        
                        // Store floor level in ref for useEffect to use (must be set before opening modal)
                        // Floor level structure: 0=Ground, 1=2nd, 2=3rd, etc. (matches addFloorsAndRooms.js)
                        floorFromRoomRef.current = floorLevel;
                        hasSetFloorFromRoom.current = false; // Reset flag before opening
                        console.log('📌 Stored floor level in ref:', floorLevel, '(will highlight', getFloorName(floorLevel), 'button)');
                        
                        // Set the floor immediately before opening modal to ensure floor button responds
                        setSelectedFloor(floorLevel);
                        
                        // Open building details modal (useEffect will also set the floor from ref as backup)
                        setBuildingDetailsVisible(true);
                      } else {
                        Alert.alert('Building Not Found', `Could not find building for room: ${item.name}`);
                      }
                    } else {
                      handlePinPress(item);
                    }
                  }} 
                  style={styles.searchItemContainer}
                >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    {/* Heart icon for saved pins - moved to left side */}
                    {(() => {
                      const isSaved = savedPins.some(p => {
                        if (item.type === 'room') {
                          return p.id === (item.name || item.id) || p.title === item.name;
                        } else {
                          return p.id === item.id;
                        }
                      });
                      if (isSaved) {
                        return (
                          <Icon 
                            name="heart" 
                            size={16} 
                            color="#dc3545" 
                            style={{ marginRight: 8 }}
                          />
                        );
                      }
                      return null;
                    })()}
                    <Text style={styles.searchItem} numberOfLines={1}>
                      <Text style={styles.searchDescription}>
                        {item.type === 'room' 
                          ? `${item.name}${item.description ? ` - ${item.description}` : ''}` 
                          : item.description}
                      </Text>
                    </Text>
                  </View>
                  {item.type === 'room' && (
                    <View style={{ marginTop: 4 }}>
                      <Text style={{ fontSize: 12, color: '#6c757d' }}>
                        {item.buildingPin ? `${item.buildingPin.description || item.buildingPin.title}` : ''}
                        {item.floorLevel !== undefined ? ` • ${getFloorName(item.floorLevel)}` : (item.floor ? ` • ${item.floor}` : '')}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
        </Animated.View>
      )}

      {/* View All Pins Modal - Bottom Slide-in Panel */}
      <Modal
        visible={pinsModalRendered}
        transparent={true}
        animationType="none"
        onRequestClose={togglePinsModal}
      >
        {pinsModalRendered && (
          <>
            <Animated.View 
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: '#f5f5f5',
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  overflow: 'hidden',
                  transform: [{ translateY: pinsModalSlideAnim }],
                  opacity: pinsModalSlideAnim.interpolate({
                    inputRange: [0, 150, 300],
                    outputRange: [1, 0.5, 0],
                  }),
                }
              ]}
            >
          {/* Header */}
          <View style={styles.pinsModalHeader}>
            <Text style={[styles.pinsModalCampusTitle, { textAlign: 'center' }]}>USTP-CDO</Text>
          </View>
          
          {/* Search Input */}
          <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#fff',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#ddd',
              paddingHorizontal: 12,
              height: 45,
            }}>
              <Icon name="search" size={18} color="#999" style={{ marginRight: 10 }} />
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 16,
                  color: '#333',
                }}
                placeholder="Search pins..."
                placeholderTextColor="#999"
                value={pinsModalSearchQuery}
                onChangeText={setPinsModalSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {pinsModalSearchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setPinsModalSearchQuery('')}
                  style={{ padding: 5 }}
                >
                  <Icon name="times-circle" size={18} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Categorized Facility List */}
          <ScrollView style={styles.facilityList} contentContainerStyle={styles.facilityListContent}>
            {categorizedPins.map((category, categoryIndex) => (
              <View key={category.title} style={{ marginBottom: 20 }}>
                <View style={styles.categoryHeaderContainer}>
                  <Text style={styles.categoryHeaderText}>{category.title}</Text>
                  <View style={styles.categoryHeaderUnderline}></View>
          </View>
                {category.pins.map((pin) => {
                  const isPinSaved = savedPins.some(p => p.id === pin.id);
                  return (
                    <TouchableOpacity 
                      key={pin.id.toString()} 
                      onPress={() => {
                        if (activeSelector) {
                          // Handle pathfinding location selection
                          if (activeSelector === 'A') {
                            setPointA(pin);
                          } else if (activeSelector === 'B') {
                            setPointB(pin);
                          }
                          setPinsModalVisible(false);
                          setActiveSelector(null);
                        } else {
                          // Handle normal pin press
                          handlePinPress(pin);
                        }
                      }} 
                      style={styles.facilityButton}
                    >
                      {(() => {
                        const imageSource = getOptimizedImage(pin.image);
                        if (typeof imageSource === 'number' || (imageSource && typeof imageSource === 'object' && !imageSource.uri)) {
                          return <Image source={imageSource} style={styles.facilityButtonImage} resizeMode="cover" />;
                        } else {
                          return <ExpoImage source={imageSource} style={styles.facilityButtonImage} contentFit="cover" cachePolicy="disk" />;
                        }
                      })()}
                      <View style={[styles.facilityButtonContent, { flex: 1 }]}>
                        <Text style={styles.facilityName} numberOfLines={2} ellipsizeMode="tail">{pin.description}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          
                          // Check if user is logged in
                          if (!isLoggedIn || !authToken) {
                            Alert.alert(
                              'Login Required',
                              'You must be logged in to save pins. Please login to continue.',
                              [
                                {
                                  text: 'Cancel',
                                  style: 'cancel',
                                },
                                {
                                  text: 'Login',
                                  onPress: () => {
                                    setPinsModalVisible(false); // Close View All Pins modal
                                    setAuthModalVisible(true);
                                    setAuthTab('login');
                                  },
                                },
                              ]
                            );
                            return;
                          }
                          
                          if (isPinSaved) {
                            const updatedSavedPins = savedPins.filter(p => p.id !== pin.id);
                            removeSavedPin(pin.id);
                            setSavedPins(updatedSavedPins);
                            if (isLoggedIn && authToken) {
                              (async () => {
                                try {
                                  await updateUserActivity(authToken, { savedPins: updatedSavedPins });
                                  // Refresh user data to ensure consistency
                                  const updatedUser = await getCurrentUser(authToken);
                                  setCurrentUser(updatedUser);
                                  // Enrich saved pins with full pin data
                                  if (updatedUser.activity && updatedUser.activity.savedPins && pins && pins.length > 0) {
                                    const enrichedSavedPins = updatedUser.activity.savedPins.map(savedPin => {
                                      const fullPin = pins.find(p => p.id === savedPin.id);
                                      if (fullPin) {
                                        // Merge: prioritize savedPin (database) properties, but use fullPin for missing ones
                                        return {
                                          ...fullPin,
                                          ...savedPin, // Database values take priority (description, name, etc.)
                                          image: savedPin.image || fullPin.image, // Use savedPin image if available, else fullPin
                                        };
                                      }
                                      return savedPin; // Use savedPin as-is if no fullPin found
                                    });
                                    setSavedPins(enrichedSavedPins);
                                  } else {
                                    setSavedPins(updatedSavedPins);
                                  }
                                } catch (err) {
                                  console.error('Error updating saved pins:', err);
                                }
                              })();
                            }
                          } else {
                            const pinToSave = { ...pin, image: pin.image || null };
                            const updatedSavedPins = [...savedPins, pinToSave];
                            setSavedPins(updatedSavedPins);
                            addSavedPin(pinToSave);
                            if (isLoggedIn && authToken) {
                              (async () => {
                                try {
                                  await updateUserActivity(authToken, { savedPins: updatedSavedPins });
                                  // Refresh user data to ensure consistency
                                  const updatedUser = await getCurrentUser(authToken);
                                  setCurrentUser(updatedUser);
                                  // Enrich saved pins with full pin data
                                  if (updatedUser.activity && updatedUser.activity.savedPins && pins && pins.length > 0) {
                                    const enrichedSavedPins = updatedUser.activity.savedPins.map(savedPin => {
                                      const fullPin = pins.find(p => p.id === savedPin.id);
                                      if (fullPin) {
                                        // Merge: prioritize savedPin (database) properties, but use fullPin for missing ones
                                        return {
                                          ...fullPin,
                                          ...savedPin, // Database values take priority (description, name, etc.)
                                          image: savedPin.image || fullPin.image, // Use savedPin image if available, else fullPin
                                        };
                                      }
                                      return savedPin; // Use savedPin as-is if no fullPin found
                                    });
                                    setSavedPins(enrichedSavedPins);
                                  } else {
                                    setSavedPins(updatedSavedPins);
                                  }
                                } catch (err) {
                                  console.error('Error updating saved pins:', err);
                                }
                              })();
                            }
                          }
                        }}
                        style={{
                          padding: 10,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        <Icon name={isPinSaved ? "heart" : "heart-o"} size={20} color={isPinSaved ? "#dc3545" : "#999"} />
                  </TouchableOpacity>
              </TouchableOpacity>
                  );
                })}
            </View>
            ))}
          </ScrollView>
            </Animated.View>
          </>
        )}
      </Modal>

        {/* Pin Selector Modal - Bottom Slide-in Panel (for pathfinding) */}
        <Modal
          visible={pinSelectorModalRendered}
          transparent={true}
          animationType="none"
          onRequestClose={() => {
            setPinSelectorModalVisible(false);
            setActiveSelector(null); // Clear active selector when closing
          }}
        >
          {pinSelectorModalRendered && (
          <>
            <Animated.View 
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: '#f5f5f5',
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  overflow: 'hidden',
                  transform: [{ translateY: pinSelectorModalSlideAnim }],
                  opacity: pinSelectorModalSlideAnim.interpolate({
                    inputRange: [0, 150, 300],
                    outputRange: [1, 0.5, 0],
                  }),
                }
              ]}
            >
          {/* Header */}
          <View style={styles.pinsModalHeader}>
            <Text style={[styles.pinsModalCampusTitle, { textAlign: 'center' }]}>
              {activeSelector === 'A' ? 'Select Start Point' : 'Select Destination'}
            </Text>
          </View>
          
          {/* Categorized Facility List */}
          <ScrollView style={styles.facilityList} contentContainerStyle={styles.facilityListContent}>
            {categorizedPins.map((category, categoryIndex) => (
              <View key={category.title} style={{ marginBottom: 20 }}>
                <View style={styles.categoryHeaderContainer}>
                  <Text style={styles.categoryHeaderText}>{category.title}</Text>
                  <View style={styles.categoryHeaderUnderline}></View>
          </View>
                {category.pins.map((pin) => {
                  return (
                    <TouchableOpacity 
                      key={pin.id.toString()} 
                      onPress={() => {
                        if (activeSelector === 'A') {
                          setPointA(pin);
                        } else if (activeSelector === 'B') {
                          setPointB(pin);
                        }
                        setPinSelectorModalVisible(false);
                        setActiveSelector(null);
                      }} 
                      style={styles.facilityButton}
                    >
                      {(() => {
                        const imageSource = getOptimizedImage(pin.image);
                        if (typeof imageSource === 'number' || (imageSource && typeof imageSource === 'object' && !imageSource.uri)) {
                          return <Image source={imageSource} style={styles.facilityButtonImage} resizeMode="cover" />;
                        } else {
                          return <ExpoImage source={imageSource} style={styles.facilityButtonImage} contentFit="cover" cachePolicy="disk" />;
                        }
                      })()}
                      <View style={[styles.facilityButtonContent, { flex: 1 }]}>
                        <Text style={styles.facilityName} numberOfLines={2} ellipsizeMode="tail">{pin.description}</Text>
                      </View>
                </TouchableOpacity>
                  );
                })}
            </View>
            ))}
          </ScrollView>
            </Animated.View>
          </>
        )}
      </Modal>

      {/* QR Code Display Modal (for showing building QR codes) */}
      <Modal
        visible={isQrCodeVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setQrCodeVisible(false);
          setQrCodeData(null);
        }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 30, alignItems: 'center', maxWidth: width * 0.9 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
              {selectedPin?.description || selectedPin?.title || 'Building'} QR Code
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>
              Scan this code to open this building
            </Text>
            {qrCodeData && (
              <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, marginBottom: 20 }}>
                <QRCode
                  value={qrCodeData}
                  size={250}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                  logoSize={0}
                  logoMargin={0}
                  logoBackgroundColor="transparent"
                />
              </View>
            )}
            <View style={{ backgroundColor: '#e3f2fd', padding: 15, borderRadius: 8, marginBottom: 15, width: '100%' }}>
              <Text style={{ fontSize: 13, color: '#1976d2', fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
                📱 How to Scan:
              </Text>
              <Text style={{ fontSize: 12, color: '#424242', textAlign: 'center', lineHeight: 18 }}>
                1. Open the Campus Trails app{'\n'}
                2. Tap the QR scanner button (top left){'\n'}
                3. Point camera at this QR code{'\n'}
                4. The building will open automatically
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: '#999', marginBottom: 20, textAlign: 'center', paddingHorizontal: 20, fontStyle: 'italic' }}>
              Note: Scan with the app's scanner, not your phone's default camera QR scanner.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#28a745',
                padding: 15,
                borderRadius: 8,
                width: 120,
                alignItems: 'center',
              }}
              onPress={() => {
                setQrCodeVisible(false);
                setQrCodeData(null);
              }}
            >
              <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* QR Code Scanner Modal */}
      <Modal
        visible={isQrScannerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setQrScannerVisible(false);
          setScanned(false);
        }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' }}>
          {/* Header */}
          <View style={{ 
            paddingTop: Platform.OS === 'ios' ? 50 : 20, 
            paddingBottom: 15, 
            paddingHorizontal: 20, 
            backgroundColor: 'rgba(0,0,0,0.8)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center' }}>
              QR Code Scanner
            </Text>
            <TouchableOpacity
              onPress={() => {
                setQrScannerVisible(false);
                setScanned(false);
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon name="times" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {hasPermission === null ? (
              <View style={{ alignItems: 'center', padding: 20 }}>
                <Icon name="camera" size={64} color="#28a745" style={{ marginBottom: 20 }} />
                <Text style={{ color: 'white', fontSize: 18, marginBottom: 10 }}>Requesting camera permission...</Text>
              </View>
            ) : hasPermission === false ? (
              <View style={{ alignItems: 'center', padding: 20, maxWidth: width * 0.9 }}>
                <Icon name="camera" size={64} color="#ff6b6b" style={{ marginBottom: 20 }} />
                <Text style={{ color: 'white', fontSize: 18, marginBottom: 10, textAlign: 'center', fontWeight: 'bold' }}>
                  Camera Permission Required
                </Text>
                <Text style={{ color: '#ccc', fontSize: 14, marginBottom: 20, textAlign: 'center' }}>
                  Camera permission is required to scan QR codes
                </Text>
                <TouchableOpacity
                  style={{ 
                    backgroundColor: '#28a745', 
                    paddingVertical: 15, 
                    paddingHorizontal: 30, 
                    borderRadius: 8,
                    elevation: 3,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                  }}
                  onPress={async () => {
                    if (!BarCodeScanner) {
                      Alert.alert(
                        'QR Scanner Not Available',
                        'QR code scanning requires a development build. Please build the app using:\n\nnpx expo prebuild\nnpx expo run:android'
                      );
                      setQrScannerVisible(false);
                      return;
                    }
                    
                    try {
                      const { status } = await BarCodeScanner.requestPermissionsAsync();
                      setHasPermission(status === 'granted');
                    } catch (error) {
                      console.error('Error requesting camera permission:', error);
                      Alert.alert(
                        'QR Scanner Not Available',
                        'QR code scanning requires a development build. Please build the app using:\n\nnpx expo prebuild\nnpx expo run:android\n\nOr use deep links instead: campustrails://pin/123'
                      );
                      setQrScannerVisible(false);
                    }
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Grant Permission</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {BarCodeScanner ? (
                  <>
                    <BarCodeScanner
                      onBarCodeScanned={scanned ? undefined : ({ data }) => handleQrCodeScan(data)}
                      style={StyleSheet.absoluteFillObject}
                    />
                    {/* Scanning Frame Overlay */}
                    <View style={{ 
                      position: 'absolute', 
                      top: '25%', 
                      left: '15%', 
                      right: '15%', 
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <View style={{ 
                        width: width * 0.7, 
                        height: width * 0.7, 
                        borderWidth: 3, 
                        borderColor: '#28a745',
                        borderRadius: 20,
                        backgroundColor: 'transparent',
                        shadowColor: '#28a745',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.5,
                        shadowRadius: 10,
                        elevation: 10,
                      }} />
                      {/* Corner indicators */}
                      <View style={{ position: 'absolute', top: -3, left: -3, width: 30, height: 30, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#28a745' }} />
                      <View style={{ position: 'absolute', top: -3, right: -3, width: 30, height: 30, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#28a745' }} />
                      <View style={{ position: 'absolute', bottom: -3, left: -3, width: 30, height: 30, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#28a745' }} />
                      <View style={{ position: 'absolute', bottom: -3, right: -3, width: 30, height: 30, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#28a745' }} />
                    </View>
                    
                    {/* Guide Section */}
                    <View style={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      left: 0, 
                      right: 0, 
                      backgroundColor: 'rgba(0,0,0,0.85)',
                      padding: 20,
                      borderTopLeftRadius: 20,
                      borderTopRightRadius: 20
                    }}>
                      <View style={{ backgroundColor: '#e3f2fd', padding: 15, borderRadius: 8, marginBottom: 15 }}>
                        <Text style={{ fontSize: 14, color: '#1976d2', fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
                          📱 How to Scan:
                        </Text>
                        <Text style={{ fontSize: 12, color: '#424242', textAlign: 'center', lineHeight: 18 }}>
                          1. Point your camera at the QR code{'\n'}
                          2. Align the QR code within the green frame{'\n'}
                          3. Hold steady until the code is scanned{'\n'}
                          4. The building will open automatically
                        </Text>
                      </View>
                      {scanned && (
                        <TouchableOpacity
                          style={{ 
                            backgroundColor: '#28a745', 
                            paddingVertical: 15, 
                            paddingHorizontal: 30, 
                            borderRadius: 8,
                            alignItems: 'center',
                            elevation: 3,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.25,
                            shadowRadius: 3.84,
                          }}
                          onPress={() => {
                            setScanned(false);
                          }}
                        >
                          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Tap to Scan Again</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                ) : (
                  <View style={{ alignItems: 'center', padding: 20, maxWidth: width * 0.9 }}>
                    <Icon name="qrcode" size={64} color="#ff6b6b" style={{ marginBottom: 20 }} />
                    <Text style={{ color: 'white', fontSize: 18, marginBottom: 10, textAlign: 'center', fontWeight: 'bold' }}>
                      QR Scanner Not Available
                    </Text>
                    <Text style={{ color: '#ccc', fontSize: 14, textAlign: 'center', marginBottom: 20, paddingHorizontal: 20, lineHeight: 20 }}>
                      QR code scanning requires a development build.{'\n\n'}To enable:{'\n'}1. Run: npx expo prebuild{'\n'}2. Then: npx expo run:android
                    </Text>
                    <View style={{ backgroundColor: '#e3f2fd', padding: 15, borderRadius: 8, marginBottom: 20, width: '100%' }}>
                      <Text style={{ fontSize: 12, color: '#424242', textAlign: 'center', lineHeight: 18 }}>
                        💡 Alternative: You can view QR codes for buildings in the Building Details modal and scan them with another device.
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={{ 
                        backgroundColor: '#28a745', 
                        paddingVertical: 15, 
                        paddingHorizontal: 30, 
                        borderRadius: 8,
                        elevation: 3,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                      }}
                      onPress={() => setQrScannerVisible(false)}
                    >
                      <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Close</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Fullscreen Image Viewer Modal */}
      <Modal
        visible={isFullscreenImageVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullscreenImageVisible(false)}
      >
        <View style={{ ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 50, right: 20, zIndex: 1001, padding: 10 }}
            onPress={() => setFullscreenImageVisible(false)}
          >
            <Icon name="times" size={30} color="#fff" />
            </TouchableOpacity>
          {fullscreenImageSource && (
            <ImageZoom
              cropWidth={width}
              cropHeight={height}
              imageWidth={width}
              imageHeight={height * 0.8}
              minScale={1}
              maxScale={5}
              enableCenterFocus={false}
            >
              {(() => {
                if (typeof fullscreenImageSource === 'number' || (fullscreenImageSource && typeof fullscreenImageSource === 'object' && !fullscreenImageSource.uri)) {
                  // Local asset - use React Native Image
                  return <Image source={fullscreenImageSource} style={{ width: width, height: height * 0.8 }} resizeMode="contain" />;
                } else {
                  // Remote URL - use ExpoImage for caching
                  return <ExpoImage source={fullscreenImageSource} style={{ width: width, height: height * 0.8 }} contentFit="contain" cachePolicy="disk" />;
                }
              })()}
            </ImageZoom>
          )}
        </View>
      </Modal>

      {/* Alert Modal */}
      <Modal visible={showAlertModal} transparent={true} animationType="fade">
        <View style={styles.alertModalOverlay}>
          <View style={styles.alertModalContainer}>
            <View style={styles.modalHeaderWhite}>
              <Text style={[styles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>Alert</Text>
            </View>
            <View style={styles.lineDark}></View>
            <View style={{ backgroundColor: '#f5f5f5', padding: 15 }}>
              <Text style={[styles.alertModalMessage, { color: '#333' }]}>{alertMessage}</Text>
            </View>
            <View style={{ backgroundColor: '#f5f5f5', paddingHorizontal: 15, paddingBottom: 15 }}>
            <TouchableOpacity 
              style={styles.alertModalButton}
              onPress={() => setShowAlertModal(false)}
            >
              <Text style={styles.alertModalButtonText}>OK</Text>
            </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Campus Change Modal */}
      {campusRendered && (
        <Animated.View 
          style={[
            styles.campusContainer,
            {
              opacity: campusAnim,
              transform: [
                {
                  translateY: campusAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            }
          ]}
        >
          <View style={styles.modalHeaderWhite}>
            <Text style={[styles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>Select Campus</Text>
          </View>
          <View style={styles.lineDark}></View>
          <View style={{ backgroundColor: '#f5f5f5' }}>
          <FlatList
            data={campusesData.length > 0 ? campusesData : campuses.map(name => ({ name }))}
            keyExtractor={(item, index) => item.name || index.toString()}
            renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleCampusChange(item)} style={styles.searchItemContainer}>
                <Text style={styles.searchItem}>{item.name || item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
        </Animated.View>
      )}
    </View>
  );
};


export default App;