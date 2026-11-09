# PADEL 5IVE — Phase 5.7 Acceptance Test (iPad / iPhone)

**Environment:** Netlify Deploy Preview for draft PR #3, not production `main`.

## Open
1. In Netlify, select the existing **padel5ive** site.
2. Go to **Deploys → Deploy Previews**, open the preview for GitHub **PR #3**, and tap its preview URL.
3. If no preview is shown, stop: do not test `padel5ive.netlify.app` (production) or the previous v5.6.6 preview.

## Phase 5.7.3 visual and functional acceptance (iPad + iPhone)

1. **Home:** Start New Session (gold primary) is ABOVE Session History (navy-outline secondary) on **both** iPad landscape and iPhone portrait. Both must be centered, same width, same height; Resume appears below them when active.
2. **Initial Setup:** Existing Sessions is absent from the form. It remains available exclusively through Home Session History without data loss.
3. **Game Date:** full-width date field with its native Safari date picker.
4. **Game Time:** separate, full-width hour dropdown **below the date**, with 24 choices from 00:00 to 23:00. The option must be visible and selectable. With session name, date, mode, courts, and format filled, selecting an hour enables **Continue to Registration**.
5. **Time persistence:** after Continue to Registration, the dashboard, PDF, and public results should display the selected time; existing legacy sessions without a time continue to load.
6. **Public Champion:** centered trophy, winner and runner-up, court photography subtly darkened; no oversized cropped 5 and no competing watermark.
7. **Fixed Share Results wallpaper:** iPad and iPhone Safari vertical scrolling must not move the venue backdrop; leaderboard and KO bracket stay scrollable.
8. **WhatsApp social preview:** send an actual newly published `/u/{id}` public link through WhatsApp. Confirm the minimal **PADEL 5IVE · Signature Game** image card with the existing 1200×630 JPEG cover and **Official Match Results** description. If a previously shared URL displays stale metadata, test a newly published URL; WhatsApp caches links independently of the site.
9. **PWA cache:** reopen standalone PWA after an update; confirm revised controls appear without clearing saved matches.

Automated checks validate source structure, no-KO results and metadata, **not** real Safari interaction or WhatsApp's external crawler. Do not merge until these device tests pass.

## Smoke test
1. **PWA home → Session History:** All / Active / Past. If none exists, the empty state should display. Check backup, resume and delete of disposable test sessions.
2. **New Session:** Americano and Mexicano. Check Game Date **and Game Time**; verify time remains on dashboard after registration.
3. **Scoring:** Enter, confirm and edit a score. Finish Stage 1 without KO. #1 should be Champion, #2 Runner-Up.
4. **Knockout:** In a separate sample, complete KO and confirm Champion + Runner-Up follow bracket outcome.
5. **Menu & Settings:** Restore Backup JSON should appear under Session Management, not duplicated beneath Initial Setup. Restore a disposable backup and verify confirmed scores survive.
6. **Export PDF:** Check date and time, leaderboard and match list.
7. **Share Results:** Publish with the organizer PIN only on a correctly configured staging site. Scroll vertically on iPad Safari and iPhone Safari; the venue background must stay fixed and the leaderboard/KO bracket must remain readable and scrollable.
8. **WhatsApp:** Share a generated /u/ link and inspect the compact preview, title and approved image.
9. **PWA offline/online:** Ensure saved local matches survive switching modes, reload and reconnection.

**Do not merge PR #3 until all device and hosted publication checks pass.**

## Phase 5.7.4 — Dynamic WhatsApp Top 5 acceptance

**Dev preview:** https://deploy-preview-3--padel5ive.netlify.app (PR #3, never production).

### New tests
1. Publish a sample Americano session with at least six fixed pairs and several confirmed Stage 1 scores. The public `/u/{id}` page must continue to show the original full interactive standings and matches. **The WhatsApp image must contain exactly the top five**, in the official Wins → DIFF → Points order; no Registered Pairs list.
2. Verify a **live session** says `LIVE STANDINGS`, not Final. After finishing without KO, its Top 5 heading becomes `FINAL LEADERBOARD`.
3. Publish a **completed KO session**. The graphic must headline the actual KO **Champion and Runner-Up**, and label ranking below `STAGE 1 TOP 5` (KO winner is not necessarily Stage 1 rank #1).
4. Recheck **Mexicano** and **Individual/Flexible** results: same Top 5 ranking semantics, with one name per player rather than two-name fixed pairs.
5. Inspect the image URL from public HTML metadata. `og:image` must be a per-session absolute HTTPS URL such as `/social/u/{id}.png?v=1`. The response must be `image/png` and contain a **1200 × 630** PNG. The card shows session name, game mode, pairing, date/time, quiet dark-navy style, and subtle 5 watermark.
6. Update scores and **publish again** on the same link. The image URL's `v` parameter must increase, and the image must show the new leaderboard. Be aware that WhatsApp may keep its own cached preview for an already shared URL; **test a newly published link** if the WhatsApp client has stale metadata.
7. Open the actual shared link in Safari to ensure page scroll and interactive bracket still work; the fixed wallpaper must not move with the page. The dynamic server-rendered metadata must not replace the working browser viewer.
8. Test **legacy public links** after production deployment. Links that predate Phase 5.7.4 and have no stored preview must continue to show published results with the previous static branded OG cover.
9. **Storage safety:** data published from a Deploy Preview must live in an isolated QA store, never the production results store. A test result published on the preview should not appear on the production hostname. Existing production links must remain readable on production.
10. **PWA:** the renderer is precached for offline app UI, but dynamic social image URLs and published public result pages must never be served from the PWA's cached assets.

### Acceptance boundary
GitHub Actions validates the full source transform, standings, format permutations, PNG Canvas rendering contract, dynamic route wiring, storage isolation, and PWA cache rules. **Device Safari + real Netlify Functions + actual WhatsApp crawler tests are still mandatory** before the production merge.

