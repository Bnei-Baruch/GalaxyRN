# WebRTC drops minutes after backgrounding — reconnect investigation

## Symptom

A few minutes after the app moves to background, the active WebRTC call drops (`ICE connection
state` goes `disconnected` → `failed`). Suspected cause: MQTT disconnects and something about
recovery from that is broken.

## Confirmed root cause chain (live device repro)

1. **`reasonCode: 135` (`not_authorized`)** — the MQTT broker sends a real DISCONNECT packet to the
   client, unrelated to backgrounding per se. This is the same broker-side issue already tracked
   separately (Keycloak-token-on-live-connection hypothesis, unconfirmed).
2. The `disconnect` event handler in `src/libs/mqtt.js` only logged this - nothing reacted to it
   directly. ~18s later, the client's own keepalive watchdog independently noticed no traffic and
   threw `Error: Keepalive timeout`, which is the thing that actually triggered recovery
   (`resetMqtt()` / manual `reconnect()`, depending on which variant was active during testing).
3. **Every reconnect strategy tried hung or silently failed to restore delivery**, tried in this
   order:
   - `this.mq.reconnect()` directly in the `disconnect`/`error` handlers → got stuck permanently in
     `disconnecting: true` (`_checkDisconnecting()` then rejects every subsequent publish with
     `"client disconnecting"`), because mqtt.js's `_reconnect()` calls `this.end(cb)` first when
     `this.connected` is still `true` at the moment `reconnect()` runs, and that graceful `end()`
     waits on a real stream `close` event that never arrives.
   - Force-ending first (`this.mq.endAsync(true)`, i.e. `stream.destroy()`) before calling
     `reconnect()` — the forced end itself timed out (`Timeout after 3000ms`) on this transport,
     leaving `disconnecting` stuck `true` anyway (any subsequent `reconnect()` call just gets queued
     as `_deferredReconnect` and never runs).
   - Enabling the mqtt.js library's own `reconnectPeriod` (its built-in auto-retry timer) — the
     retry timer got armed (`_setupReconnect :: setting reconnectTimer`) but its callback **never
     fired**, because `_setupReconnect()` uses a plain global `setInterval`, not the app's
     `timerVariant`/`BackgroundTimer` - so it's throttled the same way plain timers always are while
     backgrounded.
   - `resetMqtt()` (full `abortMqtt()` + `initMQTT()`, brand-new client object + new `clientId`) —
     structurally the most promising (discards the old client unconditionally after a timeout guard,
     doesn't depend on the old stream's fate; new `clientId` guarantees `sessionPresent: false` on
     reconnect, which reliably triggers the app's own resubscribe-on-connect logic in
     `mqtt.js`'s `'connect'` handler). But the fresh `mqtt.connectAsync()` call inside `initMQTT()`
     itself then hung indefinitely (watched live via an added heartbeat log: still pending after
     272+ seconds and counting, uncleared).

## Root cause of the hang itself: `connackTimer` uses a raw `setTimeout`

`mqtt.js` (`dist/mqtt.esm.js`) already has a built-in 30-second safety net for exactly this
situation - if no CONNACK arrives within `options.connectTimeout` (default `30_000`ms), it force
-cleans-up and emits an error:

```js
this.connackTimer = setTimeout(() => {
    this.emit("error", new Error("connack timeout"));
    this._cleanUp(true);
}, this.options.connectTimeout);
```

This timer (and its `clearTimeout` counterparts in the CONNACK handler and the `close` handler) uses
the **global `setTimeout`/`clearTimeout`**, not the client's configured `options.timerVariant`
(which this app already sets to route through `BackgroundTimer`, specifically because plain RN
timers are throttled while backgrounded — see the fix history in
`mqtt-background-connection-investigation.md`). `timerVariant` is only wired into
`KeepaliveManager`'s ping scheduling internally, not into `connackTimer`.

Net effect: while backgrounded, a stalled CONNACK wait never times out on its own — the library's
own recovery mechanism is silently neutered, which is why every reconnect attempt above could hang
indefinitely with no error, no matter which JS-level strategy triggered it.

This is very likely the same class of underlying OS/New-Architecture behavior documented in
`mqtt-background-connection-investigation.md` (WSS handshakes not completing while backgrounded,
root cause never fully identified at the OS level) - this investigation doesn't re-derive *why* the
handshake stalls, only that the library's own safety-net for that stall was itself broken.

## Fix applied

New yarn patch layered on top of the existing two mqtt patches:
`.yarn/patches/mqtt-patch-6ac70a4a94.patch` (resolution updated in `package.json`).

Patches three call sites in `dist/mqtt.esm.js` (the CONNACK handler's clear, the `close` handler's
clear, and the `connect()` set+clear) to resolve the timer implementation the same way
`KeepaliveManager` already does:

```js
(tv => typeof tv === "object" && tv && "set" in tv && "clear" in tv ? tv : {set: setTimeout, clear: clearTimeout})(this.options.timerVariant)
```

i.e. use the app's `timerVariant` (`BackgroundTimer`) when provided, otherwise fall back to the
original global timer behavior (safe for any other consumer of the library that doesn't pass a
custom `timerVariant`).

`src/libs/mqtt.js` changes alongside the patch:
- `error` handler (`Keepalive timeout`) and `disconnect` handler (`reasonCode 135`) originally both
  called `useInitsStore.getState().resetMqtt()` (full teardown + fresh client), not a manual
  `reconnect()`/force-end - chosen over reusing the same client object because of the hangs
  documented above.
  **Changed again (2026-09-01):** both now call `connection-monitor.js`'s exported `waitAndRestart()`
  - the same recovery path already used for network-loss teardown (`monitorNetInfo` → `monitorMqtt` →
  `onNoNetwork()` on failure), reused here directly instead of a bespoke MQTT-only reconnect. The
  class's own `reconnectMqtt()` method (force-end via `endAsync(true)` then `mq.reconnect()`) was
  written and then deleted again - not used anywhere in the end. An even earlier attempt wired these
  handlers to `connection-monitor.js`'s internal `mqttReconnect()` (`mq.reconnect()` with no
  force-end-first guard - would hit the `disconnecting: true` hang documented above, since
  `mqtt.mq.connected` is observed still `true` in the logs at the moment the `disconnect` handler
  runs). Not yet re-verified live.
- Added heartbeat logging around `mqtt.connectAsync()` in `init()` (elapsed-seconds log every 5s via
  `BackgroundTimer`, plus elapsed time on success/failure) to make any future hang immediately
  visible and quantifiable in logs without guesswork.
- `log` option: briefly forwarded all of mqtt.js's internal log args (via `...args`, then via a
  `sanitizeLogArg()` wrapper), then reverted back to only the first arg (`args[0]`) - see the SIGSEGV
  section below for why, and note the crash recurred even after this revert, so it wasn't (solely)
  responsible.

## Not yet verified

Whether this patch actually fixes the end-to-end symptom (WebRTC surviving a `reasonCode 135`
disconnect while backgrounded) has not been confirmed live yet - only the mechanism (`connackTimer`
using the wrong timer) and the patch's syntactic correctness. Next step: reproduce again in
background and confirm `connackTimer`'s 30s timeout actually fires and `resetMqtt()` completes
instead of hanging.

## New regression found while testing this fix: native SIGSEGV in Hermes, likely caused by the added MQTT LIB logging

While live-testing the patch above (foreground, active call, device `R9WT90RP4BA`), the app crashed
outright - not the symptom being investigated. From `adb logcat` (crash/main/system buffers) and the
tombstone:

```
11:07:15.063  F libc    : Fatal signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x0
              in tid 29643 (mqt_v_js), pid 28872 (axy_mobile:main)
...
DEBUG   : Cause: null pointer dereference
backtrace: (all unsymbolicated libhermesvm.so frames) ...
  facebook::react::RuntimeScheduler_Modern::performMicrotaskCheckpoint(...)
  facebook::react::RuntimeScheduler_Modern::runEventLoopTick(...)
  facebook::react::RuntimeScheduler_Modern::runEventLoop(...)
```

Not an OOM kill - no `lowmemorykiller`/low-memory/`onTrimMemory` signals anywhere near the crash
time. This is Hermes itself segfaulting while draining the microtask queue.

**Correlation with the logging change in this same fix:** the last JS-side log line before the 1.28s
of silence that ends in the crash is `[MQTT LIB] '_sendPacket :: (%s) ::  start'` - i.e. it died
somewhere inside mqtt.js's packet-write path, right where the library's internal `debug()` calls
would otherwise fire again (those frequently carry the raw packet `Buffer` as an arg).

This is very likely caused by the `log` option change made alongside the `connackTimer` patch above:

```js
log: (...args) => {
-  logger.debug("MQTT LIB", args[0]);
+  logger.debug("MQTT LIB", ...args);
```

Two things compound here:
- This now forwards *every* arg mqtt.js's internal `debug()` passes - including raw packet
  `Buffer`s - on every internal log call, not just the format string.
- `src/services/logger.js`'s `debug()`/`trace()`/`info()` are all declared `async` but are never
  `await`ed by any caller (including this `log` callback) - so every single one queues a microtask
  that just sits there. `hasTag()` also currently has dead code (`return true;` before the real
  allow-list) so *nothing* is filtered - every tag, including the very chatty `MQTT LIB` one, logs
  unconditionally whenever `isDebug` is true.

Net effect: mqtt.js's already-chatty internals (connect handshake, every publish, every 15s
keepalive) now each fan out into several unawaited async `console.debug` microtasks carrying heavy
objects, with no filtering. That's consistent with a large, unthrottled microtask backlog landing
Hermes in `performMicrotaskCheckpoint` with a null pointer.

**Not yet confirmed as root cause** - only correlated by timing and by being the one substantive
behavioral change shipped in the same diff. Next step to confirm: revert just the `log` callback to
`args[0]` (or otherwise stop spreading raw Buffers into the logger) and re-run the same background
repro; if the crash stops recurring under the same MQTT load, that confirms it.

**Fix applied**:
- `src/libs/mqtt.js`: the `log` callback was reverted back to `logger.debug("MQTT LIB", args[0])` -
  i.e. undoing the `...args` spread entirely, back to the pre-regression behavior. An intermediate
  attempt (mapping args through a `sanitizeLogArg()` helper that replaced `Buffer`/`Uint8Array` with a
  short placeholder, keeping the rest of the interpolated values) was tried and then dropped in favor
  of this simpler revert - the interpolated-value diagnostics weren't worth keeping relative to
  further cutting log weight.
- `src/services/logger.js`: `trace`/`debug`/`info`/`warn`/`error` are no longer `async` - none of them
  did any real async work, so every call site (nothing awaited or chained on the returned promise) was
  paying for an unawaited microtask per log call for no reason. Removed app-wide, not just for MQTT.
  (`hasTag()`'s dead-code `return true;` override was left in place - a global tag-filter fix was
  tried and then explicitly reverted, to avoid silencing tags relied on elsewhere.)

**Update (2026-09-01, later same day): crash recurred a 4th time (11:53:09) with the fix loaded.**
Confirmed via the log format itself - `[MQTT LIB]` lines showed only the single-arg format (no
interpolated values), proving the reverted-to-`args[0]` bundle was actually running, not stale. Same
signature every time (`SIGSEGV`, `mqt_v_js`, null pointer, `libhermesvm.so`). This means **log
volume/weight was not the (sole) root cause** - the crash reproduces independent of it.

New pattern noticed across the last two occurrences (11:34:10 and 11:53:09): both happened ~0.5-2s
after an identical sequence:
```
[JanusMqtt] keepAlive error: Timeout after 2000ms
[JanusMqtt] setKeepAliveTimer 20000
[JanusMqtt] clearKeepAliveTimer <id>
[BackgroundTimer] setTimeout id:<n> timeoutMs:20000
...silence on the JS thread...
Fatal signal 11 (SIGSEGV)
```
i.e. every observed crash follows a `JanusMqtt` keepalive timeout immediately re-arming a new
`BackgroundTimer` timer. Not yet investigated: whether this is a `BackgroundTimerModule`-side issue
(its native `setTimeout` posts via `Handler(Looper.getMainLooper())` and calls the codegen `emitTimeout`
- matches the established safe pattern from [[native-module-events-pattern]], so likely not a naive
wrong-thread bug, but worth re-checking given how consistently the timing lines up) or something in
`JanusMqtt`'s keepalive-retry JS logic itself. Next step if resumed: reproduce again focusing on this
exact sequence rather than on logging.

## Update (2026-09-06): 5th occurrence, and likely root cause identified — upstream RN New Architecture bug, not app code

Recurred again, device `R9WT90RP4BA`, 15:26:17. Identical signature (`SIGSEGV`, tid `mqt_v_js`, null
pointer, `libhermesvm.so` unwinding into `RuntimeScheduler_Modern::performMicrotaskCheckpoint` →
`runEventLoopTick` → `runEventLoop`), and the same immediate-preceding pattern: `JanusMqtt` keepalive
tick → `BackgroundTimer` `clearTimeout`+`setTimeout` re-armed back-to-back (JS→native calls landing on
the `mqt_v_native` thread) → the *previous* pending timer's `emitTimeout()` fires on Android's main
thread ~1-2s later → crash.

**Cleared as a cause:** `BackgroundTimerModule`'s own code. `mqt_v_js`/`mqt_v_native` are not app- or
plugin-created threads - they're literally what RN 0.86's new-architecture `ReactInstance.kt` names
its own JS/native-modules queues (`MessageQueueThreadSpec.newBackgroundThreadSpec("v_js"/"v_native")`,
confirmed by reading `node_modules/react-native/ReactAndroid/.../ReactInstance.kt:125-126`). So this is
the real JS thread, not a rogue cross-thread caller - `emitTimeout()`'s `mEventEmitterCallback.invoke()`
(a `CxxCallbackImpl` per the codegen'd `NativeBackgroundTimerModuleSpec.java`) is the standard
TurboModule event-emitter path, meant to be safely callable from any native thread.

**Cleared as a cause (again):** the mqtt yarn patches. All three only touch timer wiring around
`connackTimer`/`KeepaliveManager` (initial-connect and ping-scheduling timers), not the steady-state
publish/keepalive-retry path where every crash actually happens - and the crash already reproduced
after fully reverting the logging change from patch #3, so it isn't patch-content-dependent either.

**Most likely actual root cause:** an upstream, currently-open React Native New Architecture bug in
`RuntimeScheduler_Modern`/Fabric - a timing-sensitive scheduling race (GC/use-after-free class), not
anything in this app's JS or native module code. Matches, closely:
- [react/react-native#57963](https://github.com/react/react-native/issues/57963) - SIGABRT inside
  Fabric/`RuntimeScheduler_Modern`/`EventQueue::flushEvents` on **RN 0.86.2**, New Architecture,
  Samsung Android device, explicitly triggered by "JS thread doing sustained synchronous-ish work"
  right as the app resumes/backgrounds, "likely a backlog of native UI/touch events pending delivery
  at the same time" - same crash *family* (RuntimeScheduler internals, no app frames, timing-dependent,
  Samsung-specific reports, RN 0.79-0.86 range across related reports in that thread's comments), just
  a `SIGABRT` variant instead of our `SIGSEGV`.
- [react/react-native#53774](https://github.com/react/react-native/issues/53774) - `EXC_BAD_ACCESS` in
  `RuntimeScheduler_Modern::runEventLoopTick` after upgrading to 0.79.6 (iOS, but same internal
  function).

Our trigger for the "bursty native↔JS scheduling" precondition these reports describe is the
`JanusMqtt` keepalive-retry loop: `clearTimeout` + `setTimeout` (JS→native, `mqt_v_native`) immediately
followed within ~1-2s by the *other* pending timer's `emitTimeout()` (native→JS, dispatched from
Android's main thread) - a tight back-to-back native/JS handoff, happening while backgrounded (already
resource-constrained: wakelock held, foreground-service-only).

**Practical implication:** this is very likely not fixable from application code - no line in
`src/services/BackgroundTimer.js`, `NativeBackgroundTimerModule.ts`, or `janus-mqtt.js` is doing
anything unsafe per RN's own contracts. Mitigation, not fix: reduce how often `JanusMqtt`'s keepalive
path re-arms a timer in the same tick as clearing the previous one (coalesce instead of
clear-then-immediately-set), to reduce how often the bursty-scheduling precondition is hit. Actually
eliminating the crash would require an RN upstream fix; worth filing/upvoting against #57963 with our
own (Android 13, RN 0.86.0, `SIGSEGV` not `SIGABRT`) data point since it's a different manifestation of
what looks like the same underlying scheduler bug class.
