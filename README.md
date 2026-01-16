# Campus Trails - Interactive Campus Map Application

A React Native mobile application for navigating and exploring university campuses with interactive maps, pathfinding, and facility information.

## 📋 Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Features](#features)
- [Architecture](#architecture)
- [Component Organization](#component-organization)
- [State Management](#state-management)
- [Key Features Implementation](#key-features-implementation)
- [Getting Started](#getting-started)
- [Building the App](#building-the-app)

## 🎯 Overview

Campus Trails is a mobile navigation app that helps students and visitors navigate university campuses. It provides:

- **Interactive Maps**: Zoomable and pannable campus maps with facility locations
- **Pathfinding**: Find optimal routes between any two locations on campus
- **Search**: Search for buildings, rooms, and facilities
- **User Accounts**: Save favorite locations and track activity
- **Push Notifications**: Receive campus updates and announcements
- **QR Code Integration**: Scan QR codes to quickly access building information

## 📁 Project Structure

```
Campus-Trails/
├── App.js                    # Main application component (being refactored)
├── components/               # Reusable UI components
│   ├── Header.js            # Top navigation bar
│   ├── MapView.js           # Map display with zoom/pan
│   ├── PathfindingPanel.js  # Pathfinding navigation panel
│   └── ...                  # More components being extracted
├── constants/                # Static data and constants
│   ├── developers.js        # Developer information
│   ├── secretQuestions.js   # Password recovery questions
│   └── index.js
├── utils/                    # Utility functions
│   ├── floorUtils.js        # Floor name formatting
│   ├── pathfinding.js       # A* pathfinding algorithm
│   ├── categoryFilter.js    # Category filtering logic
│   ├── colorInterpolation.js # Color interpolation for animations
│   ├── pinCategories.js     # Pin categorization
│   ├── searchUtils.js       # Search functionality
│   ├── handlers.js          # Event handlers
│   ├── imageUtils.js        # Image optimization and caching
│   ├── cloudinaryUtils.js   # Cloudinary image uploads
│   ├── userStorage.js       # AsyncStorage utilities
│   ├── usePins.js           # Custom hook for pins data
│   ├── useBackHandler.js    # Android back button handler
│   └── notificationService.js # Push notification service
├── services/                 # API service layer
│   └── api.js               # API calls to backend
├── styles/                   # Global styles
│   └── styles.js
├── assets/                   # Images and static assets
├── backend/                  # Backend API server
└── admin-panel/              # Web admin panel

```

## ✨ Features

### 1. Interactive Map
- **Zoom & Pan**: Pinch to zoom and drag to pan the map
- **Pin Display**: Visual pins for buildings and facilities
- **Dynamic Sizing**: Pins resize based on zoom level
- **Highlighting**: Click pins to highlight and view details

### 2. Pathfinding (A* Algorithm)
- **Route Calculation**: Find optimal paths between locations
- **Visual Path**: Animated path line on the map
- **Point Selection**: Choose start and destination points
- **Path Styles**: Configurable line styles (solid, dashed, dotted)

### 3. Search & Filter
- **Building Search**: Search by building name or description
- **Room Search**: Search for specific rooms within buildings
- **Category Filter**: Filter pins by category (Buildings, Facilities, etc.)
- **Real-time Results**: Instant search results as you type

### 4. User Authentication
- **Registration**: Create account with username, email, password
- **Login**: Secure login with JWT tokens
- **Password Recovery**: Secret question/answer system
- **Profile Management**: Update profile picture and settings

### 5. Saved Locations
- **Favorite Pins**: Save frequently visited locations
- **Sync**: Synchronized across devices when logged in
- **Offline Support**: Works offline with local storage

### 6. Push Notifications
- **Campus Updates**: Receive important announcements
- **Permission Handling**: Smart permission requests
- **Token Management**: Automatic token registration

### 7. Building Details
- **Floor Plans**: Multi-floor building support
- **Room Lists**: Browse rooms by floor
- **QR Codes**: Generate and scan QR codes for buildings
- **Images**: Building photos and floor plan images

## 🏗️ Architecture

### Component Hierarchy

```
App (Main Container)
├── Header
│   ├── QR Scanner Button
│   ├── Campus Selector
│   └── Search Button
├── Filter Button
├── Pathfinding Button
├── MapView
│   ├── ImageZoom (Map Image)
│   └── SVG Overlay (Pins & Path)
├── PathfindingPanel
├── Modals
│   ├── AuthModal (Login/Register/Forgot Password)
│   ├── SearchModal
│   ├── FilterModal
│   ├── PinDetailsModal
│   ├── BuildingDetailsModal
│   ├── PinsListModal
│   ├── SettingsModal
│   ├── UserProfileModal
│   ├── QrScannerModal
│   └── QrCodeDisplayModal
└── Footer (Navigation buttons)
```

### State Management

The app uses React's `useState` and `useEffect` hooks for state management:

- **Local State**: Component-level state with `useState`
- **Global State**: Shared state passed via props
- **AsyncStorage**: Persistent storage for user data
- **API State**: Server data fetched via custom hooks (`usePins`)

### Data Flow

1. **Initial Load**: App fetches pins, campuses, and user data from API
2. **User Interaction**: User actions trigger state updates
3. **State Updates**: State changes trigger re-renders
4. **API Sync**: Changes sync with backend (when logged in)
5. **Local Storage**: Critical data cached locally for offline use

## 🔧 Key Features Implementation

### Pathfinding Logic

The app uses the A* pathfinding algorithm to find optimal routes:

1. **Graph Construction**: Pins are nodes, neighbors define edges
2. **A* Search**: Heuristic-based search for shortest path
3. **Path Visualization**: SVG polyline overlays the path on map
4. **Path Styles**: Configurable dash/dot patterns

### Pin Filtering

Pins are filtered by category using a flexible system:

1. **Category Selection**: Users select categories to show/hide
2. **Real-time Filtering**: Map updates as filters change
3. **Pathfinding Override**: Active pathfinding pins always visible

### Search Implementation

Search works across multiple data types:

1. **Building Search**: Searches pin titles and descriptions
2. **Room Search**: Searches rooms within buildings
3. **Fuzzy Matching**: Case-insensitive, partial matches
4. **Type Detection**: Automatically detects building vs room results

### Authentication Flow

1. **Registration**: User provides username, email, password, secret question/answer
2. **Login**: JWT token issued and stored locally
3. **Session Management**: Token validated on app startup
4. **Password Recovery**: Secret answer verification before reset

### Push Notifications

1. **Permission Request**: Request on login/registration
2. **Token Registration**: Expo push token sent to backend
3. **Notification Handling**: Foreground and background handlers
4. **Deep Linking**: Notifications can open specific pins/modals

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android builds)
- EAS CLI (`npm install -g eas-cli`)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YourUsername/Campus-Trails.git
   cd Campus-Trails
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   - Copy `.env.example` to `.env`
   - Add your MongoDB URI, Cloudinary credentials, etc.

4. **Start the backend** (if running locally)
   ```bash
   cd backend
   npm install
   npm start
   ```

5. **Start the mobile app**
   ```bash
   npm start
   ```

### Development Build

For features requiring native modules (QR scanner, etc.):

```bash
npx expo prebuild
npx expo run:android
```

## 📱 Building the App

### Preview Build (APK)

```bash
eas build --platform android --profile preview
```

### Production Build

```bash
eas build --platform android --profile production
```

The app is configured to work in standalone builds (without Expo Go) for full functionality including push notifications and QR scanning.

## 📝 Component Documentation

### Header Component

**Location**: `components/Header.js`

**Purpose**: Top navigation bar with QR scanner, campus selector, and search buttons.

**Props**:
- `currentCampusName` (string): Name of selected campus
- `isSearchVisible` (boolean): Whether search modal is open
- `hasFilterActive` (boolean): Whether filters are applied
- `onQrScannerPress` (function): QR scanner button handler
- `onCampusPress` (function): Campus selector handler
- `onSearchPress` (function): Search button handler
- `onFilterPress` (function): Filter button handler
- `onPathfindingPress` (function): Pathfinding button handler

### MapView Component

**Location**: `components/MapView.js`

**Purpose**: Displays the interactive campus map with zoom/pan and pin overlay.

**Props**:
- `currentCampus` (object): Campus data with mapImageUrl
- `visiblePins` (array): Pins to display on map
- `path` (array): Pathfinding path coordinates
- `zoomScale` (number): Current zoom level
- `onPinPress` (function): Pin click handler

### PathfindingPanel Component

**Location**: `components/PathfindingPanel.js`

**Purpose**: Bottom slide-in panel for selecting pathfinding start/end points.

**Props**:
- `pointA` (object): Starting point pin
- `pointB` (object): Destination point pin
- `onPointAPress` (function): Point A selector handler
- `onPointBPress` (function): Point B selector handler
- `onStartPathfinding` (function): Start navigation handler

## 🔄 Data Synchronization

The app implements smart data syncing:

- **15-second intervals**: Frequent sync for pins and user data
- **2-minute intervals**: Less frequent sync for campuses
- **5-minute intervals**: Rare sync for developer info
- **Event-driven**: Sync triggered when modals open
- **Offline fallback**: Uses cached data when API unavailable

## 🛠️ Utilities

### floorUtils.js
- `getFloorName(floorLevel)`: Formats floor numbers with ordinal suffixes
  - Example: `0` → "Ground Floor", `1` → "2nd Floor"

### pathfinding.js
- `aStarPathfinding(startId, endId, pins)`: A* algorithm implementation
  - Returns array of path coordinates

### categoryFilter.js
- `pinMatchesSelected(pin, selectedCategories)`: Checks if pin matches category filter
- `categoryPinIds(selectedCategories, pins)`: Gets pin IDs matching categories

## 📚 API Integration

All API calls are centralized in `services/api.js`:

- **Base URL**: Configurable via constants (local, ngrok, or production)
- **Authentication**: JWT tokens in Authorization headers
- **Error Handling**: Comprehensive error handling with fallbacks

## 🔐 Security

- **Password Hashing**: Bcrypt hashing on backend
- **JWT Tokens**: Secure token-based authentication
- **Secret Questions**: Additional security for password recovery
- **Input Validation**: Client and server-side validation

## 📊 Analytics

- **Anonymous Tracking**: Search and pathfinding usage (no PII)
- **User Tracking**: Logged-in user activity statistics
- **Dashboard**: Admin panel shows usage trends and popular searches

## 🐛 Troubleshooting

### Map not loading
- Check internet connection
- Verify `mapImageUrl` in campus data
- Check console for image load errors

### Push notifications not working
- Ensure app is built (not Expo Go)
- Check notification permissions
- Verify EAS project ID in `app.json`

### QR scanner not available
- Requires development build: `npx expo prebuild && npx expo run:android`
- Check camera permissions
- Use deep links as alternative: `campustrails://pin/123`

## 📄 License

[Your License Here]

## 👥 Contributors

See `constants/developers.js` for the development team.

## 🔄 Refactoring Status

This project is currently being refactored to:
- Extract components from `App.js` (7286 lines → modular components)
- Improve code organization and maintainability
- Add comprehensive documentation
- Reduce code duplication

**Status**: In Progress
- ✅ Constants extracted
- ✅ Utilities extracted
- ✅ Header component extracted
- ✅ MapView component extracted
- ✅ PathfindingPanel component extracted
- 🔄 Modal components extraction in progress
- ⏳ App.js refactoring pending
