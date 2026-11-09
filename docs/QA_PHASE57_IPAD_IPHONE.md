# PADEL 5IVE — Phase 5.7 Acceptance Test (iPad / iPhone)

**Environment:** Netlify Deploy Preview for draft PR #3, not production `main`.

## Open
1. In Netlify, select the existing **padel5ive** site.
2. Go to **Deploys → Deploy Previews**, open the preview for GitHub **PR #3**, and tap its preview URL.
3. If no preview is shown, stop: do not test `padel5ive.netlify.app` (production) or the previous v5.6.6 preview.

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
