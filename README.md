# PADEL 5IVE · Match Control

Production source for **PADEL 5IVE Unified Match Control**, version **5.5.16**.

**Website:** https://padel5ive.netlify.app  
**Source:** https://github.com/padel5ive/padel5ive-app

## Project structure

| Path | Purpose |
|---|---|
| `public/` | App launcher, Americano/Mexicano, Team Showdown, static assets, public Share Results viewers |
| `netlify/functions/` | Publish/read results API (Netlify Blobs, server-side PIN handling) |
| `scripts/` | Build verification and PDF smoke tests |
| `netlify.toml` | Netlify build/publish, Functions, and public results redirects |
| `package.json`, `package-lock.json` | Node dependencies and build commands |
| `RELEASE_MANIFEST_V5515.json` | Current release metadata |
| `docs/QA_REPORT_V5515.md` | Last integrated pre-deploy QA report |

## Fairness scheduler (new sessions)

Individual Americano with ideal 6 players/court (6/1, 18/3, 24/4, 30/5) uses 3-round fair cycles: G gap never exceeds 1, and all players have equal G after each complete 3-round block until the final partial block. The certified 12/2 schedule is retained. Existing saved matches, other modes, PDF renderer, and published result URLs are unchanged.

The moderator dashboard displays the publishing PIN per the venue operator’s preference. Do not share moderator access with unauthorized users.

## Deployment

The existing Netlify site is connected to the **`main`** branch. Keep the **same Netlify site**; do not replace it with Netlify Drop, which will not deploy the required Functions.

Build settings are defined in `netlify.toml`:
- Command: `npm run build`
- Publish directory: `public`
- Functions directory: `netlify/functions`

Development / deployment validation:

```bash
npm ci
npm run build
```

**Environment:** preserve the existing Netlify server-side variables `PADEL5IVE_UNIFIED_SHARE_PIN` and `PADEL5IVE_SHOWDOWN_SHARE_PIN`; never commit PIN values or stored results into the repository.

## Public results

- Americano / Mexicano: `/u/{id}` (backend `/api/unified-results`)
- Team Showdown: `/r/{id}` (backend `/api/results`)

Both are read-only public viewers; scores and published data are managed through the dashboard.

## Release status

The v5.5.16 source and repository build were verified. **Live Netlify result publication, iPad Safari behavior, and end-to-end smoke tests must be checked separately** before treating the release as a locked production master.

For rollback use Git history or restore the previous successful deployment on the existing Netlify site. Historical QA notes and earlier release manifests remain retrievable through Git history.
