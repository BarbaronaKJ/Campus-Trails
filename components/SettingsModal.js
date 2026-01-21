import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Animated, StyleSheet, Alert } from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { ExpoImage } from '../utils/imageUtils';
import { clearImageCache } from '../utils/imageUtils';
import { getCurrentUser } from '../services/api';
import { styles } from '../styles';

/**
 * Settings Modal Component
 * Large modal with three tabs: General, About Us, and Help
 */
const SettingsModal = ({
  rendered,
  settingsTab,
  setSettingsTab,
  settingsSlideAnim,
  fadeAnim,
  pointAColorLight,
  pointAColorDark,
  pointBColorLight,
  pointBColorDark,
  setPointAColorLight,
  setPointAColorDark,
  setPointBColorLight,
  setPointBColorDark,
  refetchPins,
  loadCampuses,
  transformFeedbackData,
  isLoggedIn,
  authToken,
  setCurrentUser,
  setUserProfile,
  setSavedPins,
  setFeedbackHistory,
  setFeedbackType,
  setSelectedPin,
  setFeedbackModalVisible,
  setSettingsVisible,
  setAuthModalVisible,
  developers,
  setUserGuideVisible,
  styles: customStyles
}) => {
  const settingsStyles = customStyles || styles;

  return (
    <Modal
      visible={rendered}
      transparent={true}
      animationType="none"
      onRequestClose={() => setSettingsVisible(false)}
    >
      {rendered && (
        <Animated.View 
          style={[
            StyleSheet.absoluteFill,
            settingsStyles.settingsScreen,
            {
              transform: [{ translateY: settingsSlideAnim }],
            }
          ]}
        >
        <View style={settingsStyles.modalHeaderWhite}>
          <Text style={[settingsStyles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>Settings</Text>
        </View>
        <View style={settingsStyles.lineDark}></View>
    
        <View style={[settingsStyles.settingsTabRow, { backgroundColor: 'white', paddingHorizontal: 20, paddingBottom: 10 }]}>
          <TouchableOpacity onPress={() => setSettingsTab('general')} style={[settingsStyles.settingsTabButton, settingsTab === 'general' && settingsStyles.settingsTabActive, { flex: 1 }]}>
            <Text style={settingsTab === 'general' ? settingsStyles.settingsTabActiveText : { color: '#333' }}>General</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setSettingsTab('about'); fadeAnim.setValue(0); }} style={[settingsStyles.settingsTabButton, settingsTab === 'about' && settingsStyles.settingsTabActive, { flex: 1 }]}>
            <Text style={settingsTab === 'about' ? settingsStyles.settingsTabActiveText : { color: '#333' }}>About Us</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setSettingsTab('help'); fadeAnim.setValue(0); }} style={[settingsStyles.settingsTabButton, settingsTab === 'help' && settingsStyles.settingsTabActive, { flex: 1 }]}>
            <Text style={settingsTab === 'help' ? settingsStyles.settingsTabActiveText : { color: '#333' }}>Help</Text>
          </TouchableOpacity>
        </View>
    
        <View style={settingsStyles.lineDark}></View>
    
        <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
          {settingsTab === 'general' && (
            <Animated.ScrollView style={[settingsStyles.aboutContent, { opacity: fadeAnim }]}>
              {/* Pathfinding Category */}
              <View style={settingsStyles.settingsCategoryContainer}>
                <Text style={settingsStyles.settingsCategoryTitle}>Pathfinding</Text>
    
                {/* Point A Color Picker */}
                <View style={settingsStyles.settingItem}>
                <View style={settingsStyles.settingItemContent}>
                  <Text style={settingsStyles.settingLabel}>Start Point Color (Point A)</Text>
                  <Text style={settingsStyles.settingDescription}>Select light and dark shades for the start point</Text>
                </View>
              </View>
              <View style={[settingsStyles.colorPickerContainer, { marginTop: 15 }]}>
                <View style={settingsStyles.colorPickerRow}>
                  <Text style={settingsStyles.colorPickerLabel}>Light:</Text>
                  <View style={settingsStyles.colorSwatchesContainer}>
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
                          settingsStyles.colorSwatch,
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
                <View style={settingsStyles.colorPickerRow}>
                  <Text style={settingsStyles.colorPickerLabel}>Dark:</Text>
                  <View style={settingsStyles.colorSwatchesContainer}>
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
                          settingsStyles.colorSwatch,
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
                <View style={settingsStyles.settingItem}>
                <View style={settingsStyles.settingItemContent}>
                  <Text style={settingsStyles.settingLabel}>Destination Color (Point B)</Text>
                  <Text style={settingsStyles.settingDescription}>Select light and dark shades for the destination</Text>
                </View>
              </View>
              <View style={[settingsStyles.colorPickerContainer, { marginTop: 15 }]}>
                <View style={settingsStyles.colorPickerRow}>
                  <Text style={settingsStyles.colorPickerLabel}>Light:</Text>
                  <View style={settingsStyles.colorSwatchesContainer}>
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
                          settingsStyles.colorSwatch,
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
                <View style={settingsStyles.colorPickerRow}>
                  <Text style={settingsStyles.colorPickerLabel}>Dark:</Text>
                  <View style={settingsStyles.colorSwatchesContainer}>
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
                          settingsStyles.colorSwatch,
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
              <View style={[settingsStyles.settingsCategoryContainer, { marginTop: 30, marginBottom: 20 }]}>
                <Text style={settingsStyles.settingsCategoryTitle}>Data & Database</Text>
    
                <View style={settingsStyles.settingItem}>
                  <View style={settingsStyles.settingItemContent}>
                    <Text style={settingsStyles.settingLabel}>Refresh Data</Text>
                    <Text style={settingsStyles.settingDescription}>Reload all data from database (pins and user data)</Text>
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
              <View style={[settingsStyles.settingsCategoryContainer, { marginTop: 30, marginBottom: 20 }]}>
                <Text style={settingsStyles.settingsCategoryTitle}>Storage</Text>
    
                <View style={settingsStyles.settingItem}>
                  <View style={settingsStyles.settingItemContent}>
                    <Text style={settingsStyles.settingLabel}>Clear Cache</Text>
                    <Text style={settingsStyles.settingDescription}>Clear all cached images to free up storage space</Text>
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
              style={[settingsStyles.aboutContent, { opacity: fadeAnim }]}
              contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            >
    
              {/* Developers Section */}
              <View style={{ marginBottom: 20 }}>
                <Text style={[settingsStyles.aboutLabel, { color: '#555', fontSize: 18, fontWeight: '600', marginBottom: 20 }]}>Development Team</Text>
    
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
              <View style={[settingsStyles.settingsCategoryContainer, { marginTop: 30, marginBottom: 20 }]}>
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
            <Animated.ScrollView style={[settingsStyles.aboutContent, { opacity: fadeAnim }]}>
              {/* User Guide Button */}
              <View style={[settingsStyles.settingsCategoryContainer, { marginTop: 10, marginBottom: 20 }]}>
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
                    setSettingsVisible(false);
                    if (setUserGuideVisible) {
                      setUserGuideVisible(true);
                    }
                  }}
                >
                  <Icon name="book" size={16} color="white" style={{ marginRight: 8 }} />
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>View User Guide</Text>
                </TouchableOpacity>
              </View>

              {/* Map Navigation */}
              <View style={settingsStyles.settingsCategoryContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Icon name="map" size={20} color="#28a745" style={{ marginRight: 10 }} />
                  <Text style={settingsStyles.settingsCategoryTitle}>Map Navigation</Text>
                </View>
                <View style={settingsStyles.settingItem}>
                  <Text style={[settingsStyles.settingDescription, { lineHeight: 20 }]}>
                    • Tap on any facility pin (green markers) to view details{'\n'}
                    • Pinch to zoom in/out on the map{'\n'}
                    • Drag to pan around the campus{'\n'}
                    • Tap "View More Details" to see building floors and rooms
                  </Text>
                </View>
              </View>
    
              {/* Search Feature */}
              <View style={settingsStyles.settingsCategoryContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Icon name="search" size={20} color="#28a745" style={{ marginRight: 10 }} />
                  <Text style={settingsStyles.settingsCategoryTitle}>Search</Text>
                </View>
                <View style={settingsStyles.settingItem}>
                  <Text style={[settingsStyles.settingDescription, { lineHeight: 20 }]}>
                    • Tap the search button (top right) to open search{'\n'}
                    • Type facility name or room number (e.g., "ICT999"){'\n'}
                    • Search results show floor information{'\n'}
                    • Tap a result to navigate directly to that location{'\n'}
                    • Room searches automatically open the correct floor
                  </Text>
                </View>
              </View>
    
              {/* Pathfinding */}
              <View style={settingsStyles.settingsCategoryContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Icon name="location-arrow" size={20} color="#28a745" style={{ marginRight: 10 }} />
                  <Text style={settingsStyles.settingsCategoryTitle}>Pathfinding</Text>
                </View>
                <View style={settingsStyles.settingItem}>
                  <Text style={[settingsStyles.settingDescription, { lineHeight: 20 }]}>
                    • Tap the pathfinding button (below search button){'\n'}
                    • Select Point A (start location) from the map or list{'\n'}
                    • Select Point B (destination) from the map or list{'\n'}
                    • The app will show the shortest path between points{'\n'}
                    • Customize path colors in Settings → General
                  </Text>
                </View>
              </View>
    
              {/* Filter Pins */}
              <View style={settingsStyles.settingsCategoryContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Icon name="filter" size={20} color="#28a745" style={{ marginRight: 10 }} />
                  <Text style={settingsStyles.settingsCategoryTitle}>Filter Pins</Text>
                </View>
                <View style={settingsStyles.settingItem}>
                  <Text style={[settingsStyles.settingDescription, { lineHeight: 20 }]}>
                    • Tap the filter button (between search and pathfinding){'\n'}
                    • Select categories to show only specific facility types{'\n'}
                    • Use "Select All" or "Clear All" for quick filtering{'\n'}
                    • Tap the filter button again to clear all filters
                  </Text>
                </View>
              </View>
    
              {/* QR Code Scanner */}
              <View style={settingsStyles.settingsCategoryContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Icon name="qrcode" size={20} color="#28a745" style={{ marginRight: 10 }} />
                  <Text style={settingsStyles.settingsCategoryTitle}>QR Code Scanner</Text>
                </View>
                <View style={settingsStyles.settingItem}>
                  <Text style={[settingsStyles.settingDescription, { lineHeight: 20 }]}>
                    • Tap the QR code button (top left) to open scanner{'\n'}
                    • Point camera at a facility QR code{'\n'}
                    • The app will navigate to that facility automatically{'\n'}
                    • Note: Requires development build for full functionality{'\n'}
                    • Alternative: Use deep links (campustrails://pin/123)
                  </Text>
                </View>
              </View>
    
              {/* Building Details */}
              <View style={settingsStyles.settingsCategoryContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Icon name="building" size={20} color="#28a745" style={{ marginRight: 10 }} />
                  <Text style={settingsStyles.settingsCategoryTitle}>Building Details</Text>
                </View>
                <View style={settingsStyles.settingItem}>
                  <Text style={[settingsStyles.settingDescription, { lineHeight: 20 }]}>
                    • Tap a facility pin, then tap "View More Details"{'\n'}
                    • Use floor buttons to switch between floors{'\n'}
                    • Browse rooms/areas on each floor{'\n'}
                    • Tap a room to save it or view details{'\n'}
                    • Use "Report a Problem" to report room issues
                  </Text>
                </View>
              </View>
    
              {/* User Profile */}
              <View style={settingsStyles.settingsCategoryContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Icon name="user" size={20} color="#28a745" style={{ marginRight: 10 }} />
                  <Text style={settingsStyles.settingsCategoryTitle}>User Profile</Text>
                </View>
                <View style={settingsStyles.settingItem}>
                  <Text style={[settingsStyles.settingDescription, { lineHeight: 20 }]}>
                    • Tap the profile button (bottom right) to open profile{'\n'}
                    • Saved Pins: View all your bookmarked facilities and rooms{'\n'}
                    • Feedback: See your feedback history{'\n'}
                    • Notifications: Manage push notifications{'\n'}
                    • Account: Update profile, change password, or logout
                  </Text>
                </View>
              </View>
    
              {/* Saving Pins */}
              <View style={settingsStyles.settingsCategoryContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Icon name="heart" size={20} color="#28a745" style={{ marginRight: 10 }} />
                  <Text style={settingsStyles.settingsCategoryTitle}>Saving Pins</Text>
                </View>
                <View style={settingsStyles.settingItem}>
                  <Text style={[settingsStyles.settingDescription, { lineHeight: 20 }]}>
                    • Tap a facility pin to open details{'\n'}
                    • Tap the heart icon to save the facility{'\n'}
                    • Saved facilities appear in Profile → Saved Pins{'\n'}
                    • Rooms can also be saved and will show floor information{'\n'}
                    • Remove saved pins by tapping the heart icon again
                  </Text>
                </View>
              </View>
    
              {/* Feedback & Reports */}
              <View style={settingsStyles.settingsCategoryContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Icon name="comment" size={20} color="#28a745" style={{ marginRight: 10 }} />
                  <Text style={settingsStyles.settingsCategoryTitle}>Feedback & Reports</Text>
                </View>
                <View style={settingsStyles.settingItem}>
                  <Text style={[settingsStyles.settingDescription, { lineHeight: 20 }]}>
                    • Report a Problem: Tap "Report a Problem" in room details{'\n'}
                    • Suggestions & Feedback: Settings → About Us → Suggestions & Feedback{'\n'}
                    • Both require login to submit{'\n'}
                    • View your feedback history in Profile → Feedback
                  </Text>
                </View>
              </View>
    
              {/* Notifications */}
              <View style={settingsStyles.settingsCategoryContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Icon name="bell" size={20} color="#28a745" style={{ marginRight: 10 }} />
                  <Text style={settingsStyles.settingsCategoryTitle}>Notifications</Text>
                </View>
                <View style={settingsStyles.settingItem}>
                  <Text style={[settingsStyles.settingDescription, { lineHeight: 20 }]}>
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
              <View style={settingsStyles.settingsCategoryContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Icon name="cog" size={20} color="#28a745" style={{ marginRight: 10 }} />
                  <Text style={settingsStyles.settingsCategoryTitle}>Settings</Text>
                </View>
                <View style={settingsStyles.settingItem}>
                  <Text style={[settingsStyles.settingDescription, { lineHeight: 20 }]}>
                    • Point A Color: Customize start point colors{'\n'}
                    • Point B Color: Customize destination colors{'\n'}
                    • Clear Cache: Free up storage space{'\n'}
                    • Refresh Data: Sync with server
                  </Text>
                </View>
              </View>
    
              {/* Tips */}
              <View style={settingsStyles.settingsCategoryContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Icon name="lightbulb-o" size={20} color="#28a745" style={{ marginRight: 10 }} />
                  <Text style={settingsStyles.settingsCategoryTitle}>Tips & Tricks</Text>
                </View>
                <View style={settingsStyles.settingItem}>
                  <Text style={[settingsStyles.settingDescription, { lineHeight: 20 }]}>
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
  );
};

export default SettingsModal;
