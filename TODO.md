# TODO

Collected from `TODO`/`FIXME` comments in the source.

## MQTT / Janus transport

- [ ] `src/libs/janus-mqtt.js:58` — on reconnect to the `user.id` topic, messages from the previous session may arrive; check and handle.
- [ ] `src/libs/janus-mqtt.js:285` — check whether the request object is needed.
- [ ] `src/libs/janus-mqtt.js:524` — add `iceFailed` to the plugin handle.
- [ ] `src/libs/mqtt.js:174` (FIXME) — send cmd messages to a separate topic.

## Janus plugins — connection state

Comment out the workaround once there is a way to detect Janus connection state:

- [ ] `src/libs/publisher-plugin.js:341`
- [ ] `src/libs/streaming-plugin.js:212`
- [ ] `src/libs/subscriber-plugin.js:204`

## Shidur

- [ ] Check and fix subtitles scaling in full-screen shidur.

## UI/UX

- [ ] Clarify UI/UX: add presets for entering a room:
  - Shidur only
  - Feeds only
  - …possibly more options to come
