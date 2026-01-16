/**
 * CampusSelectorModal Component
 * 
 * Modal for selecting campus.
 * Displays list of available campuses for selection.
 * Uses animated slide-in animation for smooth UX.
 */

import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Animated } from 'react-native';
import { styles } from '../styles';

/**
 * CampusSelectorModal component
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Whether modal is visible
 * @param {Array} props.campuses - Array of campus names (strings)
 * @param {Array} props.campusesData - Array of full campus objects with mapImageUrl
 * @param {Function} props.onCampusSelect - Callback when campus is selected
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Animated.Value} props.animation - Animated value for slide animation
 */
const CampusSelectorModal = ({
  visible = false,
  campuses = [],
  campusesData = [],
  onCampusSelect,
  onClose,
  animation
}) => {
  if (!visible) return null;

  /**
   * Handles campus selection
   */
  const handleCampusSelect = (campus) => {
    if (onCampusSelect) {
      onCampusSelect(campus);
    }
    if (onClose) {
      onClose();
    }
  };

  // Use campusesData if available, otherwise use campuses array
  const displayData = campusesData.length > 0 
    ? campusesData 
    : campuses.map(name => ({ name }));

  return (
    <Animated.View 
      style={[
        styles.campusContainer,
        {
          opacity: animation,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        }
      ]}
    >
      <View style={styles.modalHeaderWhite}>
        <Text style={[styles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>
          Select Campus
        </Text>
      </View>
      <View style={styles.lineDark}></View>
      <View style={{ backgroundColor: '#f5f5f5' }}>
        <FlatList
          data={displayData}
          keyExtractor={(item, index) => item.name || index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => handleCampusSelect(item)} 
              style={styles.searchItemContainer}
            >
              <Text style={styles.searchItem}>
                {item.name || item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Animated.View>
  );
};

export default CampusSelectorModal;
