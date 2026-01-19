import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { getFloorName } from '../utils/floorUtils';

/**
 * Pathfinding Details Modal Component
 * Displays full pathfinding details including floor-specific guidance
 */
const PathfindingDetailsModal = ({
  visible,
  onClose,
  pointA,
  pointB,
  pins,
  onUpdateStartingPoint,
  onShowBuildingDetails,
  styles
}) => {
  // Helper function to find elevator and stairs rooms on a floor
  const findElevatorAndStairsRooms = (floor) => {
    if (!floor || !floor.rooms || floor.rooms.length === 0) return { elevator: null, stairs: null };
    
    const rooms = floor.rooms || [];
    let elevator = null;
    let stairs = null;
    
    for (const room of rooms) {
      const roomName = (room.name || '').toUpperCase();
      const roomDesc = (room.description || '').toUpperCase();
      
      // Check for elevator (E, ELEVATOR, E: ELEVATOR, etc.)
      if (!elevator && (
        roomName.includes('ELEVATOR') || 
        roomName.startsWith('E ') || 
        roomName === 'E' ||
        roomDesc.includes('ELEVATOR')
      )) {
        elevator = room;
      }
      
      // Check for stairs (S, STAIRS, S: STAIRS, etc.)
      if (!stairs && (
        roomName.includes('STAIRS') || 
        roomName.includes('STAIR') || 
        roomName.startsWith('S ') || 
        roomName === 'S' ||
        roomDesc.includes('STAIRS') ||
        roomDesc.includes('STAIR')
      )) {
        stairs = room;
      }
    }
    
    return { elevator, stairs };
  };

  // Helper function to find the next room after elevator/stairs in the rooms array
  // If elevator/stairs has a besideRooms array, use those. Otherwise, use first room in array.
  const findNextRoomAfterElevatorStairs = (floor, elevator, stairs) => {
    if (!floor || !floor.rooms || floor.rooms.length === 0) return null;
    
    const rooms = floor.rooms || [];
    
    // Check if elevator or stairs has besideRooms property (from admin panel)
    if (elevator && elevator.besideRooms && Array.isArray(elevator.besideRooms) && elevator.besideRooms.length > 0) {
      // Use first room from besideRooms array
      const besideRoomId = elevator.besideRooms[0];
      const besideRoom = rooms.find(r => (r._id || r.id || r.name) === besideRoomId);
      if (besideRoom) return besideRoom;
    }
    
    if (stairs && stairs.besideRooms && Array.isArray(stairs.besideRooms) && stairs.besideRooms.length > 0) {
      // Use first room from besideRooms array
      const besideRoomId = stairs.besideRooms[0];
      const besideRoom = rooms.find(r => (r._id || r.id || r.name) === besideRoomId);
      if (besideRoom) return besideRoom;
    }
    
    // Fallback: use first room in the array (not elevator/stairs)
    for (const room of rooms) {
      const roomName = (room.name || '').toUpperCase();
      const roomDesc = (room.description || '').toUpperCase();
      // Skip if it's an elevator or stairs
      if (!roomName.includes('ELEVATOR') && !roomName.includes('STAIRS') && 
          !roomName.includes('STAIR') && !roomDesc.includes('ELEVATOR') && 
          !roomDesc.includes('STAIRS') && !roomDesc.includes('STAIR') &&
          !roomName.startsWith('E ') && !roomName.startsWith('S ') &&
          roomName !== 'E' && roomName !== 'S') {
        return room;
      }
    }
    
    return null;
  };

  // Helper function to format route instructions based on rooms
  const formatRouteInstructions = (targetFloor, destinationFloorLevel, isGoingDown = false) => {
    if (!targetFloor) {
      return 'Use the stairs or elevator if available.';
    }
    
    const floorRooms = findElevatorAndStairsRooms(targetFloor);
    const elevator = floorRooms.elevator;
    const stairs = floorRooms.stairs;
    
    // Use destinationFloorLevel for the floor name in the text (e.g., "3rd floor")
    // But use targetFloor for finding the stairs/elevator and beside rooms
    const floorName = getFloorName(destinationFloorLevel !== undefined ? destinationFloorLevel : targetFloor.level);
    const floorNum = destinationFloorLevel === 0 || (destinationFloorLevel === undefined && targetFloor.level === 0) 
      ? 'ground floor' 
      : `${floorName.toLowerCase()}`;
    const direction = isGoingDown ? 'go to' : 'get to';
    
    if (!elevator && !stairs) {
      return `To ${direction} the ${floorNum}, use the stairs or elevator if available.`;
    }
    
    // Find next room after elevator/stairs (uses targetFloor for finding rooms)
    const nextRoom = findNextRoomAfterElevatorStairs(targetFloor, elevator, stairs);
    const nextRoomName = nextRoom ? (nextRoom.description || nextRoom.name || 'next room') : null;
    
    // Build route text
    let routeText = '';
    if (elevator && stairs) {
      // Both exist: "use the ELEVATOR or STAIRS"
      const elevatorDesc = (elevator.description || elevator.name || 'ELEVATOR').toUpperCase();
      const stairsDesc = (stairs.description || stairs.name || 'STAIRS').toUpperCase();
      routeText = `use the ${elevatorDesc} or ${stairsDesc}`;
    } else if (elevator) {
      // Only elevator
      const elevatorDesc = (elevator.description || elevator.name || 'ELEVATOR').toUpperCase();
      routeText = `use the ${elevatorDesc}`;
    } else if (stairs) {
      // Only stairs
      const stairsDesc = (stairs.description || stairs.name || 'STAIRS').toUpperCase();
      routeText = `use the ${stairsDesc}`;
    }
    
    // Add "beside the [next room]" if next room exists
    if (nextRoomName) {
      routeText += ` beside the ${nextRoomName}`;
    }
    
    return `To ${direction} the ${floorNum}, ${routeText}.`;
  };

  // Get building info for Point A
  const buildingPinA = pointA?.type === 'room' 
    ? pins.find(p => p.id === pointA.buildingId || p.id === pointA.buildingPin?.id) 
    : (pointA?.type === 'pin' ? pins.find(p => p.id === pointA.id) : null);
  const currentFloorA = buildingPinA?.floors?.find(f => f.level === pointA?.floorLevel);
  const groundFloorA = buildingPinA?.floors?.find(f => f.level === 0);
  const exitRooms = findElevatorAndStairsRooms(currentFloorA);
  // When going down, show "To go to the ground floor" and use current floor for finding rooms
  const exitInstructionsA = formatRouteInstructions(currentFloorA || groundFloorA, 0, true);
  const hasElevatorA = exitRooms.elevator !== null;
  const hasStairsA = exitRooms.stairs !== null;
  const showExitGuidanceA = pointA?.type === 'room' && pointA?.floorLevel > 0;

  // Get building info for Point B
  const buildingPinB = pointB?.type === 'room' 
    ? pins.find(p => p.id === pointB.buildingId || p.id === pointB.buildingPin?.id) 
    : (pointB?.type === 'pin' ? pins.find(p => p.id === pointB.id) : null);
  const destinationFloorB = buildingPinB?.floors?.find(f => f.level === pointB?.floorLevel);
  const groundFloorB = buildingPinB?.floors?.find(f => f.level === 0);
  // When going up to upper floors, use ground floor for finding stairs/elevator and beside rooms
  const routeRooms = findElevatorAndStairsRooms(groundFloorB || destinationFloorB);
  // For going up: use groundFloorB to find beside room (first room on ground floor)
  // But show destination floor name (e.g., "3rd floor") in the instruction text
  // formatRouteInstructions(targetFloor, destinationFloorLevel, isGoingDown)
  const routeInstructionsB = pointB?.floorLevel > 0 && groundFloorB
    ? formatRouteInstructions(groundFloorB, pointB.floorLevel, false) // Use ground floor for finding rooms, but destination floor level for text
    : null;
  const hasElevatorB = routeRooms.elevator !== null;
  const hasStairsB = routeRooms.stairs !== null;
  const showRouteGuidanceB = pointB?.type === 'room' && pointB?.floorLevel > 0;

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
          maxHeight: '95%',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 10,
          overflow: 'hidden',
          flexDirection: 'column',
        }}>
          {/* Header */}
          <View style={styles.pinsModalHeader}>
            <Text style={[styles.pinsModalCampusTitle, { textAlign: 'center' }]}>Pathfinding Details</Text>
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

          <ScrollView 
            style={{ flex: 1, maxHeight: '85%' }} 
            contentContainerStyle={{ padding: 20, paddingBottom: 20 }}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {/* Starting Point Section */}
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
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Image 
                  source={require('../assets/you-are-here.png')} 
                  style={{ width: 40, height: 40, marginRight: 12 }}
                  resizeMode="contain"
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>Starting Point</Text>
                  {pointA?.type === 'room' ? (
                    <>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>
                        {buildingPinA?.description || buildingPinA?.title}
                      </Text>
                      {pointA?.floorLevel !== undefined && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, flexWrap: 'wrap' }}>
                          <Text style={{ fontSize: 12, color: '#999' }}>
                            {getFloorName(pointA.floorLevel)}
                          </Text>
                          {pointA?.description && (
                            <>
                              {pointA.description.includes(' - ') ? (
                                <>
                                  <Text style={{ fontSize: 12, color: '#999', marginHorizontal: 4 }}>•</Text>
                                  <Text style={{ fontSize: 12, color: '#999' }}>
                                    {pointA.description.split(' - ')[1]}
                                  </Text>
                                </>
                              ) : (
                                <>
                                  <Text style={{ fontSize: 12, color: '#999', marginHorizontal: 4 }}>•</Text>
                                  <Text style={{ fontSize: 12, color: '#999' }}>
                                    {pointA.description}
                                  </Text>
                                </>
                              )}
                            </>
                          )}
                        </View>
                      )}
                    </>
                  ) : (
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>
                      {pointA?.description || pointA?.title}
                    </Text>
                  )}
                </View>
              </View>

              {/* Exit Guidance for Upper Floors (Information Only - No Button) */}
              {showExitGuidanceA && (
                <View style={{
                  backgroundColor: '#fff3e0',
                  padding: 12,
                  borderRadius: 8,
                  marginTop: 12,
                  borderLeftWidth: 3,
                  borderLeftColor: '#ff9800',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Icon name="arrow-down" size={16} color="#ff9800" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#ff9800' }}>
                      Getting to Ground Floor
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, color: '#333', lineHeight: 20, marginBottom: 10 }}>
                    {exitInstructionsA}
                  </Text>
                  
                  {/* Route Options */}
                  {(hasStairsA || hasElevatorA) && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 8 }}>
                        Available Routes:
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        {hasElevatorA && (
                          <View style={{
                            flex: 1,
                            backgroundColor: '#fff',
                            padding: 12,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: '#ffcc80',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 70,
                          }}>
                            <Icon name="arrow-down" size={24} color="#ff9800" style={{ marginBottom: 8 }} />
                            <Text style={{ fontSize: 11, fontWeight: '600', color: '#333', textAlign: 'center' }}>
                              ELEVATOR
                            </Text>
                          </View>
                        )}
                        {hasStairsA && (
                          <View style={{
                            flex: 1,
                            backgroundColor: '#fff',
                            padding: 12,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: '#ffcc80',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 70,
                          }}>
                            <Icon name="level-up" size={24} color="#ff9800" style={{ marginBottom: 8 }} />
                            <Text style={{ fontSize: 11, fontWeight: '600', color: '#333', textAlign: 'center' }}>
                              STAIRS
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Destination Section */}
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
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Image 
                  source={require('../assets/destination.png')} 
                  style={{ width: 40, height: 40, marginRight: 12 }}
                  resizeMode="contain"
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>Destination</Text>
                  {pointB?.type === 'room' ? (
                    <>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>
                        {buildingPinB?.description || buildingPinB?.title}
                      </Text>
                      {pointB?.floorLevel !== undefined && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, flexWrap: 'wrap' }}>
                          <Text style={{ fontSize: 12, color: '#999' }}>
                            {getFloorName(pointB.floorLevel)}
                          </Text>
                          {pointB?.description && (
                            <>
                              {pointB.description.includes(' - ') ? (
                                <>
                                  <Text style={{ fontSize: 12, color: '#999', marginHorizontal: 4 }}>•</Text>
                                  <Text style={{ fontSize: 12, color: '#999' }}>
                                    {pointB.description.split(' - ')[1]}
                                  </Text>
                                </>
                              ) : (
                                <>
                                  <Text style={{ fontSize: 12, color: '#999', marginHorizontal: 4 }}>•</Text>
                                  <Text style={{ fontSize: 12, color: '#999' }}>
                                    {pointB.description}
                                  </Text>
                                </>
                              )}
                            </>
                          )}
                        </View>
                      )}
                    </>
                  ) : (
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>
                      {pointB?.description || pointB?.title}
                    </Text>
                  )}
                </View>
              </View>

              {/* View More Details Button for Destination */}
              {pointB && buildingPinB && (
                <TouchableOpacity
                  onPress={() => {
                    if (onShowBuildingDetails) {
                      onShowBuildingDetails(buildingPinB, pointB?.floorLevel);
                    }
                  }}
                  style={{
                    backgroundColor: '#e3f2fd',
                    padding: 12,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#90caf9',
                    marginTop: 12,
                  }}
                >
                  <Icon name="info-circle" size={14} color="#1976d2" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#1976d2' }}>
                    View More Details
                  </Text>
                </TouchableOpacity>
              )}

              {/* Route Guidance for Upper Floors */}
              {showRouteGuidanceB && (
                <View style={{
                  backgroundColor: '#e8f5e9',
                  padding: 12,
                  borderRadius: 8,
                  marginTop: 12,
                  borderLeftWidth: 3,
                  borderLeftColor: '#4caf50',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Icon name="arrow-up" size={16} color="#4caf50" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#4caf50' }}>
                      Getting to {getFloorName(pointB.floorLevel)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, color: '#333', lineHeight: 20, marginBottom: 10 }}>
                    {routeInstructionsB}
                  </Text>
                  
                  {/* Route Options */}
                  {(hasStairsB || hasElevatorB) && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 8 }}>
                        Available Routes:
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        {hasElevatorB && (
                          <View style={{
                            flex: 1,
                            backgroundColor: '#fff',
                            padding: 12,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: '#a5d6a7',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 70,
                          }}>
                            <Icon name="arrow-up" size={24} color="#4caf50" style={{ marginBottom: 8 }} />
                            <Text style={{ fontSize: 11, fontWeight: '600', color: '#333', textAlign: 'center' }}>
                              ELEVATOR
                            </Text>
                          </View>
                        )}
                        {hasStairsB && (
                          <View style={{
                            flex: 1,
                            backgroundColor: '#fff',
                            padding: 12,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: '#a5d6a7',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 70,
                          }}>
                            <Icon name="level-up" size={24} color="#4caf50" style={{ marginBottom: 8 }} />
                            <Text style={{ fontSize: 11, fontWeight: '600', color: '#333', textAlign: 'center' }}>
                              STAIRS
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Help Text */}
            <Text style={{
              fontSize: 13,
              color: '#666',
              textAlign: 'center',
              marginTop: 15,
              marginBottom: 10,
              paddingHorizontal: 10,
            }}>
              Are you still not finding the room?
            </Text>

            {/* Update Starting Point Button */}
            <TouchableOpacity
              onPress={onUpdateStartingPoint}
              style={{
                backgroundColor: '#e3f2fd',
                padding: 15,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#90caf9',
                marginTop: 0,
              }}
            >
              <Icon name="crosshairs" size={16} color="#1976d2" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1976d2' }}>
                Update Starting Point
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default PathfindingDetailsModal;
