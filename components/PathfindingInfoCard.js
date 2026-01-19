import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Platform, Animated } from 'react-native';
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
  onUpdatePath,
  showPathfindingDetails = false
}) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Fade out when More Details is opened, fade in when closed
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showPathfindingDetails ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showPathfindingDetails, fadeAnim]);

  return (
    <Animated.View style={{
      position: 'absolute',
      top: Platform.OS === 'ios' ? 70 : 40,
      left: 20,
      right: 20,
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 10,
      borderWidth: 1,
      borderColor: '#e0e0e0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
      zIndex: 1000,
      opacity: fadeAnim,
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
      
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingRight: 30 }}>
        <Image 
          source={require('../assets/you-are-here.png')} 
          style={{ width: 30, height: 30, marginRight: 10 }}
          resizeMode="contain"
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>Starting Point</Text>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#333' }} numberOfLines={2}>
            {pointA.description || pointA.title}
          </Text>
          {pointA.type === 'room' && pointA.floorLevel !== undefined && (
            <Text style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
              {getFloorName(pointA.floorLevel)}
            </Text>
          )}
        </View>
      </View>
      
      <View style={{ height: 1, backgroundColor: '#e0e0e0', marginVertical: 6 }} />
      
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingRight: 30 }}>
        <Image 
          source={require('../assets/destination.png')} 
          style={{ width: 30, height: 30, marginRight: 10 }}
          resizeMode="contain"
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>Destination</Text>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#333' }} numberOfLines={2}>
            {pointB.description || pointB.title}
          </Text>
          {pointB.type === 'room' && pointB.floorLevel !== undefined && (
            <Text style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
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
          padding: 8,
          borderRadius: 6,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: '#90caf9',
          marginTop: 6,
        }}
      >
        <Icon name="info-circle" size={14} color="#1976d2" style={{ marginRight: 6 }} />
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#1976d2' }}>
          More Details
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default PathfindingInfoCard;
