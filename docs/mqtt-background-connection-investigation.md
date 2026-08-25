# MQTT stops working after app backgrounds — investigation notes

## Symptom

After the app moves to background (PiP or otherwise, not specific to PIP itself), the MQTT
connection over `wss://` stops exchanging data. Locally, `mqtt.js` continues to report outbound
`publish`/`pingreq` calls as succeeding (no thrown error, no rejected promise), but nothing more is
ever received - no `pingresp`, no Janus acks, no MQTT messages of any kind.

Reported by the user as **not device-specific** (reproduces on more than one device) and as a
**regression**: earlier app versions, before the current React Native upgrade (this work happened
on branch `rn_86`), reportedly did not have this problem.

## Bisection result: New Architecture, not the RN version bump

A version-bisection experiment was run to test this regression claim (see "Bisection experiment"
below for method). Result, from three live on-device reproductions of the same test (join room,
background, watch for `mqtt on error: Keepalive timeout`):

| React Native version | Architecture | `BackgroundTimer` implementation | Result |
|---|---|---|---|
| 0.77.3 (`master` branch) | Old bridge (`newArchEnabled=false`) | `react-native-background-timer` (old npm lib) | Reportedly worked (user claim, not independently re-verified in this pass) |
| 0.78.3 (downgrade experiment) | **New architecture** (`newArchEnabled=true`) | `react-native-background-timer` (old npm lib - this experiment's checkout predates the in-house migration) | **Bug reproduces**: `onUserLeaveHint` at 11:59:07, `mqtt on error: Keepalive timeout` at 11:59:27 (~20s later) |
| 0.86.0 (`rn_86` branch, current) | New architecture | in-house `BackgroundTimer` TurboModule | Bug reproduces (see confirmed facts above) |

The 0.78.3 and 0.86.0 rows both use new architecture and both fail; the only old-arch data point
(0.77.3) reportedly doesn't. Both the working (reported) and failing (0.78.3, verified) cases use
the *same* `react-native-background-timer` library - the only thing that changed between those two
is the architecture flag, not the RN version and not the timer implementation. This points at
**New Architecture (bridgeless/Fabric/TurboModules) itself**, not the RN version bump and not the
`BackgroundTimer` native-module migration, as the more likely factor - though this rests on the
0.77.3 "worked" data point being accurate, which was not independently re-verified in this pass
(only recalled/reported, not freshly reproduced on that exact commit in this session).

### Bisection experiment: method

Done in an isolated `git worktree` off the `rn_86` branch (not touching the main checkout), to get
a real "old RN version + New Architecture" combination that never actually shipped (the real
historical 0.77.3 on `master` has New Architecture *off*; this branch's upgrade changed the RN
version and the architecture flag together, so `master` alone can't isolate which one matters).
Downgraded `react-native` to 0.78.3 (`@react-native/*` packages to match) while forcing
`newArchEnabled=true`. Notable gotchas hit along the way, for anyone repeating this:

- The worktree only reflects **committed** state - any uncommitted work in the main checkout at the
  time (this session's `BackgroundTimer` migration, the `mqtt.js` fix, `metro.config.js`'s mqtt
  browser-condition resolver config, `GxyWebSocketDiagnostics`) was absent and had to be manually
  ported/recreated as needed, or accounted for as expected differences (e.g. the worktree
  legitimately uses the old `react-native-background-timer` npm package, not stubbed - this is fine
  since that library "still works correctly" per `docs/background-timer-native-modules-plan.md`,
  it's a valid historical baseline, not a gap).
- Gitignored files (`android/local.properties`, `.env`, `.env.dev`) don't exist in a fresh worktree
  and must be copied over manually - their absence caused (respectively) a Gradle `sdk.dir` failure,
  and `react-native-app-auth` throwing "Config error: you must provide either an issuer or..." at
  runtime because `AUTH_CONFIG_ISSUER` etc. were `undefined`.
- Metro bundling `mqtt` on RN 0.78's older bundled Metro (v0.81.5) needs *both*
  `resolver.unstable_conditionNames: ['react-native', 'browser']` *and*
  `resolver.unstable_enablePackageExports: true` in `metro.config.js`, plus the
  `.yarn/patches/mqtt-npm-5.15.2-*.patch` resolution in `package.json` - without all three, bundling
  fails on `Unable to resolve module dns from .../mqtt/build/lib/connect/socks.js` (mqtt's Node-only
  socks5 transport, unconditionally required by its non-browser entry point, which Metro can't
  bundle for RN at all). The main branch already carries all three; the worktree needed them copied
  in.
- `react` must stay pinned to the exact version RN 0.78.3 was actually released against (`19.0.0`),
  not just anything satisfying its `^19.0.0` peer range - using the main branch's newer `19.2.3`
  pulled in a mismatched `scheduler` (`0.27.0`) alongside RN's own exactly-pinned `scheduler@0.25.0`
  dependency, which is the kind of internal-API mismatch that can break Fabric silently. (This
  specific mismatch was corrected before the successful bisection run above; whether it was actually
  the cause of an earlier-observed hang at login was not conclusively determined either way.)
- `react-native-app-auth`'s `authorize()` (real OAuth login) hung indefinitely on this downgrade
  (promise never settled, no error) - suspected legacy-native-module/bridgeless-interop
  incompatibility, not investigated further. Worked around for testing by capturing a real session
  (`accessToken`/`refreshToken`/`idToken`) from a working login on the main branch and temporarily
  hardcoding it into the worktree's `keycloak.js` `login()` in place of the `authorize()` call
  (reverted after use - this bypass should not be merged anywhere).

## Confirmed, directly observed facts

All of the following were reproduced live on one Android device (Samsung, `com.galaxy_mobile`,
RN 0.86.0, new architecture) via `adb logcat` + `/proc/net/tcp6` + `dumpsys`, not inferred:

1. `mqtt.js`'s own internal keepalive mechanism (`KeepaliveManager`, scheduled through this app's
   `BackgroundTimer` native module via the `timerVariant` option in `src/libs/mqtt.js`) keeps
   firing correctly while backgrounded. `BackgroundTimerModule`'s native timers fire on schedule,
   `hasActiveCatalystInstance=true` throughout - the JS thread and its timers are not frozen.
2. Roughly 15-22 seconds after the last successfully-acknowledged packet, the client:
   - keeps locally "succeeding" at writes (`_writePacket :: writeToStream result`, no error)
   - never again receives anything: confirmed absence of `pingresp`, Janus `keepalive`/`ack`
     replies, or any other inbound MQTT message, across multiple full reproductions.
3. `mqtt.js`'s `KeepaliveManager` (a stock library mechanism, not app code) eventually detects the
   silence and calls `onKeepaliveTimeout()`, which emits `'error'` (`Keepalive timeout`) and calls
   `_cleanUp(true)` (forces `stream.destroy()`).
4. In one reproduction, an actual MQTT `DISCONNECT` packet arrived from the broker at ~22.4s after
   the last successfully-exchanged packet - matching `1.5 × keepalive(15s)`, i.e. the broker's own
   server-side keepalive timeout. This means the client's own `pingreq`, sent and logged as
   "successfully written" partway through that window, did not reach the server: if it had, the
   broker would have reset its own keepalive timer on receipt.
5. `this.mq.connected` (the mqtt.js client's own state flag) does not reliably flip to `false`
   promptly when this happens - confirmed by `connection-monitor.js`'s `monitorMqtt()` reading it as
   still `true` shortly after the `'error'` event fired. Since `connection-monitor.js`'s reconnect
   logic is gated on `!mqtt.mq.connected`, it never acts, leaving a permanently zombied connection
   until something else intervenes.
6. Directly inspected and ruled out as the cause on the test device (all checked via `adb`, no
   code change needed to test any of these):
   - **Doze whitelist**: added the app via `adb shell cmd deviceidle whitelist +com.galaxy_mobile`
     and reproduced again - no change in behavior.
   - **App Standby bucket**: `ACTIVE` (the least-restricted bucket).
   - **Data Saver / background data restriction**: `Restrict background: false`; the app's uid is
     explicitly in the bandwidth-control *allowed* list.
   - **netd UID firewall chains** (`dumpsys network_management`): `standby`, `dozable`, `powersave`,
     `restricted mode`, `low_power_standby` chains all report `enabled: false`. The firewall
     subsystem itself is reported off (`Firewall enabled: false`).
   - **WiFi power-save (802.11 PSM)**: the app's own `ForegroundService.java` already holds a
     `WifiManager.WifiLock` (`WIFI_MODE_FULL_HIGH_PERF`) - confirmed actively held via
     `dumpsys wifi` (`WifiLock{GalaxyRN:WifiLock type=3 ... workSource=WorkSource{10317}}`) during
     the failure window.
   - **CPU/cgroup demotion**: `/proc/<pid>/cgroup` shows `cpuset:/foreground` and
     `schedtune:/foreground` (not `/background`) for the whole process during the failure window;
     `oom_score_adj=50`, not a heavily-deprioritized value. System-wide CPU was not saturated
     (`top` showed ~85% idle across cores) at the moment of failure.
7. The app's Android foreground service (`ForegroundService.java`) is confirmed running throughout
   (`isForeground=true`, notification posted) - the failure is not explained by the foreground
   service having stopped or been killed.
8. After applying the `resetMqtt()` mitigation (see below) and reproducing live: the MQTT
   transport-level `'error': Keepalive timeout` fired once and triggered a successful reset (no
   further MQTT-transport-level `Keepalive timeout` repeated). However, the separate,
   higher-level `JanusMqtt` keepalive (an application message sent *over* that MQTT connection to
   the Janus media server, with its own 2000ms timeout, independent of MQTT's own keepalive)
   continued to fail repeatedly every ~15-20s for the remainder of the observed backgrounded
   period (`'JanusMqtt', 'keepAlive error', [Error: Timeout after 2000ms]`), including well after
   the MQTT transport had reconnected. This means reconnecting the MQTT socket does not, by
   itself, restore reliable message delivery while backgrounded - whatever prevents timely
   delivery is a standing condition of being backgrounded, not a one-time dead-connection event
   tied to the original socket. This is consistent with (but does not prove) an OS/radio-level
   condition that affects any connection for as long as the app stays backgrounded, rather than a
   single connection going stale once.
9. Polled `/proc/net/dev`'s `wlan0` TX byte counter once per second during a ~45s window of the
   MQTT keepalive failures described above (while in an active room, so WebRTC media was flowing).
   TX bytes grew continuously and substantially (~10-13KB/s every single second, no gaps) throughout
   the whole window, regardless of whether an MQTT "Send message" happened to log that particular
   second - almost certainly the outbound WebRTC RTP media upload (camera/mic), which the app keeps
   sending while backgrounded. This means **outbound network capacity from the device is not
   generally blocked while backgrounded** - substantial UDP media traffic keeps flowing
   continuously and successfully at the same time the small MQTT/WSS TCP control messages are not
   getting acknowledged. This weakens the general "OS/radio throttles all background network
   traffic" framing from point 8: whatever is happening looks more specific to that one TCP/WSS
   connection than to the app's network access as a whole. (Not established: whether this is
   because that specific connection has no QoS/priority marking that the RTP/media path might have,
   a NAT/middlebox timing out an idle-ish TCP connection specifically, or something else - the RTP
   vs. MQTT/TCP asymmetry is observed, its cause is not.)
10. Repeated the same test **without** any room/WebRTC session at all (backgrounded straight from
    the `BeforeRoom` lobby screen, right after `initApp()`/MQTT connect, `isInRoom: false`
    throughout). The identical failure reproduced: a `pingreq` sent at 12:18:30 (already
    backgrounded) never got a `pingresp`, followed by `'error': Keepalive timeout` at 12:18:38 (~8s
    later - if anything faster than the WebRTC-active runs). `react-native-webrtc`'s Android code
    was also checked directly (`grep` over its Java sources) and confirmed to have zero references
    to OkHttp - it drives `PeerConnectionFactory`/libwebrtc via JNI, a completely separate transport
    from the TCP/WSS `OkHttpClientProvider`-based path MQTT uses. Combined with the TX-byte
    baseline being near-silent in this no-WebRTC run (versus continuous ~10-13KB/s with WebRTC
    active in point 9) and a large (~7.5KB) TX burst visible exactly when `resetMqtt()`'s fresh
    `mqtt.connectAsync()` re-handshake ran, **this rules out WebRTC/media traffic as a cause or
    contributing factor** - the failure is a standalone property of the MQTT/WSS connection while
    backgrounded, unrelated to any other traffic sharing the device's network interface.
11. **A brand new connection attempt gets stuck the same way an existing one does - this is not
    about a specific connection going stale.** While investigating whether `mqtt.js`'s outbound
    `send()` calls reach the native/OkHttp layer at all, applied a further fix (see "Mitigation
    applied" below: `abortMqtt()`'s `mqtt.exit()` unsubscribe calls were found to hang forever
    too, for the same root reason as `end()`/`endAsync()` - `unsubscribeAsync()` only resolves on
    the broker's UNSUBACK, which never arrives - and needed the same timeout-guard treatment).
    With that fix in place, `resetMqtt()` was observed to fully complete `abortMqtt()` in ~6s (two
    3-second timeout guards firing back to back) and reach a fresh `initMQTT()` call. That fresh
    `mqtt.connectAsync('wss://msg.kab.sh', ...)` - a **new** WebSocket/TLS handshake, nothing to do
    with the old connection - itself then hung for 3.5+ minutes with no result (no `'connect'`
    event, no error) while the app stayed backgrounded. `mqtt.connectAsync()` has no timeout guard
    in this codebase, so this doesn't recover on its own; it would need the app foregrounded again
    (not verified in this pass whether foregrounding actually unblocks it).

    This reframes the finding from point 9 (a large TX burst was seen exactly when a prior
    resetMqtt-triggered reconnect ran, while backgrounded, without room/WebRTC active): that burst
    is consistent with this new finding, not in tension with it - it's plausibly just the client's
    outbound ClientHello/WS-upgrade-request bytes leaving the device fine (matching "outbound isn't
    generally blocked"), while the server's side of that same handshake never arrives back, so the
    connection never actually completes either way. **The failure is not specific to a particular
    already-established connection going stale/idle-timed-out (which would point at a
    NAT/middlebox/QoS explanation for an existing connection) - it looks more like nothing
    completes a full round-trip on this MQTT/WSS path at all while backgrounded, new connections
    included.** This weakens the NAT/QoS-marking speculation from point 9 somewhat (that would
    typically apply to already-established idle connections, not fresh handshakes) without
    replacing it with a confirmed alternative.

## Not yet explained

None of the standard, ADB-inspectable Android background-network-restriction mechanisms above
account for the failure. What remains open, and was **not** established as fact in this
investigation (should not be treated as conclusions until verified):

- Whether this is caused by something specific to this Samsung device's own (closed-source,
  not visible via `dumpsys`/`adb`) power/RAM management, given it reportedly also happens on other
  devices this explanation would need to independently apply to.
- **What specifically about New Architecture causes this** (see bisection result above narrowing it
  to New Architecture rather than the RN version bump). Candidates not yet investigated:
  bridgeless mode's handling of `WebSocketModule`/`OkHttpClientProvider` threading, differences in
  how TurboModule-dispatched native calls (e.g. `BackgroundTimer`'s timer callbacks, which drive
  `mqtt.js`'s own keepalive scheduling) are scheduled relative to the JS thread under bridgeless vs.
  the old bridge, or something in Fabric's own background-lifecycle handling.
- Whether OkHttp/the underlying socket ever detects anything (`callFailed`/`callEnd`/`onClosed`) -
  attempted to check this via a custom `OkHttpClientProvider` event-listener hook
  (`GxyWebSocketDiagnostics`, `android/app/src/main/java/com/galaxy_mobile/network/`), but it never
  fired even a single event for the mqtt WebSocket `Call` specifically (it does fire normally for
  plain HTTP calls on the same shared client) - the reason for that gap is itself unresolved and
  should be investigated before relying on this hook for further diagnosis.

## Mitigation applied (does not address the unexplained root cause above)

`src/libs/mqtt.js`:
- The `'error'` handler now recognizes `Keepalive timeout` specifically and calls
  `useInitsStore.getState().resetMqtt()` (full abort + reinit) instead of the generic
  `onMqttConnectionLost()` path, which was found to never reconnect because it trusts the
  unreliable `mq.connected` flag (see point 5 above).
- `end()`'s `await this.mq.endAsync()` is now wrapped in a 3-second `rejectTimeoutPromise` guard,
  because `endAsync()` waits on the underlying stream's `close` event, which was found not to fire
  reliably either (an earlier fix attempt that called `mq.reconnect()` directly hung indefinitely
  for the same reason, since it also waits on that event internally).

`src/zustand/inits.js`:
- `abortMqtt()`'s `Promise.all([mqtt.exit(...), mqtt.exit(...), mqtt.exit(...)])` is now also
  wrapped in a 3-second `rejectTimeoutPromise` guard. `mqtt.exit()` → `unsubscribeAsync()` only
  resolves once the broker's UNSUBACK packet arrives (mqtt.js library behavior, not app code) -
  on a connection that isn't delivering anything (the exact zombie state being recovered from),
  that ack never comes, so this hung forever and silently blocked `resetMqtt()` from ever reaching
  `mqtt.end()`/`initMQTT()` below it. This was found live: without this guard, a real
  backgrounded `resetMqtt()` run sat completely silent for 2+ minutes stuck here.

Even with both of the above fixes in place, `initMQTT()`'s `mqtt.connectAsync()` (a **brand new**
connection attempt) was observed to hang for 3.5+ minutes with no result while backgrounded (see
point 11 above) - this call has no timeout guard anywhere in the codebase, so a `resetMqtt()` that
gets this far while still backgrounded currently has no way to recover until the app is
foregrounded again. Not yet fixed.

This makes the app recover automatically once a `Keepalive timeout` is detected, up to the point
where it needs a working new connection - which, while still backgrounded, it was observed to not
be able to establish (point 11). It is a resilience fix for part of the failure chain, not a fix
for whatever is actually causing the connection to go silent in the background in the first place,
and does not yet fully recover the app while it stays backgrounded.

## Native OkHttp transport experiment (superseded the New Architecture hypothesis)

Built a custom Android TurboModule (`GxyMqttSocketModule.java`, `com.galaxy_mobile.mqttSocket`)
wrapping a real `okhttp3.WebSocket`, completely independent of React Native's own
`WebSocketModule`/`OkHttpClientProvider`, bridged into `mqtt.js` via its `streamBuilder` constructor
extension point (`new mqtt.Client(() => new NativeMqttStream(), options)`). Full design in
`src/specs/NativeGxyMqttSocketModule.ts`, `android/.../mqttSocket/GxyMqttSocketModule.java`,
`src/libs/nativeMqttStream.js`, and the `init()` rewrite in `src/libs/mqtt.js`. The premise: if New
Architecture's own bridge/WebSocketModule plumbing were the cause (per the bisection result above),
routing around it entirely should fix the background failure.

**Native-thread crash found and fixed first**: calling the TurboModule's codegen `emitXxx()`
methods directly from OkHttp's own callback threads (`WebSocketListener.onFailure`/`onClosed`/
`onMessage`, which run on OkHttp's dispatcher/writer threads, never the JS thread) crashed the app
natively - a C++ `IAsyncEventEmitter` hash-table race inside `libreactnative.so`, confirmed via a
native tombstone dump. This contradicted the initial assumption (based on RN core's own
`WebSocketModule.kt` doing the same thing "with zero thread-hopping") that this was safe - it isn't,
in this app's actual runtime. Fixed by wrapping all three emit call sites in
`Handler(Looper.getMainLooper()).post { ... }`, matching the working pattern already used by
`BackgroundTimerModule`. Confirmed fixed: reproduced the original background-crash scenario twice
post-fix with no crash.

**The premise was wrong - this is not a New Architecture / RN-bridge problem.** With the crash
fixed, the exact same background failure reproduces through the fully independent native socket,
with concrete proof it's not just "no crash but same symptom by coincidence":

- Polled `/proc/net/dev`'s `wlan0` TX byte counter once per second through a background window
  where `mqtt.js` logged `_sendPing :: sending pingreq` → `_writePacket :: writeToStream result`
  (success) via the *native* transport. **TX bytes did not increase for the entire ~16 seconds
  spanning the "successful" write** - counter flat before, during, and for several seconds after
  the logged send. Bytes only started moving again once `mqtt.js`'s own local `KeepaliveManager`
  timeout later forced the stream closed. This reproduced identically on a fresh reconnect attempt
  too (a **new** OkHttp `newWebSocket()` call, new TCP+TLS+WS handshake, still backgrounded): the
  handshake itself completed fine (`onOpen` fired quickly - a real network round-trip did happen),
  but the CONNECT packet written immediately after got the same silent treatment, and the broker
  closed the connection from its side once its own keepalive timeout elapsed.
- This means whatever blocks delivery is not inside RN's bridge, `WebSocketModule`, or anything
  New-Architecture-specific - a completely independent OkHttp socket, on its own dispatcher/writer
  threads, exhibits the identical behavior. The earlier bisection result (New Architecture on vs.
  off) may have been confounded by something else (e.g. a difference between the two test builds
  unrelated to the architecture flag) rather than New Architecture itself being causal - this was
  not re-tested against the native-transport branch, so remains unresolved rather than retracted.

**Exhausted every ADB-inspectable Android/Samsung background-exemption mechanism on the test
device, all already maximally permissive, none of it changed the outcome:**

| Mechanism | State found | Changed to | Effect |
|---|---|---|---|
| `WAKE_LOCK` (`BackgroundTimerModule`'s `PARTIAL_WAKE_LOCK`) | held throughout | n/a | none (already held) |
| `WifiLock` (`WIFI_MODE_FULL_HIGH_PERF`, `ForegroundService.java`) | held throughout | n/a | none (already held) |
| Foreground service running | yes, `procState=FGS` | n/a | none (already running) |
| `foregroundServiceType` | `mediaPlayback\|microphone\|connectedDevice` (no `dataSync`) | added `dataSync` + `FOREGROUND_SERVICE_DATA_SYNC` permission, rebuilt | **no change** - identical failure timing |
| Doze whitelist (`cmd deviceidle whitelist`) | **empty** for this package (likely lost across this session's many `force-stop`/reinstall cycles) | added via `cmd deviceidle whitelist +com.galaxy_mobile` | **no change** - identical failure timing |
| App Standby bucket | `ACTIVE` (10, least restricted) | n/a | none |
| Samsung per-app Battery setting (`Settings > Apps > App info > Battery`, screenshot-verified) | already **"Unrestricted"** | n/a | none (already maximal) |
| Global Battery Saver | off (`mSettingBatterySaverEnabled=false`); device was charging (`status: 2`) during all tests | n/a | none - and rules out Doze/App-Standby entirely as the mechanism, since Doze does not engage while charging |
| `NetworkPolicyManager` per-UID (`dumpsys netpolicy`) | `blocked_state={blocked=NONE, allowed=FOREGROUND\|TOP\|POWER_SAVE_ALLOWLIST\|POWER_SAVE_EXCEPT_IDLE_ALLOWLIST\|METERED_FOREGROUND, effective=NONE}` | n/a | not restricted per the OS's own accounting |
| App's own JS/native code | searched for any custom background-throttling logic (`AppState` listeners, thread-priority changes) | n/a | none found - `ForegroundListener.js`'s only background-triggered logic is WebRTC audio-routing (`enterAudioMode`), gated on `isInRoom`, and did not apply in the no-room reproductions |
| `/proc/net/tcp6` `tx_queue:rx_queue` (kernel send-queue occupancy) for the broker connection | `00000000:00000000` throughout | n/a | inconclusive by design - a ~2-byte PINGREQ clears a kernel send queue faster than 1s polling can observe; does not distinguish "never handed to the kernel" from "handed to the kernel and flushed within milliseconds" |

Also observed, unexplained: 3 simultaneous `ESTABLISHED` TCP connections from this app's UID to the
broker's `:443` visible in `/proc/net/tcp6` immediately after a single `connect()` call - not
investigated further (possibly an OkHttp `ConnectionPool` artifact, possibly connections left over
from this session's rapid `force-stop`/relaunch cycles; the `tx_queue`/`rx_queue` for all three
were `0` throughout regardless).

**Net conclusion of this session**: the native-transport work is worth keeping regardless of the
open root cause - it fixed a real native crash risk that the stock approach didn't have, and
provides an independent transport for any future diagnosis - but it did **not** fix the underlying
background-delivery failure, and every standard/vendor Android background-exemption knob reachable
via ADB is already at its most permissive setting on the test device. The actual mechanism blocking
delivery remains unidentified; it sits below what `dumpsys`/`/proc` polling at 1-second granularity
can distinguish. Suggested next steps if resumed: kernel-level tracing (`ftrace`/`perfetto`) on the
OkHttp writer thread specifically during the stall window, or accepting this as an unresolved
device/OS-level condition and investing further only in resilience (faster background reconnect
cycling) rather than root-cause elimination.

### Boundary-crossing logging added (not yet reproduced with this build)

`GxyMqttSocketModule` was converted from Kotlin to Java (matching this repo's other custom Android
modules, all Java) and instrumented at each hop of the write path, to pin down which of
JS-\>native, native-\>OkHttp, or OkHttp-\>socket a stalled write dies at, rather than only inferring
it indirectly from TX-byte polling as in points 9-11 above:

- `src/libs/nativeMqttStream.js`'s `_write()`: logs immediately before and after the
  `NativeGxyMqttSocket.send()` call (`_write #N: calling native send()` / `_write #N: native
  send() call returned`), with a per-instance sequence number and byte length.
- `GxyMqttSocketModule.send()`: logs on entry (`send: called from JS, base64 length=...`) - so a
  missing/delayed entry log against a present JS "calling native send()" log would isolate the
  stall to the JS-\>native TurboModule/JSI call itself, something not directly measured before.
- Same method, after the write: logs `okhttp3.WebSocket.send()`'s own boolean return (`enqueued`)
  together with `queueSize()` (bytes OkHttp itself still has buffered, not yet handed off) -
  `send()` returning `false` would mean OkHttp itself refused the write (closed/canceling/over its
  queue limit) rather than the bytes vanishing after acceptance; a nonzero, non-shrinking
  `queueSize()` across repeated sends would mean OkHttp accepted the bytes but its own writer
  thread isn't draining them - both distinguish from the current unresolved case (OkHttp accepts,
  logs nothing wrong, bytes just never arrive server-side).
- `GxyMqttSocketModule.connect()`: logs on entry with the URL, for the same JS-\>native timing
  comparison during (re)connect attempts, including the 3.5+ minute `connectAsync()`-equivalent
  hang from point 11.

These logs join the existing `onOpen`/`onFailure`/`onClosed`/`onMessage` native logs and the
`mqtt.js`-internal (`log:` option) JS logs already used throughout this investigation - all visible
together via `adb logcat` (JS `logger.debug` calls reach logcat tagged `ReactNativeJS` regardless of
remote-debugger attachment; native `GxyLogger` calls use its own tag). Not yet exercised against a
live background repro - the next reproduction should read the interleaved JS/native timestamps
around a stalled write to see exactly where the chain breaks.

## Root cause found: `mqtt.js`'s own bundled `cork()`/`uncork()` scheduling - not native OkHttp, not the JS↔native bridge

Live reproduction with the boundary-crossing logs above (device: Samsung, `com.galaxy_mobile`, same
native-transport build) showed the stall is neither JS-\>native nor native-\>OkHttp - it's earlier,
entirely inside `mqtt.js`, before any TurboModule call is even made. `NativeMqttStream._write()`
(`src/libs/nativeMqttStream.js`) was **not called at all** for the pingreq write that immediately
preceded a background disconnect, nor for any of the ~7-22 packet writes attempted across several
automatic reconnect cycles afterward (`connection-monitor.js`'s `mqtt.mq.reconnect()` polling) -
confirmed identically across two independent live captures, on both a still-connected primary stream
and freshly-`streamBuilder()`-created reconnect streams.

### The mechanism

1. `mqtt-packet`'s `writeToStream.js` (`generate()`) corks the stream before writing a packet's
   bytes, then schedules the matching `uncork()` via `nextTick` (from the `process-nextick-args`
   package):
   ```js
   if (stream.cork) {
     stream.cork()
     nextTick(uncork, stream)
   }
   ```
   Any bytes `.write()`-ed while corked sit in the stream's internal buffer and never reach
   `_write()` until `uncork()` actually runs. This is a batching optimization, not part of the MQTT
   protocol.
2. `process-nextick-args` ultimately calls `process.nextTick(fn)` - but on **a `process` reference
   this app's own `process.nextTick = setImmediate` shim (`nativeMqttStream.js`) never touches**.
3. Reason: `mqtt`'s `package.json` `exports` map resolves the **`react-native`** condition to
   `dist/mqtt.esm.js` - a pre-built, minified ESM bundle, not the readable `build/lib/client.js`
   source (confirmed via `metro.config.js`'s `unstable_conditionNames: ['react-native', 'browser']`,
   and by the fact that `build/lib/client.js` doesn't contain the `[GXY-PATCH]` log line that's
   actually seen live in `adb logcat`, while `dist/mqtt.esm.js` does). This bundle was built by
   `mqtt.js`'s own maintainers, at their publish time, with a **self-contained, inlined polyfill**
   for Node's `process` global (structurally identical to the `process` npm package's
   `browser.js`) - a separate object from this app's own `global.process`, living entirely inside
   the bundle's closure.
4. That bundled polyfill's `nextTick` drains its queue via a plain, module-load-time-cached
   `setTimeout(fn, 0)` - confirmed byte-for-byte in the actual minified file:
   ```js
   function Qf(t){
     if(gt===setTimeout) return setTimeout(t,0);
     if((gt===_s||!gt)&&setTimeout) return gt=setTimeout, setTimeout(t,0);
     ...
   }
   ```
5. Plain RN `setTimeout` is throttled/suspended while the app is backgrounded - the same
   longstanding RN limitation that motivated this app's own `BackgroundTimer` native module in the
   first place (see `docs/background-timer-native-modules-plan.md`). So `uncork()` never runs while
   backgrounded, the corked bytes never reach `_write()`, and no MQTT bytes (pingreq included) ever
   reach the native transport at all - independent of OkHttp, the JS↔native bridge, or New
   Architecture.

This was verified NOT to be a general "JS microtask queue stalls in background" issue: a control
heartbeat (`setImmediate` scheduled every 2s via the app's own `BackgroundTimer`, which is confirmed
reliable in the background) fired with single-digit-millisecond delay continuously across two 90s+
background windows, including through the exact moments of MQTT disconnect. The failure is specific
to `mqtt.js`'s bundled `process.nextTick`-\>`setTimeout` path, not to RN/Hermes microtask scheduling
in general, and not fixable via this app's own `process.nextTick` shim (which patches a different,
unrelated `process` object).

`mqtt.js`'s own `BufferedDuplex` (`src/lib/BufferedDuplex.ts`, used internally by its built-in
`ws`/`wx`/`ali` transports, though not by this app's custom `streamBuilder`) tellingly does **not**
rely on cork/uncork at all for its own write-queueing - it uses a plain array buffer flushed
synchronously once the socket is open, reinforcing that dropping cork/uncork has no protocol-level
downside.

### Fix applied (superseded once, see correction below)

First attempt: `src/libs/nativeMqttStream.js`, `NativeMqttStream` constructor set `this.cork =
undefined`, since `mqtt-packet`'s `generate()` only corks when `stream.cork` is truthy - this
disables the broken scheduling path entirely, with `.write()` calls reaching `_write()`
synchronously instead. Confirmed live (background the app through the ~15-22s keepalive window):
pingreq/pingresp round-trips succeeded normally while backgrounded (~150-220ms), and the original
`Keepalive timeout` failure did not recur.

**This introduced a new, worse bug**, caught by re-inspecting logcat after the fact: with corking
disabled, every internal chunk `mqtt-packet`'s `writeToStream()` writes for a single MQTT packet
(fixed header, remaining length, variable header, payload - often 4-7+ separate `.write()` calls)
now reached `_write()` -\> `NativeGxyMqttSocket.send()` **separately**, and this native `send()`
calls `okhttp3.WebSocket.send()` once per call - i.e. every native `send()` is one discrete
WebSocket message. A single SUBSCRIBE packet was observed going out as **7 separate WebSocket
messages** (1, 1, 2, 1, 2, 33, 1 bytes) instead of one. This violates the MQTT-over-WebSocket
subprotocol (a single MQTT Control Packet must not be split across multiple WebSocket messages) and
is the likely cause of `JanusMqtt keepAlive error [Error: Timeout after 2000ms]` observed
repeatedly in the same logcat window - the broker/Janus side can't reassemble a packet split across
WS message boundaries.

### Correct fix: patch mqtt's bundled `process.nextTick` + implement `_writev`

Root cause of the *scheduling* half (why `uncork()` never ran in background) was fixed at the
source instead of working around it: `.yarn/patches/mqtt-patch-98942b041a.patch` rewrites the two
`setTimeout(fn, 0)` call sites inside `dist/mqtt.esm.js`'s bundled `process.nextTick` queue-drain
implementation (functions named `ac`/`ew`/`uc` in the minified output - the standard
`process/browser.js` shim, not the `cachedSetTimeout` variant a plain textual re-read had assumed)
to use `queueMicrotask` instead, falling back to `setTimeout` only if `queueMicrotask` isn't
available. In this app specifically, `queueMicrotask` is **not** a `setTimeout`-based polyfill: with
`bridgelessEnabled=true` (`android/gradle.properties`), RN's `setUpTimers.js` wires
`global.queueMicrotask` to `NativeMicrotasks.queueMicrotask`, whose entire C++ body is
`runtime.queueMicrotask(callback)` - a direct JSI call into Hermes's own engine-level microtask
queue, unrelated to the RN timer subsystem that throttles `setTimeout`/`setInterval` while
backgrounded. This makes `uncork()` run promptly regardless of background state.

Fixing the scheduling alone was not sufficient, though: `cork()`/`uncork()` batching only merges
queued chunks into one write if the stream implements `_writev()` - confirmed in
`node_modules/readable-stream/lib/_stream_writable.js`'s `clearBuffer`, which uses `_writev` "fast
case" only when defined, otherwise flushes each buffered chunk through `_write()` individually (see
`Writable.prototype._writev = null` default). `NativeMqttStream` only implemented `_write()`, so
even with `uncork()` firing correctly, each packet's pieces still reached native `send()`
separately. Added `_writev(chunks, callback)` to `NativeMqttStream` that concatenates every queued
chunk into one `Buffer` and calls `NativeGxyMqttSocket.send()` once - restoring one MQTT packet =
one WebSocket message.

`this.cork = undefined` was reverted; corking is back to its default (enabled) behavior.

### Confirmed fixed, live (both parts)

Rebuilt with both changes. A CONNECT packet (1513 bytes) and a batch of 3 SUBSCRIBE packets sent in
the same JS tick (86 bytes total) each now reach native `send()` as a **single** call - confirmed via
`GxyMqttSocketModule`'s `send: called from JS` log line count matching the number of logical
packets/packet-batches, not the number of internal buffer pieces. Backgrounded the app for 35s
(exceeding the ~15-22s keepalive window) with an active MQTT session: `_sendPing`/`_handlePacket ::
received pingresp` fired on schedule every ~15s (13:30:31, 13:30:46, 13:31:02), each pingreq a
single 2-byte native `send()`, each pingresp arriving in ~100-140ms - no `Keepalive timeout`, no
`onClosing`/`onFailure`, no fragmented writes.

### Still open (separate, unrelated to the fix above)

1. **A different broker-initiated disconnect appeared post-fix**: `onClosing code=1000
   reason=not_authorized` (MQTT reasonCode 135, already has a dedicated log line in
   `src/libs/mqtt.js`'s `disconnect` handler). Not yet investigated - likely session/auth-related
   (token freshness, duplicate `clientId`, or a server-side policy), unrelated to the write-path bug
   above.
2. **`streamBuilder` doesn't reopen the native socket on reconnect.** `NativeMqttStream`'s
   constructor only subscribes to native `message`/`closed`/`failure` events - it never calls
   `NativeGxyMqttSocket.connect(wsUrl)` itself. The real native `connect()` call is made exactly
   once, by this app's own `mqtt.init()` wrapper (`src/libs/mqtt.js`), before the first
   `mqtt.Client` is constructed. But `mqtt.js`'s own internal reconnect path
   (`connection-monitor.js`'s `mqtt.mq.reconnect()` polling -\> `Client._reconnect()` -\>
   `connect()` -\> `streamBuilder()`) creates a fresh stream and immediately writes to it assuming a
   live transport, exactly like its built-in `ws`/`tcp` streamBuilders do (those open a fresh
   connection themselves on every call). Confirmed live, post-fix: after a disconnect, every
   reconnect packet write now correctly reaches `_write()` -\> `NativeGxyMqttSocket.send()`, but
   native logs `send: no active socket, dropping` (also reported to Sentry) for all of them, because
   `currentSocket` is still `null` - nothing ever called `connect()` again. Needs a fix so
   `NativeMqttStream`/its `streamBuilder` initiates its own native connection per instance, matching
   how a normal transport-owning streamBuilder behaves.
