# PADEL 5IVE — PR #36 · Match Quality & UI Integrity (REVIEW ONLY)

Base: PR #35, `main` commit `4418ea2`. Do not merge or deploy to production until reviewed.

## Included

1. **One persistent Availability state** for Americano/Mexicano across Fixed Partner, Flexible/Individual and Structured. NOT ARRIVED and SIT OUT stay ineligible until organizer Arrived/Return; navigation or reshuffle cannot silently activate. Coach priority while active; fixed-pair availability requires both members; confirmed history never rewrites.
2. **Contextual Manage Player** — NOT ARRIVED → Arrived, ACTIVE → Sit Out, SIT OUT → Return. No extra panel.
3. **Pre-Match Arrival & Reshuffle** — open on new session, everybody initially Arrived; reshuffling stays open and updates only unconfirmed fixtures.
4. **Round Court Scoring** — existing shared UI, full-width vertical cards, clearer iPad landscape/iPhone.
5. **Resting / Next On Court** — quiet-luxury alignment, split Unavailable from Resting.
6. **Score Entry** — native modal, two side-by-side numerical dropdowns; editing either side computes the opponent's final-games score. Supports Total of 4/5/6 and First to 4/5/6; no tiebreak points entry. Confirm & Save/Edit Score unchanged.
7. **Court Utilization** — when court count changes, rebuild eligible, future *unscored* Americano schedule with current court capacity (instead of merely repacking old 2-court fixtures). No duplicate participants; preserve confirmed rounds, Coach and availability, and scheduling constraints. Court remains idle when no legally valid fixture exists or a protected future scoring round blocks rearrangement.
8. **No Club Match changes**, no Home, Cloud service, KO, reporting, or locked native schedulers rewrite beyond the targeted integration.

## Release/QA method

Existing `npm run build` phase transformations run unchanged. A dedicated fail-closed `scripts/pr36-integrate.cjs` then applies a narrow patch to the built Unified dashboard. If upstream source differs, build **fails** rather than quietly replacing the source with an older HTML. Extra `qa-pr36.cjs` and CI workflow verify package and existing cross-mode tests. Review deploy preview before merge.

## Already exercised locally on the PR35-based QA source

- 16 players, 1 Coach, 2→3 courts, late Arrival, Sit Out/Return, round progression.
- 3 courts filled in early future rounds when 12 players eligible; previously confirmed R1 scores identical.
- Score entry from Side A or B, auto opposing score, Confirm/Edit for Total of 4/5 and First to 4/5/6.
- Availability across six current mode combinations (Americano/Mexicano × Fixed/Flexible/Structured).
- iPad landscape/iPhone Chromium visual checks.

**Not yet verified:** full production source merge, native Safari iPad/iPhone acceptance, multi-device Cloud, every possible late-arrival/court-change schedule, KO/PDF/share end-to-end. GitHub CI and Netlify preview checks are necessary. Do not claim live production is fixed until after approval and merge/deploy.