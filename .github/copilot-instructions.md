# Campus Trails Copilot Instructions

## Project Overview

Campus Trails is a React Native/Expo interactive campus map app with A\* pathfinding, MongoDB backend, and Cloudinary image hosting. The app features building discovery, category filtering, user authentication, and turn-by-turn navigation.

## Architecture

### Dual-Mode Data System

- **API Mode (default)**: Fetches pins from MongoDB via Express backend (`backend/server.js`)
- **Local Fallback**: Uses `pinsData.js` if API unavailable
- `usePins(useApi)` hook manages this with graceful fallback
- **Critical**: Invisible waypoints (`isInvisible: true`) exist only for pathfinding—never display them but always include in pathfinding calculations

### Pin Data Structure

Pins have mixed-type IDs (string or number), x/y coordinates, `neighbors[]` array for graph connections, and `isInvisible` flag. The `neighbors` array defines pathfinding edges bidirectionally (see `utils/pathfinding.js`).

### Pathfinding System

- Strict graph builder in `utils/pathfinding.js` only connects neighbors listed in `neighbors[]` array
- A\* algorithm with Euclidean distance heuristic
- **Always pass all pins** (including invisible) to `aStarPathfinding()`
- Filter invisible pins only for display, not for pathfinding

### Backend API Patterns

- Base URL determined by platform: Android emulator uses `10.0.2.2:3000`, iOS uses `localhost:3000`, physical devices use NGROK URL
- Set `NGROK_URL` in `services/api.js` for physical device testing (see `NGROK_SETUP.md`)
- All Cloudinary URLs auto-optimized with `f_auto,q_auto` parameters in backend routes

### Image Handling

- **Cloudinary**: Direct unsigned uploads from mobile app using preset `campus_trails_profile`
- Profile pictures use face detection: `c_thumb,g_face,w_400,h_400,r_max,f_auto,q_auto`
- Backend adds `f_auto,q_auto` to Cloudinary URLs automatically if missing
- Use `getOptimizedImage()` from `utils/imageUtils.js` for rendering

### State Management

- All state in `App.js` (4100+ lines monolith)
- User data synced to MongoDB when logged in, AsyncStorage when offline
- Authentication uses JWT tokens stored in AsyncStorage with auto-restore on app launch

## Development Workflows

### Starting Development

```bash
# Terminal 1: Start backend
cd backend && npm start

# Terminal 2 (physical devices only): NGROK tunnel
ngrok http 3000  # Update NGROK_URL in services/api.js

# Terminal 3: Start Expo
npm start
```

### MongoDB Data Migration

```bash
node backend/scripts/migratePins.js  # Import pinsData.js to MongoDB
```

### Environment Setup

Backend requires `backend/.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campus-trails
PORT=3000
CORS_ORIGINS=*
```

## Project-Specific Patterns

### Category Filtering

`utils/categoryFilter.js` maps categories to pin IDs (not keywords). Always check `isInvisible` flag before filtering—invisible pins never match categories.

### Color Interpolation

Pathfinding uses pulsating color animations. Point A (start) uses blue colors, Point B (destination) uses red colors. Configurable via `pointAColorLight/Dark` and `pointBColorLight/Dark` state in `App.js`. See `utils/colorInterpolation.js`.

### Search System

`utils/searchUtils.js` searches across pins AND building-specific rooms (e.g., `constants/rooms.js` for Building 9). Combines building-level and room-level results.

### AsyncStorage Keys

- `authToken`: JWT token
- `currentUser`: User object
- `campus_trails_user`: User profile data (offline mode)
- `wasLoggedOut`: Logout flag to prevent auto-restore

### Modal Pattern

Multiple modals managed via individual `useState` flags in `App.js`. Settings modal uses tab system (`settingsTab` state: `'general'` or `'about'`).

## Critical Notes

- **Never modify pin IDs**: Mixed string/number IDs throughout codebase
- **Neighbors array**: Only connects listed IDs, auto-bidirectional in `buildGraph()`
- **Image URLs**: Backend route `/api/pins` auto-optimizes Cloudinary URLs
- **Platform differences**: Android emulator needs `10.0.2.2` not `localhost`
- **NGROK**: Required for physical device testing—update `services/api.js` with tunnel URL
- **Auth flow**: Check `wasLoggedOut` flag before auto-restoring sessions
- **Style centralization**: All styles in `styles.js`, imported as `{ styles }`

## Key Files

- [App.js](App.js): Main component (4100+ lines)
- [pinsData.js](pinsData.js): Local pin data fallback
- [utils/pathfinding.js](utils/pathfinding.js): A\* implementation
- [utils/usePins.js](utils/usePins.js): Data fetching hook with fallback
- [backend/routes/pins.js](backend/routes/pins.js): Pin CRUD operations
- [services/api.js](services/api.js): API client with platform-specific URLs
- [utils/categoryFilter.js](utils/categoryFilter.js): Category-to-pin mapping
- [utils/cloudinaryUtils.js](utils/cloudinaryUtils.js): Direct upload utilities

## Testing Setup

See `NGROK_SETUP.md` for physical device testing. Use `?includeInvisible=true` query param when fetching pins for pathfinding calculations.
