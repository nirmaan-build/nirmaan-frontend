# Nirmaan Mobile (React Native CLI)

Bare **React Native CLI** app (no Expo), Android-first — PRD-02.

## Stack (PRD-02 §4)
- React Navigation (native-stack + bottom-tabs)
- React Query (server state) + Zustand (auth + locale)
- **MMKV** for tokens/prefs (synchronous, faster than AsyncStorage); transparent refresh on 401
- i18n via `src/i18n/en.json` + `hi.json` (every UI string goes through `t()`)

The `android/` and `ios/` native projects live here (RN CLI, app id `com.nirmaan`).

## Structure
```
App.tsx, index.js, app.json, metro.config.js, babel.config.js
src/
├── config.ts            API_URL (set to your LAN IP for a real device)
├── theme.ts
├── i18n/                en.json, hi.json, index.ts (t / useT)
├── store/               authStore, settingsStore (Zustand)
├── api/                 client (fetch + refresh), hooks (React Query), types
├── components/          Header, Button, Input, SearchBar, AreaPickerModal,
│                        TruckIcon, LanguageToggle, Skeleton, Card
├── screens/             auth/, Onboarding, Home, Categories, CategoryPage,
│                        ItemDetail, PostRfq, RfqConfirmation, Truck, Profile,
│                        MyRequirements, Content, Splash
└── navigation/          Root / Auth / App (tabs + stack)
```

## Run
Set `src/config.ts` `API_URL` to your computer's LAN IP, then:

```bash
yarn install
yarn pods      # iOS only
yarn a         # android  (aliases: yarn i = ios, yarn s = start Metro)
```

MMKV is a native module, so do a full rebuild (`yarn a`) after install, not just a Metro reload.

## Not yet wired (later stages)
- Google sign-in (button stubbed; needs native SDK + client ID) — email OTP works.
- FCM push (needs native firebase) — lead alerts are backend rows for now.
- Help/Privacy/Terms content endpoint.
