import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, Animated, StyleSheet } from 'react-native';
import { styles } from '../styles';

/**
 * Campus Selector Modal Component
 * Modal for selecting a campus
 */
const CampusSelectorModal = ({
  visible,
  rendered,
  campuses,
  campusesData,
  onSelectCampus,
  slideAnim,
  styles: customStyles
}) => {
  return (
    <>
      {rendered && (
        <Animated.View 
          style={[
            customStyles?.campusContainer || styles.campusContainer,
            {
              opacity: slideAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            }
          ]}
        >
          <View style={styles.modalHeaderWhite}>
            <Text style={[styles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>Select Campus</Text>
          </View>
          <View style={styles.lineDark}></View>
          <View style={{ backgroundColor: '#f5f5f5' }}>
            <FlatList
              data={campusesData.length > 0 ? campusesData : campuses.map(name => ({ name }))}
              keyExtractor={(item, index) => item.name || index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => onSelectCampus(item)} style={styles.searchItemContainer}>
                  <Text style={styles.searchItem}>{item.name || item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Animated.View>
      )}
    </>
  );
};

export default CampusSelectorModal;
