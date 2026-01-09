// Category pin ID mapping for filtering
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

export const allCategoryKeys = Object.keys(categoryPinIds);

// Check if a pin matches any of the selected categories
export const pinMatchesSelected = (pin, selectedCategories) => {
  // Always hide invisible pins
  if (pin.isInvisible) return false;

  const activeCats = allCategoryKeys.filter(cat => selectedCategories[cat]);
  if (activeCats.length === 0) return true; // no filter = show all

  // Check if pin ID matches any selected category
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
