/**
 * Header Component
 * 
 * Displays the top navigation bar with:
 * - QR Scanner button (left)
 * - Campus selector button (center)
 * - Search button (right)
 * 
 * Also includes:
 * - Filter button (below header)
 * - Pathfinding toggle button (below filter)
 */

import React from 'react';
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { styles } from '../styles';

// Conditionally import BarCodeScanner (only available in development builds)
let BarCodeScanner = null;
try {
  BarCodeScanner = require('expo-barcode-scanner').BarCodeScanner;
} catch (error) {
  console.log('BarCodeScanner native module not available (requires development build)');
}

/**
 * Header component with navigation buttons
 * 
 * @param {Object} props - Component props
 * @param {string} props.currentCampusName - Name of the currently selected campus
 * @param {boolean} props.isSearchVisible - Whether search modal is currently visible
 * @param {boolean} props.hasFilterActive - Whether any category filters are active
 * @param {boolean} props.showPathfindingPanel - Whether pathfinding panel is visible
 * @param {boolean} props.pathfindingMode - Whether pathfinding mode is active
 * @param {Function} props.onQrScannerPress - Callback when QR scanner button is pressed
 * @param {Function} props.onCampusPress - Callback when campus selector button is pressed
 * @param {Function} props.onSearchPress - Callback when search button is pressed
 * @param {Function} props.onFilterPress - Callback when filter button is pressed
 * @param {Function} props.onPathfindingPress - Callback when pathfinding button is pressed
 */
const Header = ({
  currentCampusName = 'USTP-CDO',
  isSearchVisible = false,
  hasFilterActive = false,
  showPathfindingPanel = false,
  pathfindingMode = false,
  onQrScannerPress,
  onCampusPress,
  onSearchPress,
  onFilterPress,
  onPathfindingPress
}) => {
  /**
   * Handles QR scanner button press
   * Checks for BarCodeScanner availability and camera permissions
   */
  const handleQrScannerPress = async () => {
    // Check if BarCodeScanner is available (requires development build)
    if (!BarCodeScanner) {
      Alert.alert(
        'QR Scanner Not Available',
        'QR code scanning requires a development build.\n\nTo enable QR scanning:\n1. Run: npx expo prebuild\n2. Run: npx expo run:android\n\nOr use deep links: campustrails://pin/123',
        [{ text: 'OK' }]
      );
      return;
    }

    // Call parent handler if provided
    if (onQrScannerPress) {
      onQrScannerPress();
    }
  };

  return (
    <>
      {/* Main Header */}
      <View style={styles.header}>
        {/* QR Scanner button (left) */}
        <TouchableOpacity 
          style={styles.headerButtonLeft} 
          onPress={handleQrScannerPress}
        >
          <Icon name="qrcode" size={20} color="white" />
        </TouchableOpacity>

        {/* Change Campus Button (Center) */}
        <TouchableOpacity 
          style={styles.headerButtonCenter} 
          onPress={onCampusPress}
        >
          <Icon name="exchange" size={20} color="white" />
          <Text 
            style={styles.buttonText}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.7}
          >
            {currentCampusName}
          </Text>
        </TouchableOpacity>

        {/* Search Button (Right) */}
        <TouchableOpacity 
          style={styles.headerButtonRight} 
          onPress={onSearchPress}
        >
          <Icon 
            name={isSearchVisible ? "times" : "search"} 
            size={20} 
            color="white" 
          />
        </TouchableOpacity>
      </View>

      {/* Filter Button - positioned between Search and Pathfinding */}
      <TouchableOpacity 
        style={styles.filterButtonBetween} 
        onPress={onFilterPress}
      >
        <Icon 
          name={hasFilterActive ? "times" : "filter"} 
          size={20} 
          color="white" 
        />
      </TouchableOpacity>

      {/* Pathfinding Toggle Button - positioned below Search button */}
      <TouchableOpacity 
        style={styles.pathfindingButtonBelowSearch}
        onPress={onPathfindingPress}
      >
        <Icon 
          name={(showPathfindingPanel || pathfindingMode) ? "times" : "location-arrow"} 
          size={20} 
          color="white" 
        />
      </TouchableOpacity>
    </>
  );
};

export default Header;
