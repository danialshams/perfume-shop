# FERTINI — local media storage on cPanel

On the independent Iranian Node.js host, all *newly uploaded* photos and
product audio are stored on the same host. External object-storage services
are not used.

## One-time host configuration

1. Use cPanel Terminal:
   `mkdir -p /home/fertinip/fertini-media`
   `chmod 700 /home/fertinip/fertini-media`
2. Set Node.js app environment variable:
   `LOCAL_MEDIA_STORAGE_DIR=/home/fertinip/fertini-media`
3. Keep `NODE_ENV=production`, `TEMP_PUBLIC_ADMIN_EDIT=0`,
   `HOSTNAME=0.0.0.0` (typed without hidden whitespace) and cPanel-managed `PORT`.
4. Restart the cPanel Node.js application once so it reads the new variable.
5. Deploy the updated standalone bundle. Upload a small JPG from the
   authenticated admin form and verify its URL and homepage visibility.

## Storage policy and limits

- Do **not** place media inside `fertini-runtime` or `public_html`.
- The folder survives replacement of the application release.
- Media URLs are `/api/v1/media/products/<uuid>.jpg` or
  `/api/v1/media/products/voices/<uuid>.mp3`.
- Maximum image 5 MiB; voice 20 MiB; actual file signatures and
  extensions are verified before writing.
- Upload endpoints require a signed-in administrator; public reads are
  restricted to controlled UUID names.
- PostgreSQL stores references/metadata; the actual media bytes stay on disk.
- Back up **both** PostgreSQL and `/home/fertinip/fertini-media` regularly.
- The 2 GiB hosting disk quota includes media, runtime and backups.
- Original checked-in `public/` editorial/static images remain in the
  installed GitHub-built runtime; they are also served by this host.

## Automatic deployment

See `docs/FERTINI_CPANEL_CRON_AUTODEPLOY.md`. The optional HTTPS Cron deployment is disabled until account quota, on-host media storage, and the cPanel application restart method are verified.
