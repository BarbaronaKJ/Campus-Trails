// pinsData.js

export const pins = [
  // --- VISIBLE BUILDINGS ---
  { 
    id: 0, 
    x: 900, 
    y: 1115, 
    title: "E", 
    description: "Main Entrance", 
    image: require('./assets/USTP.jpg'),
    neighbors: [1001] // Connects to first road point
  },
  { 
    id: 1, 
    x: 1580, 
    y: 630, 
    title: "1", 
    description: "BLDG 1 | Arts & Culture Building", 
    image: require('./assets/USTP.jpg'),
    neighbors: [1007] // Connects to last road point
  },
  // --- INVISIBLE WAYPOINTS (The Road Network) ---
  // Connects 0 -> 1001 -> 1002 ... -> 1007 -> 1
  { id: 1001, x: 900, y: 1050, isInvisible: true, neighbors: [0, 1002] },
  { id: 1002, x: 935, y: 990, isInvisible: true, neighbors: [1001, 1003] },
  { id: 1003, x: 900, y: 910, isInvisible: true, neighbors: [1002, 1004] },
  { id: 1004, x: 1125, y: 820, isInvisible: true, neighbors: [1003, 1005] },
  { id: 1005, x: 1115, y: 770, isInvisible: true, neighbors: [1004, 1006] },
  { id: 1006, x: 1430, y: 722, isInvisible: true, neighbors: [1005, 1007] },
  { id: 1007, x: 1450, y: 650, isInvisible: true, neighbors: [1006, 1] },
];

// Instructions:
// To add a new pin, add an object with:
// - id: unique number
// - x: x coordinate on the map (0-1920 based on viewBox)
// - y: y coordinate on the map (0-1310 based on viewBox)
// - title: building number (displayed on pin)
// - description: full building description
// - image: require('./assets/your-image.jpg')
// - neighbors: [array of neighbor IDs] - defines explicit connections for pathfinding
// - isInvisible: true (optional) - makes the pin invisible but still usable for pathfinding
//
// Example:
// { id: 44, x: 300, y: 400, title: "44", description: "BLDG 44 | New Building", image: require('./assets/USTP.jpg'), neighbors: [1001, 1002] }
