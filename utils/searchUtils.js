import { building9Rooms } from '../constants/rooms';

/**
 * Flatten all rooms from Building 9 for search
 * @returns {Array} Array of all rooms with floor and building info
 */
export const getAllRooms = () => {
  const rooms = [];
  Object.entries(building9Rooms).forEach(([floor, floorRooms]) => {
    floorRooms.forEach(room => {
      rooms.push({
        ...room,
        floor: floor,
        buildingId: 9,
        type: 'room'
      });
    });
  });
  return rooms;
};

/**
 * Filter pins based on search query
 * @param {Array} pins - Array of all pins
 * @param {string} searchQuery - Search query string
 * @returns {Array} Filtered pins
 */
export const getFilteredPins = (pins, searchQuery) => {
  return pins.filter((pin) =>
    (pin.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (pin.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
};

/**
 * Filter rooms based on search query
 * @param {Array} allRooms - Array of all rooms
 * @param {string} searchQuery - Search query string
 * @returns {Array} Filtered rooms
 */
export const getFilteredRooms = (allRooms, searchQuery) => {
  return allRooms.filter((room) =>
    (room.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (room.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
};

/**
 * Combine filtered pins and rooms for search results
 * @param {Array} filteredPins - Filtered pins
 * @param {Array} filteredRooms - Filtered rooms
 * @param {number} limit - Maximum number of results (default: 5)
 * @returns {Array} Combined search results
 */
export const getSearchResults = (filteredPins, filteredRooms, limit = 5) => {
  const results = [];
  
  // Add filtered pins
  filteredPins.forEach(pin => {
    results.push({ ...pin, type: 'pin' });
  });
  
  // Add filtered rooms
  filteredRooms.forEach(room => {
    results.push(room);
  });
  
  return results.slice(0, limit);
};
