# TODO

Collected from `TODO`/`FIXME` comments in the source.

## MQTT / Janus transport

- [ ] `src/libs/janus-mqtt.js:58` — on reconnect to the `user.id` topic, messages from the previous session may arrive; check and handle.
- [ ] `src/libs/janus-mqtt.js:285` — check whether the request object is needed.
- [ ] `src/libs/janus-mqtt.js:524` — add `iceFailed` to the plugin handle.
- [ ] `src/libs/mqtt.js:174` (FIXME) — send cmd messages to a separate topic.

## Janus plugins — connection state

Comment out the workaround once there is a way to detect Janus connection state:

- [ ] `src/libs/publisher-plugin.js:341`
- [ ] `src/libs/streaming-plugin.js:212`
- [ ] `src/libs/subscriber-plugin.js:204`

## Sentry (`arvut-mobile`, as of 2026-11-11)

See `sentry-report-2026-11-11.md` for numbers and details.

- [x] **ARVUT-MOBILE-1XD** — `performCleanup` called
  `ReactNativeHost.getReactInstanceManager()` on the new architecture. Already
  fixed (uses `reactHost`); events come only from releases ≤ 2.8.13. Resolve in
  Sentry.
- [x] **ARVUT-MOBILE-1P3** (fatal) — NPE `Context.getPackageName()` in
  `GxyUIStateModule.startService`. Fixed in 508efe4 (application context instead
  of `getCurrentActivity()`), shipped in 2.8.22; no events from 2.8.22+.
- [x] **ARVUT-MOBILE-25W** — "Cannot keep screen on: no current activity":
  `ON_START` fires before `ReactHost` has the new activity; now retried on
  `ON_RESUME`. **Verify on device** (re-create activity while in room).
- [x] `JanusMqtt, Janus error response, [object Object]` — now logs
  `code` / `reason`.
- [x] JanusMqtt keepAlive `Timeout after 2000ms` (~900k events) — timeout 5s,
  `warn` per miss, `error` only on the 3rd miss in a row.
- [x] `JanusMqtt, reconnectMqtt skipped, not connected` — `error` → `warn`.
- [ ] Mqtt `Bad User Name or Password` (134) — forced token refresh on 134
  exists since 9571f9c (2026-10-11). Check the release breakdown of
  ARVUT-MOBILE-233: if it still happens on 2.8.22+, the refresh itself is
  failing (Sentry API returned 504 when checked on 2026-11-11).
- [x] `BackgroundTimer` interval callback throws `connack timeout` — mqtt's
  keepalive tick is wrapped in `src/libs/mqtt.js` (`warn`).
- [x] `[AudioHelper] Group not found` for types 25 / 13 — came from log-only
  lookups in `AudioDeviceManager` callbacks (removed); unsupported types are
  also filtered out of the device list. `TYPE_DOCK` is ignored, not routed.
- [x] `FeedsStore initFeeds: Cannot read property 'room' of null` — skip when
  the room was already left.
- [ ] Mqtt `Not authorized` (135) — no forced token refresh (only 134 sets
  `forceTokenRefresh`, `src/libs/mqtt.js` `on('disconnect')`), so reconnect may
  resend the rejected token. Seen on iPhone 2026-11-15: after a 135 disconnect
  + Janus keepAlive timeout nothing recovered. Related: Janus transactions
  (`src/libs/janus-mqtt.js` `transaction()`) and `waitConnection()` have no
  timeout, so a `switch` (translation change) hangs forever while MQTT is down.
- [ ] Not looked at yet: ARVUT-MOBILE-260 (PIP entry refused), 227 (switch
  stream error 455), 23C / 23Q (API errors), `Server busy` (137, broker side).

## Shidur

- [ ] Check and fix subtitles scaling in full-screen shidur.

## UI/UX

- [ ] First "Watch broadcast" tap lost after switching entry mode (Android,
  2026-11-15): right after the `entry-options` flow toggles All → Broadcast,
  the first `joinRoomBtn` tap never reaches `handleJoin` (no `joinRoom` in the
  log), a second tap joins at once — even after `waitForAnimationToEnd`.
  Suspect the re-layout on mode change (ten picker removed, Join becomes the
  wide standalone button). E2E works around it with a retry in
  `.maestro/broadcast-only-join.yaml` — remove the retry once fixed.

- [x] Presets for entering a room — Broadcast / Ten tiles on the before-room
  screen (`src/settings/EntryOptions.tsx`, `isShidur` / `isTen` in
  `src/zustand/settings.js`, in memory only):
  - Broadcast only (`isTen=false`) — no videoroom at all
  - Ten only (`isShidur=false`)
  - …possibly more options to come

## E2E

- [ ] `.env`: `E2E_ROOM` is empty — set it (e.g. `test mobile`), otherwise
  in-room flows and `device-verify.sh full` need `E2E_ROOM=... ` on the command
  line.
- [ ] iOS Simulator runs are flaky for environment reasons: CoreAudio
  `AURemoteIO::Initialize` RPC timeout → SIGABRT on joining a room (WebRTC
  audio), once a Hermes debugger SIGSEGV. Not app bugs; retry, or prefer Android.
