# PADEL 5IVE Match Control · v5.5.14 Full Integration

**Full Netlify/GitHub source package; deploy candidate, NOT a locked production master until real-device/public-link smoke checks pass.**

## Included

- Unified Match Control dashboard: Americano/Mexicano, Individual/Fixed/Structured variants and any existing format controls from the v5.5.6 baseline. Original engine logic retained byte-for-byte.
- Team Showdown dashboard and game engine from v5.5.6, untouched.
- Existing Export / Save as PDF generator from v5.5.6, byte-for-byte untouched.
- v5.5.14 approved visual Share Results viewer for Americano/Mexicano at **`/u/{id}`**. All results are dynamically fetched from `/api/unified-results?id={id}`; no QA fixture embedded.
- v5.5.14 approved Team Showdown viewer at **`/r/{id}`**, dynamically fetched from `/api/results?id={id}`. Shows actual club names, verified champion, Stage 3 → Stage 2 → Round Robin standings → Round Robin matches, and pair analysis.
- Netlify Functions storage and PIN authorization unchanged. Previous public result URLs remain compatible.

## Critical: how to deploy

**Requires a Netlify site connected to a Git repository, or a Netlify CLI build/deploy.** A plain static **Netlify Drop** of this ZIP does not deploy Netlify Functions and will break publishing/public-result APIs.

From the project repository root in GitHub Codespaces/terminal:

```bash
# First preserve a rollback commit or download the existing repo
unzip -o PADEL5IVE_V5514_FULL_GITHUB_NETLIFY_DEPLOY.zip
npm install
npm run build
# Review changes before deployment
git status
git add -A
git commit -m "PADEL 5IVE v5.5.14 integrated Share Results"
git push origin main
```

Confirm Netlify Deploys → **Published** on the existing site. **Do not create a new Netlify project** because existing shared result records and environment settings belong to the original site.

For manual CI: `npm run build` verifies required public pages, scripts, functions and redirects; Netlify publish directory is `public` and functions directory is `netlify/functions`.

## Environment (unchanged)

Keep `PADEL5IVE_UNIFIED_SHARE_PIN` and `PADEL5IVE_SHOWDOWN_SHARE_PIN` configured on the existing Netlify site. They are server-side secrets; this archive does not include them. No results data or saved sessions are embedded in this ZIP.

## Immediate post-deploy acceptance

1. Open the landing page and each game-mode dashboard. Verify previously saved sessions are still accessible on the same origin.
2. Test Americano with **no knockout**, then with **Double Elimination** (Championship/Winners/Losers), including horizontal scrolling on iPhone and iPad.
3. Test Team Showdown public `/r/{id}` for a completed real/synthetic session. Verify team names, stage winner, standings, scores, Stage 3→2→1 ordering and filters.
4. Use Share Results → Publish → Copy Link → open the link in another browser; then **Update Published Results** and confirm the same URL refreshes. Do this for both Unified and Team Showdown.
5. Export A4 Landscape PDF from both dashboards on real iPad Safari; verify Save to Files and PDF content.
6. Test keyboard **Tab/Next** for registration, scoring, settings, and edit score, plus backup/restore and KO progression.
7. If anything breaks, restore the prior Netlify deploy or Git commit.

## QA performed here

- `npm run build` and JS syntax checks passed.
- Read-only public renderers tested with a mock API holding real-schema snapshots for Unified with/without KO and Team Showdown one-stage/three-stage; responsive Chromium tests passed at iPhone (390px) and iPad (1024px).
- Original engine and direct PDF renderer are checksum-identical to v5.5.6 baseline.
- Tests performed with **mock API data**, not against live Netlify; actual publish/permission/Blob lifecycle, Safari iPad, and device data persistence remain to be accepted.

## Source control scope

This package does not change live master archives. Source changes relative to v5.5.6 are limited to read-only viewer assets, a new Team Showdown read-only results page, the public `/r/*` redirect, deploy tests, and version/manifest documentation.
