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
  modalSetters.setLocationPickerVisible(false);
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
 */
export const handleCampusChange = (setCampusVisible) => {
  alert("Other Campuses Coming Soon!");
  setCampusVisible(false);
};
