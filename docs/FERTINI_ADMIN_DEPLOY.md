# FERTINI admin — readiness and safe deployment (2026-11-06)

## What changed
The protected admin uses Essential 2's editorial navigation and mobile bottom bar, retaining FERTINI's legacy MySQL APIs for orders, products, images, variants, and per-product voice. Added read-only database diagnostics, homepage content editing, and customer, coupon, payment and review panels. Payment success records stay read-only: only a verified payment callback may settle orders.

## Staging prerequisites (not applied automatically)
1. Create an encrypted SQL backup of the actual MySQL/MariaDB database and archive all referenced product, category, slider and voice assets. Do NOT put customer data or password hashes in a public Git repository.
2. Restore into an isolated staging database. Inspect the legacy dump and compare the live tables. The current audit (`database/MAISON_DB_AUDIT.md`) identifies `categories_old`, `categories_backup`, parallel stock columns and duplicated foreign keys. Do not remove these without reference checks and verified restore.
3. Apply `database/migrations/001_products_publication_state.sql` only if needed, inspect the result, then apply `database/migrations/002_storefront_content.sql` to enable the homepage editor. Also apply the additive `database/migrations/003_admin_notifications.sql` on an isolated staging database; verify before any production change.
4. Configure valid `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` and `DB_NAME` for Vercel Preview and Production. The safe read-only checker at `/admin/database` requires an ADMIN session. Environment variable names being present does not prove connection or credentials work.
5. Review product, customer, coupon, payment, review and order workflows on sanitized staging data before changing any production records.

## Durable images and voice
Vercel Functions have a 4.5 MB request-body limit, so 5 MB images and 20 MB voice **must** use client-side direct-to-storage uploads. Set:

```env
S3_ENDPOINT=https://your-storage-api.example
S3_BUCKET=private-or-public-media-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_BASE_URL=https://your-public-media-cdn.example
```

Create the bucket and set CORS to permit authenticated site origins to issue PUT with `Content-Type`; allow the S3 API to GET objects from the backend for verification. A public media/CDN URL must serve the **validated** objects for storefront playback. Never expose S3 keys in `NEXT_PUBLIC_*`.

Flow: admin-only start request -> short-lived signed PUT -> browser sends file directly to S3 -> admin-only complete request -> backend fetches object and verifies exact bytes/size/MIME -> product form stores the returned URL. Failed verifications are not written to product records. Set up cleanup of abandoned staging objects before live use.

Accepted images: JPEG, PNG, WebP (max 5 MiB). Audio: MP3, WAV, OGG, M4A, AAC, FLAC, WebM (max 20 MiB). Client and server both validate metadata; the backend verifies file signatures. Full audio decoding and transcoding are not implemented.

## Live notifications
The SSE endpoint checks durable MySQL notification records roughly every eight seconds; the client reconnects and also polls. This supports independent serverless instances but is **near-real-time**, not push-instant. Live order/payment-event E2E verification still requires a connected staging database.

## QA / release gate
The GitHub Action runs static checks, TypeScript, production build, browser screenshots (public and authenticated admin), upload boundary tests and authenticated HTTP guard tests. The branch is isolated from `main` until CI is green and its staging database/storage are operational.

## Known dependencies
- Direct S3 upload cannot be tested end-to-end until real S3 credentials, CORS and a public URL exist.
- MySQL mutations and cleanups cannot be validated live until the database is reachable with a staging dataset.
- The homepage curated lists currently operate on FERTINI's demo fragrance catalog; actual database products are managed in the product panel. Unifying both catalogs requires database-backed storefront migration.
- The visual content editor uses `storefront_content` and requires migration 002.

## Deployment blockers verified 2026-11-07
- Vercel Preview runtime reports `Missing environment variable: DB_HOST` on /api/v1/products and /api/v1/cart. Environment-variable **names** appear in Vercel settings; this does **not** mean their **values** are populated in the deployment. Configure real MySQL/MariaDB host, port, database, username and password in the correct Vercel project environments, then **redeploy**. Never commit credentials to GitHub or enter private secrets in client-side NEXT_PUBLIC variables.
- This codebase uses MySQL, **not** Postgres. No real database migration or connection test has been performed, so do not claim products/orders are live until /admin/database and CRUD E2E tests pass with authenticated administrator and staging data.
- No S3_* variables are configured on this Vercel project. Product photos and per-product audio are already attached through the create/edit product forms, but uploading to a serverless Vercel deployment requires durable S3-compatible storage. Set all S3 variables, bucket CORS and a public HTTPS media URL, then repeat upload and read-back tests.
- The bell is displayed in anonymous branch preview but cannot expose customer order details without admin login. An authenticated admin gets SSE/polling with records persisted in MySQL. New-order notifications are inserted transactionally alongside orders from **both** checkoutService and orderService.
- IMPORTANT: the existing `server/services/payment.service.ts` is a sandbox simulator that intentionally rejects Vercel/production. Even with a connected DB, **live checkout cannot operate until a real payment provider is integrated and verified**. Do not present staging order events as tested live transactions.
- The Brands and standalone Media admin navigation entries have been removed; the media URL redirects to /admin/products. No existing brand table or API data has been deleted.

## Database schema divergence
The checked-in `database/schema.sql` lacks `admin_notifications`, so migration 003 adds the table safely. The legacy `orders` table uses `user_id` and does not have `customer_id`, `cart_id`, or `shipping_floor`, which the current checkout repository expects. Simply setting DB credentials will **not** fix schema mismatches. Inspect the actual production schema, prepare a backup, reconcile the checkout schema in staging, and test orders end-to-end. Never run the legacy `database/schema.sql` against live data: it includes destructive DROP TABLE statements.

## MySQL connection hardening and release gate (2026-11-07)
- The legacy module `server/db/mysql.ts` used to instantiate a separate pool eagerly and could contaminate the shared `__mysqlPool`. It now re-exports the single lazy pool from `lib/db.ts`. No code changes can make an unprovisioned external MySQL server reachable.
- Put **real** MySQL credentials in Vercel Environment Variables: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`. For managed TLS MySQL, set `DB_SSL_MODE=required` and optionally `DB_SSL_CA` for a custom CA. Never use localhost as DB_HOST on Vercel.
- Vercel project settings currently contain variable **names**, but production/preview runtime logs show `DB_HOST` is missing. There is no attached MySQL resource; a remote database must be provisioned or its existing host provided. Do not invent values, do not connect to the user's local DB, and do not merge to main until a real DB health check passes.
- After creating/connecting an isolated MySQL staging database, check `/admin/database` with a real authenticated admin session. Reconcile `customers`/`customer_addresses` versus `users`/`user_addresses`, the missing `orders` columns, and migration 003. Then test admin product create/read/edit/delete and order creation/notifications with transactional rollback on failures.
- Release condition: valid Vercel Preview credentials, successful authenticated MySQL health and schema checks, durable media storage, seeded test account, and successful E2E tests. A green build alone **does not satisfy** this gate.
