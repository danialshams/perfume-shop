# Fertini: automatic GitHub → cPanel deployment using outbound HTTPS Cron

No inbound SSH, VPN, S3, cPanel root access or on-host Next.js build is required.

## Pipeline

1. A commit lands on the repository's main branch.
2. GitHub Actions validates the code and builds a Node.js 24 Next.js standalone runtime.
3. A second Actions job publishes an **immutable GitHub Release** named
   fertini-cpanel-<40-character commit SHA> with:
   - fertini-runtime.tar.gz (host-ready runtime)
   - fertini-runtime.sha256 (checksum)
4. Cron runs on the host, fetches the latest GitHub release metadata over HTTPS,
   and checks whether that SHA differs from the already deployed SHA.
5. Only when enabled and a new release exists, it downloads both release assets,
   checks SHA-256, and extracts to a staging directory.
6. It renames the old runtime to ~/.fertini-runtime.previous, promotes the new
   one to ~/fertini-runtime, restarts the matching PM2 app by numeric ID,
   and checks the public /api/v1/deployment endpoint for the exact new SHA.
7. Failure triggers automatic rollback to the previous runtime and blocks
   retrying the failed SHA on the next Cron invocation.

IMPORTANT: Nothing is installed on the live host merely by merging code.
The host will ignore releases until the opt-in file exists.

## Checks before enabling (required)

- cPanel Disk Usage: verify *account quota*, NOT just df -h filesystem totals.
  The runtime is about 350 MB unpacked and 250+ MB compressed; staging,
  rollback copy, other site files, database, and photos also take disk space.
  Large media libraries can exhaust small cPanel quotas.
- The domain is routed by Apache .htaccess to http://127.0.0.1:56757/.
  On this host the Next.js process is controlled by PM2 7.1.2 under nvm
  Node 24.22.1, not by CloudLinux Node.js Selector or Passenger.
- The PM2 process must have pm_cwd exactly /home/fertinip/fertini-runtime
  or pm_exec_path exactly /home/fertinip/fertini-runtime/server.js.
  The script refuses to deploy if it cannot identify exactly one matching
  ONLINE PM2 process. Use 'pm2 ls' and 'pm2 describe <id>' to verify.
- Configure local Node application environment:
  LOCAL_MEDIA_STORAGE_DIR=/home/fertinip/fertini-media
  NODE_ENV=production
  HOSTNAME=0.0.0.0
  TEMP_PUBLIC_ADMIN_EDIT=0
  DATABASE_URL and JWT secrets: existing private cPanel environment variables.
  Never commit any of these to GitHub.
- Test a controlled 'pm2 restart <specific-app-id>' BEFORE enabling Cron.
  Never run 'pm2 restart all' and do not use the CloudLinux selector here.
  PM2 restart retains the existing private process environment.
- Verify outbound access to GitHub's release asset download domains as well
  as api.github.com, and check one published release file checksum manually.
- Back up the entire PostgreSQL database and
  /home/fertinip/fertini-media independently.

## One-time install in cPanel Terminal

Run only AFTER checking the requirements. The script itself is not enabled yet.

    curl -fL --retry 2 --max-time 30 \
      https://raw.githubusercontent.com/danialshams/perfume-shop/main/scripts/cpanel-pull-deploy.sh \
      -o /home/fertinip/fertini-pull-deploy.sh
    chmod 700 /home/fertinip/fertini-pull-deploy.sh
    bash -n /home/fertinip/fertini-pull-deploy.sh

In cPanel Cron Jobs (all times are server-local), use every 10 minutes:

    Minute: */10
    Hour: *
    Day: *
    Month: *
    Weekday: *
    Command: /bin/bash /home/fertinip/fertini-pull-deploy.sh >> /home/fertinip/fertini-pull-deploy.log 2>&1

The command does nothing until you intentionally enable it:

    touch /home/fertinip/.fertini-pull-enabled

To disable future automatic deploys immediately:

    rm -f /home/fertinip/.fertini-pull-enabled

To inspect the last release and errors:

    cat /home/fertinip/.fertini-pull-state
    tail -n 50 /home/fertinip/fertini-pull-deploy.log

If a release is rolled back, the failed SHA is written to
~/.fertini-pull-blocked so that Cron does not repeatedly break the live site.
Do not clear that file unless the failure was diagnosed.

## Notes

- GitHub Releases are **public**, because the source repository is public.
  GitHub's release artifact includes code and public assets, but does not
  include cPanel secrets, private database rows, or newly uploaded media.
- A checksum protects against corrupted downloads; it is not a substitute for
  trusting the GitHub repository/release publisher.
- Local photographs are under ~/fertini-media, outside runtime; they remain
  in place when releases are promoted or rolled back.
- This hosting account uses PM2; touching tmp/restart.txt is NOT sufficient.
  Automatic deployment restarts only the PM2 process verified for this runtime.
- An unsuccessful deployment can temporarily disrupt the site. Keep a recent
  database/media backup and test a controlled change first.
- No changes to the production database schema are applied by this Cron script.
