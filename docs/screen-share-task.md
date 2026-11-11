# Task: screen share (port of galaxy3 PR #371)

Source: https://github.com/Bnei-Baruch/galaxy3/pull/371 — "VirtualApp: add
screen sharing" (branch `screen-share`, **open**, read at commit `fe71589`,
2026-11-11). If the PR moves on, re-diff from that commit.

Status: **Phase 1 implemented, not yet tested against a real share** (jest
passes, JS bundle builds). Phase 2 — approach for sound not chosen yet.

## What the web PR does

- The sharer publishes the screen (video + mandatory audio) through a **second
  VideoRoom publisher handle** in the same Janus session. It joins the room as
  a separate participant whose `display.role` is `"screen"`
  (`display = {id, timestamp, role: "screen", display: username, is_group:
  false, is_desktop: true}`). Camera and mic are untouched.
- Every client detects that feed in `makeSubscription`, keeps it **out of the
  participant list**, subscribes to its h264 video + opus audio, and shows it
  **in place of the broadcast panel**.
- Screen mode: broadcast and quad (Kli Olami) are turned off, the previous
  state is saved and restored when the screen feed leaves. The broadcast
  button switches the panel between screen and broadcast, never both.
- One share per room: on a simultaneous start the earlier `display.timestamp`
  wins (tie → smaller feed id); the loser stops itself.
- Screen mode survives a reconnect; if the screen is gone after rejoining, the
  saved state is restored.
- Sharing is offered only in desktop Chromium (audio capture is required).
  The PR says explicitly: no share button on mobile, remote screens are still
  shown.

## Scope for mobile

Decided 2026-11-11:

- **Phase 1 — viewing a shared screen.** What the PR itself defines for
  mobile. Self-contained, and it fixes the "screen shows up as a participant
  tile" problem below, so it ships first.
- **Phase 2 — sharing from the phone.** Wanted. Goes beyond the PR (which
  hides the share button on mobile); see "Phase 2" below.
- **Broadcast-only entry (`isTen === false`) must not see screen shares.**
  It never joins the videoroom, so this holds with no extra code — just don't
  add a path that would show them.
- PiP shows the screen while it is the panel source; audio mode / background
  keep the screen's audio only.

## Why this matters before the port is done

With today's mobile code a screen feed is treated as an ordinary participant:
`makeSubscription` (`src/zustand/feeds.js:356`) does not look at
`display.role`, so the screen appears as one more small tile in the ten, named
after the sharer, with its audio playing over the broadcast. Nothing crashes,
but it is wrong. This happens as soon as the web PR is deployed.

## Phase 1 — viewing

### State — new `src/zustand/screenShare.ts`

- `screenFeed` — the screen feed currently in the room (`{id, display}`) or
  `null`
- `screenUrl` — `stream.toURL()` of its remote stream, `null` while connecting
- `panelSource` — `'screen' | 'broadcast' | null` (only set while `screenFeed`
  exists)
- module-level `preScreenState` — `{isShidur, isKliOlami}` saved on entering
  screen mode
- actions: `handleScreenFeed(pub)`, `clearScreenFeed()`, `enterScreenMode()`,
  `exitScreenMode()`, `showSharedScreen()`, `onScreenTrack(track, stream)`,
  `reset(keepPreScreenState)`
- pure helpers (exported, unit-tested): `parseDisplay`, `isScreenFeed`,
  `pickScreenWinner(a, b)`

### Feeds store — `src/zustand/feeds.js`

- [x] `makeSubscription`: split `pubs` into screen feeds and participants
      first. Screen feeds go to `handleScreenFeed` and never enter
      `feedById` / `feedIds` (so `updateWidth` and the "no feeds" check in
      `src/libs/subscriber-plugin.js:214` stay correct).
- [x] `makeSubscription`: a pub without `streams` (unpublished) has to be
      matched against `screenFeed.id` — `display` may be missing there, so
      role detection alone is not enough.
- [x] Subscribing to the screen feed has to work in both branches: subscriber
      already joined (`subscriber.sub`) and not joined yet
      (`subscriber.join` — the screen can be the only other feed in the room).
- [x] `subscriber.onTrack`: route tracks whose `stream.id` equals
      `screenFeed.id` to `onScreenTrack` **before** the existing code — it
      does `state.feedById[id].vOn = …` and throws when the id is not a
      participant.
- [x] `subscriber.onUpdate`: skip the screen feed id (today it logs
      `feedById[id] not found` as an error for unknown ids).
- [x] `videoroom.unsubFrom`: if the ids include `screenFeed.id`, unsubscribe
      it and call `clearScreenFeed()` (the current code only looks ids up in
      `feedById`).
- [x] `cleanFeeds`: reset screen state. On `restartFeeds` keep
      `preScreenState`; after the rejoin's first `makeSubscription`, call
      `exitScreenMode()` if no screen feed came back. On `exitRoom` restore
      and drop it.
- [x] Two screen feeds at once: keep the winner per `pickScreenWinner`,
      unsubscribe the other. (Mobile never has to stop its own share.)

### Screen mode — settings / shidur

- [x] `enterScreenMode`: save `{isShidur, isKliOlami}`; if the broadcast is
      on, stop it (`cleanShidur`) without tripping the "at least one of
      isShidur / isTen" guard in `toggleIsShidur`
      (`src/zustand/settings.js:49`); turn Kli Olami off; `panelSource =
      'screen'`.
- [x] `exitScreenMode`: restore Kli Olami; restart the broadcast only if it
      was on before and the user did not already switch back to it.
- [x] `toggleIsShidur` while a screen feed exists: flips `panelSource`
      between `'screen'` and `'broadcast'`.
- [x] **Screen audio.** On web the audio stops when `ScreenShareView`
      unmounts. In React Native remote audio plays as soon as it is
      subscribed, with no view involved — so when `panelSource` is
      `'broadcast'` the screen audio track must be disabled (or its mid
      unsubscribed), and re-enabled when switching back. Otherwise the clip
      and the broadcast play together.

### UI

- [x] New `src/InRoom/ScreenShareView.tsx`: `RTCView` with
      `objectFit="contain"` on black, 16:9 like the shidur, label "Screen of
      {{name}}", spinner + "Connecting…" while `screenUrl` is null,
      fullscreen button.
- [x] `src/InRoom/Layout/RoomLayout.js`: the shidur slot gets
      `ScreenShareView` when `panelSource === 'screen'`, otherwise `Shidur`;
      Kli Olami is not rendered in screen mode. Portrait, landscape and
      `RoomFullscreen` all take the slot as a prop, so they need no changes
      beyond that.
- [x] `updateWidth` (`src/zustand/uiActions.js:57`): treat "screen shown" the
      same as `isShidur` for the landscape tile width.
- [x] Switching screen ↔ broadcast: the existing broadcast button
      (`ShidurBtn`, unchanged) does it through `toggleIsShidur`. While the
      broadcast is shown during a share, a tappable bar above it
      (`ScreenShareNotice`) says "Show the screen shared by {{name}}" — used
      instead of a new menu entry, the menu row has no room for a 4th button.
- [x] i18n in `src/i18n/{en,es,he,ru}.json`, section `screenShare`:
      `sharedScreenOf`, `connecting`, `showSharedScreen`.

### As built — where it differs from the plan above

- The screen-feed logic lives in `src/zustand/screenShare.ts`; `feeds.js`
  only routes to it (`makeSubscription`, `unsubFrom`, `onTrack`, `onUpdate`,
  `cleanFeeds(isRestart)`, new `setScreenVideo`).
- `preScreenState` also keeps the broadcast's `isPlay`, because
  `cleanShidur` resets it; the broadcast resumes playing after the share.
- On leaving the room only the broadcast preset is restored. Kli Olami stays
  off (its stream is torn down by `exitRoom` anyway).
- Known gap: `restartRoom` (full room restart) during a share re-enters
  screen mode with the broadcast marked as paused, so after the share ends
  the user has to press play.

### Mobile-only modes (no web equivalent)

- [x] **Audio mode / app in background**: do not subscribe to (or drop) the
      screen video mid, keep the audio; show the audio-mode placeholder in
      the slot.
- [x] **PiP** (`src/shidur/ShidurPip.js`): render the screen stream when
      `panelSource === 'screen'`, the broadcast otherwise.
- [x] **Fullscreen** (`toggleIsFullscreen`): must work for the screen the
      same way as for the shidur; leaving screen mode while fullscreen should
      not leave an empty modal.
- [x] **Broadcast-only entry**: no screen share, by design (see Scope).

## Phase 2 — sharing from the phone

Checked in the installed `react-native-webrtc` 124.0.8:
`mediaDevices.getDisplayMedia()` exists on both platforms and returns a
stream with **one video track and no audio**
(`node_modules/react-native-webrtc/src/getDisplayMedia.ts`). Android uses
MediaProjection with the library's own `MediaProjectionService`; iOS needs a
ReplayKit Broadcast Upload Extension.

### Sound — the priority (video is optional)

Decided 2026-11-11: sound is required and matters more than video; both
Android and iOS.

What was checked in this repo's builds:

- `getDisplayMedia()` gives video only on both platforms.
- WebRTC has **one audio input per app** (the audio device module = the
  mic). Every local audio track carries that same input, so "a second audio
  track with the clip" does not exist out of the box — clip sound either
  gets mixed into the mic input or needs a second, custom audio device.
- Android (`org.jitsi:webrtc:124.0.0`): `JavaAudioDeviceModule` exposes only
  a read-only `SamplesReadyCallback`; there is no hook to modify or replace
  recorded samples. The app already builds its own module in
  `MainActivity.java:75`, so that is the place to swap in a patched one.
- iOS (`JitsiWebRTC`): the `RTCAudioDevice` protocol is present and
  `WebRTCModuleOptions.audioDevice` accepts a custom device — but it replaces
  mic capture and playout as a whole.

Options, from least to most client work:

| | Source | What has to be built | Limits |
|---|---|---|---|
| **A. Server plays it** | file upload or URL | A backend service that publishes the clip into the room as the `role: "screen"` feed. Phone only uploads/sends the link and start/stop. | Needs backend work. Web (PR #371) and mobile phase 1 show it **with no client changes**, sound and video both. |
| **B. Everyone plays it themselves** | URL only | Sharer sends link + play/pause/seek over MQTT; each client plays the clip locally in sync. | No local files. Needs a player and sync logic in **both** galaxy3 and mobile. Best quality, no media relay. |
| **C. In-app player mixed into outgoing audio** | file on the phone or URL | Native: decode in the app and feed PCM into WebRTC's audio input. Android: patched audio-record path; iOS: custom `RTCAudioDevice`. | Sound travels inside the sharer's **mic stream**, not a screen feed: it follows the mic mute, and Shidur/on-air treats it as the member's voice. No OS permission prompts. |
| **D. Capture system sound** | any app, incl. a browser | Everything in C, plus Android 10+ `AudioPlaybackCapture` (with the screen-capture consent) and, on iOS, a Broadcast Upload Extension that ships audio samples to the app (the library's extension channel carries video only). | Android: apps can opt out of capture. iOS: only through the extension. Largest by far. |

"From a browser" specifically:

- A separate browser app (Chrome/Safari) → only option D.
- A link opened inside our app → options A, B or C (the app fetches the
  media itself); no capture needed.
- A WebView page inside our app whose sound we would capture → Android: via
  D's capture path; iOS: not confirmed to be possible, needs a spike.

Decided 2026-11-11:

- Clips are **mostly links** → D (system capture) is not needed for the main
  case; the realistic choice is **A or B**, with C as the fallback that needs
  no backend and no galaxy3 work.
- A sound-only share **takes the broadcast panel** on viewers, same as a
  share with video. Mobile phase 1 handles it (`ScreenShareView` shows the
  audio placeholder when the screen feed has no video stream). On web the
  panel is black with the label — a placeholder there is a small galaxy3
  change.

Recommendation: **A** if backend time is available (it is the only option
that needs no native audio work and no galaxy3 changes), otherwise **B**.
Still to find out before choosing:

- What the links point to. Direct media files (mp3/mp4, e.g. the archive)
  work with A, B and C. Pages of video sites (YouTube etc.) work with B via
  an embedded player, with A only if the server can extract the media, and
  not with C.
- Whether the Janus setup allows a server-side publisher in a room the way A
  needs — not verified, ask the backend owner.

If A or B is chosen, the sections below about capturing the phone's screen
(Protocol, Android, iOS, Background behaviour) are **not needed** for the
main case — they stay here only for a later "share my actual screen" step.

### Janus-side ways to put a clip into a room (docs checked 2026-11-11)

Looked for ways that need no capture on the phone at all. Source: Janus
plugin docs (videoroom / streaming / audiobridge). Our clients use the
multistream API (`streams`, `mid`), so the servers are Janus 1.x — the exact
version and build options are **not known from this repo**.

1. **VideoRoom remote publisher** — `add_remote_publisher`. Janus opens a
   plain-RTP port and creates a publisher fed from it. The request takes
   `display` and `metadata`, and per the docs "a remote publisher is
   advertised and looks exactly like any other local publisher". So a server
   process (GStreamer / ffmpeg reading the link) can appear in the room as a
   feed with `display.role = "screen"` — web PR #371 and mobile phase 1 would
   show it **with no client changes**, sound and video.
   Caveats: documented for Janus-to-Janus cascading, not as a general ingest
   path — feeding it from GStreamer is plausible (plain RTP, streams matched
   by SSRC) but must be proven. Needs the room `secret` if rooms have one,
   and a Janus version that has remote publishers.
2. **Server-side WebRTC publisher** — a headless publisher (e.g. GStreamer
   `webrtcbin`) joins the room like a browser does. Certain to work with any
   Janus, heavier to build and run than 1. Same result for clients.
3. **Streaming plugin mountpoint** — `create` with `type: "rtp"` at runtime,
   fed by ffmpeg/GStreamer; `type: "rtsp"` takes a URL directly if Janus was
   built with libcurl. Clients `watch` it — both web and mobile already have
   streaming-plugin code (the broadcast, Kli Olami). Needs **client changes
   on both sides** (announce the mountpoint to the room, watch it in the
   panel), but they are small. `create` may require the plugin `admin_key`.
   Local files for `live`/`ondemand` mountpoints: Opus / a-law / mu-law only.
4. **AudioBridge** (`play_file`, plain-RTP participants) — exists, but rooms
   are VideoRoom, not AudioBridge, so it does not apply. `play_file` also
   takes only a local `.opus` file, no URLs.
5. `rtp_forward` goes the other way (out of the room) — not an ingest path.

Precedent in the organisation: `Bnei-Baruch/trl-proxy` is a Go + GStreamer
service that already handles Janus RTP, and `janus_keeper` manages streaming
mountpoints — so a small "clip player" service is in line with what exists.

**This makes option A concrete.** Phone (or web) sends "play this link in
room N" to a service; the service decodes the link and publishes it via 1
(or 2). Sound + video, iOS + Android, no native audio work, no extension
target. Works for direct media links; pages of video sites need media
extraction on the server.

Spike for A (needs a test Janus and its room secret — backend owner):

- [ ] Janus version on the room servers; is `add_remote_publisher` there?
- [ ] On a test room: `add_remote_publisher` with
      `display = {"role":"screen","display":"…","timestamp":…}` and one Opus
      + one H.264 stream; push RTP from GStreamer reading a media URL.
- [ ] Web on the PR build and mobile phase 1 both show it and play sound;
      `remove_remote_publisher` ends the share cleanly on both.
- [ ] If remote publishers are unavailable or reject the RTP → try 2.

### Step 0 — spike: can Android capture a browser's sound?

Chosen 2026-11-11 as the first step of Phase 2: capturing sound from a
browser app is wanted (option D), and everything else in D only makes sense
if this works. Throwaway code, not for merge.

- [ ] Minimal native test on an Android 10+ device: request MediaProjection
      consent, open an `AudioRecord` with `AudioPlaybackCaptureConfiguration`
      (usages MEDIA / GAME / UNKNOWN), write a few seconds to a WAV file.
- [ ] Play a clip in **Chrome** (normal tab) and check the file has its
      sound. Repeat for: Chrome incognito, a YouTube page in Chrome, the
      YouTube app, Samsung Internet / Firefox if used by our users.
- [ ] While in a room: check that capture keeps working with our audio
      session active (`USAGE_VOICE_COMMUNICATION`, mic open) and that the
      room's own incoming sound is **not** in the capture (voice-call audio
      should be excluded by the OS — confirm, otherwise there is an echo
      loop).
- [ ] Note the Android versions and devices tried.

Outcome decides the next step:

- Works → design the injection into WebRTC on Android (patched audio-record
  path, see `MainActivity.java:75`), then the iOS side (Broadcast Upload
  Extension + audio channel to the app + custom `RTCAudioDevice`).
- Chrome is not capturable, or the room sound leaks in → drop D, go back to
  A / B for links.

iOS has no equivalent cheap spike: nothing can be tested there before the
extension target exists.

### Protocol (same as web, so web/Shidur need no changes)

- [ ] Second `PublisherPlugin` attached to the existing `janus` session in
      `src/zustand/feeds.js`, joined with `display = {id, timestamp, role:
      "screen", display: username, is_group: false, is_desktop: false}`.
- [ ] `PublisherPlugin` (`src/libs/publisher-plugin.js`) is written for the
      camera publisher and needs parameters for the screen one:
  - `join` always sends `metadata: buildUserState()` — web sends
    `{owner, rfid, display}` for the screen handle;
  - `join` builds the id as `${user.id}-m_…` — check it cannot collide with
    the camera handle's id;
  - `hangup` and several error paths call `useFeedsStore.restartFeeds()` — a
    screen connection failure must only stop the share, never restart the
    room.
- [ ] After publish: `setBitrate(1500000)` on the handle, and on the video
      sender `maxBitrate` 1.5 Mbps + `degradationPreference:
      "maintain-framerate"`, as web does. Capture is the phone's native
      resolution — use `android.resolutionScale` / scale down toward 720p.
- [ ] Remember our own screen feed id: do not subscribe to it, show a local
      preview/notice with a Stop button instead.
- [ ] One share per room: share button disabled while a screen feed exists;
      on a simultaneous start the `pickScreenWinner` loser stops itself and
      shows "{{name}} is already sharing the screen".
- [ ] Stop on: our button, the OS "stop" (track `ended`), screen connection
      failure, `exitRoom`, `cleanFeeds` / `restartFeeds`, and
      `onNoNetwork` teardown. `leave` best-effort (3 s) then detach.
- [ ] Not offered to ghost/guest roles, same as web.

### Android

- [ ] Manifest: `FOREGROUND_SERVICE_MEDIA_PROJECTION` permission (the app
      service today declares only `mediaPlayback|microphone|connectedDevice`,
      `android/app/src/main/AndroidManifest.xml:83`) and enable the library's
      service via `WebRTCModuleOptions.enableMediaProjectionService`.
      targetSdk is 36, so the Android 14+ rule applies: the
      mediaProjection-type service may start only after the user accepts the
      capture dialog.
- [ ] Two foreground services/notifications will run during a share (ours +
      the library's) — verify they coexist, and that stopping the share
      leaves ours running.

### iOS

- [ ] New Broadcast Upload Extension target, an App Group shared with the
      app, and `RTCScreenSharingExtension` / `RTCAppGroupIdentifier` in
      `Info.plist`; start via the library's `ScreenCapturePickerView`. There
      is already a `GalaxyWidget` extension target to model signing on.
- [ ] Release pipeline: new bundle id, provisioning profile and
      `yarn release:ios` changes for the extra target.

### Background behaviour (the hard part on mobile)

Sharing means leaving the app, and today going to background calls
`enterAudioMode()` and mutes the camera (`src/zustand/inRoom.js:246`).

- [ ] While sharing, backgrounding must keep the screen publisher sending;
      camera mute and dropping remote videos in background stay as they are.
- [ ] Android PiP: entering PiP while sharing should not stop the share.
- [ ] Connection monitor: a >20 s outage tears down the session
      (`onNoNetwork`) — the share must be stopped cleanly there too.

### UI

- [ ] Share / stop button in `src/roomMenuLevel1/btns/` with the four web
      modes: start, stop, busy (someone else shares, screen shown), show
      (someone else shares, broadcast shown).
- [ ] Sharer's view in the panel: local preview (or just a notice — the
      preview of the app itself is a mirror) with "You are sharing your
      screen" and Stop.
- [ ] i18n: `shareScreen`, `stopShareScreen`, `youAreSharing`,
      `screenShareTaken`, `screenShareFailed`; if video-only, a line telling
      the sharer that sound is not transmitted.

## Tests

- [ ] Jest: `parseDisplay`, `isScreenFeed`, `pickScreenWinner`, and the
      `makeSubscription` split (screen feed not in `feedById`).
- [ ] Manual, with a desktop Chrome sharer on the PR build (Maestro cannot
      drive the sharing side):
  - [ ] A (web) shares → mobile shows the screen instead of the broadcast,
        with sound; no extra tile in the ten.
  - [ ] A stops → broadcast and Kli Olami come back as they were.
  - [ ] Mobile toggles the broadcast button during the share → switches
        between broadcast and screen, never both sounds at once.
  - [ ] Mobile joins a room where a share is already running.
  - [ ] Network drop / `restartFeeds` during a share, with the share still
        there and with it gone after rejoin.
  - [ ] Portrait, landscape, fullscreen, audio mode, background, PiP.
  - [ ] Android and iOS.
  - [ ] Broadcast-only entry: no screen, broadcast unaffected.
- [ ] Phase 2, manual: phone shares → web and another phone see it; stop via
      button and via the OS; share survives backgrounding; two simultaneous
      starts (phone vs web); network drop while sharing; Shidur preview does
      not show the phone's screen feed.

## Open questions

1. Phase 2: A (server plays the link) or B (every client plays the link in
   sync)? Both need work outside this repo — backend for A, galaxy3 for B.
2. What do the links point to: direct media files, or pages of video sites?
3. Is capturing the phone's real screen still wanted at all, once links work?

## Noticed along the way (not part of this task)

- `src/zustand/feeds.js:157` and `:310` read `get().janusInfo?.rfid`, but
  `janusInfo` lives in the user store (`setJanusInfo` at `:232`), so the
  value is always `undefined` and those "skip my own feed" filters do
  nothing.

## Log

- 2026-11-11 — PR read, mobile code surveyed, plan written. No code changed.
- 2026-11-11 — Decisions: sharing from the phone is wanted (added as Phase
  2); broadcast-only entry must not see screens; PiP / audio-mode proposals
  accepted. Checked `react-native-webrtc` 124.0.8: screen capture is
  video-only on both platforms.
- 2026-11-11 — Phase 1 implemented: `src/zustand/screenShare.ts`,
  `src/InRoom/ScreenShareView.tsx`, changes in `feeds.js`, `settings.js`,
  `inRoom.js`, `uiActions.js`, `RoomLayout.js`, `ShidurPip.js`, i18n ×4,
  `__tests__/screenShare.test.js`. `yarn test` 47/47, dev bundle builds.
  **Not run on a device and not tested against a real web share** — the
  manual list under Tests is still open.
- 2026-11-11 — Phase 2: sound is the priority, iOS + Android. Audio hooks of
  the bundled WebRTC builds checked, options A–D written up.
- 2026-11-11 — Decisions: clips are mostly links; a sound-only share takes
  the broadcast panel. `ScreenShareView` now shows the audio placeholder for
  a screen feed without video instead of an endless "connecting".
- 2026-11-11 — Capturing sound from a browser app (option D) is wanted.
  First step of Phase 2 is the Android spike (Step 0); A / B stay as the
  fallback for links.
- 2026-11-11 — Janus docs checked for non-WebRTC ingest: VideoRoom remote
  publishers (plain RTP in, shows up as a normal publisher) make option A
  concrete; streaming mountpoints are the alternative with small client
  changes. Not tested against our servers. Which spike goes first (Janus
  ingest vs Android capture) is open.
