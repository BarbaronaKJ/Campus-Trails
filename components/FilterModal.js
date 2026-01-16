/**
 * FilterModal Component
 * 
 * Modal for filtering pins by category.
 * Allows users to:
 * - Select/deselect categories to show/hide pins on map
 * - Use "Select All" to show all categories
 * - Use "Clear All" to hide all categories
 * - View category groups organized by type (Buildings, Essentials, Research, Safety)
 */

import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Animated, StyleSheet } from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { styles } from '../styles';
import { allCategoryKeys } from '../utils/categoryFilter';

/**
 * Category groups for display
 * Organized by type for better UX
 */
const CATEGORY_GROUPS = [
  { 
    title: 'Building Legends', 
    items: [
      { name: 'Commercial Zone', color: '#FF0000' },
      { name: 'Admin / Operation Zone', color: '#800080' },
      { name: 'Academic Core Zone', color: '#0000FF' },
      { name: 'Auxiliary Services Zone', color: '#808080' }
    ]
  },
  { 
    title: 'Essentials & Utilities', 
    items: [
      { name: 'Dining', color: '#FFA500' },
      { name: 'Comfort Rooms (CR)', color: '#ADD8E6' }
    ]
  },
  { 
    title: 'Research', 
    items: [
      { name: 'Research Zones', color: '#9C27B0' }
    ]
  },
  { 
    title: 'Safety & Access', 
    items: [
      { name: 'Clinic', color: '#FF0000' },
      { name: 'Parking', color: '#D3D3D3' },
      { name: 'Security', color: '#0000FF' }
    ]
  }
];

/**
 * Maps display category names to database category names
 * Some categories have slightly different names in the database
 */
const CATEGORY_MAP = {
  'Commercial Zone': 'Commercial Zone',
  'Admin / Operation Zone': 'Admin/Operation Zone',
  'Academic Core Zone': 'Academic Core Zone',
  'Auxiliary Services Zone': 'Auxillary Services Zone',
  'Dining': 'Dining',
  'Comfort Rooms (CR)': 'Comfort Rooms',
  'Research Zones': 'Research Zones',
  'Clinic': 'Clinic',
  'Parking': 'Parking',
  'Security': 'Security'
};

/**
 * FilterModal component
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Whether modal is visible
 * @param {Object} props.selectedCategories - Object with category names as keys and boolean values
 * @param {Function} props.onCategoryToggle - Callback when category is toggled (receives category name)
 * @param {Function} props.onSelectAll - Callback when "Select All" is pressed
 * @param {Function} props.onClearAll - Callback when "Clear All" is pressed
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Animated.Value} props.slideAnim - Animated value for slide animation
 */
const FilterModal = ({
  visible = false,
  selectedCategories = {},
  onCategoryToggle,
  onSelectAll,
  onClearAll,
  onClose,
  slideAnim
}) => {
  /**
   * Handles category toggle
   * Calls parent handler with category name
   */
  const handleCategoryToggle = (categoryName) => {
    if (onCategoryToggle) {
      onCategoryToggle(categoryName);
    }
  };

  /**
   * Handles "Select All" press
   * Selects all available categories
   */
  const handleSelectAll = () => {
    if (onSelectAll) {
      onSelectAll();
    }
  };

  /**
   * Handles "Clear All" press
   * Deselects all categories
   */
  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          StyleSheet.absoluteFill,
          styles.settingsScreen,
          {
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        {/* Header */}
        <View style={styles.modalHeaderWhite}>
          <Text style={[styles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>
            Filter Pins
          </Text>
        </View>
        <View style={styles.lineDark}></View>
        
        {/* Selection Controls */}
        <View style={styles.filterTopControls}>
          <TouchableOpacity 
            onPress={handleSelectAll} 
            style={styles.filterSelectAllButton}
          >
            <Text style={styles.filterSelectAllButtonText}>Select All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleClearAll} 
            style={styles.filterClearAllButton}
          >
            <Text style={styles.filterClearAllButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Category Groups */}
        <ScrollView style={{ width: '100%', backgroundColor: '#f5f5f5', paddingHorizontal: 16 }}>
          {CATEGORY_GROUPS.map(group => (
            <View key={group.title} style={styles.categoryGroup}>
              {/* Category Group Header */}
              <View style={styles.categoryHeaderContainer}>
                <Text style={styles.categoryHeaderText}>{group.title}</Text>
                <View style={styles.categoryHeaderUnderline}></View>
              </View>

              {/* Category Items (2 columns) */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {group.items.map(item => {
                  // Get database category name (may differ from display name)
                  const dbCategory = CATEGORY_MAP[item.name] || item.name;
                  const isSelected = selectedCategories[item.name] || false;

                  return (
                    <TouchableOpacity 
                      key={item.name} 
                      style={[
                        styles.filterCategoryButton,
                        { width: '48%' }, // 2 columns with small gap
                        isSelected && styles.filterCategoryButtonSelected
                      ]} 
                      onPress={() => handleCategoryToggle(item.name)}
                    >
                      {/* Category Color Indicator */}
                      <View 
                        style={[
                          {
                            width: 16,
                            height: 16,
                            borderRadius: 8,
                            backgroundColor: item.color,
                            marginRight: 8,
                          },
                          isSelected && {
                            borderWidth: 2,
                            borderColor: '#fff',
                          }
                        ]}
                      />
                      <Text 
                        style={[
                          styles.filterCategoryButtonText,
                          isSelected && styles.filterCategoryButtonTextSelected
                        ]}
                        numberOfLines={2}
                      >
                        {item.name}
                      </Text>
                      {isSelected && (
                        <Icon 
                          name="check" 
                          size={14} 
                          color="#fff" 
                          style={{ marginLeft: 'auto' }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

export default FilterModal;
