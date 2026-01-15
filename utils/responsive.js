import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 12/13/14 - 390x844)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Scale factor based on screen width
const scale = SCREEN_WIDTH / BASE_WIDTH;
const verticalScale = SCREEN_HEIGHT / BASE_HEIGHT;

// Moderate scale (less aggressive scaling)
const moderateScale = (size, factor = 0.5) => {
  return size + (scale - 1) * size * factor;
};

// Responsive font size
export const responsiveFontSize = (size) => {
  const scaledSize = moderateScale(size);
  return Math.round(PixelRatio.roundToNearestPixel(scaledSize));
};

// Responsive width
export const responsiveWidth = (size) => {
  return Math.round(SCREEN_WIDTH * (size / BASE_WIDTH));
};

// Responsive height
export const responsiveHeight = (size) => {
  return Math.round(SCREEN_HEIGHT * (size / BASE_HEIGHT));
};

// Responsive padding
export const responsivePadding = (size) => {
  return Math.round(moderateScale(size));
};

// Get screen dimensions
export const getScreenDimensions = () => ({
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  scale,
  verticalScale,
});

// Check if device is small screen
export const isSmallScreen = () => SCREEN_WIDTH < 360;

// Check if device is large screen
export const isLargeScreen = () => SCREEN_WIDTH > 400;

// Responsive button width (min width to prevent clipping)
export const responsiveButtonWidth = (baseWidth, minWidth = 60) => {
  const scaled = responsiveWidth(baseWidth);
  return Math.max(scaled, minWidth);
};

// Responsive button height
export const responsiveButtonHeight = (baseHeight, minHeight = 36) => {
  const scaled = responsiveHeight(baseHeight);
  return Math.max(scaled, minHeight);
};
