# Testing & debugging GalaxyRN

Two layers. Run them in order — unit first (cheap, deterministic), then E2E (needs a device).

| Layer | Tool | Command | Needs | Agent |
|-------|------|---------|-------|-------|
| Unit | Jest | `yarn test` | nothing | `test-runner` |
| E2E | Maestro | `scripts/device-verify.sh …` | device + `.env` | `device-verifier` |
| Both | — | ask the `qa-runner` agent | — | `qa-runner` |

## 1. Unit tests (Jest)

```bash
yarn test                              # whole suite
yarn test __tests__/tools.test.js      # one file
yarn test -t "fixTextEncoding"         # one case
```

- Config: `jest.config.js` (`@react-native/jest-preset`); mocks: `jest.setup.js`.
- Tests live in `__tests__/*.test.js`. Current suites: `tools.test.js` (storage/date/string/encoding
  helpers), `sdp.test.js` (H.265/H.264/MediaTek SDP munging). All target **pure logic** in
  `src/tools.js`.
- **Do not add full `<App/>` render tests** — they drag in the whole native graph (WebRTC, zustand→
  immer, janus-mqtt) and are fragile. Test pure functions.
- **#1 gotcha:** `transformIgnorePatterns` in `jest.config.js` must whitelist `react-native` itself
  (its entry uses `import typeof`). The error when it's missing is
  `Cannot use import statement outside a module` on `react-native/index.js`. Same class of error
  for any node_module shipping ESM/Flow (immer, zustand, @sentry/*) — add it to the whitelist group.

## 2. E2E tests (Maestro, on device/emulator)

Wrapper: `scripts/device-verify.sh` (loads `.env`, passes `-e APP_ID`, screenshots →
`verify-results/`). Full device prerequisites and the QA checklist mapping are in
[`device-verify.md`](device-verify.md) and [`device-test-checklist.md`](device-test-checklist.md).

```bash
# one-time / setup
bash scripts/device-verify.sh doctor        # device + Maestro + APK present?
bash scripts/device-verify.sh prep           # (MIUI) allow adb installs, kill autofill
bash scripts/device-verify.sh install         # install debug APK
bash scripts/device-verify.sh metro           # adb reverse :8081 (needs `yarn start`)

# flows
bash scripts/device-verify.sh smoke           # no creds — bundle loads, native init OK
bash scripts/device-verify.sh regression      # needs .env creds
bash scripts/device-verify.sh chat            # in-room — needs creds + E2E_ROOM
bash scripts/device-verify.sh rejoin          #   "
bash scripts/device-verify.sh audio-device    #   " (Android only)
bash scripts/device-verify.sh flow <file>.yaml # any flow
```

Flows (`.maestro/`): `smoke` → `login` (subflow) → `regression`; in-room `join-room` (subflow) →
`chat` / `rejoin` / `audio-device`. All templated with `appId: ${APP_ID}`; creds and `E2E_ROOM`
come from `.env` (see `.env.example`). iOS: Maestro can drive the **simulator** only (no idb for a
physical device); pass `-e APP_ID=com.galaxy.mobile`.

### Known blocker — in-room flows need real room data
`chat` / `rejoin` / `audio-device` and `regression`'s room-join require `E2E_ROOM` to be a room the
test account can actually join. The `testingto` account currently lists **"No rooms found"**, so
these stay RED for lack of test data — not an app bug. Provide a valid room/account to make them green.

## Agents (`.claude/agents/`)

- **`test-runner`** — runs & repairs the Jest suite (config, mocks, tests). Cheap, no device.
- **`device-verifier`** — drives Maestro on a real Android device, repairs flow selectors, reads
  screenshots/logcat, writes `verify-results/report.md`.
- **`qa-runner`** — top-level gate: runs both layers, writes `verify-results/qa-report.md`, and
  delegates deep repair to the two agents above.

Ask for the `qa-runner` agent for a full pass; use `test-runner` after touching pure-logic modules;
use `device-verifier` for anything on the device.
