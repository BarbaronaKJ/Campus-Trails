import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, Image, Dimensions, Animated, StyleSheet } from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { getFloorName } from '../utils/floorUtils';

const { height: screenHeight } = Dimensions.get('window');

/**
 * Pathfinding Details Modal Component
 * Displays full pathfinding details including floor-specific guidance
 */
const PathfindingDetailsModal = ({
  visible,
  rendered,
  slideAnim,
  onClose,
  pointA,
  pointB,
  pins,
  onUpdateStartingPoint,
  onShowBuildingDetails,
  styles
}) => {
  // Helper function to find all elevator and stairs rooms on a floor
  const findElevatorAndStairsRooms = (floor) => {
    if (!floor || !floor.rooms || floor.rooms.length === 0) return { elevators: [], stairs: [] };
    
    const rooms = floor.rooms || [];
    const elevators = [];
    const stairs = [];
    
    for (const room of rooms) {
      const roomName = (room.name || '').toUpperCase();
      const roomDesc = (room.description || '').toUpperCase();
      
      // Check for elevator (E, ELEVATOR, E: ELEVATOR, etc.)
      if (
        roomName.includes('ELEVATOR') || 
        roomName.startsWith('E ') || 
        roomName === 'E' ||
        roomDesc.includes('ELEVATOR')
      ) {
        elevators.push(room);
      }
      
      // Check for stairs (S, STAIRS, S: STAIRS, etc.)
      if (
        roomName.includes('STAIRS') || 
        roomName.includes('STAIR') || 
        roomName.startsWith('S ') || 
        roomName === 'S' ||
        roomDesc.includes('STAIRS') ||
        roomDesc.includes('STAIR')
      ) {
        stairs.push(room);
      }
    }
    
    return { elevators, stairs };
  };

  // Helper function to find the next room(s) after elevator/stairs in the rooms array
  // If elevator/stairs has a besideRooms array, use those. Otherwise, use first room in array.
  const findNextRoomsAfterElevatorStairs = (floor, elevatorStairsRoom) => {
    if (!floor || !floor.rooms || floor.rooms.length === 0) return [];
    
    const rooms = floor.rooms || [];
    
    // Debug: Log elevator/stairs room data
    if (elevatorStairsRoom) {
      console.log('Finding beside rooms for:', elevatorStairsRoom.name, 'besideRooms:', elevatorStairsRoom.besideRooms);
    }
    
    // Check if elevator/stairs has besideRooms property (from admin panel)
    if (elevatorStairsRoom && elevatorStairsRoom.besideRooms && Array.isArray(elevatorStairsRoom.besideRooms) && elevatorStairsRoom.besideRooms.length > 0) {
      // Use all rooms from besideRooms array
      const besideRooms = [];
      for (const besideRoomId of elevatorStairsRoom.besideRooms) {
        // More robust matching: try multiple ways to match the room
        // Convert search ID to string for comparison
        const searchId = String(besideRoomId || '').trim();
        
        console.log('Searching for beside room:', searchId, 'in floor rooms:', rooms.map(r => r.name));
        
        // Match by room.name first (primary identifier like "9-E1", "9-S1", "9-S2")
        const besideRoom = rooms.find(r => {
          const rName = String(r.name || '').trim();
          const rId = String(r.id || '').trim();
          const rMongoId = r._id ? String(r._id).trim() : '';
          
          // Priority: match by room.name (case-insensitive), then by id, then by _id
          // This ensures we match rooms like "9-E1", "9-S1", "9-S2" correctly
          const matches = (rName && rName.toLowerCase() === searchId.toLowerCase()) ||
                 (rName === searchId) ||
                 (rId && rId === searchId) ||
                 (rMongoId && rMongoId === searchId);
          
          if (matches) {
            console.log('Found beside room:', rName, 'matching:', searchId);
          }
          
          return matches;
        });
        
        if (besideRoom) {
          besideRooms.push(besideRoom);
        } else {
          console.warn('Beside room not found:', searchId, 'Available rooms:', rooms.map(r => r.name));
        }
      }
      if (besideRooms.length > 0) {
        console.log('Returning beside rooms:', besideRooms.map(r => r.name));
        return besideRooms;
      }
    } else {
      console.log('No besideRooms configured for:', elevatorStairsRoom?.name, 'using fallback');
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
        return [room];
      }
    }
    
    return [];
  };

  // Helper function to calculate number of rooms between two points on a floor
  const calculateRoomsBetween = (floor, fromRoom, toRoom) => {
    if (!floor || !floor.rooms || !fromRoom || !toRoom) return 0;
    
    const sortedRooms = [...floor.rooms].sort((a, b) => {
      const orderA = a.order !== undefined && a.order !== null ? a.order : Infinity;
      const orderB = b.order !== undefined && b.order !== null ? b.order : Infinity;
      if (orderA !== orderB) return orderA - orderB;
      return floor.rooms.indexOf(a) - floor.rooms.indexOf(b);
    });
    
    const findRoomIndex = (room) => {
      return sortedRooms.findIndex(r => 
        (r.name || r.id) === (room.name || room.id) ||
        (r._id && room._id && r._id.toString() === room._id.toString())
      );
    };
    
    const fromIndex = findRoomIndex(fromRoom);
    const toIndex = findRoomIndex(toRoom);
    
    if (fromIndex === -1 || toIndex === -1) return 0;
    
    return Math.abs(toIndex - fromIndex) - 1;
  };

  // Helper function to generate route instructions with bullet points
  const generateRouteInstructions = (targetFloor, destinationFloorLevel, destinationRoom, isGoingDown = false) => {
    if (!targetFloor) {
      return { elevators: [], stairs: [], sameFloor: [] };
    }
    
    const floorRooms = findElevatorAndStairsRooms(targetFloor);
    const elevators = floorRooms.elevators || [];
    const stairs = floorRooms.stairs || [];
    
    const elevatorInstructions = [];
    const stairsInstructions = [];
    
    // Process each elevator
    for (const elevator of elevators) {
      const besideRooms = findNextRoomsAfterElevatorStairs(targetFloor, elevator);
      if (besideRooms.length > 0) {
        for (const besideRoom of besideRooms) {
          // Use only description (e.g., "SERVER ROOM", "COMPUTER LABORATORY")
          const roomName = besideRoom.description || besideRoom.name || 'room';
          let roomsBetween = 0;
          
          // Calculate rooms between if destination room is provided
          if (destinationRoom && destinationRoom.floorLevel === targetFloor.level) {
            roomsBetween = calculateRoomsBetween(targetFloor, besideRoom, destinationRoom);
          }
          
          const instruction = {
            elevator,
            besideRoom,
            roomName,
            roomsBetween
          };
          elevatorInstructions.push(instruction);
        }
      } else {
        elevatorInstructions.push({
          elevator,
          besideRoom: null,
          roomName: null,
          roomsBetween: 0
        });
      }
    }
    
    // Process each stairs
    for (const stair of stairs) {
      const besideRooms = findNextRoomsAfterElevatorStairs(targetFloor, stair);
      if (besideRooms.length > 0) {
        for (const besideRoom of besideRooms) {
          // Use room.name as primary, with description as fallback (e.g., "9-S1" or "9-S1 | STAIRS")
          const roomName = besideRoom.name 
            ? (besideRoom.description ? `${besideRoom.name} | ${besideRoom.description}` : besideRoom.name)
            : (besideRoom.description || 'room');
          let roomsBetween = 0;
          
          // Calculate rooms between if destination room is provided
          if (destinationRoom && destinationRoom.floorLevel === targetFloor.level) {
            roomsBetween = calculateRoomsBetween(targetFloor, besideRoom, destinationRoom);
          }
          
          const instruction = {
            stairs: stair,
            besideRoom,
            roomName,
            roomsBetween
          };
          stairsInstructions.push(instruction);
        }
      } else {
        stairsInstructions.push({
          stairs: stair,
          besideRoom: null,
          roomName: null,
          roomsBetween: 0
        });
      }
    }
    
    return {
      elevators: elevatorInstructions,
      stairs: stairsInstructions,
      sameFloor: []
    };
  };

  // Get building info for Point A
  const buildingPinA = pointA?.type === 'room' 
    ? pins.find(p => p.id === pointA.buildingId || p.id === pointA.buildingPin?.id) 
    : (pointA?.type === 'pin' ? pins.find(p => p.id === pointA.id) : null);
  const currentFloorA = buildingPinA?.floors?.find(f => f.level === pointA?.floorLevel);
  const groundFloorA = buildingPinA?.floors?.find(f => f.level === 0);
  const exitRooms = findElevatorAndStairsRooms(currentFloorA);
  const hasElevatorA = exitRooms.elevators.length > 0;
  const hasStairsA = exitRooms.stairs.length > 0;

  // Get building info for Point B
  const buildingPinB = pointB?.type === 'room' 
    ? pins.find(p => p.id === pointB.buildingId || p.id === pointB.buildingPin?.id) 
    : (pointB?.type === 'pin' ? pins.find(p => p.id === pointB.id) : null);
  const destinationFloorB = buildingPinB?.floors?.find(f => f.level === pointB?.floorLevel);
  const groundFloorB = buildingPinB?.floors?.find(f => f.level === 0);
  
  // Check if both points are in the same building
  const sameBuilding = buildingPinA && buildingPinB && 
    (buildingPinA.id === buildingPinB.id || 
     (pointA?.buildingId && pointB?.buildingId && pointA.buildingId === pointB.buildingId));
  
  // Show exit guidance (Getting to Ground Floor) only when:
  // - Starting point is on upper floor, AND
  // - Either: different buildings (cross-building navigation), OR same building going to ground floor
  // Do NOT show when: same building and destination is on a different upper floor
  const showExitGuidanceA = pointA?.type === 'room' && pointA?.floorLevel > 0 && 
    (!sameBuilding || (sameBuilding && pointB?.floorLevel === 0));
  
  // Determine which floor to use for finding stairs/elevator:
  // - If same building and going up/down between floors, use the starting floor (currentFloorA)
  // - If different buildings or starting from ground, use ground floor
  const targetFloorForRoute = sameBuilding && pointA?.floorLevel !== undefined && pointA?.floorLevel > 0 && pointB?.floorLevel > pointA?.floorLevel
    ? currentFloorA  // Same building, going up: use starting floor
    : (sameBuilding && pointA?.floorLevel !== undefined && pointA?.floorLevel > 0 && pointB?.floorLevel < pointA?.floorLevel
      ? currentFloorA  // Same building, going down: use starting floor
      : groundFloorB); // Different buildings or starting from ground: use ground floor
  
  // Generate route instructions with bullet points for destination floor
  const routeInstructionsB = pointB?.floorLevel !== undefined && pointB?.floorLevel >= 0 && (targetFloorForRoute || groundFloorB)
    ? generateRouteInstructions(targetFloorForRoute || groundFloorB, pointB.floorLevel, pointB?.type === 'room' ? pointB : null, false)
    : { elevators: [], stairs: [], sameFloor: [] };
  
  const hasElevatorB = routeInstructionsB.elevators.length > 0;
  const hasStairsB = routeInstructionsB.stairs.length > 0;
  // Check if both points are rooms on the same floor of the same building
  const sameFloorSameBuilding = sameBuilding && 
    pointA?.type === 'room' && pointB?.type === 'room' &&
    pointA?.floorLevel !== undefined && pointB?.floorLevel !== undefined &&
    pointA.floorLevel === pointB.floorLevel;
  
  // Calculate same-floor navigation instructions
  let sameFloorInstructions = null;
  if (sameFloorSameBuilding && currentFloorA && currentFloorA.rooms) {
    // Sort rooms by order if available, otherwise use array index
    const sortedRooms = [...currentFloorA.rooms].sort((a, b) => {
      const orderA = a.order !== undefined && a.order !== null ? a.order : Infinity;
      const orderB = b.order !== undefined && b.order !== null ? b.order : Infinity;
      if (orderA !== orderB) return orderA - orderB;
      // If same order, maintain original array order
      return currentFloorA.rooms.indexOf(a) - currentFloorA.rooms.indexOf(b);
    });
    
    // Find room indices in sorted array
    const findRoomIndex = (roomName) => {
      return sortedRooms.findIndex(r => 
        (r.name || r.id) === roomName || 
        (r._id && roomName && r._id.toString() === roomName.toString())
      );
    };
    
    const startRoomName = pointA.name || pointA.id || pointA.title;
    const destRoomName = pointB.name || pointB.id || pointB.title;
    
    const startIndex = findRoomIndex(startRoomName);
    const destIndex = findRoomIndex(destRoomName);
    
    if (startIndex !== -1 && destIndex !== -1 && startIndex !== destIndex) {
      const roomDifference = Math.abs(destIndex - startIndex);
      const direction = destIndex > startIndex ? 'right' : 'left';
      
      if (roomDifference === 1) {
        // Adjacent room
        sameFloorInstructions = `The destination is ${direction === 'right' ? 'to the right' : 'to the left'} of this room (the room beside this room).`;
      } else {
        // Multiple rooms to pass
        const roomsToPass = roomDifference - 1;
        const roomsList = [];
        
        // Get the rooms between start and destination
        const start = Math.min(startIndex, destIndex);
        const end = Math.max(startIndex, destIndex);
        for (let i = start + 1; i < end; i++) {
          const room = sortedRooms[i];
          const roomDesc = room.description || room.name || 'room';
          roomsList.push(roomDesc);
        }
        
        if (roomsList.length > 0) {
          // Store instructions as object for easier formatting
          sameFloorInstructions = {
            type: 'multiple',
            roomsToPass,
            direction,
            roomsList: roomsList // Already contains room descriptions/names
          };
        } else {
          sameFloorInstructions = `To go to that room, you must pass ${roomsToPass} ${roomsToPass === 1 ? 'room' : 'rooms'} to the ${direction}.`;
        }
      }
    }
  }
  
  // Show route guidance if destination is on a floor (room) and either:
  // - Different buildings, OR
  // - Same building but different floors
  const showRouteGuidanceB = pointB?.type === 'room' && pointB?.floorLevel !== undefined && 
    (!sameBuilding || (sameBuilding && pointA?.floorLevel !== pointB?.floorLevel));
  
  // Show same-floor guidance when both are on the same floor
  const showSameFloorGuidance = sameFloorSameBuilding && sameFloorInstructions;

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
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              overflow: 'hidden',
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
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
            style={{ flex: 1 }} 
            contentContainerStyle={{ padding: 20, paddingBottom: 20, flexGrow: 1 }}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {!pointA || !pointB ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: '#666', textAlign: 'center' }}>
                  No pathfinding data available
                </Text>
              </View>
            ) : (
              <>
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
                  
                  {/* View Facility Details Button - Inside Starting Point Container */}
                  {pointA && buildingPinA && (
                    <TouchableOpacity
                      onPress={() => {
                        if (onShowBuildingDetails) {
                          onShowBuildingDetails(buildingPinA, pointA?.floorLevel, true); // true indicates this is for starting point
                        }
                      }}
                      style={{
                        backgroundColor: '#e8f5e9',
                        padding: 10,
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: '#4caf50',
                        marginTop: 10,
                      }}
                    >
                      <Icon name="info-circle" size={14} color="#4caf50" style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#4caf50' }}>
                        View Facility Details
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Exit Guidance for Upper Floors (Information Only - No Button) */}
              {showExitGuidanceA && (() => {
                const exitInstructionsA = generateRouteInstructions(currentFloorA || groundFloorA, 0, null, true);
                return (
                  <View style={{
                    backgroundColor: '#fff3e0',
                    padding: 12,
                    borderRadius: 8,
                    marginTop: 12,
                    borderLeftWidth: 3,
                    borderLeftColor: '#ff9800',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <Icon name="arrow-down" size={16} color="#ff9800" style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#ff9800' }}>
                        To go to the ground floor, use:
                      </Text>
                    </View>
                    
                    {/* Elevator Instructions */}
                    {hasElevatorA && exitInstructionsA.elevators.length > 0 && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#1976d2', marginBottom: 8 }}>
                          • ELEVATOR
                        </Text>
                        {exitInstructionsA.elevators.map((inst, idx) => (
                          <View key={idx} style={{ marginLeft: 16, marginBottom: 8 }}>
                            {inst.besideRoom && inst.roomName ? (
                              <Text style={{ fontSize: 13, color: '#333', lineHeight: 20 }}>
                                Use the <Text style={{ fontWeight: 'bold' }}>ELEVATOR</Text> beside <Text style={{ fontWeight: 'bold' }}>{inst.roomName}</Text>.
                              </Text>
                            ) : (
                              <Text style={{ fontSize: 13, color: '#333', lineHeight: 20 }}>
                                Use the <Text style={{ fontWeight: 'bold' }}>ELEVATOR</Text>.
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                    
                    {/* Stairs Instructions */}
                    {hasStairsA && exitInstructionsA.stairs.length > 0 && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#f57c00', marginBottom: 8 }}>
                          • STAIRS
                        </Text>
                        {exitInstructionsA.stairs.map((inst, idx) => (
                          <View key={idx} style={{ marginLeft: 16, marginBottom: 8 }}>
                            {inst.besideRoom && inst.roomName ? (
                              <Text style={{ fontSize: 13, color: '#333', lineHeight: 20 }}>
                                Use the <Text style={{ fontWeight: 'bold' }}>STAIRS</Text> beside <Text style={{ fontWeight: 'bold' }}>{inst.roomName}</Text>.
                              </Text>
                            ) : (
                              <Text style={{ fontSize: 13, color: '#333', lineHeight: 20 }}>
                                Use the <Text style={{ fontWeight: 'bold' }}>STAIRS</Text>.
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })()}
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
                  
                  {/* View Building Details Button - Inside Destination Container */}
                  {pointB && buildingPinB && (
                    <TouchableOpacity
                      onPress={() => {
                        if (onShowBuildingDetails) {
                          onShowBuildingDetails(buildingPinB, pointB?.floorLevel);
                        }
                      }}
                      style={{
                        backgroundColor: '#e8f5e9',
                        padding: 10,
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: '#4caf50',
                        marginTop: 10,
                      }}
                    >
                      <Icon name="info-circle" size={14} color="#4caf50" style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#4caf50' }}>
                        View Facility Details
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Same-Floor Navigation Guidance */}
              {showSameFloorGuidance && (
                <View style={{
                  backgroundColor: '#e3f2fd',
                  padding: 12,
                  borderRadius: 8,
                  marginTop: 12,
                  borderLeftWidth: 3,
                  borderLeftColor: '#2196f3',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Icon name="arrows-h" size={16} color="#2196f3" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#2196f3' }}>
                      • Navigating on Same Floor
                    </Text>
                  </View>
                  <View style={{ marginLeft: 16 }}>
                    {typeof sameFloorInstructions === 'object' && sameFloorInstructions.type === 'multiple' ? (
                      <Text style={{ fontSize: 13, color: '#333', lineHeight: 20 }}>
                        To go to that room, you must pass {sameFloorInstructions.roomsToPass} {sameFloorInstructions.roomsToPass === 1 ? 'room' : 'rooms'} to the {sameFloorInstructions.direction}: {
                          sameFloorInstructions.roomsList.map((room, idx) => (
                            <React.Fragment key={idx}>
                              <Text style={{ fontWeight: 'bold' }}>{room}</Text>
                              {idx < sameFloorInstructions.roomsList.length - 1 && (
                                <Text>{idx === sameFloorInstructions.roomsList.length - 2 ? ' and ' : ', '}</Text>
                              )}
                            </React.Fragment>
                          ))
                        }.
                      </Text>
                    ) : (
                      <Text style={{ fontSize: 13, color: '#333', lineHeight: 20 }}>
                        {sameFloorInstructions}
                      </Text>
                    )}
                  </View>
                </View>
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Icon name="arrow-up" size={16} color="#4caf50" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#4caf50' }}>
                      To get to the {getFloorName(pointB.floorLevel).toLowerCase()}, use:
                    </Text>
                  </View>
                  
                  {/* Elevator Instructions */}
                  {hasElevatorB && routeInstructionsB.elevators.length > 0 && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#1976d2', marginBottom: 8 }}>
                        • ELEVATOR
                      </Text>
                      {routeInstructionsB.elevators.map((inst, idx) => (
                        <View key={idx} style={{ marginLeft: 16, marginBottom: 8 }}>
                          {inst.besideRoom && inst.roomName ? (
                            <Text style={{ fontSize: 13, color: '#333', lineHeight: 20 }}>
                              Use the <Text style={{ fontWeight: 'bold' }}>ELEVATOR</Text> beside <Text style={{ fontWeight: 'bold' }}>{inst.roomName}</Text>
                              {inst.roomsBetween > 0 && (
                                <Text style={{ fontSize: 13, color: '#333' }}>
                                  {' '}({inst.roomsBetween} {inst.roomsBetween === 1 ? 'room' : 'rooms'} between the elevator and destination)
                                </Text>
                              )}
                            </Text>
                          ) : (
                            <Text style={{ fontSize: 13, color: '#333', lineHeight: 20 }}>
                              Use the <Text style={{ fontWeight: 'bold' }}>ELEVATOR</Text>.
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {/* Stairs Instructions */}
                  {hasStairsB && routeInstructionsB.stairs.length > 0 && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#f57c00', marginBottom: 8 }}>
                        • STAIRS
                      </Text>
                      {routeInstructionsB.stairs.map((inst, idx) => (
                        <View key={idx} style={{ marginLeft: 16, marginBottom: 8 }}>
                          {inst.besideRoom && inst.roomName ? (
                            <Text style={{ fontSize: 13, color: '#333', lineHeight: 20 }}>
                              Use the <Text style={{ fontWeight: 'bold' }}>STAIRS</Text> beside <Text style={{ fontWeight: 'bold' }}>{inst.roomName}</Text>
                              {inst.roomsBetween > 0 && (
                                <Text style={{ fontSize: 13, color: '#333' }}>
                                  {' '}({inst.roomsBetween} {inst.roomsBetween === 1 ? 'room' : 'rooms'} between the stairs and destination)
                                </Text>
                              )}
                            </Text>
                          ) : (
                            <Text style={{ fontSize: 13, color: '#333', lineHeight: 20 }}>
                              Use the <Text style={{ fontWeight: 'bold' }}>STAIRS</Text>.
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {/* Same Floor Navigation (if applicable) */}
                  {sameFloorSameBuilding && sameFloorInstructions && (
                    <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e0e0e0' }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#2196f3', marginBottom: 8 }}>
                        • Navigating on Same Floor
                      </Text>
                      <Text style={{ fontSize: 13, color: '#333', lineHeight: 20, marginLeft: 16 }}>
                        {sameFloorInstructions}
                      </Text>
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
              Lost your way?
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
              </>
            )}
          </ScrollView>
        </Animated.View>
      )}
    </Modal>
  );
};

export default PathfindingDetailsModal;
