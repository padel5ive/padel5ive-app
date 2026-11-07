# PADEL 5IVE · Unified v5.4.13 — Existing Netlify Site Deployment

**Target:** https://padel5ive.netlify.app/ (retain existing Netlify project and URL).  
**State:** ready-to-deploy, NOT uploaded or verified online yet.  
**Source:** Phase 5.4.13 official staging project, with production-safe folder split; all 3 original product baselines backed up separately.

## Contents

- `public/` – website only: Home, Unified Americano/Mexicano, Team Showdown, OG preview.
- `netlify/functions/` – server APIs. These files are NOT exposed as public static files.
- `netlify.toml` – functions + public routes + build settings.
- `package.json` – Netlify Blobs dependency and build verification.

### Important: before deployment

1. Do NOT delete the existing `padel5ive.netlify.app` Netlify project; replacement can happen by deploying this repo/project to **that exact site**. Check the site slug before `--prod`.
2. Save any **active match/session** data from the existing website using in-app Backup/Export. A source ZIP does not contain scores stored in browser localStorage or old Netlify Blobs.
3. The v5.4.13 backend is new and its real Netlify access has **not yet been tested**. Deploy a draft first, and publish to the live domain only once the draft works.

## Deployment method A — Direct Netlify CLI (existing site, no new GitHub repo)

On a laptop or desktop with Node.js installed:

1. Unzip this archive. Open a Terminal **inside the extracted directory** (where `netlify.toml` lives).
2. Run `npm install`.
3. Run `npm install -g netlify-cli`.
4. Run `netlify login` to sign in to the Netlify team holding `padel5ive.netlify.app`.
5. Run `netlify link`, then select **Use current project** → `padel5ive.netlify.app` (wording may vary). Check that `.netlify/state.json` contains the right site ID, without sharing credentials.
6. In Netlify site settings → Environment variables, create both:
   - `PADEL5IVE_UNIFIED_SHARE_PIN` (long unique value, 12+ chars)
   - `PADEL5IVE_SHOWDOWN_SHARE_PIN` (different long unique value)
   Ensure runtime **Functions** scope is included. Never enter the PIN into public code or send it in screenshots.
7. Run `npm run build` and then `netlify deploy` for a **draft URL** (not live production). Confirm both Functions were deployed in the deploy logs.
8. After the draft acceptance test, run `netlify deploy --prod` from the same folder. This updates the existing domain rather than creating a new one.

If the draft deploy does not have production-scoped PINs, use suitable Deploy Preview/All-context variables or test API only after confirmed production-safe configuration. Never share PIN with the assistant.

## Deployment method B — GitHub + Netlify CI

1. Unzip and upload **contents**, not the outer ZIP, into a new GitHub repository.
2. In your **existing** Netlify `padel5ive` project, link that repository under Project configuration → Continuous deployment (if repository linking is available). Keep the existing Netlify project.
3. Build command: `npm run build`; publish directory `public`; functions directory `netlify/functions` (all already specified in netlify.toml).
4. Set both PIN secrets in Netlify environment settings before triggering the first build.
5. Check build logs to confirm both server Functions exist. Publish and test.

## After deployment: links to test

- `https://padel5ive.netlify.app/` – portal and game selection.
- `https://padel5ive.netlify.app/modes/unified/` – Americano/Mexicano engine.
- `https://padel5ive.netlify.app/modes/club-match/` – Team Showdown.
- `https://padel5ive.netlify.app/api/unified-results?id=notfound` – should return JSON error, **not an HTML 404**; this verifies function routing.
- `https://padel5ive.netlify.app/api/results?id=notfound` – Team Showdown API check.
- Run an actual tournament, confirm one score, Publish result (enter private PIN), open resulting `/u/<id>` in private Safari, edit score then Update and confirm same URL.
- Complete Team Showdown and check `/r/<id>`.
- Verify PDF A4 Landscape and New Session → Resume. Manual results publishing is **snapshot-based**, not automatic.

## Recovery

Netlify retains previous deploys; if severe failures occur, restore the last-good deploy in Netlify Deploys without deleting the site. Three source archives are backed up separately and untouched. Live data (localStorage and Netlify Blobs) need their own operational backup.

**Do not share administrator PINs or API tokens in chat.**
