# PADEL 5IVE · v5.4.13.7 — Share Restoration + Native PDF QA

**QA date:** 8 Nov 2026. **Status:** UAT candidate, not production-verified.

## Source provenance

- Base development: Unified v5.4.13.6.
- Public visual source: Fixed Partner Americano Master v4.8.92.23, original public result stylesheet, exact Photo Edition WebP assets, and KO wiring adapted for Unified modes.
- Club Match master v0.8.48 renderer remains in existing mode; only share menu label/CSS adjusted in Unified project.
- No changes to court rotation, match scheduler, score rules or locked source ZIP files.

## Tests executed

| Test category | Actual result |
| --- | --- |
| Netlify project `npm run build` | PASS: 10 required source files |
| Browser dashboard click (Americano/Mexicano, 390/1024) | 4/4 PASS: setup/registration/scoring, PDF download, Share dialog |
| Public interactive renderer 6 pairing/mode combinations × mobile/iPad | 12/12 PASS: leaderboard, round history, analysis selection; no JS errors or x-overflow |
| Public interactive personal analysis and expand rounds | PASS at 390px and 1024px |
| Real Unified KO engine fixture | PASS: 2 actual confirmed KO matches, 3 SVG connected paths, clickable selection, champion identity correct |
| Direct PDF actual file (6 modes) | PASS: parseable PDF and all pages 841.89×595.28 pt / A4 Landscape |
| Multi-page PDF containing KO | PASS: 8 pages in synthetic 8-player double-elimination fixture, all landscape |
| Backend API mocked Netlify functions | 12/12 PASS: publish/read/PUT same ID/wrong PIN/unauthorized/conflict/invalid KO/revoke/legacy compatibility |
| Existing `results.mjs` backend | Byte-identical to prior build |
| `public/index.html` and OG cover | Byte-identical to prior build |

## Incomplete checks (cannot claim PASS yet)

- Real Netlify Functions + persistent Blob store across devices and deploys.
- WhatsApp deep-link target/share sheet on actual iPad and iPhone.
- iPadOS `navigator.canShare({files})` Save to Files, especially in Home Screen PWA vs Safari.
- Browser restoring large historical tournament with partial KO/cancelled stages.
- Pixel-by-pixel parity with both old master viewers. Visual style is master-derived, but data architecture differs for Flexible/Structured.
- Team Showdown direct PDF export (original printing workflow unchanged, intentional).
- Larger 15-pair Double KO graph stress UAT and downstream full application regression Phase 5.4.14.

## Test notes

- Chromium local test runner cannot navigate localhost/file URLs; tested HTML through `set_content` with mocked fetch and production CSS/JS plus actual Unified engine fixture.
- Netlify backend tests call the genuine Functions handler under simulated `@netlify/blobs` storage; production network/secret environment still requires UAT.
- Sample screenshots and preview are QA artifacts, not deployment data.
