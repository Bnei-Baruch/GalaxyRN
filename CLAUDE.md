# GalaxyRN

React Native (0.82.1, React 19) video-conferencing app (WebRTC). Android runs on the new architecture.

## Commands

- `yarn start` — Metro bundler (`yarn start:reset` to clear cache)
- `yarn android` / `yarn ios` — run on device/emulator
- `yarn test` — jest
- `yarn lint` — eslint; **no eslint config file exists in the repo** despite this script — likely broken, don't assume it works
- `yarn bundle:android` / `yarn bundle:ios` — production JS bundle
- `yarn release:android` / `yarn release:ios` — full release build (gradle/xcodebuild + bundling)
- `yarn vbump` — bump version via `scripts/version-bump.js`

## Stack

- State: **zustand** only — no Redux, no Context-based global state
- i18n: i18next / react-i18next
- Errors/crashes: Sentry (`@sentry/react-native`)
- Mostly JavaScript, not TypeScript — `App.js`/`index.js` are JS; TS types are partial/incidental. No root `tsconfig.json` (TS config, where used, comes from `@react-native/typescript-config`)
- New code convention: write new files in TypeScript (`.ts`/`.tsx`), including `src/specs/` (required by Codegen — see `NEW_ARCHITECTURE.md`). Existing `.js` files are **not** being retroactively converted as part of ongoing work — that's a deliberately separate, not-yet-scheduled initiative. Don't rewrite an existing file to TS just because you're touching it.
- Absolute imports: `src/*` is aliased to `*` (see `jsconfig.json`, `baseUrl: "."`) — import from `src` root, not relative paths across features
- Prettier: semi, singleQuote, printWidth 80, tabWidth 2, trailingComma es5, arrowParens avoid

## Source map (`src/`)

- `InRoom/` — the conference screen; has `Feeds/` and `Layout/` subfolders
- `shidur/` — broadcast/audio-direction controls, incl. `audioSelect/`
- `chat/` — in-room chat UI
- `bottomBar/`, `topBar/` — persistent chrome around the room screen
- `auth/` — login/auth flow
- `settings/` — user/app settings screens
- `zustand/` — state slices, one file per domain (`chat.js`, `user.js`, `inRoom.js`, `settings.js`, `feeds.js`, `myStream.js`, `audioDevices.js`, etc.) — add new global state here, not ad hoc in components
- `components/` — shared/reusable UI components
- `services/`, `libs/` — non-UI logic and integrations
- `shared/` — cross-feature utilities
- `i18n/`, `assets/` — translations and static assets

## App flow

Startup sequence: **permissions screen** (until all required permissions granted) → **login screen** (until authenticated via Keycloak or a saved session is restored) → `initApp()` (`src/zustand/inits.js`) → **BeforeRoom screen** (`src/InRoom/BeforeRoom.js`) → **InRoom screen**.

`initApp()` (called from `BeforeRoom`'s mount effect) starts the Android foreground service (`GxyUIStateBridge.startForeground()`) *before* `initServices()`/`initMQTT()` — i.e. the foreground service (and the process-kill protection it gives) is tied to the **login/app session**, not to being in a room or call. It's stopped by `terminateApp()`, called on `BeforeRoom` unmount or by the network-failure path below. Joining/leaving a room only calls `updateUIState()`, which refreshes the already-running foreground notification but never stops it.

**Network-failure teardown**: `src/libs/connection-monitor.js` polls every ~1s (`monitorNetInfo`/`monitorMqtt`); if disconnected longer than `MAX_CONNECTION_TIMEOUT` (20s), `onNoNetwork()` calls `exitRoom()` then `terminateApp()` — a full session teardown (stops the foreground service too), not just a local monitor reset.

## Gotchas

- `ios.zip` at repo root is a stray archive, not source — ignore it
- New architecture is enabled on both platforms (Fabric/TurboModules) — see `NEW_ARCHITECTURE.md` before touching native modules or third-party native deps
