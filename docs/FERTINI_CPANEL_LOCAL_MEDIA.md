# FERTINI — media on a low-disk cPanel Node.js host

The production app normally uses S3-compatible object storage. For an
independently hosted, single-node cPanel deployment, an alternative is supported
without an S3 purchase: **opt-in persistent local disk**.

## Setup

1. Stop Fertini in cPanel's Node.js Applications.
2. Create a directory **outside** the replaceable standalone runtime and outside
   public_html. Example:
   mkdir -p /home/fertinip/fertini-media
   chmod 750 /home/fertinip/fertini-media
3. Add cPanel Node application environment variable:
   LOCAL_MEDIA_STORAGE_DIR=/home/fertinip/fertini-media
   Keep NODE_ENV=production and TEMP_PUBLIC_ADMIN_EDIT=0.
4. Deploy a fresh standalone build made from this commit. The previous runtime
   cannot use local media. Restart the Node application after deployment.
5. Sign in as administrator, upload one small JPEG and one voice file, confirm
   the API response and public media URL, then save the product/homepage content.
6. Verify a media URL survives a Node process restart.

Accepted formats: JPEG/PNG/WebP (5 MiB max); MP3/WAV/OGG/M4A/AAC/FLAC/WEBM
voice (20 MiB max). The same image/audio signatures are checked in both
production and development. All writes are authenticated and randomized by UUID.
Public media reads accept only the exact controlled key structure.

URL format: /api/v1/media/products/<uuid>.jpg and
/api/v1/media/products/voices/<uuid>.mp3.

The media directory **must not** live in /home/fertinip/fertini-runtime,
because deployment replaces the runtime bundle. Back up both PostgreSQL and
the local media folder. Deleting only one destroys references or the bytes.

## Deployment guidance

- Keep the live runtime untouched while staging a replacement build in a
  separate versioned directory; stop, switch Root directory, start and test,
  then remove the old runtime when validated.
- Never re-run npm ci or next build on the 2 GiB shared host.
- The host's disk limit includes user uploads; watch disk space and inode limits.
- For scaling to multiple servers, CDN, or large media libraries, migrate assets
  to S3-compatible storage and remove LOCAL_MEDIA_STORAGE_DIR. The runtime
  continues to prefer S3 if it is fully configured.
- Browser uploads use /api/v1/admin/media-upload/start; if local mode is enabled
  the authenticated /api/v1/uploads/products[voice] handler writes to durable disk.
  Without S3 or LOCAL_MEDIA_STORAGE_DIR production uploads respond with 503.
- Use cPanel-provided PORT and HOSTNAME=0.0.0.0 (without tabs/spaces) as needed
  for the proxy; keep the Node instance behind the HTTPS domain proxy.
- Uploads are public only after storing under the controlled media URL. Always
  remove or rotate exposed credentials before going live.
