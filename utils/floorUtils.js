/**
 * Utility functions for floor-related operations
 */

/**
 * Format floor names with proper ordinal suffixes
 * @param {number} floorLevel - The floor level (0 = Ground Floor, 1 = 2nd Floor, etc.)
 * @returns {string} Formatted floor name (e.g., "Ground Floor", "2nd Floor", "3rd Floor")
 */
export const getFloorName = (floorLevel) => {
  if (floorLevel === 0) return 'Ground Floor';
  const floorNumber = floorLevel + 1;
  const lastDigit = floorNumber % 10;
  const lastTwoDigits = floorNumber % 100;
  let suffix = 'th';
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    suffix = 'th';
  } else if (lastDigit === 1) {
    suffix = 'st';
  } else if (lastDigit === 2) {
    suffix = 'nd';
  } else if (lastDigit === 3) {
    suffix = 'rd';
  }
  return `${floorNumber}${suffix} Floor`;
};
