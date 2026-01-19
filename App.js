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
import { validateUsername, validatePassword } from './utils/validation';
import { transformFeedbackData as transformFeedbackDataUtil } from './utils/feedbackUtils';
import { resetPathfinding as resetPathfindingUtil, swapPoints as swapPointsUtil, handleStartPathfinding as handleStartPathfindingUtil } from './utils/pathfindingUtils';
import { getOptimizedImage, clearImageCache, ExpoImage } from './utils/imageUtils';
import { usePins } from './utils/usePins';
import { getProfilePictureUrl, uploadToCloudinaryDirect, CLOUDINARY_CONFIG } from './utils/cloudinaryUtils';
import { getFloorName } from './utils/floorUtils';
import { developersData } from './constants/developers';
import PathfindingInfoCard from './components/PathfindingInfoCard';
import Step1Modal from './components/Step1Modal';
import Step2Modal from './components/Step2Modal';
import PathfindingDetailsModal from './components/PathfindingDetailsModal';
import UpdatePointAModal from './components/UpdatePointAModal';
import PathfindingSuccessModal from './components/PathfindingSuccessModal';
import AlertModal from './components/AlertModal';
import FullscreenImageModal from './components/FullscreenImageModal';
import QrCodeDisplayModal from './components/QrCodeDisplayModal';
import QrScannerModal from './components/QrScannerModal';
import CampusSelectorModal from './components/CampusSelectorModal';
import SettingsModal from './components/SettingsModal';
import UserProfileModal from './components/UserProfileModal';
import FilterModal from './components/FilterModal';
import FeedbackModal from './components/FeedbackModal';
import RoomSelectionModal from './components/RoomSelectionModal';
import AuthModal from './components/AuthModal';
import Header from './components/Header';
import Footer from './components/Footer';
import * as ImagePicker from 'expo-image-picker';
import { loadUserData, saveUserData, addFeedback, addSavedPin, removeSavedPin, getActivityStats, updateSettings, updateProfile, addNotification, removeNotification, getNotifications, clearAllNotifications, getUnreadNotificationsCount } from './utils/userStorage';
import { register, login, getCurrentUser, updateUserProfile, updateUserActivity, changePassword, logout, fetchCampuses, forgotPassword, resetPassword, fetchPinByQrCode, fetchRoomByQrCode, registerPushToken, fetchDevelopers, submitSuggestionAndFeedback, trackAnonymousSearch, trackAnonymousPathfinding, getUserNotifications, markNotificationAsRead, deleteNotification, clearAllUserNotifications } from './services/api';
import { useBackHandler } from './utils/useBackHandler';
import { 
  registerForPushNotificationsAsync, 
  setupNotificationListeners, 
  removeNotificationListeners 
} from './utils/notificationService';
import * as Notifications from 'expo-notifications';

const { width, height } = Dimensions.get('window');


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
  const [searchQueryB, setSearchQueryB] = useState(''); // Separate search query for Point B
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
  const [showPathfindingPanel, setShowPathfindingPanel] = useState(false); // No longer used - replaced by Step 1/2 modals
  const [showStep1Modal, setShowStep1Modal] = useState(false); // Separate modal for Step 1
  const [step1ModalRendered, setStep1ModalRendered] = useState(false);
  const step1ModalSlideAnim = useRef(new Animated.Value(height)).current;
  const [showStep2Modal, setShowStep2Modal] = useState(false); // Separate modal for Step 2
  const [showExitInstructions, setShowExitInstructions] = useState(false);
  const [showUpdatePointA, setShowUpdatePointA] = useState(false);
  const [showPathfindingDetails, setShowPathfindingDetails] = useState(false);
  const [pathfindingDetailsModalRendered, setPathfindingDetailsModalRendered] = useState(false);
  const pathfindingDetailsSlideAnim = useRef(new Animated.Value(height)).current;
  const [cameFromPathfindingDetails, setCameFromPathfindingDetails] = useState(false); // Track if Building Details or Update Point A was opened from Pathfinding Details
  const [showPathfindingSuccess, setShowPathfindingSuccess] = useState(false);
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
  
  // Room Selection Modal State (for reporting facility issues)
  const [isRoomSelectionModalVisible, setRoomSelectionModalVisible] = useState(false);
  const [selectedRoomForReport, setSelectedRoomForReport] = useState(null); // { room: {...}, floorLevel: number, floorName: string }
  const [roomSelectionFloor, setRoomSelectionFloor] = useState(0); // Floor level for room selection
  
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

  // Pathfinding Modal Animation (bottom slide-in, same as View All Pins)
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

  // Step 1 Modal Animation (slide from bottom like other modals)
  useEffect(() => {
    if (showStep1Modal) {
      // Set to bottom position first (before render to avoid flash)
      step1ModalSlideAnim.setValue(height);
      // Use requestAnimationFrame to ensure smooth render timing
      requestAnimationFrame(() => {
        setStep1ModalRendered(true);
        // Animate in with spring for smoothness
        requestAnimationFrame(() => {
          Animated.spring(step1ModalSlideAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        });
      });
    } else if (step1ModalRendered) {
      // Animate out first
      Animated.timing(step1ModalSlideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Hide after animation completes
        setStep1ModalRendered(false);
      });
    }
  }, [showStep1Modal, step1ModalSlideAnim, step1ModalRendered, height]);

  // Pathfinding Details Modal Animation (slide from bottom like other modals)
  useEffect(() => {
    if (showPathfindingDetails) {
      // Set to bottom position first (before render to avoid flash)
      pathfindingDetailsSlideAnim.setValue(height);
      // Use requestAnimationFrame to ensure smooth render timing
      requestAnimationFrame(() => {
        setPathfindingDetailsModalRendered(true);
        // Animate in with spring for smoothness
        requestAnimationFrame(() => {
          Animated.spring(pathfindingDetailsSlideAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        });
      });
    } else if (pathfindingDetailsModalRendered) {
      // Animate out first
      Animated.timing(pathfindingDetailsSlideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Hide after animation completes
        setPathfindingDetailsModalRendered(false);
      });
    }
  }, [showPathfindingDetails, pathfindingDetailsSlideAnim, pathfindingDetailsModalRendered, height]);

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
    return transformFeedbackDataUtil(feedbackHistoryFromDB, pins);
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
      // Format: campustrails://pin/{pinId} or campustrails://qr/{qrCode} or campustrails://room/{roomId}
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
      } else if (parsed.hostname === 'room' && parsed.path) {
        // Room QR code link: campustrails://room/{roomId}
        const roomId = parsed.path.replace('/', '').trim();
        await handleRoomQrCodeScan(roomId);
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

  // QR Scanner permission is now handled inside QrScannerModal component

  // Handle room QR code scan
  const handleRoomQrCodeScan = async (roomId) => {
    try {
      setScanned(true);
      
      // Try to fetch room from API
      try {
        const roomData = await fetchRoomByQrCode(roomId);
        if (roomData && roomData.building) {
          // Find the building in local pins
          const building = pins.find(p => 
            String(p.id) === String(roomData.building.id) || 
            p._id === roomData.building._id
          );
          
          const appBuilding = building || {
            id: roomData.building.id,
            x: roomData.building.x,
            y: roomData.building.y,
            title: roomData.building.title,
            description: roomData.building.description,
            image: roomData.building.image,
            category: roomData.building.category,
            isVisible: roomData.building.isVisible,
            buildingNumber: roomData.building.buildingNumber,
            floors: roomData.building.floors || [],
            qrCode: roomData.building.qrCode,
            ...roomData.building
          };
          
          // Create room object for pointA
          const roomPoint = {
            id: roomData.room.name || roomId,
            title: roomData.room.name,
            description: `${appBuilding.description || appBuilding.title} - ${roomData.room.name}`,
            image: roomData.room.image || appBuilding.image,
            x: appBuilding.x || 0,
            y: appBuilding.y || 0,
            buildingId: appBuilding.id,
            buildingPin: appBuilding,
            floorLevel: roomData.floorLevel,
            type: 'room',
            ...roomData.room
          };
          
          // During pathfinding mode, always update pointA when scanning
          if (pathfindingMode) {
            setPointA(roomPoint);
            // Recalculate path if pointB exists
            if (pointB) {
              setTimeout(async () => {
                try {
                  const startId = roomPoint.buildingId || roomPoint.buildingPin?.id || roomPoint.id;
                  const endId = pointB.type === 'room' ? (pointB.buildingId || pointB.buildingPin?.id || pointB.id) : pointB.id;
                  const foundPath = aStarPathfinding(startId, endId, pins);
                  if (foundPath.length > 0) {
                    setPath(foundPath);
                  }
                } catch (error) {
                  console.error('Error recalculating path:', error);
                }
              }, 100);
            }
          } else {
            // Not in pathfinding mode - normal behavior
            if (pointA) {
              setPointB(roomPoint);
            } else {
              setPointA(roomPoint);
            }
            setShowStep1Modal(false);
            setShowStep2Modal(true);
          }
          setQrScannerVisible(false);
        } else {
          Alert.alert('Room Not Found', `No room found for QR code: ${roomId}`);
          setScanned(false);
        }
      } catch (error) {
        console.error('Error fetching room:', error);
        Alert.alert('Room Not Found', `No room found for QR code: ${roomId}\n\nMake sure you're connected to the internet or the QR code is valid.`);
        setScanned(false);
      }
    } catch (error) {
      console.error('Error handling room QR code scan:', error);
      Alert.alert('Error', 'Failed to process room QR code.');
      setScanned(false);
    }
  };

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
      
      // Check if it's a room QR code (format: campustrails://room/{roomId})
      if (data.startsWith('campustrails://room/')) {
        const roomId = data.replace('campustrails://room/', '').trim();
        await handleRoomQrCodeScan(roomId);
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
        // During pathfinding mode, always update pointA when scanning
        if (pathfindingMode) {
          setPointA(localPin);
          // Recalculate path if pointB exists
          if (pointB) {
            setTimeout(async () => {
              try {
                const startId = localPin.id;
                const endId = pointB.type === 'room' ? (pointB.buildingId || pointB.buildingPin?.id || pointB.id) : pointB.id;
                const foundPath = aStarPathfinding(startId, endId, pins);
                if (foundPath.length > 0) {
                  setPath(foundPath);
                }
              } catch (error) {
                console.error('Error recalculating path:', error);
              }
            }, 100);
          }
        } else {
          // Not in pathfinding mode - normal behavior
          if (pointA) {
          setPointB(localPin);
          setShowStep2Modal(true);
        } else {
          setPointA(localPin);
          setShowStep1Modal(false);
          setShowStep2Modal(true);
        }
        }
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
          // During pathfinding mode, always update pointA when scanning
          if (pathfindingMode) {
            setPointA(appPin);
            // Recalculate path if pointB exists
            if (pointB) {
              setTimeout(async () => {
                try {
                  const startId = appPin.id;
                  const endId = pointB.type === 'room' ? (pointB.buildingId || pointB.buildingPin?.id || pointB.id) : pointB.id;
                  const foundPath = aStarPathfinding(startId, endId, pins);
                  if (foundPath.length > 0) {
                    setPath(foundPath);
                  }
                } catch (error) {
                  console.error('Error recalculating path:', error);
                }
              }, 100);
            }
          } else {
            // Not in pathfinding mode - normal behavior
            if (pointA) {
              setPointB(appPin);
              setShowStep2Modal(true);
            } else {
              setPointA(appPin);
              setShowStep1Modal(false);
              setShowStep2Modal(true);
            }
          }
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
    cameFromPathfindingDetails,
    isModalVisible,
    isFilterModalVisible,
    isSettingsVisible,
    isPinsModalVisible,
    isPinSelectorModalVisible,
    showPathfindingPanel,
    showUpdatePointA,
    showPathfindingDetails,
    isSearchVisible,
    isCampusVisible,
    isAuthModalVisible,
    isUserProfileVisible,
    isFeedbackModalVisible,
    isRoomSelectionModalVisible,
    isQrScannerVisible,
    isQrCodeVisible,
    setBuildingDetailsVisible,
    setModalVisible,
    setCameFromPinDetails,
    setCameFromPathfindingDetails,
    setFilterModalVisible,
    setSettingsVisible,
    setPinsModalVisible,
    setPinSelectorModalVisible,
    setShowPathfindingPanel,
    setShowUpdatePointA,
    setShowPathfindingDetails,
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
    setRoomSelectionModalVisible,
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

  // Combine pins and rooms for search results (Point A)
  const searchResults = React.useMemo(() => 
    getSearchResults(filteredPins, filteredRooms, 20), 
    [filteredPins, filteredRooms]
  );

  // Separate search results for Point B
  const filteredPinsB = React.useMemo(() => getFilteredPins(pins, searchQueryB), [pins, searchQueryB]);
  const filteredRoomsB = React.useMemo(() => getFilteredRooms(allRooms, searchQueryB), [allRooms, searchQueryB]);
  const searchResultsB = React.useMemo(() => 
    getSearchResults(filteredPinsB, filteredRoomsB, 20), 
    [filteredPinsB, filteredRoomsB]
  );

  // Track searches when user performs a search (has query and results)
  const lastTrackedSearchQuery = useRef('');
  const lastTrackedPinsModalSearchQuery = useRef('');
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

  // Track searches for Step 1 Modal (Point A search in pathfinding)
  const lastTrackedStep1SearchQuery = useRef('');
  useEffect(() => {
    const trackStep1Search = async () => {
      if (searchQuery.trim() && searchResults.length > 0 && showStep1Modal) {
        if (searchQuery.trim() !== lastTrackedStep1SearchQuery.current) {
          lastTrackedStep1SearchQuery.current = searchQuery.trim();
          
          if (isLoggedIn && authToken && currentUser) {
            try {
              const currentCount = currentUser.activity?.searchCount || 0;
              const updatedSearchCount = currentCount + 1;
              await updateUserActivity(authToken, {
                searchCount: updatedSearchCount
              });
              const updatedUser = await getCurrentUser(authToken);
              setCurrentUser(updatedUser);
            } catch (error) {
              console.error('❌ Error tracking Step 1 search:', error);
            }
          }
          
          if (!isLoggedIn || !authToken) {
            try {
              let campusId = currentCampus?._id || currentCampus?.id || null;
              if (!campusId && searchResults.length > 0) {
                const firstPin = searchResults[0];
                campusId = firstPin.campusId?._id || firstPin.campusId?.id || firstPin.campusId || null;
              }
              if (!campusId && campusesData.length > 0) {
                campusId = campusesData[0]._id || campusesData[0].id || null;
              }
              if (campusId) {
                await trackAnonymousSearch(campusId, searchQuery.trim(), searchResults.length);
              }
            } catch (error) {
              console.error('❌ Error tracking anonymous Step 1 search:', error);
            }
          }
        }
      }
    };

    const timeoutId = setTimeout(trackStep1Search, 1000);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchResults.length, showStep1Modal, isLoggedIn, authToken, currentUser, currentCampus, campusesData]);

  // Track searches for Step 2 Modal (Point B search in pathfinding)
  const lastTrackedStep2SearchQuery = useRef('');
  useEffect(() => {
    const trackStep2Search = async () => {
      if (searchQueryB.trim() && searchResultsB.length > 0 && showStep2Modal) {
        if (searchQueryB.trim() !== lastTrackedStep2SearchQuery.current) {
          lastTrackedStep2SearchQuery.current = searchQueryB.trim();
          
          if (isLoggedIn && authToken && currentUser) {
            try {
              const currentCount = currentUser.activity?.searchCount || 0;
              const updatedSearchCount = currentCount + 1;
              await updateUserActivity(authToken, {
                searchCount: updatedSearchCount
              });
              const updatedUser = await getCurrentUser(authToken);
              setCurrentUser(updatedUser);
            } catch (error) {
              console.error('❌ Error tracking Step 2 search:', error);
            }
          }
          
          if (!isLoggedIn || !authToken) {
            try {
              let campusId = currentCampus?._id || currentCampus?.id || null;
              if (!campusId && searchResultsB.length > 0) {
                const firstPin = searchResultsB[0];
                campusId = firstPin.campusId?._id || firstPin.campusId?.id || firstPin.campusId || null;
              }
              if (!campusId && campusesData.length > 0) {
                campusId = campusesData[0]._id || campusesData[0].id || null;
              }
              if (campusId) {
                await trackAnonymousSearch(campusId, searchQueryB.trim(), searchResultsB.length);
              }
            } catch (error) {
              console.error('❌ Error tracking anonymous Step 2 search:', error);
            }
          }
        }
      }
    };

    const timeoutId = setTimeout(trackStep2Search, 1000);
    return () => clearTimeout(timeoutId);
  }, [searchQueryB, searchResultsB.length, showStep2Modal, isLoggedIn, authToken, currentUser, currentCampus, campusesData]);

  // Track searches in Update Point A Modal (pathfinding update)
  const lastTrackedUpdatePointASearchQuery = useRef('');
  useEffect(() => {
    const trackUpdatePointASearch = async () => {
      if (searchQuery.trim() && searchResults.length > 0 && showUpdatePointA) {
        if (searchQuery.trim() !== lastTrackedUpdatePointASearchQuery.current) {
          lastTrackedUpdatePointASearchQuery.current = searchQuery.trim();
          
          if (isLoggedIn && authToken && currentUser) {
            try {
              const currentCount = currentUser.activity?.searchCount || 0;
              const updatedSearchCount = currentCount + 1;
              await updateUserActivity(authToken, {
                searchCount: updatedSearchCount
              });
              const updatedUser = await getCurrentUser(authToken);
              setCurrentUser(updatedUser);
            } catch (error) {
              console.error('❌ Error tracking Update Point A search:', error);
            }
          }
          
          if (!isLoggedIn || !authToken) {
            try {
              let campusId = currentCampus?._id || currentCampus?.id || null;
              if (!campusId && searchResults.length > 0) {
                const firstPin = searchResults[0];
                campusId = firstPin.campusId?._id || firstPin.campusId?.id || firstPin.campusId || null;
              }
              if (!campusId && campusesData.length > 0) {
                campusId = campusesData[0]._id || campusesData[0].id || null;
              }
              if (campusId) {
                await trackAnonymousSearch(campusId, searchQuery.trim(), searchResults.length);
              }
            } catch (error) {
              console.error('❌ Error tracking anonymous Update Point A search:', error);
            }
          }
        }
      }
    };

    const timeoutId = setTimeout(trackUpdatePointASearch, 1000);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchResults.length, showUpdatePointA, isLoggedIn, authToken, currentUser, currentCampus, campusesData]);

  // Track searches in View All Pins Modal
  useEffect(() => {
    const trackPinsModalSearch = async () => {
      // Calculate total result count from filtered categorized pins
      const totalResults = categorizedPins.reduce((sum, category) => sum + category.pins.length, 0);

      // Track search if: has a search query, has results, and hasn't tracked this exact query yet
      if (pinsModalSearchQuery.trim() && totalResults > 0) {
        // Don't track the same search query multiple times
        if (pinsModalSearchQuery.trim() !== lastTrackedPinsModalSearchQuery.current) {
          lastTrackedPinsModalSearchQuery.current = pinsModalSearchQuery.trim();
          
          // Track for logged-in users (user-specific tracking)
          if (isLoggedIn && authToken && currentUser) {
            try {
              const currentCount = currentUser.activity?.searchCount || 0;
              const updatedSearchCount = currentCount + 1;
              console.log(`📊 Tracking View All Pins search (logged-in): "${pinsModalSearchQuery.trim()}" - Count: ${currentCount} -> ${updatedSearchCount}`);
              
              await updateUserActivity(authToken, {
                searchCount: updatedSearchCount
              });
              
              console.log('✅ View All Pins search count updated successfully');
              
              // Refresh user data to get updated counts
              const updatedUser = await getCurrentUser(authToken);
              setCurrentUser(updatedUser);
              console.log('✅ User data refreshed, new searchCount:', updatedUser.activity?.searchCount);
            } catch (error) {
              console.error('❌ Error tracking View All Pins search (logged-in):', error);
            }
          }
          
          // Track anonymously ONLY if NOT logged in (for analytics - no PII)
          // If logged in, user-specific tracking is already done above
          if (!isLoggedIn || !authToken) {
            try {
              // Get campus ID from currentCampus, or fallback to first pin's campus, or default to first campus
              let campusId = currentCampus?._id || currentCampus?.id || null;
              
              // Fallback: Get campus from first categorized pin
              if (!campusId && categorizedPins.length > 0 && categorizedPins[0].pins.length > 0) {
                const firstPin = categorizedPins[0].pins[0];
                campusId = firstPin.campusId?._id || firstPin.campusId?.id || firstPin.campusId || null;
              }
              
              // Fallback: Get campus from first available campus
              if (!campusId && campusesData.length > 0) {
                campusId = campusesData[0]._id || campusesData[0].id || null;
              }
              
              if (campusId) {
                await trackAnonymousSearch(campusId, pinsModalSearchQuery.trim(), totalResults);
                console.log('✅ Anonymous View All Pins search tracked (user not logged in)');
              } else {
                console.log('⏭️  Skipping anonymous View All Pins search tracking - no campus ID available');
              }
            } catch (error) {
              console.error('❌ Error tracking anonymous View All Pins search:', error);
              // Don't show error - anonymous tracking failure shouldn't affect app
            }
          } else {
            console.log('⏭️  Skipping anonymous View All Pins search tracking - user is logged in (using user-specific tracking)');
          }
        } else {
          console.log('⏭️  Skipping View All Pins search tracking - already tracked this query');
        }
      } else {
        if (!pinsModalSearchQuery.trim()) {
          console.log('⏭️  Skipping View All Pins search tracking - no search query');
        } else if (totalResults === 0) {
          console.log('⏭️  Skipping View All Pins search tracking - no search results');
        }
      }
    };

    // Debounce search tracking (only track after user stops typing for 1 second)
    const timeoutId = setTimeout(trackPinsModalSearch, 1000);
    return () => clearTimeout(timeoutId);
  }, [pinsModalSearchQuery, categorizedPins, isLoggedIn, authToken, currentUser, currentCampus, campusesData]);

  const handlePinPress = (pin) => {
    console.log('📍 Pin pressed:', pin.description || pin.title, '| activeSelector:', activeSelector, '| pathfindingMode:', pathfindingMode);
    
    // If activeSelector is set (from pathfinding View Map), set the point and return to navigation modal
    // IMPORTANT: Check activeSelector FIRST and prevent pinDetails modal from opening
    if (activeSelector) {
      // Explicitly close pinDetails modal immediately to prevent it from showing
      setModalVisible(false);
      console.log('🎯 Pathfinding mode active - Setting point', activeSelector);
      
      // Set the point based on activeSelector
      if (activeSelector === 'A') {
        setPointA(pin);
        console.log('✅ Point A set from map selection:', pin.description || pin.title);
        
        // If pathfinding is active, recalculate path
        if (pathfindingMode && pointB) {
          setTimeout(async () => {
            try {
              const startId = pin.id;
              const endId = pointB.type === 'room' ? (pointB.buildingId || pointB.buildingPin?.id || pointB.id) : pointB.id;
              const foundPath = aStarPathfinding(startId, endId, pins);
              if (foundPath.length > 0) {
                setPath(foundPath);
              }
            } catch (error) {
              console.error('Error recalculating path:', error);
            }
          }, 100);
        }
      } else if (activeSelector === 'B') {
        setPointB(pin);
        console.log('✅ Point B set from map selection:', pin.description || pin.title);
        
        // If pathfinding is active, recalculate path
        if (pathfindingMode && pointA) {
          setTimeout(async () => {
            try {
              const startId = pointA.type === 'room' ? (pointA.buildingId || pointA.buildingPin?.id || pointA.id) : pointA.id;
              const endId = pin.id;
              const foundPath = aStarPathfinding(startId, endId, pins);
              if (foundPath.length > 0) {
                setPath(foundPath);
              }
            } catch (error) {
              console.error('Error recalculating path:', error);
            }
          }, 100);
        }
      }
      
      // Store activeSelector before clearing it for use in setTimeout
      const selectorToUse = activeSelector;
      
      // Clear activeSelector
      setActiveSelector(null);
      
      // Close all other modals - ensure pinDetails modal is disabled during pathfinding selection
      setSearchVisible(false);
      setCampusVisible(false);
      setFilterModalVisible(false);
      setSettingsVisible(false);
      setPinsModalVisible(false);
      setModalVisible(false); // Explicitly disable pinDetails modal
      setPinSelectorModalVisible(false);
      setBuildingDetailsVisible(false);
      
      // Reopen appropriate modal - use setTimeout to ensure state updates properly
      // The modal might be in the process of closing, so wait for it to complete
      if (!pathfindingMode) {
        setTimeout(() => {
          console.log('🔄 Reopening navigation modal...');
          if (selectorToUse === 'A') {
            setShowStep1Modal(true);
          } else if (selectorToUse === 'B') {
            setShowStep2Modal(true);
          }
        }, 300); // Wait for closing animation to complete (250ms + buffer)
      }
      
      return;
    }
    
    // Normal pin press - open pin detail modal (only if not in pathfinding selection mode)
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

  // Reset pathfinding state using utility function
  const resetPathfinding = () => {
    resetPathfindingUtil({
      setPathfindingMode,
      setShowPathfindingPanel,
      setPointA,
      setPointB,
      setPath,
      setHighlightedPinOnMap
    });
  };

  const handleStartPathfinding = async () => {
    if (!pointA || !pointB) {
      setAlertMessage('Please select both start and end points');
      setShowAlertModal(true);
      return;
    }

    // Check if points are the same (considering room floor levels)
    // For rooms: same building + same floor + same room name = same point
    // For buildings: same ID = same point
    const isSamePoint = (() => {
      // If both are rooms, check building, floor, and room name
      if (pointA.type === 'room' && pointB.type === 'room') {
        const sameBuilding = (pointA.buildingId || pointA.buildingPin?.id) === (pointB.buildingId || pointB.buildingPin?.id);
        const sameFloor = pointA.floorLevel === pointB.floorLevel;
        
        // If different buildings or different floors, they're definitely not the same
        if (!sameBuilding || !sameFloor) {
          return false;
        }
        
        // More robust room comparison: check id, name, title, and description
        const roomAId = String(pointA.id || pointA.name || pointA.title || '').trim();
        const roomBId = String(pointB.id || pointB.name || pointB.title || '').trim();
        
        // Also check if descriptions match (extract room name from description if needed)
        let roomAName = roomAId;
        let roomBName = roomBId;
        
        if (pointA.description && pointA.description.includes(' - ')) {
          roomAName = String(pointA.description.split(' - ')[1] || roomAName).trim();
        }
        if (pointB.description && pointB.description.includes(' - ')) {
          roomBName = String(pointB.description.split(' - ')[1] || roomBName).trim();
        }
        
        // Normalize for comparison (case-insensitive, remove extra spaces)
        const normalize = (str) => str ? str.toLowerCase().replace(/\s+/g, ' ').trim() : '';
        const normalizedAId = normalize(roomAId);
        const normalizedBId = normalize(roomBId);
        const normalizedAName = normalize(roomAName);
        const normalizedBName = normalize(roomBName);
        
        // Check if rooms match - must have at least one matching identifier
        const sameRoom = (normalizedAId && normalizedBId && normalizedAId === normalizedBId) || 
                         (normalizedAName && normalizedBName && normalizedAName === normalizedBName) ||
                         (pointA.description && pointB.description && normalize(pointA.description) === normalize(pointB.description));
        
        // Only consider same point if ALL three conditions are true: same building, same floor, AND same room
        return sameRoom;
      }
      // If both are buildings, check ID
      if (pointA.type !== 'room' && pointB.type !== 'room') {
        return pointA.id == pointB.id;
      }
      // Mixed types are never the same
      return false;
    })();
    
    if (isSamePoint) {
      setAlertMessage('Start and end points cannot be the same');
      setShowAlertModal(true);
      return;
    }

    setTimeout(async () => {
      try {
        // For rooms, use buildingId instead of room id for pathfinding
        const startId = pointA.type === 'room' ? (pointA.buildingId || pointA.buildingPin?.id || pointA.id) : pointA.id;
        const endId = pointB.type === 'room' ? (pointB.buildingId || pointB.buildingPin?.id || pointB.id) : pointB.id;
        
        // Pass all pins (including invisible waypoints) to pathfinding algorithm
        const foundPath = aStarPathfinding(startId, endId, pins);
        
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

  // Swap point A and point B using utility function
  const swapPoints = () => {
    swapPointsUtil(pointA, pointB, setPointA, setPointB);
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
      
      <Header
        pathfindingMode={pathfindingMode}
        currentCampus={currentCampus}
        isSearchVisible={isSearchVisible}
        hasPermission={hasPermission}
        setHasPermission={setHasPermission}
        onOpenQrScanner={() => {
          setQrScannerVisible(true);
          setScanned(false);
        }}
        onToggleCampus={toggleCampus}
        onToggleSearch={toggleSearch}
        styles={styles}
      />

      {/* Filter Button (moved) - sits between Search and Pathfinding */}
      {!pathfindingMode && (
      <TouchableOpacity style={styles.filterButtonBetween} onPress={toggleFilterModal}>
        <Icon name={Object.values(selectedCategories).some(val => val === true) ? "times" : "filter"} size={20} color="white" />
      </TouchableOpacity>
      )}

      {/* Pathfinding Toggle Button - Now positioned below Search button with same design */}
      {!pathfindingMode && (
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
            setShowStep1Modal(true);
            setPathfindingMode(false);
            setPath([]);
          }
        }}
      >
        <Icon name={pathfindingMode ? "times" : "location-arrow"} size={20} color="white" />
      </TouchableOpacity>
      )}

      {/* Pathfinding Info Card - Show at top during pathfinding */}
      {pathfindingMode && path.length > 0 && pointA && pointB && (
        <PathfindingInfoCard
          pointA={pointA}
          pointB={pointB}
          pins={pins}
          onResetPathfinding={resetPathfinding}
          onShowPathfindingDetails={() => setShowPathfindingDetails(true)}
          onUpdatePointA={setPointA}
          onUpdatePath={setPath}
          showPathfindingDetails={showPathfindingDetails}
        />
      )}

      {/* Update Point A Modal - Centered Modal */}
      <UpdatePointAModal
        visible={showUpdatePointA}
        onClose={() => {
          setShowUpdatePointA(false);
          if (cameFromPathfindingDetails) {
            setShowPathfindingDetails(true);
          }
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        pointB={pointB}
        pins={pins}
        onUpdatePointA={(newPointA) => {
          setPointA(newPointA);
          // Check if the new starting point matches the destination
          const checkIfReachedDestination = (pointA, pointB) => {
            if (!pointA || !pointB) return false;
            
            // If both are rooms, check building, floor, and room name
            if (pointA.type === 'room' && pointB.type === 'room') {
              const sameBuilding = (pointA.buildingId || pointA.buildingPin?.id) === (pointB.buildingId || pointB.buildingPin?.id);
              const sameFloor = pointA.floorLevel === pointB.floorLevel;
              
              if (!sameBuilding || !sameFloor) return false;
              
              // More robust room comparison
              const roomAId = String(pointA.id || pointA.name || pointA.title || '').trim();
              const roomBId = String(pointB.id || pointB.name || pointB.title || '').trim();
              
              let roomAName = roomAId;
              let roomBName = roomBId;
              
              if (pointA.description && pointA.description.includes(' - ')) {
                roomAName = String(pointA.description.split(' - ')[1] || roomAName).trim();
              }
              if (pointB.description && pointB.description.includes(' - ')) {
                roomBName = String(pointB.description.split(' - ')[1] || roomBName).trim();
              }
              
              const normalize = (str) => str ? str.toLowerCase().replace(/\s+/g, ' ').trim() : '';
              const normalizedAId = normalize(roomAId);
              const normalizedBId = normalize(roomBId);
              const normalizedAName = normalize(roomAName);
              const normalizedBName = normalize(roomBName);
              
              return (normalizedAId && normalizedBId && normalizedAId === normalizedBId) || 
                     (normalizedAName && normalizedBName && normalizedAName === normalizedBName) ||
                     (pointA.description && pointB.description && normalize(pointA.description) === normalize(pointB.description));
            }
            
            // If both are buildings, check ID
            if (pointA.type !== 'room' && pointB.type !== 'room') {
              return pointA.id == pointB.id;
            }
            
            return false;
          };
          
          // Check if reached destination
          if (checkIfReachedDestination(newPointA, pointB)) {
            setShowUpdatePointA(false);
            setShowPathfindingDetails(false);
            setTimeout(() => {
              setShowPathfindingSuccess(true);
            }, 300);
          }
        }}
        onUpdatePath={setPath}
        onOpenQrScanner={() => {
          setQrScannerVisible(true);
          setScanned(false);
          setShowUpdatePointA(false);
        }}
        onViewMap={() => {
          setActiveSelector('A');
          setShowUpdatePointA(false);
        }}
        styles={styles}
      />

      {/* Pathfinding Success Modal */}
      <PathfindingSuccessModal
        visible={showPathfindingSuccess}
        onClose={() => {
          setShowPathfindingSuccess(false);
          resetPathfinding();
        }}
        onGiveFeedback={() => {
          setShowPathfindingSuccess(false);
          setFeedbackType('feedback'); // Use 'feedback' type for pathfinding feedback (stored in suggestions_and_feedbacks)
          setFeedbackModalVisible(true);
        }}
        styles={styles}
      />

      {/* Pathfinding Details Modal - Full Details */}
      <PathfindingDetailsModal
        visible={showPathfindingDetails}
        rendered={pathfindingDetailsModalRendered}
        slideAnim={pathfindingDetailsSlideAnim}
        onClose={() => {
          setShowPathfindingDetails(false);
          setCameFromPathfindingDetails(false); // Reset flag when Pathfinding Details is closed
        }}
        pointA={pointA}
        pointB={pointB}
        pins={pins}
        onUpdateStartingPoint={() => {
          setShowPathfindingDetails(false);
          setCameFromPathfindingDetails(true); // Track that Update Point A was opened from Pathfinding Details
          setShowUpdatePointA(true);
        }}
        onShowBuildingDetails={(buildingPin, floorLevel, isStartingPoint = false) => {
          // Set the building pin and floor level
          setSelectedPin(buildingPin);
          if (floorLevel !== undefined) {
            // Store floor level in ref for useEffect to use (must be set before opening modal)
            floorFromRoomRef.current = floorLevel;
            hasSetFloorFromRoom.current = false; // Reset flag before opening
            // Set the floor immediately before opening modal
            setSelectedFloor(floorLevel);
          } else {
            // If no floor level provided, reset the ref
            floorFromRoomRef.current = null;
            hasSetFloorFromRoom.current = false;
          }
          // Close pathfinding details modal
          setShowPathfindingDetails(false);
          // Track that Building Details was opened from Pathfinding Details
          setCameFromPathfindingDetails(true);
          // Open building details modal
          setBuildingDetailsVisible(true);
        }}
        styles={styles}
      />

      {/* Step 1 Modal - Where are you? */}
      <Step1Modal
        visible={showStep1Modal}
        rendered={step1ModalRendered}
        slideAnim={step1ModalSlideAnim}
        onClose={() => setShowStep1Modal(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        pointA={pointA}
        pins={pins}
        onSelectPointA={setPointA}
        onOpenStep2={() => {
          setShowStep1Modal(false);
          setShowStep2Modal(true);
        }}
        onOpenQrScanner={() => {
          setShowStep1Modal(false);
          setQrScannerVisible(true);
          setScanned(false);
        }}
        onViewMap={() => {
          console.log('🗺️ View Map clicked for Point A');
          // Ensure modal is closed before setting activeSelector to prevent race conditions
          setModalVisible(false);
          setActiveSelector('A');
          setShowStep1Modal(false);
          setSearchVisible(false);
          setCampusVisible(false);
          setFilterModalVisible(false);
          setSettingsVisible(false);
          setPinsModalVisible(false);
          setPinSelectorModalVisible(false);
          setBuildingDetailsVisible(false);
        }}
        styles={styles}
      />

      {/* Step 2 Modal - Where do you want to go? */}
      <Step2Modal
        visible={showStep2Modal}
        onClose={() => setShowStep2Modal(false)}
        searchQueryB={searchQueryB}
        setSearchQueryB={setSearchQueryB}
        searchResultsB={searchResultsB}
        pointA={pointA}
        pointB={pointB}
        pins={pins}
        onSelectPointB={setPointB}
        onSwapPoints={swapPoints}
        onOpenQrScanner={() => {
          setShowStep2Modal(false);
          setQrScannerVisible(true);
          setScanned(false);
        }}
        onViewMap={() => {
          console.log('🗺️ View Map clicked for Point B');
          // Ensure modal is closed before setting activeSelector to prevent race conditions
          setModalVisible(false);
          setActiveSelector('B');
          setShowStep2Modal(false);
          setSearchVisible(false);
          setCampusVisible(false);
          setFilterModalVisible(false);
          setSettingsVisible(false);
          setPinsModalVisible(false);
          setPinSelectorModalVisible(false);
          setBuildingDetailsVisible(false);
        }}
        onGoNow={() => {
          setShowStep2Modal(false);
          handleStartPathfinding();
        }}
        styles={styles}
      />

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
                  // For rooms, compare with buildingId
                  const pointAId = pointA?.type === 'room' ? (pointA.buildingId || pointA.buildingPin?.id || pointA.id) : pointA?.id;
                  const pointBId = pointB?.type === 'room' ? (pointB.buildingId || pointB.buildingPin?.id || pointB.id) : pointB?.id;
                  if (pointA && (pin.id == pointAId || pin.id == pointA.id)) {
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
                  } else if (pointB && (pin.id == pointBId || pin.id == pointB.id)) {
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
                
                // Apply breathing color animation for active pins - red for clicked pins, blue for highlighted
                // Note: pointA and pointB colors are already set above in pathfinding mode
                if (isActive && !(showPathfindingPanel || pathfindingMode)) {
                  // Use red for clicked pins, blue for highlighted pins
                  if (clickedPin === pin.id) {
                    // Red color for clicked pins
                    fillColor = interpolateRedColor(colorBreathValue, pointAColorLight, pointAColorDark);
                    // Stroke color slightly darker than fill for better contrast
                    const colorMatch = fillColor.match(/\d+/g);
                    if (colorMatch && colorMatch.length >= 3) {
                      const r = Math.max(0, Math.round(parseInt(colorMatch[0]) - 20));
                      const g = Math.max(0, Math.round(parseInt(colorMatch[1]) - 20));
                      const b = Math.max(0, Math.round(parseInt(colorMatch[2]) - 20));
                      strokeColor = `rgb(${r}, ${g}, ${b})`;
                    } else {
                      strokeColor = "#C62828"; // Dark red fallback
                    }
                  } else {
                    // Blue color for highlighted pins (from "Show on Map")
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
              // For rooms, use buildingId to find the pin
              const pointAId = pointA?.type === 'room' ? (pointA.buildingId || pointA.buildingPin?.id || pointA.id) : pointA?.id;
              const pointBId = pointB?.type === 'room' ? (pointB.buildingId || pointB.buildingPin?.id || pointB.id) : pointB?.id;
              const pointAPin = pointA ? visiblePinsForRender.find(p => (p.id == pointAId || p.id == pointA.id) && !p.isInvisible) : null;
              const pointBPin = pointB ? visiblePinsForRender.find(p => (p.id == pointBId || p.id == pointB.id) && !p.isInvisible) : null;
              
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

      <Footer
        pathfindingMode={pathfindingMode}
        isLoggedIn={isLoggedIn}
        onToggleSettings={() => {
          // Close other modals when opening settings
          setSearchVisible(false);
          setCampusVisible(false);
          setFilterModalVisible(false);
          setShowPathfindingPanel(false);
          setPinsModalVisible(false);
          setModalVisible(false);
          setSettingsVisible(true);
        }}
        onTogglePinsModal={togglePinsModal}
        onToggleUserProfile={() => setUserProfileVisible(true)}
        onToggleAuthModal={toggleAuthModal}
        styles={styles}
      />

      {/* --- MODALS --- */}

      <SettingsModal
        rendered={settingsRendered}
        settingsTab={settingsTab}
        setSettingsTab={setSettingsTab}
        settingsSlideAnim={settingsSlideAnim}
        fadeAnim={fadeAnim}
        pointAColorLight={pointAColorLight}
        pointAColorDark={pointAColorDark}
        pointBColorLight={pointBColorLight}
        pointBColorDark={pointBColorDark}
        setPointAColorLight={setPointAColorLight}
        setPointAColorDark={setPointAColorDark}
        setPointBColorLight={setPointBColorLight}
        setPointBColorDark={setPointBColorDark}
        refetchPins={refetchPins}
        loadCampuses={loadCampuses}
        transformFeedbackData={transformFeedbackData}
        isLoggedIn={isLoggedIn}
        authToken={authToken}
        setCurrentUser={setCurrentUser}
        setUserProfile={setUserProfile}
        setSavedPins={setSavedPins}
        setFeedbackHistory={setFeedbackHistory}
        setFeedbackType={setFeedbackType}
        setSelectedPin={setSelectedPin}
        setFeedbackModalVisible={setFeedbackModalVisible}
        setSettingsVisible={setSettingsVisible}
        setAuthModalVisible={setAuthModalVisible}
        developers={developers}
        styles={styles}
      />

      <UserProfileModal
        rendered={userProfileRendered}
        userProfileTab={userProfileTab}
        setUserProfileTab={setUserProfileTab}
        userProfileSlideAnim={userProfileSlideAnim}
        savedPins={savedPins}
        feedbackHistory={feedbackHistory}
        notifications={notifications}
        currentUser={currentUser}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
        isLoggedIn={isLoggedIn}
        authToken={authToken}
        setCurrentUser={setCurrentUser}
        setSavedPins={setSavedPins}
        setFeedbackHistory={setFeedbackHistory}
        setNotifications={setNotifications}
        setAuthModalVisible={setAuthModalVisible}
        setFeedbackModalVisible={setFeedbackModalVisible}
        setSettingsVisible={setSettingsVisible}
        setUserProfileVisible={setUserProfileVisible}
        setIsLoggedIn={setIsLoggedIn}
        setAuthToken={setAuthToken}
        pins={pins}
        setSelectedPin={setSelectedPin}
        handlePinPress={handlePinPress}
        handleProfilePictureUpload={handleProfilePictureUpload}
        setModalVisible={setModalVisible}
        setAuthTab={setAuthTab}
        validatePassword={validatePassword}
        styles={styles}
        setClickedPin={setClickedPin}
        setHighlightedPinOnMap={setHighlightedPinOnMap}
        setCameFromPinDetails={setCameFromPinDetails}
        setSelectedFloor={setSelectedFloor}
        setBuildingDetailsVisible={setBuildingDetailsVisible}
        pushNotificationEnabled={pushNotificationEnabled}
        setPushNotificationEnabled={setPushNotificationEnabled}
        setSearchVisible={setSearchVisible}
        setCampusVisible={setCampusVisible}
        setFilterModalVisible={setFilterModalVisible}
        setShowPathfindingPanel={setShowPathfindingPanel}
        setPinsModalVisible={setPinsModalVisible}
        floorFromRoomRef={floorFromRoomRef}
        hasSetFloorFromRoom={hasSetFloorFromRoom}
      />
      <FeedbackModal
        rendered={feedbackModalRendered}
        feedbackModalFadeAnim={feedbackModalFadeAnim}
        feedbackType={feedbackType}
        selectedPin={selectedPin}
        selectedRoomForReport={selectedRoomForReport}
        isLoggedIn={isLoggedIn}
        authToken={authToken}
        currentUser={currentUser}
        setFeedbackModalVisible={setFeedbackModalVisible}
        setFeedbackHistory={setFeedbackHistory}
        transformFeedbackData={transformFeedbackData}
        setSelectedPin={setSelectedPin}
        setSelectedRoomForReport={setSelectedRoomForReport}
        setFeedbackType={setFeedbackType}
        setCurrentUser={setCurrentUser}
        setAuthModalVisible={setAuthModalVisible}
        currentCampus={currentCampus}
        campusesData={campusesData}
        campuses={campuses}
        styles={styles}
      />
      <RoomSelectionModal
        visible={isRoomSelectionModalVisible}
        selectedPin={selectedPin}
        roomSelectionFloor={roomSelectionFloor}
        setRoomSelectionFloor={setRoomSelectionFloor}
        selectedRoomForReport={selectedRoomForReport}
        setSelectedRoomForReport={setSelectedRoomForReport}
        setRoomSelectionModalVisible={setRoomSelectionModalVisible}
        setFeedbackType={setFeedbackType}
        setFeedbackModalVisible={setFeedbackModalVisible}
        styles={styles}
      />

      <FilterModal
        rendered={filterModalRendered}
        filterModalSlideAnim={filterModalSlideAnim}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        selectAllCategories={selectAllCategories}
        clearAllCategories={clearAllCategories}
        pins={pins}
        currentCampus={currentCampus}
        handlePinPress={handlePinPress}
        setFilterModalVisible={setFilterModalVisible}
        styles={styles}
      />


      {/* QR Code Display Modal (for showing building QR codes) */}
      <QrCodeDisplayModal
        visible={isQrCodeVisible}
        qrCodeData={qrCodeData}
        selectedPin={selectedPin}
        onClose={() => {
          setQrCodeVisible(false);
          setQrCodeData(null);
        }}
      />

      {/* QR Code Scanner Modal */}
      <QrScannerModal
        visible={isQrScannerVisible}
        scanned={scanned}
        onClose={() => {
          setQrScannerVisible(false);
          setScanned(false);
        }}
        onScan={(data) => handleQrCodeScan(data)}
      />

      {/* Fullscreen Image Viewer Modal */}
      <FullscreenImageModal
        visible={isFullscreenImageVisible}
        imageSource={fullscreenImageSource}
        onClose={() => setFullscreenImageVisible(false)}
      />

      {/* Alert Modal */}
      <AlertModal
        visible={showAlertModal}
        message={alertMessage}
        onClose={() => setShowAlertModal(false)}
      />

      {/* Campus Change Modal */}
      <CampusSelectorModal
        visible={isCampusVisible}
        rendered={campusRendered}
        campuses={campuses}
        campusesData={campusesData}
        onSelectCampus={handleCampusChange}
        slideAnim={campusAnim}
        styles={styles}
      />

      {/* Authentication Modal */}
      <AuthModal
        rendered={authModalRendered}
        authTab={authTab}
        setAuthTab={setAuthTab}
        authModalSlideAnim={authModalSlideAnim}
        isAuthModalVisible={isAuthModalVisible}
        setAuthModalVisible={setAuthModalVisible}
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        regUsername={regUsername}
        setRegUsername={setRegUsername}
        regEmail={regEmail}
        setRegEmail={setRegEmail}
        regPassword={regPassword}
        setRegPassword={setRegPassword}
        regConfirmPassword={regConfirmPassword}
        setRegConfirmPassword={setRegConfirmPassword}
        showRegPassword={showRegPassword}
        setShowRegPassword={setShowRegPassword}
        showRegConfirmPassword={showRegConfirmPassword}
        setShowRegConfirmPassword={setShowRegConfirmPassword}
        regSecretQuestion={regSecretQuestion}
        setRegSecretQuestion={setRegSecretQuestion}
        regSecretAnswer={regSecretAnswer}
        setRegSecretAnswer={setRegSecretAnswer}
        forgotSecretQuestion={forgotSecretQuestion}
        setForgotSecretQuestion={setForgotSecretQuestion}
        forgotSecretAnswer={forgotSecretAnswer}
        setForgotSecretAnswer={setForgotSecretAnswer}
        forgotNewPassword={forgotNewPassword}
        setForgotNewPassword={setForgotNewPassword}
        forgotConfirmPassword={forgotConfirmPassword}
        setForgotConfirmPassword={setForgotConfirmPassword}
        showForgotPassword={showForgotPassword}
        setShowForgotPassword={setShowForgotPassword}
        showForgotConfirmPassword={showForgotConfirmPassword}
        setShowForgotConfirmPassword={setShowForgotConfirmPassword}
        showSecretQuestionPicker={showSecretQuestionPicker}
        setShowSecretQuestionPicker={setShowSecretQuestionPicker}
        secretQuestions={secretQuestions}
        setIsLoggedIn={setIsLoggedIn}
        setAuthToken={setAuthToken}
        setCurrentUser={setCurrentUser}
        setUserProfile={setUserProfile}
        setSavedPins={setSavedPins}
        setFeedbackHistory={setFeedbackHistory}
        validatePassword={validatePassword}
        validateUsername={validateUsername}
        styles={styles}
      />

      {/* Search Modal */}
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
            {searchQuery.length > 0 && searchResults.length > 0 && (
              <ScrollView style={{
                marginTop: 10,
                maxHeight: 400,
                borderRadius: 8,
                backgroundColor: '#fff',
                borderWidth: 1,
                borderColor: '#ddd',
              }}>
                {searchResults.map((item, index) => (
                  <TouchableOpacity 
                    key={item.type === 'room' ? `room-${item.id}-${index}` : item.id.toString()}
                    onPress={() => {
                      if (item.type === 'room') {
                        // Handle room selection
                        const buildingPin = item.buildingPin || pins.find(p => 
                          (p.buildingNumber || p.id) === item.buildingId ||
                          p.id === item.buildingId ||
                          String(p.buildingNumber || p.id) === String(item.buildingId)
                        );
                        if (buildingPin) {
                          // Find the correct floor level by searching through floors
                          let floorLevel = null;
                          
                          // Priority 1: Use item.floorLevel if available and valid
                          if (typeof item.floorLevel === 'number') {
                            floorLevel = item.floorLevel;
                          } 
                          // Priority 2: Search through building floors to find the room
                          else if (buildingPin.floors && Array.isArray(buildingPin.floors)) {
                            for (const floor of buildingPin.floors) {
                              if (floor.rooms && Array.isArray(floor.rooms)) {
                                // Use same matching logic as UserProfileModal with better normalization
                                const normalizeString = (str) => str ? str.toString().replace(/\s+/g, '').toLowerCase() : '';
                                
                                const roomFound = floor.rooms.find(r => {
                                  const roomName = normalizeString(r.name);
                                  const roomId = normalizeString(r.id);
                                  const itemName = normalizeString(item.name);
                                  const itemId = normalizeString(item.id);
                                  
                                  return (itemName && roomName && itemName === roomName) ||
                                         (itemId && roomId && itemId === roomId) ||
                                         (item.name && r.name && item.name === r.name) ||
                                         (item.id && r.id && item.id === r.id);
                                });
                                
                                if (roomFound) {
                                  floorLevel = floor.level;
                                  break;
                                }
                              }
                            }
                          }
                          
                          // Fallback to first floor if not found
                          if (floorLevel === null) {
                            floorLevel = buildingPin.floors?.[0]?.level || 0;
                          }
                          
                          // Validate floor level is a number
                          if (typeof floorLevel !== 'number') {
                            floorLevel = buildingPin.floors?.[0]?.level || 0;
                          }
                          
                          setSelectedPin(buildingPin);
                          setClickedPin(buildingPin.id);
                          setHighlightedPinOnMap(null);
                          setSearchVisible(false);
                          setCampusVisible(false);
                          setFilterModalVisible(false);
                          setShowPathfindingPanel(false);
                          setSettingsVisible(false);
                          setPinsModalVisible(false);
                          setCameFromPinDetails(false);
                          
                          // Store floor level in ref for useEffect to use (must be set before opening modal)
                          floorFromRoomRef.current = floorLevel;
                          hasSetFloorFromRoom.current = false; // Reset flag before opening
                          
                          // Set the floor immediately before opening modal
                          setSelectedFloor(floorLevel);
                          setBuildingDetailsVisible(true);
                        }
                      } else {
                        handlePinPress(item);
                      }
                      setSearchQuery('');
                    }} 
                    style={{
                      padding: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: '#f0f0f0',
                      backgroundColor: '#fff',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 4 }}>
                      {item.type === 'room' 
                        ? (item.description && item.description.includes(' - ') 
                            ? item.description.split(' - ')[1] 
                            : (item.description || item.name))
                        : item.description}
                    </Text>
                    {item.type === 'room' && (
                      <Text style={{ fontSize: 12, color: '#666' }}>
                        {item.buildingPin ? `${item.buildingPin.description || item.buildingPin.title}` : ''}
                        {item.floorLevel !== undefined ? ` • ${getFloorName(item.floorLevel)}` : (item.floor ? ` • ${item.floor}` : '')}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            {searchQuery.length > 0 && searchResults.length === 0 && (
              <View style={{ marginTop: 10, padding: 10 }}>
                <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
                  No results found
                </Text>
              </View>
            )}
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
                {categorizedPins.map((category) => (
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
                              if (!isLoggedIn || !authToken) {
                                Alert.alert(
                                  'Login Required',
                                  'You must be logged in to save pins. Please login to continue.',
                                  [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                      text: 'Login',
                                      onPress: () => {
                                        setPinsModalVisible(false);
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
                                      const updatedUser = await getCurrentUser(authToken);
                                      setCurrentUser(updatedUser);
                                      if (updatedUser.activity && updatedUser.activity.savedPins && pins && pins.length > 0) {
                                        const enrichedSavedPins = updatedUser.activity.savedPins.map(savedPin => {
                                          const fullPin = pins.find(p => p.id === savedPin.id);
                                          if (fullPin) {
                                            return { ...fullPin, ...savedPin, image: savedPin.image || fullPin.image };
                                          }
                                          return savedPin;
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
                                      const updatedUser = await getCurrentUser(authToken);
                                      setCurrentUser(updatedUser);
                                      if (updatedUser.activity && updatedUser.activity.savedPins && pins && pins.length > 0) {
                                        const enrichedSavedPins = updatedUser.activity.savedPins.map(savedPin => {
                                          const fullPin = pins.find(p => p.id === savedPin.id);
                                          if (fullPin) {
                                            return { ...fullPin, ...savedPin, image: savedPin.image || fullPin.image };
                                          }
                                          return savedPin;
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

      {/* Pin Details Modal - Bottom Slide-in Panel */}
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
                  style={[styles.iconButton, { flex: 1, marginRight: 5, width: 0, height: 44, minHeight: 44, elevation: 0, shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 } }]} 
                  onPress={() => {
                    if (selectedPin) {
                      setPointB(selectedPin);
                      setModalVisible(false);
                      setSearchVisible(false);
                      setCampusVisible(false);
                      setFilterModalVisible(false);
                      setSettingsVisible(false);
                      setPinsModalVisible(false);
                      setShowStep1Modal(true);
                      setPathfindingMode(false);
                      setPath([]);
                    }
                  }}
                >
                  <Icon name="location-arrow" size={16} color="white" />
                  <Text style={[styles.buttonText, { fontSize: 11 }]} numberOfLines={1}>Navigate</Text>
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
              <View style={{ backgroundColor: '#f5f5f5', paddingTop: 4 }}>
                <TouchableOpacity 
                  style={[styles.closeButton, { height: 44, minHeight: 44, elevation: 0, shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 } }]} 
                  onPress={() => {
                    if (selectedPin && selectedPin.isVisible === true) {
                      setCameFromPinDetails(true);
                      setPinDetailModalRendered(false);
                      setModalVisible(false);
                      setBuildingDetailsVisible(true);
                      const firstFloor = selectedPin?.floors?.[0];
                      setSelectedFloor(firstFloor ? firstFloor.level : 0);
                    } else {
                      setModalVisible(false);
                    }
                  }}
                >
                  <Text style={[styles.buttonText, { textAlign: 'center' }]}>View More Details</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </Pressable>
      )}

      {/* Building Details Modal - Bottom Slide-in Panel */}
      <Modal
        visible={buildingDetailsRendered && selectedPin && selectedPin.isVisible === true}
        transparent={true}
        animationType="none"
        onRequestClose={() => {
          setBuildingDetailsVisible(false);
          if (cameFromPathfindingDetails) {
            setCameFromPathfindingDetails(false);
            setShowPathfindingDetails(true);
          } else if (cameFromPinDetails) {
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
                    const floorName = getFloorName(floor.level);
                    return (
                      <TouchableOpacity
                        key={floor.level}
                        style={[
                          styles.floorButton,
                          selectedFloor === floor.level && styles.floorButtonSelected,
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
                      const hasFloorsAndRooms = selectedPin?.floors && selectedPin.floors.length > 0 && 
                        selectedPin.floors.some(floor => floor.rooms && floor.rooms.length > 0);
      
                      if (hasFloorsAndRooms) {
                        setRoomSelectionFloor(selectedFloor);
                        setSelectedRoomForReport(null);
                        setRoomSelectionModalVisible(true);
                      } else {
                        setSelectedRoomForReport(null);
                        setFeedbackType('report');
                        setFeedbackModalVisible(true);
                      }
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
      
              <Text style={styles.roomsTitle}>Areas (first = left side, last = right side):</Text>
              {selectedPin?.floors?.find(f => f.level === selectedFloor)?.rooms?.map((room) => {
                const currentFloor = selectedPin?.floors?.find(f => f.level === selectedFloor);
                const roomAsPin = {
                  id: room.name || room.id,
                  title: room.name,
                  description: `${selectedPin?.description || selectedPin?.title || 'Building'} - ${room.description || ''}`,
                  image: room.image || selectedPin?.image || require('./assets/icon.png'),
                  x: selectedPin?.x || 0,
                  y: selectedPin?.y || 0,
                  buildingPin: selectedPin,
                  buildingId: selectedPin?.id,
                  floorLevel: currentFloor?.level ?? selectedFloor,
                  type: 'room',
                  roomId: `${selectedPin?.id}_f${currentFloor?.level ?? selectedFloor}_${room.name || room.id}`,
                };
                const isRoomSaved = savedPins.some(p => p.id === (room.name || room.id));
                const uniqueKey = `${currentFloor?.level ?? selectedFloor}:${room.name || room.id}`;
                // Generate room ID for QR code (format: buildingId_f{floorLevel}_roomName)
                const roomId = `${selectedPin?.id}_f${currentFloor?.level ?? selectedFloor}_${room.name || room.id}`;
                const roomQrCodeData = `campustrails://room/${roomId}`;
                const roomImage = room.image || selectedPin?.image || require('./assets/icon.png');
                
                return (
                  <TouchableOpacity
                    key={uniqueKey} 
                    style={styles.roomCard}
                    onPress={() => {
                      // Show room image in fullscreen
                      if (room.image) {
                        const imageSource = getOptimizedImage(room.image);
                        setFullscreenImageSource(imageSource);
                        setFullscreenImageVisible(true);
                      } else if (selectedPin?.image) {
                        const imageSource = getOptimizedImage(selectedPin.image);
                        setFullscreenImageSource(imageSource);
                        setFullscreenImageVisible(true);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={getOptimizedImage(room.image || selectedPin?.image || require('./assets/icon.png'))}
                      style={styles.roomCardImage}
                      resizeMode="cover"
                    />
                    <View style={styles.roomCardContent}>
                      <Text style={styles.roomDescription}>
                        {room.description || 'No description'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        // Show QR code for this room
                        const roomPinForQr = {
                          ...roomAsPin,
                          title: room.description || room.name, // Use description instead of title
                          description: `${selectedPin?.description || selectedPin?.title || 'Building'} - ${room.description || room.name}`,
                        };
                        setSelectedPin(roomPinForQr);
                        setQrCodeData(roomQrCodeData);
                        setQrCodeVisible(true);
                      }}
                      style={{
                        padding: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Icon name="qrcode" size={20} color="#007bff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={async (e) => {
                        e.stopPropagation();
                        if (!isLoggedIn || !authToken) {
                          Alert.alert(
                            'Login Required',
                            'You must be logged in to save rooms. Please login to continue.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Login',
                                onPress: () => {
                                  setBuildingDetailsVisible(false);
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
                            const roomId = room.name || room.id;
                            const updatedSavedPins = savedPins.filter(p => p.id !== roomId);
                            setSavedPins(updatedSavedPins);
                            await removeSavedPin(roomId);
                            if (isLoggedIn && authToken) {
                              try {
                                await updateUserActivity(authToken, { savedPins: updatedSavedPins });
                                const updatedUser = await getCurrentUser(authToken);
                                setCurrentUser(updatedUser);
                                if (updatedUser.activity && updatedUser.activity.savedPins && pins && pins.length > 0) {
                                  const enrichedSavedPins = updatedUser.activity.savedPins.map(savedPin => {
                                    const fullPin = pins.find(p => p.id === savedPin.id);
                                    if (fullPin) {
                                      return { ...fullPin, ...savedPin, image: savedPin.image || fullPin.image };
                                    }
                                    return savedPin;
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
                            const updatedSavedPins = [...savedPins, roomAsPin];
                            setSavedPins(updatedSavedPins);
                            await addSavedPin(roomAsPin);
                            if (isLoggedIn && authToken) {
                              try {
                                await updateUserActivity(authToken, { savedPins: updatedSavedPins });
                                const updatedUser = await getCurrentUser(authToken);
                                setCurrentUser(updatedUser);
                                if (updatedUser.activity && updatedUser.activity.savedPins && pins && pins.length > 0) {
                                  const enrichedSavedPins = updatedUser.activity.savedPins.map(savedPin => {
                                    const fullPin = pins.find(p => p.id === savedPin.id);
                                    if (fullPin) {
                                      return { ...fullPin, ...savedPin, image: savedPin.image || fullPin.image };
                                    }
                                    return savedPin;
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
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}
      </Modal>
    </View>
  );
};


export default App;