# PADEL 5IVE Unified — Phase 5.4.13.1 / Production Navigation Hotfix

## Fixed
- `Home` on Unified and Team Showdown navigates to `/` normally.
- `Change mode` on Unified navigates to `/#setup`, automatically opening the mode picker.
- Removed leftover offline-preview click interception (`preventDefault` + `parent.postMessage`) from the two production route HTML files. There is no message listener on the hosted top-level page.
- No changes to tournament engines, scoring, layout, Netlify functions, storage, or portal.

## iPad update through GitHub Codespaces
1. In your GitHub repo, upload `PADEL5IVE_V54131_NAVIGATION_ONLY_HOTFIX.zip` to the repository root.
2. Open Codespaces Terminal on the repo root.
3. Run:

```sh
unzip -o PADEL5IVE_V54131_NAVIGATION_ONLY_HOTFIX.zip
rm PADEL5IVE_V54131_NAVIGATION_ONLY_HOTFIX.zip
node scripts/verify-deploy.mjs
git add -A
git commit -m "Fix Home and Change mode navigation v5.4.13.1"
git push origin main
```

4. Netlify deploys if it is connected to the GitHub repo. Refresh Safari when deploy is Published; test both buttons from a dummy session.

## Scope
`public/modes/unified/index.html`, `public/modes/club-match/index.html`, `SOURCE_MANIFEST.json`. Root index and all backend source retained.
