import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Platform, Animated } from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { getFloorName } from '../utils/floorUtils';

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
  const fadeAnim = useRef(new Animated.Value(0)).current; // Start at 0 for fade-in
  const [isClosing, setIsClosing] = useState(false);
  
  // Fade-in animation on mount
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []); // Only on mount

  // Fade out when More Details is opened, fade in when closed
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showPathfindingDetails ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showPathfindingDetails, fadeAnim]);

  // Handle close with fade-out animation
  const handleClose = () => {
    setIsClosing(true);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onResetPathfinding();
    });
  };

  // Button fade-in animations (staggered)
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;
  const closeButtonFadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Fade in close button first
    Animated.timing(closeButtonFadeAnim, {
      toValue: 1,
      duration: 200,
      delay: 100,
      useNativeDriver: true,
    }).start();
    
    // Then fade in content and button
    Animated.timing(buttonFadeAnim, {
      toValue: 1,
      duration: 300,
      delay: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute',
      top: Platform.OS === 'ios' ? 70 : 40,
      left: 20,
      right: 20,
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 10,
      borderWidth: 1,
      borderColor: '#e0e0e0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 1000,
      opacity: fadeAnim,
    }}>
      <Animated.View style={{ opacity: buttonFadeAnim }}>
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
    </Animated.View>
  );
};

export default PathfindingInfoCard;
