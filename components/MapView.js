/**
 * MapView Component
 * 
 * Displays the campus map with zoom/pan functionality.
 * Renders:
 * - Map image (either from Cloudinary or local fallback)
 * - SVG overlay with pins and pathfinding paths
 * - Handles image loading errors and fallbacks
 */

import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';
import Svg, { Circle, Text as SvgText, Polyline, G } from 'react-native-svg';
import { ExpoImage } from '../utils/imageUtils';
import { interpolateColor, interpolateBlueColor, interpolateRedColor } from '../utils/colorInterpolation';

const { width, height } = Dimensions.get('window');

/**
 * MapView component with zoom and pan functionality
 * 
 * @param {Object} props - Component props
 * @param {Object} props.currentCampus - Current campus object with mapImageUrl
 * @param {boolean} props.mapImageLoadError - Whether map image failed to load
 * @param {number} props.imageWidth - Width of the map image
 * @param {number} props.imageHeight - Height of the map image
 * @param {number} props.zoomScale - Current zoom scale (for pin sizing)
 * @param {Array} props.visiblePins - Array of pins to display on the map
 * @param {Array} props.path - Array of pathfinding path coordinates
 * @param {string} props.pathLineStyle - Style of path line ('dot', 'dash', or 'solid')
 * @param {number|null} props.highlightedPinId - ID of pin to highlight on map
 * @param {number|null} props.clickedPinId - ID of clicked/selected pin
 * @param {Object|null} props.pointA - Starting point for pathfinding
 * @param {Object|null} props.pointB - Destination point for pathfinding
 * @param {boolean} props.pathfindingMode - Whether pathfinding mode is active
 * @param {Function} props.onPinPress - Callback when a pin is pressed
 * @param {Function} props.onZoomChange - Callback when zoom scale changes
 * @param {Function} props.onMapImageError - Callback when map image fails to load
 * @param {Object} props.imageZoomRef - Ref to ImageZoom component for programmatic control
 * @param {string} props.imageZoomKey - Key to force ImageZoom re-render
 */
const MapView = ({
  currentCampus,
  mapImageLoadError = false,
  imageWidth,
  imageHeight,
  zoomScale = 1,
  visiblePins = [],
  path = [],
  pathLineStyle = 'dash',
  highlightedPinId = null,
  clickedPinId = null,
  pointA = null,
  pointB = null,
  pathfindingMode = false,
  onPinPress,
  onZoomChange,
  onMapImageError,
  imageZoomRef,
  imageZoomKey
}) => {
  /**
   * Renders the map image
   * Uses local fallback for USTP-CDO if Cloudinary image fails
   */
  const renderMapImage = () => {
    // For USTP-CDO, use local image as fallback when:
    // 1. No mapImageUrl is available
    // 2. Image failed to load (no internet, no cache)
    const isUSTPCDO = currentCampus?.name === 'USTP-CDO';
    const shouldUseLocal = isUSTPCDO && (!currentCampus?.mapImageUrl || mapImageLoadError);

    if (shouldUseLocal) {
      return (
        <Image
          source={require('../assets/ustp-cdo-map.png')}
          style={{ width: imageWidth, height: imageHeight }}
          resizeMode="contain"
        />
      );
    }

    // Try Cloudinary URL first (for USTP-CDO with mapImageUrl, or other campuses)
    if (currentCampus?.mapImageUrl) {
      return (
        <ExpoImage
          source={{ uri: currentCampus.mapImageUrl }}
          style={{ width: imageWidth, height: imageHeight }}
          contentFit="contain"
          cachePolicy="disk"
          priority="high"
          onError={() => {
            // If image fails to load and it's USTP-CDO, fallback to local image
            if (currentCampus?.name === 'USTP-CDO' && onMapImageError) {
              onMapImageError();
            }
          }}
        />
      );
    }

    // Fallback to local image if no mapImageUrl
    return (
      <Image
        source={require('../assets/ustp-cdo-map.png')}
        style={{ width: imageWidth, height: imageHeight }}
        resizeMode="contain"
      />
    );
  };

  /**
   * Determines pin color based on state (highlighted, clicked, pathfinding active, etc.)
   */
  const getPinColor = (pin) => {
    // Check if pin is highlighted on map (from "Show on Map" button)
    if (highlightedPinId === pin.id) {
      return {
        fill: '#FFD700', // Gold for highlighted
        stroke: '#FFA500',
        strokeWidth: 3
      };
    }

    // Check if pin is clicked/selected
    if (clickedPinId === pin.id) {
      return {
        fill: '#2196F3', // Blue for selected
        stroke: '#1976D2',
        strokeWidth: 3
      };
    }

    // Check if pin is part of pathfinding (point A or B)
    if (pathfindingMode) {
      if (pointA && pin.id === pointA.id) {
        // Point A - blue gradient
        return {
          fill: interpolateBlueColor(1), // Use interpolation for active state
          stroke: '#1976D2',
          strokeWidth: 2.5
        };
      }
      if (pointB && pin.id === pointB.id) {
        // Point B - red gradient
        return {
          fill: interpolateRedColor(1), // Use interpolation for active state
          stroke: '#C62828',
          strokeWidth: 2.5
        };
      }
      // Pin is in pathfinding path
      const isInPath = path.some(p => p.id === pin.id);
      if (isInPath) {
        return {
          fill: '#00D4FF', // Sky blue for path pins
          stroke: '#0288D1',
          strokeWidth: 2
        };
      }
    }

    // Default pin color
    return {
      fill: '#f0f0f0', // Light gray
      stroke: '#4a4a4a', // Medium gray outline
      strokeWidth: 2.5
    };
  };

  /**
   * Calculates pin radius based on zoom and state
   */
  const getPinRadius = (pin) => {
    const baseRadius = 20 / zoomScale;
    
    // Larger radius for highlighted or clicked pins
    if (highlightedPinId === pin.id || clickedPinId === pin.id) {
      return 24 / zoomScale;
    }

    return baseRadius;
  };

  return (
    <View style={styles.imageContainer}>
      <ImageZoom
        key={imageZoomKey}
        ref={imageZoomRef}
        cropWidth={width}
        cropHeight={height}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        minScale={1}
        maxScale={3}
        enableCentering={false}
        cropOffset={0}
        onScaleChanged={(scale) => {
          if (onZoomChange) {
            onZoomChange(scale);
          }
        }}
      >
        <View style={{ width: imageWidth, height: imageHeight }}>
          {/* Map Image */}
          {renderMapImage()}

          {/* Overlay SVG for Pins and Path */}
          <Svg 
            height={imageHeight} 
            width={imageWidth} 
            viewBox="0 0 1920 1310"
            style={StyleSheet.absoluteFill}
          >
            {/* Draw pathfinding path if exists */}
            {path.length > 0 && (
              <Polyline
                points={path.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#00D4FF" // Sky blue
                strokeWidth={Math.max(3, 12 / zoomScale)} 
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={
                  pathLineStyle === 'dash' 
                    ? `${Math.max(8, 20 / zoomScale)} ${Math.max(12, 30 / zoomScale)}` 
                    : pathLineStyle === 'dot' 
                      ? `0 ${Math.max(16, 32 / zoomScale)}` 
                      : undefined
                }
                strokeDashoffset={pathLineStyle === 'dot' ? Math.max(8, 16 / zoomScale) : undefined}
                opacity="1"
              />
            )}

            {/* Render Pins */}
            {visiblePins.map((pin, index) => {
              // Skip invisible waypoints (used for pathfinding but not displayed)
              if (pin.isInvisible) return null;

              const uniqueKey = pin._id ? `${pin._id.toString()}-${index}` : `pin-${pin.id}-${index}`;
              const pinColors = getPinColor(pin);
              const radius = getPinRadius(pin);

              return (
                <G key={uniqueKey}>
                  {/* Pin Circle */}
                  <Circle
                    cx={pin.x}
                    cy={pin.y}
                    r={radius}
                    fill={pinColors.fill}
                    stroke={pinColors.stroke}
                    strokeWidth={pinColors.strokeWidth}
                  />
                  {/* Pin Label */}
                  <SvgText
                    x={pin.x}
                    y={pin.y + radius + 15}
                    fontSize={Math.max(10, 14 / zoomScale)}
                    fill="#333"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {pin.title || pin.description || pin.name || 'Pin'}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </View>
      </ImageZoom>
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default MapView;
