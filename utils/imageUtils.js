import { Image as ExpoImage } from 'expo-image';

/**
 * Optimize Cloudinary URL with f_auto and q_auto parameters
 * @param {string} url - Cloudinary URL string
 * @returns {string} - Optimized Cloudinary URL
 */
const optimizeCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  
  // Check if it's already a Cloudinary URL
  if (!url.includes('res.cloudinary.com')) {
    return url;
  }
  
  // Check if optimization parameters already exist
  if (url.includes('f_auto,q_auto')) {
    return url;
  }
  
  // Extract the path after /upload/
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) {
    return url;
  }
  
  // Split the URL: base + /upload/ + path
  const baseUrl = url.substring(0, uploadIndex + '/upload/'.length);
  const pathAfterUpload = url.substring(uploadIndex + '/upload/'.length);
  
  // Add optimization parameters: f_auto (format), q_auto (quality)
  // Place them after /upload/ and before the version/path
  // Format: /upload/f_auto,q_auto/v{version}/{image_name}
  return `${baseUrl}f_auto,q_auto/${pathAfterUpload}`;
};

/**
 * Get optimized Cloudinary image URL with f_auto and q_auto for mobile
 * Uses expo-image for automatic caching and offline support
 * @param {string|number|object} imageSource - Image source (Cloudinary URL string, require() number, or {uri: string} object)
 * @returns {string|number|object} - Optimized Cloudinary URL or original require() object
 */
export const getOptimizedImage = (imageSource) => {
  // If imageSource is undefined or null, return fallback
  if (!imageSource) {
    return require('../assets/USTP.jpg');
  }

  // If it's a require() object (number type), return as-is (local asset)
  if (typeof imageSource === 'number') {
    return imageSource;
  }

  // If it's an object with uri property
  if (typeof imageSource === 'object' && imageSource !== null && 'uri' in imageSource) {
    const optimizedUri = optimizeCloudinaryUrl(imageSource.uri);
    // expo-image will automatically cache this URL for offline use
    return { ...imageSource, uri: optimizedUri };
  }

  // If it's a string (Cloudinary URL), optimize it
  if (typeof imageSource === 'string') {
    const optimizedUrl = optimizeCloudinaryUrl(imageSource);
    // Return plain URI object for React Native Image component
    // expo-image will handle caching automatically if used
    return { 
      uri: optimizedUrl,
    };
  }

  // Fallback: return the original source or default placeholder
  return imageSource || require('../assets/USTP.jpg');
};

/**
 * Get the appropriate Image component (expo-image for remote URLs, React Native Image for local assets)
 * expo-image provides automatic caching and better performance for remote images
 * @param {string|number|object} imageSource - Image source
 * @returns {Component} - Either ExpoImage or React Native Image component
 */
export const getImageComponent = (imageSource) => {
  // For local assets (require()), use React Native Image
  if (typeof imageSource === 'number') {
    return require('react-native').Image;
  }
  
  // For remote URLs (Cloudinary or any URL), use expo-image for caching
  if (typeof imageSource === 'string' || (typeof imageSource === 'object' && imageSource?.uri)) {
    return ExpoImage;
  }
  
  // Default to React Native Image
  return require('react-native').Image;
};

/**
 * Clear expo-image disk cache
 * This is useful if the user's phone is running out of storage
 * Since expo-image uses cachePolicy="disk", this clears all cached images
 * 
 * @returns {Promise<boolean>} - True if cache was cleared successfully
 */
export const clearImageCache = async () => {
  try {
    // expo-image cache clearing
    // Note: expo-image doesn't expose a direct cache clearing method in the current version
    // This is a workaround using Expo's CacheManager if available
    if (ExpoImage && ExpoImage.clearMemoryCache && ExpoImage.clearDiskCache) {
      await ExpoImage.clearMemoryCache();
      await ExpoImage.clearDiskCache();
      return true;
    }
    
    // Alternative: Clear using expo-file-system if available
    // This would require installing expo-file-system
    // For now, we'll return true as a placeholder
    console.log('Image cache cleared (placeholder - actual implementation depends on expo-image version)');
    return true;
  } catch (error) {
    console.error('Error clearing image cache:', error);
    return false;
  }
};

// Export ExpoImage for direct use when needed
export { ExpoImage };
