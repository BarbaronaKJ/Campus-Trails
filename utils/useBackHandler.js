import { useEffect } from 'react';
import { BackHandler, Alert } from 'react-native';

/**
 * Custom hook to handle Android back button behavior
 * Closes modals in priority order, shows exit confirmation when no modals are open
 */
export const useBackHandler = ({
  isBuildingDetailsVisible,
  cameFromPinDetails,
  cameFromPathfindingDetails,
  isModalVisible,
  isFilterModalVisible,
  isSettingsVisible,
  isPinsModalVisible,
  isPinSelectorModalVisible,
  showPathfindingPanel,
  showUpdatePointA,
  showPathfindingDetails,
  isSearchVisible,
  isCampusVisible,
  isAuthModalVisible,
  isUserProfileVisible,
  isFeedbackModalVisible,
  isRoomSelectionModalVisible,
  isQrScannerVisible,
  isQrCodeVisible,
  setBuildingDetailsVisible,
  setModalVisible,
  setCameFromPinDetails,
  setCameFromPathfindingDetails,
  setFilterModalVisible,
  setSettingsVisible,
  setPinsModalVisible,
  setPinSelectorModalVisible,
  setShowPathfindingPanel,
  setShowUpdatePointA,
  setShowPathfindingDetails,
  setPathfindingMode,
  setPath,
  setPointA,
  setPointB,
  setActiveSelector,
  setSearchVisible,
  setCampusVisible,
    setAuthModalVisible,
    setUserProfileVisible,
    setFeedbackModalVisible,
    setRoomSelectionModalVisible,
    setQrScannerVisible,
    setQrCodeVisible,
}) => {
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Check if any modal/component is open and close it
      if (isBuildingDetailsVisible) {
        setBuildingDetailsVisible(false);
        if (cameFromPathfindingDetails) {
          setCameFromPathfindingDetails(false);
          setShowPathfindingDetails(true);
        } else if (cameFromPinDetails) {
          setCameFromPinDetails(false);
          setModalVisible(true);
        }
        return true;
      }
      
      // Update Starting Point Modal - return to Pathfinding Details if opened from there
      if (showUpdatePointA) {
        setShowUpdatePointA(false);
        if (cameFromPathfindingDetails) {
          setShowPathfindingDetails(true);
        }
        return true;
      }
      
      // Pin Detail Modal
      if (isModalVisible) {
        setModalVisible(false);
        return true;
      }
      
      // Filter Modal
      if (isFilterModalVisible) {
        setFilterModalVisible(false);
        return true;
      }
      
      // Settings Modal
      if (isSettingsVisible) {
        setSettingsVisible(false);
        return true;
      }
      
      // Pins Modal
      if (isPinsModalVisible) {
        setPinsModalVisible(false);
        return true;
      }
      
      // Pin Selector Modal
      if (isPinSelectorModalVisible) {
        setPinSelectorModalVisible(false);
        setActiveSelector(null);
        return true;
      }
      
      // Pathfinding Panel
      if (showPathfindingPanel) {
        setShowPathfindingPanel(false);
        setPathfindingMode(false);
        setPath([]);
        setPointA(null);
        setPointB(null);
        return true;
      }
      
      // Search Modal
      if (isSearchVisible) {
        setSearchVisible(false);
        return true;
      }
      
      // Campus Modal
      if (isCampusVisible) {
        setCampusVisible(false);
        return true;
      }
      
      // Auth Modal
      if (isAuthModalVisible) {
        setAuthModalVisible(false);
        return true;
      }
      
      // User Profile Modal
      if (isUserProfileVisible) {
        setUserProfileVisible(false);
        return true;
      }
      
      // Feedback Modal
      if (isFeedbackModalVisible) {
        setFeedbackModalVisible(false);
        return true;
      }
      
      // Room Selection Modal
      if (isRoomSelectionModalVisible) {
        setRoomSelectionModalVisible(false);
        return true;
      }
      
      // QR Scanner Modal
      if (isQrScannerVisible) {
        setQrScannerVisible(false);
        return true;
      }
      
      // QR Code Display Modal
      if (isQrCodeVisible) {
        setQrCodeVisible(false);
        return true;
      }
      
      // No modals open - show exit confirmation
      Alert.alert(
        'Exit App',
        'Are you sure you want to exit Campus Trails?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Exit',
            onPress: () => BackHandler.exitApp(),
            style: 'destructive',
          },
        ],
        { cancelable: false }
      );
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, [
    isBuildingDetailsVisible,
    cameFromPinDetails,
    isModalVisible,
    isFilterModalVisible,
    isSettingsVisible,
    isPinsModalVisible,
    isPinSelectorModalVisible,
    showPathfindingPanel,
    isSearchVisible,
    isCampusVisible,
    isAuthModalVisible,
    isUserProfileVisible,
    isFeedbackModalVisible,
    isRoomSelectionModalVisible,
    isQrScannerVisible,
    isQrCodeVisible,
  ]);
};
