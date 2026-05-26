---
name: Expo native module resolution in pnpm workspace
description: expo-secure-store and other native-only Expo packages fail to resolve in Metro when installed via pnpm workspace symlinks
---

## Rule
Do NOT use `expo-secure-store` directly in VEILCHAT. Metro cannot resolve it through pnpm's virtual store symlinks even when the package is physically installed.

**Why:** pnpm uses a content-addressable store with symlinks. Metro's resolver doesn't follow these symlinks the same way Node does, causing "could not be found" errors at bundle time even when `ls node_modules` shows the package.

**How to apply:**
- For key/value storage needs: use `@react-native-async-storage/async-storage` (already installed, cross-platform, resolves fine)
- For truly native-only secrets: add expo-secure-store to `metro.config.js` as a platform alias, or use a polyfill on web
- Version compat: Expo SDK 54 expects `expo-secure-store@~15.0.8` — `56.x` is incompatible

## Also note
- `expo-firebase-recaptcha` must be installed for native OTP flow even though it's guarded by `Platform.OS !== 'web'` — Metro statically analyzes all requires
- Pattern: dynamic `require()` inside `if (Platform.OS !== 'web')` blocks still gets analyzed by Metro and causes "can't resolve" errors on web if the package isn't installed
