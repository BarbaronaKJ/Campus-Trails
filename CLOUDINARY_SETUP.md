# Cloudinary Direct Upload Setup

## Overview
Profile pictures are uploaded directly from the mobile app to Cloudinary, bypassing the Express server. Only the Cloudinary URL (or Public ID) is stored in MongoDB.

## Setup Steps

### 1. Create Unsigned Upload Preset in Cloudinary Dashboard

1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Navigate to **Settings** > **Upload** > **Upload presets**
3. Click **Add upload preset**
4. Configure:
   - **Preset name**: `campus_trails_profile` (or your preferred name)
   - **Signing Mode**: Select **Unsigned** (important!)
   - **Folder**: `campus-trails/profiles` (optional, for organization)
   - **Tags**: `profile` (optional, for filtering)
5. Click **Save**

### 2. Update Configuration

In `utils/cloudinaryUtils.js`, update the `CLOUDINARY_CONFIG`:

```javascript
export const CLOUDINARY_CONFIG = {
  cloudName: 'your_cloud_name', // Your Cloudinary cloud name
  uploadPreset: 'campus_trails_profile', // The preset name you created
};
```

**Note**: The cloud name is visible in your existing Cloudinary URLs (e.g., `https://res.cloudinary.com/dun83uvdm/...`)

### 3. How It Works

1. User selects image from camera or gallery using `expo-image-picker`
2. Image is uploaded directly to Cloudinary using the unsigned upload preset
3. Cloudinary applies face detection transformation during upload: `c_thumb,g_face,w_400,h_400,r_max,f_auto,q_auto`
4. Only the `secure_url` (or `public_id`) is saved to MongoDB via the API
5. When displaying, Cloudinary transformations are applied on-the-fly for face detection and circular cropping

### 4. Benefits of Direct Upload

- ✅ **No server bandwidth**: Images go directly from mobile to Cloudinary
- ✅ **Faster uploads**: No need to pass through Express server
- ✅ **Server resource savings**: Express server doesn't handle large file buffers
- ✅ **Scalable**: Cloudinary handles the upload infrastructure

### 5. Security

- The upload preset is unsigned but should be restricted to specific folder/tags
- Consider adding additional validation in Cloudinary settings (file size limits, allowed formats)
- The preset should only allow uploads to the `campus-trails/profiles` folder

### 6. Troubleshooting

**Error: "Upload preset not found"**
- Verify the preset name matches exactly (case-sensitive)
- Check that the preset is set to "Unsigned" mode
- Verify the cloud name is correct

**Error: "Upload failed: 400"**
- Check file size limits in Cloudinary settings
- Verify allowed image formats
- Check folder permissions if using folder organization

**Error: "Upload failed: 401"**
- Verify the preset is set to "Unsigned" (not "Signed")
- Check that the cloud name is correct

