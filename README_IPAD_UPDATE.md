# PADEL 5IVE — Update Existing GitHub / Netlify from iPad

Use the existing repo `padel5ive/padel5ive-app` and Netlify site `padel5ive.netlify.app`. Do **not** delete the site, create a new repo, or upload the standalone HTML preview.

1. Download `PADEL5IVE_UNIFIED_V5.4.13.1_BUTTON_QA_CHECKED_IPAD_DEPLOY.zip` to the iPad Files app. Leave ZIP compressed.
2. In GitHub Safari open your existing `padel5ive-app` repository. Choose **Add file → Upload files**, select the ZIP and **Commit changes**.
3. In GitHub choose **Code → Codespaces** and open a Codespace for `main`.
4. In the Codespaces terminal in repository root execute:

```bash
unzip -o PADEL5IVE_UNIFIED_V5.4.13.1_BUTTON_QA_CHECKED_IPAD_DEPLOY.zip
rm PADEL5IVE_UNIFIED_V5.4.13.1_BUTTON_QA_CHECKED_IPAD_DEPLOY.zip
npm run build
git add -A
git commit -m "QA-verified Unified v5.4.13.1 navigation hotfix"
git push origin main
```

5. Open Netlify → existing `padel5ive.netlify.app` → **Deploys**. Wait for a **Published** deploy of the new Git commit.
6. Open Safari in a private tab to avoid old cached content: open Home, choose Americano or Mexicano, tap **Change mode**, tap **PADEL 5IVE / HOME**, test Team Showdown Home, then run a dummy session and test Share Results, PDF, Backup/Restore.
7. Confirm `PADEL5IVE_UNIFIED_SHARE_PIN` and `PADEL5IVE_SHOWDOWN_SHARE_PIN` are configured in Netlify environment variables (keep actual PIN values secret). Netlify Functions need to deploy for public links to work.

If the new deploy fails, open Netlify **Deploys** and re-publish the previous successful deploy. Do not delete source backups.

Important: browser-local session data is NOT included in source ZIP. Export any live tournament JSON before replacing the site.
