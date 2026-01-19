/**
 * Pathfinding utility functions
 */

import { aStarPathfinding } from './pathfinding';
import { updateUserActivity, getCurrentUser, trackAnonymousPathfinding } from '../services/api';

/**
 * Reset pathfinding state
 * @param {Object} setters - Object containing state setters
 */
export const resetPathfinding = (setters) => {
  const {
    setPathfindingMode,
    setShowPathfindingPanel,
    setPointA,
    setPointB,
    setPath,
    setHighlightedPinOnMap
  } = setters;

  setPathfindingMode(false);
  setShowPathfindingPanel(false);
  setPointA(null);
  setPointB(null);
  setPath([]);
  // Clear highlighted pin when resetting pathfinding
  if (setHighlightedPinOnMap) {
    setHighlightedPinOnMap(null);
  }
};

/**
 * Swap point A and point B
 * @param {Object} pointA - Current point A
 * @param {Object} pointB - Current point B
 * @param {Function} setPointA - Setter for point A
 * @param {Function} setPointB - Setter for point B
 */
export const swapPoints = (pointA, pointB, setPointA, setPointB) => {
  const temp = pointA;
  setPointA(pointB);
  setPointB(temp);
};

/**
 * Start pathfinding between two points
 * @param {Object} params - Pathfinding parameters
 * @param {Object} params.pointA - Starting point
 * @param {Object} params.pointB - Destination point
 * @param {Array} params.pins - All pins array
 * @param {Object} params.setters - State setters
 * @param {Object} params.auth - Authentication state
 * @param {Object} params.campus - Campus state
 */
export const handleStartPathfinding = async (params) => {
  const {
    pointA,
    pointB,
    pins,
    setters,
    auth,
    campus
  } = params;

  const {
    setAlertMessage,
    setShowAlertModal,
    setPath,
    setPathfindingMode,
    setShowPathfindingPanel,
    setPointA: setPointASetter,
    setCurrentUser
  } = setters;

  const {
    isLoggedIn,
    authToken,
    currentUser
  } = auth;

  const {
    currentCampus,
    campusesData
  } = campus;

  if (!pointA || !pointB) {
    setAlertMessage('Please select both start and end points');
    setShowAlertModal(true);
    return;
  }

  // Check if points are the same (considering room floor levels)
  // For rooms: same building + same floor + same room name = same point
  // For buildings: same ID = same point
  const isSamePoint = (() => {
    // If both are rooms, check building, floor, and room name
    if (pointA.type === 'room' && pointB.type === 'room') {
      const sameBuilding = (pointA.buildingId || pointA.buildingPin?.id) === (pointB.buildingId || pointB.buildingPin?.id);
      const sameFloor = pointA.floorLevel === pointB.floorLevel;
      const sameRoom = pointA.id === pointB.id || pointA.name === pointB.name;
      return sameBuilding && sameFloor && sameRoom;
    }
    // If both are buildings, check ID
    if (pointA.type !== 'room' && pointB.type !== 'room') {
      return pointA.id == pointB.id;
    }
    // Mixed types are never the same
    return false;
  })();
  
  if (isSamePoint) {
    setAlertMessage('Start and end points cannot be the same');
    setShowAlertModal(true);
    return;
  }

  setTimeout(async () => {
    try {
      // For rooms, use buildingId instead of room id for pathfinding
      const startId = pointA.type === 'room' ? (pointA.buildingId || pointA.buildingPin?.id || pointA.id) : pointA.id;
      const endId = pointB.type === 'room' ? (pointB.buildingId || pointB.buildingPin?.id || pointB.id) : pointB.id;
      
      // Pass all pins (including invisible waypoints) to pathfinding algorithm
      const foundPath = aStarPathfinding(startId, endId, pins);
      
      if (foundPath.length > 0) {
        // DEBUGGING: Show path length in console (comment out for production)
        console.log(`Path found with ${foundPath.length} steps:`, foundPath.map(p => p.id));
        
        setPath(foundPath);
        setPathfindingMode(true);
        setShowPathfindingPanel(false);
        
        // Track pathfinding for logged-in users (user-specific tracking)
        if (isLoggedIn && authToken && currentUser) {
          try {
            const currentCount = currentUser.activity?.pathfindingCount || 0;
            const updatedPathfindingCount = currentCount + 1;
            console.log(`🗺️  Tracking pathfinding (logged-in): Count ${currentCount} -> ${updatedPathfindingCount}`);
            
            await updateUserActivity(authToken, {
              pathfindingCount: updatedPathfindingCount
            });
            
            console.log('✅ Pathfinding count updated successfully');
            
            // Refresh user data to get updated counts
            const updatedUser = await getCurrentUser(authToken);
            if (setCurrentUser) {
              setCurrentUser(updatedUser);
            }
            console.log('✅ User data refreshed, new pathfindingCount:', updatedUser.activity?.pathfindingCount);
          } catch (error) {
            console.error('❌ Error tracking pathfinding (logged-in):', error);
            console.error('Error details:', error.message, error.stack);
          }
        }
        
        // Track anonymously ONLY if NOT logged in (for analytics - no PII)
        // If logged in, user-specific tracking is already done above
        if (!isLoggedIn || !authToken) {
          try {
            // Get campus ID from currentCampus, or fallback to pin's campus, or default to first campus
            let campusId = currentCampus?._id || currentCampus?.id || null;
            
            // Fallback: Get campus from pointA or pointB pin
            if (!campusId && pointA) {
              const startPin = pins.find(p => (p.id || p._id) == pointA.id);
              campusId = startPin?.campusId?._id || startPin?.campusId?.id || startPin?.campusId || null;
            }
            
            if (!campusId && pointB) {
              const endPin = pins.find(p => (p.id || p._id) == pointB.id);
              campusId = endPin?.campusId?._id || endPin?.campusId?.id || endPin?.campusId || null;
            }
            
            // Fallback: Get campus from first available campus
            if (!campusId && campusesData && campusesData.length > 0) {
              campusId = campusesData[0]._id || campusesData[0].id || null;
            }
            
            if (campusId && pointA && pointB) {
              // Find full pin data for start and end points
              const startPin = pins.find(p => (p.id || p._id) == pointA.id);
              const endPin = pins.find(p => (p.id || p._id) == pointB.id);
              
              await trackAnonymousPathfinding(
                campusId,
                {
                  pinId: pointA.id,
                  title: startPin?.title || pointA.title || '',
                  description: startPin?.description || pointA.description || ''
                },
                {
                  pinId: pointB.id,
                  title: endPin?.title || pointB.title || '',
                  description: endPin?.description || pointB.description || ''
                },
                foundPath.length
              );
              console.log(`✅ Anonymous pathfinding tracked (user not logged in): ${pointA.id} -> ${pointB.id} (${foundPath.length} steps)`);
            } else {
              if (!campusId) {
                console.log('⏭️  Skipping anonymous pathfinding tracking - no campus ID available');
              } else {
                console.log('⏭️  Skipping anonymous pathfinding tracking - missing point data');
              }
            }
          } catch (error) {
            console.error('❌ Error tracking anonymous pathfinding:', error);
            // Don't show error - anonymous tracking failure shouldn't affect app
          }
        } else {
          console.log('⏭️  Skipping anonymous pathfinding tracking - user is logged in (using user-specific tracking)');
        }
        // No alert on success - path is shown on map
      } else {
        if (setAlertMessage && setShowAlertModal) {
          setAlertMessage('Pathfinding Error: No path found.');
          setShowAlertModal(true);
        } else {
          console.error('Pathfinding Error: No path found.');
        }
      }
    } catch (error) {
      console.error(error);
      if (setAlertMessage && setShowAlertModal) {
        setAlertMessage('Error calculating path');
        setShowAlertModal(true);
      }
    }
  }, 100);
};
