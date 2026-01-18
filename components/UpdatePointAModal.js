import React from 'react';
import { Modal, View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { getFloorName } from '../utils/floorUtils';
import { aStarPathfinding } from '../utils/pathfinding';

/**
 * Update Point A Modal Component
 * Modal for updating the starting point during active pathfinding
 */
const UpdatePointAModal = ({
  visible,
  onClose,
  searchQuery,
  setSearchQuery,
  searchResults,
  pointB,
  pins,
  onUpdatePointA,
  onUpdatePath,
  onOpenQrScanner,
  onViewMap,
  styles
}) => {
  const handleSelectItem = (item) => {
    if (item.type === 'room') {
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
        onUpdatePointA(roomPoint);
        setSearchQuery('');
        onClose();
        // Recalculate path
        setTimeout(async () => {
          try {
            const startId = roomPoint.buildingId || roomPoint.buildingPin?.id || roomPoint.id;
            const endId = pointB.type === 'room' ? (pointB.buildingId || pointB.buildingPin?.id || pointB.id) : pointB.id;
            const foundPath = aStarPathfinding(startId, endId, pins);
            if (foundPath.length > 0 && onUpdatePath) {
              onUpdatePath(foundPath);
            }
          } catch (error) {
            console.error('Error recalculating path:', error);
          }
        }, 100);
      }
    } else {
      onUpdatePointA(item);
      setSearchQuery('');
      onClose();
      // Recalculate path
      setTimeout(async () => {
        try {
          const startId = item.id;
          const endId = pointB.type === 'room' ? (pointB.buildingId || pointB.buildingPin?.id || pointB.id) : pointB.id;
          const foundPath = aStarPathfinding(startId, endId, pins);
          if (foundPath.length > 0 && onUpdatePath) {
            onUpdatePath(foundPath);
          }
        } catch (error) {
          console.error('Error recalculating path:', error);
        }
      }, 100);
    }
  };

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
      }}>
        <View style={{
          backgroundColor: '#f5f5f5',
          borderRadius: 12,
          width: '90%',
          maxHeight: '85%',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 10,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <View style={styles.pinsModalHeader}>
            <Text style={[styles.pinsModalCampusTitle, { textAlign: 'center' }]}>Update Starting Point</Text>
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

          <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 20 }}>
            {/* Search Input */}
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 15,
              marginBottom: 15,
              borderWidth: 1,
              borderColor: '#e0e0e0',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
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
                <Icon name="search" size={18} color="#999" style={{ marginRight: 10 }} />
                <TextInput
                  placeholder="Search for a building or room..."
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: '#333',
                    paddingVertical: 10,
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
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 15,
                marginBottom: 10,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#e0e0e0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
              onPress={onOpenQrScanner}
            >
              <View style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: '#28a745',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 15,
              }}>
                <Icon name="qrcode" size={24} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 }}>
                  Scan QR Code
                </Text>
                <Text style={{ fontSize: 12, color: '#666' }}>
                  Scan QR code of nearby room or building
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>

            {/* View Map Button */}
            <TouchableOpacity
              style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 15,
                marginBottom: 10,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#e0e0e0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
              onPress={onViewMap}
            >
              <View style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: '#ff9800',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 15,
              }}>
                <Icon name="map" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 }}>
                  View Map
                </Text>
                <Text style={{ fontSize: 12, color: '#666' }}>
                  Pick a pin manually on the map
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default UpdatePointAModal;
