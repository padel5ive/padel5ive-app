# PADEL 5IVE — Unified release (2026-11-12)

Single release integrating the following reviewed improvements:

- **PR #38 · Club Match PDF:** additional breathing room beneath two-line session titles; ten matches per PDF history page in all stages.
- **PR #39 · Cloud View Only:** manual round selection survives moderator score sync and browser reload; automatic follow resumes when selecting Latest.
- **PR #40 · Structured Americano:** when late players explicitly return from Sit Out, the last unscored round may fill an otherwise unused eligible court without altering confirmed history. Round-1 Arrival & Reshuffle by itself does not keep players unavailable through later rounds.

## Integration safety

All three fixes were first merged on the isolated release branch. The combined `package.json` runs both `cloud-viewer-round-retention-integrate.cjs` and `structured-late-return-integrate.cjs` after the protected PR36 patches, before deployment verification. No locked source engine files or existing Cloud API endpoints were replaced.

Individual checks passed: PR #38 (15/15), PR #39 (29/29), PR #40 (24/24).

Merge into `main` only after combined release QA. GitHub main deployment does not by itself attest the live Netlify production URL.
