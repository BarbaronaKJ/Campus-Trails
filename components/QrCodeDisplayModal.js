import React from 'react';
import { Modal, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');

/**
 * QR Code Display Modal Component
 * Displays a QR code for a building or room
 */
const QrCodeDisplayModal = ({
  visible,
  qrCodeData,
  selectedPin,
  onClose
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 30, alignItems: 'center', maxWidth: width * 0.9 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
            {selectedPin?.description || selectedPin?.title || 'Building'} QR Code
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>
            Scan this code to open this building
          </Text>
          {qrCodeData && (
            <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, marginBottom: 20 }}>
              <QRCode
                value={qrCodeData}
                size={250}
                color="#000000"
                backgroundColor="#FFFFFF"
                logoSize={0}
                logoMargin={0}
                logoBackgroundColor="transparent"
              />
            </View>
          )}
          <View style={{ backgroundColor: '#e3f2fd', padding: 15, borderRadius: 8, marginBottom: 15, width: '100%' }}>
            <Text style={{ fontSize: 13, color: '#1976d2', fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
              📱 How to Scan:
            </Text>
            <Text style={{ fontSize: 12, color: '#424242', textAlign: 'center', lineHeight: 18 }}>
              1. Open the Campus Trails app{'\n'}
              2. Tap the QR scanner button (top left){'\n'}
              3. Point camera at this QR code{'\n'}
              4. The building will open automatically
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: '#999', marginBottom: 20, textAlign: 'center', paddingHorizontal: 20, fontStyle: 'italic' }}>
            Note: Scan with the app's scanner, not your phone's default camera QR scanner.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#28a745',
              padding: 15,
              borderRadius: 8,
              width: 120,
              alignItems: 'center',
            }}
            onPress={onClose}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default QrCodeDisplayModal;
