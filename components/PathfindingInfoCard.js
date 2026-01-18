import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Platform } from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { getFloorName } from '../utils/floorUtils';
import { aStarPathfinding } from '../utils/pathfinding';

/**
 * Pathfinding Info Card Component
 * Displays pathfinding information (start point, destination, exit instructions)
 */
const PathfindingInfoCard = ({
  pointA,
  pointB,
  pins,
  onResetPathfinding,
  onShowPathfindingDetails,
  onUpdatePointA,
  onUpdatePath
}) => {
  const [showExitInstructions, setShowExitInstructions] = useState(false);

  // Get exit instructions if pointA is on upper floor
  const buildingPin = pointA?.type === 'room' ? pins.find(p => p.id === pointA.buildingId || p.id === pointA.buildingPin?.id) : null;
  const currentFloor = buildingPin?.floors?.find(f => f.level === pointA.floorLevel);
  const exitInstructions = currentFloor?.exitInstructions || 
    'To reach the ground floor, take the stairs located to your right or use the elevator down the hall.';
  const showExitButton = pointA.type === 'room' && pointA.floorLevel > 0;

  const handleSetGroundFloor = () => {
    // Update pointA to ground floor of the same building
    if (buildingPin) {
      const groundFloorRoom = buildingPin.floors
        ?.find(f => f.level === 0)
        ?.rooms?.[0];
      let newPointA;
      if (groundFloorRoom) {
        newPointA = {
          ...pointA,
          floorLevel: 0,
          name: groundFloorRoom.name,
          description: `${buildingPin.description || buildingPin.title} - ${groundFloorRoom.name}`,
        };
      } else {
        newPointA = buildingPin;
      }
      
      if (onUpdatePointA) {
        onUpdatePointA(newPointA);
      }
      
      // Recalculate path after state update
      setTimeout(async () => {
        try {
          const startId = newPointA.type === 'room' ? (newPointA.buildingId || newPointA.buildingPin?.id || newPointA.id) : newPointA.id;
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
    setShowExitInstructions(false);
  };

  return (
    <View style={{
      position: 'absolute',
      top: Platform.OS === 'ios' ? 70 : 40,
      left: 20,
      right: 20,
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 15,
      borderWidth: 1,
      borderColor: '#e0e0e0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
      zIndex: 1000,
    }}>
      <TouchableOpacity
        onPress={onResetPathfinding}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1001,
        }}
      >
        <Icon name="times" size={20} color="#666" />
      </TouchableOpacity>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingRight: 30 }}>
        <Image 
          source={require('../assets/you-are-here.png')} 
          style={{ width: 40, height: 40, marginRight: 12 }}
          resizeMode="contain"
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>Starting Point</Text>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }} numberOfLines={2}>
            {pointA.description || pointA.title}
          </Text>
          {pointA.type === 'room' && pointA.floorLevel !== undefined && (
            <Text style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
              {getFloorName(pointA.floorLevel)}
            </Text>
          )}
        </View>
      </View>
      
      {/* Exit Instructions - Show when on upper floor */}
      {showExitButton && (
        <>
          <TouchableOpacity
            onPress={() => setShowExitInstructions(!showExitInstructions)}
            style={{
              backgroundColor: '#fff3e0',
              padding: 12,
              borderRadius: 8,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: '#ffcc80',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Icon name="arrow-down" size={16} color="#ff9800" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#ff9800', flex: 1 }}>
              Return to Ground Floor - {getFloorName(pointA.floorLevel)}
            </Text>
            <Icon name={showExitInstructions ? "chevron-up" : "chevron-down"} size={16} color="#ff9800" />
          </TouchableOpacity>
          
          {showExitInstructions && (
            <View style={{
              backgroundColor: '#fff9e6',
              padding: 12,
              borderRadius: 8,
              marginBottom: 8,
              borderLeftWidth: 3,
              borderLeftColor: '#ff9800',
            }}>
              <Text style={{ fontSize: 13, color: '#333', lineHeight: 20 }}>
                {exitInstructions}
              </Text>
              <TouchableOpacity
                onPress={handleSetGroundFloor}
                style={{
                  marginTop: 10,
                  padding: 8,
                  backgroundColor: '#ff9800',
                  borderRadius: 6,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#fff' }}>
                  Set Ground Floor as Start
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
      
      <View style={{ height: 1, backgroundColor: '#e0e0e0', marginVertical: 8 }} />
      
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingRight: 30 }}>
        <Image 
          source={require('../assets/destination.png')} 
          style={{ width: 40, height: 40, marginRight: 12 }}
          resizeMode="contain"
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>Destination</Text>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }} numberOfLines={2}>
            {pointB.description || pointB.title}
          </Text>
          {pointB.type === 'room' && pointB.floorLevel !== undefined && (
            <Text style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
              {getFloorName(pointB.floorLevel)}
            </Text>
          )}
        </View>
      </View>
      
      {/* More Details Button */}
      <TouchableOpacity
        onPress={onShowPathfindingDetails}
        style={{
          backgroundColor: '#e3f2fd',
          padding: 12,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: '#90caf9',
          marginTop: 8,
        }}
      >
        <Icon name="info-circle" size={16} color="#1976d2" style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#1976d2' }}>
          More Details
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default PathfindingInfoCard;
