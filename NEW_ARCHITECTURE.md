# New Architecture migration

Status: **enabled on both platforms**, not in-progress.

- Android: `android/gradle.properties` — `newArchEnabled=true`, `bridgelessEnabled=true`, `hermesEnabled=true`
- iOS: `ios/Podfile` — `ENV['RCT_NEW_ARCH_ENABLED'] = '1'`
- Migration commit: `b0c16f3` ("move android to new arcitecture", 2025-12-04) — despite the message, it flipped both platforms

## React Native version upgrade (0.82.1 → 0.86.0, staged)

Upgrading one minor version at a time (0.83 → 0.84 → 0.85 → 0.86), each verified with a real build on both
platforms, because 0.85 removes the classic bridge **entirely, with no fallback** — any dependency without genuine
New Architecture support would hard-fail there, not degrade gracefully. `react-native-webrtc` in particular has
New Arch support the maintainers themselves call experimental/untested (GitHub issue #1557, PR #1590 not merged).

**Done: 0.82.1 → 0.83.0 → 0.84.0 → 0.85.0 → 0.86.0 (latest).** Both platforms build clean at every step (`react`
pinned to the exact version each RN release requires, not just semver-compatible — RN's bundled renderer
hard-checks `React.version` for an exact string match, e.g. `"19.1.1" !== isomorphicReactPackageVersion`, so a
semver-satisfying-but-not-identical `react` version throws at runtime). Current: `react-native@0.86.0`,
`react@19.2.3`, `react-test-renderer@19.2.3` (always pin this identical to `react`).

At 0.85.0 (bridge removal, the highest-risk step): `react-native-webrtc`, `react-native-orientation-locker`,
`rn-secure-storage` all **compiled cleanly** with no new-architecture/bridgeless-related errors — only their own
pre-existing, unrelated deprecation warnings (old iOS API usage predating this migration). This is a compile-time
signal only; it does **not** confirm runtime correctness — an actual video call, secure storage read/write, and
orientation lock still need to be manually verified on a real device before trusting this in production.

Issues found and fixed along the way (unrelated to RN's own compatibility, environment/tooling only):
- `node_modules/.bin/{rnc-cli,metro,metro-symbolicate}` lost their executable bit on install (recurs on
  reinstall — re-run `chmod +x` on the resolved target if `npx react-native config` or `yarn start` fails with
  "Permission denied").
- A corrupted/partial `React-Core-prebuilt` pod cache caused a missing `React-VFS.yaml` at the 0.85.0 step
  (fixed by `rm -rf ios/Pods ios/Podfile.lock && pod install`).
- `pod install` version conflicts (`fast_float`, `Crisp`) recur whenever a dependency bump changes a transitive
  CocoaPods version — fix by updating the conflicting pods together in one `pod update <podA> <podB>
  --no-repo-update` call (updating them one at a time can make each fix clobber the other).
- Bumping `react-native-app-auth` to 8.4.1 pulls in `androidx.browser:browser:1.9.0`, which requires
  `compileSdk 36` (project is on 35) — reverted to the exact `8.1.0` (not `^8.1.0`; a caret range won't force
  a downgrade once the higher version is already resolved in `yarn.lock`). Bumping this dependency needs a
  `compileSdk`/`buildToolsVersion` migration first — not bundled into this pass.

## Rollout status

Not yet released. Before merging to `master`: run `docs/new-arch-qa-checklist.md` on both platforms and get a
green build from the `.github/workflows/build-check.yml` CI job (Android/iOS debug build — nothing else in CI
compiles or tests the app). Roll out via Play Console staged rollout / TestFlight, not directly to 100%.

**iOS: verified with a real `xcodebuild` compile** (Debug, generic iOS Simulator destination) — `BUILD SUCCEEDED`
after fixing several issues the codegen-only checks couldn't catch: the Xcode project (`project.pbxproj`) needed
manual updates to drop stale `.m` file references and register the new `.mm` files (`SendLogsModule` in particular
was never in the Xcode project at all before this — a pre-existing gap, now fixed); the `.mm` shims need
`#import <ReactCodegen/GalaxyRNSpec/GalaxyRNSpec.h>` (nested under a folder named after the codegen module, not a
flat header); `AudioManager.mm`/`CallManager.mm` need an explicit `#import <React/RCTEventEmitter.h>` (lost when
rewriting from `.m`, since the codegen header doesn't pull it in). Also found and fixed a real pre-existing bug in
`SendLogsModule.swift` (`entry.subsystem`/`entry.category` don't exist on `OSLogEntry`, only on `OSLogEntryLog`) —
undetected before because the file was never compiled.

**Android: verified with a real `./gradlew assembleDebug`** — `BUILD SUCCESSFUL` (once the external drive holding
the Android SDK/NDK 28 was mounted; `android/local.properties` already pointed at the right path, it just wasn't
reachable earlier in this work). Confirms the `PermissionAware`-based module conversion and TurboModule specs
compile correctly on Android, not just against codegen output in isolation.

## Custom native modules — converted to TurboModules

The 4 custom Android modules that actually exist (`SendLogsModule`, `AudioDeviceModule`, `CallListenerModule`,
`GxyUIStateModule`) extend a generated `Native*Spec` class (package `com.facebook.fbreact.specs`) and are real
codegen TurboModules — verified directly: each `class Xxx extends NativeXxxModuleSpec` in
`android/app/src/main/java/com/galaxy_mobile/`. `GxyPackage` itself is intentionally left as a plain `ReactPackage`
(not converted to `TurboReactPackage`) — bridgeless mode already routes module creation through the TurboModule
manager regardless of which `ReactPackage` type registers them, so this wasn't required; it's a possible follow-up
cleanup, not a correctness gap.

An earlier version of this doc additionally listed `WakeLockModule`, `ForegroundModule`, and `PermissionsModule` as
converted Android modules ("all 6 custom modules"). **None of these three exist** — verified: no such Java class,
no such file, no string match anywhere in `android/app/src/main/java`. What's actually there instead: "foreground"
behavior lives partly in `GxyUIStateModule` (`startForeground`/`stopForeground`, a real TurboModule method) and
partly in `ForegroundService.java` (a plain Android `Service`, not a native module at all); "permissions" lives in
`PermissionHelper.java`/the `PermissionAware` interface, also not a native module. `src/specs/NativeForegroundModule.ts`,
`src/specs/NativeKeepAwakeModule.ts`, and `src/services/KeepAwakeBridge.js` were a dead spec/bridge chain with no
native implementation on either platform and no callers anywhere in `src/` — removed (2026-07-29).

**iOS custom modules (`SendLogsModule`, `AudioManager`, `CallManager`, `GxyUIStateModule`) were NOT converted** —
despite an earlier version of this doc claiming otherwise. Verified directly (2026-07-29): every iOS module file
is still plain Objective-C (`lastKnownFileType = sourcecode.c.objc` in `project.pbxproj`, not `.mm`), none import
the generated `<ReactCodegen/GalaxyRNSpec/GalaxyRNSpec.h>` header, none conform to their generated `NativeXSpec`
protocol, and none implement `getTurboModule:`. They're still registered the classic way
(`RCT_EXTERN_MODULE`/`RCT_EXTERN_METHOD` in `.m`) and only reachable from JS because bridgeless mode's built-in
legacy-module interop lets `TurboModuleRegistry.get()` resolve plain `RCTBridgeModule`s automatically — not because
of any explicit codegen conformance. The generated `src/specs/Native*.ts` spec files exist and are used for JS
typing/method calls, but nothing on the iOS native side actually implements them.

Android/iOS module names and method contracts differ per platform (e.g. `AudioDeviceModule` vs `AudioManager` have
almost no method names in common) — each platform has its own `src/specs/Native*.ts` spec file; there is no shared
cross-platform spec for these two, only for `SendLogsModule` (identical contract on both platforms).

Event emission: Android modules call the generated `emit<EventName>(...)` method (declared without an `on` prefix
in the TS spec, e.g. `updateAudioDevice` not `onUpdateAudioDevice`, specifically so the wire event name matches
what existing JS listeners already expected — no JS-side event-name changes were needed). JS subscribes by calling
the spec's `EventEmitter<T>` property directly as a function (`NativeModule.updateAudioDevice(handler)`) — this is
a JSI-native mechanism (`TurboModule::create()` → `eventEmitterMap_`), unrelated to `RCTDeviceEventEmitter`/
`DeviceEventEmitter`/`NativeEventEmitter(module).addListener(...)`, which do NOT reach it. The old global
`SendEventToClient` broadcaster is deleted.

iOS `AudioManager`/`CallManager` still extend `RCTEventEmitter` and use its classic `sendEvent(withName:body:)` for
events, and JS reaches them via `new NativeEventEmitter(NativeModule).addListener(eventName, handler)` — the
legacy bridge path. This is deliberate, not an oversight: the generated `NativeXSpecBase` that real emit methods
require has a protected C++ member (`facebook::react::EventEmitterCallback`), forcing Obj-C++ compilation; a class
can only have one superclass, so nothing can extend both `RCTEventEmitter` and `NativeXSpecBase` at once. Since
(per above) iOS modules were never actually converted to real TurboModule conformance in the first place, this
would additionally require writing that conformance from scratch (a `.mm` class subclassing `NativeXSpecBase`,
conforming to `NativeXSpec`, delegating to the existing Swift logic) — not just adding events on top of existing
wiring. Classic `RCTEventEmitter` event delivery keeps working fine under the new architecture, so this was left
alone as-is.

`CallListenerModule`/`CallManager` have zero callable methods (event-only) — during this conversion, dead code
(`CallManager.keepScreenAwake`, confirmed zero JS callers) was removed rather than ported.

What the migration commit did change in native code:
- Removed/replaced APIs no longer available or safe on the new architecture (e.g. `PhoneCallListener.java` was
  split into `PhoneCallListenerOld.java` and `PhoneCallListenerTiramisu.java` by Android version instead of one
  shared implementation)
- Trimmed manual bridge-era boilerplate in several modules (`AudioDeviceModule`, `ForegroundModule`,
  `CallListenerModule`, etc.)

## Third-party libraries

Fabric/codegen specs are generated for at least: `react-native-vector-icons`, `react-native-webview`,
`@sentry/react-native`, `react-native-safe-area-context` (see `ios/build/generated/ios/*Spec*`) — these libraries
are new-arch compatible as configured. If you add or upgrade a native dependency, check that it ships new-arch
support before assuming it works out of the box.

**Bumped alongside the RN 0.86.0 upgrade** (actively maintained, ordinary minor/patch, both platforms rebuilt
clean after each): `@react-native-community/netinfo`, `react-native-crisp-chat-sdk`, `react-native-safe-area-context`,
`zustand`, `immer`, `mqtt`, `iconv-lite`, `markdown-it`, `webrtc-adapter`.

**Deliberately left on their current version** — no upstream release exists that would help, bumping wouldn't
close the risk, and pretending otherwise would be misleading:
- `react-native-render-html` — last published 2022-06-26, effectively unmaintained.
- `rn-secure-storage` — last published January 2024, single maintainer.
- `react-native-orientation-locker` — no release in 2+ years, New Architecture status unconfirmed upstream.
- `react-native-background-timer` — the wake-lock-crash patch in `.yarn/patches/` is still required; upstream
  hasn't fixed it.
- `react-native-webrtc` — pinned at `^124.0.7`; New Architecture support is explicitly called
  experimental/untested by the library's own maintainers (see the "React Native version upgrade" section above).
  Evaluated forks (`@livekit/react-native-webrtc`, `@stream-io/react-native-webrtc`) don't have an unambiguous
  "works under full bridgeless" claim either — switching libraries trades this risk for a less-battle-tested one,
  it doesn't remove it.
- `react-native-app-auth` — stayed at `8.1.0`; `8.4.1` pulls in an `androidx.browser` version that forces a
  `compileSdk 36` migration (see above). Worth revisiting as its own follow-up, not bundled here.

The patched dependency `react-native-background-timer` (see `.yarn/patches/`) is patched for an unrelated
Android wake-lock naming crash, not for new-arch compatibility.

## If something native breaks

- Clean rebuild: `cd android && ./gradlew clean`, and for iOS re-run pod install (Podfile already has the new-arch
  flag set, nothing to change there)
- Check `MainApplication.kt` (`isNewArchEnabled`) and `MainActivity.java`
  (`DefaultNewArchitectureEntryPoint.getFabricEnabled()`) if a screen fails to render only on one platform
- A crash referencing Fabric/TurboModule/Bridgeless in Sentry or logcat almost always traces to a specific native
  module or a third-party library that hasn't caught up — not to app JS code
