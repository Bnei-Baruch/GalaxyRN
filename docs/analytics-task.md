# Task: product analytics (feature usage)

Status: **not started — vendor not chosen** (2026-11-17).

Goal: know how the app is actually used — which features, how often, by what
share of users/sessions, session length, retention. Today there is no product
analytics; only Sentry (`App.js`, errors + session tracking), which has no
funnels / retention / per-feature usage.

## Open questions (decide first)

- May event data leave our infrastructure (third-party SaaS), or must it stay
  on our servers?
- Who will read the data — devs only, or a product/content team (needs ready
  dashboards)?
- Is there anyone to run a self-hosted service (PostHog / ClickHouse)?

## Options

| Option | Pros | Cons |
|---|---|---|
| **PostHog** (EU cloud or self-hosted) | Open source, RN SDK, funnels / retention / dashboards / feature flags out of the box; self-host keeps data in-house | Self-host = ops (ClickHouse inside); cloud free tier ~1M events/month |
| Firebase / Google Analytics | Free, quick | Data goes to Google, native deps + `google-services`, weak ad-hoc queries (BigQuery export), New Arch friction |
| Amplitude / Mixpanel | Strongest analysis (cohorts, paths) | Paid at scale, third-party data |
| Sentry (already in) | Nothing new | Monitoring tool, not product analytics — at most simple counters |
| Own pipeline: events over existing MQTT / HTTP → ClickHouse/Postgres → Grafana/Metabase | Full control, data stays in-house, transport exists | Funnels / retention / dashboards built by hand |

**Leaning:** PostHog (EU cloud or self-hosted). Own pipeline only if data
policy forbids third parties and someone owns the reporting.

## Design / best practices

1. **Tracking plan before SDK.** Start from questions, e.g. share of sessions
   using screen share / chat / audio-device select / shidur options; time in
   room; 7-day return rate; entry mode (Broadcast / Ten). ~15–30 events, not
   "track everything".
2. **Single wrapper** `src/services/analytics.ts` — no direct vendor calls
   anywhere. Enables vendor swap, opt-out, dev disable, test mocking.
3. **Typed events.** `object_action`, snake_case (`room_joined`,
   `screen_share_started`, `chat_message_sent`); names + props as a TS union so
   typos fail at compile time.
4. **Track in zustand store actions**, not components — single choke point, no
   duplicates from re-renders.
5. **Super-properties** on every event: app version, platform, device model,
   room type / entry mode. Durations: start/end pair or `duration_ms` on end.
6. **Privacy.** Identify by Keycloak user id (hashed), no email/name. Opt-out
   toggle in settings (GDPR). Update App Store privacy labels and Google Play
   Data safety. **No session replay** (video app: privacy + perf).
7. **Performance.** Batched sends, offline queue, `track()` never blocks hot
   paths (same rule as `debug` logging).
8. **Environments.** Separate dev / prod projects (or don't send from `__DEV__`).

## Steps

- [ ] Answer the open questions, pick vendor.
- [ ] Write the tracking plan (events + properties) for current features:
  room join/leave, shidur, chat, screen share, audio devices, settings,
  entry options.
- [ ] `src/services/analytics.ts` wrapper + typed event map + opt-out flag in
  `src/zustand/settings.js`.
- [ ] Wire events into zustand store actions.
- [ ] Opt-out UI in settings + i18n strings.
- [ ] Store privacy declarations (App Store / Google Play).
- [ ] Dashboards for the initial questions.
