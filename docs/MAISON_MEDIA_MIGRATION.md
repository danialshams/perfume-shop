# MAISON: safe product photo migration

The cinematic storefront's six editorial images are already hosted under `public/maison/`. **Do not confuse those editorial photographs with product media.** Product, variant, brand and category images are referenced in MySQL and may be needed by existing orders, catalog pages and the admin interface.

## Audit before deleting a photo

Run `node scripts/audit-media-references.mjs` for a local asset inventory. Then, using a database account with **SELECT-only** privileges, pass the usual `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` and `APP_URL` variables and run `node scripts/audit-media-references.mjs --with-db`.

The script only reads the database and disk. It lists broken local media references and **possible** unreferenced assets. Its output is an audit, **not permission to delete**, because server-side records and clients may reference paths outside those six columns.

For each real product, establish a verified replacement image (and image-use rights), retain the product/variant ID mapping, store replacement files, and update affected rows in a transaction after taking a database backup. Test product cards, variants, order histories, search and admin image editors against that backed-up dataset. Only after completing those tests should a second, independently verified cleanup remove stale files in a reversible commit.

## Release status

The visual experiment is isolated on `feature/quiet-luxury-cinematic-v2-20261105`; the original source remains on `main` and on `backup/before-quiet-luxury-20261105`. Do not merge or deploy to production solely on the basis of screenshot and build checks: they cannot simulate live database content, checkout, shipping or payments. Verify final photography on real mobile/desktop devices and confirm production deployment health before closing the review.
