import React, { useState } from 'react';
import { StyleSheet, View, Image, Modal, Text, TouchableOpacity, TextInput, FlatList, Dimensions } from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';
import Icon from 'react-native-vector-icons/FontAwesome';
import Svg, { Circle, Text as SvgText, Polyline } from 'react-native-svg';
import { pins } from './pinsData';

const { width, height } = Dimensions.get('window');

const App = () => {
  const [selectedPin, setSelectedPin] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isSearchVisible, setSearchVisible] = useState(false);
  const [isCampusVisible, setCampusVisible] = useState(false);
  const [savedPins, setSavedPins] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomScale, setZoomScale] = useState(1);
  
  // Modals state
  const [isPinsModalVisible, setPinsModalVisible] = useState(false);
  const [isAboutModalVisible, setAboutModalVisible] = useState(false);
  
  // Pathfinding State
  const [pathfindingMode, setPathfindingMode] = useState(false);
  const [showPathfindingPanel, setShowPathfindingPanel] = useState(false);
  const [pointA, setPointA] = useState(null);
  const [pointB, setPointB] = useState(null);
  const [path, setPath] = useState([]);
  
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

  return (
    <View style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        {/* QR Code Button (Left) */}
        <TouchableOpacity style={styles.headerButtonLeft} onPress={() => alert("QR Code Scanner Coming Soon!")}>
          <Icon name="qrcode" size={20} color="white" />
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
        <View style={styles.bottomNavCard}>
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
        </View>
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
              {path.length > 1 && (
                <Polyline
                  points={path.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#4caf50"
                  strokeWidth={4 / zoomScale}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              
              {pins.map((pin) => {
                // HIDE INVISIBLE WAYPOINTS
                // We don't render the circle or text, but they are still used for the path line
                if (pin.isInvisible) return null;
                
                // Determine pin color based on state
                let fillColor = "#ffffff"; // Default to white
                let strokeColor = "#333333"; // Dark, visible outline
                let strokeWidth = 3; // Thicker stroke for visibility
                let radius = 20 / zoomScale; // Significantly larger radius for better visibility
                
                // Check if pin is clicked/selected
                if (clickedPin === pin.id) {
                  fillColor = "#ff6b6b"; // Red when clicked
                  strokeColor = "#c92a2a";
                  radius = 22 / zoomScale; // Slightly larger when selected
                }
                // Check if pin is in pathfinding mode
                else if (showPathfindingPanel || pathfindingMode) {
                  if (pointA && pin.id === pointA.id) {
                    fillColor = "#4ecdc4"; // Cyan for point A
                    strokeColor = "#2d9cdb";
                    radius = 22 / zoomScale;
                  } else if (pointB && pin.id === pointB.id) {
                    fillColor = "#ff6b6b"; // Red for point B
                    strokeColor = "#c92a2a";
                    radius = 22 / zoomScale;
                  } else if (path.some(p => p.id === pin.id)) {
                    fillColor = "#ffe66d"; // Yellow for path waypoints
                    strokeColor = "#f59e0b";
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
                      y={pin.y + (5 / zoomScale)} // Adjusted offset for larger pin
                      fill={fillColor === "#ffffff" ? "#000000" : "white"} // Black text for white pins, white otherwise
                      fontSize={Math.max(12, 14 / zoomScale)} // Larger font size
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
          onPress={() => setAboutModalVisible(true)}>
          <Icon name="info-circle" size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.middleFooterButton} onPress={togglePinsModal}>
          <Icon name="list" size={20} color="white" />
          <Text style={styles.buttonText}>View All Pins</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton} onPress={() => alert("Saving pins functionality coming soon!")}>
          <Icon name="bookmark" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* --- MODALS --- */}

      {/* About Us Modal */}
      <Modal visible={isAboutModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Team Chokols</Text>
            <View style={styles.line}></View>
            <Text style={styles.modalTitle}>Members:</Text>
            <Text style={styles.modalText}>Kenth Jonard Barbarona</Text>
            <Text style={styles.modalText}>Carl Salvo</Text>
            <Text style={styles.modalText}>Nathan Perez</Text>
            <Text style={styles.modalText}>Ryan Otacan</Text>
            <Text style={styles.modalTitle}>BSIT-3R13</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setAboutModalVisible(false)}>
              <Text style={styles.closeText}>Close</Text>
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
            <Image source={selectedPin?.image} style={styles.pinImage} resizeMode="cover" />
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
                data={pins}
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
    backgroundColor: '#28a745', padding: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center', width: 60, height: 40
  },
  headerButtonCenter: {
    backgroundColor: '#28a745', padding: 8, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', width: 150, height: 40
  },
  headerButtonRight: {
    backgroundColor: '#28a745', padding: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center', width: 60, height: 40
  },
  
  // NEW STYLE: Pathfinding Button positioned below Search
  pathfindingButtonBelowSearch: {
    position: 'absolute',
    top: 80, // 30 (header top) + 40 (header height) + 10 (spacing)
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
  iconButton: { backgroundColor: '#28a745', padding: 10, borderRadius: 5, flexDirection: 'row', alignItems: 'center' },
  closeButton: { backgroundColor: '#05bbf7', padding: 10, borderRadius: 5, marginTop: 10 },
  footer: { position: 'absolute', bottom: 30, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 1 },
  footerButton: { backgroundColor: '#28a745', padding: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center', width: 60, height: 40 },
  
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
  },
  goNowButtonDisabled: {
    backgroundColor: '#ccc',
  },
  goNowButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  middleFooterButton: { backgroundColor: '#28a745', padding: 8, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', width: 150, height: 40 },
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
});

export default App;