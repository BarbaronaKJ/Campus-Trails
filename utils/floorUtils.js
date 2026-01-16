/**
 * Utility functions for floor-related operations
 */

/**
 * Formats floor level number into a readable floor name
 * Example: 0 -> "Ground Floor", 1 -> "2nd Floor", 2 -> "3rd Floor"
 * 
 * @param {number} floorLevel - The floor level (0 = Ground Floor, 1 = 2nd Floor, etc.)
 * @returns {string} Formatted floor name with proper ordinal suffix
 */
export const getFloorName = (floorLevel) => {
  // Ground floor is special case
  if (floorLevel === 0) return 'Ground Floor';
  
  // Calculate floor number (floorLevel + 1)
  // Example: floorLevel 1 = 2nd Floor, floorLevel 2 = 3rd Floor
  const floorNumber = floorLevel + 1;
  const lastDigit = floorNumber % 10;
  const lastTwoDigits = floorNumber % 100;
  
  // Determine ordinal suffix
  let suffix = 'th'; // Default suffix
  
  // Special cases: 11th, 12th, 13th (not 11st, 12nd, 13rd)
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    suffix = 'th';
  } else if (lastDigit === 1) {
    suffix = 'st'; // 1st, 21st, 31st, etc.
  } else if (lastDigit === 2) {
    suffix = 'nd'; // 2nd, 22nd, 32nd, etc.
  } else if (lastDigit === 3) {
    suffix = 'rd'; // 3rd, 23rd, 33rd, etc.
  }
  
  return `${floorNumber}${suffix} Floor`;
};
