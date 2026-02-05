# Android APK Build Guide

## Prerequisites

- Node.js 18+
- [EAS CLI](https://docs.expo.dev/build/setup/): `npm install -g eas-cli`
- Expo account: `eas login`

## Quick Build

```bash
# Preview APK (internal install, no store)
npm run build:apk:preview

# Production APK (store-ready, version auto-increment)
npm run build:apk:production
```

Or with EAS directly:

```bash
eas build --platform android --profile preview --non-interactive
eas build --platform android --profile production --non-interactive
```

## Pre-build Checks

1. **Verify JS bundle builds** (catches Metro/Babel issues):
   ```bash
   npm run build:export
   ```

2. **Config** (`eas.json`):
   - `preview` and `production` use `android.buildType: "apk"`.
   - No custom Gradle; EAS handles the native build.

## After the Build

- Build runs on EAS servers (~10–15 min).
- **Logs**: Link printed in terminal, or [expo.dev](https://expo.dev) → project → Builds.
- **APK**: **Application Archive URL** in build details (e.g. `https://expo.dev/artifacts/eas/...apk`).

```bash
# Check latest build status
eas build:list --platform android --limit 1
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `eas: command not found` | `npm install -g eas-cli` or use `npx eas` |
| Not logged in | `eas login` |
| Gradle errors | Ensure no local `android/` overrides; use EAS default Android project. |
| Bundle export fails | Run `npm run build:export`; fix Metro/Babel errors before running EAS build. |

## Verified Setup (Campus Trails)

- **Expo SDK**: 52.x  
- **EAS**: `preview` and `production` profiles with `buildType: apk`  
- **QR / pathfinding**: Configured; no build-specific changes required  
- **Last verified**: EAS preview APK built successfully (no Gradle/Expo errors)
