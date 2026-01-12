/**
 * Cloudinary Utilities
 * Handles Cloudinary image transformations, especially for profile pictures with face detection
 */

// Cloudinary Configuration
// Update these with your Cloudinary credentials
// For direct unsigned upload, create an unsigned upload preset in Cloudinary Dashboard:
// Settings > Upload > Upload presets > Add upload preset > Signing Mode: Unsigned
export const CLOUDINARY_CONFIG = {
  cloudName: 'dun83uvdm', // Your Cloudinary cloud name (found in Cloudinary dashboard)
  uploadPreset: 'campus_trails_profile', // Your unsigned upload preset name (create this in Cloudinary dashboard)
};

/**
 * Get optimized Cloudinary URL with face detection for profile pictures
 * Uses Cloudinary transformations:
 * - c_thumb, g_face: Automatically finds the face and crops it into a thumbnail
 * - r_max: Makes the image perfectly circular without needing CSS borderRadius
 * - f_auto, q_auto: Automatic format and quality optimization
 * 
 * @param {string} imageUrl - Cloudinary image URL
 * @param {object} options - Transformation options
 * @param {boolean} options.circular - Whether to make the image circular (default: true)
 * @param {number} options.width - Width in pixels (default: 200)
 * @param {number} options.height - Height in pixels (default: 200)
 * @returns {string} - Transformed Cloudinary URL
 */
export const getProfilePictureUrl = (imageUrl, options = {}) => {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return imageUrl;
  }
  
  // Default options
  const {
    circular = true,
    width = 200,
    height = 200,
  } = options;
  
  // Check if it's already a Cloudinary URL
  if (!imageUrl.includes('res.cloudinary.com')) {
    return imageUrl;
  }
  
  // Check if transformations are already applied
  if (imageUrl.includes('/upload/')) {
    const uploadIndex = imageUrl.indexOf('/upload/');
    const baseUrl = imageUrl.substring(0, uploadIndex + '/upload/'.length);
    const pathAfterUpload = imageUrl.substring(uploadIndex + '/upload/'.length);
    
    // Build transformation string
    let transformations = [];
    
    // Face detection and thumbnail crop
    transformations.push(`c_thumb,g_face,w_${width},h_${height}`);
    
    // Make circular if requested
    if (circular) {
      transformations.push('r_max');
    }
    
    // Automatic format and quality
    transformations.push('f_auto,q_auto');
    
    // Combine transformations
    const transformString = transformations.join(',');
    
    // Construct final URL
    return `${baseUrl}${transformString}/${pathAfterUpload}`;
  }
  
  return imageUrl;
};

/**
 * Upload image directly to Cloudinary from mobile app (Direct Unsigned Upload)
 * This bypasses the Express server and uploads directly from client to Cloudinary
 * 
 * @param {string} imageUri - Local image URI (from camera or image picker)
 * @param {string} cloudName - Your Cloudinary cloud name (e.g., 'dun83uvdm')
 * @param {string} uploadPreset - Cloudinary unsigned upload preset (must be created in Cloudinary dashboard)
 * @returns {Promise<object>} - Object with { public_id, secure_url, url } from Cloudinary response
 */
export const uploadToCloudinaryDirect = async (imageUri, cloudName, uploadPreset) => {
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary cloud name and upload preset are required');
  }

  try {
    // Create FormData for multipart/form-data upload
    const formData = new FormData();
    
    // Append the image file
    // For React Native, we need to use the proper format
    const filename = imageUri.split('/').pop() || 'profile.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    // For React Native, FormData.append accepts an object directly
    formData.append('file', {
      uri: imageUri,
      type: type,
      name: filename,
    });
    
    // Append upload preset (unsigned upload preset created in Cloudinary dashboard)
    formData.append('upload_preset', uploadPreset);
    
    // Note: Transformation parameters are NOT allowed with unsigned uploads
    // Transformations will be applied when displaying the image using getProfilePictureUrl()
    
    // Add folder organization (matches your Cloudinary setup)
    formData.append('folder', 'CampusTrails/profiles');
    
    // Upload to Cloudinary API endpoint
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let fetch set it automatically with boundary for FormData
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Upload failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Return both public_id and secure_url for storage in MongoDB
    return {
      public_id: data.public_id,
      secure_url: data.secure_url,
      url: data.url,
      // Store the base URL without transformations (we'll apply transformations on display)
      original_url: data.secure_url,
    };
  } catch (error) {
    console.error('Cloudinary direct upload error:', error);
    throw error;
  }
};

/**
 * Get optimized image URL for general use (not profile pictures)
 */
export const getOptimizedImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return imageUrl;
  }
  
  if (!imageUrl.includes('res.cloudinary.com')) {
    return imageUrl;
  }
  
  // Check if optimization parameters already exist
  if (imageUrl.includes('f_auto,q_auto')) {
    return imageUrl;
  }
  
  const uploadIndex = imageUrl.indexOf('/upload/');
  if (uploadIndex === -1) {
    return imageUrl;
  }
  
  const baseUrl = imageUrl.substring(0, uploadIndex + '/upload/'.length);
  const pathAfterUpload = imageUrl.substring(uploadIndex + '/upload/'.length);
  
  return `${baseUrl}f_auto,q_auto/${pathAfterUpload}`;
};
