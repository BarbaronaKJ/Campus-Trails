/**
 * Get the category for a pin based on its database category field
 * Falls back to legacy pin ID mapping if category is not set
 * @param {Object} pin - The pin object
 * @returns {string} The category name
 */
export const getPinCategory = (pin) => {
  // If pin has a category field from database, use it
  if (pin.category && pin.category !== 'Other') {
    // Map database categories to display categories
    const categoryMap = {
      'Commercial Zone': 'Commercial Zone',
      'Admin/Operation Zone': 'Admin/Operation Zone',
      'Academic Core Zone': 'Academic Core Zone',
      'Auxillary Services Zone': 'Auxillary Services Zone',
      'Dining': 'Dining',
      'Comfort Rooms': 'Comfort Rooms',
      'Research Zones': 'Research Zones',
      'Clinic': 'Clinic',
      'Parking': 'Parking',
      'Security': 'Security',
      'Other': 'Other'
    };
    
    // Return mapped category or use as-is if not in map
    return categoryMap[pin.category] || pin.category;
  }
  
  // Fallback to legacy pin ID mapping for backward compatibility
  // This will be used for pins that don't have category set in database
  const { categoryPinIds } = require('./categoryFilter');
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
  
  // Sort categories in specific order (matching Filter modal structure)
  const categoryOrder = [
    'Main Entrance',
    'Buildings',
    'Commercial Zone',
    'Admin/Operation Zone',
    'Academic Core Zone',
    'Auxillary Services Zone',
    'Dining',
    'Comfort Rooms',
    'Research Zones',
    'Clinic',
    'Parking',
    'Security',
    'Amenities',
    'Other'
  ];
  
  // Sort pins within each category
  // Order: 1. ME (Main Entrance, id === 0), 2. Numeric titles, 3. Text titles
  Object.keys(categories).forEach(cat => {
    categories[cat].sort((a, b) => {
      // Helper function to determine sort priority
      const getSortPriority = (pin) => {
        // 1. ME (Main Entrance) always comes first
        if (pin.id === 0 || pin.title === 'ME' || (pin.description && pin.description.toLowerCase().includes('main entrance'))) {
          return { priority: 0, value: 0 };
        }
        
        // 2. Check if title is numeric
        const title = pin.title || '';
        const titleNum = typeof title === 'number' ? title : parseInt(title);
        const isNumeric = !isNaN(titleNum) && String(titleNum) === String(title).trim();
        
        if (isNumeric) {
          // Numeric titles come second, sorted by number
          return { priority: 1, value: titleNum };
        }
        
        // 3. Text titles come last, sorted alphabetically
        return { priority: 2, value: title };
      };
      
      const aSort = getSortPriority(a);
      const bSort = getSortPriority(b);
      
      // First compare by priority (ME < Numeric < Text)
      if (aSort.priority !== bSort.priority) {
        return aSort.priority - bSort.priority;
      }
      
      // If same priority, sort by value
      if (aSort.priority === 1) {
        // Both numeric - sort by number
        return aSort.value - bSort.value;
      } else if (aSort.priority === 2) {
        // Both text - sort alphabetically
        return String(aSort.value).localeCompare(String(bSort.value));
      }
      
      // Both are ME (shouldn't happen, but just in case)
      return 0;
    });
  });
  
  // Return ordered categories
  return categoryOrder
    .filter(cat => categories[cat] && categories[cat].length > 0)
    .map(cat => ({ title: cat, pins: categories[cat] }));
};
