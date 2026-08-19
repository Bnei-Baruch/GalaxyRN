# MQTT stops working after app backgrounds — investigation notes

## Symptom

After the app moves to background (PiP or otherwise, not specific to PIP itself), the MQTT
connection over `wss://` stops exchanging data. Locally, `mqtt.js` continues to report outbound
`publish`/`pingreq` calls as succeeding (no thrown error, no rejected promise), but nothing more is
ever received - no `pingresp`, no Janus acks, no MQTT messages of any kind.

Reported by the user as **not device-specific** (reproduces on more than one device) and as a
**regression**: earlier app versions, before the current React Native upgrade (this work happened
on branch `rn_86`), reportedly did not have this problem. Neither claim has been independently
verified in this investigation (no bisection was run) - recorded here as user-provided context, not
as something we confirmed ourselves.

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

## Not yet explained

None of the standard, ADB-inspectable Android background-network-restriction mechanisms above
account for the failure. What remains open, and was **not** established as fact in this
investigation (should not be treated as conclusions until verified):

- Whether this is caused by something specific to this Samsung device's own (closed-source,
  not visible via `dumpsys`/`adb`) power/RAM management, given it reportedly also happens on other
  devices this explanation would need to independently apply to.
- Whether the RN 0.86 upgrade (bridgeless/new-architecture networking, `WebSocketModule`
  threading, or the `BackgroundTimer` native-module migration that replaced
  `react-native-background-timer` on this branch) changed something that causes this, given the
  user's report that older versions did not have this problem. No bisection has been run.
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

This makes the app recover automatically once a `Keepalive timeout` is detected, instead of staying
permanently zombied. It is a resilience fix, not a fix for whatever is actually causing the
connection to go silent in the background in the first place.
