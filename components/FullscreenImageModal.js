import React from 'react';
import { Modal, View, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import ImageZoom from 'react-native-image-pan-zoom';
import { ExpoImage } from '../utils/imageUtils';

const { width, height } = Dimensions.get('window');

/**
 * Fullscreen Image Viewer Modal Component
 * Displays an image in fullscreen with zoom capabilities
 */
const FullscreenImageModal = ({
  visible,
  imageSource,
  onClose
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
        <TouchableOpacity
          style={{ position: 'absolute', top: 50, right: 20, zIndex: 1001, padding: 10 }}
          onPress={onClose}
        >
          <Icon name="times" size={30} color="#fff" />
        </TouchableOpacity>
        {imageSource && (
          <ImageZoom
            cropWidth={width}
            cropHeight={height}
            imageWidth={width}
            imageHeight={height * 0.8}
            minScale={1}
            maxScale={5}
            enableCenterFocus={false}
          >
            {(() => {
              if (typeof imageSource === 'number' || (imageSource && typeof imageSource === 'object' && !imageSource.uri)) {
                // Local asset - use React Native Image
                return <Image source={imageSource} style={{ width: width, height: height * 0.8 }} resizeMode="contain" />;
              } else {
                // Remote URL - use ExpoImage for caching
                return <ExpoImage source={imageSource} style={{ width: width, height: height * 0.8 }} contentFit="contain" cachePolicy="disk" />;
              }
            })()}
          </ImageZoom>
        )}
      </View>
    </Modal>
  );
};

export default FullscreenImageModal;
