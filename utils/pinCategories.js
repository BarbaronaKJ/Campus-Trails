import { categoryPinIds } from './categoryFilter';

/**
 * Get the category for a pin based on its ID
 * @param {Object} pin - The pin object
 * @returns {string} The category name
 */
export const getPinCategory = (pin) => {
  const pinIdStr = String(pin.id);
  
  // Main Entrance is always first
  if (pin.id === 0) return 'Main Entrance';
  
  // Buildings 1-52 (numeric IDs only, exclude string IDs like "SL1", "MC")
  const pinIdNum = typeof pin.id === 'number' ? pin.id : parseInt(pin.id);
  if (!isNaN(pinIdNum) && pinIdNum >= 1 && pinIdNum <= 52) {
    return 'Buildings';
  }
  
  // MC goes to Amenities
  if (pin.id === 'MC') return 'Amenities';
  
  // Check if pin is in Academic Core Zone or Dining - those go to Amenities
  const academicCoreIds = categoryPinIds['Academic Core Zone'] || [];
  const diningIds = categoryPinIds['Dining'] || [];
  const amenityIds = [...academicCoreIds, ...diningIds];
  for (const id of amenityIds) {
    if (String(id) === pinIdStr) {
      return 'Amenities';
    }
  }
  
  // Check other categories (for non-building pins)
  // Skip Academic Core Zone and Dining as they're already handled above
  const skipCategories = ['Academic Core Zone', 'Dining'];
  for (const [category, pinIds] of Object.entries(categoryPinIds)) {
    if (skipCategories.includes(category)) {
      continue;
    }
    for (const id of pinIds) {
      if (String(id) === pinIdStr) {
        return category;
      }
    }
  }
  
  // Default category for uncategorized pins - add to Amenities
  return 'Amenities';
};

/**
 * Organize pins by category for View All Pins modal
 * @param {Array} pins - Array of all pins
 * @returns {Array} Array of category objects with title and pins
 */
export const getCategorizedPins = (pins) => {
  const visiblePins = pins.filter(pin => !pin.isInvisible);
  const categories = {};
  
  visiblePins.forEach(pin => {
    const category = getPinCategory(pin);
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(pin);
  });
  
  // Sort categories in specific order
  const categoryOrder = [
    'Main Entrance',
    'Buildings',
    'Commercial Zone',
    'Admin / Operation Zone',
    'Auxiliary Services Zone',
    'Comfort Rooms (CR)',
    'Research',
    'Clinic',
    'Parking',
    'Security',
    'Amenities'
  ];
  
  // Sort pins within each category
  Object.keys(categories).forEach(cat => {
    if (cat === 'Buildings') {
      // Sort buildings by ID (numeric)
      categories[cat].sort((a, b) => {
        const aNum = typeof a.id === 'number' ? a.id : parseInt(a.id);
        const bNum = typeof b.id === 'number' ? b.id : parseInt(b.id);
        return aNum - bNum;
      });
    } else if (cat === 'Amenities') {
      // Sort Amenities in specific order: DC (1037), MC, SL1, SL2, BF, OF
      const amenityOrder = [1037, 'MC', 'SL1', 'SL2', 'BF', 'OF'];
      categories[cat].sort((a, b) => {
        const getIndex = (pin) => {
          if (pin.id === 1037) return 0; // DC
          const idStr = String(pin.id);
          const index = amenityOrder.findIndex(id => String(id) === idStr);
          return index !== -1 ? index : 999; // Put unordered items at the end
        };
        return getIndex(a) - getIndex(b);
      });
    } else {
      // Sort other categories alphabetically by description
      categories[cat].sort((a, b) => (a.description || '').localeCompare(b.description || ''));
    }
  });
  
  // Return ordered categories
  return categoryOrder
    .filter(cat => categories[cat] && categories[cat].length > 0)
    .map(cat => ({ title: cat, pins: categories[cat] }));
};
