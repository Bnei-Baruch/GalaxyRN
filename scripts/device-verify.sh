#!/usr/bin/env bash
#
# device-verify.sh — thin adb/Maestro wrapper for on-device verification.
# Usage:
#   scripts/device-verify.sh doctor         # check device + tooling
#   scripts/device-verify.sh install [apk]  # install debug APK on device
#   scripts/device-verify.sh metro          # adb reverse + check Metro is up
#   scripts/device-verify.sh smoke          # run .maestro/smoke.yaml (no creds)
#   scripts/device-verify.sh regression     # run .maestro/regression.yaml (needs .env creds)
#   scripts/device-verify.sh all            # doctor -> install -> metro -> smoke
#
# Credentials for regression are read from .env (E2E_USERNAME / E2E_PASSWORD), which is
# gitignored. See .env.example.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APK_DEFAULT="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
RESULTS="$ROOT/verify-results"
FLOWS="$ROOT/.maestro"
APP_ID="com.galaxy_mobile"

mkdir -p "$RESULTS"
# Load ONLY the E2E_* keys from .env. The app's .env is a react-native-dotenv file
# (values may contain spaces/URLs) and is NOT safe to `source` in the shell.
if [ -f "$ROOT/.env" ]; then
  E2E_USERNAME="$(grep -E '^E2E_USERNAME=' "$ROOT/.env" | tail -1 | cut -d= -f2- || true)"
  E2E_PASSWORD="$(grep -E '^E2E_PASSWORD=' "$ROOT/.env" | tail -1 | cut -d= -f2- || true)"
  export E2E_USERNAME E2E_PASSWORD
fi

info() { printf '\033[36m[verify]\033[0m %s\n' "$*"; }
err()  { printf '\033[31m[verify]\033[0m %s\n' "$*" >&2; }

device_id() { adb devices | awk 'NR>1 && $2=="device"{print $1; exit}'; }

require_device() {
  command -v adb >/dev/null 2>&1 || { err "adb not found on PATH"; exit 1; }
  local d; d="$(device_id || true)"
  if [ -z "$d" ]; then
    err "No device in 'adb devices'."
    err "On the phone: enable Developer options -> USB debugging (Xiaomi also: 'Install via USB'),"
    err "reconnect the cable in 'File transfer' mode, and accept the RSA fingerprint prompt."
    exit 1
  fi
  echo "$d"
}

cmd_doctor() {
  local d; d="$(require_device)"
  info "Device: $d (Android $(adb -s "$d" shell getprop ro.build.version.release | tr -d '\r'), SDK $(adb -s "$d" shell getprop ro.build.version.sdk | tr -d '\r'))"
  if command -v maestro >/dev/null 2>&1; then
    info "Maestro: $(maestro --version 2>/dev/null | head -1)"
  else
    err "Maestro NOT installed. Install with: curl -Ls \"https://get.maestro.mobile.dev\" | bash"
  fi
  [ -f "$APK_DEFAULT" ] && info "APK: $APK_DEFAULT" || err "Debug APK missing — build with: (cd android && ./gradlew assembleDebug)"
}

cmd_install() {
  local d; d="$(require_device)"
  local apk="${1:-$APK_DEFAULT}"
  [ -f "$apk" ] || { err "APK not found: $apk"; exit 1; }
  info "Installing $apk"
  adb -s "$d" install -r "$apk"
}

cmd_metro() {
  local d; d="$(require_device)"
  adb -s "$d" reverse tcp:8081 tcp:8081 || true
  if curl -sf http://localhost:8081/status >/dev/null 2>&1; then
    info "Metro is up (adb reverse tcp:8081 set)."
  else
    err "Metro not reachable on :8081 — start it in another terminal: yarn start"
    err "(Debug APK loads JS from Metro; without it you'll see a red screen.)"
  fi
}

run_flow() {
  local flow="$1"
  command -v maestro >/dev/null 2>&1 || { err "Maestro not installed (see doctor)"; exit 1; }
  require_device >/dev/null
  info "Running maestro flow: $flow"
  ( cd "$ROOT" && maestro test "$FLOWS/$flow" )
}

cmd_smoke() { run_flow "smoke.yaml"; info "Screenshots in $RESULTS"; }

cmd_regression() {
  if [ -z "${E2E_USERNAME:-}" ] || [ -z "${E2E_PASSWORD:-}" ]; then
    err "E2E_USERNAME / E2E_PASSWORD not set. Add them to .env (see .env.example)."
    exit 1
  fi
  run_flow "regression.yaml"
  info "Screenshots in $RESULTS"
}

cmd_all() { cmd_doctor; cmd_install; cmd_metro; cmd_smoke; }

case "${1:-}" in
  doctor)      cmd_doctor ;;
  install)     shift; cmd_install "${1:-}" ;;
  metro)       cmd_metro ;;
  smoke)       cmd_smoke ;;
  regression)  cmd_regression ;;
  all)         cmd_all ;;
  *) echo "usage: $0 {doctor|install [apk]|metro|smoke|regression|all}"; exit 2 ;;
esac
