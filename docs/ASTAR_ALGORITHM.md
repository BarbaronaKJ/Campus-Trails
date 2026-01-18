# A* Pathfinding Algorithm Documentation

This document describes the A* pathfinding implementation used for navigation in Campus Trails.

## Location
**Primary File**: `utils/pathfinding.js`  
**Exports**: `distance`, `buildGraph`, `aStarPathfinding`

## Overview
The pathfinding system uses a strict graph-based A* algorithm that only connects pins listed in each pin's `neighbors` array. This ensures paths follow the actual campus layout.

## Core Functions

### `distance(p1, p2)`
Calculates Euclidean distance between two points.

```javascript
export const distance = (p1, p2) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};
```

### `buildGraph(allPins)`
Builds a graph structure from pins based on their `neighbors` arrays.

**Important**: 
- Only connects pins explicitly listed in `neighbors`
- Automatically creates bidirectional connections
- Includes invisible waypoints (required for pathfinding)

**Returns**: Graph object `{ [pinId]: [{ id, distance }, ...] }`

### `aStarPathfinding(startId, endId, allPins)`
Main pathfinding algorithm using A* search.

**Parameters**:
- `startId`: Starting pin ID (number or string)
- `endId`: Destination pin ID (number or string)
- `allPins`: Array of ALL pins including invisible waypoints

**Returns**: Array of pin objects representing the path (empty array if no path found)

**Algorithm Details**:
- Uses A* search with Euclidean distance heuristic
- `f = g + h` where:
  - `g`: Actual distance from start
  - `h`: Heuristic (straight-line distance to goal)
- Max iterations: 1000 (prevents infinite loops)
- Includes ALL nodes in path (including invisible waypoints for visualization)

## Usage Example

```javascript
import { aStarPathfinding } from './utils/pathfinding';

// Get all pins (including invisible waypoints)
const allPins = [...]; // From usePins hook

// Find path from pin ID 9 to pin ID 21
const path = aStarPathfinding(9, 21, allPins);

if (path.length > 0) {
  console.log(`Path found with ${path.length} waypoints`);
} else {
  console.log('No path found');
}
```

## Important Notes

1. **Always pass ALL pins**: Include invisible waypoints (`isVisible: false`) for pathfinding calculations
2. **Filter for display only**: Filter out invisible pins when rendering to users, but keep them in pathfinding
3. **Neighbors array**: Paths only follow connections defined in `neighbors` arrays
4. **ID matching**: Uses loose equality (`==`) to handle number/string ID mismatches
5. **Same start/end**: Returns single-element array if start equals end

## Graph Construction
The graph builder:
1. Initializes all pin IDs as graph nodes
2. For each pin, reads its `neighbors` array
3. Creates edges with calculated distances
4. **Automatically adds reverse edges** (bidirectional connections)

This prevents broken paths if reverse connections are missing in the data.

## Error Handling
- Returns empty array `[]` on errors or no path found
- Logs warnings to console for debugging
- Handles missing pins gracefully

## Related Files
- `backend/models/Pin.js`: Pin schema with `neighbors` field
- `App.js`: Uses `aStarPathfinding` in `handleStartPathfinding`
- `utils/usePins.js`: Provides pins data (including waypoints)
