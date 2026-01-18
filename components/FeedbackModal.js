import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Animated, StyleSheet, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { submitSuggestionAndFeedback, getCurrentUser, updateUserActivity } from '../services/api';
import { addFeedback } from '../utils/userStorage';
import { styles } from '../styles';

/**
 * Feedback Modal Component
 * Modal for submitting feedback, suggestions, and facility reports
 */
const FeedbackModal = ({
  rendered,
  feedbackModalFadeAnim,
  feedbackType,
  selectedPin,
  selectedRoomForReport,
  isLoggedIn,
  authToken,
  currentUser,
  setFeedbackModalVisible,
  setFeedbackHistory,
  transformFeedbackData,
  setSelectedPin,
  setSelectedRoomForReport,
  setFeedbackType,
  setCurrentUser,
  setAuthModalVisible,
  currentCampus,
  campusesData,
  campuses,
  styles: customStyles
}) => {
  const feedbackStyles = customStyles || styles;
  
  // Local state for feedback form
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <Modal
      visible={rendered}
      transparent={true}
      animationType="none"
      onRequestClose={() => setFeedbackModalVisible(false)}
    >
      {rendered && (
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
          <View style={feedbackStyles.modalHeaderWhite}>
            <Text style={[feedbackStyles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>
              {feedbackType === 'suggestion' 
                ? 'Suggestions & Feedback' 
                : selectedRoomForReport?.room?.name
                  ? `Report - ${selectedRoomForReport.room.name} (${selectedRoomForReport.floorName})`
                  : `Give Feedback - ${selectedPin?.description || selectedPin?.title}`}
            </Text>
          </View>
          <View style={feedbackStyles.lineDark}></View>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            <ScrollView style={{ padding: 20 }}>
              {/* Selected Room Indicator (if a room was selected) */}
              {selectedRoomForReport && selectedRoomForReport.room && (
                <View style={{
                  backgroundColor: '#e3f2fd',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 20,
                  borderLeftWidth: 4,
                  borderLeftColor: '#2196f3',
                }}>
                  <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Reporting issue for:</Text>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>
                    {selectedRoomForReport.room.name}
                  </Text>
                  {selectedRoomForReport.room.description && (
                    <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>
                      {selectedRoomForReport.room.description}
                    </Text>
                  )}
                  <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    {selectedRoomForReport.floorName}
                  </Text>
                </View>
              )}
    
              {/* Rating Section */}
              <View style={{ marginBottom: 20 }}>
                <Text style={[feedbackStyles.settingLabel, { marginBottom: 12 }]}>Rating</Text>
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
                <Text style={[feedbackStyles.settingLabel, { marginBottom: 12 }]}>Comment</Text>
                <TextInput
                  style={[feedbackStyles.authInput, { minHeight: 100, textAlignVertical: 'top', paddingTop: 12 }]}
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
                  feedbackStyles.authButton, 
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
                        // Include room information if a room was selected
                        roomId: selectedRoomForReport?.room?.name || null, // Room ID (room name)
                        roomName: selectedRoomForReport?.room?.name || null, // Room name for display
                        roomDescription: selectedRoomForReport?.room?.description || null, // Room description
                        floorLevel: selectedRoomForReport?.floorLevel !== undefined ? selectedRoomForReport.floorLevel : null, // Floor level (0 = Ground Floor, etc.)
                        floorName: selectedRoomForReport?.floorName || null, // Floor name (e.g., "Ground Floor", "2nd Floor")
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
                        setSelectedRoomForReport(null); // Reset selected room
    
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
                <Text style={feedbackStyles.authButtonText}>Submit Feedback</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
          </View>
        </Animated.View>
      )}
    </Modal>
  );
};

export default FeedbackModal;
