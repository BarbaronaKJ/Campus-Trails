/**
 * Get all categories for a pin based on its database category field
 * Returns an array of category names (pins can have multiple categories)
 * Falls back to legacy pin ID mapping if category is not set
 * @param {Object} pin - The pin object
 * @returns {Array<string>} Array of category names
 */
export const getPinCategories = (pin) => {
  const categories = [];
  
  // Handle array-based categories (new format from admin panel)
  if (Array.isArray(pin.category) && pin.category.length > 0) {
    const categoryMap = {
      'Commercial Zone': 'Commercial Zone',
      'Admin/Operation Zone': 'Admin/Operation Zone',
      'Academic Core Zone': 'Academic Core Zone',
      'Auxillary Services Zone': 'Auxillary Services Zone',
      'Buildings': 'Buildings',
      'Amenities': 'Amenities',
      'Dining': 'Dining',
      'Comfort Rooms (CR)': 'Comfort Rooms',
      'Comfort Rooms': 'Comfort Rooms',
      'Research zones': 'Research Zones',
      'Research Zones': 'Research Zones',
      'Clinic': 'Clinic',
      'Parking': 'Parking',
      'Security': 'Security',
      'Other': 'Other'
    };
    
    // Map each category in the array
    pin.category.forEach(cat => {
      if (cat && cat !== 'Other') {
        const mappedCategory = categoryMap[cat] || cat;
        if (!categories.includes(mappedCategory)) {
          categories.push(mappedCategory);
        }
      }
    });
    
    // If we found valid categories, return them
    if (categories.length > 0) {
      return categories;
    }
  }
  
  // Handle string-based category (legacy format or single category)
  if (typeof pin.category === 'string' && pin.category !== 'Other') {
    const categoryMap = {
      'Commercial Zone': 'Commercial Zone',
      'Admin/Operation Zone': 'Admin/Operation Zone',
      'Academic Core Zone': 'Academic Core Zone',
      'Auxillary Services Zone': 'Auxillary Services Zone',
      'Buildings': 'Buildings',
      'Amenities': 'Amenities',
      'Dining': 'Dining',
      'Comfort Rooms (CR)': 'Comfort Rooms',
      'Comfort Rooms': 'Comfort Rooms',
      'Research zones': 'Research Zones',
      'Research Zones': 'Research Zones',
      'Clinic': 'Clinic',
      'Parking': 'Parking',
      'Security': 'Security',
      'Other': 'Other'
    };
    
    const mappedCategory = categoryMap[pin.category] || pin.category;
    if (mappedCategory && mappedCategory !== 'Other') {
      return [mappedCategory];
    }
  }
  
  // Fallback to legacy pin ID mapping for backward compatibility
  const { categoryPinIds } = require('./categoryFilter');
  const pinIdStr = String(pin.id);
  
  // Main Entrance is always first
  if (pin.id === 0) return ['Main Entrance'];
  
  // Buildings 1-52 (numeric IDs only, exclude string IDs like "SL1", "MC")
  const pinIdNum = typeof pin.id === 'number' ? pin.id : parseInt(pin.id);
  if (!isNaN(pinIdNum) && pinIdNum >= 1 && pinIdNum <= 52) {
    return ['Buildings'];
  }
  
  // MC goes to Amenities
  if (pin.id === 'MC') return ['Amenities'];
  
  // Check if pin is in Academic Core Zone or Dining - those go to Amenities
  const academicCoreIds = categoryPinIds['Academic Core Zone'] || [];
  const diningIds = categoryPinIds['Dining'] || [];
  const amenityIds = [...academicCoreIds, ...diningIds];
  for (const id of amenityIds) {
    if (String(id) === pinIdStr) {
      return ['Amenities'];
    }
  }
  
  // Check other categories (for non-building pins)
  const skipCategories = ['Academic Core Zone', 'Dining'];
  for (const [category, pinIds] of Object.entries(categoryPinIds)) {
    if (skipCategories.includes(category)) {
      continue;
    }
    for (const id of pinIds) {
      if (String(id) === pinIdStr) {
        return [category];
      }
    }
  }
  
  // Default category for uncategorized pins - add to Amenities
  return ['Amenities'];
};

/**
 * Get the primary category for a pin (backward compatibility)
 * Returns the first category from getPinCategories
 * @param {Object} pin - The pin object
 * @returns {string} The primary category name
 */
export const getPinCategory = (pin) => {
  const categories = getPinCategories(pin);
  return categories.length > 0 ? categories[0] : 'Amenities';
};

/**
 * Organize pins by category for View All Pins modal
 * Pins with multiple categories will appear in all relevant category sections
 * @param {Array} pins - Array of all pins
 * @param {Object} selectedCategories - Optional: Object with category names as keys and boolean values for filtering
 * @param {Object} currentCampus - Optional: Current campus object for filtering by campus
 * @returns {Array} Array of category objects with title and pins
 */
export const getCategorizedPins = (pins, selectedCategories = null, currentCampus = null) => {
  // Filter visible pins
  let visiblePins = pins.filter(pin => !pin.isInvisible);
  
  // Apply campus filter if provided
  if (currentCampus) {
    const campusId = currentCampus._id || currentCampus.id;
    visiblePins = visiblePins.filter(pin => {
      const pinCampusId = pin.campusId?._id || pin.campusId?.id || pin.campusId;
      return !pinCampusId || pinCampusId === campusId;
    });
  }
  
  // Apply category filter if provided (for FilterModal)
  if (selectedCategories) {
    const { pinMatchesSelected } = require('./categoryFilter');
    visiblePins = visiblePins.filter(pin => pinMatchesSelected(pin, selectedCategories));
  }
  
  const categories = {};
  
  visiblePins.forEach(pin => {
    // Get all categories for this pin (handles multiple categories)
    const pinCategories = getPinCategories(pin);
    
    // Add pin to all its categories
    pinCategories.forEach(category => {
      if (!categories[category]) {
        categories[category] = [];
      }
      // Only add pin if not already in this category (avoid duplicates)
      if (!categories[category].find(p => p.id === pin.id)) {
        categories[category].push(pin);
      }
    });
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
