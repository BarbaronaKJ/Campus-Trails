# Pin Structure Documentation

This document describes the Pin data structure used throughout the Campus Trails application.

## Location
**Primary File**: `backend/models/Pin.js`  
**Type**: Mongoose Schema Model  
**Database Collection**: `pins`

## Overview
The Pin schema handles both Visible Facilities (buildings, landmarks) and Invisible Waypoints (pathfinding nodes). All pins are stored in a single MongoDB collection but can be filtered by the `isVisible` flag.

## Schema Structure

### Core Fields
- **`campusId`** (ObjectId, required): Foreign key linking to Campus model
- **`id`** (Mixed, required): Unique identifier (number or string) - legacy compatibility
- **`x`** (Number, required): X coordinate on map
- **`y`** (Number, required): Y coordinate on map
- **`title`** (String, required): Display name (e.g., "ICT Building")
- **`description`** (String): Full description text
- **`category`** (String, enum): One of the predefined categories
- **`isVisible`** (Boolean, required): `true` for display pins, `false` for waypoints
- **`pinType`** (String, enum): `'facility'` or `'waypoint'`
- **`qrCode`** (String): QR code identifier for visible pins
- **`image`** (String): Image URL (Cloudinary or local path)

### Pathfinding Fields
- **`neighbors`** (Array[Mixed]): Array of connected pin IDs for pathfinding graph
- **`buildingNumber`** (Number): Optional building number (1-52)

### Floor/Room Structure
- **`floors`** (Array):
  - `level` (Number): Floor level (0 = Ground Floor)
  - `floorPlan` (String): Floor plan image URL
  - `rooms` (Array):
    - `name` (String): Room name
    - `image` (String): Room image URL
    - `description` (String): Room description
    - `qrCode` (String): Room QR code identifier

## Static Methods
- `getPinsByCampus(campusId, includeInvisible)`: Get all pins for a campus
- `getPinsByCategory(campusId, category, includeInvisible)`: Filter by category
- `searchPins(campusId, searchQuery, includeInvisible)`: Search by title
- `getPinById(pinId, campusId)`: Get single pin by ID or _id
- `getAllPins(campusId)`: Get all pins including waypoints (for pathfinding)

## Indexes
- `{ campusId: 1, isVisible: 1 }`
- `{ campusId: 1, category: 1 }`
- `{ campusId: 1, title: 1 }`
- `{ id: 1 }` (legacy ID)

## Usage Notes
- Always filter by `isVisible: true` when displaying pins to users
- Include invisible waypoints (`isVisible: false`) when building pathfinding graphs
- The `neighbors` array defines bidirectional connections for the A* algorithm
- Pin IDs can be numbers or strings (handled with loose equality `==`)

## Related Files
- `backend/routes/pins.js`: API endpoints for pin operations
- `utils/pathfinding.js`: Uses pins with neighbors array for pathfinding
- `utils/usePins.js`: Fetches pins from API with fallback to local data
