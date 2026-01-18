import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { getFloorName } from '../utils/floorUtils';
import { styles } from '../styles';

/**
 * Room Selection Modal Component
 * Modal for selecting a room/area when reporting facility issues
 */
const RoomSelectionModal = ({
  visible,
  selectedPin,
  roomSelectionFloor,
  setRoomSelectionFloor,
  selectedRoomForReport,
  setSelectedRoomForReport,
  setRoomSelectionModalVisible,
  setFeedbackType,
  setFeedbackModalVisible,
  styles: customStyles
}) => {
  const roomSelectionStyles = customStyles || styles;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setRoomSelectionModalVisible(false)}
    >
      <View 
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}
      >
        <View 
          style={{
            backgroundColor: '#f5f5f5',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '85%',
            paddingBottom: 20,
          }}
        >
          <View style={roomSelectionStyles.modalHeaderWhite}>
            <Text style={[roomSelectionStyles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>
              Select Room/Area to Report
            </Text>
            <TouchableOpacity
              onPress={() => {
                setRoomSelectionModalVisible(false);
                setSelectedRoomForReport(null);
              }}
              style={{ position: 'absolute', right: 20, padding: 5 }}
            >
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={roomSelectionStyles.lineDark}></View>
    
          <ScrollView style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            {/* Floor Selection */}
            {selectedPin?.floors && selectedPin.floors.length > 1 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={[roomSelectionStyles.settingLabel, { marginBottom: 12 }]}>Select Floor:</Text>
                <View style={roomSelectionStyles.floorButtonsContainer}>
                  {selectedPin.floors.map((floor, index) => {
                    const floorName = getFloorName(floor.level);
                    return (
                      <TouchableOpacity
                        key={floor.level}
                        style={[
                          roomSelectionStyles.floorButton,
                          roomSelectionFloor === floor.level && roomSelectionStyles.floorButtonSelected,
                          (index + 1) % 4 === 0 && { marginRight: 0 }
                        ]}
                        onPress={() => setRoomSelectionFloor(floor.level)}
                      >
                        <Text style={[
                          roomSelectionStyles.floorButtonText,
                          roomSelectionFloor === floor.level && roomSelectionStyles.floorButtonTextSelected
                        ]}>
                          {floorName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
    
            {/* Room Selection */}
            <View style={{ marginBottom: 20 }}>
              <Text style={[roomSelectionStyles.settingLabel, { marginBottom: 12 }]}>
                Select Room/Area on {getFloorName(roomSelectionFloor)}:
              </Text>
              {selectedPin?.floors?.find(f => f.level === roomSelectionFloor)?.rooms?.length > 0 ? (
                selectedPin.floors.find(f => f.level === roomSelectionFloor).rooms.map((room) => {
                  const isSelected = selectedRoomForReport?.room?.name === room.name && 
                                   selectedRoomForReport?.floorLevel === roomSelectionFloor;
                  return (
                    <TouchableOpacity
                      key={room.name || room.id}
                      style={{
                        backgroundColor: isSelected ? '#007bff' : '#fff',
                        padding: 15,
                        borderRadius: 8,
                        marginBottom: 10,
                        borderWidth: 2,
                        borderColor: isSelected ? '#007bff' : '#e0e0e0',
                      }}
                      onPress={() => {
                        setSelectedRoomForReport({
                          room: room,
                          floorLevel: roomSelectionFloor,
                          floorName: getFloorName(roomSelectionFloor),
                        });
                      }}
                    >
                      <Text style={{
                        fontSize: 16,
                        fontWeight: 'bold',
                        color: isSelected ? '#fff' : '#333',
                        marginBottom: 4,
                      }}>
                        {room.name}
                      </Text>
                      {room.description && (
                        <Text style={{
                          fontSize: 14,
                          color: isSelected ? '#e0e0e0' : '#666',
                        }}>
                          {room.description}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={{ color: '#666', fontSize: 14, textAlign: 'center', paddingVertical: 20 }}>
                  No rooms available on this floor
                </Text>
              )}
            </View>
    
            {/* Continue Button */}
            <TouchableOpacity
              style={[
                roomSelectionStyles.authButton,
                {
                  backgroundColor: '#28a745',
                  opacity: selectedRoomForReport ? 1 : 0.5,
                }
              ]}
              disabled={!selectedRoomForReport}
              onPress={() => {
                if (selectedRoomForReport) {
                  setRoomSelectionModalVisible(false);
                  setFeedbackType('report');
                  setFeedbackModalVisible(true);
                }
              }}
            >
              <Text style={roomSelectionStyles.authButtonText}>Continue to Report</Text>
            </TouchableOpacity>
    
            {/* Option to report without selecting a room */}
            <TouchableOpacity
              style={{
                marginTop: 10,
                padding: 12,
                alignItems: 'center',
              }}
              onPress={() => {
                setSelectedRoomForReport(null);
                setRoomSelectionModalVisible(false);
                setFeedbackType('report');
                setFeedbackModalVisible(true);
              }}
            >
              <Text style={{ color: '#666', fontSize: 14 }}>Report general building issue</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default RoomSelectionModal;
