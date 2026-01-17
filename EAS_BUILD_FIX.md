# EAS Build Gradle Error Fix

## Problem
The Gradle build is failing with:
- `expo-module-gradle-plugin` was not found
- Unknown property 'release' for SoftwareComponent container

## Root Cause
The local `android/` folder is out of sync with Expo SDK 52. EAS Build generates the Android project automatically, so having an outdated local `android/` folder can cause conflicts.

## Solution

### Option 1: Remove Android Folder (Recommended for EAS Build)

EAS Build generates the Android project automatically, so you can remove the local folder:

```bash
# Backup the android folder (optional)
cp -r android android_backup

# Remove the android folder
rm -rf android

# Run EAS build again
eas build --platform android --profile preview
```

### Option 2: Regenerate Android Project

If you need the android folder for local development:

```bash
# Remove existing android folder
rm -rf android

# Regenerate with current Expo SDK
npx expo prebuild --platform android --clean

# Then run EAS build
eas build --platform android --profile preview
```

### Option 3: Update Android Configuration

If you must keep the existing android folder, you need to ensure it's compatible with Expo SDK 52:

1. **Check Expo SDK version**:
   ```bash
   npx expo --version
   ```

2. **Update dependencies**:
   ```bash
   npm install
   ```

3. **Verify app.json** has correct SDK version (should match your Expo version)

## Recommended Approach

For EAS Build, **Option 1 is recommended** because:
- EAS Build generates the Android project automatically
- No risk of version mismatches
- Cleaner repository
- Less maintenance

The `android/` folder has been added to `.gitignore` so it won't be committed to git.

## After Fixing

1. ✅ Remove or regenerate `android/` folder
2. ✅ Run `eas build --platform android --profile preview`
3. ✅ Build should complete successfully

## Note

If you need the `android/` folder for local development (e.g., `expo run:android`), you can:
- Keep it locally but don't commit it
- Regenerate it when needed with `npx expo prebuild --platform android`
- Use EAS Build for production builds (which generates it automatically)
