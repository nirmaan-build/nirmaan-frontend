# Upgrade: React Native 0.74.5 → 0.86 + React Navigation 6 → 7

`package.json` has already been updated to the target versions. The remaining work
is native and must run on your Mac (native code can't be compiled in Cowork).

## What changed (JS side — already done)

| Package | Before | After |
|---|---|---|
| react-native | 0.74.5 | **0.86.0** |
| react | 18.2.0 | **19.2.3** |
| @react-navigation/native | 6.x | **7.x** |
| @react-navigation/native-stack | 6.x | **7.x** |
| @react-navigation/bottom-tabs | 6.x | **7.x** |
| react-native-screens | 3.x | **4.x** (required by native-stack 7) |
| react-native-safe-area-context | 4.x | **5.x** |
| react-native-mmkv | 2.x | **3.x** (New Architecture only) |
| zustand | 4.x | **5.x** |
| @react-native/* (babel/metro/eslint/ts-config) | 0.74.87 | **0.86.0** |
| @react-native-community/cli* | (bundled) | **20.1.0** (now explicit) |
| typescript | 5.0.4 | **5.8.3** |
| Node engine | ≥18 | **≥22.11** |

No application source changes were needed: we use the dynamic navigator API, all
`useRef` calls pass an initial value (React 19-safe), and our `NavigationContainer`
theme spreads the base theme so the new `fonts` field is carried through.

## Prerequisites on your machine

- **Node ≥ 22.11** (`node -v`) — RN 0.86 won't run on 18/20.
- **JDK 17** (Android), **Android Studio** recent, Android SDK 35/36.
- **Xcode** latest stable + Command Line Tools; **CocoaPods** via Bundler (`bundle`).
- New Architecture is **mandatory** in 0.86 (legacy arch removed). All our native
  libs above support it.

## Step 1 — Regenerate the native projects (Upgrade Helper)

A 0.74→0.86 jump rewrites `android/`, `ios/`, Gradle, Podfile, `Gemfile`, etc. Use
the official diff tool rather than hand-editing:

> https://react-native-community.github.io/upgrade-helper/?from=0.74.5&to=0.86.0

Apply the diffs to (at minimum):
- `android/build.gradle`, `android/app/build.gradle`, `android/gradle.properties`,
  `android/settings.gradle`, `android/gradle/wrapper/gradle-wrapper.properties`,
  `MainActivity.kt`, `MainApplication.kt`
- `ios/Podfile`, `ios/<App>/AppDelegate.swift|mm`, `ios/<App>.xcodeproj` settings
- `Gemfile`, `.ruby-version`, `metro.config.js`/`babel.config.js` (ours already
  match the 0.86 template — re-check), `app.json` is unchanged

Keep our customizations: the monorepo `metro.config.js` (`watchFolders` +
`nodeModulesPaths`) and the MMKV/bootsplash setup.

> Tip: if conflicts get messy, scaffold a throwaway `npx @react-native-community/cli@latest init Tmp --version 0.86.0`, diff its `android/`+`ios/` against ours, and port the deltas.

## Step 2 — Confirm New Architecture is on

- `android/gradle.properties`: `newArchEnabled=true`
- iOS installs with new arch (our `yarn pods` script sets `RCT_NEW_ARCH_ENABLED=1`).

## Step 3 — Clean reinstall

```bash
cd apps/mobile
rm -rf node_modules
yarn install

# iOS
cd ios
bundle install
RCT_NEW_ARCH_ENABLED=1 bundle exec pod install   # or: yarn pods
cd ..
```

## Step 4 — Regenerate the splash (bootsplash)

```bash
npx react-native-bootsplash generate assets/bootsplash_logo.png \
  --platforms=android,ios --background=1f6feb --logo-width=120
```

(See `SETUP-NATIVE.md` for the native snippet bootsplash prints.)

## Step 5 — Clean build & run

```bash
# Android
cd android && ./gradlew clean && cd ..
yarn android

# iOS (Xcode: Product → Clean Build Folder first)
yarn ios

# If Metro caches stale: yarn start --reset-cache
```

## Library migration notes

- **React Navigation 7 — `navigate()` now pushes.** In v6, `navigate` to an
  existing route went *back* to it; in v7 it adds a new copy (like `push`). Our
  flows don't rely on the old behavior (tab `navigate` still switches tabs, and our
  stack uses forward navigation), so no change is needed — but if you add deep flows
  later, use `popTo`/`navigateDeprecated` where you specifically want the old jump-back.
- **react-native-screens 4** is required by native-stack 7 and is New-Arch only.
- **react-native-mmkv 3** is a TurboModule (New Arch). API is unchanged, so
  `src/lib/storage.ts` works as-is.
- **zustand 5**: our `create((set) => …)` stores are compatible; no change.
- **React 19**: `react-test-renderer` is deprecated. If you add component tests,
  prefer `@testing-library/react-native`. The fallback type-decl file
  `src/types/native-modules.d.ts` can be deleted once the real packages are installed.

## Verify

```bash
yarn typecheck   # tsc against the NEW types
yarn lint
yarn start --reset-cache
```

If `typecheck` flags anything after install, it'll almost certainly be a navigation
v7 type tweak — ping me with the error and I'll patch it.
