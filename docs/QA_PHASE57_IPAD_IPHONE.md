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
