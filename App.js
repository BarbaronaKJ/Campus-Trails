import React, { useState } from 'react';
import { StyleSheet, View, Image, Modal, Text, TouchableOpacity, TextInput, FlatList, Dimensions } from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';
import Icon from 'react-native-vector-icons/FontAwesome'; // Use FontAwesome for icons
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

const { width, height } = Dimensions.get('window'); // Screen dimensions

const App = () => {
  const [selectedPin, setSelectedPin] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isSearchVisible, setSearchVisible] = useState(false);
  const [isCampusVisible, setCampusVisible] = useState(false); // For campus selection
  const [savedPins, setSavedPins] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomScale, setZoomScale] = useState(1); // To track zoom scale
  const [isPinsModalVisible, setPinsModalVisible] = useState(false); // State for the "View All Pins" modal

  // Sample pins data with building number and images
  const pins = [
    { id: 1, x: 381, y: 272, title: "1", description: "BLDG 1 | Arts & Culture Building", image: require('./assets/USTP.jpg') },
    { id: 3, x: 367, y: 294, title: "3", description: "BLDG 3 | Integrated Technology Building (ITB)", image: require('./assets/USTP.jpg') },
    { id: 4, x: 340, y: 313, title: "4", description: "BLDG 4 | Reserve Officers' Training Corps. (ROTC) Building", image: require('./assets/USTP.jpg') },
    { id: 5, x: 300, y: 315, title: "5", description: "BLDG 5 | College and Engineering (CEA) Building", image: require('./assets/USTP.jpg')},
    { id: 9, x: 282, y: 267, title: "9", description: "BLDG 9 | Information Communication Technology (ICT) Building", image: require('./assets/bldg9.jpg')},
    { id: 10, x: 272, y: 293, title: "10", description: "BLDG 10 | Administration Building", image: require('./assets/USTP.jpg')},
    { id: 14, x: 218, y: 267, title: "14", description: "BLDG 14 | Finance Center", image: require('./assets/USTP.jpg')},
    { id: 15, x: 201, y: 280, title: "15", description: "BLDG 15 | Gym Lobby", image: require('./assets/USTP.jpg')},
    { id: 16, x: 215, y: 306, title: "16", description: "BLDG 16 | Dr. Ricardo Rotoras Memorial Hall (Gymnasium)", image: require('./assets/gym16.jpg')},
    { id: 18, x: 261, y: 353, title: "18", description: "BLDG 18 | Culinary Building", image: require('./assets/USTP.jpg')},
    { id: 19, x: 262, y: 378, title: "19", description: "BLDG 19 | Science Centrum", image: require('./assets/USTP.jpg')},
    { id: 20, x: 224, y: 365, title: "20", description: "BLDG 20 | Cafeteria", image: require('./assets/cafet20.jpg')},
    { id: 21, x: 191, y: 381, title: "21", description: "BLDG 21 | Guard House", image: require('./assets/USTP.jpg')},
    { id: 23, x: 133, y: 232, title: "23", description: "BLDG 23 | Learning Resource Center (LRC) Building", image: require('./assets/USTP.jpg')},
    { id: 24, x: 97.6, y: 258, title: "24", description: "BLDG 24 | Girls Trade Building", image: require('./assets/USTP.jpg')},
    { id: 25, x: 142, y: 266, title: "25", description: "BLDG 25 | Food Innovation Center", image: require('./assets/USTP.jpg')},
    { id: 27, x: 119, y: 290, title: "27", description: "BLDG 27 | Old Medical Building", image: require('./assets/USTP.jpg')},
    { id: 28, x: 143, y: 297, title: "28", description: "BLDG 28 | Old Science Building", image: require('./assets/USTP.jpg')},
    { id: 35, x: 89.3, y: 313, title: "35", description: "BLDG 35 | Old Education Building", image: require('./assets/USTP.jpg')},
    { id: 36, x: 78, y: 280, title: "36", description: "BLDG 36| Old Student Center", image: require('./assets/USTP.jpg')},
    { id: 41, x: 159, y: 326, title: "41", description: "BLDG 41 | Science Complex", image: require('./assets/USTP.jpg')},
    { id: 42, x: 250, y: 399, title: "42", description: "BLDG 42 | Engineering Complex Right Wing", image: require('./assets/USTP.jpg')},
    { id: 43, x: 222, y: 399, title: "43", description: "BLDG 43 | Engineering Complex Left Wing", image: require('./assets/USTP.jpg')},

  ];

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
    pin.title.toLowerCase().includes(searchQuery.toLowerCase()) || // Check title
    pin.description.toLowerCase().includes(searchQuery.toLowerCase()) // Check description
  );

  const handleCampusChange = (campus) => {
    alert("Other Campuses Coming Soon!");
    setCampusVisible(false);
  };
  const [isAboutModalVisible, setAboutModalVisible] = useState(false);
  const toggleSearch = () => setSearchVisible(!isSearchVisible);
  const toggleCampus = () => setCampusVisible(!isCampusVisible);
  const togglePinsModal = () => setPinsModalVisible(!isPinsModalVisible); // Correctly toggle the pins modal

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

      {/* Map with Zoom and Image Filling Screen */}
      <View style={styles.imageContainer}>
        <ImageZoom
          cropWidth={width}
          cropHeight={height} // Make it fill the screen
          imageWidth={width} // Set the image width to the screen width to fill the screen
          imageHeight={(width * 1200) / 800} // Maintain aspect ratio
          minScale={1} // Set minimum scale to prevent zoom out too much
          maxScale={3} // Set max scale to zoom in
          enableCentering={false} // Prevent auto-centering when panning
          cropOffset={0}
          onScaleChanged={(scale) => setZoomScale(scale)} // Update zoom scale
        >
          <View>
            <Image
              source={require('./assets/map.png')}
              style={styles.mapImage}
              resizeMode="contain" // Prevent cropping by using "contain"
            />
            {/* Overlay SVG for Pins with Building Numbers */}
            <Svg height="1310" width="1920" style={StyleSheet.absoluteFill}>
              {pins.map((pin) => (
                <React.Fragment key={pin.id}>
                  {/* Adjust pin size based on zoom scale */}
                  <Circle
                    cx={pin.x}
                    cy={pin.y}
                    r={5 / zoomScale} // Dynamically resize the pins based on zoom scale
                    fill="green"
                    onPress={() => handlePinPress(pin)}
                  />
                  {/* Display Building Number in the Pin */}
                  <SvgText
                    x={pin.x}
                    y={pin.y}
                    fill="white"
                    fontSize={5 / zoomScale} // Make the text smaller as the zoom increases
                    fontWeight="bold"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {pin.title}
                  </SvgText>
                </React.Fragment>
              ))}
            </Svg>
          </View>
        </ImageZoom>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {/* About Us Button (Left) */}

<TouchableOpacity 
  style={styles.footerButton} 
  onPress={() => setAboutModalVisible(true)}>
  <Icon name="info-circle" size={20} color="white" />
</TouchableOpacity>

<Modal
  visible={isAboutModalVisible}
  transparent={true}
  animationType="slide"
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Team Chokols</Text>
      <View style={styles.line}></View>
      <Text style={styles.modalTitle}>Members:</Text>
      <Text style={styles.modalText}>Kenth Jonard Barbarona</Text>
      <Text style={styles.modalText}>Carl Salvo</Text>
      <Text style={styles.modalText}>Nathan Perez</Text>
      <Text style={styles.modalText}>Ryan Otacan</Text>
      <Text style={styles.modalText}> </Text>
      <Text style={styles.modalTitle}>BSIT-3R13</Text>
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={() => setAboutModalVisible(false)}>
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


        <TouchableOpacity style={styles.middleFooterButton} onPress={togglePinsModal}>
          <Icon name="list" size={20} color="white" />
          <Text style={styles.buttonText}>View All Pins</Text>
        </TouchableOpacity>

        {/* Saved Pins Button (Right) */}
        <TouchableOpacity style={styles.footerButton} onPress={() => alert("Saving pins functionality coming soon!")}>
          <Icon name="bookmark" size={20} color="white" />
        </TouchableOpacity>
      </View>
      

      {/* Modal for Pin Details */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>{selectedPin?.description}</Text>
            {/* Line design */}
            <View style={styles.line}></View>
            {/* Pin image */}
            <Image
              source={selectedPin?.image}
              style={styles.pinImage}
              resizeMode="cover"
            />
            {/* Action Buttons */}
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
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Search Modal */}
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

      {/* Pins Modal */}
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
  buttonText: { color: 'white', textAlign: 'center', marginLeft: 8 },
  imageContainer: { flex: 1 },
  mapImage: { width: '100%', height: '100%' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalDescription: { marginBottom: 10, fontWeight: 'bold' },
  line: { borderBottomWidth: 1, borderBottomColor: '#ccc', marginVertical: 10 },
  pinImage: { width: '100%', height: 200, borderRadius: 10, marginVertical: 10 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  iconButton: { backgroundColor: '#28a745', padding: 10, borderRadius: 5, flexDirection: 'row', alignItems: 'center' },
  closeButton: { backgroundColor: '#05bbf7', padding: 10, borderRadius: 5, marginTop: 10 },
  footer: { position: 'absolute', bottom: 30, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 1 },
  footerButton: { backgroundColor: '#28a745', padding: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center', width: 60, height: 40 },
  middleFooterButton: { backgroundColor: '#28a745', padding: 8, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', width: 150, height: 40 },
  pinsModalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '90%', maxHeight: '70%', alignItems: 'center' },
  pinItem: { borderBottomWidth: 1, borderBottomColor: '#ccc', paddingVertical: 10, paddingHorizontal: 5, width: '100%' },
  pinTitle: { fontWeight: 'bold', fontSize: 16 },
  pinDescription: { fontSize: 14, color: '#666' },
  searchContainer: { position: 'absolute', top: 80, left: 20, right: 20, backgroundColor: 'white', padding: 10, borderRadius: 10 },
  campusContainer: { position: 'absolute', top: 80, left: 20, right: 20, backgroundColor: 
    'white', padding: 10, borderRadius: 10 },
  searchInput: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginBottom: 10 },
  searchItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  searchTitle: { fontWeight: 'bold' },
  searchDescription: { fontStyle: 'italic', color: '#888' },
  closeText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  
});

export default App;
