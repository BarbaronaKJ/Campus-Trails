/**
 * PathfindingPanel Component
 * 
 * Bottom slide-in panel for pathfinding/navigation.
 * Allows users to:
 * - Select start point (Point A)
 * - Select destination (Point B)
 * - Swap points
 * - Start pathfinding (calculate route)
 * 
 * Uses animated slide-in/out animation for smooth UX.
 */

import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { styles as appStyles } from '../styles';
import { interpolateBlueColor, interpolateRedColor } from '../utils/colorInterpolation';

/**
 * PathfindingPanel component
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Whether panel is visible
 * @param {Object|null} props.pointA - Starting point pin object
 * @param {Object|null} props.pointB - Destination point pin object
 * @param {Function} props.onPointAPress - Callback when Point A selector is pressed
 * @param {Function} props.onPointBPress - Callback when Point B selector is pressed
 * @param {Function} props.onSwapPress - Callback when swap button is pressed
 * @param {Function} props.onStartPathfinding - Callback when "Go Now" button is pressed
 * @param {Function} props.onClose - Callback when panel is closed
 * @param {Animated.Value} props.slideAnim - Animated value for slide animation
 * @param {Object} props.pointAColorLight - Light color for Point A (RGB object)
 * @param {Object} props.pointAColorDark - Dark color for Point A (RGB object)
 * @param {Object} props.pointBColorLight - Light color for Point B (RGB object)
 * @param {Object} props.pointBColorDark - Dark color for Point B (RGB object)
 * @param {boolean} props.pathfindingMode - Whether pathfinding mode is active
 * @param {number} props.pointAValue - Value for Point A color interpolation (0-1)
 * @param {number} props.pointBValue - Value for Point B color interpolation (0-1)
 */
const PathfindingPanel = ({
  visible = false,
  pointA = null,
  pointB = null,
  onPointAPress,
  onPointBPress,
  onSwapPress,
  onStartPathfinding,
  onClose,
  slideAnim,
  pointAColorDark = { r: 25, g: 118, b: 210 },
  pointBColorDark = { r: 198, g: 40, b: 40 },
  pathfindingMode = false,
  pointAValue = 0,
  pointBValue = 0
}) => {
  if (!visible) return null;

  /**
   * Gets the background color for Point A icon
   */
  const getPointAColor = () => {
    if (pathfindingMode && pointA) {
      return interpolateBlueColor(pointAValue);
    }
    return `rgb(${pointAColorDark.r}, ${pointAColorDark.g}, ${pointAColorDark.b})`;
  };

  /**
   * Gets the background color for Point B icon
   */
  const getPointBColor = () => {
    if (pathfindingMode && pointB) {
      return interpolateRedColor(pointBValue);
    }
    return `rgb(${pointBColorDark.r}, ${pointBColorDark.g}, ${pointBColorDark.b})`;
  };

  return (
    <Animated.View 
      style={[
        appStyles.bottomNavCard, 
        { 
          transform: [{ translateY: slideAnim }],
          opacity: slideAnim.interpolate({
            inputRange: [0, 150, 300],
            outputRange: [1, 0.5, 0],
          }),
        }
      ]}
    >
      {/* Header */}
      <TouchableOpacity 
        style={appStyles.modalHeaderWhite} 
        onPress={onClose}
      >
        <Text style={[appStyles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>
          Navigation
        </Text>
      </TouchableOpacity>
      <View style={appStyles.lineDark}></View>
      
      {/* Content */}
      <View style={{ backgroundColor: '#f5f5f5', padding: 20 }}>
        {/* Origin/Destination Display */}
        <View style={appStyles.locationRow}>
          <TouchableOpacity 
            style={appStyles.locationItem}
            onPress={onPointAPress}
          >
            <View style={[
              appStyles.locationIconContainer,
              {
                backgroundColor: getPointAColor()
              }
            ]}>
              <Icon 
                name="crosshairs" 
                size={18} 
                color="#ffffff" 
              />
            </View>
            <View style={appStyles.locationTextContainer}>
              <Text style={appStyles.locationLabel}>Your place (Start)</Text>
              <Text style={appStyles.locationValue}>
                {pointA ? pointA.description : 'Tap to select location...'}
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={appStyles.swapButtonSmall} 
            onPress={onSwapPress}
          >
            <Icon name="exchange" size={18} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={appStyles.locationRow}>
          <TouchableOpacity 
            style={appStyles.locationItem}
            onPress={onPointBPress}
          >
            <View style={[
              appStyles.locationIconContainer,
              {
                backgroundColor: getPointBColor()
              }
            ]}>
              <Icon 
                name="map-marker" 
                size={18} 
                color="#ffffff" 
              />
            </View>
            <View style={appStyles.locationTextContainer}>
              <Text style={appStyles.locationLabel}>Destination</Text>
              <Text style={appStyles.locationValue} numberOfLines={1}>
                {pointB ? pointB.description : 'Tap to select destination...'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Go Now Button */}
        <TouchableOpacity 
          style={[
            appStyles.goNowButton, 
            (!pointA || !pointB) && appStyles.goNowButtonDisabled
          ]} 
          onPress={onStartPathfinding}
          disabled={!pointA || !pointB}
        >
          <Icon name="paper-plane" size={20} color="white" style={{ marginRight: 8 }} />
          <Text 
            style={appStyles.goNowButtonText}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.7}
          >
            Go Now
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default PathfindingPanel;
