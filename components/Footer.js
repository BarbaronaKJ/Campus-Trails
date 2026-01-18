import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { styles } from '../styles';

/**
 * Footer Component
 * Bottom navigation bar with settings, view all pins, and user profile buttons
 */
const Footer = ({
  pathfindingMode,
  isLoggedIn,
  onToggleSettings,
  onTogglePinsModal,
  onToggleUserProfile,
  onToggleAuthModal,
  styles: customStyles
}) => {
  const footerStyles = customStyles || styles;

  if (pathfindingMode) {
    return null; // Hide footer during pathfinding
  }

  return (
    <View style={footerStyles.footer}>
      <TouchableOpacity 
        style={footerStyles.footerButton} 
        onPress={onToggleSettings}
      >
        <Icon name="cog" size={20} color="white" />
      </TouchableOpacity>

      <TouchableOpacity style={footerStyles.middleFooterButton} onPress={onTogglePinsModal}>
        <Icon name="list" size={20} color="white" />
        <Text 
          style={footerStyles.buttonText}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.7}
        >
          View All Pins
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={footerStyles.footerButton} 
        onPress={() => {
          if (isLoggedIn) {
            // If logged in, show User Profile modal
            onToggleUserProfile();
          } else {
            // If not logged in, show Auth Modal
            onToggleAuthModal();
          }
        }}
      >
        <Icon name="user" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default Footer;
