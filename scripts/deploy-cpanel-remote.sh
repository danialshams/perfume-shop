#!/usr/bin/env bash
set -euo pipefail
mode="$1"; sha="$2"
[[ "$sha" =~ ^[a-f0-9]{40}$ ]] || { echo "Invalid revision SHA" >&2; exit 2; }
live="$HOME/fertini-runtime"
previous="$HOME/.fertini-runtime.previous"
stage="$HOME/.fertini-stage-$sha"
archive="$HOME/.fertini-upload-$sha.tgz"

if [[ "$mode" == "promote" ]]; then
  test -f "$archive"
  test -f "$live/server.js"
  test ! -e "$stage"
  mkdir -m 700 "$stage"
  tar -xzf "$archive" -C "$stage"
  test -s "$stage/server.js"
  test -f "$stage/.next/BUILD_ID"
  test -d "$stage/.next/static"
  test -f "$stage/package.json"
  mkdir -p "$HOME/fertini-media"
  chmod 700 "$HOME/fertini-media"
  # Keep one rollback candidate; the shared host only has 2 GiB disk.
  if [ -d "$previous" ]; then rm -rf -- "$previous"; fi
  mv -- "$live" "$previous"
  if ! mv -- "$stage" "$live"; then
    mv -- "$previous" "$live"
    exit 1
  fi
  mkdir -p "$live/tmp"
  touch "$live/tmp/restart.txt"
  rm -f -- "$archive"
  echo "Promoted $sha; previous runtime retained"
elif [[ "$mode" == "rollback" ]]; then
  test -f "$previous/server.js"
  if [ -d "$live" ]; then mv -- "$live" "$HOME/.fertini-failed-$sha"; fi
  mv -- "$previous" "$live"
  mkdir -p "$live/tmp"
  touch "$live/tmp/restart.txt"
  rm -rf -- "$HOME/.fertini-failed-$sha"
  echo "Rolled back to previous runtime"
else
  echo "Expected promote or rollback" >&2
  exit 2
fi
