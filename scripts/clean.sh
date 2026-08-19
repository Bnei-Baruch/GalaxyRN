#!/usr/bin/env bash
#
# clean.sh — full local dev-cache wipe (Metro, Watchman, Android build/CMake,
# node_modules). Kills Metro before clearing caches, since deleting the
# Watchman watch out from under a still-running Metro corrupts its view of
# the filesystem. Includes RN CLI's "npm" category, which deletes
# node_modules entirely (not just a cache) - reinstalled at the end so the
# repo is left in a working state, patches (.yarn/patches) included.
set -euo pipefail

cd "$(dirname "$0")/.."

METRO_PID=$(lsof -ti:8081 2>/dev/null || true)
if [ -n "$METRO_PID" ]; then
  echo "Stopping Metro on :8081 ($METRO_PID)"
  kill -9 $METRO_PID 2>/dev/null || true
fi

npx react-native clean --include metro,watchman,android,npm

rm -rf android/build android/app/build android/app/.cxx android/.gradle

TMP_DIR="${TMPDIR:-/tmp}"
find "$TMP_DIR" -maxdepth 1 \( -name 'metro-*' -o -name 'haste-map-*' \) -exec rm -rf {} +

watchman watch-del-all

yarn install
