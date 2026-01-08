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
    neighbors: [1001, 1001.1] // Connects to first road point
  },
  { 
    id: "SL1", x: 1040, y: 940, title: "SL", 
    description: "Student Lounge 1", 
    image: require('./assets/USTP.jpg'), neighbors: [1003.05, 20, 1003.4, 1003.3]
  },
  { 
    id: "SL2", x: 1040, y: 725, title: "SL", 
    description: "Student Lounge 2", 
    image: require('./assets/USTP.jpg'), neighbors: [1039, 1036, 1038, 1011, 1005]
  },
  { 
    id: "BF", x: 805, y: 905, title: "BF", 
    description: "Big Foot / Student Lounge 3", 
    image: require('./assets/USTP.jpg'), neighbors: [1003.5] 
  },
  { 
    id: 1037, x: 1000, y: 635, title: "DC ", 
    description: "Display Center / Cashier", 
    image: require('./assets/USTP.jpg'), neighbors: [15, 1036]
  },
  { 
    id: "OF", x: 930, y: 380, title: "OF", 
    description: "Open Field", 
    image: require('./assets/USTP.jpg'), neighbors: [1030, 1034, 1026, 1029]
  },
  { 
    id: "MC", x: 970, y: 500, title: "MC", 
    description: "Movable Classrooms", 
    image: require('./assets/USTP.jpg'), neighbors: [1016.1] 
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
    description: "BLDG 9 | Information Communication Technology Building (ICT)", 
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
    neighbors: [1012, 1016.1] // Connects to last road point
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
    neighbors: [1013.3, 1013.4, 1035] // Connects to last road point
  },
  { 
    id: 18, 
    x: 1130, y: 905, 
    title: "18", 
    description: "BLDG 18 | Culinary Building", 
    image: require('./assets/USTP.jpg'),
    neighbors: [1003.2] // Connects to the central road near the gym
  },
  { 
    id: 19, x: 1145, y: 1030, title: "19", 
    description: "BLDG 19 | NSTP Building", 
    image: require('./assets/USTP.jpg'), neighbors: [1003.3] 
  },
  { 
    id: 20, 
    x: 995, y: 1000, 
    title: "20", 
    description: "BLDG 20 | Cafeteria", 
    image: require('./assets/USTP.jpg'),
    neighbors: [1003.4, 1003.05]
  },
  { 
    id: 21, 
    x: 860, y: 1070, 
    title: "21", 
    description: "BLDG 21 | Guard House", 
    image: require('./assets/USTP.jpg'),
    neighbors: [1001]
  },
  { 
    id: 23, 
    x: 645, y: 460, 
    title: "23", 
    description: "BLDG 23 | Learning Resource Center", 
    image: require('./assets/USTP.jpg'),
    neighbors: [1016.5, 1024, 1028] // New waypoint needed for the West road
  },
  { 
    id: 24, x: 497, y: 580, title: "24", 
    description: "BLDG 24 | Girl's Trade Building", 
    image: require('./assets/USTP.jpg'), neighbors: [1018.2, 1024] 
  },
  { 
    id: 25, 
    x: 670, y: 605, 
    title: "25", 
    description: "BLDG 25 | Food Innovation Center", 
    image: require('./assets/USTP.jpg'),
    neighbors: [1016.2]
  },
  { 
    id: 27, x: 595, y: 700, 
    title: "27", 
    description: "BLDG 27 | University Health Center Building / Office of Student Affairs (OSA)", 
    image: require('./assets/USTP.jpg'), neighbors: [1016.3] 
  },
  { 
    id: 28, 
    x: 685, y: 730, 
    title: "28", 
    description: "BLDG 28 | Old Science Building", 
    image: require('./assets/USTP.jpg'),
    neighbors: [1014]
  },
  { 
    id: 35, x: 455, y: 755,
    title: "35", 
    description: "BLDG 35 | Old Education Building", 
    image: require('./assets/USTP.jpg'), neighbors: [1018.1] 
  },
  { 
    id: 36, x: 410, y: 640, 
    title: "36", 
    description: "BLDG 36 | Old Student Center", 
    image: require('./assets/USTP.jpg'), neighbors: [1018.2] 
  },
  { 
    id: 41, x: 750, y: 825, 
    title: "41", 
    description: "BLDG 41 | Science Complex", 
    image: require('./assets/USTP.jpg'), neighbors: [1003.6] 
  },
  { 
    id: 42, x: 1100, y: 1095, 
    title: "42", 
    description: "BLDG 42 | Engineering Complex I (Right Wing)", 
    image: require('./assets/USTP.jpg'), neighbors: [1003.3] 
  },
  { 
    id: 43, x: 980, y: 1108, 
    title: "43", 
    description: "BLDG 43 | Engineering Complex II (Left Wing)", 
    image: require('./assets/USTP.jpg'), neighbors: [1001.3] 
  },
  { 
    id: 44, 
    x: 660, y: 1010, 
    title: "44", 
    description: "BLDG 44 | Student Center & Education Complex", 
    image: require('./assets/USTP.jpg'),
    neighbors: []
  },
  { 
    id: 45, x: 360, y: 505, title: "45", 
    description: "BLDG 45 | Mechanical Laboratory Shop", 
    image: require('./assets/USTP.jpg'), neighbors: [1020] 
  },
  { 
    id: 47, 
    x: 490, y: 380, 
    title: "47", 
    description: "BLDG 47 | Technology Building", 
    image: require('./assets/USTP.jpg'), neighbors: [1022, 1023] 
  },
  { 
    id: 50, x: 1425, y: 765, title: "50",
    description: "BLDG 50 | Faculty Learning Resource Center", 
    image: require('./assets/USTP.jpg'), neighbors: [1007.1] 
  },
  { 
    id: 51, x: 760, y: 240, title: "51", 
    description: "BLDG 51 | Dormitory", 
    image: require('./assets/USTP.jpg'), neighbors: [1032] 
  },
  { 
    id: 52, x: 345, y: 405, title: "52", 
    description: "BLDG 52 | Fab Lab Building", 
    image: require('./assets/USTP.jpg'), neighbors: [1021] 
  },
  
  // --- INVISIBLE WAYPOINTS (Road Network) ---
  // Central crossings and main road connections
  { title: "1001", id: 1001, x: 900, y: 1050, isInvisible: true, neighbors: [0, 1002] },
  { title: "1001.1", id: 1001.1, x: 922, y: 1082, isInvisible: true, neighbors: [1001] },
  { title: "1001.11", id: 1001.11, x: 954, y: 1068, isInvisible: true, neighbors: [1001.1] },
  { title: "1001.2", id: 1001.2, x: 983, y: 1064, isInvisible: true, neighbors: [1001.11] },
  { title: "1001.3", id: 1001.3, x: 997, y: 1095, isInvisible: true, neighbors: [1001.2] },
  { title: "1001.4", id: 1001.4, x: 1078, y: 1080, isInvisible: true, neighbors: [1001.3, 42] },
  { title: "1002", id: 1002, x: 935, y: 990, isInvisible: true, neighbors: [1001, 1003] },
  { title: "1003", id: 1003, x: 910, y: 910, isInvisible: true, neighbors: [1002, 1003.5] },
  { title: "1003.05", id: 1003.05, x: 980, y: 885, isInvisible: true, neighbors: [1003, 1003.1] },
  { title: "1003.1", id: 1003.1, x: 1060, y: 850, isInvisible: true, neighbors: [1003.05, 1004] },
  { title: "1003.2", id: 1003.2, x: 1075, y: 920, isInvisible: true, neighbors: [1003.1, "SL1"] },
  { title: "1003.3", id: 1003.3, x: 1100, y: 1030, isInvisible: true, neighbors: [1001.4, 1003.2] },
  { title: "1003.4", id: 1003.4, x: 1051, y: 1016, isInvisible: true, neighbors: [1001.4, 1003.3] },
  { title: "1003.5", id: 1003.5, x: 890, y: 860, isInvisible: true, neighbors: [1003] },
  { title: "1003.6", id: 1003.6, x: 875, y: 820, isInvisible: true, neighbors: [1003.5, 1013] },

  // Eastern sector waypoints
  { title: "1004", id: 1004, x: 1125, y: 820, isInvisible: true, neighbors: [1003.1, 1005] },
  { title: "1005", id: 1005, x: 1120, y: 770, isInvisible: true, neighbors: [1004, 1005.1, 1011] },
  { title: "1005.1", id: 1005.1, x: 1205, y: 757, isInvisible: true, neighbors: [1005.2, 1006] },
  { title: "1005.2", id: 1005.2, x: 1155, y: 725, isInvisible: true, neighbors: [1005.1, 1011] },
  { title: "1006", id: 1006, x: 1260, y: 750, isInvisible: true, neighbors: [1005.1, 1007.1, 1006.1] },
  { title: "1006.1", id: 1006.1, x: 1240, y: 690, isInvisible: true, neighbors: [1006, 1010] },
  { title: "1007", id: 1007, x: 1440, y: 720, isInvisible: true, neighbors: [1008] },
  { title: "1007.1", id: 1007.1, x: 1400, y: 730, isInvisible: true, neighbors: [1007] },
  { title: "1008", id: 1008, x: 1435, y: 650, isInvisible: true, neighbors: [1007, 1009] },
  { title: "1009", id: 1009, x: 1525, y: 640, isInvisible: true, neighbors: [1008] },
  { title: "1010", id: 1010, x: 1185, y: 630, isInvisible: true, neighbors: [1006.1] },

  // Central-North sector waypoints
  { title: "1011", id: 1011, x: 1110, y: 695, isInvisible: true, neighbors: [1005, 1005.2, 1038] },
  { title: "1012", id: 1012, x: 1095, y: 595, isInvisible: true, neighbors: [1010, 1038, 1017] },
  { title: "1013", id: 1013, x: 838, y: 720, isInvisible: true, neighbors: [1003.6] },
  { title: "1013.1", id: 1013.1, x: 860, y: 710, isInvisible: true, neighbors: [1013] },
  { title: "1013.2", id: 1013.2, x: 865, y: 680, isInvisible: true, neighbors: [1013.1, 1015.1] },
  { title: "1013.3", id: 1013.3, x: 895, y: 720, isInvisible: true, neighbors: [1013.1] },
  { title: "1013.4", id: 1013.4, x: 905, y: 690, isInvisible: true, neighbors: [15] },

  // Western-Central sector waypoints
  { title: "1014", id: 1014, x: 826, y: 693, isInvisible: true, neighbors: [1013, 1015] },
  { title: "1015", id: 1015, x: 820, y: 670, isInvisible: true, neighbors: [1016] },
  { title: "1015.1", id: 1015.1, x: 850, y: 665, isInvisible: true, neighbors: [1015] },
  { title: "1015.2", id: 1015.2, x: 785, y: 575, isInvisible: true, neighbors: [1016, 1026] },
  { title: "1016", id: 1016, x: 795, y: 605, isInvisible: true, neighbors: [1015, 1025] },
  { title: "1016.1", id: 1016.1, x: 980, y: 535, isInvisible: true, neighbors: [1012, 1025, 1017] },
  { title: "1016.2", id: 1016.2, x: 680, y: 652, isInvisible: true, neighbors: [1016, 1016.3] },
  { title: "1016.3", id: 1016.3, x: 583, y: 675, isInvisible: true, neighbors: [1016.2, 1018] },
  { title: "1016.4", id: 1016.4, x: 543, y: 570, isInvisible: true, neighbors: [1016.3] },
  { title: "1016.5", id: 1016.5, x: 520, y: 515, isInvisible: true, neighbors: [1016.4] },
  { title: "1016.6", id: 1016.6, x: 510, y: 480, isInvisible: true, neighbors: [1016.5, 1020] },
  { title: "1017", id: 1017, x: 1075, y: 495, isInvisible: true, neighbors: [1012, 1034] },
  { title: "1018", id: 1018, x: 498, y: 710, isInvisible: true, neighbors: [1016.3] },
  { title: "1018.1", id: 1018.1, x: 515, y: 745, isInvisible: true, neighbors: [1018] },
  { title: "1018.2", id: 1018.2, x: 470, y: 625, isInvisible: true, neighbors: [1018] },
  { title: "1019", id: 1019, x: 585, y: 920, isInvisible: true, neighbors: [1018.1] },
  { title: "1020", id: 1020, x: 425, y: 510, isInvisible: true, neighbors: [1018.2] },
  { title: "1021", id: 1021, x: 385, y: 400, isInvisible: true, neighbors: [1020] },

  // Northern sector waypoints
  { title: "1022", id: 1022, x: 425, y: 460, isInvisible: true, neighbors: [1016.6, 1020] },
  { title: "1023", id: 1023, x: 570, y: 418, isInvisible: true, neighbors: [1016.6] },
  { title: "1024", id: 1024, x: 655, y: 532, isInvisible: true, neighbors: [1016.4] },
  { title: "1025", id: 1025, x: 820, y: 595, isInvisible: true, neighbors: [1016, 1016.1, 1017] },
  { title: "1026", id: 1026, x: 795, y: 530, isInvisible: true, neighbors: [1025] },
  { title: "1027", id: 1027, x: 745, y: 495, isInvisible: true, neighbors: [1026] },
  { title: "1028", id: 1028, x: 730, y: 450, isInvisible: true, neighbors: [1027] },
  { title: "1029", id: 1029, x: 705, y: 400, isInvisible: true, neighbors: [1028] },
  { title: "1030", id: 1030, x: 812, y: 300, isInvisible: true, neighbors: [1029] },
  { title: "1031", id: 1031, x: 832, y: 243, isInvisible: true, neighbors: [1030, 1033] },
  { title: "1032", id: 1032, x: 775, y: 219, isInvisible: true, neighbors: [1031] },
  { title: "1033", id: 1033, x: 950, y: 300, isInvisible: true, neighbors: [1032] },
  { title: "1034", id: 1034, x: 1020, y: 400, isInvisible: true, neighbors: [1033] },

  // Connection waypoints
  { title: "1035", id: 1035, x: 1000, y: 690, isInvisible: true, neighbors: [1036] },
  { title: "1036", id: 1036, x: 1023, y: 683, isInvisible: true, neighbors: [1038, 1011] },
  { title: "1038", id: 1038, x: 1105, y: 660, isInvisible: true, neighbors: [1011, 1036, 1012] },
  { title: "1039", id: 1039, x: 1065, y: 790, isInvisible: true, neighbors: [1036, 1003.1, 1011] },


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
