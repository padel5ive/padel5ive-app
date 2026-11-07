# PADEL 5IVE — Deploy Unified v5.4.13 dari iPad

Target: gunakan website Netlify yang sudah ada **padel5ive.netlify.app**, **jangan hapus site**.

## 1. Download
Download `PADEL5IVE_UNIFIED_V5413_IPAD_GITHUB_DEPLOY.zip` di iPad (Files → Downloads). **Jangan diextract di iPad**; ZIP akan diextract di GitHub Codespaces.

## 2. Upload ZIP ke GitHub
1. Safari → github.com → login → repo `padel5ive-unified` (buat jika belum ada).
2. **Add file → Upload files** → Browse → Downloads → pilih ZIP.
3. **Commit changes** ke branch `main`. Jika menu tersembunyi di Safari, gunakan Request Desktop Website.

## 3. Unzip di Codespaces
1. Di repo GitHub tekan **Code → Codespaces → Create codespace on main** (atau buka codespace yang sudah ada).
2. VS Code → **Terminal → New Terminal**.
3. Jalankan perintah berikut di root repo:

```bash
unzip -o PADEL5IVE_UNIFIED_V5413_IPAD_GITHUB_DEPLOY.zip
rm PADEL5IVE_UNIFIED_V5413_IPAD_GITHUB_DEPLOY.zip
node scripts/verify-deploy.mjs
git add -A
git commit -m "PADEL 5IVE Unified v5.4.13 full deploy"
git push origin main
```

Akan muncul `netlify.toml`, `package.json`, `public/`, `netlify/functions/`, `scripts/`. Pastikan semua di **root repository**, bukan di subfolder.

Catatan: jika ada file lama `PADEL5IVE_SITE_PAYLOAD.zip` dan `README_IPHONE.md` dari metode sebelumnya, boleh hapus **hanya dua file tersebut** di Codespaces agar repo rapi. Jangan hapus folder source master tanpa backup.

## 4. Netlify — sebelum menghubungkan GitHub
1. Safari → app.netlify.com → pilih existing site `padel5ive.netlify.app`.
2. Backup/Export sesi browser lama jika ada yang perlu dipertahankan.
3. **Project configuration → Environment variables** → buat:
   - `PADEL5IVE_UNIFIED_SHARE_PIN` = PIN kuat khusus Unified.
   - `PADEL5IVE_SHOWDOWN_SHARE_PIN` = PIN kuat lain khusus Team Showdown.
   Tandai secret jika UI mendukung. **Jangan letakkan PIN di GitHub atau kirim ke chat.**

## 5. Sambungkan repo GitHub
Pada existing Netlify project, buka **Project configuration → Developer settings → Continuous deployment → Repository**:
- Jika belum tersambung: **Link repository**.
- Jika sudah tersambung repo lama: **Manage repository → Link to a different repository**.

Pilih GitHub repo `padel5ive-unified` branch `main`. Netlify akan otomatis build dan deploy ke website existing; ini **mengubah production** jika repo utama langsung dihubungkan. Konfigurasi otomatis dari `netlify.toml`:
- Build command `npm run build`
- Publish directory `public`
- Functions directory `netlify/functions`

## 6. Tes setelah deploy (Safari)
- `https://padel5ive.netlify.app/`: home.
- `https://padel5ive.netlify.app/modes/unified/`: Americano / Mexicano.
- `https://padel5ive.netlify.app/modes/club-match/`: Team Showdown.
- Pastikan di Deploys **Published**, functions `unified-results` + `results` tersedia.
- Buat sesi dummy, publish Share Results menggunakan PIN, buka link `/u/...` atau `/r/...` lewat browser lain, update dan pastikan ID link tetap sama.

Belum dianggap production-locked sampai live UAT terverifikasi. Backup source tiga engine disimpan terpisah; local browser session dan Netlify Blobs tidak otomatis tercakup dalam backup source.
