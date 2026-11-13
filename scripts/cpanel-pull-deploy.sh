#!/usr/bin/env bash
# Cron-safe inbound-SSH-free deployment of a public GitHub Release artifact.
# Opt-in: create ~/.fertini-pull-enabled only after quota and restart tests.
set -Eeuo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
umask 077

readonly home="$HOME"
# Cron runs with a minimal PATH, while PM2 is installed under the user’s nvm Node.
for bin in "$home"/.nvm/versions/node/v*/bin; do
  if [[ -x "$bin/pm2" && -x "$bin/node" ]]; then
    export PATH="$bin:$PATH"
    break
  fi
done
readonly live="$home/fertini-runtime"
readonly media="$home/fertini-media"
readonly state="$home/.fertini-pull-state"
readonly blocked="$home/.fertini-pull-blocked"
readonly enabled="$home/.fertini-pull-enabled"
readonly repo="danialshams/perfume-shop"
readonly origin="https://fertiniperfume.com"
readonly api="https://api.github.com/repos/$repo/releases/latest"
readonly lock="$home/.fertini-pull.lock"

# Never mutate anything until an operator explicitly opts in.
[[ -f "$enabled" ]] || exit 0
for bin in curl php tar sha256sum flock mktemp node pm2; do
  command -v "$bin" >/dev/null || { echo "Missing required command: $bin" >&2; exit 1; }
done
[[ -f "$live/server.js" ]] || { echo "Cannot locate current live runtime" >&2; exit 1; }
[[ -d "$media" ]] || { echo "Missing persistent media directory" >&2; exit 1; }
[[ ! -L "$live" && ! -L "$media" ]] || { echo "Unexpected runtime/media symlink" >&2; exit 1; }
exec 9>"$lock"
flock -n 9 || exit 0

# Only operate on the single ONLINE PM2 process rooted at the expected app path.
# Never print pm2 jlist (contains the application's private environment values).
pm_id="$(pm2 jlist | node -e '
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (part) => { input += part; });
process.stdin.on("end", () => {
  let apps;
  try { apps = JSON.parse(input); }
  catch { console.error("Unable to parse PM2 process list"); process.exit(1); }
  if (!Array.isArray(apps)) process.exit(1);
  const live = process.argv[1];
  const matches = apps.filter((app) => {
    const env = app.pm2_env || {};
    return env.pm_cwd === live || env.pm_exec_path === live + "/server.js";
  });
  if (matches.length !== 1 ||
      !Number.isInteger(matches[0].pm_id) ||
      matches[0].pm2_env.status !== "online") {
    console.error("Expected exactly one ONLINE PM2 app rooted at " + live);
    process.exit(2);
  }
  process.stdout.write(String(matches[0].pm_id));
});
' "$live")" || {
  echo "PM2 app not uniquely identified. Nothing changed." >&2
  exit 1
}
echo "Verified PM2 app id: $pm_id"

release_json="$(curl -fsSL --retry 2 --connect-timeout 10 --max-time 30 \
  -H 'Accept: application/vnd.github+json' -H 'User-Agent: fertini-cpanel-cron' "$api")"
tag="$(printf '%s' "$release_json" | php -r '
  $r=json_decode(stream_get_contents(STDIN),true);
  $tag=$r["tag_name"]??"";
  if(!is_string($tag)||!preg_match("/^fertini-cpanel-[0-9a-f]{40}$/D",$tag)){exit(2);}
  echo $tag;
')" || { echo "Latest release is not a Fertini cPanel runtime; skipping" >&2; exit 1; }
sha="${tag#fertini-cpanel-}"
if [[ -f "$state" && "$(cat "$state")" == "$sha" ]]; then exit 0; fi
if [[ -f "$blocked" && "$(cat "$blocked")" == "$sha" ]]; then exit 0; fi

work="$(mktemp -d "$home/.fertini-pull-XXXXXXXX")"
stage="$home/.fertini-stage-$sha"
previous="$home/.fertini-runtime.previous"
failed="$home/.fertini-failed-$sha"
promoted=0
cleanup() {
  rm -rf -- "$work"
  if (( promoted == 0 )) && [[ -d "$stage" ]]; then rm -rf -- "$stage"; fi
}
trap cleanup EXIT

[[ ! -e "$stage" && ! -e "$failed" ]] || { echo "Stale staged runtime exists, aborting" >&2; exit 1; }

echo "Checking published Fertini release: $tag"
asset_base="https://github.com/$repo/releases/download/$tag"
curl -fL --retry 2 --connect-timeout 15 --max-time 180 \
  "$asset_base/fertini-runtime.sha256" -o "$work/fertini-runtime.sha256"
curl -fL --retry 2 --connect-timeout 15 --max-time 900 \
  "$asset_base/fertini-runtime.tar.gz" -o "$work/fertini-runtime.tar.gz"

( cd "$work" && sha256sum --status -c fertini-runtime.sha256 ) || {
  echo "Archive SHA-256 verification failed" >&2
  exit 1
}
if tar -tzf "$work/fertini-runtime.tar.gz" | \
    grep -E '(^/|(^|/)\.\.(/|$))' >/dev/null; then
  echo "Unsafe archive member" >&2
  exit 1
fi

mkdir -m 700 "$stage"
tar -xzf "$work/fertini-runtime.tar.gz" -C "$stage" --no-same-owner --no-same-permissions
[[ -s "$stage/server.js" && -f "$stage/.next/BUILD_ID" && -d "$stage/.next/static" && -f "$stage/package.json" ]] || {
  echo "Release missing standalone runtime files" >&2
  exit 1
}

echo "Deploying release $sha; existing PostgreSQL and $media untouched"
if [[ -d "$previous" ]]; then rm -rf -- "$previous"; fi
mv -- "$live" "$previous"
if ! mv -- "$stage" "$live"; then
  mv -- "$previous" "$live"
  echo "Promotion failed: previous runtime restored" >&2
  exit 1
fi
promoted=1
# PM2 manages the real Next.js process behind localhost:56757.
# Restart by the verified numeric ID, retaining its existing private environment.
healthy=0
if ! pm2 restart "$pm_id"; then
  echo "PM2 restart failed; attempting rollback" >&2
else
  for attempt in $(seq 1 20); do
    response="$(curl -fsS --connect-timeout 5 --max-time 8 \
      "$origin/api/v1/deployment" || true)"
    if [[ "$response" == *'"sha":"'"$sha"'"'* ]]; then
      healthy=1
      break
    fi
    sleep 5
  done
fi


if (( healthy == 1 )); then
  printf '%s\n' "$sha" > "$state"
  rm -f -- "$blocked"
  echo "Success: public site confirmed release $sha"
  exit 0
fi

echo "New revision was not served; restoring previous runtime" >&2
if ! mv -- "$live" "$failed"; then
  echo "Unable to move failed release; manual cPanel intervention required" >&2
  exit 1
fi
if ! mv -- "$previous" "$live"; then
  echo "CRITICAL: rollback could not restore original runtime" >&2
  exit 1
fi
if ! pm2 restart "$pm_id"; then
  echo "CRITICAL: old runtime files restored but PM2 restart failed; manual intervention required" >&2
  exit 1
fi
rm -rf -- "$failed"
printf '%s\n' "$sha" > "$blocked"
echo "Rolled back via PM2. Update blocked until a new release or manual reset." >&2
exit 1
