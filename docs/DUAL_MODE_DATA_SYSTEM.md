# Dual Mode Data System Documentation

This document describes the dual-mode data fetching system that allows the app to work with both API and local fallback data.

## Location
**Primary File**: `utils/usePins.js`  
**Hook**: `usePins(useApi = true)`  
**Used In**: `App.js` (main application component)

## Overview
The dual-mode system allows the app to:
1. **Primary Mode**: Fetch pins from MongoDB via Express API
2. **Fallback Mode**: Use local `pinsData.js` file if API is unavailable
3. **Graceful Degradation**: Automatically switches to fallback on API errors

## Hook API

```javascript
const { 
  pins,              // Array of pin objects
  loading,           // Boolean: fetching state
  error,             // String: error message (if any)
  isUsingLocalFallback, // Boolean: true if using local data
  refetch            // Function: manually refetch from API
} = usePins(useApi);
```

### Parameters
- **`useApi`** (boolean, default: `true`): Whether to attempt API fetch

### Return Values
- **`pins`**: Always returns pin array (local or API data)
- **`loading`**: `true` during API fetch, `false` when complete
- **`error`**: Error message string if API fetch failed
- **`isUsingLocalFallback`**: `true` if currently using local data
- **`refetch`**: Callback function to manually refetch from API

## Implementation Details

### Initial State
- Starts with local pins from `pinsData.js` (immediate availability)
- Sets `loading: true` if `useApi` is true
- Sets `isUsingLocalFallback: !useApi`

### API Fetch Process
1. Calls `fetchPins(true)` with `includeInvisible: true`
   - **Critical**: Includes invisible waypoints for pathfinding
2. Formats API response to match local format:
   - Adds default image URL if missing
   - Ensures `neighbors` is an array
3. Updates state with API pins
4. Sets `isUsingLocalFallback: false` on success

### Fallback Logic
Falls back to local data if:
- API fetch fails (network error, timeout)
- API returns empty array
- `useApi` is set to `false`

### Data Format
Both API and local pins use the same structure:
```javascript
{
  id: Number | String,
  x: Number,
  y: Number,
  title: String,
  description: String,
  image: String,
  neighbors: Array,
  isVisible: Boolean,
  // ... other fields
}
```

## Usage in App.js

```javascript
import { usePins } from './utils/usePins';

const App = () => {
  // Fetch from API (with fallback to local)
  const { 
    pins, 
    loading, 
    error, 
    isUsingLocalFallback, 
    refetch 
  } = usePins(true);

  // Use pins throughout the app
  // The app works identically whether using API or local data
};
```

## Important Notes

1. **Invisible Waypoints**: API fetch includes `isVisible: false` pins for pathfinding
   - These are filtered for display but needed for pathfinding calculations

2. **Default Image**: Local pins get a default Cloudinary image URL if missing

3. **Graceful Degradation**: App never breaks - always has data from local fallback

4. **No Logic Change**: App code doesn't need to know if using API or local data

5. **Manual Refetch**: `refetch()` can be called after network issues resolve

## Related Files
- **`services/api.js`**: `fetchPins()` function that calls the API
- **`pinsData.js`**: Local pin data fallback
- **`App.js`**: Uses the `usePins` hook
- **`utils/pathfinding.js`**: Uses pins (including invisible waypoints)

## Error Handling

### Network Errors
- Caught and logged with `console.warn`
- State updated to use local fallback
- Error message stored in `error` state

### Empty Responses
- API returns empty array → uses local fallback
- Logs warning but doesn't set `error` state

### Component Unmount
- Cleans up with `isMounted` flag
- Prevents state updates after unmount

## Performance Considerations

- **Initial Load**: Local data provides instant pins for immediate rendering
- **API Overlay**: API data replaces local data when available
- **Caching**: API responses are not cached - always fetches fresh data
- **Refetch**: Manual `refetch()` useful for pull-to-refresh scenarios
