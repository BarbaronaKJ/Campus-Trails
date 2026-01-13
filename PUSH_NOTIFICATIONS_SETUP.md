# Push Notifications Setup Guide

## Overview

The Campus Trails app now supports push notifications! Admins can send notifications to all users, specific user groups, or individual users through the backend API. This feature is ready for integration with a web admin panel.

## Features

- ✅ Push notification registration on app start
- ✅ Token storage in user profile
- ✅ Notification preferences (enable/disable, categories)
- ✅ Notification history tracking
- ✅ Deep linking support (navigate to pins, open modals)
- ✅ Admin-only notification sending
- ✅ Support for announcements, updates, and reminders

## Architecture

### Frontend (`utils/notificationService.js`)
- Handles Expo push notification registration
- Manages notification permissions
- Sets up notification listeners
- Provides utility functions for badge management

### Backend (`backend/routes/notifications.js`)
- `/api/notifications/register` - Register/update push token
- `/api/notifications/send` - Send notifications (admin only)
- `/api/notifications/history` - Get notification history (admin only)
- `/api/notifications/preferences` - Get/update user preferences

### Database Models
- **User Model**: Stores `pushToken` and `notificationPreferences`
- **Notification Model**: Stores notification history with delivery status

## Setup Instructions

### 1. Dependencies Installed

The following packages are already installed:
- `expo-notifications` - Push notification handling
- `expo-device` - Device detection

### 2. App Configuration

The `app.json` has been updated with notification plugin configuration.

### 3. Backend Setup

The notification routes are already added to `backend/server.js`:
```javascript
app.use('/api/notifications', require('./routes/notifications'));
```

### 4. Database Schema

The User model includes:
- `pushToken`: Expo push token string
- `notificationPreferences`: Object with enabled, announcements, updates, reminders

The Notification model stores:
- Notification content (title, body, type)
- Target audience
- Delivery status
- Success/failure counts

## Usage

### For Users (Automatic)

1. **On App Start**: App automatically requests notification permission
2. **On Login**: Push token is registered with backend
3. **Notifications**: Users receive notifications based on their preferences

### For Admins (API)

#### Send Notification to All Users

```javascript
POST /api/notifications/send
Headers: {
  "Authorization": "Bearer <admin_token>",
  "Content-Type": "application/json"
}
Body: {
  "title": "Important Announcement",
  "body": "Campus event tomorrow at 2 PM",
  "type": "announcement",
  "targetAudience": "all",
  "data": {
    "pinId": 1,  // Optional: deep link to pin
    "action": "openProfile"  // Optional: custom action
  }
}
```

#### Send to Specific Group

```javascript
{
  "title": "Student Update",
  "body": "New facilities available",
  "type": "update",
  "targetAudience": "students"  // or "admins"
}
```

#### Send to Specific Users

```javascript
{
  "title": "Personal Reminder",
  "body": "Don't forget your appointment",
  "type": "reminder",
  "targetAudience": "all",
  "targetUserIds": ["user_id_1", "user_id_2"]
}
```

#### Get Notification History

```javascript
GET /api/notifications/history?limit=50
Headers: {
  "Authorization": "Bearer <admin_token>"
}
```

#### Update User Preferences

```javascript
PUT /api/notifications/preferences
Headers: {
  "Authorization": "Bearer <user_token>",
  "Content-Type": "application/json"
}
Body: {
  "enabled": true,
  "announcements": true,
  "updates": false,
  "reminders": true
}
```

## Admin Panel Integration (Future)

When you build the admin panel, you can:

1. **Create Notification Form**:
   - Title input
   - Body/Message textarea
   - Type selector (announcement, update, reminder, custom)
   - Target audience selector (all, students, admins)
   - Optional: Specific user selection

2. **Send Notification**:
   ```javascript
   const response = await fetch('https://your-api.com/api/notifications/send', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${adminToken}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       title: formData.title,
       body: formData.body,
       type: formData.type,
       targetAudience: formData.audience,
       data: formData.data || {}
     })
   });
   ```

3. **View Notification History**:
   - Display sent notifications
   - Show delivery status (sent, failed, partial)
   - Show success/failure counts
   - Filter by date, type, sender

4. **User Management**:
   - View users with push tokens
   - See notification preferences
   - Send test notifications

## Notification Types

- **announcement**: General announcements (events, news)
- **update**: App or facility updates
- **reminder**: Reminders (appointments, deadlines)
- **custom**: Custom notifications

## Deep Linking

Notifications can include data for deep linking:

```javascript
{
  "title": "New Building Added",
  "body": "Building 10 is now available",
  "data": {
    "pinId": 10,  // Opens building details
    "action": "openProfile",  // Opens user profile
    "campusId": "campus_id"  // Switches campus
  }
}
```

## Testing

### Test Local Notification

```javascript
import { scheduleLocalNotification } from './utils/notificationService';

// Schedule a test notification in 2 seconds
scheduleLocalNotification(
  'Test Notification',
  'This is a test notification',
  { test: true },
  2
);
```

### Test Push Notification (Admin)

1. Get admin token
2. Send notification via API
3. Check device receives notification
4. Check notification history in database

## Troubleshooting

### Notifications Not Received

1. **Check Permission**: Ensure notification permission is granted
2. **Check Token**: Verify push token is registered in database
3. **Check Preferences**: Ensure user has notifications enabled
4. **Check Device**: Push notifications only work on physical devices (not simulators)

### Token Registration Fails

1. **Check Internet**: Ensure device has internet connection
2. **Check Backend**: Verify backend is running and accessible
3. **Check Auth**: Ensure user is logged in with valid token

### Admin Can't Send Notifications

1. **Check Role**: Verify user has `role: 'admin'` in database
2. **Check Token**: Ensure admin token is valid
3. **Check Endpoint**: Verify `/api/notifications/send` is accessible

## Security Notes

- Only admins can send notifications
- Push tokens are stored securely in user profiles
- Notification history is tracked for audit purposes
- Users can disable notifications via preferences

## Next Steps

1. ✅ Push notifications are fully implemented
2. 🔲 Build admin panel UI for sending notifications
3. 🔲 Add notification scheduling (future feature)
4. 🔲 Add notification templates (future feature)
5. 🔲 Add analytics for notification engagement (future feature)

## API Reference

See `services/api.js` for all notification API functions:
- `registerPushToken(token, authToken)`
- `sendNotification(notificationData, authToken)`
- `getNotificationHistory(authToken, limit)`
- `updateNotificationPreferences(preferences, authToken)`
- `getNotificationPreferences(authToken)`

## Files Modified/Created

- ✅ `utils/notificationService.js` - Frontend notification service
- ✅ `backend/models/Notification.js` - Notification history model
- ✅ `backend/models/User.js` - Added pushToken and preferences
- ✅ `backend/routes/notifications.js` - Notification API routes
- ✅ `backend/middleware/auth.js` - Authentication middleware
- ✅ `backend/server.js` - Added notification routes
- ✅ `services/api.js` - Added notification API functions
- ✅ `App.js` - Integrated notification registration
- ✅ `app.json` - Added notification plugin
