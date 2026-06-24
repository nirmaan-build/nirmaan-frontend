# Native setup — run on your Mac after pulling these changes

This UI pass added native modules. They won't render until you install + rebuild
(this can't be done in the Cowork sandbox — native code compiles on your machine).

## 1. Install JS deps

```bash
cd apps/mobile
yarn install
```

New dependencies:
- `react-native-svg` — required by lucide (vector icons)
- `lucide-react-native` — the icon set (see `src/components/Icon.tsx`)
- `react-native-toast-message` — toasts (see `src/lib/toast.ts`, wired in `App.tsx`)
- `react-native-bootsplash` — native splash screen

## 2. iOS pods

```bash
cd ios && bundle exec pod install && cd ..
```

`react-native-svg`, `react-native-bootsplash` and the others autolink — no manual
Podfile edits needed for svg/toast/icons.

## 3. Generate the native splash assets (bootsplash)

Provide a square logo PNG (e.g. `assets/bootsplash_logo.png`, ~1024px) then:

```bash
npx react-native-bootsplash generate assets/bootsplash_logo.png \
  --platforms=android,ios \
  --background=1f6feb \
  --logo-width=120
```

This writes the iOS storyboard + Android drawables and prints the small native
edits to confirm:
- iOS: it updates `Info.plist` / adds `BootSplash.storyboard` (the generator wires
  `UILaunchStoryboardName`). In `AppDelegate.mm`, the RN template already shows the
  root view; bootsplash hides via JS (`BootSplash.hide()` in `App.tsx`).
- Android: ensure `MainActivity.kt`/`.java` calls `RNBootSplash.init(this, R.style.BootTheme)`
  in `onCreate` **before** `super.onCreate(...)`, and that `styles.xml` has the
  `BootTheme` the generator added. The generator prints the exact snippet.

If you'd rather skip the native splash for now, the app still shows the animated
in-app splash (`src/screens/SplashScreen.tsx`) during auth hydration — just remove
the `BootSplash.hide(...)` call and the import in `App.tsx`.

## 4. Rebuild

```bash
yarn android      # or: yarn ios
```

## Notes
- `src/types/native-modules.d.ts` holds fallback type declarations so the project
  type-checks before install. Once the packages are installed they bring their own
  types; you can delete that file if you like (harmless to keep).
- Icons are referenced by semantic name via `<Icon name="..." />`. To swap the set,
  edit the single map in `src/components/Icon.tsx`.
