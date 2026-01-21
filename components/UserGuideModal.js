import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { styles } from '../styles';

const { width, height } = Dimensions.get('window');

/**
 * User Guide Modal Component
 * Displays an onboarding guide for first-time users
 */
const UserGuideModal = ({
  visible,
  onClose,
  onDontShowAgain
}) => {
  const guideStyles = styles || {};

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <TouchableOpacity 
        style={localStyles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={localStyles.container}>
          {/* Header */}
          <View style={localStyles.header}>
            <View style={localStyles.headerIconContainer}>
              <Icon name="graduation-cap" size={32} color="#28a745" />
            </View>
            <Text style={localStyles.title}>Welcome to Campus Trails!</Text>
            <Text style={localStyles.subtitle}>Your guide to navigating the campus</Text>
          </View>

          {/* Content */}
          <ScrollView 
            style={localStyles.content}
            contentContainerStyle={localStyles.contentContainer}
            showsVerticalScrollIndicator={true}
          >
            {/* Quick Start Section */}
            <View style={localStyles.section}>
              <View style={localStyles.sectionHeader}>
                <Icon name="rocket" size={20} color="#28a745" style={{ marginRight: 8 }} />
                <Text style={localStyles.sectionTitle}>Quick Start</Text>
              </View>
              <View style={localStyles.featureItem}>
                <Icon name="map-marker" size={16} color="#6c757d" style={{ marginRight: 10, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={localStyles.featureTitle}>Explore the Map</Text>
                  <Text style={localStyles.featureDescription}>
                    Tap on green facility pins to view building details and navigate to specific rooms.
                  </Text>
                </View>
              </View>
              <View style={localStyles.featureItem}>
                <Icon name="search" size={16} color="#6c757d" style={{ marginRight: 10, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={localStyles.featureTitle}>Search Facilities</Text>
                  <Text style={localStyles.featureDescription}>
                    Use the search button (top right) to quickly find buildings, rooms, or facilities by name or number.
                  </Text>
                </View>
              </View>
              <View style={localStyles.featureItem}>
                <Icon name="location-arrow" size={16} color="#6c757d" style={{ marginRight: 10, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={localStyles.featureTitle}>Pathfinding</Text>
                  <Text style={localStyles.featureDescription}>
                    Tap the pathfinding button to find the shortest route between any two points on campus.
                  </Text>
                </View>
              </View>
            </View>

            {/* Key Features Section */}
            <View style={localStyles.section}>
              <View style={localStyles.sectionHeader}>
                <Icon name="star" size={20} color="#28a745" style={{ marginRight: 8 }} />
                <Text style={localStyles.sectionTitle}>Key Features</Text>
              </View>
              <View style={localStyles.featureItem}>
                <Icon name="filter" size={16} color="#6c757d" style={{ marginRight: 10, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={localStyles.featureTitle}>Filter Pins</Text>
                  <Text style={localStyles.featureDescription}>
                    Filter facilities by category (buildings, offices, labs, etc.) to focus on what you need.
                  </Text>
                </View>
              </View>
              <View style={localStyles.featureItem}>
                <Icon name="qrcode" size={16} color="#6c757d" style={{ marginRight: 10, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={localStyles.featureTitle}>QR Code Scanner</Text>
                  <Text style={localStyles.featureDescription}>
                    Scan QR codes on campus to instantly navigate to that location.
                  </Text>
                </View>
              </View>
              <View style={localStyles.featureItem}>
                <Icon name="heart" size={16} color="#6c757d" style={{ marginRight: 10, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={localStyles.featureTitle}>Save Favorites</Text>
                  <Text style={localStyles.featureDescription}>
                    Save frequently visited facilities and rooms for quick access from your profile.
                  </Text>
                </View>
              </View>
              <View style={localStyles.featureItem}>
                <Icon name="building" size={16} color="#6c757d" style={{ marginRight: 10, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={localStyles.featureTitle}>Building Details</Text>
                  <Text style={localStyles.featureDescription}>
                    View floor plans, browse rooms, and get detailed information about each building.
                  </Text>
                </View>
              </View>
            </View>

            {/* Tips Section */}
            <View style={localStyles.section}>
              <View style={localStyles.sectionHeader}>
                <Icon name="lightbulb-o" size={20} color="#28a745" style={{ marginRight: 8 }} />
                <Text style={localStyles.sectionTitle}>Pro Tips</Text>
              </View>
              <View style={localStyles.tipItem}>
                <Text style={localStyles.tipText}>
                  • Search for room numbers (e.g., "9-102") to jump directly to that floor
                </Text>
              </View>
              <View style={localStyles.tipItem}>
                <Text style={localStyles.tipText}>
                  • Use pathfinding to discover the shortest route between locations
                </Text>
              </View>
              <View style={localStyles.tipItem}>
                <Text style={localStyles.tipText}>
                  • Save your favorite facilities for quick access
                </Text>
              </View>
              <View style={localStyles.tipItem}>
                <Text style={localStyles.tipText}>
                  • Report issues to help improve campus facilities
                </Text>
              </View>
              <View style={localStyles.tipItem}>
                <Text style={localStyles.tipText}>
                  • Check Settings → Help for detailed instructions
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={localStyles.footer}>
            <TouchableOpacity
              style={[localStyles.button, localStyles.secondaryButton]}
              onPress={onDontShowAgain}
            >
              <Text style={localStyles.secondaryButtonText}>Don't Show Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[localStyles.button, localStyles.primaryButton]}
              onPress={onClose}
            >
              <Text style={localStyles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const localStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: height * 0.85,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    backgroundColor: '#f8f9fa',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingLeft: 4,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#6c757d',
    lineHeight: 18,
  },
  tipItem: {
    marginBottom: 10,
    paddingLeft: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#6c757d',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
    backgroundColor: '#f8f9fa',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#28a745',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  secondaryButton: {
    backgroundColor: '#e9ecef',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#6c757d',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default UserGuideModal;
