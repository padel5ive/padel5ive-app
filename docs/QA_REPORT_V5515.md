# PADEL 5IVE v5.5.15 — Fairness and Reporting QA

- Individual Americano: 6/1, 18/3, 24/4, 30/5 full 3-round fairness cycles plus retained certified 12/2 baseline; 80 seed scenarios passed via `scripts/qa-v5515.cjs`.
- 18/3: 26 rounds, 77 matches, 153 unique partnerships and exactly one unavoidable repeat.
- 24/4: 35 rounds, 138 matches, all 276 partnerships used exactly once.
- Every ideal configuration: G gap <=1 after every round, G gap=0 after completed 3-round blocks, and no player double-booked within a round.
- Team Showdown public results: iPhone/iPad Chromium mock results passed, stage 1/2/3 wins and games shown, no cropped champion photograph.
- Unified and Team Showdown: moderator publishing PIN values displayed as authorized; backend validation unchanged.
- All other engines, historical fixtures, Netlify Functions and direct PDF generator untouched.
- Real Netlify publishing, PIN values and native iPad Safari require smoke verification.
