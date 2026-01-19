import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Animated, StyleSheet, Alert, TextInput, KeyboardAvoidingView, Platform, Image, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { ExpoImage, getOptimizedImage } from '../utils/imageUtils';
import * as ImagePicker from 'expo-image-picker';
import { getProfilePictureUrl, uploadToCloudinaryDirect } from '../utils/cloudinaryUtils';
import { getFloorName } from '../utils/floorUtils';
import { updateUserProfile, changePassword, logout, getUserNotifications, markNotificationAsRead, deleteNotification, clearAllUserNotifications, registerPushToken } from '../services/api';
import { registerForPushNotificationsAsync } from '../utils/notificationService';
import { styles } from '../styles';

/**
 * User Profile Modal Component
 * Large modal with four tabs: Saved Pins, Feedback, Notifications, and Account
 */
const UserProfileModal = ({
  rendered,
  userProfileTab,
  setUserProfileTab,
  userProfileSlideAnim,
  savedPins,
  feedbackHistory,
  notifications,
  currentUser,
  userProfile,
  setUserProfile,
  isLoggedIn,
  authToken,
  setCurrentUser,
  setSavedPins,
  setFeedbackHistory,
  setNotifications,
  setAuthModalVisible,
  setFeedbackModalVisible,
  setSettingsVisible,
  setUserProfileVisible,
  setIsLoggedIn,
  setAuthToken,
  pins,
  setSelectedPin,
  handlePinPress: handlePinPressProp,
  handleProfilePictureUpload,
  setModalVisible,
  setAuthTab,
  validatePassword,
  styles: customStyles,
  setClickedPin,
  setHighlightedPinOnMap,
  setCameFromPinDetails,
  setSelectedFloor,
  setBuildingDetailsVisible,
  pushNotificationEnabled,
  setPushNotificationEnabled,
  setSearchVisible,
  setCampusVisible,
  setFilterModalVisible,
  setShowPathfindingPanel,
  setPinsModalVisible,
  floorFromRoomRef,
  hasSetFloorFromRoom
}) => {
  const userProfileStyles = customStyles || styles;
  const { height } = Dimensions.get('window');

  // Local state for account tab
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  return (
    <Modal
      visible={rendered}
      transparent={true}
      animationType="none"
      onRequestClose={() => setUserProfileVisible(false)}
    >
      {rendered && (
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
            <View style={userProfileStyles.modalHeaderWhite}>
              <Text style={[userProfileStyles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>User Profile</Text>
            </View>
            <View style={userProfileStyles.lineDark}></View>
    
            {/* Horizontal Tab Buttons */}
            <View style={{ flexDirection: 'row', backgroundColor: '#f5f5f5', paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#dee2e6' }}>
              <TouchableOpacity 
                onPress={() => setUserProfileTab('saved')} 
                style={[
                  { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 5, marginRight: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: userProfileTab === 'saved' ? '#28a745' : '#e9ecef' }
                ]}
              >
                <Icon 
                  name="heart" 
                  size={16} 
                  color={userProfileTab === 'saved' ? '#fff' : '#6c757d'} 
                  style={{ marginBottom: 4 }}
                />
                <Text style={{ fontSize: 12, color: userProfileTab === 'saved' ? '#fff' : '#6c757d', fontWeight: userProfileTab === 'saved' ? '600' : '400' }}>
                  Saved Pins
                </Text>
              </TouchableOpacity>
    
              <TouchableOpacity 
                onPress={() => setUserProfileTab('feedback')} 
                style={[
                  { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 5, marginRight: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: userProfileTab === 'feedback' ? '#28a745' : '#e9ecef' }
                ]}
              >
                <Icon 
                  name="star" 
                  size={16} 
                  color={userProfileTab === 'feedback' ? '#fff' : '#6c757d'} 
                  style={{ marginBottom: 4 }}
                />
                <Text style={{ fontSize: 12, color: userProfileTab === 'feedback' ? '#fff' : '#6c757d', fontWeight: userProfileTab === 'feedback' ? '600' : '400' }}>
                  Feedback
                </Text>
              </TouchableOpacity>
    
              <TouchableOpacity 
                onPress={() => setUserProfileTab('notifications')} 
                style={[
                  { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 5, marginRight: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: userProfileTab === 'notifications' ? '#28a745' : '#e9ecef' }
                ]}
              >
                <Icon 
                  name="bell" 
                  size={16} 
                  color={userProfileTab === 'notifications' ? '#fff' : '#6c757d'} 
                  style={{ marginBottom: 4 }}
                />
                <Text style={{ fontSize: 12, color: userProfileTab === 'notifications' ? '#fff' : '#6c757d', fontWeight: userProfileTab === 'notifications' ? '600' : '400' }}>
                  Notifications
                </Text>
              </TouchableOpacity>
    
              <TouchableOpacity 
                onPress={() => setUserProfileTab('settings')} 
                style={[
                  { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: userProfileTab === 'settings' ? '#28a745' : '#e9ecef' }
                ]}
              >
                <Icon 
                  name="user" 
                  size={16} 
                  color={userProfileTab === 'settings' ? '#fff' : '#6c757d'} 
                  style={{ marginBottom: 4 }}
                />
                <Text style={{ fontSize: 12, color: userProfileTab === 'settings' ? '#fff' : '#6c757d', fontWeight: userProfileTab === 'settings' ? '600' : '400' }}>
                  Account
                </Text>
              </TouchableOpacity>
            </View>
    
            {/* Tab Content */}
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
                          userProfileStyles.facilityButton,
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
    
                              // Open Building Details Modal with correct floor
                              setCameFromPinDetails(false);
                              
                              // Store floor level in ref for useEffect to use (must be set before opening modal)
                              // Floor level structure: 0=Ground, 1=2nd, 2=3rd, etc.
                              if (floorFromRoomRef) {
                                floorFromRoomRef.current = floorLevel;
                              }
                              if (hasSetFloorFromRoom) {
                                hasSetFloorFromRoom.current = false; // Reset flag before opening
                              }
                              
                              // Set the floor immediately before opening modal to ensure floor button responds
                              setSelectedFloor(floorLevel);
                              console.log('📌 Saved room - setSelectedFloor called with:', floorLevel);
                              console.log('📌 Saved room - floorFromRoomRef.current set to:', floorLevel);
                              
                              // Open building details modal
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
                              <View style={[userProfileStyles.facilityButtonImage, { backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center' }]}>
                                <Icon name="image" size={30} color="#999" />
                              </View>
                            );
                          }
    
                          const imageSource = getOptimizedImage(pin.image);
    
                          // If it's a local require (number type), use Image
                          if (typeof imageSource === 'number') {
                            return <Image source={imageSource} style={userProfileStyles.facilityButtonImage} resizeMode="cover" />;
                          }
    
                          // If it's an object without uri (local asset), use Image
                          if (imageSource && typeof imageSource === 'object' && !imageSource.uri) {
                            return <Image source={imageSource} style={userProfileStyles.facilityButtonImage} resizeMode="cover" />;
                          }
    
                          // If it's a string or object with uri (remote URL), use ExpoImage
                          if (typeof imageSource === 'string' || (imageSource && imageSource.uri)) {
                            return <ExpoImage source={typeof imageSource === 'string' ? { uri: imageSource } : imageSource} style={userProfileStyles.facilityButtonImage} contentFit="cover" cachePolicy="disk" />;
                          }
    
                          // Fallback to placeholder
                          return (
                            <View style={[userProfileStyles.facilityButtonImage, { backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center' }]}>
                              <Icon name="image" size={30} color="#999" />
                            </View>
                          );
                        })()}
                        <View style={[userProfileStyles.facilityButtonContent, { flex: 1 }]}>
                          <Text style={[
                            userProfileStyles.facilityName,
                            isRoom && { fontWeight: '600' }
                          ]}>
                            {(() => {
                              // For rooms, extract just the room description (part after " - ")
                              if (isRoom && pin.description && pin.description.includes(' - ')) {
                                const roomDesc = pin.description.split(' - ')[1];
                                return roomDesc || pin.name || pin.title;
                              }
                              // For buildings, show full description
                              return pin.description || pin.name || pin.title;
                            })()}
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
                      <TouchableOpacity 
                        key={feedback.id} 
                        style={userProfileStyles.feedbackCard}
                        onPress={() => {
                          Alert.alert(
                            feedback.pinTitle || 'Feedback',
                            feedback.comment || 'No comment provided.',
                            [{ text: 'OK' }]
                          );
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={userProfileStyles.feedbackCardHeader}>
                          <Text style={userProfileStyles.feedbackCardTitle} numberOfLines={2}>
                            {feedback.pinTitle}
                          </Text>
                          <View style={userProfileStyles.feedbackCardStars}>
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
                        {feedback.roomDescription && (
                          <View style={{ marginBottom: 8, paddingVertical: 6, paddingHorizontal: 8, backgroundColor: '#e3f2fd', borderRadius: 4 }}>
                            <Text style={{ fontSize: 12, color: '#1976d2', fontWeight: '600', marginBottom: 2 }}>
                              Room: {feedback.roomName || 'N/A'}
                            </Text>
                            <Text style={{ fontSize: 11, color: '#424242' }}>
                              {feedback.roomDescription}
                            </Text>
                            {feedback.floorName && (
                              <Text style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
                                {feedback.floorName}
                              </Text>
                            )}
                          </View>
                        )}
                        {feedback.comment && (
                          <View style={{ marginBottom: 12 }}>
                            <ScrollView 
                              style={{ maxHeight: 120 }}
                              nestedScrollEnabled={true}
                              showsVerticalScrollIndicator={true}
                              bounces={false}
                            >
                              <Text style={userProfileStyles.feedbackCardComment}>
                                {feedback.comment}
                              </Text>
                            </ScrollView>
                          </View>
                        )}
                        <Text style={userProfileStyles.feedbackCardDate}>
                          {new Date(feedback.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </Text>
                      </TouchableOpacity>
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
                          <Text style={[userProfileStyles.settingLabel, { marginBottom: 4 }]}>Push Notifications</Text>
                          <Text style={[userProfileStyles.settingDescription, { fontSize: 12, color: pushNotificationEnabled ? '#28a745' : '#dc3545' }]}>
                            {pushNotificationEnabled ? '✓ Enabled' : '✗ Not enabled'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            userProfileStyles.authButton,
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
                          <Text style={userProfileStyles.authButtonText}>
                            {pushNotificationEnabled ? 'Re-enable' : 'Enable'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={[userProfileStyles.settingDescription, { fontSize: 12, color: '#666', marginTop: 8 }]}>
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
                        <TouchableOpacity
                          key={notification.id}
                          onPress={() => {
                            const fullContent = `${notification.title}\n\n${notification.body || 'No additional content.'}`;
                            Alert.alert(
                              notification.title || 'Notification',
                              fullContent,
                              [{ text: 'OK' }]
                            );
                          }}
                          activeOpacity={0.7}
                          style={[
                            userProfileStyles.feedbackCard,
                            { 
                              opacity: notification.read ? 0.7 : 1,
                              borderLeftWidth: notification.read ? 0 : 4,
                              borderLeftColor: '#007bff',
                              marginBottom: 12
                            }
                          ]}
                        >
                          <View style={userProfileStyles.feedbackCardHeader}>
                            <Text style={[userProfileStyles.feedbackCardTitle, { flex: 1 }]} numberOfLines={2}>
                              {notification.title}
                            </Text>
                            <TouchableOpacity
                              onPress={async (e) => {
                                e.stopPropagation();
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
                              <Text style={[userProfileStyles.feedbackCardComment, { color: '#666' }]}>
                                {notification.body}
                              </Text>
                            </View>
                          )}
                          {notification.data && Object.keys(notification.data).length > 0 && (
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
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
                          <Text style={userProfileStyles.feedbackCardDate}>
                            {new Date(notification.date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </TouchableOpacity>
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
                    <View style={userProfileStyles.settingsCategoryContainer}>
                      <Text style={userProfileStyles.settingsCategoryTitle}>Change Password</Text>
    
                      <View style={[userProfileStyles.settingItem, { width: '100%' }]}>
                        <View style={[userProfileStyles.authPasswordContainer, { width: '100%' }]}>
                          <TextInput
                            style={[userProfileStyles.authInput, { flex: 1, paddingRight: 40, width: '100%' }]}
                            placeholder="Enter old password"
                            secureTextEntry={!showOldPassword}
                            value={oldPassword}
                            onChangeText={setOldPassword}
                            placeholderTextColor="#999"
                          />
                          <TouchableOpacity 
                            onPress={() => setShowOldPassword(!showOldPassword)} 
                            style={[userProfileStyles.authPasswordToggle, { position: 'absolute', right: 8 }]}
                          >
                            <Icon name={showOldPassword ? 'eye' : 'eye-slash'} size={16} color="#666" />
                          </TouchableOpacity>
                        </View>
                      </View>
    
                      <View style={[userProfileStyles.settingItem, { marginTop: 20 }]}>
                        <View style={userProfileStyles.authPasswordContainer}>
                          <TextInput
                            style={[
                              userProfileStyles.authInput, 
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
                            style={[userProfileStyles.authPasswordToggle, { position: 'absolute', right: 8 }]}
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
    
                      <View style={[userProfileStyles.settingItem, { marginTop: 20 }]}>
                        <View style={userProfileStyles.authPasswordContainer}>
                          <TextInput
                            style={[
                              userProfileStyles.authInput, 
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
                            style={[userProfileStyles.authPasswordToggle, { position: 'absolute', right: 8 }]}
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
                        style={[userProfileStyles.authButton, { marginTop: 20, backgroundColor: '#28a745' }]}
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
                        <Text style={userProfileStyles.authButtonText}>Change Password</Text>
                      </TouchableOpacity>
                    </View>
    
                  </ScrollView>
                </KeyboardAvoidingView>
              )}
            </View>
            
            {/* Footer with Logout Button */}
            {isLoggedIn && (
              <View style={{ backgroundColor: '#f5f5f5', borderTopWidth: 1, borderTopColor: '#dee2e6', padding: 15 }}>
                <TouchableOpacity
                  style={[userProfileStyles.authButton, { backgroundColor: '#dc3545', width: '100%' }]}
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
                  <Text style={userProfileStyles.authButtonText}>Logout</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </>
      )}
    </Modal>
  );
};

export default UserProfileModal;
