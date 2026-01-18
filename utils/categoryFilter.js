// Category pin ID mapping for filtering (legacy fallback)
// This is used as a fallback when pins don't have category set in database
export const categoryPinIds = {
  'Commercial Zone': [20],
  'Admin / Operation Zone': [10, 15],
  'Academic Core Zone': [52, 45, 36, 35, 47, 24, 44, 28, 41, 23, 'MC', 14, 43, 42, 19, 18, 9, 5, 6, 3],
  'Auxiliary Services Zone': [2, 27],
  'Dining': [20, 'SL1', 'SL2'],
  'Comfort Rooms (CR)': [9, 42, 16, 41, 23, 47],
  'Research Zone': [25, 26],
  'Clinic': [27],
  'Parking': [21], // Near Guard House
  'Security': [21, 0]
};

// Map Filter modal display names to database category names
export const categoryNameMap = {
  'Commercial Zone': 'Commercial Zone',
  'Admin / Operation Zone': 'Admin/Operation Zone',
  'Academic Core Zone': 'Academic Core Zone',
  'Auxiliary Services Zone': 'Auxillary Services Zone',
  'Dining': 'Dining',
  'Comfort Rooms (CR)': 'Comfort Rooms',
  'Research Zones': 'Research Zones',
  'Clinic': 'Clinic',
  'Parking': 'Parking',
  'Security': 'Security'
};

export const allCategoryKeys = Object.keys(categoryPinIds);

// Check if a pin matches any of the selected categories
export const pinMatchesSelected = (pin, selectedCategories) => {
  // Always hide invisible pins
  if (pin.isInvisible || pin.isVisible === false) return false;

  const activeCats = allCategoryKeys.filter(cat => selectedCategories[cat]);
  if (activeCats.length === 0) return true; // no filter = show all

  // First, check if pin has a category field from database
  if (pin.category && pin.category !== 'Other' && typeof pin.category === 'string') {
    for (const displayCat of activeCats) {
      const dbCategory = categoryNameMap[displayCat] || displayCat;
      // Direct match
      if (pin.category === dbCategory) return true;
      // Handle variations (e.g., "Admin/Operation Zone" vs "Admin / Operation Zone")
      if (typeof dbCategory === 'string' && pin.category.replace(/\s+/g, ' ') === dbCategory.replace(/\s+/g, ' ')) return true;
    }
  }

  // Fallback to legacy pin ID matching for backward compatibility
  for (const cat of activeCats) {
    const pinIds = categoryPinIds[cat] || [];
    // Convert pin.id to string for comparison (handles both string and number IDs)
    const pinIdStr = String(pin.id);
    for (const id of pinIds) {
      if (String(id) === pinIdStr) return true;
    }
  }
  return false;
};
