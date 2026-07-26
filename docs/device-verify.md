# On-device verification (Maestro + device-verifier subagent)

Repeatable verification of the app on a **real connected Android device**. Deterministic
Maestro flows run for ~0 Claude tokens; the `device-verifier` subagent is only needed to
author/repair flows and make visual judgments.

## Prerequisites
1. **Device**: enable Developer options → USB debugging (Xiaomi: also "Install via USB"),
   connect in "File transfer" mode, accept the RSA prompt. Verify: `adb devices` is non-empty.
   - **Xiaomi/MIUI/HyperOS + Maestro:** Maestro installs an instrumentation driver APK which MIUI
     blocks with `INSTALL_FAILED_USER_RESTRICTED`. Fix (also done by `device-verify.sh prep`):
     `adb shell settings put global verifier_verify_adb_installs 0` (newer HyperOS has **no** "MIUI
     optimization" toggle). `prep` also disables the system autofill
     (`settings put secure autofill_service null`) so Chrome's saved-password popup doesn't clobber
     typed login creds. If Maestro still won't install, fall back to the manual-adb path (screencap
     + uiautomator + logcat), which needs only plain USB debugging.
   - **Stale bundle / `PlatformConstants could not be found` red screen:** a Metro cache glitch after
     rapid JS edits — fix with `yarn start:reset` and relaunch (not a native/new-arch problem).
2. **Metro** (debug APK loads JS from it): `yarn start` in a separate terminal.
3. **APK**: `android/app/build/outputs/apk/debug/app-debug.apk` (build: `cd android && ./gradlew assembleDebug`).
4. **Maestro**: `curl -Ls "https://get.maestro.mobile.dev" | bash` (needs Java).
5. **Creds** (only for the authenticated regression): copy `.env.example` → `.env` and set
   `E2E_USERNAME` / `E2E_PASSWORD`.

## Run
```bash
bash scripts/device-verify.sh doctor       # check device + tooling
bash scripts/device-verify.sh all          # doctor -> install -> metro -> smoke
bash scripts/device-verify.sh smoke        # credential-less smoke (asserts LoginScreen)
bash scripts/device-verify.sh regression   # full flow (needs .env creds)
```
Or ask the **`device-verifier`** subagent to run it — it will drive the flows, tune the
Keycloak login selectors against the real page, do visual checks, and write
`verify-results/report.md`.

## What to test
The master scenario list is **`docs/device-test-checklist.md`** — every case, tagged
🤖 automated (Maestro) / 👁 subagent visual-logcat / ✋ manual-hardware.

## What each flow proves
- `smoke.yaml` — JS bundle loads, native init (WebRTC/audio/TurboModules) doesn't crash, the
  permission gate auto-clears, LoginScreen reached. The always-on, credential-less gate.
- `login.yaml` — automated Keycloak OAuth login (selectors tuned on device).
- `regression.yaml` — room join, audio mode, background/foreground (foreground service), PiP,
  send logs — mapped to `new-arch-qa-checklist.md`.

Artifacts (screenshots, report) land in `verify-results/` (gitignored).
