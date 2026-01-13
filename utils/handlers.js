import { Alert } from 'react-native';

/**
 * Handle pin press - opens pin detail modal
 * @param {Object} pin - The pin object
 * @param {Function} setSelectedPin - Set selected pin state
 * @param {Function} setClickedPin - Set clicked pin state
 * @param {Function} setHighlightedPinOnMap - Set highlighted pin state
 * @param {Object} modalSetters - Object containing all modal setter functions
 */
export const handlePinPress = (pin, setSelectedPin, setClickedPin, setHighlightedPinOnMap, modalSetters) => {
  setSelectedPin(pin);
  setClickedPin(pin.id);
  // Clear highlighted pin when selecting a new one
  setHighlightedPinOnMap(null);
  // Close other modals when opening pin details
  modalSetters.setSearchVisible(false);
  modalSetters.setCampusVisible(false);
  modalSetters.setFilterModalVisible(false);
  modalSetters.setShowPathfindingPanel(false);
  modalSetters.setSettingsVisible(false);
  modalSetters.setPinsModalVisible(false);
  modalSetters.setModalVisible(true);
};

/**
 * Save a pin to saved pins list
 * @param {Object} selectedPin - The pin to save
 * @param {Array} savedPins - Current saved pins array
 * @param {Function} setSavedPins - Set saved pins state
 */
export const savePin = (selectedPin, savedPins, setSavedPins) => {
  if (selectedPin && !savedPins.includes(selectedPin)) {
    setSavedPins([...savedPins, selectedPin]);
    alert(`${selectedPin.description} saved!`);
  }
};

/**
 * Handle campus change
 * @param {Function} setCampusVisible - Set campus modal visibility
 * @param {Object|string} campus - The selected campus object or name
 * @param {Function} setCurrentCampus - Set current campus state
 * @param {Array} campusesData - Array of all campus objects
 */
export const handleCampusChange = (setCampusVisible, campus, setCurrentCampus, campusesData) => {
  // USTP-CDO default map URL
  const USTP_CDO_MAP_URL = 'https://res.cloudinary.com/dun83uvdm/image/upload/v1768333826/ustp-cdo-map_wdhsz4.png';
  
  // If campus is a string (name), find the campus object
  let campusObj = typeof campus === 'string' 
    ? campusesData.find(c => c.name === campus)
    : campus;
  
  if (!campusObj) {
    alert("Campus not found!");
    setCampusVisible(false);
    return;
  }
  
  // Special case: USTP-CDO always has a default map image
  if (campusObj.name === 'USTP-CDO' && !campusObj.mapImageUrl) {
    campusObj = {
      ...campusObj,
      mapImageUrl: USTP_CDO_MAP_URL
    };
  }
  
  // Check if campus has map image (except USTP-CDO which we just handled)
  if (!campusObj.mapImageUrl) {
    Alert.alert(
      'Map Image Not Available',
      `The map image for ${campusObj.name} is not available. Please contact the administrator to add a map image for this campus.`,
      [{ text: 'OK' }]
    );
    setCampusVisible(false);
    return;
  }
  
  // Set the current campus
  setCurrentCampus(campusObj);
  setCampusVisible(false);
};
