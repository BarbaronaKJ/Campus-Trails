/**
 * QR Code Generation Utility
 * For use in Web Admin Panel to generate QR codes for pins
 */

/**
 * Generate a deep link URL for a pin
 * @param {string|number} pinId - The pin ID
 * @param {string} qrCode - Optional QR code identifier (if different from pinId)
 * @param {boolean} isProduction - Whether to generate production or development URL
 * @returns {string} Deep link URL
 */
export const generatePinDeepLink = (pinId, qrCode = null, isProduction = true) => {
  if (isProduction) {
    // Production: campustrails://pin/{pinId} or campustrails://qr/{qrCode}
    if (qrCode) {
      return `campustrails://qr/${qrCode}`;
    }
    return `campustrails://pin/${pinId}`;
  } else {
    // Development: exp:// URL for Expo Go
    // Note: This requires the Expo development server URL
    // Format: exp://192.168.1.100:8081/--/pin/{pinId}
    const expoUrl = process.env.EXPO_URL || 'exp://192.168.1.100:8081';
    if (qrCode) {
      return `${expoUrl}/--/qr/${qrCode}`;
    }
    return `${expoUrl}/--/pin/${pinId}`;
  }
};

/**
 * Generate QR code data for a pin
 * This can be used with QR code libraries like qrcode.react
 * @param {Object} pin - Pin object with id and qrCode
 * @param {boolean} isProduction - Whether to generate production or development URL
 * @returns {string} QR code data (URL string)
 */
export const generateQrCodeData = (pin, isProduction = true) => {
  const qrCode = pin.qrCode || pin.id;
  return generatePinDeepLink(pin.id, qrCode, isProduction);
};

/**
 * Parse a deep link URL to extract pin information
 * @param {string} url - Deep link URL
 * @returns {Object|null} Parsed data { type: 'pin'|'qr', identifier: string }
 */
export const parseDeepLink = (url) => {
  try {
    if (!url) return null;
    
    // Handle campustrails:// scheme
    if (url.startsWith('campustrails://')) {
      const match = url.match(/campustrails:\/\/(pin|qr)\/(.+)/);
      if (match) {
        return {
          type: match[1], // 'pin' or 'qr'
          identifier: match[2]
        };
      }
    }
    
    // Handle exp:// scheme (development)
    if (url.startsWith('exp://')) {
      const match = url.match(/exp:\/\/[^/]+\/--\/(pin|qr)\/(.+)/);
      if (match) {
        return {
          type: match[1], // 'pin' or 'qr'
          identifier: match[2]
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return null;
  }
};

/**
 * Example usage for Web Admin Panel (React):
 * 
 * import QRCode from 'qrcode.react';
 * import { generateQrCodeData } from './utils/qrCodeGenerator';
 * 
 * function PinQRCode({ pin }) {
 *   const qrData = generateQrCodeData(pin, true); // true for production
 *   
 *   return (
 *     <div>
 *       <QRCode value={qrData} size={200} />
 *       <p>Scan to open: {pin.title}</p>
 *     </div>
 *   );
 * }
 */
