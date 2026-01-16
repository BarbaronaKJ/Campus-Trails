/**
 * SearchModal Component
 * 
 * Search interface for finding buildings, rooms, and facilities.
 * Provides real-time search results as user types.
 * Supports both building and room searches.
 */

import React from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Animated } from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { styles } from '../styles';
import { getFloorName } from '../utils/floorUtils';

/**
 * SearchModal component
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Whether modal is visible
 * @param {string} props.searchQuery - Current search query
 * @param {Array} props.searchResults - Array of search results
 * @param {Array} props.savedPins - Array of saved pins (for heart icon display)
 * @param {Function} props.onSearchQueryChange - Callback when search query changes
 * @param {Function} props.onResultPress - Callback when search result is pressed
 * @param {Animated.Value} props.animation - Animated value for slide animation
 */
const SearchModal = ({
  visible = false,
  searchQuery = '',
  searchResults = [],
  savedPins = [],
  onSearchQueryChange,
  onResultPress,
  animation
}) => {
  if (!visible) return null;

  /**
   * Checks if a pin is saved (for displaying heart icon)
   */
  const isPinSaved = (item) => {
    if (item.type === 'room') {
      return savedPins.some(p => 
        p.id === (item.name || item.id) || p.title === item.name
      );
    } else {
      return savedPins.some(p => p.id === item.id);
    }
  };

  /**
   * Formats search result display text
   */
  const getResultText = (item) => {
    if (item.type === 'room') {
      return `${item.name}${item.description ? ` - ${item.description}` : ''}`;
    } else {
      return item.description || item.title || item.name;
    }
  };

  return (
    <Animated.View 
      style={[
        styles.searchContainer,
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
      {/* Header */}
      <View style={styles.modalHeaderWhite}>
        <Text style={[styles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>
          Search
        </Text>
      </View>
      <View style={styles.lineDark}></View>

      {/* Search Input */}
      <View style={{ backgroundColor: '#f5f5f5', padding: 10 }}>
        <TextInput
          placeholder="Search for..."
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={onSearchQueryChange}
          placeholderTextColor="#999"
          autoFocus={true}
        />

        {/* Search Results */}
        <FlatList
          data={searchResults}
          keyExtractor={(item, index) => 
            item.type === 'room' ? `room-${item.id}-${index}` : item.id.toString()
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => onResultPress && onResultPress(item)} 
              style={styles.searchItemContainer}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  {/* Heart icon for saved pins */}
                  {isPinSaved(item) && (
                    <Icon 
                      name="heart" 
                      size={16} 
                      color="#dc3545" 
                      style={{ marginRight: 8 }}
                    />
                  )}
                  <Text style={styles.searchItem} numberOfLines={1}>
                    <Text style={styles.searchDescription}>
                      {getResultText(item)}
                    </Text>
                  </Text>
                </View>
                {/* Room details (building and floor) */}
                {item.type === 'room' && (
                  <View style={{ marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: '#6c757d' }}>
                      {item.buildingPin ? `${item.buildingPin.description || item.buildingPin.title}` : ''}
                      {item.floorLevel !== undefined ? ` • ${getFloorName(item.floorLevel)}` : (item.floor ? ` • ${item.floor}` : '')}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            searchQuery.trim() ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Icon name="search" size={48} color="#ccc" />
                <Text style={{ color: '#999', marginTop: 10, fontSize: 14 }}>
                  No results found
                </Text>
              </View>
            ) : null
          }
        />
      </View>
    </Animated.View>
  );
};

export default SearchModal;
