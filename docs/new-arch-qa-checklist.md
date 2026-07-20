# New Architecture — manual QA checklist

Manual regression checklist for releasing `upgrade_rn` (Fabric/TurboModules enabled on both platforms,
`bridgelessEnabled=true` on Android). There is no automated test coverage for any of this — treat this
checklist as the actual safety net before merging to `master`. See `NEW_ARCHITECTURE.md` for background.

Run the full list on **both platforms**, and on Android specifically on one device/emulator with
API < 33 and one with API >= 33 (two different `CallListenerModule` code paths).

## Core video/call flow

- [ ] Fresh install, grant camera/microphone/(phone, Android) permissions when prompted
- [ ] Join a room — video renders via `RTCView` for at least 2 participants/streams
- [ ] Leave and rejoin the same room — video still renders correctly
- [ ] Switch audio output route mid-call (speaker / earpiece / bluetooth if available)

## Call interruption (Android: test on both API<33 and API>=33)

- [ ] Receive a real GSM phone call while in a video conference — app should mute/pause
- [ ] End the phone call — conference audio/video should resume correctly

## Backgrounding

- [ ] Background the app during an active call (press home) — foreground service should keep the
      call alive; check the persistent notification appears (Android)
- [ ] Return to the app — call is still connected, video still renders
- [ ] Repeat on Android 12+ specifically (known history of `SecurityException` on foreground
      service start — see `ForegroundModule`/`ForegroundService`)

## Keep screen awake

- [ ] Screen stays on during an active call (no auto-lock)
- [ ] Screen returns to normal auto-lock behavior after leaving the call

## Logs

- [ ] Trigger "send logs" from settings — export/share completes without error

## Permissions edge cases (Android)

- [ ] Deny microphone/camera permission on first launch, then grant it later from system settings —
      app should recover without requiring a reinstall

## Crash reporting

- [ ] Trigger a deliberate native crash in a release build and confirm it appears in Sentry with a
      symbolicated stack trace (Proguard mapping on Android, dSYM on iOS) — do this once per release
      build, not per QA pass, to confirm the upload pipeline is actually wired end-to-end
