# Replace `react-native-background-timer` with in-house native modules

## Context

`react-native-background-timer` (v2.4.1) is used across 9 files in this app to keep `setTimeout`/`setInterval` firing while the app is backgrounded (call keep-alive, MQTT reconnect, token refresh, UI auto-hide, etc.). The package is unmaintained since 2023 and the app already carries a manual yarn patch (`.yarn/patches/react-native-background-timer-npm-2.4.1-bef63bbd2f.patch`) just to fix its Android wakelock tag. It still works correctly today — this isn't a bug fix — but it's a dependency-risk cleanup: replace it with an in-house Android TurboModule + iOS interop module, following this repo's existing native-module conventions (`AudioDeviceModule`/`AudioManager`, `SendLogsModule`), so the app no longer depends on unmaintained third-party native code for a load-bearing subsystem (call keep-alive, token refresh).

Per this repo's established convention, only Android gets a real codegen TurboModule; iOS custom modules always stay legacy interop (`RCTEventEmitter`/`NSObject` + `RCT_EXTERN_MODULE`), matching `AudioManager`/`SendLogsModule`/`CallManager`.

## Key discoveries from source review

- **Android native source** (`node_modules/react-native-background-timer/android/.../BackgroundTimerModule.java`): `PowerManager.PARTIAL_WAKE_LOCK` acquired in `start()`/released in `stop()`, plus per-call `Handler().postDelayed(...)` for each `setTimeout`. No native `clearTimeout` — cancellation is JS-side only. The legacy "Original API" (`runBackgroundTimer`/`backgroundClockMethod`) is confirmed unused by any of our 9 consumers — don't port it.
- **`node_modules/react-native-background-timer/index.js`**: `setInterval`/`clearInterval` are polyfilled **entirely in JS**, on both platforms — the wrapper keeps an id→callback map, calls native one-shot `setTimeout` for both timeouts and "intervals", and on fire, checks a `.interval` flag to decide whether to re-arm (same id) or delete. **We only need to implement native `setTimeout` + `start`/`stop` (Android) — `setInterval`/`clearInterval` stay JS-only, on both platforms.**
- **iOS native source** (`RNBackgroundTimer.m`, already read in full): `RCTEventEmitter` subclass, wraps each `setTimeout` in `beginBackgroundTask`/`endBackgroundTask` (dispatch_after), emits `backgroundTimer.timeout` with the JS-supplied id. `clearTimeout` is commented out — no-op, confirming JS-only cancellation on iOS too. `Info.plist` already declares `UIBackgroundModes: audio, voip`, so during an active call the app is kept alive regardless of `beginBackgroundTask`; that mechanism only matters outside an active audio session.
- **`jest.setup.js` mocks `'react-native-background-timer'` by module specifier** — this mock must be repointed at the new facade/specs as part of the *first* consumer migration (not deferred to final cleanup), or `__tests__/tools.test.js` breaks the moment `src/tools.js`'s import changes.
- No existing test exercises the actual timer-firing/cancellation contract — verification is necessarily manual/on-device, per the plan below.
- **The current library has no `Service`/foreground-service component of its own** — confirmed by reading `BackgroundTimerModule.java`: it's only a `PowerManager.PARTIAL_WAKE_LOCK` + `Handler().postDelayed(...)`, no notification, no foreground service type. Process-survival during calls comes entirely from this app's own separate `ForegroundService.java` (media playback + microphone type) — the wake lock only prevents CPU Doze sleep once the process is already alive; it does not protect the process from being killed. Outside of an active call, there is no process-kill protection today either way (existing limitation, not something this migration changes). **The new `BackgroundTimerModule` replicates this exactly — a self-contained TurboModule with its own wake lock, no `Service` of its own** — it does not need to integrate with or route through `ForegroundService.java`, since the current library never did.
- `BackgroundTimer.start()/stop()` (`src/zustand/inits.js`) is called on general service init/teardown, not gated to calls — this is unchanged behavior, just carried forward.

## Design

### 1. JS facade — `src/services/BackgroundTimer.js`
Mirrors `src/services/AudioBridge.js`'s platform-dispatch shape. Owns all id-correlation and interval-emulation logic (shared, not per-platform, to keep Android/iOS behavior identical). Native side only exposes one-shot `setTimeout(id, ms)` + a `timeout` event; `clearTimeout`/`setInterval`/`clearInterval` are pure JS bookkeeping (delete-from-map / re-arm-on-fire), exactly matching current behavior. `start()`/`stop()` are Android-only; no-ops on iOS.

```js
class BackgroundTimerFacade {
  callbacks = {}; // id -> { callback, interval, timeout }
  setTimeout(cb, ms) { /* assign id, arm native, store */ }
  clearTimeout(id) { delete this.callbacks[id]; }
  setInterval(cb, ms) { /* same as setTimeout but interval: true */ }
  clearInterval(id) { delete this.callbacks[id]; }
  start() { if (Platform.OS === 'android') NativeTimer.start(); }
  stop() { if (Platform.OS === 'android') NativeTimer.stop(); }
  // on native 'timeout' event: if entry.interval, re-arm same id before invoking callback;
  // else delete then invoke. Unknown/cleared id => ignore (tolerates late native fires).
}
export default new BackgroundTimerFacade();
```

### 2. Android TurboModule
- **`src/specs/NativeBackgroundTimerModule.ts`**: `setTimeout(id: number, timeoutMs: number): void`, `start(): void`, `stop(): void`, `readonly timeout: EventEmitter<number>`. No `clearTimeout` in the spec (native cancellation stays a no-op, matching current behavior and keeping Android/iOS symmetric for v1).
- **`android/app/src/main/java/com/galaxy_mobile/backgroundTimer/BackgroundTimerModule.java`** (new subpackage, same pattern as `audioManager/`): extends `NativeBackgroundTimerModuleSpec`, `@ReactModule`. Constructor creates (not acquires) a `PowerManager.PARTIAL_WAKE_LOCK` tagged `BackgroundTimerModule.class.getCanonicalName()` (this naturally carries forward the existing yarn patch's intent — no patch needed after migration). `start()`/`stop()` acquire/release the wake lock. `setTimeout(double id, double timeoutMs)` posts `Handler(Looper.getMainLooper()).postDelayed(...)` guarded by `hasActiveCatalystInstance()`, calls codegen-synthesized `emitTimeout(id)`. Add a `LifecycleEventListener.onHostDestroy()` to release the wake lock defensively. Drop the original's unused one-shot `"backgroundTimer"` event entirely.
- **`GxyPackage.java`**: add `import com.galaxy_mobile.backgroundTimer.BackgroundTimerModule;` and `modules.add(new BackgroundTimerModule(reactContext));` in `createNativeModules()`. No other registration needed.
- Verify the codegen-generated `emitTimeout` parameter type (from `EventEmitter<number>`) once the spec exists, before finalizing the Java method signature.

### 3. iOS interop module
- New folder `ios/GalaxyRN/BackgroundTimer/` (mirrors `AudioManager/`): `BackgroundTimer.h` (`NSObject <RCTBridgeModule>`), `BackgroundTimer.m` (`RCT_EXTERN_MODULE(BackgroundTimer, RCTEventEmitter)`, exports `setTimeout:(NSNumber*)timeoutId timeout:(NSNumber*)timeoutMs`), `BackgroundTimer.swift` (`class BackgroundTimer: RCTEventEmitter`, `supportedEvents() -> ["timeout"]`, `hasListeners`/`startObserving`/`stopObserving`, `setTimeout` wraps `beginBackgroundTask`/`endBackgroundTask` around `DispatchQueue.main.asyncAfter`, sends `"timeout"` event with the id).
- **Deliberate scope reduction**: do NOT port iOS `start`/`stop` — confirmed unused by any consumer (Android-only lifecycle in `inits.js`). Facade already gates `start()/stop()` to `Platform.OS === 'android'`.
- Design choice **event-emitter over Promise-per-call**: a Promise resolves once and can't be cleanly "un-resolved" on `clearTimeout`/interval re-arm; events match the current library's actual behavior and let the JS facade reuse its existing id/interval-correlation logic unchanged.
- Verify whether new Swift/`.m`/`.h` files need manual `.pbxproj`/bridging-header registration (check how `AudioManager`'s files are wired) — do this in Xcode directly, don't hand-edit `.pbxproj`.

### 4. Migration order (incremental, not one-shot)
Keep `react-native-background-timer` installed until all consumers are migrated and verified — cheap revert path if something regresses in this test-less subsystem.

1. Build native modules + facade, smoke-test in isolation (don't touch consumers yet).
2. Migrate consumers low-risk → high-risk, verifying each on-device before the next:
   `src/tools.js` → `src/zustand/uiActions.js` → `src/services/AudioBridge.js` (iOS-only path) → `src/zustand/shidur.js` → `src/libs/mqtt.js` (exercises interval emulation) → `src/libs/connection-monitor.js` (shared `timeout` var, highest id-correlation risk) → `src/libs/janus-mqtt.js` (real call keep-alive) → `src/auth/keycloak.js` (token refresh) → `src/zustand/inits.js` (Android-only `start`/`stop`, do last).
   Repoint `jest.setup.js`'s `react-native-background-timer` mock to the new facade **in the same step as `src/tools.js`**, not deferred — otherwise `tools.test.js` breaks immediately.
3. Only after all 9 are verified: remove `react-native-background-timer` + `@types/react-native-background-timer` + the yarn `resolutions` patch entry from `package.json`, delete the `.yarn/patches/...` file, `yarn install`, clean rebuild both platforms, confirm no stale autolinking/Podfile.lock entry remains.
4. Before deleting the dependency, re-grep the repo for `react-native-background-timer` imports and for `runBackgroundTimer|backgroundClockMethod|stopBackgroundTimer` to confirm no new call sites appeared since planning.

### Critical files
- `src/services/AudioBridge.js` — template for the new facade's platform-dispatch shape
- `android/app/src/main/java/com/galaxy_mobile/audioManager/AudioDeviceModule.java` + `GxyPackage.java` — Android TurboModule + registration template
- `ios/GalaxyRN/AudioManager/AudioManager.swift` + `.m`/`.h` — iOS event-emitter interop template
- `jest.setup.js` — mock to repoint
- The 9 consumer files listed above

## Verification
- Optional but recommended: `__tests__/BackgroundTimer.test.js` mocking both native specs, driving the facade's id-correlation/interval-emulation logic directly (catches re-arm/clear-guard regressions without a device).
- Manual on-device (both platforms unless noted): basic `setTimeout`/`clearTimeout` fire/cancel; `setInterval` fires 3-4+ consecutive times via `mqtt.js`'s keepalive; Android wake lock held/released across `initServices()`/`terminateServices()` (`adb shell dumpsys power`) including force-kill leak check; real/extended call keep-alive via `janus-mqtt.js` with screen locked on both platforms; network toggle to exercise `connection-monitor.js`'s shared-timeout reconnect loop; token refresh + post-logout non-refire via `keycloak.js`; `uiActions.js` auto-hide/cancel; iOS-only `AudioBridge.js` `activateAudioOutput` delayed call.
- Final grep sweep for the intentionally-dropped legacy APIs (`runBackgroundTimer`, iOS `start`/`stop`) to confirm the scope-reduction assumptions still hold at implementation time.
