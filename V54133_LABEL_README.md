# PADEL 5IVE · Share Button Label Refined (v5.4.13.3)

Team Showdown → Menu & Settings → Share & Export:

- Previously: `Share Final Result Link (PIN : 55555555)`
- Approved: **`Share Final Results Link · PIN 55555555`**

Only the visible button label was modified. The ID, disabled/enabled behavior, click handler, Netlify backend, Unified Americano/Mexicano, and all scoring engines are unchanged.

**Note:** The PIN shown is public display text, not a configuration change. For security, publishing secrets should not be displayed to site visitors. The real Team Showdown publishing PIN is configured through Netlify environment variable `PADEL5IVE_SHOWDOWN_SHARE_PIN`. 

## Update with iPad GitHub Codespaces

1. Upload `PADEL5IVE_V54133_REFINED_LABEL_HOTFIX.zip` to your existing GitHub repository root.
2. Open the same repository in Codespaces → Terminal and run:

```bash
unzip -o PADEL5IVE_V54133_REFINED_LABEL_HOTFIX.zip
rm PADEL5IVE_V54133_REFINED_LABEL_HOTFIX.zip
npm run build
git add -A
git commit -m "Refine Team Showdown share label"
git push origin main
```

3. Let the existing Netlify Git connection deploy. Reload the app after the deploy reads **Published**.

Do not unzip both the hotfix and full package together.
