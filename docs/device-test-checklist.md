# On-device test checklist (master list of what to verify)

The single source of truth for **what** the on-device verification covers. The `.maestro/*.yaml`
flows and the `device-verifier` subagent execute against this list. New-arch-specific regression
notes live in `new-arch-qa-checklist.md`; this file is the task-agnostic app checklist.

**Coverage legend**
- 🤖 **Maestro** — coded assertion, runs headless for ~0 Claude tokens (`smoke`/`login`/`regression`).
- 👁 **Subagent** — needs vision/logcat judgment (video actually renders, PiP looks right, no crash).
- ✋ **Manual** — hardware/OS interaction Maestro can't drive (real GSM call, bluetooth, Sentry).

## 1. Launch & smoke  (flow: `smoke.yaml`, no creds)
- [ ] 🤖 App launches, does not crash on startup
- [ ] 🤖 Permission gate auto-clears after permissions granted (poll ~1s)
- [ ] 🤖 Reaches LoginScreen — asserts brand **"Arvut"** (and "LOGIN")
- [ ] 👁 logcat clean: no `FATAL EXCEPTION` / `AndroidRuntime` / `TurboModule` / `Fabric` /
      `bridgeless` / `ReactApplicationContext is null`

## 2. Permissions
- [ ] 🤖 First launch grants camera / microphone / phone (+ bluetooth SDK≥31, notifications SDK≥33)
- [ ] 👁✋ Deny mic/camera, then grant from system Settings → app recovers without reinstall
      (native `onResume → recheckPermissions`)

## 3. Auth  (flow: `login.yaml`, needs `.env` creds)
- [ ] 🤖 Login via Keycloak with the test account (selectors tuned on device by the subagent)
- [ ] 👁 Lands on the Settings / "Join Room" screen after OAuth redirect

## 4. Room & video — core  (flow: `regression.yaml`)
- [ ] 🤖 Select a room and tap **"Join Room"**
- [ ] 👁 Video renders via `RTCView` for at least 2 participants/streams
- [ ] 👁 Leave and rejoin the same room → video still renders
- [ ] 👁✋ Switch audio output route mid-call (speaker / earpiece; **bluetooth = ✋ hardware**)

## 5. Backgrounding & foreground service
- [ ] 🤖 Press Home during an active call
- [ ] 👁 Persistent foreground-service notification appears; logcat shows `ForegroundService` start
- [ ] 👁 Return to app → call still connected, video still renders
- [ ] 👁 Android 12+ specifically: no `SecurityException` on foreground-service start

## 6. Picture-in-Picture
- [ ] 👁 Home while in a room (`onUserLeaveHint`) → PiP window appears and looks correct

## 7. Keep screen awake
- [ ] ✋ Screen stays on during an active call (no auto-lock)
- [ ] ✋ Normal auto-lock returns after leaving the call

## 8. Call interruption  (✋ real GSM call; test on Android API<33 AND API≥33)
- [ ] ✋ Incoming phone call during a conference → app mutes/pauses
- [ ] ✋ End the call → conference audio/video resumes

## 9. Send logs
- [ ] 👁 Settings → "send logs" → export/share completes without error

## 10. Offline / network
Toggle connectivity with `scripts/device-verify.sh net {wifi-off|data-off|offline|online|...}`
(uses `adb shell svc wifi/data`; granular Wi-Fi vs mobile data).
- [ ] 🤖 No network pre-login (`net offline`) → LoginScreen still renders; then `net online`
- [ ] 👁 Network loss after init/in-room (`net offline`) → `NetConnectionModal` overlay appears;
      restore (`net online`) → reconnects
- [ ] 👁 Wi-Fi→mobile handoff (`net wifi-off` with data on) → call survives
- [ ] 👁✋ Wi-Fi→Wi-Fi handoff — join a call on network A, `net wifi-switch b`, verify the call
      survives the roam, then `net wifi-switch a`. Needs two APs in range + `.env` `E2E_WIFI_A/B_*`.

## 11. Crash reporting  (✋ release build, once per release)
- [ ] ✋ Deliberate native crash → appears in Sentry with symbolicated stack (Proguard/dSYM)

---
Automated subset (🤖) is the always-on gate; 👁 items are run by the `device-verifier` subagent;
✋ items stay a short manual pass. Artifacts land in `verify-results/`.
