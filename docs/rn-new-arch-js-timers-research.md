# JS timers (setTimeout/setInterval) reliability on RN new architecture — research report

Research question: How can JS setTimeout/timers be used reliably in React Native new architecture (Fabric/TurboModules) when the app is in foreground mode?

## Summary

In React Native's new architecture (Fabric/TurboModules), foreground `setTimeout`/`setInterval` are reliable primitives as long as you respect ordinary JS event-loop semantics. A known spec-compliance bug that made new-arch timers throw on malformed arguments was fixed upstream in June 2024 ([facebook/react-native#45105](https://github.com/facebook/react-native/pull/45105)) and remains fixed in current RN source, so apps on RN 0.82+ (this project is on 0.82.1) should not need defensive argument-guarding around timer calls.

Both `setTimeout` and `setInterval` still funnel through the same native dispatch path (a single native `createTimer`-style call distinguished only by a recurring flag) and are tracked JS-side via parallel bookkeeping arrays — an implementation detail, not something callers need to manage.

For anything tied to rendering/animation, use `requestAnimationFrame` rather than `setTimeout(fn, 0)`: rAF waits for the frame to flush while `setTimeout(0)` fires as fast as the JS thread allows, so the two are not interchangeable.

For repeating work, prefer a recursive `setTimeout` over `setInterval`, since `setInterval` fires on a fixed cadence regardless of how long the callback body takes, causing drift and potential callback pile-up when a tick runs long — a recursive `setTimeout` only re-schedules once the JS thread is idle again, making it self-correcting under load.

None of this is unique to new-architecture apps in foreground mode; it is standard single-threaded JS timer behavior that RN's Fabric/TurboModule changes did not alter.

## Confirmed findings

1. **Spec-compliance fix (RN 0.82+ is fine).** A prior new-architecture bug made `setTimeout`/`setInterval`/`clearTimeout`/`clearInterval` throw on missing, wrong-typed, or unregistered arguments (instead of the spec-compliant no-op/coerce behavior). Fixed upstream June 2024 ([#45105](https://github.com/facebook/react-native/pull/45105), original report [#45085](https://github.com/facebook/react-native/issues/45085)); confirmed still present in current `TimerManager.cpp`. Confidence: high (3-0 vote).

2. **rAF ≠ `setTimeout(fn, 0)`.** rAF fires only after frames have flushed; `setTimeout(fn, 0)` fires as fast as the JS thread permits. Don't substitute one for the other, especially for UI/animation-timed foreground work. Source: [RN docs](https://reactnative.dev/docs/timers) ([next](https://reactnative.dev/docs/next/timers)). Confidence: high (2-1 vote).

3. **`setInterval` drift under load.** `setInterval` does not guarantee its requested cadence when the callback body takes non-trivial time on the single JS thread — actual fire times drift later than requested, and errors compound across ticks. Recommended fix: a recursive `setTimeout`, which only schedules the next call once the JS thread is idle, avoiding the pile-up/overlap `setInterval` can cause when a tick runs long. Confidence: medium — corroborated by multiple independent write-ups, but rests on a single primary (blog) source rather than an RN-team source. Vote: 3-0 (drift) / 2-1 (recursive-setTimeout recommendation).

4. **Implementation detail.** `setTimeout` and `setInterval` are implemented via the identical native dispatch call in RN's JS timer layer (`JSTimers.js`), differing only by a boolean `recurring` flag; JS-side bookkeeping tracks live timers via three parallel arrays (timerIDs, callbacks, types). Not something app code needs to manage directly. Confidence: high (2-1 dispatch / 3-0 parallel arrays).

## Caveats

- Unclear whether the `JSTimers.js` JS-side shim is still the operative path under fully bridgeless new-architecture apps, versus being superseded/wrapped by the C++ `TimerManager.cpp` path referenced in the spec-compliance fix — the two sources weren't cross-checked against each other.
- The `setInterval`-drift/recursive-`setTimeout` finding rests on a single blog post (corroborated by secondary sources, no RN-team primary source).
- Several claims about background/foreground transition timer freezes and headless-task regressions were explicitly **refuted** during verification and are excluded from this synthesis — none of the surviving findings speak to background/foreground transition edge cases, only to general foreground single-thread timer semantics (see below; relevant if this app's WebRTC calling flow relies on timers surviving backgrounding).
- The rAF-vs-`setTimeout(0)` benchmark figure (iPhone 5S, 1000x/sec) is a stale, pre-new-architecture illustrative anecdote — the underlying mechanism it illustrates is not disputed.

## Open questions

- Does the JS-side `JSTimers.js` three-parallel-array/recurring-flag dispatch model still apply verbatim under fully bridgeless (new-architecture) RN apps, or has it been superseded by the C++ `TimerManager.cpp` path?
- Given several refuted claims about timer/setTimeout freezes when a non-RN Activity is on top of the RN activity or during backgrounding, what (if anything) differs about new-architecture timer reliability specifically in foreground vs. background/transition states for RN 0.82–0.86?
- Is there RN-team-authored (rather than blog-sourced) guidance quantifying `setInterval` drift/pile-up under the new architecture?
- Are there measurable, new-architecture-specific timer precision differences (vs. the old bridge) that would matter for this app's WebRTC/video-conferencing timing-sensitive code paths, warranting direct benchmarking?

## Claims investigated and refuted (not part of the synthesis above)

These surfaced during research but did **not** survive adversarial verification (vote shown is confirm-refute):

- RN implements standard browser timer APIs rather than a custom native-arch-specific API (1-2).
- `setTimeout` allocates a callback and delegates timing to native via `RCTTiming.createTimer` with a non-recurring flag (0-3).
- Issue #45085 is scoped explicitly to new-architecture/Bridgeless flow across Android/iOS/Web/Desktop (0-3).
- rAF is "the more reliable/appropriate primitive" framing from archived docs (0-3).
- In bridgeless mode, `JavaTimerManager`'s headless-task timer events depended on `TimingModule`, which isn't used under bridgeless and never registered its listener ([#47496](https://github.com/facebook/react-native/pull/47496)) (1-2).
- `setImmediate` executes at the end of the current JS execution block before the batched response is sent to native (0-3).
- A native C++ scheduler core (Nitro Modules/JSI) is offered as a faster alternative to JS timers ([tconns/react-native-nitro-bg-timer](https://github.com/tconns/react-native-nitro-bg-timer)) (0-3, both sub-claims).
- Measured `setInterval(fn, 1000)` drift to ~1001ms/2002ms/3007ms cumulative (0-3).
- `ClearFrameCallback` root-cause claim for background/foreground timer stoppage ([#47436](https://github.com/facebook/react-native/issues/47436)) (0-3).
- Timers/async callbacks only affected when backgrounded, foreground implied normal ([react/react-native#50327](https://github.com/react/react-native/issues/50327)) (0-3).
- Regression affects both old bridge and new architecture, not new-arch-specific ([#54534](https://github.com/facebook/react-native/issues/54534)) (1-2).
- `setTimeout()`/`requestAnimationFrame()` stop firing entirely once a non-RN Activity is on top of the RN activity, even though the JS thread stays alive ([#54534](https://github.com/facebook/react-native/issues/54534)) (0-3).
- `setImmediate`/`requestIdleCallback` bypass native `RCTTiming.createTimer` via a JS-side queue (0-3).
- New-arch `clearTimeout`/`clearInterval` throw on missing/non-numeric/unregistered-id arguments, diverging from spec (0-3 — refuted, i.e. contradicted by the confirmed fix in finding #1 above).
- Framing that the practical guidance is "upgrade RN version" rather than defensive wrapping, attributed to the issue filer's intent (0-3).

## Sources consulted (primary/high-quality)

- https://reactnative.dev/docs/timers — official RN timer docs
- https://reactnative.dev/docs/next/timers — official RN timer docs (next)
- https://github.com/facebook/react-native/blob/292cc82d0ebc437a6f1cdd2e972b3917b7ee05a4/Libraries/Core/Timers/JSTimers.js — JS timer shim source
- https://github.com/facebook/react-native/issues/45085 — spec-compliance bug report
- https://github.com/facebook/react-native/pull/45105 — spec-compliance fix
- https://medium.com/mj-studio/react-native-or-js-evil-setinterval-903ebbd131a2 — setInterval drift writeup

## Research method

Generated via the `internet` deep-research skill: 5 search angles → 20 sources fetched → 68 claims extracted → 25 claims adversarially verified (3-vote panel per claim) → 7 confirmed / 18 refuted → synthesized into the 4 findings above. Full raw output (102 agent calls) available in this session's transcript if deeper drill-down is needed.
