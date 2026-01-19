import React from 'react';
import { Modal, View, Text, TextInput, ScrollView, TouchableOpacity, Image } from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { getFloorName } from '../utils/floorUtils';

/**
 * Step 2 Modal Component
 * Modal for selecting destination point (Point B) in pathfinding
 */
const Step2Modal = ({
  visible,
  onClose,
  searchQueryB,
  setSearchQueryB,
  searchResultsB,
  pointA,
  pointB,
  pins,
  onSelectPointB,
  onSwapPoints,
  onOpenQrScanner,
  onViewMap,
  onGoNow,
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
        onSelectPointB(roomPoint);
        setSearchQueryB('');
        // Keep Step 2 modal open to show "Go Now" button
      }
    } else {
      onSelectPointB(item);
      setSearchQueryB('');
      // Keep Step 2 modal open to show "Go Now" button
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: '#f5f5f5',
      }}>
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
            {/* Step 2: Point B Selection */}
            <View style={{ marginBottom: 15 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12, textDecorationLine: 'underline' }}>
                Step 2: Where do you want to go?
              </Text>
              
              {/* Point B Selection Methods - Container */}
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
                {/* Inline Search Input for Point B - First Option */}
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
                      placeholder="Search for destination..."
                      style={{
                        flex: 1,
                        fontSize: 14,
                        color: '#333',
                        paddingVertical: 8,
                      }}
                      value={searchQueryB}
                      onChangeText={setSearchQueryB}
                      placeholderTextColor="#999"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {searchQueryB.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setSearchQueryB('')}
                        style={{ padding: 5 }}
                      >
                        <Icon name="times-circle" size={18} color="#999" />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {/* Search Results for Point B */}
                  {searchQueryB.length > 0 && searchResultsB.length > 0 && (
                    <ScrollView style={{
                      marginTop: 10,
                      maxHeight: 200,
                      borderRadius: 8,
                      backgroundColor: '#fff',
                      borderWidth: 1,
                      borderColor: '#ddd',
                    }}>
                      {searchResultsB.slice(0, 5).map((item, index) => (
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
                              ? (item.description && item.description.includes(' - ') 
                                  ? item.description.split(' - ')[1] 
                                  : (item.description || item.name))
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
                  
                  {searchQueryB.length > 0 && searchResultsB.length === 0 && (
                    <View style={{ marginTop: 10, padding: 10 }}>
                      <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
                        No results found
                      </Text>
                    </View>
                  )}
                </View>

                {/* QR Scanner Button for Point B */}
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
                      Scan QR code of destination room or building
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={18} color="#999" />
                </TouchableOpacity>

                {/* View Map Button for Point B */}
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

              {/* Selected Point A Display - Only show when pointB is selected */}
              {pointA && pointB && (
                <View style={{
                  backgroundColor: '#fff',
                  borderRadius: 10,
                  padding: 12,
                  marginTop: 8,
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
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#dc3545', flex: 1 }}>
                          Starting Point
                        </Text>
                      </View>
                      <Text style={{ fontSize: 14, color: '#333', marginBottom: 2 }}>
                        {pointA.description || pointA.title}
                      </Text>
                      {pointA.type === 'room' && (
                        <>
                          {pointA.buildingPin && (
                            <Text style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
                              {pointA.buildingPin.description || pointA.buildingPin.title}
                            </Text>
                          )}
                          {pointA.floorLevel !== undefined && (
                            <Text style={{ fontSize: 11, color: '#666' }}>
                              {getFloorName(pointA.floorLevel)}
                            </Text>
                          )}
                        </>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {/* Selected Point B Display */}
              {pointB && (
                <View style={{
                  backgroundColor: '#fff',
                  borderRadius: 10,
                  padding: 12,
                  marginTop: 8,
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
                      source={require('../assets/destination.png')} 
                      style={{ width: 45, height: 45, marginRight: 12 }}
                      resizeMode="contain"
                    />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#e65100', flex: 1 }}>
                          Destination
                        </Text>
                        <TouchableOpacity onPress={() => {
                          onSelectPointB(null);
                          // Keep modal open when clearing
                        }}>
                          <Icon name="times-circle" size={18} color="#666" />
                        </TouchableOpacity>
                      </View>
                      <Text style={{ fontSize: 14, color: '#333', marginBottom: 2 }}>
                        {pointB.description || pointB.title}
                      </Text>
                      {pointB.type === 'room' && (
                        <>
                          {pointB.buildingPin && (
                            <Text style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
                              {pointB.buildingPin.description || pointB.buildingPin.title}
                            </Text>
                          )}
                          {pointB.floorLevel !== undefined && (
                            <Text style={{ fontSize: 11, color: '#666' }}>
                              {getFloorName(pointB.floorLevel)}
                            </Text>
                          )}
                        </>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {pointA && pointB && (
                <TouchableOpacity 
                  onPress={onSwapPoints}
                  style={{
                    alignSelf: 'center',
                    marginTop: 10,
                    padding: 8,
                    backgroundColor: '#fff',
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: '#ddd',
                  }}
                >
                  <Icon name="exchange" size={16} color="#666" />
                </TouchableOpacity>
              )}

              {/* Go Now Button */}
              {pointA && pointB && (
                <TouchableOpacity 
                  style={[
                    styles.goNowButton,
                    {
                      marginTop: 15,
                      marginBottom: 10,
                      paddingVertical: 14,
                      paddingHorizontal: 25,
                      minHeight: 50,
                    }
                  ]} 
                  onPress={onGoNow}
                >
                  <Icon name="paper-plane" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text 
                    style={[
                      styles.goNowButtonText,
                      {
                        fontSize: 16,
                        fontWeight: 'bold',
                      }
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.7}
                  >
                    Go Now
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
      </View>
    </Modal>
  );
};

export default Step2Modal;
