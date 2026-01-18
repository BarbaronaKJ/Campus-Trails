import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
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
 * Header Component
 * Top navigation bar with QR scanner, campus selector, and search button
 */
const Header = ({
  pathfindingMode,
  currentCampus,
  isSearchVisible,
  hasPermission,
  setHasPermission,
  onOpenQrScanner,
  onToggleCampus,
  onToggleSearch,
  styles: customStyles
}) => {
  const headerStyles = customStyles || styles;

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
    
    try {
      if (hasPermission === null) {
        try {
          const { status } = await BarCodeScanner.requestPermissionsAsync();
          setHasPermission(status === 'granted');
          if (status === 'granted') {
            onOpenQrScanner();
          } else {
            Alert.alert('Permission Needed', 'Camera permission is required to scan QR codes.');
          }
        } catch (error) {
          console.error('Error requesting camera permission:', error);
          Alert.alert(
            'QR Scanner Not Available',
            'QR code scanning requires a development build. Please build the app using:\n\nnpx expo prebuild\nnpx expo run:android\n\nOr use deep links instead: campustrails://pin/123'
          );
        }
        return;
      }
      if (hasPermission === false) {
        Alert.alert('Permission Denied', 'Please enable camera permission in settings to scan QR codes.');
        return;
      }
      onOpenQrScanner();
    } catch (error) {
      console.error('Error opening QR scanner:', error);
      Alert.alert(
        'QR Scanner Not Available',
        'QR code scanning requires a development build. Please build the app using:\n\nnpx expo prebuild\nnpx expo run:android\n\nOr use deep links instead: campustrails://pin/123'
      );
    }
  };

  if (pathfindingMode) {
    return null; // Hide header during pathfinding
  }

  return (
    <View style={headerStyles.header}>
      {/* QR Scanner button (left) to keep center button centered */}
      <TouchableOpacity 
        style={headerStyles.headerButtonLeft} 
        onPress={handleQrScannerPress}
      >
        <Icon name="qrcode" size={20} color="white" />
      </TouchableOpacity>

      {/* Change Campus Button (Center) */}
      <TouchableOpacity style={headerStyles.headerButtonCenter} onPress={onToggleCampus}>
        <Icon name="exchange" size={20} color="white" />
        <Text 
          style={headerStyles.buttonText}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.7}
        >
          {currentCampus?.name || 'USTP-CDO'}
        </Text>
      </TouchableOpacity>

      {/* Search Button (Right) */}
      <TouchableOpacity style={headerStyles.headerButtonRight} onPress={onToggleSearch}>
        <Icon name={isSearchVisible ? "times" : "search"} size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default Header;
