# Fix Java Version Compatibility Issue

## Problem
Error: `Unsupported class file major version 69`

This means:
- Your system has Java 25 installed
- Gradle 8.10.2 doesn't fully support Java 25
- Gradle needs Java 17 or 21 (LTS versions)

## Solution Options

### Option 1: Use EAS Build (Recommended - No Java Version Issues)

EAS Build uses its own build environment with the correct Java version. You don't need to worry about Java versions:

```bash
# Remove android folder (EAS generates it)
rm -rf android

# Run EAS build
eas build --platform android --profile preview
```

### Option 2: Install Java 17 or 21 for Local Builds

If you need to build locally (`./gradlew assembleRelease`):

#### On Arch Linux / CachyOS:
```bash
# Install Java 17
sudo pacman -S jdk17-openjdk

# Or install Java 21
sudo pacman -S jdk21-openjdk

# Set Java 17 as default (if needed)
sudo archlinux-java set java-17-openjdk
```

#### Verify Installation:
```bash
java -version
# Should show Java 17 or 21
```

### Option 3: Use Java Toolchain (Already Configured)

I've already updated your `android/build.gradle` to use Java 17 toolchain. However, you still need Java 17 or 21 installed on your system for this to work.

## What I've Fixed

1. ✅ Added Java toolchain configuration in `android/build.gradle`
2. ✅ Added `compileOptions` and `kotlinOptions` in `android/app/build.gradle`
3. ✅ Set Java version to 17 for compatibility

## Next Steps

### For EAS Build (Easiest):
```bash
rm -rf android
eas build --platform android --profile preview
```

### For Local Build:
1. Install Java 17 or 21 (see commands above)
2. Verify: `java -version`
3. Run: `cd android && ./gradlew assembleRelease`

## Why This Happens

- Java 25 is very new (released in 2025)
- Gradle 8.10.2 was released before Java 25
- Android builds typically use Java 17 or 21 (LTS versions)
- EAS Build handles this automatically

## Recommendation

**Use EAS Build** - It handles all Java version issues automatically and is the recommended way to build Expo apps for production.
