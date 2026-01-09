// Color constants
export const skyBlue = { r: 0, g: 212, b: 255 }; // #00D4FF
export const blue = { r: 33, g: 150, b: 243 }; // #2196F3

// Blue shades for pointA (light blue to dark blue)
export const lightBlue = { r: 100, g: 181, b: 246 }; // #64B5F6
export const darkBlue = { r: 25, g: 118, b: 210 }; // #1976D2

// Red shades for pointB (light red to dark red)
export const lightRed = { r: 239, g: 83, b: 80 }; // #EF5350
export const darkRed = { r: 198, g: 40, b: 40 }; // #C62828

// Animation throttle constant
export const THROTTLE_MS = 100; // Update every 100ms for performance

/**
 * Helper function to interpolate color (performance-optimized)
 * Creates a smooth breathing effect between sky blue and blue
 */
export const interpolateColor = (value) => {
  // Use sine wave for smooth breathing effect (0 to 1)
  const normalizedValue = (Math.sin(value * Math.PI * 2) + 1) / 2;
  
  const r = Math.round(skyBlue.r + (blue.r - skyBlue.r) * normalizedValue);
  const g = Math.round(skyBlue.g + (blue.g - skyBlue.g) * normalizedValue);
  const b = Math.round(skyBlue.b + (blue.b - skyBlue.b) * normalizedValue);
  
  return `rgb(${r}, ${g}, ${b})`;
};

/**
 * Helper function to interpolate color for pointA (uses user-selected colors)
 * Creates a smooth breathing effect between light and dark blue shades
 */
export const interpolateBlueColor = (value, pointAColorLight, pointAColorDark) => {
  const normalizedValue = (Math.sin(value * Math.PI * 2) + 1) / 2;
  
  const r = Math.round(pointAColorLight.r + (pointAColorDark.r - pointAColorLight.r) * normalizedValue);
  const g = Math.round(pointAColorLight.g + (pointAColorDark.g - pointAColorLight.g) * normalizedValue);
  const b = Math.round(pointAColorLight.b + (pointAColorDark.b - pointAColorLight.b) * normalizedValue);
  
  return `rgb(${r}, ${g}, ${b})`;
};

/**
 * Helper function to interpolate color for pointB (uses user-selected colors)
 * Creates a smooth breathing effect between light and dark red shades
 */
export const interpolateRedColor = (value, pointBColorLight, pointBColorDark) => {
  const normalizedValue = (Math.sin(value * Math.PI * 2) + 1) / 2;
  
  const r = Math.round(pointBColorLight.r + (pointBColorDark.r - pointBColorLight.r) * normalizedValue);
  const g = Math.round(pointBColorLight.g + (pointBColorDark.g - pointBColorLight.g) * normalizedValue);
  const b = Math.round(pointBColorLight.b + (pointBColorDark.b - pointBColorLight.b) * normalizedValue);
  
  return `rgb(${r}, ${g}, ${b})`;
};
