# PADEL 5IVE — PWA Preview (Isolated Branch)

**Source baseline:** Production main `d9b5cf5937a5b0a14b6a60749db17788788d1683`.

This branch is a non-production experiment. It adds installable web-app metadata, official-logo icons, standalone Home Screen behavior, an offline fallback, and network-first caching of already-visited app pages and their assets. The scoring/scheduling engines, local session management, PDF export, public results routes, and backend API code are unchanged.

## Safety boundaries

- Do **not** deploy to `main` until tested on iPad Safari. Use a Netlify Deploy Preview for the PR.
- Service worker deliberately does **not** intercept `/api/`, `/.netlify/`, `/u/`, `/r/`, or `/results/`. Scores and published results must never be cached.
- The existing app uses browser storage for sessions; installing a PWA does **not** move sessions between Safari and standalone mode. Back up important sessions manually. Clearing Safari/site data may erase sessions.
- PWA offline mode is best-effort, not guaranteed persistent storage, and has no offline Share Results publishing.
- App pages and assets are network-first with cache fallback. Newly visited modes need to be opened online once.
- Worker updates never force refresh of an active session. New install/old worker behavior requires real-device QA.

## Manual acceptance on preview URL

1. Open the **HTTPS deploy preview** in Safari iPad/iPhone.
2. Add to Home Screen → Open as Web App; check PADEL 5IVE icon and standalone presentation.
3. Create a dummy session, enter scores and navigate between the launcher, Individual Americano and Team Showdown.
4. Open all desired pages online, then enable Airplane Mode; reload each visited page and try editing **dummy** local scores. Verify offline banner and Share Results unavailable until online.
5. Reconnect, refresh, and test that new scores/updates in Share Results are never stale.
6. Back up and restore a dummy session; test PDF export and keyboard Tab/Next.
7. Run Android Chrome install test. Only after acceptance decide whether to merge.

Use the preview for dummy sessions: a PR Deploy Preview may have separate backend storage and env settings from production. Never assume a published result is available there.

## Review and verification

- `public/manifest.webmanifest` valid manifest with standalone display and shortcuts.
- `public/sw.js` scope '/' with explicit API denylist; network-first pages/assets.
- `public/pwa-register.js` registers only HTTPS/localhost; no auto skipWaiting.
- `public/_headers` prevents caching the service-worker bootstrap and manifest.
- Icons derived from PADEL 5IVE master logo using `scripts/generate-pwa-icons.py`.
- `scripts/qa-pwa.cjs` regression/smoke checker covers registration and assets.
