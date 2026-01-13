// pinsData.js
// Separated into facilitiesPins (visible) and waypointPins (invisible) for better organization

// --- VISIBLE FACILITY PINS ---
export const facilitiesPins = [
  { 
    id: 0, 
    x: 900, 
    y: 1115, 
    title: "ME", 
    description: "Main Entrance", 
    image: require('./assets/USTP.jpg'),
    neighbors: [1001, 1001.1],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: "SL1", x: 1040, y: 940, title: "SL", 
    description: "Student Lounge 1", 
    image: require('./assets/USTP.jpg'), 
    neighbors: [1003.05, 20, 1003.4, 1003.3],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: "SL2", x: 1040, y: 725, title: "SL", 
    description: "Student Lounge 2", 
    image: require('./assets/USTP.jpg'), 
    neighbors: [1039, 1036, 1038, 1011, 1005],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: "BF", x: 805, y: 905, title: "BF", 
    description: "Big Foot / Student Lounge 3", 
    image: require('./assets/USTP.jpg'), 
    neighbors: [1003.5],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 1037, x: 1000, y: 635, title: "DC ", 
    description: "Display Center / Cashier", 
    image: require('./assets/USTP.jpg'), 
    neighbors: [15, 1036],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: "OF", x: 930, y: 380, title: "OF", 
    description: "Open Field", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038877/openfield_ypsemx.jpg", 
    neighbors: [1030, 1034, 1026, 1029],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: "MC", x: 970, y: 500, title: "MC", 
    description: "Movable Classrooms", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038878/movableclassrooms_ltduj2.jpg", 
    neighbors: [1016.1],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 1, 
    x: 1580, 
    y: 630, 
    title: "1", 
    description: "BLDG 1 | Arts & Culture Building", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768037837/building1_m5gci2.jpg",
    neighbors: [1009],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 2, 
    x: 1520, 
    y: 605, 
    title: "2", 
    description: "BLDG 2 | Guidance and Testing Center", 
    image: require('./assets/USTP.jpg'),
    neighbors: [1009],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 3, 
    x: 1480, 
    y: 700, 
    title: "3", 
    description: "BLDG 3 | College of Medicine", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038850/building3_jup9rs.jpg",
    neighbors: [1009],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 5, 
    x: 1280, 
    y: 790, 
    title: "5", 
    description: "BLDG 5 | Old Engineering Building", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038852/building5_mxtnlg.jpg",
    neighbors: [1006],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 6, 
    x: 1555, 
    y: 740, 
    title: "6", 
    description: "BLDG 6", 
    image: require('./assets/USTP.jpg'),
    neighbors: [1009],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 9, 
    x: 1215, 
    y: 590, 
    title: "9", 
    description: "BLDG 9 | Information Communication Technology Building (ICT)", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038851/building9_zx9vy4.jpg",
    neighbors: [1010],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 10, 
    x: 1175, 
    y: 695, 
    title: "10", 
    description: "BLDG 10 | Administration Building", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038847/building10_i4x2km.jpg",
    neighbors: [1005.2],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 14, 
    x: 1017, 
    y: 595, 
    title: "14", 
    description: "BLDG 14 | Finance & Accounting Building / Senior High School Building (Across the ICT BLDG.)", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038849/building14_uz7s43.jpg",
    neighbors: [1012, 1016.1],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 15, 
    x: 895, 
    y: 663, 
    title: "15", 
    description: "BLDG 15 | Gymnasium Lobby", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038854/building15_isg7iv.jpg",
    neighbors: [1013.2],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 16, 
    x: 970, 
    y: 750, 
    title: "16", 
    description: "BLDG 16 | Gymnasium / DRER Memorial Hall", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038850/building16_vokhql.jpg",
    neighbors: [1013.3, 1013.4, 1035],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 18, 
    x: 1130, y: 905, 
    title: "18", 
    description: "BLDG 18 | Culinary Building", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038857/building18_vqtgwf.jpg",
    neighbors: [1003.2],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 19, x: 1145, y: 1030, title: "19", 
    description: "BLDG 19 | NSTP Building", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038875/building45_pkelmk.jpg", 
    neighbors: [1003.3],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 20, 
    x: 995, y: 1000, 
    title: "20", 
    description: "BLDG 20 | Cafeteria", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038855/building20_gjkqk6.jpg",
    neighbors: [1003.4, 1003.05],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 21, 
    x: 860, y: 1070, 
    title: "21", 
    description: "BLDG 21 | Guard House", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038870/building21_a6g69k.jpg",
    neighbors: [1001],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 23, 
    x: 645, y: 460, 
    title: "23", 
    description: "BLDG 23 | Learning Resource Center", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038863/building23_rg6rmr.jpg",
    neighbors: [1016.5, 1024],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 24, x: 497, y: 580, title: "24", 
    description: "BLDG 24 | Girl's Trade Building", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038865/building24_znbzpi.jpg", 
    neighbors: [1018.2],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 25, 
    x: 670, y: 605, 
    title: "25", 
    description: "BLDG 25 | Food Innovation Center", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038859/building25_mj2scd.jpg",
    neighbors: [1016.2],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 26, 
    x: 745, y: 550, 
    title: "26", 
    description: "BLDG 26 | Food Innovation Center", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038864/building26_nkog0a.jpg",
    neighbors: [1015.2],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 27, x: 595, y: 700, 
    title: "27", 
    description: "BLDG 27 | University Health Center Building / Office of Student Affairs (OSA)", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038864/building27_kme3fl.jpg", 
    neighbors: [1016.3],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 28, 
    x: 685, y: 730, 
    title: "28", 
    description: "BLDG 28 | Old Science Building", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038872/building28_ubxdtp.jpg",
    neighbors: [1014],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 35, x: 455, y: 755,
    title: "35", 
    description: "BLDG 35 | Old Education Building", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038870/building35_ick079.jpg", 
    neighbors: [1018.1],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 36, x: 410, y: 640, 
    title: "36", 
    description: "BLDG 36 | Old Student Center", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038872/building36_rtbq3v.jpg", 
    neighbors: [1018.2],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 41, x: 750, y: 825, 
    title: "41", 
    description: "BLDG 41 | Science Complex", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038870/building41_g0onoo.jpg", 
    neighbors: [1003.6],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 42, x: 1100, y: 1095, 
    title: "42", 
    description: "BLDG 42 | Engineering Complex I (Right Wing)", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038870/building42_saqwx1.jpg", 
    neighbors: [1003.3],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 43, x: 980, y: 1108, 
    title: "43", 
    description: "BLDG 43 | Engineering Complex II (Left Wing)", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038873/building43_afnzep.jpg", 
    neighbors: [1001.3],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 44, 
    x: 660, y: 1010, 
    title: "44", 
    description: "BLDG 44 | Student Center & Education Complex", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038875/building44_putgkq.jpg",
    neighbors: [],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 45, x: 360, y: 505, title: "45", 
    description: "BLDG 45 | Mechanical Laboratory Shop", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038875/building45_pkelmk.jpg", 
    neighbors: [1020],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 47, 
    x: 490, y: 380, 
    title: "47", 
    description: "BLDG 47 | Technology Building", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038876/building47_lxwtam.jpg", 
    neighbors: [1022, 1023],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 50, x: 1425, y: 765, title: "50",
    description: "BLDG 50 | Faculty Learning Resource Center", 
    image: require('./assets/USTP.jpg'), 
    neighbors: [1007.1],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 51, x: 760, y: 240, title: "51", 
    description: "BLDG 51 | Dormitory", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038875/building51_woaw27.jpg", 
    neighbors: [1032],
    pinType: 'facility',
    isVisible: true
  },
  { 
    id: 52, x: 345, y: 405, title: "52", 
    description: "BLDG 52 | Fab Lab Building", 
    image: "https://res.cloudinary.com/dun83uvdm/image/upload/v1768038876/building52_btlbeb.jpg", 
    neighbors: [1021],
    pinType: 'facility',
    isVisible: true
  },
];

// --- INVISIBLE WAYPOINT PINS (Road Network) ---
export const waypointPins = [
  // Central crossings and main road connections
  { title: "1001", id: 1001, x: 900, y: 1050, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [0, 1002] },
  { title: "1001.1", id: 1001.1, x: 922, y: 1082, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1001] },
  { title: "1001.11", id: 1001.11, x: 954, y: 1068, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1001.1] },
  { title: "1001.2", id: 1001.2, x: 983, y: 1064, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1001.11] },
  { title: "1001.3", id: 1001.3, x: 997, y: 1095, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1001.2] },
  { title: "1001.4", id: 1001.4, x: 1078, y: 1080, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1001.3, 42] },
  { title: "1002", id: 1002, x: 935, y: 990, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1001, 1003] },
  { title: "1003", id: 1003, x: 910, y: 910, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1002, 1003.5] },
  { title: "1003.05", id: 1003.05, x: 980, y: 885, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1003, 1003.1] },
  { title: "1003.1", id: 1003.1, x: 1060, y: 850, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1003.05, 1004] },
  { title: "1003.2", id: 1003.2, x: 1075, y: 920, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1003.1, "SL1"] },
  { title: "1003.3", id: 1003.3, x: 1100, y: 1030, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1001.4, 1003.2] },
  { title: "1003.4", id: 1003.4, x: 1051, y: 1016, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1001.4, 1003.3] },
  { title: "1003.5", id: 1003.5, x: 890, y: 860, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1003] },
  { title: "1003.6", id: 1003.6, x: 875, y: 820, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1003.5, 1013] },

  // Eastern sector waypoints
  { title: "1004", id: 1004, x: 1125, y: 820, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1003.1, 1005] },
  { title: "1005", id: 1005, x: 1120, y: 770, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1004, 1005.1, 1011] },
  { title: "1005.1", id: 1005.1, x: 1205, y: 757, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1005.2, 1006] },
  { title: "1005.2", id: 1005.2, x: 1155, y: 725, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1005.1, 1011] },
  { title: "1006", id: 1006, x: 1260, y: 750, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1005.1, 1007.1, 1006.1] },
  { title: "1006.1", id: 1006.1, x: 1240, y: 690, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1006, 1010] },
  { title: "1007", id: 1007, x: 1440, y: 720, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1008] },
  { title: "1007.1", id: 1007.1, x: 1400, y: 730, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1007] },
  { title: "1008", id: 1008, x: 1435, y: 650, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1007, 1009] },
  { title: "1009", id: 1009, x: 1525, y: 640, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1008] },
  { title: "1010", id: 1010, x: 1185, y: 630, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1006.1] },

  // Central-North sector waypoints
  { title: "1011", id: 1011, x: 1110, y: 695, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1005, 1005.2, 1038] },
  { title: "1012", id: 1012, x: 1095, y: 595, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1010, 1038, 1017] },
  { title: "1013", id: 1013, x: 838, y: 720, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1003.6] },
  { title: "1013.1", id: 1013.1, x: 860, y: 710, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1013] },
  { title: "1013.2", id: 1013.2, x: 865, y: 680, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1013.1, 1015.1] },
  { title: "1013.3", id: 1013.3, x: 895, y: 720, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1013.1] },
  { title: "1013.4", id: 1013.4, x: 905, y: 690, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [15] },

  // Western-Central sector waypoints
  { title: "1014", id: 1014, x: 826, y: 693, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1013, 1015] },
  { title: "1015", id: 1015, x: 820, y: 670, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1016] },
  { title: "1015.1", id: 1015.1, x: 850, y: 665, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1015] },
  { title: "1015.2", id: 1015.2, x: 785, y: 575, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1016, 1026] },
  { title: "1016", id: 1016, x: 795, y: 605, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1015, 1025] },
  { title: "1016.1", id: 1016.1, x: 980, y: 535, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1012, 1025, 1017] },
  { title: "1016.2", id: 1016.2, x: 680, y: 652, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1016, 1016.3] },
  { title: "1016.3", id: 1016.3, x: 583, y: 675, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1016.2, 1018] },
  { title: "1016.4", id: 1016.4, x: 543, y: 570, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1016.3] },
  { title: "1016.5", id: 1016.5, x: 520, y: 515, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1016.4] },
  { title: "1016.6", id: 1016.6, x: 510, y: 480, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1016.5, 1020] },
  { title: "1017", id: 1017, x: 1075, y: 495, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1012, 1034] },
  { title: "1018", id: 1018, x: 498, y: 710, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1016.3] },
  { title: "1018.1", id: 1018.1, x: 515, y: 745, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1018] },
  { title: "1018.2", id: 1018.2, x: 470, y: 625, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1018] },
  { title: "1019", id: 1019, x: 585, y: 920, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1018.1] },
  { title: "1020", id: 1020, x: 425, y: 510, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1018.2] },
  { title: "1021", id: 1021, x: 385, y: 400, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1020] },

  // Northern sector waypoints
  { title: "1022", id: 1022, x: 425, y: 460, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1016.6, 1020] },
  { title: "1023", id: 1023, x: 570, y: 418, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1016.6] },
  { title: "1024", id: 1024, x: 655, y: 532, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1016.4, 1027] },
  { title: "1025", id: 1025, x: 820, y: 595, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1016, 1016.1, 1017] },
  { title: "1026", id: 1026, x: 795, y: 530, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1025] },
  { title: "1027", id: 1027, x: 745, y: 495, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1026] },
  { title: "1028", id: 1028, x: 730, y: 450, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1027] },
  { title: "1029", id: 1029, x: 705, y: 400, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1028] },
  { title: "1030", id: 1030, x: 812, y: 300, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1029] },
  { title: "1031", id: 1031, x: 832, y: 243, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1030, 1033] },
  { title: "1032", id: 1032, x: 775, y: 219, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1031] },
  { title: "1033", id: 1033, x: 950, y: 300, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1032] },
  { title: "1034", id: 1034, x: 1020, y: 400, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1033] },

  // Connection waypoints
  { title: "1035", id: 1035, x: 1000, y: 690, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1036] },
  { title: "1036", id: 1036, x: 1023, y: 683, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1038, 1011] },
  { title: "1038", id: 1038, x: 1105, y: 660, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1011, 1036, 1012] },
  { title: "1039", id: 1039, x: 1065, y: 790, pinType: 'waypoint', isVisible: false, isInvisible: true, neighbors: [1036, 1003.1, 1011] },
];

// Combined export for backward compatibility
export const pins = [...facilitiesPins, ...waypointPins];

// Instructions:
// - facilitiesPins: Visible facility pins with pinType: 'facility', isVisible: true
// - waypointPins: Invisible waypoint pins with pinType: 'waypoint', isVisible: false
// - pins: Combined array for backward compatibility
// - All pins maintain neighbors array for pathfinding connections
// - Facilities and waypoints are connected via neighbors array
// - All facilitiesPins should have QR codes (can be set via admin panel)
