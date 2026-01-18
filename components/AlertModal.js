import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';

/**
 * Alert Modal Component
 * Simple alert modal for displaying messages to the user
 */
const AlertModal = ({
  visible,
  message,
  onClose
}) => {
  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.alertModalOverlay}>
        <View style={styles.alertModalContainer}>
          <View style={styles.modalHeaderWhite}>
            <Text style={[styles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>Alert</Text>
          </View>
          <View style={styles.lineDark}></View>
          <View style={{ backgroundColor: '#f5f5f5', padding: 15 }}>
            <Text style={[styles.alertModalMessage, { color: '#333' }]}>{message}</Text>
          </View>
          <View style={{ backgroundColor: '#f5f5f5', paddingHorizontal: 15, paddingBottom: 15 }}>
            <TouchableOpacity 
              style={styles.alertModalButton}
              onPress={onClose}
            >
              <Text style={styles.alertModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AlertModal;
