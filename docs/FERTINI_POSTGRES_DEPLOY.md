# FERTINI — PostgreSQL and host deployment

Production database: PostgreSQL on the user's own Iranian cPanel host.
Database: `fertinip_fertini_db`. Runtime accesses it via
`DATABASE_URL` using postgres.js; no managed hosted database is required.
Never commit connection passwords or JWT secrets.

The initial schema is `database/postgres/schema.sql`. The existing
database must NOT be dropped, reset or reseeded in production.
Read-only checks: `npm run db:verify` (when running against an isolated
development environment) or the protected admin health endpoint.

Production media: `LOCAL_MEDIA_STORAGE_DIR` pointing outside the
replaceable standalone bundle (recommended:
`/home/fertinip/fertini-media`). Image and audio bytes are served via
`/api/v1/media`; PostgreSQL stores their URLs. All media is on-host.

The 2 GiB cPanel host cannot reliably compile the Next.js app.
GitHub Actions compiles the standalone artifact using Node.js 24.
The host can fetch the published release over HTTPS using cPanel Cron Jobs without inbound SSH.
For safe opt-in automatic deployment, see
`docs/FERTINI_CPANEL_CRON_AUTODEPLOY.md`.

Before live sales, verify authenticated product editing, image/audio uploads,
homepage updates, inventory, orders, backups and the payment gateway.
No gateway should be considered live merely because the site renders.
