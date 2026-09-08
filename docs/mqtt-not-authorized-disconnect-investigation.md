# MQTT `reasonCode 135` (not_authorized) disconnect — investigation

## Symptom

In the foreground (unrelated to backgrounding), the MQTT broker sends a real DISCONNECT with
`reasonCode: 135` (`not_authorized`), which - via a bug described below - was tearing down the
entire room session (`exitRoom` → `terminateApp()`), not just the MQTT connection.

## Confirmed trigger: Keycloak token refresh

Live device repro (`R9WT90RP4BA`, 2026-09-01 ~11:18 local):

```
11:17:53.996  [Keycloak] Token refresh successful (new access + refresh token, session updated)
11:18:05.808  [Mqtt] Not authorized  { reasonCode: 135, cmd: 'disconnect', ... }   <- ~12s later
```

This confirms the hypothesis in [[mqtt-not-authorized-disconnect-investigation]] (memory): the
broker ties MQTT session validity to the access token used at connect time
(`src/libs/mqtt.js`'s `password: kc.getToken()`), and invalidates the session once Keycloak rotates
that token - not literally "~15 minutes after login" as first observed, but tied to the refresh
event itself. The ~15min figure previously seen was just this same mechanism at a longer refresh
interval.

Not yet confirmed from the broker side (no broker/auth-plugin config inspected) - only the app-side
timing correlation.

## Second, independent bug found downstream: premature full-session teardown

The `disconnect` handler's `resetMqtt()` (full teardown + fresh client, added as part of
[[mqtt-reconnect-connacktimer-investigation]]) does the right thing and starts reconnecting with a
new token/clientId - the new `CONNECT` packet was observed being written to the stream successfully
about 1.7s after the disconnect. But the room got torn down anyway:

```
11:18:06.305  [Inits] Error exiting MQTT topics: Connection closed        <- expected, old conn already dead
11:18:07.401  [Mqtt] Connecting to MQTT: ... (fresh client, new token)     <- resetMqtt() reconnecting
11:18:07.523  [MQTT LIB] _writePacket :: writeToStream result true        <- new CONNECT packet sent
...50 tight-loop iterations of "monitorMqtt" / "MQTT not initialized, setting timeout"...
11:18:08.964  [ConnectionMonitor] Error in monitorMqtt: MQTT disconnected  <- ~900ms later, room torn down
11:18:09.018  [InRoom] exitRoom exitWIP
11:18:09.096  [JanusMqtt] destroy
```

Root cause: `connection-monitor.js`'s `monitorMqtt()` is supposed to poll once per second, up to
`MAX_CONNECTION_TIMEOUT` (20) times, giving a reconnect ~20 real seconds to complete before giving
up:

```js
if (!mqtt.mq) {
  logger.debug(NAMESPACE, 'MQTT not initialized, setting timeout');
  sleep(1000);              // <- missing await
  return await monitorMqtt();
}
```

`sleep(1000)` wasn't awaited, so while `mqtt.mq` is briefly `null` during `resetMqtt()`'s
teardown+recreate window, this branch recurses immediately instead of once per second - the logs
show ~50 iterations in under a second instead of one. That burns through the 20-count
`disconnectedSeconds` budget in a fraction of a second, so `monitorMqtt()` throws `'MQTT
disconnected'` almost immediately, long before the new client even finishes its connect handshake -
triggering a full `onNoNetwork()`-style teardown for what should have been a normal, fast reconnect.

**Fix applied**: added the missing `await` in `connection-monitor.js`'s `monitorMqtt()`. This alone
should let a `resetMqtt()`-driven reconnect actually get its real ~20s budget instead of being killed
near-instantly.

## Follow-up hardening (2026-09-01)

Two more changes made while continuing this investigation:

- `mqtt.js`'s `disconnect`/`error` handlers now call `connection-monitor.js`'s exported
  `waitAndRestart()` instead of `resetMqtt()` (user-requested experiment) - the same path already used
  for network-loss recovery (`monitorNetInfo`/`monitorMqtt`, falling back to `onNoNetwork()` on
  failure), reused directly rather than a bespoke MQTT-only reconnect helper. Two earlier attempts
  (a bespoke `this.reconnectMqtt()` method on the class; wiring to `connection-monitor.js`'s internal
  `mqttReconnect()`) were tried and reverted - see
  [[mqtt-reconnect-connacktimer-investigation]] for why. Not yet re-verified live.
- `waitAndRestart()`'s `await monitorMqtt()` is now wrapped in `rejectTimeoutPromise(..., (MAX_CONNECTION_TIMEOUT + 5) * 1000)`
  - `monitorMqtt()` previously had no independent timeout, only its own recursive
    `BackgroundTimer`-driven counter; if that timer chain ever stalled, `waitAndRestart()` (and thus
    the whole reconnect/teardown decision) would hang forever with no reject. This is a backstop, not
    a fix for `monitorMqtt()` itself - if it fires, the still-running `monitorMqtt()` recursion is
    simply abandoned (same tradeoff already accepted elsewhere in this file, e.g.
    `reconnectMqtt()`'s `endAsync(true)` guard).

## Not yet verified

- Whether the reconnect (now given its real time budget) actually re-establishes MQTT and survives
  without a room teardown after a `reasonCode 135` disconnect.
- Whether the broker-side `not_authorized` disconnect itself can be avoided/reduced - e.g. by
  updating the MQTT client's credentials on the live connection when Keycloak refreshes, rather than
  only reacting after the broker already rejected it. Not attempted here; current fix only stops the
  *reconnect* from being sabotaged, it doesn't stop the disconnect from happening in the first place.
