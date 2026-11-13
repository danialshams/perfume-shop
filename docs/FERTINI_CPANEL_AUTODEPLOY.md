# FERTINI — automatic GitHub Actions → cPanel deployment

The build never runs on the 2 GiB cPanel host. GitHub Actions creates
a Next.js 16 standalone Node.js 24 runtime artifact on each push to main.
An **opt-in** second workflow will upload the new artifact using SSH,
promote it into the fixed cPanel app path, retain the previous runtime
for rollback, and verify the public deployment SHA.

**This pipeline is intentionally OFF until SSH access, the host-key
fingerprint and the hosting provider's restart mechanism are verified.**
Do not enable before those requirements are met.

## One-time requirements

- SSH must be reachable from GitHub-hosted runners; cPanel's browser
  Terminal by itself does NOT prove inbound SSH is enabled.
- cPanel account: `fertinip`. Current root directory:
  `/home/fertinip/fertini-runtime`.
- Environment variables stay in cPanel, NEVER in GitHub or build artifacts:
  `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
  `LOCAL_MEDIA_STORAGE_DIR=/home/fertinip/fertini-media`,
  `NODE_ENV=production`, `TEMP_PUBLIC_ADMIN_EDIT=0`,
  `HOSTNAME=0.0.0.0`, plus cPanel-provided `PORT`.
- The media directory `/home/fertinip/fertini-media` must remain outside
  runtime releases and must be backed up independently.

## SSH access setup

1. Ask the host which SSH host/port is publicly reachable and whether
   `tmp/restart.txt` actually restarts the **NodeJs Applications** module
   installed on this cPanel account. Some hosts run a custom process
   manager rather than Passenger; these are not interchangeable.
2. Create a dedicated Ed25519 SSH deploy key pair on your own computer.
   Register only its **public** key in cPanel's SSH Access → Authorized Keys
   for `fertinip`. No shell root account and no password authentication.
3. Confirm the SSH server's Ed25519 host-key fingerprint with the hosting
   provider. The complete verified `known_hosts` line is a GitHub Secret.
   Never accept an unverified SSH host key.
4. Under repository Settings → Secrets and variables → Actions, add:
   - **Variables**:
     `CPANEL_SSH_HOST` = provider-confirmed SSH hostname
     `CPANEL_SSH_USER` = `fertinip`
     `CPANEL_SSH_PORT` = provider-confirmed SSH port (normally 22)
   - **Secrets**:
     `CPANEL_SSH_PRIVATE_KEY` = full private key (including BEGIN/END lines)
     `CPANEL_SSH_KNOWN_HOSTS` = verified known_hosts line
5. Verify the server's restart behavior. Standard Passenger accepts
   `mkdir -p ~/fertini-runtime/tmp && touch ~/fertini-runtime/tmp/restart.txt`;
   the host's custom Node.js manager may not. GitHub checks the served
   SHA and rolls back the release if the new version isn't actually running.
   Confirm any different restart hook with the provider first.
6. Only after the test succeeds add repository **Variable**
   `CPANEL_AUTO_DEPLOY=true`. If missing or false, builds still run but
   no live files are changed.

## Release behavior

- Push/merge to main → `cpanel-standalone.yml` builds, typechecks and
  tests the portable release → artifact published.
- `cpanel-auto-deploy.yml` watches for that successful main push run.
- Download artifact and upload over pinned-host-key SSH, no repo secrets.
- Unpack into a temporary staging directory, require `server.js`
  and `.next/BUILD_ID`.
- Rename the existing live runtime to `~/.fertini-runtime.previous`,
  promote new runtime at the **same** `~/fertini-runtime` path;
  do not touch PostgreSQL or `~/fertini-media`.
- Trigger the documented cPanel restart marker and poll
  `https://fertiniperfume.com/api/v1/deployment` for the exact SHA.
- If the public revision does not match, restore the previous runtime and
  mark the GitHub workflow as failed.

## Important limitations

- The provider must accept GitHub runner SSH traffic and support a remote
  restart mechanism. If not, GitHub can still prepare artifacts, but
  automatic live updates require a provider-approved alternative.
- Switching releases briefly interrupts requests; this is a safe
  small-site deploy, not a zero-downtime cluster.
- Keep backups of media and PostgreSQL independently. Rollback changes
  code, not database contents.
- Monitor disk usage: staging archives, releases and media all count
  against the 2 GiB cPanel storage limit.
- Do not store passwords, DB URLs or upload assets in the GitHub repository.
- Always verify a real admin image/voice upload after first deployment.
