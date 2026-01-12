# User Profile Feature - Implementation Guide

## Overview
This document outlines the User Profile feature implementation including:
- User Profile Modal with tabs (Saved Pins, Feedback History, Account Settings)
- Activity Counter cards (Total Bookmarks, Reviews Written, Days Active)
- Dark Mode toggle in Settings
- Alert Preferences (New Facility Updates, Security Alerts, Event Reminders)
- Cloudinary face detection for profile pictures
- Clear Cache functionality
- Profile picture upload and password change

## Completed ✅

### 1. State Management
- ✅ User Profile state variables added to App.js
- ✅ Dark mode state (`darkMode`)
- ✅ Alert preferences state (`alertPreferences`)
- ✅ User profile data state (`userProfile`, `feedbackHistory`, `daysActive`)
- ✅ Password change state variables

### 2. Settings Modal Enhancements
- ✅ Dark Mode toggle added to Settings > General tab
- ✅ Alert Preferences toggles added (Facility Updates, Security Alerts, Event Reminders)
- ✅ Clear Cache button added to Settings > General tab
- ✅ Profile button added to Settings tab row (links to User Profile)

### 3. Utilities Created
- ✅ `utils/userStorage.js` - User data storage and management
- ✅ `utils/cloudinaryUtils.js` - Cloudinary face detection transformations
- ✅ `utils/imageUtils.js` - Updated with clear cache functionality

## Still To Implement 🔨

### 1. User Profile Modal
The User Profile modal needs to be added after the Settings modal closes (around line 1714 in App.js).

**Required Structure:**
```jsx
{/* User Profile Modal - Bottom Slide-in Panel */}
{userProfileRendered && (
  <Modal visible={true} transparent={true} animationType="none">
    <View style={StyleSheet.absoluteFill}>
      {/* Backdrop */}
      {/* Modal Content with Tabs */}
      {/* Tab 1: Saved Pins */}
      {/* Tab 2: Feedback History */}
      {/* Tab 3: Account Settings */}
    </View>
  </Modal>
)}
```

### 2. Activity Counter Cards
Small cards showing:
- Total Bookmarks (from `savedPins.length`)
- Reviews Written (from `feedbackHistory.length`)
- Days Active (from `daysActive` state)

### 3. Profile Picture Upload
- Image picker integration
- Cloudinary upload with face detection (`c_thumb, g_face, r_max`)
- Profile picture display with Cloudinary transformations

### 4. Password Change Form
- Old password input
- New password input with validation
- Confirm password input
- Password change handler

### 5. Feedback Submission Integration
- Update "Give Feedback" button in Building Details Modal
- Store feedback with pin ID, rating, comment, date
- Update feedback history display

### 6. Saved Pins Integration
- Update save pin functionality to use `addSavedPin` from `userStorage.js`
- Display saved pins in User Profile > Saved Pins tab
- Remove saved pin functionality

## Implementation Steps

### Step 1: Add User Profile Modal Animation
Already added to App.js (search for "User Profile Modal Animation")

### Step 2: Add User Profile Modal JSX
Add the modal after Settings modal (around line 1714):

```jsx
{/* User Profile Modal - Bottom Slide-in Panel */}
{userProfileRendered && (
  <Modal visible={true} transparent={true} animationType="none">
    <View style={StyleSheet.absoluteFill}>
      <Animated.View 
        style={[
          StyleSheet.absoluteFill,
          styles.settingsModalBackdrop,
          {
            opacity: userProfileSlideAnim.interpolate({
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
            transform: [{ translateY: userProfileSlideAnim }],
          }
        ]}
      >
        {/* Modal Content */}
        {/* Header with close button */}
        {/* Tab Row: Saved Pins | Feedback History | Account Settings */}
        {/* Tab Content */}
      </Animated.View>
    </View>
  </Modal>
)}
```

### Step 3: Add Activity Counter Cards
Create a component section showing activity stats:
- Total Bookmarks: `{savedPins.length}`
- Reviews Written: `{feedbackHistory.length}`
- Days Active: `{daysActive}`

### Step 4: Integrate Cloudinary Face Detection
Use `getProfilePictureUrl` from `utils/cloudinaryUtils.js`:
```javascript
import { getProfilePictureUrl } from './utils/cloudinaryUtils';

const profilePicUrl = userProfile.profilePicture 
  ? getProfilePictureUrl(userProfile.profilePicture, { circular: true, width: 200, height: 200 })
  : require('./assets/default-avatar.jpg');
```

### Step 5: Update "Give Feedback" Button
In Building Details Modal, update the feedback button handler:
```javascript
onPress={() => {
  // Show feedback form modal
  // Collect: pinId, rating, comment
  // Call: addFeedback({ pinId, pinTitle, rating, comment })
  // Update feedbackHistory state
}}
```

### Step 6: Integrate Saved Pins
Update save pin functionality:
```javascript
import { addSavedPin, removeSavedPin } from './utils/userStorage';

// When user saves a pin:
addSavedPin(selectedPin);
setSavedPins([...savedPins, selectedPin]);

// When user unsaves:
removeSavedPin(pinId);
setSavedPins(savedPins.filter(p => p.id !== pinId));
```

## Cloudinary Face Detection Transformation

The profile picture uses Cloudinary transformations:
- `c_thumb,g_face` - Automatically detects face and crops to thumbnail
- `r_max` - Makes image perfectly circular
- `f_auto,q_auto` - Automatic format and quality optimization

Example URL:
```
https://res.cloudinary.com/your_cloud/image/upload/c_thumb,g_face,w_200,h_200,r_max,f_auto,q_auto/v1234567890/profile.jpg
```

## Storage

User data is stored in `localStorage` (web) or can be migrated to `AsyncStorage` (React Native) with:
```bash
npm install @react-native-async-storage/async-storage
```

Then update `utils/userStorage.js` to use AsyncStorage instead of localStorage.

## Dark Mode Implementation

Dark mode state is managed in App.js and saved to localStorage. To apply dark mode styles:
1. Conditionally apply styles based on `darkMode` state
2. Create dark theme styles in `styles.js`
3. Update all components to use theme-aware styles

## Testing Checklist

- [ ] User Profile modal opens from Settings
- [ ] Activity counter cards display correct counts
- [ ] Saved Pins tab shows saved pins
- [ ] Feedback History tab shows all feedback
- [ ] Account Settings tab shows profile picture and password form
- [ ] Profile picture upload works with Cloudinary
- [ ] Cloudinary face detection crops correctly
- [ ] Password change validates and updates
- [ ] Dark mode toggle works
- [ ] Alert preferences save correctly
- [ ] Clear cache button works
- [ ] Feedback submission stores in history
- [ ] Saved pins persist across app restarts
