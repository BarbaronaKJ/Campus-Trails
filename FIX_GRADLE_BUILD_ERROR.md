# Fix Gradle Build Error for APK Build

## Error Description
The build is failing with two main errors:
1. `expo-module-gradle-plugin` was not found
2. Unknown property 'release' for SoftwareComponent container

## Solution

This error typically occurs when the Android project needs to be regenerated or when there's a mismatch between Expo SDK and the Android configuration.

### Option 1: Regenerate Android Project (Recommended)

The Android folder might be out of sync with your Expo SDK version. Regenerate it:

```bash
# Remove existing Android folder (backup first if needed)
rm -rf android

# Regenerate Android project with current Expo SDK
npx expo prebuild --platform android --clean
```

### Option 2: Update Gradle Configuration

If you need to keep the existing Android folder, try updating the configuration:

1. **Update `android/build.gradle`** - Ensure Expo modules are properly included
2. **Update `android/settings.gradle`** - Verify Expo autolinking is correct
3. **Check `android/gradle.properties`** - Ensure all required properties are set

### Option 3: Use EAS Build Without Local Android Folder

EAS Build can generate the Android project automatically. You can:

1. **Remove the android folder** (EAS will generate it)
2. **Add to `.gitignore`** if you want to exclude it from version control
3. **Let EAS Build handle the Android configuration**

### Option 4: Update Dependencies

Ensure all dependencies are compatible:

```bash
# Update Expo CLI
npm install -g eas-cli@latest

# Update project dependencies
npm install

# Clear cache
npx expo start --clear
```

## Recommended Approach

For EAS Build, the best approach is:

1. **Remove the local Android folder** (EAS Build generates it automatically)
2. **Ensure `app.json` is properly configured**
3. **Run the build again**

```bash
# Remove Android folder
rm -rf android

# Run EAS build
eas build --platform android --profile preview
```

## Alternative: Fix Android Configuration

If you need to keep the Android folder, you may need to:

1. Update Expo SDK to ensure compatibility
2. Run `npx expo prebuild --platform android` to regenerate
3. Ensure all Expo modules are properly linked

## Verification

After applying the fix, verify:

1. ✅ `app.json` has correct Expo SDK version
2. ✅ All dependencies in `package.json` are compatible
3. ✅ `eas.json` is properly configured
4. ✅ No conflicting Android configurations

---

**Note**: EAS Build typically handles Android project generation automatically, so having a local `android` folder can sometimes cause conflicts if it's out of sync with your Expo SDK version.
