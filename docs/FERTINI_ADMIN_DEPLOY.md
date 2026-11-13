# FERTINI administrator — live cPanel deployment checklist

This is the current deployment guide; earlier serverless-object-storage plans
are obsolete for this independent host.

- Runtime: Next.js 16 standalone, Node.js 24, cPanel `fertiniperfume.com`.
- Code: GitHub repository `danialshams/perfume-shop` branch `main`.
- Database: local PostgreSQL through `DATABASE_URL`.
- Media: local durable folder `LOCAL_MEDIA_STORAGE_DIR` outside
  `/home/fertinip/fertini-runtime`.
- Auth: administrative bootstrap token should be removed after first admin.
  Never enable `TEMP_PUBLIC_ADMIN_EDIT=1` on the live site.
- Uploaded assets: images (5 MiB) and product voice (20 MiB), validated by
  MIME and magic bytes. Stored and served by the host itself.
- Automated delivery: GitHub Actions builds standalone and optionally
  publishes a checksummed GitHub Release; cPanel Cron can pull and install it after one-time quota and restart verification.
- Always verify the deployment revision, media uploads, admin login, product
  CRUD and homepage content after a release.
- Never rerun Next.js production builds on the 2 GiB host.
- Payment gateway, real sales notifications and checkout readiness require
  independent end-to-end verification.

Read `docs/FERTINI_CPANEL_LOCAL_MEDIA.md` and
`docs/FERTINI_CPANEL_CRON_AUTODEPLOY.md` for exact steps.
