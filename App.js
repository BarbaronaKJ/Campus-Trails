import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Image, Modal, Text, TouchableOpacity, TextInput, FlatList, Dimensions, ScrollView, Switch, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageZoom from 'react-native-image-pan-zoom';
import Icon from 'react-native-vector-icons/FontAwesome';
import Svg, { Circle, Text as SvgText, Polyline } from 'react-native-svg';
import { pins } from './pinsData';

const { width, height } = Dimensions.get('window');

// Backend API URL - change this to your server address
const API_URL = 'http://10.13.136.168:5000/api/facilities';

const App = () => {
  const [selectedPin, setSelectedPin] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isSearchVisible, setSearchVisible] = useState(false);
  const [isCampusVisible, setCampusVisible] = useState(false);
  const [savedPins, setSavedPins] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomScale, setZoomScale] = useState(1);
  
  // Facilities data from backend
  const [facilities, setFacilities] = useState({});
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  
  // Modals state
  const [isPinsModalVisible, setPinsModalVisible] = useState(false);
  // Settings Modal State (replaces About modal)
  const [isSettingsVisible, setSettingsVisible] = useState(false);
  const [settingsTab, setSettingsTab] = useState('general'); // 'general' | 'about'
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [settingsTab, fadeAnim]);
  // Filter Modal State
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState({});
  
  // Pathfinding State
  const [pathfindingMode, setPathfindingMode] = useState(false);
  const [showPathfindingPanel, setShowPathfindingPanel] = useState(false);
  const [pointA, setPointA] = useState(null);
  const [pointB, setPointB] = useState(null);
  const [path, setPath] = useState([]);
  // Animated driver for pathfinding panel slide-in
  const pathfindingSlideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (showPathfindingPanel) {
      pathfindingSlideAnim.setValue(300);
      Animated.timing(pathfindingSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showPathfindingPanel, pathfindingSlideAnim]);
  
  // Location Picker State
  const [isLocationPickerVisible, setLocationPickerVisible] = useState(false);
  const [activeSelector, setActiveSelector] = useState(null); // 'A' for start, 'B' for destination
  const [clickedPin, setClickedPin] = useState(null); // Track clicked pin for color change
  
  // Alert Modal State
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const campuses = [
    "USTP-Alubijid", "USTP-CDO", "USTP-Claveria", "USTP-Villanueva",
    "USTP-Balubal", "USTP-Jasaan", "USTP-Oroquieta", "USTP-Panaon"
  ];

  // Fetch facilities from backend on app mount
  useEffect(() => {
    // Add small delay to ensure backend is ready
    const timer = setTimeout(() => {
      fetchFacilities();
    }, 2000); // 2 second delay
    
    return () => clearTimeout(timer);
  }, []);

  const fetchFacilities = async () => {
    try {
      // Try to fetch from backend
      const response = await fetch(API_URL, {
        timeout: 5000 // 5 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        const facilitiesMap = {};
        data.forEach(facility => {
          facilitiesMap[facility.building] = facility;
        });
        setFacilities(facilitiesMap);
        
        // Cache the data for offline use
        await AsyncStorage.setItem('facilitiesCache', JSON.stringify(facilitiesMap));
        console.log('✅ Facilities loaded from backend');
      } else {
        throw new Error('Backend unavailable');
      }
    } catch (error) {
      console.log('⚠️ Backend unavailable, loading from cache');
      
      // Load from cache if backend fails
      try {
        const cached = await AsyncStorage.getItem('facilitiesCache');
        if (cached) {
          setFacilities(JSON.parse(cached));
          console.log('✅ Facilities loaded from cache');
        }
      } catch (cacheError) {
        console.log('⚠️ No cached facilities available');
      }
    } finally {
      setFacilitiesLoading(false);
    }
  };

  // Helper function to get facility image URL for a pin
  const getFacilityImage = (pin) => {
    if (!pin.building) return pin.image; // Fallback to local image
    
    const facility = facilities[pin.building];
    if (facility && facility.imageUrl) {
      return { uri: facility.imageUrl }; // Remote URL from backend
    }
    
    return pin.image; // Fallback to local bundled image
  };

  // Helper function to get facility data for a pin
  const getFacilityData = (pin) => {
    if (!pin.building) return null;
    return facilities[pin.building] || null;
  };

  const handlePinPress = (pin) => {
    setSelectedPin(pin);
    setModalVisible(true);
  };

  const savePin = () => {
    if (selectedPin && !savedPins.includes(selectedPin)) {
      setSavedPins([...savedPins, selectedPin]);
      alert(`${selectedPin.description} saved!`);
    }
  };

  const filteredPins = pins.filter((pin) =>
    (pin.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (pin.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCampusChange = (campus) => {
    alert("Other Campuses Coming Soon!");
    setCampusVisible(false);
  };

  // Category keywords mapping for basic filtering (matches against pin.description)
  const categoryKeywords = {
    'Commercial Zone': ['commercial'],
    'Admin / Operation Zone': ['admin', 'administration', 'office', 'offices'],
    'Academic Core Zone': ['college', 'science', 'engineering', 'ict', 'culinary', 'learning', 'education', 'faculty'],
    'Auxiliary Services Zone': ['student center', 'dormitory', 'open field', 'faculty learning'],
    'Dining': ['cafeteria', 'dining'],
    'Restrooms': ['restroom', 'toilet', 'comfort room'],
    'Water Refilling Stations': ['water', 'refill'],
    'Amenities': ['amenities'],
    'Laboratories': ['laboratory', 'laboratories', 'lab'],
    'Libraries': ['library', 'learning resource'],
    'Offices': ['office', 'offices', 'osa', 'administration'],
    'Clinic': ['health center', 'clinic', 'university health'],
    'Parking': ['parking', 'guard house'],
    'Security': ['guard', 'security', 'guard house']
  };

  const allCategoryKeys = Object.keys(categoryKeywords);

  const toggleFilterModal = () => setFilterModalVisible(!isFilterModalVisible);

  const pinMatchesSelected = (pin) => {
    // Always hide invisible pins
    if (pin.isInvisible) return false;

    const activeCats = allCategoryKeys.filter(cat => selectedCategories[cat]);
    if (activeCats.length === 0) return true; // no filter = show all

    const desc = (pin.description || '').toLowerCase();
    // If any selected category keywords match the pin description, show it
    for (const cat of activeCats) {
      const kws = categoryKeywords[cat] || [];
      for (const kw of kws) {
        if (kw && desc.indexOf(kw) !== -1) return true;
      }
    }
    return false;
  };

  const selectAllCategories = () => {
    const obj = {};
    allCategoryKeys.forEach(k => obj[k] = true);
    setSelectedCategories(obj);
  };

  const clearAllCategories = () => setSelectedCategories({});

  const toggleCategory = (cat) => {
    setSelectedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleSearch = () => setSearchVisible(!isSearchVisible);
  const toggleCampus = () => setCampusVisible(!isCampusVisible);
  const togglePinsModal = () => setPinsModalVisible(!isPinsModalVisible);

  // Calculate distance between two points
  const distance = (p1, p2) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  // STRICT GRAPH BUILDER
  // This ignores distance. It ONLY connects pins listed in your 'neighbors' array.
  const buildGraph = () => {
    const graph = {};

    // 1. Initialize all nodes
    pins.forEach(pin => {
      graph[pin.id] = [];
    });

    // 2. Create connections based strictly on the 'neighbors' array
    pins.forEach(pin => {
      if (pin.neighbors) {
        pin.neighbors.forEach(neighborId => {
          // Find the neighbor pin by ID (handles number vs string mismatch)
          const neighborPin = pins.find(p => p.id == neighborId);

          if (neighborPin) {
            const dist = distance(pin, neighborPin);
            
            // Add connection FROM pin TO neighbor
            graph[pin.id].push({ id: neighborPin.id, distance: dist });
            
            // AUTOMATICALLY add connection FROM neighbor TO pin (Bi-directional)
            // This prevents broken paths if you forgot to add the reverse ID in pinsData
            const alreadyConnected = graph[neighborPin.id].some(n => n.id == pin.id);
            if (!alreadyConnected) {
              graph[neighborPin.id].push({ id: pin.id, distance: dist });
            }
          }
        });
      }
    });

    return graph;
  };

  // A* pathfinding algorithm
  const aStarPathfinding = (startId, endId) => {
    try {
      const graph = buildGraph();
      const allNodes = pins;
      const start = allNodes.find(p => p.id === startId);
      const end = allNodes.find(p => p.id === endId);
      
      if (!start || !end) {
        console.log('Start or end pin not found');
        return [];
      }

      // Check if start and end are the same
      if (startId === endId) {
        return [start];
      }

      const openSet = [{ id: startId, f: 0, g: 0, h: distance(start, end), parent: null }];
      const closedSet = new Set();
      const cameFrom = {};
      const maxIterations = 1000; // Prevent infinite loops
      let iterations = 0;

      while (openSet.length > 0 && iterations < maxIterations) {
        iterations++;
        
        // Sort and get node with lowest f score
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift();

        if (current.id === endId) {
          // Reconstruct path - include ALL nodes (including invisible waypoints) for proper path visualization
          const path = [];
          let node = endId;
          while (node !== null && node !== undefined) {
            const nodeData = allNodes.find(p => p.id === node);
            if (nodeData) {
              // Include ALL nodes in the path (including invisible waypoints)
              path.unshift(nodeData);
            }
            node = cameFrom[node];
            // Safety check to prevent infinite loop
            if (path.length > allNodes.length) {
              console.log('Path reconstruction error: path too long');
              return [];
            }
          }
          return path;
        }

        closedSet.add(current.id);
        const neighbors = graph[current.id] || [];

        for (const neighbor of neighbors) {
          if (closedSet.has(neighbor.id)) continue;

          const neighborNode = allNodes.find(p => p.id === neighbor.id);
          if (!neighborNode) continue;

          const g = current.g + neighbor.distance;
          const h = distance(neighborNode, end);
          const f = g + h;

          const existingNodeIndex = openSet.findIndex(n => n.id === neighbor.id);
          if (existingNodeIndex === -1) {
            openSet.push({ id: neighbor.id, f, g, h, parent: current.id });
            cameFrom[neighbor.id] = current.id;
          } else if (g < openSet[existingNodeIndex].g) {
            openSet[existingNodeIndex].g = g;
            openSet[existingNodeIndex].f = f;
            openSet[existingNodeIndex].parent = current.id;
            cameFrom[neighbor.id] = current.id;
          }
        }
      }

      if (iterations >= maxIterations) {
        console.log('Pathfinding reached max iterations');
      }
      
      return []; // No path found
    } catch (error) {
      console.error('Pathfinding error:', error);
      return [];
    }
  };

  const resetPathfinding = () => {
    setPathfindingMode(false);
    setShowPathfindingPanel(false);
    setPointA(null);
    setPointB(null);
    setPath([]);
  };

  const handleStartPathfinding = () => {
    if (!pointA || !pointB) {
      setAlertMessage('Please select both start and end points');
      setShowAlertModal(true);
      return;
    }

    // Force strict equality check to avoid self-selection issues
    if (pointA.id == pointB.id) {
      setAlertMessage('Start and end points cannot be the same');
      setShowAlertModal(true);
      return;
    }

    setTimeout(() => {
      try {
        const foundPath = aStarPathfinding(pointA.id, pointB.id);
        
        if (foundPath.length > 0) {
          // DEBUGGING: Show path length in console (comment out for production)
          console.log(`Path found with ${foundPath.length} steps:`, foundPath.map(p => p.id));
          
          setPath(foundPath);
          setPathfindingMode(true);
          setShowPathfindingPanel(false);
          // No alert on success - path is shown on map
        } else {
          setAlertMessage('No path found. Check your "neighbors" IDs in pinsData.js');
          setShowAlertModal(true);
        }
      } catch (error) {
        console.error(error);
        setAlertMessage('Error calculating path');
        setShowAlertModal(true);
      }
    }, 0);
  };

  const swapPoints = () => {
    const temp = pointA;
    setPointA(pointB);
    setPointB(temp);
  };

  const openLocationPicker = (selector) => {
    setActiveSelector(selector);
    setLocationPickerVisible(true);
  };

  const handleLocationSelect = (pin) => {
    if (activeSelector === 'A') {
      setPointA(pin);
    } else if (activeSelector === 'B') {
      setPointB(pin);
    }
    setLocationPickerVisible(false);
    setActiveSelector(null);
  };

  // Calculate image dimensions
  const imageWidth = width * 1.5; 
  const imageHeight = (imageWidth * 1310) / 1920; 

  // Compute pins visible after applying category filters
  const visiblePinsForRender = pins.filter(pin => pinMatchesSelected(pin));

  return (
    <View style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        {/* Notifications button (left) to keep center button centered */}
        <TouchableOpacity style={styles.headerButtonLeft} onPress={() => alert('Notifications coming soon!')}>
          <Icon name="bell" size={20} color="white" />
        </TouchableOpacity>

        {/* Change Campus Button (Center) */}
        <TouchableOpacity style={styles.headerButtonCenter} onPress={toggleCampus}>
          <Icon name="exchange" size={20} color="white" />
          <Text style={styles.buttonText}>USTP-CDO</Text>
        </TouchableOpacity>

        {/* Search Button (Right) */}
        <TouchableOpacity style={styles.headerButtonRight} onPress={toggleSearch}>
          <Icon name="search" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Filter Button (moved) - sits between Search and Pathfinding */}
      <TouchableOpacity style={styles.filterButtonBetween} onPress={toggleFilterModal}>
        <Icon name="filter" size={20} color="white" />
      </TouchableOpacity>

      {/* Pathfinding Toggle Button - Now positioned below Search button with same design */}
      <TouchableOpacity 
        style={styles.pathfindingButtonBelowSearch}
        onPress={() => {
          if (showPathfindingPanel) {
            resetPathfinding();
          } else {
            setShowPathfindingPanel(true);
            setPathfindingMode(false);
            setPath([]);
          }
        }}
      >
        <Icon name={showPathfindingPanel ? "times" : "location-arrow"} size={20} color="white" />
      </TouchableOpacity>

      {/* Bottom Pathfinding Navigation Card */}
      {showPathfindingPanel && (
        <Animated.View style={[styles.bottomNavCard, { transform: [{ translateY: pathfindingSlideAnim }] }]}>
          {/* Origin/Destination Display */}
          <View style={styles.locationRow}>
            <TouchableOpacity 
              style={styles.locationItem}
              onPress={() => openLocationPicker('A')}
            >
              <View style={styles.locationIconContainer}>
                <Icon name="crosshairs" size={18} color="#4caf50" />
              </View>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Your place (Start)</Text>
                <Text style={styles.locationValue}>
                  {pointA ? pointA.description : 'Tap to select location...'}
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.swapButtonSmall} onPress={swapPoints}>
              <Icon name="exchange" size={18} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.locationRow}>
            <TouchableOpacity 
              style={styles.locationItem}
              onPress={() => openLocationPicker('B')}
            >
              <View style={[styles.locationIconContainer, { backgroundColor: '#e8f5e9' }]}>
                <Icon name="map-marker" size={18} color="#4caf50" />
              </View>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Destination</Text>
                <Text style={styles.locationValue} numberOfLines={1}>
                  {pointB ? pointB.description : 'Tap to select destination...'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Go Now Button */}
          <TouchableOpacity 
            style={[styles.goNowButton, (!pointA || !pointB) && styles.goNowButtonDisabled]} 
            onPress={handleStartPathfinding}
            disabled={!pointA || !pointB}
          >
            <Icon name="paper-plane" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.goNowButtonText}>Go Now</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Map with Zoom */}
      <View style={styles.imageContainer}>
        <ImageZoom
          cropWidth={width}
          cropHeight={height}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          minScale={1}
          maxScale={3}
          enableCentering={false}
          cropOffset={0}
          onScaleChanged={(scale) => setZoomScale(scale)}
        >
          <View style={{ width: imageWidth, height: imageHeight }}>
            <Image
              source={require('./assets/ustp-cdo-map.png')}
              style={{ width: imageWidth, height: imageHeight }}
              resizeMode="contain"
            />
            {/* Overlay SVG for Pins and Path */}
            <Svg 
              height={imageHeight} 
              width={imageWidth} 
              viewBox="0 0 1920 1310"
              style={StyleSheet.absoluteFill}
            >
              {/* Draw pathfinding path if exists */}
              <Polyline
                points={path.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#87bf24"
                // Ensure the line is at least 3 pixels wide regardless of zoom
                strokeWidth={Math.max(3, 12 / zoomScale)} 
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="1" // Increased opacity for better visibility
/>
              
              {visiblePinsForRender.map((pin) => {
                // HIDE INVISIBLE WAYPOINTS
                // We don't render the circle or text, but they are still used for the path line
                if (pin.isInvisible) return null;
                
                // Determine pin color based on state
                let fillColor = "#f0f0f0"; // Default light gray
                let strokeColor = "#4a4a4a"; // Medium gray outline
                let strokeWidth = 2.5;
                let radius = 20 / zoomScale;
                
                // Check if pin is clicked/selected
                if (clickedPin === pin.id) {
                  fillColor = "#FF6B6B"; // Vibrant red when clicked
                  strokeColor = "#D32F2F";
                  radius = 24 / zoomScale;
                  strokeWidth = 3;
                }
                // Check if pin is in pathfinding mode
                else if (showPathfindingPanel || pathfindingMode) {
                  if ((pointA && pin.id === pointA.id) || (pointB && pin.id === pointB.id)) {
                    // Same color for both point A and B - vibrant cyan
                    fillColor = "#00D4FF"; // Bright cyan
                    strokeColor = "#0099CC";
                    radius = 24 / zoomScale;
                    strokeWidth = 3;
                  } else if (path.some(p => p.id === pin.id)) {
                    fillColor = "#FFD700"; // Golden yellow for path waypoints
                    strokeColor = "#FFA500";
                    strokeWidth = 2.5;
                  }
                }
                
                return (
                  <React.Fragment key={pin.id}>
                    {/* Pin Circle */}
                    <Circle
                      cx={pin.x}
                      cy={pin.y}
                      r={radius}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth / zoomScale}
                      onPress={() => handlePinPress(pin)}
                    />
                    {/* Building Number Text */}
                    <SvgText
                      x={pin.x}
                      y={pin.y + (4 / zoomScale)}
                      fill={fillColor === "#f0f0f0" || fillColor === "#ffffff" ? "#000000" : "#ffffff"}
                      fontSize={Math.max(13, 15 / zoomScale)}
                      fontWeight="bold"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                    >
                      {pin.title}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>
        </ImageZoom>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.footerButton} 
          onPress={() => setSettingsVisible(true)}>
          <Icon name="cog" size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.middleFooterButton} onPress={togglePinsModal}>
          <Icon name="list" size={20} color="white" />
          <Text style={styles.buttonText}>View All Pins</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton} onPress={() => alert("User login coming soon!")}>
          <Icon name="user" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* --- MODALS --- */}

      {/* Settings Modal (full screen) */}
      <Modal visible={isSettingsVisible} transparent={false} animationType="slide">
        <View style={styles.settingsScreen}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ width: 40 }}>
              {settingsTab === 'about' && (
                <TouchableOpacity onPress={() => setSettingsTab('general')}>
                  <Icon name="arrow-left" size={20} color="#333" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.modalTitle, { marginBottom: 0 }]}>Settings</Text>
            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
              <Icon name="times" size={20} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={styles.line}></View>

          <View style={styles.settingsTabRow}>
            <TouchableOpacity onPress={() => setSettingsTab('general')} style={[styles.settingsTabButton, settingsTab === 'general' && styles.settingsTabActive]}>
              <Text style={settingsTab === 'general' ? styles.settingsTabActiveText : { color: '#333' }}>General</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSettingsTab('about'); fadeAnim.setValue(0); }} style={[styles.settingsTabButton, settingsTab === 'about' && styles.settingsTabActive]}>
              <Text style={settingsTab === 'about' ? styles.settingsTabActiveText : { color: '#333' }}>About Us</Text>
            </TouchableOpacity>
          </View>

          {settingsTab === 'general' && (
            <Animated.View style={[styles.aboutContent, { opacity: fadeAnim }]}>
              <Text style={styles.settingsPlaceholder}></Text>
            </Animated.View>
          )}

          {settingsTab === 'about' && (
            <Animated.ScrollView style={[styles.aboutContent, { opacity: fadeAnim }]}>
              <View style={styles.aboutSection}>
                <Text style={styles.aboutTitle}>Campus Trails</Text>
                <View style={styles.aboutLine}></View>
                <Text style={styles.aboutLabel}>Members:</Text>
                <View style={styles.membersList}>
                  <Text style={styles.memberItem}>Kenth Jonard Barbarona</Text>
                  <Text style={styles.memberItem}>Cyle Audrey Villarte</Text>
                  <Text style={styles.memberItem}>Rafael Estorosas</Text>
                  <Text style={styles.memberItem}>Christian Ferdinand Reantillo</Text>
                  <Text style={styles.memberItem}>Gwynnever Tutor</Text>
                </View>
                <Text style={styles.classYear}>USTP-BSIT</Text>
              </View>
            </Animated.ScrollView>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={() => setSettingsVisible(false)}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Filter Modal (replaces QR scanner) */}
      <Modal visible={isFilterModalVisible} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
          <View style={styles.filterModalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.modalTitle, { marginBottom: 0 }]}>Explore Campus</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Icon name="times" size={20} color={'#333'} />
              </TouchableOpacity>
            </View>
            <View style={styles.line}></View>
            <View style={styles.filterTopControls}>
              <TouchableOpacity onPress={selectAllCategories} style={[styles.filterActionButton, { marginRight: 12 }]}>
                <Text style={styles.filterActionButtonText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearAllCategories} style={styles.filterActionButtonClear}>
                <Text style={styles.filterActionButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>

            {/* Category Groups */}
            <ScrollView style={{ width: '100%' }}>
              {[
                { title: 'Building Legends', items: ['Commercial Zone','Admin / Operation Zone','Academic Core Zone','Auxiliary Services Zone'] },
                { title: 'Essentials', items: ['Dining','Restrooms','Water Refilling Stations','Amenities'] },
                { title: 'Academic', items: ['Laboratories','Libraries','Offices'] },
                { title: 'Safety & Access', items: ['Clinic','Parking','Security'] }
              ].map(group => (
                <View key={group.title} style={styles.categoryGroup}>
                  <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>{group.title}</Text>
                  {group.items.map(cat => (
                    <TouchableOpacity key={cat} style={styles.categoryItem} onPress={() => toggleCategory(cat)}>
                      <Icon name={selectedCategories[cat] ? 'check-square' : 'square-o'} size={18} color="#333" />
                      <Text style={styles.checkboxLabel}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={[styles.closeButton, { alignSelf: 'stretch', marginTop: 8 }]} onPress={() => setFilterModalVisible(false)}>
              <Text style={styles.closeText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal for Pin Details (Clicked from map) */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>{selectedPin?.description}</Text>
            <View style={styles.line}></View>
            <Image source={selectedPin ? getFacilityImage(selectedPin) : null} style={styles.pinImage} resizeMode="cover" />
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.iconButton} onPress={savePin}>
                <Icon name="bookmark" size={20} color="white" />
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => alert('Share functionality coming soon!')}>
                <Icon name="share-alt" size={20} color="white" />
                <Text style={styles.buttonText}>Share</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => {
              setModalVisible(false);
              setClickedPin(null); // Reset clicked pin when modal closes
            }}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Main Search Modal */}
      {isSearchVisible && (
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search for..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <FlatList
            data={filteredPins.slice(0, 3)}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handlePinPress(item)}>
                <Text style={styles.searchItem}>
                  <Text style={styles.searchDescription}>{item.description}</Text>
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* View All Pins Modal */}
        {isPinsModalVisible && (
          <Modal visible={isPinsModalVisible} transparent animationType="slide">
            <View style={styles.modalContainer}>
              <View style={styles.pinsModalContent}>
               <FlatList
                  // FILTER: Only include pins where isInvisible is NOT true
                  data={pins.filter(pin => !pin.isInvisible)} 
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handlePinPress(item)} style={styles.pinItem}>
                        <Text style={styles.pinDescription}>{item.description}</Text>
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity style={styles.closeButton} onPress={togglePinsModal}>
                  <Text style={styles.buttonText}>  Close    </Text>
              </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

      {/* Location Picker Modal (For Point A and Point B) */}
      <Modal visible={isLocationPickerVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.pinsModalContent}>
            <Text style={styles.modalTitle}>
               Select {activeSelector === 'A' ? 'Start Point' : 'Destination'}
            </Text>
            <FlatList
              data={pins.filter(pin => !pin.isInvisible)}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleLocationSelect(item)} style={styles.pinItem}>
                  <Text style={styles.pinDescription}>{item.description || item.title || 'Unknown'}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setLocationPickerVisible(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Alert Modal */}
      <Modal visible={showAlertModal} transparent={true} animationType="fade">
        <View style={styles.alertModalOverlay}>
          <View style={styles.alertModalContainer}>
            <Text style={styles.alertModalTitle}>Alert</Text>
            <Text style={styles.alertModalMessage}>{alertMessage}</Text>
            <TouchableOpacity 
              style={styles.alertModalButton}
              onPress={() => setShowAlertModal(false)}
            >
              <Text style={styles.alertModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Campus Change Modal */}
      {isCampusVisible && (
        <View style={styles.campusContainer}>
          <FlatList
            data={campuses}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleCampusChange(item)}>
                <Text style={styles.searchItem}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#34495e' },
  header: {
    position: 'absolute', top: 30, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 1
  },
  headerButtonLeft: {
    backgroundColor: '#28a745', padding: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center', width: 60, height: 40,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerButtonCenter: {
    backgroundColor: '#28a745', padding: 8, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', width: 150, height: 40,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerButtonRight: {
    backgroundColor: '#28a745', padding: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center', width: 60, height: 40,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  
  // NEW STYLE: Pathfinding Button positioned below Search
  pathfindingButtonBelowSearch: {
    position: 'absolute',
    top: 130, // moved lower to make room for filter button
    right: 20, // Aligned with header button
    backgroundColor: '#28a745', // Same green
    padding: 8,
    borderRadius: 8, // Same radius
    alignItems: 'center',
    justifyContent: 'center',
    width: 60, // Same width
    height: 40, // Same height
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  // Filter Button placed between Search and Pathfinding (right side)
  filterButtonBetween: {
    position: 'absolute',
    top: 80, // between header (30) and pathfinding (130)
    right: 20,
    backgroundColor: '#28a745',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 40,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  buttonText: { color: 'white', textAlign: 'center', marginLeft: 8 },
  imageContainer: { flex: 1 },
  mapImage: { width: '100%', height: '100%' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalDescription: { marginBottom: 10, fontWeight: 'bold' },
  modalText: { fontSize: 14, marginBottom: 5 },
  line: { borderBottomWidth: 1, borderBottomColor: '#ccc', marginVertical: 10 },
  pinImage: { width: '100%', height: 200, borderRadius: 10, marginVertical: 10 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  iconButton: { backgroundColor: '#28a745', padding: 10, borderRadius: 5, flexDirection: 'row', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.22, shadowRadius: 2.22 },
  closeButton: { backgroundColor: '#05bbf7', padding: 10, borderRadius: 5, marginTop: 10, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.22, shadowRadius: 2.22 },
  footer: { position: 'absolute', bottom: 30, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 1 },
  footerButton: { backgroundColor: '#28a745', padding: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center', width: 60, height: 40, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  
  bottomNavCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
    zIndex: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  locationItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 8,
    backgroundColor: '#f9f9f9'
  },
  locationIconContainer: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2,
    textTransform: 'uppercase'
  },
  locationValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  swapButtonSmall: {
    padding: 8,
    marginLeft: 10,
  },
  goNowButton: {
    backgroundColor: '#4caf50',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  goNowButtonDisabled: {
    backgroundColor: '#ccc',
  },
  goNowButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  middleFooterButton: { backgroundColor: '#28a745', padding: 8, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', width: 150, height: 40, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  pinsModalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '90%', maxHeight: '70%', alignItems: 'center' },
  pinItem: { borderBottomWidth: 1, borderBottomColor: '#ccc', paddingVertical: 10, paddingHorizontal: 5, width: '100%' },
  pinDescription: { fontSize: 14, color: '#666' },
  searchContainer: { position: 'absolute', top: 80, left: 20, right: 20, backgroundColor: 'white', padding: 10, borderRadius: 10 },
  campusContainer: { position: 'absolute', top: 80, left: 20, right: 20, backgroundColor: 'white', padding: 10, borderRadius: 10 },
  searchInput: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginBottom: 10 },
  searchItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  searchTitle: { fontWeight: 'bold' },
  searchDescription: { fontStyle: 'italic', color: '#888' },
  closeText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  
  // Alert Modal Styles
  alertModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertModalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  alertModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000',
  },
  alertModalMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    lineHeight: 22,
  },
  alertModalButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'flex-end',
  },
  alertModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  filterModalContent: { backgroundColor: 'white', padding: 16, borderRadius: 10, width: '90%', maxHeight: '80%' },
  filterTopControls: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 },
  filterActionButton: { backgroundColor: '#28a745', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  filterActionButtonClear: { backgroundColor: '#f44336', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  filterActionButtonText: { color: 'white', fontWeight: '600' },
  categoryGroup: { marginBottom: 12 },
  categoryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  checkboxLabel: { marginLeft: 10, color: '#333' },
  settingsScreen: { flex: 1, backgroundColor: 'white', paddingTop: 40, padding: 20, paddingBottom: 0 },
  aboutContent: { flex: 1, marginVertical: 20, paddingBottom: 100 },
  settingsPlaceholder: { fontSize: 14, color: '#999', fontStyle: 'italic' },
  aboutSection: { paddingVertical: 10 },
  aboutTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  aboutLine: { borderBottomWidth: 2, borderBottomColor: '#28a745', marginVertical: 12 },
  aboutLabel: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 12 },
  membersList: { paddingLeft: 8, marginBottom: 16 },
  memberItem: { fontSize: 14, color: '#666', paddingVertical: 6, paddingLeft: 8, borderLeftWidth: 3, borderLeftColor: '#28a745' },
  classYear: { fontSize: 14, fontWeight: 'bold', color: '#28a745', marginTop: 12 },
  settingsTabText: { color: '#333' },
  settingsTabActiveText: { color: '#fff' },
});

export default App;