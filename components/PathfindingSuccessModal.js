import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';

/**
 * Pathfinding Success Modal Component
 * Shows when user successfully reaches their destination
 */
const PathfindingSuccessModal = ({
  visible,
  onClose,
  onGiveFeedback,
  styles
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}>
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          width: '85%',
          maxWidth: 400,
          padding: 25,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 10,
          alignItems: 'center',
        }}>
          {/* Success Icon */}
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#4caf50',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}>
            <Icon name="check" size={40} color="#fff" />
          </View>

          {/* Success Message */}
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#333',
            textAlign: 'center',
            marginBottom: 10,
          }}>
            Success!
          </Text>
          <Text style={{
            fontSize: 16,
            color: '#666',
            textAlign: 'center',
            marginBottom: 25,
            lineHeight: 22,
          }}>
            You found the room you have been searching!
          </Text>

          {/* Give Feedback Button */}
          <TouchableOpacity
            onPress={onGiveFeedback}
            style={{
              backgroundColor: '#28a745',
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
              width: '100%',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#fff',
            }}>
              Give Feedback to Pathfinding Feature
            </Text>
          </TouchableOpacity>

          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 20,
            }}
          >
            <Text style={{
              fontSize: 14,
              color: '#666',
              fontWeight: '500',
            }}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default PathfindingSuccessModal;
