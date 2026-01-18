import React from 'react';
import { Modal, View, Text, TextInput, ScrollView, TouchableOpacity, Image, Animated, StyleSheet } from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { getFloorName } from '../utils/floorUtils';

/**
 * Step 1 Modal Component
 * Modal for selecting starting point (Point A) in pathfinding
 */
const Step1Modal = ({
  visible,
  rendered,
  slideAnim,
  onClose,
  searchQuery,
  setSearchQuery,
  searchResults,
  pointA,
  pins,
  onSelectPointA,
  onOpenStep2,
  onOpenQrScanner,
  onViewMap,
  styles
}) => {
  const handleSelectItem = (item) => {
    if (item.type === 'room') {
      // Find the building that contains this room
      let buildingPin = item.buildingPin;
      if (!buildingPin) {
        buildingPin = pins.find(p => 
          (p.buildingNumber || p.id) === item.buildingId ||
          p.id === item.buildingId ||
          String(p.buildingNumber || p.id) === String(item.buildingId)
        );
      }
      
      if (buildingPin) {
        let floorLevel = null;
        if (typeof item.floorLevel === 'number') {
          floorLevel = item.floorLevel;
        } else if (buildingPin.floors && Array.isArray(buildingPin.floors)) {
          for (const floor of buildingPin.floors) {
            if (floor.rooms && Array.isArray(floor.rooms)) {
              const roomFound = floor.rooms.find(r => 
                (r.name && item.name && r.name === item.name) ||
                (r.id && item.id && r.id === item.id)
              );
              if (roomFound) {
                floorLevel = floor.level;
                break;
              }
            }
          }
        }
        
        if (floorLevel === null) {
          floorLevel = buildingPin.floors?.[0]?.level || 0;
        }
        
        const roomPoint = {
          ...item,
          buildingPin: buildingPin,
          buildingId: buildingPin.id,
          floorLevel: floorLevel,
          type: 'room',
        };
        onSelectPointA(roomPoint);
        setSearchQuery('');
        // Close Step 1 and open Step 2
        onOpenStep2();
      }
    } else {
      onSelectPointA(item);
      setSearchQuery('');
      // Close Step 1 and open Step 2
      onOpenStep2();
    }
  };

  return (
    <Modal
      visible={rendered}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      {rendered && (
        <Animated.View 
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#f5f5f5',
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          {/* Header */}
          <View style={styles.pinsModalHeader}>
            <Text style={[styles.pinsModalCampusTitle, { textAlign: 'center' }]}>Pathfinding Feature</Text>
            <TouchableOpacity
              onPress={onClose}
              style={{
                position: 'absolute',
                right: 20,
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="times" size={20} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={{ borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}></View>
          
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 15, paddingBottom: 20 }}>
            {/* Step 1: Point A Selection */}
            <View style={{ marginBottom: 15 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12, textDecorationLine: 'underline' }}>
                Step 1: Where are you?
              </Text>
              
              {/* Point A Selection Methods - Container */}
              <View style={{
                backgroundColor: '#fff',
                borderRadius: 10,
                padding: 12,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#e0e0e0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}>
                {/* Inline Search Input - First Option */}
                <View style={{
                  backgroundColor: '#f8f9fa',
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: '#e0e0e0',
                }}>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: '#ddd',
                  }}>
                    <Icon name="search" size={16} color="#999" style={{ marginRight: 8 }} />
                    <TextInput
                      placeholder="Search for a building or a room..."
                      style={{
                        flex: 1,
                        fontSize: 14,
                        color: '#333',
                        paddingVertical: 8,
                      }}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholderTextColor="#999"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setSearchQuery('')}
                        style={{ padding: 5 }}
                      >
                        <Icon name="times-circle" size={18} color="#999" />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {/* Search Results */}
                  {searchQuery.length > 0 && searchResults.length > 0 && (
                    <ScrollView style={{
                      marginTop: 10,
                      maxHeight: 200,
                      borderRadius: 8,
                      backgroundColor: '#fff',
                      borderWidth: 1,
                      borderColor: '#ddd',
                    }}>
                      {searchResults.slice(0, 5).map((item, index) => (
                        <TouchableOpacity
                          key={item.type === 'room' ? `room-${item.id}-${index}` : item.id.toString()}
                          onPress={() => handleSelectItem(item)}
                          style={{
                            padding: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: '#f0f0f0',
                          }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 4 }}>
                            {item.type === 'room' 
                              ? `${item.name}${item.description ? ` - ${item.description}` : ''}` 
                              : item.description}
                          </Text>
                          {item.type === 'room' && (
                            <Text style={{ fontSize: 12, color: '#666' }}>
                              {item.buildingPin ? `${item.buildingPin.description || item.buildingPin.title}` : ''}
                              {item.floorLevel !== undefined ? ` • ${getFloorName(item.floorLevel)}` : ''}
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

                {/* QR Scanner Button */}
                <TouchableOpacity
                  style={{
                    backgroundColor: '#f8f9fa',
                    padding: 10,
                    borderRadius: 8,
                    marginTop: 8,
                    marginBottom: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#e0e0e0',
                  }}
                  onPress={onOpenQrScanner}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#28a745',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                    <Icon name="qrcode" size={20} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 2 }}>
                      Scan QR Code
                    </Text>
                    <Text style={{ fontSize: 11, color: '#666' }}>
                      Scan QR code of nearby room or building
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={18} color="#999" />
                </TouchableOpacity>

                {/* View Map Button */}
                <TouchableOpacity
                  style={{
                    backgroundColor: '#f8f9fa',
                    padding: 10,
                    borderRadius: 8,
                    marginBottom: 0,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#e0e0e0',
                  }}
                  onPress={onViewMap}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#ff9800',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                    <Icon name="map" size={20} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 2 }}>
                      View Map
                    </Text>
                    <Text style={{ fontSize: 11, color: '#666' }}>
                      Pick a pin manually on the map
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={18} color="#999" />
                </TouchableOpacity>
              </View>

              {/* Selected Point A Display */}
              {pointA && (
                <View style={{
                  backgroundColor: '#fff',
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: '#e0e0e0',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image 
                      source={require('../assets/you-are-here.png')} 
                      style={{ width: 45, height: 45, marginRight: 12 }}
                      resizeMode="contain"
                    />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1976d2', flex: 1 }}>
                          Your Location
                        </Text>
                        <TouchableOpacity onPress={() => {
                          onSelectPointA(null);
                          // Keep modal open when clearing
                        }}>
                          <Icon name="times-circle" size={18} color="#666" />
                        </TouchableOpacity>
                      </View>
                      <Text style={{ fontSize: 14, color: '#333', marginBottom: 2 }}>
                        {pointA.description || pointA.title}
                      </Text>
                      {pointA.type === 'room' && pointA.floorLevel !== undefined && (
                        <Text style={{ fontSize: 11, color: '#666' }}>
                          {getFloorName(pointA.floorLevel)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {/* Continue Button - Show when Point A is selected */}
              {pointA && (
                <TouchableOpacity
                  onPress={onOpenStep2}
                  style={{
                    backgroundColor: '#28a745',
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginTop: 10,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#fff' }}>
                    Continue to Step 2 →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      )}
    </Modal>
  );
};

export default Step1Modal;
