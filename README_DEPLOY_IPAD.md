# PADEL 5IVE · Unified Match Control · v5.4.13.8

**Release status: QA / UAT candidate — not Master Locked.** No Netlify production deployment has been performed by this package creation.

## Final menu wording (v5.4.13.8)

- Americano/Mexicano and Team Showdown both display **Export / Save as PDF**, without A4 or Landscape metadata in the dashboard. The technical PDF print settings remain unchanged.
- Share Results remains a separate interactive web link with the existing per-mode PIN labels.

## What changes

- Americano + Mexicano public Share Results at `/u/<results-id>` now opens an **interactive read-only Official Results viewer**, built from the locked Fixed Partner Master design and restored original Photo Edition backgrounds: leaderboard W–L–T, DIFF, P, G, player/pair analysis, round results, connected KO bracket, winner/runner-up.
- Publishing UI adds Share to WhatsApp, native Share Link, Copy Link, Open Results; published result updates are sent to the same URL.
- Unified Share & Export displays only **Export / Save as PDF** (actual PDF) and **Share Final Results Link**; no Download HTML action.
- Unified PDF is a real `.pdf` (all pages A4 landscape, including cover). iOS native file-sharing opens when `navigator.canShare({files})` is available; otherwise download fallback.
- Share label PIN shown on Unified dashboard: `PIN · 55 55 55 55 55 55`; Team Showdown: `PIN · 55 55 55 55`. These are visible labels; separate secret PINs live in Netlify environment settings.
- Club Match/Team Showdown interactive public results remains the **preexisting v0.8.48-origin renderer**. Original Team Showdown print workflow is unchanged; direct native PDF applies to Unified.
- Home, scoring, matchmaking, court rotation and source locked masters are not modified.

## Upload using iPad / GitHub Codespaces

1. Download `PADEL5IVE_UNIFIED_V54138_FINAL_GITHUB_IPAD_DEPLOY.zip` and save in Files.
2. Safari → GitHub → repo `padel5ive/padel5ive-app` → Add file → Upload files; select the ZIP and commit to `main`.
3. Repo → Code → Codespaces → open existing (or create) Codespace on `main` → Terminal.
4. Run the following commands **from repository root**:

```bash
unzip -o PADEL5IVE_UNIFIED_V54138_FINAL_GITHUB_IPAD_DEPLOY.zip
rm PADEL5IVE_UNIFIED_V54138_FINAL_GITHUB_IPAD_DEPLOY.zip
npm install
npm run build
git add -A
git commit -m "Unified v5.4.13.8 master share and PDF restoration"
git push origin main
```

If no files changed, `git commit` may report `nothing to commit`; this is not a deploy error. **Do not upload only `public/modes/unified/index.html`:** this release requires new `public/assets/*`, `public/results/unified/index.html`, an updated `netlify.toml`, and backend validation.

5. Netlify → existing site `padel5ive.netlify.app` → Deploys → verify build is **Published**. Repository auto-build must be enabled.
6. For real publishing: Netlify → Project configuration → Environment variables → confirm `PADEL5IVE_UNIFIED_SHARE_PIN` and `PADEL5IVE_SHOWDOWN_SHARE_PIN` are set for Netlify Functions (at least 12 characters where the backend requires it). Redeploy after changing environment variables.
7. Open a dummy tournament, finish score → Share Results → Publish → Share WhatsApp / Copy Link. Open the public URL in Safari *on another device*, test leaderboard, score history, KO, and perform Update Published Results to confirm URL unchanged.
8. From Americano/Mexicano, choose **Export / Save as PDF** on iPad → native Share Sheet → **Save to Files**. Check each PDF page is landscape, not portrait.

**Security note:** If `555555555555` or `55555555` is your actual Netlify publishing PIN, anyone with dashboard access can see it. For security, change the real PIN to a different, private value and do not display it publicly; treat the dashboard PIN as visual-only information.

## Recovery

Keep previous GitHub commit and prior production Netlify deploy for rollback. The locked **Fixed Partner v4.8.92.23** and **Club Match v0.8.48** backups remain separate and untouched. Source code archive does **not** include live browser-local sessions, private Netlify Blob results, or secret environment variable values.

## Acceptance

Local Chromium QA and simulated backend passed. **Real Netlify deployment, iPadOS Safari native Save to Files, WhatsApp preview, public link round-trip, and multi-device session restore are still pending.** Do not mark production master locked until these pass.
