/**
 * Custom hook to fetch pins from MongoDB API with fallback to local pinsData
 * Handles loading states and errors gracefully
 */

import { useState, useEffect } from 'react';
import { fetchPins } from '../services/api';
import { pins as localPins } from '../pinsData';

/**
 * Hook to fetch pins from API with fallback to local data
 * @param {boolean} useApi - Whether to attempt fetching from API (default: true)
 * @returns {Object} { pins, loading, error, isUsingLocalFallback }
 */
export const usePins = (useApi = true) => {
  const [pins, setPins] = useState(localPins); // Start with local pins as fallback
  const [loading, setLoading] = useState(useApi);
  const [error, setError] = useState(null);
  const [isUsingLocalFallback, setIsUsingLocalFallback] = useState(!useApi);

  useEffect(() => {
    if (!useApi) {
      setLoading(false);
      setIsUsingLocalFallback(true);
      return;
    }

    let isMounted = true;

    const loadPins = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Attempt to fetch from API - include invisible waypoints for pathfinding
        // These will be filtered out for display but needed for pathfinding calculations
        const apiPins = await fetchPins(true); // true = include invisible waypoints
        
        if (isMounted) {
          if (apiPins && apiPins.length > 0) {
            // Convert API response to match local format
            const formattedPins = apiPins.map(pin => ({
              ...pin,
              // Ensure image is a string (API should provide URLs)
              image: pin.image || 'https://res.cloudinary.com/dun83uvdm/image/upload/f_auto,q_auto/v1768038877/openfield_ypsemx.jpg', // Fallback Cloudinary URL
              // Ensure neighbors is an array
              neighbors: pin.neighbors || []
            }));
            
            setPins(formattedPins);
            setIsUsingLocalFallback(false);
            console.log(`✅ Loaded ${formattedPins.length} pins from MongoDB API`);
          } else {
            // Empty response, use local fallback
            console.warn('⚠️  API returned empty pins, using local fallback');
            setPins(localPins);
            setIsUsingLocalFallback(true);
          }
        }
      } catch (err) {
        // API fetch failed, use local fallback
        if (isMounted) {
          console.warn('⚠️  Failed to fetch pins from API, using local fallback:', err.message);
          setPins(localPins);
          setError(err.message);
          setIsUsingLocalFallback(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPins();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [useApi]);

  return {
    pins,
    loading,
    error,
    isUsingLocalFallback,
    refetch: async () => {
      if (!useApi) return;
      
      try {
        setLoading(true);
        setError(null);
        const apiPins = await fetchPins(true); // Include invisible waypoints for pathfinding
        
        if (apiPins && apiPins.length > 0) {
          const formattedPins = apiPins.map(pin => ({
            ...pin,
            image: pin.image || 'https://res.cloudinary.com/dun83uvdm/image/upload/f_auto,q_auto/v1768038877/openfield_ypsemx.jpg', // Fallback Cloudinary URL
            neighbors: pin.neighbors || []
          }));
          
          setPins(formattedPins);
          setIsUsingLocalFallback(false);
          console.log(`✅ Refetched ${formattedPins.length} pins from MongoDB API`);
        }
      } catch (err) {
        console.warn('⚠️  Failed to refetch pins from API:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };
};
