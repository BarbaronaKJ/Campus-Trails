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
    neighbors: [1009] // Connects to last road point
  },
  { 
    id: 2, 
    x: 1520, 
    y: 605, 
    title: "2", 
    description: "BLDG 2 | Guidance and Testing Center", 
    image: require('./assets/USTP.jpg'),
    neighbors: [1009] // Connects to last road point
  },
  { 
    id: 3, 
    x: 1480, 
    y: 700, 
    title: "3", 
    description: "BLDG 3 | College of Medicine", 
    image: require('./assets/USTP.jpg'),
    neighbors: [1009] // Connects to last road point
  },
  { 
    id: 5, 
    x: 1280, 
    y: 790, 
    title: "5", 
    description: "BLDG 5 | Old Engineering Building", 
    image: require('./assets/USTP.jpg'),
    neighbors: [1006] // Connects to last road point
  },
  { 
    id: 6, 
    x: 1555, 
    y: 740, 
    title: "6", 
    description: "BLDG 6", 
    image: require('./assets/USTP.jpg'),
    neighbors: [1009] // Connects to last road point
  },
  { 
    id: 9, 
    x: 1215, 
    y: 590, 
    title: "9", 
    description: "BLDG 9 | Information Communication Technology (ICT) Building", 
    image: require('./assets/USTP.jpg'),
    neighbors: [1010] // Connects to last road point
  },
  { 
    id: 10, 
    x: 1175, 
    y: 695, 
    title: "10", 
    description: "BLDG 10 | Administration Building", 
    image: require('./assets/USTP.jpg'),
    neighbors: [1005.2] // Connects to last road point
  },
  { 
    id: 14, 
    x: 1017, 
    y: 595, 
    title: "14", 
    description: "BLDG 14 | Finance & Accounting Building / Senior High School Building (Across the ICT BLDG.)", 
    image: require('./assets/USTP.jpg'),
    neighbors: [1012] // Connects to last road point
  },
  { 
    id: 15, 
    x: 895, 
    y: 663, 
    title: "15", 
    description: "BLDG 15 | Gymnasium Lobby", 
    image: require('./assets/USTP.jpg'),
    neighbors: [1013.2] // Connects to last road point
  },
  { 
    id: 16, 
    x: 970, 
    y: 750, 
    title: "16", 
    description: "BLDG 16 | Gymnasium / DRER Memorial Hall", 
    image: require('./assets/USTP.jpg'),
    neighbors: [1013.3, 1013.4] // Connects to last road point
  },
  // --- INVISIBLE WAYPOINTS (The Road Network) ---
  // Connects 0 -> 1001 -> 1002 ... -> 1007 -> 1
  { title: "1001", id: 1001, x: 900, y: 1050, isInvisible: true, neighbors: [0, 1002] },
  { title: "1002", id: 1002, x: 935, y: 990, isInvisible: true, neighbors: [1001, 1003] },
  { title: "1003", id: 1003, x: 910, y: 910, isInvisible: true, neighbors: [1002, 1004,] },
  { title: "1004", id: 1004, x: 1125, y: 820, isInvisible: true, neighbors: [1003, 1005] },
  { title: "1005", id: 1005, x: 1120, y: 770, isInvisible: true, neighbors: [1004, 1006] },
  { title: "1005.1", id: 1005.1, x: 1205, y: 757, isInvisible: true, neighbors: [1005, 1005.2, 1006] },
  { title: "1005.2", id: 1005.2, x: 1155, y: 725, isInvisible: true, neighbors: [1005.1] },
  { title: "1006", id: 1006, x: 1260, y: 750, isInvisible: true, neighbors: [1005, 1007, 1006.1] },
  { title: "1006.1", id: 1006.1, x: 1240, y: 690, isInvisible: true, neighbors: [1006, 1010] },
  { title: "1007", id: 1007, x: 1440, y: 720, isInvisible: true, neighbors: [1006, 1008] },
  { title: "1008", id: 1008, x: 1435, y: 650, isInvisible: true, neighbors: [1007, 1009] },
  { title: "1009", id: 1009, x: 1525, y: 640, isInvisible: true, neighbors: [1008] },
  { title: "1010", id: 1010, x: 1185, y: 630, isInvisible: true, neighbors: [1006.1] },
  { title: "1011", id: 1011, x: 1110, y: 695, isInvisible: true, neighbors: [1005, 1005.2] },
  { title: "1012", id: 1012, x: 1095, y: 595, isInvisible: true, neighbors: [1010, 1011] },
  { title: "1013", id: 1013, x: 838, y: 720, isInvisible: true, neighbors: [1003] },
  { title: "1013.1", id: 1013.1, x: 860, y: 710, isInvisible: true, neighbors: [1013] },
  { title: "1013.2", id: 1013.2, x: 865, y: 680, isInvisible: true, neighbors: [1013.1] },
  { title: "E", id: 1013.3, x: 895, y: 720, isInvisible: true, neighbors: [1013.1] },
  { title: "E", id: 1013.4, x: 905, y: 690, isInvisible: true, neighbors: [15] },
  

  
  

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
// - isInvisible: false (optional) - makes the pin invisible but still usable for pathfinding
//
// Example:
// { id: 44, x: 300, y: 400, title: "44", description: "BLDG 44 | New Building", image: require('./assets/USTP.jpg'), neighbors: [1001, 1002] }
