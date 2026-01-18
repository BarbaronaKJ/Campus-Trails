import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions, Alert } from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';

// Conditionally import BarCodeScanner (only available in development builds)
let BarCodeScanner = null;
try {
  BarCodeScanner = require('expo-barcode-scanner').BarCodeScanner;
} catch (error) {
  console.log('BarCodeScanner native module not available (requires development build)');
}

const { width } = Dimensions.get('window');

/**
 * QR Scanner Modal Component
 * Full-screen QR code scanner modal
 */
const QrScannerModal = ({
  visible,
  scanned,
  onClose,
  onScan
}) => {
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    (async () => {
      if (!BarCodeScanner) {
        setHasPermission(false);
        return;
      }
      
      try {
        const { status } = await BarCodeScanner.requestPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch (error) {
        console.warn('BarCodeScanner not available (requires development build):', error);
        setHasPermission(false);
      }
    })();
  }, [visible]);

  const handleRequestPermission = async () => {
    if (!BarCodeScanner) {
      Alert.alert(
        'QR Scanner Not Available',
        'QR code scanning requires a development build. Please build the app using:\n\nnpx expo prebuild\nnpx expo run:android'
      );
      onClose();
      return;
    }
    
    try {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      Alert.alert(
        'QR Scanner Not Available',
        'QR code scanning requires a development build. Please build the app using:\n\nnpx expo prebuild\nnpx expo run:android\n\nOr use deep links instead: campustrails://pin/123'
      );
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        onClose();
      }}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' }}>
        {/* Header */}
        <View style={{ 
          paddingTop: Platform.OS === 'ios' ? 50 : 20, 
          paddingBottom: 15, 
          paddingHorizontal: 20, 
          backgroundColor: 'rgba(0,0,0,0.8)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center' }}>
            QR Code Scanner
          </Text>
          <TouchableOpacity
            onPress={() => {
              onClose();
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon name="times" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {hasPermission === null ? (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <Icon name="camera" size={64} color="#28a745" style={{ marginBottom: 20 }} />
              <Text style={{ color: 'white', fontSize: 18, marginBottom: 10 }}>Requesting camera permission...</Text>
            </View>
          ) : hasPermission === false ? (
            <View style={{ alignItems: 'center', padding: 20, maxWidth: width * 0.9 }}>
              <Icon name="camera" size={64} color="#ff6b6b" style={{ marginBottom: 20 }} />
              <Text style={{ color: 'white', fontSize: 18, marginBottom: 10, textAlign: 'center', fontWeight: 'bold' }}>
                Camera Permission Required
              </Text>
              <Text style={{ color: '#ccc', fontSize: 14, marginBottom: 20, textAlign: 'center' }}>
                Camera permission is required to scan QR codes
              </Text>
              <TouchableOpacity
                style={{ 
                  backgroundColor: '#28a745', 
                  paddingVertical: 15, 
                  paddingHorizontal: 30, 
                  borderRadius: 8,
                  elevation: 3,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                }}
                onPress={handleRequestPermission}
              >
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {BarCodeScanner ? (
                <>
                  <BarCodeScanner
                    onBarCodeScanned={scanned ? undefined : ({ data }) => {
                      onScan(data);
                    }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  {/* Scanning Frame Overlay */}
                  <View style={{ 
                    position: 'absolute', 
                    top: '25%', 
                    left: '15%', 
                    right: '15%', 
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <View style={{ 
                      width: width * 0.7, 
                      height: width * 0.7, 
                      borderWidth: 3, 
                      borderColor: '#28a745',
                      borderRadius: 20,
                      backgroundColor: 'transparent',
                      shadowColor: '#28a745',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.5,
                      shadowRadius: 10,
                      elevation: 10,
                    }} />
                    {/* Corner indicators */}
                    <View style={{ position: 'absolute', top: -3, left: -3, width: 30, height: 30, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#28a745' }} />
                    <View style={{ position: 'absolute', top: -3, right: -3, width: 30, height: 30, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#28a745' }} />
                    <View style={{ position: 'absolute', bottom: -3, left: -3, width: 30, height: 30, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#28a745' }} />
                    <View style={{ position: 'absolute', bottom: -3, right: -3, width: 30, height: 30, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#28a745' }} />
                  </View>
                  
                  {/* Guide Section */}
                  <View style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    padding: 20,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20
                  }}>
                    <View style={{ backgroundColor: '#e3f2fd', padding: 15, borderRadius: 8, marginBottom: 15 }}>
                      <Text style={{ fontSize: 14, color: '#1976d2', fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
                        📱 How to Scan:
                      </Text>
                      <Text style={{ fontSize: 12, color: '#424242', textAlign: 'center', lineHeight: 18 }}>
                        1. Point your camera at the QR code{'\n'}
                        2. Align the QR code within the green frame{'\n'}
                        3. Hold steady until the code is scanned{'\n'}
                        4. The building will open automatically
                      </Text>
                    </View>
                    {scanned && (
                      <TouchableOpacity
                        style={{ 
                          backgroundColor: '#28a745', 
                          paddingVertical: 15, 
                          paddingHorizontal: 30, 
                          borderRadius: 8,
                          alignItems: 'center',
                          elevation: 3,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.25,
                          shadowRadius: 3.84,
                        }}
                        onPress={() => {
                          // This will be handled by parent - scanned state should be reset via onRescan callback if provided
                        }}
                      >
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Tap to Scan Again</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              ) : (
                <View style={{ alignItems: 'center', padding: 20, maxWidth: width * 0.9 }}>
                  <Icon name="qrcode" size={64} color="#ff6b6b" style={{ marginBottom: 20 }} />
                  <Text style={{ color: 'white', fontSize: 18, marginBottom: 10, textAlign: 'center', fontWeight: 'bold' }}>
                    QR Scanner Not Available
                  </Text>
                  <Text style={{ color: '#ccc', fontSize: 14, textAlign: 'center', marginBottom: 20, paddingHorizontal: 20, lineHeight: 20 }}>
                    QR code scanning requires a development build.{'\n\n'}To enable:{'\n'}1. Run: npx expo prebuild{'\n'}2. Then: npx expo run:android
                  </Text>
                  <View style={{ backgroundColor: '#e3f2fd', padding: 15, borderRadius: 8, marginBottom: 20, width: '100%' }}>
                    <Text style={{ fontSize: 12, color: '#424242', textAlign: 'center', lineHeight: 18 }}>
                      💡 Alternative: You can view QR codes for buildings in the Building Details modal and scan them with another device.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={{ 
                      backgroundColor: '#28a745', 
                      paddingVertical: 15, 
                      paddingHorizontal: 30, 
                      borderRadius: 8,
                      elevation: 3,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3.84,
                    }}
                    onPress={onClose}
                  >
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Close</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default QrScannerModal;
