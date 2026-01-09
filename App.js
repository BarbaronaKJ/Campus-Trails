import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Image, ImageBackground, Modal, Text, TouchableOpacity, Pressable, TextInput, FlatList, Dimensions, ScrollView, Switch, Animated, BackHandler, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';
import Icon from 'react-native-vector-icons/FontAwesome';
import Svg, { Circle, Text as SvgText, Polyline } from 'react-native-svg';
import { pins } from './pinsData';
import { styles } from './styles';
import { aStarPathfinding } from './utils/pathfinding';
import { allCategoryKeys, pinMatchesSelected, categoryPinIds } from './utils/categoryFilter';
import { campuses } from './constants';
import { building9Rooms } from './constants/rooms';
import { interpolateColor, interpolateBlueColor, interpolateRedColor, THROTTLE_MS } from './utils/colorInterpolation';
import { getPinCategory, getCategorizedPins } from './utils/pinCategories';
import { getAllRooms, getFilteredPins, getFilteredRooms, getSearchResults } from './utils/searchUtils';
import { handlePinPress as handlePinPressUtil, savePin as savePinUtil, handleCampusChange as handleCampusChangeUtil } from './utils/handlers';

const { width, height } = Dimensions.get('window');

const App = () => {
  const [selectedPin, setSelectedPin] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isSearchVisible, setSearchVisible] = useState(false);
  const [isCampusVisible, setCampusVisible] = useState(false);
  const [savedPins, setSavedPins] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomScale, setZoomScale] = useState(1);
  // Zoom and pan state for programmatic control
  const [zoomToPin, setZoomToPin] = useState(null); // { pin, zoom, panX, panY }
  
  // Modals state
  const [isPinsModalVisible, setPinsModalVisible] = useState(false);
  // Settings Modal State (replaces About modal)
  const [isSettingsVisible, setSettingsVisible] = useState(false);
  const [settingsTab, setSettingsTab] = useState('general'); // 'general' | 'about'
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // Path line style setting (dot, dash, or solid)
  const [pathLineStyle, setPathLineStyle] = useState('dash'); // 'dot', 'dash', or 'solid'
  
  // Color settings for active pins during pathfinding
  const [pointAColorLight, setPointAColorLight] = useState({ r: 100, g: 181, b: 246 }); // Light blue default
  const [pointAColorDark, setPointAColorDark] = useState({ r: 25, g: 118, b: 210 }); // Dark blue default
  const [pointBColorLight, setPointBColorLight] = useState({ r: 239, g: 83, b: 80 }); // Light red default
  const [pointBColorDark, setPointBColorDark] = useState({ r: 198, g: 40, b: 40 }); // Dark red default
  
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
  // Track if pathfinding panel should be rendered (for animation)
  const [pathfindingPanelRendered, setPathfindingPanelRendered] = useState(false);
  // Track if pins modal should be rendered (for animation)
  const [pinsModalRendered, setPinsModalRendered] = useState(false);
  // Track if settings modal should be rendered (for animation)
  const [settingsRendered, setSettingsRendered] = useState(false);
  // Track if filter modal should be rendered (for animation)
  const [filterModalRendered, setFilterModalRendered] = useState(false);
  // Track if search modal should be rendered (for animation)
  const [searchRendered, setSearchRendered] = useState(false);
  // Track if campus modal should be rendered (for animation)
  const [campusRendered, setCampusRendered] = useState(false);
  // Track if pin detail modal should be rendered (for animation)
  const [pinDetailModalRendered, setPinDetailModalRendered] = useState(false);
  // Track if building details modal should be rendered (for animation)
  const [buildingDetailsRendered, setBuildingDetailsRendered] = useState(false);
  const [isBuildingDetailsVisible, setBuildingDetailsVisible] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState('Ground Floor');
  const [cameFromPinDetails, setCameFromPinDetails] = useState(false);
  // Track if login modal should be rendered (for animation)
  const [loginModalRendered, setLoginModalRendered] = useState(false);
  const [isLoginModalVisible, setLoginModalVisible] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Animated driver for pathfinding panel slide-in/out
  const pathfindingSlideAnim = useRef(new Animated.Value(0)).current;
  // Animated driver for pins modal slide-in/out
  const pinsModalSlideAnim = useRef(new Animated.Value(0)).current;
  // Animated driver for settings modal slide-in/out
  const settingsSlideAnim = useRef(new Animated.Value(0)).current;
  // Animated driver for filter modal scale/fade
  const filterModalAnim = useRef(new Animated.Value(0)).current;
  // Animated driver for search modal fade
  const searchAnim = useRef(new Animated.Value(0)).current;
  // Animated driver for campus modal fade
  const campusAnim = useRef(new Animated.Value(0)).current;
  // Animated driver for pin detail modal scale/fade
  const pinDetailModalAnim = useRef(new Animated.Value(0)).current;
  // Animated driver for login modal slide-in/out
  const loginModalSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showPathfindingPanel) {
      // Set to bottom position first (before render to avoid flash)
      pathfindingSlideAnim.setValue(300);
      // Use requestAnimationFrame to ensure smooth render timing
      requestAnimationFrame(() => {
        setPathfindingPanelRendered(true);
        // Animate in with spring for smoothness
        requestAnimationFrame(() => {
          Animated.spring(pathfindingSlideAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        });
      });
    } else if (pathfindingPanelRendered) {
      // Animate out first
      Animated.timing(pathfindingSlideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Hide after animation completes
        setPathfindingPanelRendered(false);
      });
    }
  }, [showPathfindingPanel, pathfindingSlideAnim, pathfindingPanelRendered]);

  useEffect(() => {
    if (isPinsModalVisible) {
      // Set to bottom position first (before render to avoid flash)
      pinsModalSlideAnim.setValue(300);
      // Use requestAnimationFrame to ensure smooth render timing
      requestAnimationFrame(() => {
        setPinsModalRendered(true);
        // Animate in with spring for smoothness
        requestAnimationFrame(() => {
          Animated.spring(pinsModalSlideAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        });
      });
    } else if (pinsModalRendered) {
      // Animate out first
      Animated.timing(pinsModalSlideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Hide after animation completes
        setPinsModalRendered(false);
      });
    }
  }, [isPinsModalVisible, pinsModalSlideAnim, pinsModalRendered]);

  // Login Modal Animation
  useEffect(() => {
    if (isLoginModalVisible) {
      // Set to bottom position first (before render to avoid flash)
      loginModalSlideAnim.setValue(300);
      // Use requestAnimationFrame to ensure smooth render timing
      requestAnimationFrame(() => {
        setLoginModalRendered(true);
        // Animate in with spring for smoothness
        requestAnimationFrame(() => {
          Animated.spring(loginModalSlideAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        });
      });
    } else if (loginModalRendered) {
      // Animate out first
      Animated.timing(loginModalSlideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Hide after animation completes
        setLoginModalRendered(false);
      });
    }
  }, [isLoginModalVisible, loginModalSlideAnim, loginModalRendered]);

  // Settings Modal Animation
  useEffect(() => {
    if (isSettingsVisible) {
      // Set to bottom position first (before render to avoid flash)
      settingsSlideAnim.setValue(height);
      // Use requestAnimationFrame to ensure smooth render timing
      requestAnimationFrame(() => {
        setSettingsRendered(true);
        // Animate in with spring for smoothness
        requestAnimationFrame(() => {
          Animated.spring(settingsSlideAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        });
      });
    } else if (settingsRendered) {
      // Animate out first
      Animated.timing(settingsSlideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Hide after animation completes
        setSettingsRendered(false);
      });
    }
  }, [isSettingsVisible, settingsSlideAnim, settingsRendered, height]);

  // Filter Modal Animation
  useEffect(() => {
    if (isFilterModalVisible) {
      // Set to initial scale/opacity first (before render to avoid flash)
      filterModalAnim.setValue(0);
      // Use requestAnimationFrame to ensure smooth render timing
      requestAnimationFrame(() => {
        setFilterModalRendered(true);
        // Animate in with spring for smoothness
        requestAnimationFrame(() => {
          Animated.spring(filterModalAnim, {
            toValue: 1,
            tension: 65,
            friction: 11,
            useNativeDriver: false, // Scale requires false for web compatibility
          }).start();
        });
      });
    } else if (filterModalRendered) {
      // Animate out first
      Animated.timing(filterModalAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        // Hide after animation completes
        setFilterModalRendered(false);
      });
    }
  }, [isFilterModalVisible, filterModalAnim, filterModalRendered]);

  // Search Modal Animation
  useEffect(() => {
    if (isSearchVisible) {
      // Set to initial opacity first (before render to avoid flash)
      searchAnim.setValue(0);
      // Use requestAnimationFrame to ensure smooth render timing
      requestAnimationFrame(() => {
        setSearchRendered(true);
        // Animate in with spring for smoothness
        requestAnimationFrame(() => {
          Animated.spring(searchAnim, {
            toValue: 1,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        });
      });
    } else if (searchRendered) {
      // Animate out first
      Animated.timing(searchAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Hide after animation completes
        setSearchRendered(false);
      });
    }
  }, [isSearchVisible, searchAnim, searchRendered]);

  // Campus Modal Animation
  useEffect(() => {
    if (isCampusVisible) {
      // Set to initial opacity first (before render to avoid flash)
      campusAnim.setValue(0);
      // Use requestAnimationFrame to ensure smooth render timing
      requestAnimationFrame(() => {
        setCampusRendered(true);
        // Animate in with spring for smoothness
        requestAnimationFrame(() => {
          Animated.spring(campusAnim, {
            toValue: 1,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        });
      });
    } else if (campusRendered) {
      // Animate out first
      Animated.timing(campusAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Hide after animation completes
        setCampusRendered(false);
      });
    }
  }, [isCampusVisible, campusAnim, campusRendered]);

  // Building Details Modal Animation (slide from bottom like pins modal)
  const buildingDetailsSlideAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isBuildingDetailsVisible) {
      // Set to bottom position first (before render to avoid flash)
      buildingDetailsSlideAnim.setValue(300);
      // Use requestAnimationFrame to ensure smooth render timing
      requestAnimationFrame(() => {
        setBuildingDetailsRendered(true);
        // Animate in with spring for smoothness
        requestAnimationFrame(() => {
          Animated.spring(buildingDetailsSlideAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        });
      });
    } else if (buildingDetailsRendered) {
      // Animate out first
      Animated.timing(buildingDetailsSlideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Hide after animation completes
        setBuildingDetailsRendered(false);
      });
    }
  }, [isBuildingDetailsVisible, buildingDetailsSlideAnim, buildingDetailsRendered]);

  // Pin Detail Modal Animation
  useEffect(() => {
    if (isModalVisible) {
      // Set to bottom position first (before render to avoid flash)
      pinDetailModalAnim.setValue(height);
      // Use requestAnimationFrame to ensure smooth render timing
      requestAnimationFrame(() => {
        setPinDetailModalRendered(true);
        // Animate in with spring for smoothness
        requestAnimationFrame(() => {
          Animated.spring(pinDetailModalAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        });
      });
    } else if (pinDetailModalRendered) {
      // Animate out first
      Animated.timing(pinDetailModalAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Hide after animation completes
        setPinDetailModalRendered(false);
        setClickedPin(null); // Reset clicked pin when modal closes
      });
    }
  }, [isModalVisible, pinDetailModalAnim, pinDetailModalRendered, height]);
  
  // Location Picker State (moved up for pulse animation dependencies)
  const [isLocationPickerVisible, setLocationPickerVisible] = useState(false);
  const [activeSelector, setActiveSelector] = useState(null); // 'A' for start, 'B' for destination
  const [clickedPin, setClickedPin] = useState(null); // Track clicked pin for color change
  const [highlightedPinOnMap, setHighlightedPinOnMap] = useState(null); // Track pin to highlight on map
  
  // Color breathing animation for active pins (slow, smooth transition between sky blue and blue)
  const colorBreathAnim = useRef(new Animated.Value(0)).current;
  const [colorBreathValue, setColorBreathValue] = useState(0);
  const colorBreathAnimationRef = useRef(null);
  
  // Separate animations for pointA (blue) and pointB (red)
  const pointAAnim = useRef(new Animated.Value(0)).current;
  const [pointAValue, setPointAValue] = useState(0);
  const pointAAnimationRef = useRef(null);
  
  const pointBAnim = useRef(new Animated.Value(0)).current;
  const [pointBValue, setPointBValue] = useState(0);
  const pointBAnimationRef = useRef(null);
  
  const lastUpdateTime = useRef(0);
  const lastUpdateTimeA = useRef(0);
  const lastUpdateTimeB = useRef(0);
  
  // Wrapper functions for color interpolation with current state
  const interpolateColorWrapper = (value) => interpolateColor(value);
  const interpolateBlueColorWrapper = (value) => interpolateBlueColor(value, pointAColorLight, pointAColorDark);
  const interpolateRedColorWrapper = (value) => interpolateRedColor(value, pointBColorLight, pointBColorDark);
  
  // Animation for general active pins (highlighted, clicked)
  useEffect(() => {
    const hasActivePin = highlightedPinOnMap !== null || clickedPin !== null;
    
    if (hasActivePin) {
      colorBreathAnim.setValue(0);
      
      const listener = colorBreathAnim.addListener(({ value }) => {
        const now = Date.now();
        if (now - lastUpdateTime.current >= THROTTLE_MS) {
          setColorBreathValue(value);
          lastUpdateTime.current = now;
        }
      });
      
      colorBreathAnimationRef.current = Animated.loop(
        Animated.timing(colorBreathAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: false,
        })
      );
      colorBreathAnimationRef.current.start();
      
      return () => {
        colorBreathAnim.removeListener(listener);
        if (colorBreathAnimationRef.current) {
          colorBreathAnimationRef.current.stop();
        }
        lastUpdateTime.current = 0;
      };
    } else {
      if (colorBreathAnimationRef.current) {
        colorBreathAnimationRef.current.stop();
      }
      colorBreathAnim.setValue(0);
      setColorBreathValue(0);
      lastUpdateTime.current = 0;
    }
  }, [highlightedPinOnMap, clickedPin, colorBreathAnim]);
  
  // Animation for pointA (blue shades, very slow pulse)
  useEffect(() => {
    if (pointA && (showPathfindingPanel || pathfindingMode)) {
      pointAAnim.setValue(0);
      
      const listener = pointAAnim.addListener(({ value }) => {
        const now = Date.now();
        if (now - lastUpdateTimeA.current >= THROTTLE_MS) {
          setPointAValue(value);
          lastUpdateTimeA.current = now;
        }
      });
      
      pointAAnimationRef.current = Animated.loop(
        Animated.timing(pointAAnim, {
          toValue: 1,
          duration: 5000, // 5 seconds per cycle (very slow)
          useNativeDriver: false,
        })
      );
      pointAAnimationRef.current.start();
      
      return () => {
        pointAAnim.removeListener(listener);
        if (pointAAnimationRef.current) {
          pointAAnimationRef.current.stop();
        }
      };
    } else {
      if (pointAAnimationRef.current) {
        pointAAnimationRef.current.stop();
      }
      pointAAnim.setValue(0);
      setPointAValue(0);
    }
  }, [pointA, showPathfindingPanel, pathfindingMode, pointAAnim]);
  
  // Animation for pointB (red shades, very slow pulse)
  useEffect(() => {
    if (pointB && (showPathfindingPanel || pathfindingMode)) {
      pointBAnim.setValue(0);
      
      const listener = pointBAnim.addListener(({ value }) => {
        const now = Date.now();
        if (now - lastUpdateTimeB.current >= THROTTLE_MS) {
          setPointBValue(value);
          lastUpdateTimeB.current = now;
        }
      });
      
      pointBAnimationRef.current = Animated.loop(
        Animated.timing(pointBAnim, {
          toValue: 1,
          duration: 5000, // 5 seconds per cycle (very slow)
          useNativeDriver: false,
        })
      );
      pointBAnimationRef.current.start();
      
      return () => {
        pointBAnim.removeListener(listener);
        if (pointBAnimationRef.current) {
          pointBAnimationRef.current.stop();
        }
      };
    } else {
      if (pointBAnimationRef.current) {
        pointBAnimationRef.current.stop();
      }
      pointBAnim.setValue(0);
      setPointBValue(0);
    }
  }, [pointB, showPathfindingPanel, pathfindingMode, pointBAnim]);
  
  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Check if any modal/component is open and close it
      if (isLocationPickerVisible) {
        setLocationPickerVisible(false);
        return true; // Prevent default back behavior
      }
      if (isBuildingDetailsVisible) {
        setBuildingDetailsVisible(false);
        if (cameFromPinDetails) {
          setCameFromPinDetails(false);
          setModalVisible(true);
        }
        return true;
      }
      if (isModalVisible) {
        setModalVisible(false);
        return true;
      }
      if (isFilterModalVisible) {
        setFilterModalVisible(false);
        return true;
      }
      if (isSettingsVisible) {
        setSettingsVisible(false);
        return true;
      }
      if (isPinsModalVisible) {
        setPinsModalVisible(false);
        return true;
      }
      if (showPathfindingPanel) {
        setShowPathfindingPanel(false);
        setPathfindingMode(false);
        setPath([]);
        setPointA(null);
        setPointB(null);
        return true;
      }
      if (isSearchVisible) {
        setSearchVisible(false);
        return true;
      }
      if (isCampusVisible) {
        setCampusVisible(false);
        return true;
      }
      
      // No modals open - show exit confirmation
      Alert.alert(
        'Exit App',
        'Are you sure you want to exit Campus Trails?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Exit',
            onPress: () => BackHandler.exitApp(),
            style: 'destructive',
          },
        ],
        { cancelable: false }
      );
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, [
    isLocationPickerVisible,
    isBuildingDetailsVisible,
    cameFromPinDetails,
    isModalVisible,
    isFilterModalVisible,
    isSettingsVisible,
    isPinsModalVisible,
    showPathfindingPanel,
    isSearchVisible,
    isCampusVisible,
    isLoginModalVisible,
  ]);
  
  // Handle zoom to pin - workaround for react-native-image-pan-zoom limitations
  useEffect(() => {
    if (zoomToPin && zoomToPin.zoom) {
      // Since react-native-image-pan-zoom doesn't support direct programmatic control,
      // we use a workaround: force remount with a new key to reset the component
      // This is not ideal but works as a fallback
      // The pin is already highlighted, making it easy to find
      
      // Try to access internal state through ref
      if (imageZoomRef.current) {
        const ref = imageZoomRef.current;
        // Try to find and call internal methods
        if (ref._component) {
          // Access the internal component if available
          const internal = ref._component;
          if (internal.setNativeProps) {
            // Try to set native props directly
            // This is a workaround that may not work with all versions
          }
        }
      }
      
      // Force remount as fallback (resets zoom/pan but highlights pin)
      setImageZoomKey(prev => prev + 1);
      
      // Clear after a delay
      setTimeout(() => {
        setZoomToPin(null);
      }, 500);
    }
  }, [zoomToPin]);
  
  // ImageZoom ref for programmatic control
  const imageZoomRef = useRef(null);
  // Key for forcing ImageZoom remount when zooming to pin
  const [imageZoomKey, setImageZoomKey] = useState(0);
  
  // Alert Modal State
  const [showAlertModal, setShowAlertModal] = useState(false);

  // Building 9 room data
  const [alertMessage, setAlertMessage] = useState('');

  // Flatten all rooms from Building 9 for search
  const allRooms = React.useMemo(() => getAllRooms(), []);

  const filteredPins = React.useMemo(() => getFilteredPins(pins, searchQuery), [pins, searchQuery]);
  const filteredRooms = React.useMemo(() => getFilteredRooms(allRooms, searchQuery), [allRooms, searchQuery]);

  // Combine pins and rooms for search results
  const searchResults = React.useMemo(() => 
    getSearchResults(filteredPins, filteredRooms, 5), 
    [filteredPins, filteredRooms]
  );

  const handlePinPress = (pin) => {
    handlePinPressUtil(pin, setSelectedPin, setClickedPin, setHighlightedPinOnMap, {
      setSearchVisible,
      setCampusVisible,
      setFilterModalVisible,
      setShowPathfindingPanel,
      setSettingsVisible,
      setPinsModalVisible,
      setLocationPickerVisible,
      setModalVisible
    });
  };

  const savePin = () => {
    savePinUtil(selectedPin, savedPins, setSavedPins);
  };

  const handleCampusChange = (campus) => {
    handleCampusChangeUtil(setCampusVisible);
  };


  const toggleFilterModal = () => {
    setFilterModalVisible(!isFilterModalVisible);
    if (!isFilterModalVisible) {
      // Close other modals when opening filter
      setSearchVisible(false);
      setCampusVisible(false);
      setShowPathfindingPanel(false);
      setSettingsVisible(false);
      setPinsModalVisible(false);
      setLocationPickerVisible(false);
      setModalVisible(false);
    }
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

  const toggleSearch = () => {
    setSearchVisible(!isSearchVisible);
    if (!isSearchVisible) {
      // Close other modals when opening search
      setCampusVisible(false);
      setFilterModalVisible(false);
      setShowPathfindingPanel(false);
      setSettingsVisible(false);
      setPinsModalVisible(false);
      setLocationPickerVisible(false);
      setModalVisible(false);
    }
  };
  
  const toggleCampus = () => {
    setCampusVisible(!isCampusVisible);
    if (!isCampusVisible) {
      // Close other modals when opening campus
      setSearchVisible(false);
      setFilterModalVisible(false);
      setShowPathfindingPanel(false);
      setSettingsVisible(false);
      setPinsModalVisible(false);
      setLocationPickerVisible(false);
      setModalVisible(false);
    }
  };
  
  const togglePinsModal = () => {
    setPinsModalVisible(!isPinsModalVisible);
    if (!isPinsModalVisible) {
      // Close other modals when opening pins modal
      setSearchVisible(false);
      setCampusVisible(false);
      setFilterModalVisible(false);
      setShowPathfindingPanel(false);
      setSettingsVisible(false);
      setLocationPickerVisible(false);
      setModalVisible(false);
      setLoginModalVisible(false);
    }
  };

  const toggleLoginModal = () => {
    setLoginModalVisible(!isLoginModalVisible);
    if (!isLoginModalVisible) {
      // Close other modals when opening login modal
      setSearchVisible(false);
      setCampusVisible(false);
      setFilterModalVisible(false);
      setShowPathfindingPanel(false);
      setSettingsVisible(false);
      setLocationPickerVisible(false);
      setModalVisible(false);
      setPinsModalVisible(false);
    }
  };


  const resetPathfinding = () => {
    setPathfindingMode(false);
    setShowPathfindingPanel(false);
    setPointA(null);
    setPointB(null);
    setPath([]);
    // Clear highlighted pin when resetting pathfinding
    setHighlightedPinOnMap(null);
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
    // Close other modals when opening location picker
    setSearchVisible(false);
    setCampusVisible(false);
    setFilterModalVisible(false);
    setSettingsVisible(false);
    setPinsModalVisible(false);
    setModalVisible(false);
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
  // Always include pathfinding active pins (pointA and pointB) even if filtered out
  const visiblePinsForRender = pins.filter(pin => {
    // Always show pathfinding active pins
    if ((pointA && pin.id === pointA.id) || (pointB && pin.id === pointB.id)) {
      return true;
    }
    // Apply category filter for other pins
    return pinMatchesSelected(pin, selectedCategories);
  });

  // Helper function to get category for a pin (for View All Pins modal)
  // Organize pins by category for View All Pins modal
  const categorizedPins = React.useMemo(() => getCategorizedPins(pins), [pins]);

  return (
    <View style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        {/* Help button (left) to keep center button centered */}
        <TouchableOpacity style={styles.headerButtonLeft} onPress={() => alert('Help coming soon!')}>
          <Icon name="question-circle" size={20} color="white" />
        </TouchableOpacity>

        {/* Change Campus Button (Center) */}
        <TouchableOpacity style={styles.headerButtonCenter} onPress={toggleCampus}>
          <Icon name="exchange" size={20} color="white" />
          <Text style={styles.buttonText}>USTP-CDO</Text>
        </TouchableOpacity>

        {/* Search Button (Right) */}
        <TouchableOpacity style={styles.headerButtonRight} onPress={toggleSearch}>
          <Icon name={isSearchVisible ? "times" : "search"} size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Filter Button (moved) - sits between Search and Pathfinding */}
      <TouchableOpacity style={styles.filterButtonBetween} onPress={toggleFilterModal}>
        <Icon name={Object.values(selectedCategories).some(val => val === true) ? "times" : "filter"} size={20} color="white" />
      </TouchableOpacity>

      {/* Pathfinding Toggle Button - Now positioned below Search button with same design */}
      <TouchableOpacity 
        style={styles.pathfindingButtonBelowSearch}
        onPress={() => {
          if (showPathfindingPanel || pathfindingMode) {
            resetPathfinding();
          } else {
            // Close other modals when opening pathfinding panel
            setSearchVisible(false);
            setCampusVisible(false);
            setFilterModalVisible(false);
            setSettingsVisible(false);
            setPinsModalVisible(false);
            setLocationPickerVisible(false);
            setModalVisible(false);
            setShowPathfindingPanel(true);
            setPathfindingMode(false);
            setPath([]);
          }
        }}
      >
        <Icon name={(showPathfindingPanel || pathfindingMode) ? "times" : "location-arrow"} size={20} color="white" />
      </TouchableOpacity>

      {/* Bottom Pathfinding Navigation Card */}
      {pathfindingPanelRendered && (
        <Animated.View 
          style={[
            styles.bottomNavCard, 
            { 
              transform: [{ translateY: pathfindingSlideAnim }],
              opacity: pathfindingSlideAnim.interpolate({
                inputRange: [0, 150, 300],
                outputRange: [1, 0.5, 0],
              }),
            }
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeaderWhite}>
            <Text style={[styles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>Navigation</Text>
            <TouchableOpacity onPress={resetPathfinding}>
              <Icon name="times" size={20} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={styles.lineDark}></View>
          
          {/* Content */}
          <View style={{ backgroundColor: '#f5f5f5', padding: 20 }}>
            {/* Origin/Destination Display */}
            <View style={styles.locationRow}>
              <TouchableOpacity 
                style={styles.locationItem}
                onPress={() => openLocationPicker('A')}
              >
                <View style={[
                  styles.locationIconContainer,
                  {
                    backgroundColor: pointA && (showPathfindingPanel || pathfindingMode) 
                      ? interpolateBlueColorWrapper(pointAValue) 
                      : `rgb(${pointAColorDark.r}, ${pointAColorDark.g}, ${pointAColorDark.b})`
                  }
                ]}>
                  <Icon 
                    name="crosshairs" 
                    size={18} 
                    color="#ffffff" 
                  />
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
                <View style={[
                  styles.locationIconContainer,
                  {
                    backgroundColor: pointB && (showPathfindingPanel || pathfindingMode) 
                      ? interpolateRedColorWrapper(pointBValue) 
                      : `rgb(${pointBColorDark.r}, ${pointBColorDark.g}, ${pointBColorDark.b})`
                  }
                ]}>
                  <Icon 
                    name="map-marker" 
                    size={18} 
                    color="#ffffff" 
                  />
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
        </Animated.View>
      )}

      {/* Map with Zoom */}
      <View style={styles.imageContainer}>
        <ImageZoom
          key={imageZoomKey}
          ref={imageZoomRef}
          cropWidth={width}
          cropHeight={height}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          minScale={1}
          maxScale={3}
          enableCentering={false}
          cropOffset={0}
          onScaleChanged={(scale) => {
            setZoomScale(scale);
            // Clear zoom target when user manually changes zoom
            if (zoomToPin && Math.abs(scale - zoomToPin.zoom) > 0.2) {
              setZoomToPin(null);
            }
          }}
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
              {path.length > 0 && (
                <Polyline
                  points={path.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#00D4FF" // Sky blue
                  strokeWidth={Math.max(3, 12 / zoomScale)} 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={
                    pathLineStyle === 'dash' 
                      ? `${Math.max(8, 20 / zoomScale)} ${Math.max(12, 30 / zoomScale)}` 
                      : pathLineStyle === 'dot' 
                        ? `0 ${Math.max(16, 32 / zoomScale)}` 
                        : undefined
                  }
                  strokeDashoffset={pathLineStyle === 'dot' ? Math.max(8, 16 / zoomScale) : undefined}
                  opacity="1"
                />
              )}
              
              {visiblePinsForRender.map((pin) => {
                // HIDE INVISIBLE WAYPOINTS
                // We don't render the circle or text, but they are still used for the path line
                if (pin.isInvisible) return null;
                
                // Determine pin color based on state
                let fillColor = "#f0f0f0"; // Default light gray
                let strokeColor = "#4a4a4a"; // Medium gray outline
                let strokeWidth = 2.5;
                let radius = 20 / zoomScale;
                let isActive = false; // Track if pin is active for pulsing animation
                
                // Check if pin is highlighted on map (from "Show on Map" button)
                if (highlightedPinOnMap === pin.id) {
                  radius = 24 / zoomScale;
                  strokeWidth = 3;
                  isActive = true;
                }
                // Check if pin is clicked/selected
                else if (clickedPin === pin.id) {
                  radius = 24 / zoomScale;
                  strokeWidth = 3;
                  isActive = true;
                }
                // Check if pin is in pathfinding mode
                else if (showPathfindingPanel || pathfindingMode) {
                  if (pointA && pin.id === pointA.id) {
                    radius = 24 / zoomScale;
                    strokeWidth = 3;
                    isActive = true;
                    // Use blue shades for pointA
                    fillColor = interpolateBlueColorWrapper(pointAValue);
                    const colorMatch = fillColor.match(/\d+/g);
                    if (colorMatch && colorMatch.length >= 3) {
                      const r = Math.max(0, Math.round(parseInt(colorMatch[0]) - 20));
                      const g = Math.max(0, Math.round(parseInt(colorMatch[1]) - 20));
                      const b = Math.max(0, Math.round(parseInt(colorMatch[2]) - 20));
                      strokeColor = `rgb(${r}, ${g}, ${b})`;
                    } else {
                      strokeColor = `rgb(${Math.max(0, pointAColorDark.r - 20)}, ${Math.max(0, pointAColorDark.g - 20)}, ${Math.max(0, pointAColorDark.b - 20)})`; // Fallback dark blue
                    }
                  } else if (pointB && pin.id === pointB.id) {
                    radius = 24 / zoomScale;
                    strokeWidth = 3;
                    isActive = true;
                    // Use red shades for pointB
                    fillColor = interpolateRedColorWrapper(pointBValue);
                    const colorMatch = fillColor.match(/\d+/g);
                    if (colorMatch && colorMatch.length >= 3) {
                      const r = Math.max(0, Math.round(parseInt(colorMatch[0]) - 20));
                      const g = Math.max(0, Math.round(parseInt(colorMatch[1]) - 20));
                      const b = Math.max(0, Math.round(parseInt(colorMatch[2]) - 20));
                      strokeColor = `rgb(${r}, ${g}, ${b})`;
                    } else {
                      strokeColor = `rgb(${Math.max(0, pointBColorDark.r - 20)}, ${Math.max(0, pointBColorDark.g - 20)}, ${Math.max(0, pointBColorDark.b - 20)})`; // Fallback dark red
                    }
                  } else if (path.some(p => p.id === pin.id)) {
                    fillColor = "#FFD700"; // Golden yellow for path waypoints
                    strokeColor = "#FFA500";
                    strokeWidth = 2.5;
                  }
                }
                
                // Apply breathing color animation for active pins (sky blue to blue) - only for non-pathfinding active pins
                // Note: pointA and pointB colors are already set above in pathfinding mode
                if (isActive && !(showPathfindingPanel || pathfindingMode)) {
                  fillColor = interpolateColorWrapper(colorBreathValue);
                  // Stroke color slightly darker than fill for better contrast
                  const colorMatch = fillColor.match(/\d+/g);
                  if (colorMatch && colorMatch.length >= 3) {
                    const r = Math.max(0, Math.round(parseInt(colorMatch[0]) - 20));
                    const g = Math.max(0, Math.round(parseInt(colorMatch[1]) - 20));
                    const b = Math.max(0, Math.round(parseInt(colorMatch[2]) - 20));
                    strokeColor = `rgb(${r}, ${g}, ${b})`;
                  } else {
                    strokeColor = "#0099CC"; // Fallback
                  }
                }
                
                // Calculate subtle pulsing radius for active pins (breathing effect)
                let pulseValue = 0;
                if (isActive) {
                  if (pointA && pin.id === pointA.id) {
                    pulseValue = pointAValue;
                  } else if (pointB && pin.id === pointB.id) {
                    pulseValue = pointBValue;
                  } else {
                    pulseValue = colorBreathValue;
                  }
                }
                const pulseRadius = isActive ? radius + (Math.abs(Math.sin(pulseValue * Math.PI * 2)) * 8 / zoomScale) : 0;
                const pulseOpacity = isActive ? Math.abs(Math.sin(pulseValue * Math.PI * 2)) * 0.3 : 0;
                
                return (
                  <React.Fragment key={pin.id}>
                    {/* Pulsing circle behind active pins */}
                    {isActive && pulseRadius > 0 && (
                      <Circle
                        cx={pin.x}
                        cy={pin.y}
                        r={pulseRadius}
                        fill={fillColor}
                        opacity={pulseOpacity}
                      />
                    )}
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
          onPress={() => {
            // Close other modals when opening settings
            setSearchVisible(false);
            setCampusVisible(false);
            setFilterModalVisible(false);
            setShowPathfindingPanel(false);
            setPinsModalVisible(false);
            setLocationPickerVisible(false);
            setModalVisible(false);
            setSettingsVisible(true);
          }}>
          <Icon name="cog" size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.middleFooterButton} onPress={togglePinsModal}>
          <Icon name="list" size={20} color="white" />
          <Text style={styles.buttonText}>View All Pins</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton} onPress={toggleLoginModal}>
          <Icon name="user" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* --- MODALS --- */}

      {/* Settings Modal (full screen) */}
      {settingsRendered && (
        <Modal visible={true} transparent={true} animationType="none">
          <View style={StyleSheet.absoluteFill}>
            <Animated.View 
              style={[
                StyleSheet.absoluteFill,
                styles.settingsModalBackdrop,
                {
                  opacity: settingsSlideAnim.interpolate({
                    inputRange: [0, height / 2, height],
                    outputRange: [1, 0.5, 0],
                  }),
                }
              ]}
            />
            <Animated.View 
              style={[
                StyleSheet.absoluteFill,
                styles.settingsScreen,
                {
                  transform: [{ translateY: settingsSlideAnim }],
                }
              ]}
            >
          <View style={styles.modalHeaderWhite}>
            <Text style={[styles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>Settings</Text>
            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
              <Icon name="times" size={20} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={styles.lineDark}></View>

          <View style={[styles.settingsTabRow, { backgroundColor: 'white', paddingHorizontal: 20, paddingBottom: 10 }]}>
            <TouchableOpacity onPress={() => setSettingsTab('general')} style={[styles.settingsTabButton, settingsTab === 'general' && styles.settingsTabActive]}>
              <Text style={settingsTab === 'general' ? styles.settingsTabActiveText : { color: '#333' }}>General</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSettingsTab('about'); fadeAnim.setValue(0); }} style={[styles.settingsTabButton, settingsTab === 'about' && styles.settingsTabActive]}>
              <Text style={settingsTab === 'about' ? styles.settingsTabActiveText : { color: '#333' }}>About Us</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.lineDark}></View>

          <View style={{ flex: 1, backgroundColor: '#f5f5f5', padding: 20 }}>
            {settingsTab === 'general' && (
              <Animated.ScrollView style={[styles.aboutContent, { opacity: fadeAnim }]}>
                {/* Pathfinding Category */}
                <View style={styles.settingsCategoryContainer}>
                  <Text style={styles.settingsCategoryTitle}>Pathfinding</Text>
                  
                  {/* Path Line Style Selection */}
                  <View style={styles.settingItem}>
                    <View style={styles.settingItemContent}>
                      <Text style={styles.settingLabel}>Path Line Style</Text>
                      <Text style={styles.settingDescription}>Choose between dot, dash, or solid line</Text>
                    </View>
                  </View>
                  <View style={styles.pathLineStyleContainer}>
                  <TouchableOpacity
                    style={[styles.pathLineStyleButton, pathLineStyle === 'dot' && styles.pathLineStyleButtonActive]}
                    onPress={() => setPathLineStyle('dot')}
                  >
                    <Text style={[styles.pathLineStyleButtonText, pathLineStyle === 'dot' && styles.pathLineStyleButtonTextActive]}>Dot</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pathLineStyleButton, pathLineStyle === 'dash' && styles.pathLineStyleButtonActive]}
                    onPress={() => setPathLineStyle('dash')}
                  >
                    <Text style={[styles.pathLineStyleButtonText, pathLineStyle === 'dash' && styles.pathLineStyleButtonTextActive]}>Dash</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pathLineStyleButton, pathLineStyle === 'solid' && styles.pathLineStyleButtonActive]}
                    onPress={() => setPathLineStyle('solid')}
                  >
                    <Text style={[styles.pathLineStyleButtonText, pathLineStyle === 'solid' && styles.pathLineStyleButtonTextActive]}>Solid</Text>
                  </TouchableOpacity>
                </View>

                  {/* Point A Color Picker */}
                  <View style={styles.settingItem}>
                  <View style={styles.settingItemContent}>
                    <Text style={styles.settingLabel}>Start Point Color (Point A)</Text>
                    <Text style={styles.settingDescription}>Select light and dark shades for the start point</Text>
                  </View>
                </View>
                <View style={styles.colorPickerContainer}>
                  <View style={styles.colorPickerRow}>
                    <Text style={styles.colorPickerLabel}>Light:</Text>
                    <View style={styles.colorSwatchesContainer}>
                      {[
                        { r: 100, g: 181, b: 246, name: 'Blue' },
                        { r: 129, g: 212, b: 250, name: 'Light Blue' },
                        { r: 144, g: 202, b: 249, name: 'Sky Blue' },
                        { r: 77, g: 182, b: 172, name: 'Teal' },
                        { r: 129, g: 199, b: 132, name: 'Green' },
                        { r: 255, g: 183, b: 77, name: 'Orange' },
                      ].map((color, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.colorSwatch,
                            {
                              backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                              borderWidth: pointAColorLight.r === color.r && pointAColorLight.g === color.g && pointAColorLight.b === color.b ? 3 : 1,
                              borderColor: pointAColorLight.r === color.r && pointAColorLight.g === color.g && pointAColorLight.b === color.b ? '#28a745' : '#ccc',
                            }
                          ]}
                          onPress={() => setPointAColorLight(color)}
                        />
                      ))}
                    </View>
                  </View>
                  <View style={styles.colorPickerRow}>
                    <Text style={styles.colorPickerLabel}>Dark:</Text>
                    <View style={styles.colorSwatchesContainer}>
                      {[
                        { r: 25, g: 118, b: 210, name: 'Blue' },
                        { r: 3, g: 169, b: 244, name: 'Light Blue' },
                        { r: 2, g: 136, b: 209, name: 'Sky Blue' },
                        { r: 0, g: 150, b: 136, name: 'Teal' },
                        { r: 56, g: 142, b: 60, name: 'Green' },
                        { r: 230, g: 126, b: 34, name: 'Orange' },
                      ].map((color, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.colorSwatch,
                            {
                              backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                              borderWidth: pointAColorDark.r === color.r && pointAColorDark.g === color.g && pointAColorDark.b === color.b ? 3 : 1,
                              borderColor: pointAColorDark.r === color.r && pointAColorDark.g === color.g && pointAColorDark.b === color.b ? '#28a745' : '#ccc',
                            }
                          ]}
                          onPress={() => setPointAColorDark(color)}
                        />
                      ))}
                    </View>
                  </View>
                </View>

                  {/* Point B Color Picker */}
                  <View style={styles.settingItem}>
                  <View style={styles.settingItemContent}>
                    <Text style={styles.settingLabel}>Destination Color (Point B)</Text>
                    <Text style={styles.settingDescription}>Select light and dark shades for the destination</Text>
                  </View>
                </View>
                <View style={styles.colorPickerContainer}>
                  <View style={styles.colorPickerRow}>
                    <Text style={styles.colorPickerLabel}>Light:</Text>
                    <View style={styles.colorSwatchesContainer}>
                      {[
                        { r: 239, g: 83, b: 80, name: 'Red' },
                        { r: 255, g: 112, b: 67, name: 'Deep Orange' },
                        { r: 255, g: 152, b: 0, name: 'Amber' },
                        { r: 156, g: 39, b: 176, name: 'Purple' },
                        { r: 233, g: 30, b: 99, name: 'Pink' },
                        { r: 63, g: 81, b: 181, name: 'Indigo' },
                      ].map((color, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.colorSwatch,
                            {
                              backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                              borderWidth: pointBColorLight.r === color.r && pointBColorLight.g === color.g && pointBColorLight.b === color.b ? 3 : 1,
                              borderColor: pointBColorLight.r === color.r && pointBColorLight.g === color.g && pointBColorLight.b === color.b ? '#28a745' : '#ccc',
                            }
                          ]}
                          onPress={() => setPointBColorLight(color)}
                        />
                      ))}
                    </View>
                  </View>
                  <View style={styles.colorPickerRow}>
                    <Text style={styles.colorPickerLabel}>Dark:</Text>
                    <View style={styles.colorSwatchesContainer}>
                      {[
                        { r: 198, g: 40, b: 40, name: 'Red' },
                        { r: 216, g: 67, b: 21, name: 'Deep Orange' },
                        { r: 245, g: 124, b: 0, name: 'Amber' },
                        { r: 123, g: 31, b: 162, name: 'Purple' },
                        { r: 194, g: 24, b: 91, name: 'Pink' },
                        { r: 40, g: 53, b: 147, name: 'Indigo' },
                      ].map((color, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.colorSwatch,
                            {
                              backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                              borderWidth: pointBColorDark.r === color.r && pointBColorDark.g === color.g && pointBColorDark.b === color.b ? 3 : 1,
                              borderColor: pointBColorDark.r === color.r && pointBColorDark.g === color.g && pointBColorDark.b === color.b ? '#28a745' : '#ccc',
                            }
                          ]}
                          onPress={() => setPointBColorDark(color)}
                        />
                      ))}
                    </View>
                  </View>
                </View>
                </View>
              </Animated.ScrollView>
            )}

            {settingsTab === 'about' && (
              <Animated.ScrollView style={[styles.aboutContent, { opacity: fadeAnim }]}>
                <View style={styles.aboutSection}>
                  <Text style={[styles.aboutTitle, { color: '#333' }]}>Campus Trails</Text>
                  <View style={styles.aboutLine}></View>
                  <Text style={[styles.aboutLabel, { color: '#555' }]}>Members:</Text>
                  <View style={styles.membersList}>
                    <Text style={[styles.memberItem, { color: '#666' }]}>Kenth Jonard Barbarona</Text>
                    <Text style={[styles.memberItem, { color: '#666' }]}>Cyle Audrey Villarte</Text>
                    <Text style={[styles.memberItem, { color: '#666' }]}>Rafael Estorosas</Text>
                    <Text style={[styles.memberItem, { color: '#666' }]}>Christian Ferdinand Reantillo</Text>
                    <Text style={[styles.memberItem, { color: '#666' }]}>Gwynnever Tutor</Text>
                  </View>
                  <Text style={[styles.classYear, { color: '#28a745' }]}>USTP-BSIT</Text>
                </View>
              </Animated.ScrollView>
            )}
          </View>
          </Animated.View>
          </View>
        </Modal>
      )}

      {/* Filter Modal (replaces QR scanner) */}
      {filterModalRendered && (
        <Modal visible={true} transparent={true} animationType="none">
          <Animated.View 
            style={[
              styles.modalContainer,
              {
                opacity: filterModalAnim,
              }
            ]}
          >
          <Animated.View 
            style={[
              styles.filterModalContent,
              {
                transform: [
                  {
                    scale: filterModalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
                opacity: filterModalAnim,
              }
            ]}
          >
            <View style={styles.modalHeaderWhite}>
              <Text style={[styles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>Filter Pins</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Icon name="times" size={20} color={'#333'} />
              </TouchableOpacity>
            </View>
            <View style={styles.lineDark}></View>
            
            {/* Selection Controls */}
            <View style={styles.filterTopControls}>
              <TouchableOpacity onPress={selectAllCategories} style={styles.filterSelectAllButton}>
                <Text style={styles.filterSelectAllButtonText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearAllCategories} style={styles.filterClearAllButton}>
                <Text style={styles.filterClearAllButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>

            {/* Category Groups */}
            <ScrollView style={{ width: '100%', backgroundColor: '#f5f5f5', paddingHorizontal: 16 }}>
              {[
                { 
                  title: 'Building Legends', 
                  items: [
                    { name: 'Commercial Zone', color: '#FF0000' },
                    { name: 'Admin / Operation Zone', color: '#800080' },
                    { name: 'Academic Core Zone', color: '#0000FF' },
                    { name: 'Auxiliary Services Zone', color: '#808080' }
                  ]
                },
                { 
                  title: 'Essentials & Utilities', 
                  items: [
                    { name: 'Dining', color: '#FFA500' },
                    { name: 'Comfort Rooms (CR)', color: '#ADD8E6' }
                  ]
                },
                { 
                  title: 'Research', 
                  items: [
                    { name: 'Research Zones', color: '#9C27B0' }
                  ]
                },
                { 
                  title: 'Safety & Access', 
                  items: [
                    { name: 'Clinic', color: '#FF0000' },
                    { name: 'Parking', color: '#D3D3D3' },
                    { name: 'Security', color: '#0000FF' }
                  ]
                }
              ].map(group => (
                <View key={group.title} style={styles.categoryGroup}>
                  <View style={styles.categoryHeaderContainer}>
                    <Text style={styles.categoryHeaderText}>{group.title}</Text>
                    <View style={styles.categoryHeaderUnderline}></View>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    {group.items.map(item => (
                      <TouchableOpacity 
                        key={item.name} 
                        style={[
                          styles.filterCategoryButton,
                          { width: '48%' }, // 2 columns with small gap
                          selectedCategories[item.name] && styles.filterCategoryButtonSelected
                        ]} 
                        onPress={() => toggleCategory(item.name)}
                      >
                        <ImageBackground 
                          source={require('./assets/USTP.jpg')} 
                          style={styles.filterCategoryButtonImage}
                          resizeMode="cover"
                          imageStyle={styles.filterCategoryButtonImageStyle}
                        >
                          <View style={styles.filterCategoryButtonContent}>
                            <Text style={styles.filterCategoryButtonText}>{item.name}</Text>
                            {selectedCategories[item.name] && (
                              <Icon name="check" size={16} color="#4CAF50" style={{ marginLeft: 'auto' }} />
                            )}
                          </View>
                        </ImageBackground>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={{ backgroundColor: '#f5f5f5', paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 }}>
              <TouchableOpacity style={[styles.closeButton, { alignSelf: 'stretch', marginTop: 8 }]} onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.closeText}>Done</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
        </Modal>
      )}

      {/* Modal for Pin Details (Clicked from map) */}
      {pinDetailModalRendered && (
        <Modal visible={true} transparent={true} animationType="none">
          <View style={StyleSheet.absoluteFill}>
            <Animated.View 
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  opacity: pinDetailModalAnim.interpolate({
                    inputRange: [0, height / 2, height],
                    outputRange: [1, 0.5, 0],
                  }),
                }
              ]}
            />
            <Animated.View 
              style={[
                styles.pinDetailModalPanel,
                {
                  transform: [{ translateY: pinDetailModalAnim }],
                  opacity: pinDetailModalAnim.interpolate({
                    inputRange: [0, height / 2, height],
                    outputRange: [1, 0.5, 0],
                  }),
                }
              ]}
            >
              <View style={styles.modalHeaderWhite}>
                <Text style={[styles.modalTitleWhite, { marginBottom: 0, flex: 1, marginRight: 12, paddingRight: 4, fontSize: 14 }]} numberOfLines={2} ellipsizeMode="tail">{selectedPin?.description}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ paddingLeft: 8 }}>
                  <Icon name="times" size={18} color="#333" />
                </TouchableOpacity>
              </View>
              <View style={styles.lineDark}></View>
              <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
                <View style={{ backgroundColor: '#f5f5f5', paddingHorizontal: 10, paddingTop: 8, paddingBottom: 4 }}>
                  <Image source={selectedPin?.image} style={styles.pinImage} resizeMode="cover" />
                </View>
                <View style={[styles.actionButtons, { backgroundColor: '#f5f5f5', paddingHorizontal: 10, paddingVertical: 4 }]}>
                  <TouchableOpacity 
                    style={[styles.iconButton, { flex: 1, marginRight: 10 }]} 
                    onPress={() => {
                      if (selectedPin) {
                        // Set current pin as destination
                        setPointB(selectedPin);
                        // Close pin detail modal
                        setModalVisible(false);
                        // Close other modals
                        setSearchVisible(false);
                        setCampusVisible(false);
                        setFilterModalVisible(false);
                        setSettingsVisible(false);
                        setPinsModalVisible(false);
                        setLocationPickerVisible(false);
                        // Open pathfinding panel
                        setShowPathfindingPanel(true);
                        setPathfindingMode(false);
                        setPath([]);
                      }
                    }}
                  >
                    <Icon name="location-arrow" size={18} color="white" />
                    <Text style={[styles.buttonText, { fontSize: 12 }]} numberOfLines={1}>Navigate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.iconButton, { flex: 1, marginRight: 10 }]} 
                    onPress={() => {
                      if (selectedPin) {
                        // Highlight pin on map
                        setHighlightedPinOnMap(selectedPin.id);
                        // Close pin detail modal
                        setModalVisible(false);
                        // Close other modals
                        setSearchVisible(false);
                        setCampusVisible(false);
                        setFilterModalVisible(false);
                        setSettingsVisible(false);
                        setPinsModalVisible(false);
                        setLocationPickerVisible(false);
                        // Note: react-native-image-pan-zoom doesn't support programmatic zoom/pan
                        // The pin is highlighted in cyan color, making it easy to locate
                        // User can manually zoom/pan to the highlighted pin
                        setZoomToPin({ pin: selectedPin });
                      }
                    }}
                  >
                    <Icon name="map-marker" size={18} color="white" />
                    <Text style={[styles.buttonText, { fontSize: 12 }]} numberOfLines={1}>Show on Map</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ backgroundColor: '#f5f5f5', paddingHorizontal: 10, paddingTop: 4, paddingBottom: 8 }}>
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={() => {
                      if (selectedPin && selectedPin.id === 9) {
                        setCameFromPinDetails(true);
                        setModalVisible(false);
                        setBuildingDetailsVisible(true);
                        setSelectedFloor('Ground Floor');
                      } else {
                        setModalVisible(false);
                      }
                    }}
                  >
                    <Text style={[styles.buttonText, { fontSize: 13 }]}>View More Details</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      )}

      {/* Building Details Modal - Bottom Slide-in Panel */}
      {buildingDetailsRendered && selectedPin && selectedPin.id === 9 && (
        <Modal visible={true} transparent={true} animationType="none">
          <View style={StyleSheet.absoluteFill}>
            <Animated.View 
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  opacity: buildingDetailsSlideAnim.interpolate({
                    inputRange: [0, 150, 300],
                    outputRange: [1, 0.5, 0],
                  }),
                }
              ]}
            >
            <Pressable 
              style={StyleSheet.absoluteFill} 
              onPress={() => {
                setBuildingDetailsVisible(false);
                if (cameFromPinDetails) {
                  setCameFromPinDetails(false);
                  setModalVisible(true);
                }
              }}
            />
            </Animated.View>
            <Animated.View 
              style={[
                styles.buildingDetailsModal,
                {
                  transform: [{ translateY: buildingDetailsSlideAnim }],
                  opacity: buildingDetailsSlideAnim.interpolate({
                    inputRange: [0, 150, 300],
                    outputRange: [1, 0.5, 0],
                  }),
                }
              ]}
            >
            <View style={styles.buildingDetailsHeader}>
              <TouchableOpacity onPress={() => {
                setBuildingDetailsVisible(false);
                if (cameFromPinDetails) {
                  setCameFromPinDetails(false);
                  setModalVisible(true);
                }
              }}>
                <Icon name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.buildingDetailsContent}>
              <View style={styles.buildingDetailsImageContainer}>
                <Image source={selectedPin.image} style={styles.buildingDetailsImage} resizeMode="cover" />
              </View>
              
              <View style={styles.buildingDetailsNameContainer}>
                <Text style={styles.buildingDetailsName}>{selectedPin.description}</Text>
              </View>
              
              <Text style={styles.buildingDetailsSectionTitle}>BUILDING LAYOUT DETAILS:</Text>
              
              <View style={styles.floorButtonsContainer}>
                {['Ground Floor', '2nd Floor', '3rd Floor', '4th Floor'].map((floor, index) => (
                  <TouchableOpacity
                    key={floor}
                    style={[
                      styles.floorButton,
                      index === 0 && styles.floorButtonFirst, // Ground Floor
                      index === 3 && styles.floorButtonLast, // 4th Floor
                      selectedFloor === floor && styles.floorButtonSelected
                    ]}
                    onPress={() => setSelectedFloor(floor)}
                  >
                    <Text style={[
                      styles.floorButtonText,
                      selectedFloor === floor && styles.floorButtonTextSelected
                    ]}>
                      {floor}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.giveFeedbackButtonContainer}>
                <TouchableOpacity 
                  style={[styles.giveFeedbackButton, { flex: 1, marginRight: 8 }]}
                  onPress={() => alert('Feedback feature coming soon!')}
                >
                  <Icon name="comment" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.giveFeedbackButtonText}>Give Feedback</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.giveFeedbackButton, { flex: 1, backgroundColor: '#FFB6C1' }]}
                  onPress={() => {
                    if (selectedPin) {
                      savePin();
                    }
                  }}
                >
                  <Icon name="bookmark" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.giveFeedbackButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.roomsTitle}>Rooms:</Text>
              {building9Rooms[selectedFloor]?.map((room) => (
                <View key={room.id} style={styles.roomCard}>
                  <Image
                    source={require('./assets/USTP.jpg')}
                    style={styles.roomCardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.roomCardContent}>
                    <Text style={styles.roomNumber}>{room.name}</Text>
                    <Text style={styles.roomDescription}>{room.description}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
        </Modal>
      )}

      {/* User Login Modal - Bottom Slide-in Panel */}
      {loginModalRendered && (
        <Animated.View 
          style={[
            styles.pinsModalPanel, 
            { 
              transform: [{ translateY: loginModalSlideAnim }],
              opacity: loginModalSlideAnim.interpolate({
                inputRange: [0, 150, 300],
                outputRange: [1, 0.5, 0],
              }),
            }
          ]}
        >
          {/* Header */}
          <View style={styles.pinsModalHeader}>
            <Text style={[styles.pinsModalCampusTitle, { textAlign: 'center', flex: 1 }]}>Account Log In</Text>
            <TouchableOpacity onPress={toggleLoginModal}>
              <Icon name="times" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          <KeyboardAvoidingView 
            style={styles.loginContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={styles.loginContentContainer}>
              <View style={styles.loginContentWrapper}>
                {/* Logo */}
                <View style={styles.loginLogoContainer}>
                  <Image 
                    source={require('./assets/logo-no-bg.png')} 
                    style={styles.loginLogoImage}
                    resizeMode="contain"
                  />
                </View>

                {/* Login Form */}
                <View style={styles.loginForm}>
                  <View style={styles.loginInputContainer}>
                    <Text style={styles.loginInputLabel}>Username</Text>
                    <TextInput
                      style={styles.loginInput}
                      placeholder="Enter username"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.loginInputContainer}>
                    <Text style={styles.loginInputLabel}>Password</Text>
                    <View style={styles.loginPasswordContainer}>
                      <TextInput
                        style={[styles.loginInput, { flex: 1 }]}
                        placeholder="Enter password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        style={styles.loginPasswordToggle}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Icon name={showPassword ? "eye" : "eye-slash"} size={18} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={styles.loginButton}
                    onPress={() => {
                      if (username && password) {
                        alert('Login functionality coming soon!');
                        // TODO: Implement login logic
                      } else {
                        alert('Please enter username and password');
                      }
                    }}
                  >
                    <Text style={styles.loginButtonText}>Login</Text>
                  </TouchableOpacity>

                  <View style={styles.loginLinksContainer}>
                    <TouchableOpacity onPress={() => alert('Having Problems? feature coming soon!')}>
                      <Text style={styles.loginLink}>Having Problems?</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => alert('Register Now feature coming soon!')}>
                      <Text style={styles.loginLink}>Register Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      )}

      {/* Main Search Modal */}
      {searchRendered && (
        <Animated.View 
          style={[
            styles.searchContainer,
            {
              opacity: searchAnim,
              transform: [
                {
                  translateY: searchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            }
          ]}
        >
          <View style={styles.modalHeaderWhite}>
            <Text style={[styles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>Search</Text>
            <TouchableOpacity onPress={toggleSearch}>
              <Icon name="times" size={20} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={styles.lineDark}></View>
          <View style={{ backgroundColor: '#f5f5f5', padding: 10 }}>
            <TextInput
              placeholder="Search for..."
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            <FlatList
              data={searchResults}
              keyExtractor={(item, index) => item.type === 'room' ? `room-${item.id}-${index}` : item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  onPress={() => {
                    if (item.type === 'room') {
                      // Find Building 9 pin
                      const building9Pin = pins.find(p => p.id === 9);
                      if (building9Pin) {
                        setSelectedPin(building9Pin);
                        setClickedPin(building9Pin.id);
                        setHighlightedPinOnMap(null);
                        // Close search modal
                        setSearchVisible(false);
                        // Close other modals
                        setCampusVisible(false);
                        setFilterModalVisible(false);
                        setShowPathfindingPanel(false);
                        setSettingsVisible(false);
                        setPinsModalVisible(false);
                        setLocationPickerVisible(false);
                        // Open Building Details Modal with correct floor
                        setCameFromPinDetails(false);
                        setSelectedFloor(item.floor);
                        setBuildingDetailsVisible(true);
                      }
                    } else {
                      handlePinPress(item);
                    }
                  }} 
                  style={styles.searchItemContainer}
                >
                  <Text style={styles.searchItem}>
                    <Text style={styles.searchDescription}>
                      {item.type === 'room' ? `${item.name} - ${item.description} (Building 9, ${item.floor})` : item.description}
                    </Text>
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Animated.View>
      )}

      {/* View All Pins Modal - Bottom Slide-in Panel */}
      {pinsModalRendered && (
        <Animated.View 
          style={[
            styles.pinsModalPanel, 
            { 
              transform: [{ translateY: pinsModalSlideAnim }],
              opacity: pinsModalSlideAnim.interpolate({
                inputRange: [0, 150, 300],
                outputRange: [1, 0.5, 0],
              }),
            }
          ]}
        >
          {/* Header */}
          <View style={styles.pinsModalHeader}>
            <Text style={[styles.pinsModalCampusTitle, { textAlign: 'center' }]}>USTP-CDO</Text>
            <TouchableOpacity onPress={togglePinsModal}>
              <Icon name="times" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          {/* Facilities Title */}
          <Text style={styles.facilitiesTitle}> </Text>
          
          {/* Categorized Facility List */}
          <ScrollView style={styles.facilityList} contentContainerStyle={styles.facilityListContent}>
            {categorizedPins.map((category, categoryIndex) => (
              <View key={category.title} style={{ marginBottom: 20 }}>
                <View style={styles.categoryHeaderContainer}>
                  <Text style={styles.categoryHeaderText}>{category.title}</Text>
                  <View style={styles.categoryHeaderUnderline}></View>
                </View>
                {category.pins.map((pin) => (
                  <TouchableOpacity 
                    key={pin.id.toString()} 
                    onPress={() => handlePinPress(pin)} 
                    style={styles.facilityButton}
                  >
                    <Image 
                      source={pin.image || require('./assets/USTP.jpg')} 
                      style={styles.facilityButtonImage}
                      resizeMode="cover"
                    />
                    <View style={styles.facilityButtonContent}>
                      <Text style={styles.facilityName}>{pin.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Location Picker Modal (For Point A and Point B) */}
      <Modal visible={isLocationPickerVisible} transparent animationType="slide" onRequestClose={() => setLocationPickerVisible(false)}>
        <Pressable 
          style={styles.modalContainer}
          onPress={() => setLocationPickerVisible(false)}
        >
          <View 
            style={styles.filterModalContent}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
          >
            <View style={styles.modalHeaderWhite}>
              <Text style={[styles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>
                 Select {activeSelector === 'A' ? 'Start Point' : 'Destination'}
              </Text>
              <TouchableOpacity onPress={() => setLocationPickerVisible(false)}>
                <Icon name="times" size={20} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.lineDark}></View>
            <ScrollView style={styles.facilityList} contentContainerStyle={styles.facilityListContent}>
              {categorizedPins.map((category) => (
                <View key={category.title} style={{ marginBottom: 20 }}>
                  <View style={styles.categoryHeaderContainer}>
                    <Text style={styles.categoryHeaderText}>{category.title}</Text>
                    <View style={styles.categoryHeaderUnderline}></View>
                  </View>
                  {category.pins.map((pin) => (
                    <TouchableOpacity 
                      key={pin.id.toString()} 
                      onPress={() => handleLocationSelect(pin)} 
                      style={styles.facilityButton}
                    >
                      <Image 
                        source={pin.image || require('./assets/USTP.jpg')} 
                        style={styles.facilityButtonImage}
                        resizeMode="cover"
                      />
                      <View style={styles.facilityButtonContent}>
                        <Text style={styles.facilityName}>{pin.description}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
            <View style={{ backgroundColor: '#f5f5f5', paddingHorizontal: 15, paddingTop: 20, paddingBottom: 15 }}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setLocationPickerVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Alert Modal */}
      <Modal visible={showAlertModal} transparent={true} animationType="fade">
        <View style={styles.alertModalOverlay}>
          <View style={styles.alertModalContainer}>
            <View style={styles.modalHeaderWhite}>
              <Text style={[styles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>Alert</Text>
            </View>
            <View style={styles.lineDark}></View>
            <View style={{ backgroundColor: '#f5f5f5', padding: 15 }}>
              <Text style={[styles.alertModalMessage, { color: '#333' }]}>{alertMessage}</Text>
            </View>
            <View style={{ backgroundColor: '#f5f5f5', paddingHorizontal: 15, paddingBottom: 15 }}>
              <TouchableOpacity 
                style={styles.alertModalButton}
                onPress={() => setShowAlertModal(false)}
              >
                <Text style={styles.alertModalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Campus Change Modal */}
      {campusRendered && (
        <Animated.View 
          style={[
            styles.campusContainer,
            {
              opacity: campusAnim,
              transform: [
                {
                  translateY: campusAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            }
          ]}
        >
          <View style={styles.modalHeaderWhite}>
            <Text style={[styles.modalTitleWhite, { marginBottom: 0, flex: 1, textAlign: 'center' }]}>Select Campus</Text>
            <TouchableOpacity onPress={toggleCampus}>
              <Icon name="times" size={20} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={styles.lineDark}></View>
          <View style={{ backgroundColor: '#f5f5f5' }}>
            <FlatList
              data={campuses}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleCampusChange(item)} style={styles.searchItemContainer}>
                  <Text style={styles.searchItem}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Animated.View>
      )}
    </View>
  );
};


export default App;