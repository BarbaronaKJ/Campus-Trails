import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Animated, StyleSheet, Image, ImageBackground } from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { ExpoImage, getOptimizedImage } from '../utils/imageUtils';
import { getCategorizedPins } from '../utils/pinCategories';
import { styles } from '../styles';

/**
 * Filter Modal Component
 * Large modal for filtering pins by category
 */
const FilterModal = ({
  rendered,
  filterModalSlideAnim,
  selectedCategories,
  setSelectedCategories,
  selectAllCategories,
  clearAllCategories,
  pins,
  currentCampus,
  handlePinPress,
  setFilterModalVisible,
  styles: customStyles
}) => {
  const filterStyles = customStyles || styles;
  
  // Get categorized pins
  const categorizedPins = getCategorizedPins(pins, selectedCategories, currentCampus);
  
  // Toggle category selection
  const toggleCategory = (categoryName) => {
    setSelectedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  return (
    <>
    <Modal
      visible={rendered}
      transparent={true}
      animationType="none"
      onRequestClose={() => setFilterModalVisible(false)}
    >
      {rendered && (
        <Animated.View 
          style={[
            StyleSheet.absoluteFill,
            filterStyles.settingsScreen,
            {
              transform: [{ translateY: filterModalSlideAnim }],
            }
          ]}
        >
          <View style={filterStyles.modalHeaderWhite}>
            <Text style={[filterStyles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>Filter Pins</Text>
          </View>
          <View style={filterStyles.lineDark}></View>
    
          {/* Selection Controls */}
          <View style={filterStyles.filterTopControls}>
            <TouchableOpacity onPress={selectAllCategories} style={filterStyles.filterSelectAllButton}>
              <Text style={filterStyles.filterSelectAllButtonText}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearAllCategories} style={filterStyles.filterClearAllButton}>
              <Text style={filterStyles.filterClearAllButtonText}>Clear All</Text>
            </TouchableOpacity>
          </View>
    
          {/* Category Groups */}
          <ScrollView style={{ width: '100%', backgroundColor: '#f5f5f5', paddingHorizontal: 16 }}>
            {[
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
            ].map(group => (
              <View key={group.title} style={filterStyles.categoryGroup}>
                <View style={filterStyles.categoryHeaderContainer}>
                  <Text style={filterStyles.categoryHeaderText}>{group.title}</Text>
                  <View style={filterStyles.categoryHeaderUnderline}></View>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  {group.items.map(item => {
                    // Map display names to database category names
                    const categoryMap = {
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
                    const dbCategory = categoryMap[item.name] || item.name;
                    return (
                      <TouchableOpacity 
                        key={item.name} 
                        style={[
                          filterStyles.filterCategoryButton,
                          { width: '48%' }, // 2 columns with small gap
                          selectedCategories[item.name] && filterStyles.filterCategoryButtonSelected
                        ]} 
                        onPress={() => toggleCategory(item.name)}
                      >
                        <ImageBackground 
                          source={getOptimizedImage(require('../assets/USTP.jpg'))} 
                          style={filterStyles.filterCategoryButtonImage}
                          resizeMode="cover"
                          imageStyle={filterStyles.filterCategoryButtonImageStyle}
                        >
                          <View style={filterStyles.filterCategoryButtonContent}>
                            <Text style={filterStyles.filterCategoryButtonText}>{item.name}</Text>
                            {selectedCategories[item.name] && (
                              <Icon name="check" size={16} color="#4CAF50" style={{ marginLeft: 'auto' }} />
                            )}
                          </View>
                        </ImageBackground>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
    
          <View style={{ backgroundColor: '#f5f5f5', paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 }}>
            <TouchableOpacity style={[filterStyles.closeButton, { alignSelf: 'stretch', marginTop: 8 }]} onPress={() => setFilterModalVisible(false)}>
              <Text style={filterStyles.closeText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </Modal>
    </>
  );
};

export default FilterModal;
