#!/usr/bin/env bash
#
# device-verify.sh — thin adb/Maestro wrapper for on-device verification.
# Usage:
#   scripts/device-verify.sh doctor         # check device + tooling
#   scripts/device-verify.sh install [apk]  # install debug APK on device
#   scripts/device-verify.sh metro          # adb reverse + check Metro is up
#   scripts/device-verify.sh smoke          # run .maestro/smoke.yaml (no creds)
#   scripts/device-verify.sh regression     # run .maestro/regression.yaml (needs .env creds)
#   scripts/device-verify.sh net offline    # connectivity: wifi-off/on, data-off/on, offline,
#                                           #   online, offline-for [sec], flap [on off cycles],
#                                           #   wifi-connect <ssid> [sec] [pass], wifi-switch a|b
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
# Load ONLY the E2E_* keys from .env (creds + wifi test networks). The app's .env is a
# react-native-dotenv file (values may contain spaces/URLs) and is NOT safe to `source`.
# `export "KEY=VALUE"` treats the whole line as one NAME=VALUE arg — no code execution.
if [ -f "$ROOT/.env" ]; then
  while IFS= read -r _line; do export "$_line"; done < <(grep -E '^E2E_[A-Z0-9_]+=' "$ROOT/.env")
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

cmd_net() {
  local d; d="$(require_device)"
  local sub="${1:-}"; shift || true
  case "$sub" in
    wifi-on)   adb -s "$d" shell svc wifi enable;  info "wifi ON" ;;
    wifi-off)  adb -s "$d" shell svc wifi disable; info "wifi OFF" ;;
    data-on)   adb -s "$d" shell svc data enable;  info "mobile data ON" ;;
    data-off)  adb -s "$d" shell svc data disable; info "mobile data OFF" ;;
    offline)   adb -s "$d" shell svc wifi disable; adb -s "$d" shell svc data disable; info "OFFLINE (wifi+data off)" ;;
    online)    adb -s "$d" shell svc wifi enable;  adb -s "$d" shell svc data enable;  info "ONLINE (wifi+data on)" ;;
    # Prolonged outage: go offline for N seconds (default 30), then restore.
    offline-for)
      local secs="${1:-30}"
      info "OFFLINE for ${secs}s (prolonged outage)..."
      adb -s "$d" shell svc wifi disable; adb -s "$d" shell svc data disable
      sleep "$secs"
      adb -s "$d" shell svc wifi enable;  adb -s "$d" shell svc data enable
      info "ONLINE restored after ${secs}s — check the app reconnected" ;;
    # Unstable network: flap connectivity (off/on) to exercise reconnection logic.
    #   net flap [on_sec=5] [off_sec=5] [cycles=6]
    flap)
      local on="${1:-5}" off="${2:-5}" cycles="${3:-6}" i=1
      info "flapping connectivity: ${cycles}x (off ${off}s / on ${on}s)"
      while [ "$i" -le "$cycles" ]; do
        adb -s "$d" shell svc data disable; adb -s "$d" shell svc wifi disable
        sleep "$off"
        adb -s "$d" shell svc data enable;  adb -s "$d" shell svc wifi enable
        sleep "$on"
        info "  cycle $i/$cycles"; i=$((i+1))
      done
      info "flap done" ;;
    status)    info "wifi_on=$(adb -s "$d" shell settings get global wifi_on | tr -d '\r') mobile_data=$(adb -s "$d" shell settings get global mobile_data | tr -d '\r')"
               adb -s "$d" shell cmd wifi status 2>/dev/null | sed -n '1,2p' || true ;;
    # Force-connect to a specific SSID (Android 11+ `cmd wifi`).
    wifi-connect)
      local ssid="${1:-}" sec="${2:-wpa2}" pass="${3:-}"
      [ -n "$ssid" ] || { err "usage: $0 net wifi-connect <SSID> [wpa2|open] [password]"; exit 2; }
      info "connecting Wi-Fi -> $ssid"
      adb -s "$d" shell cmd wifi connect-network "$ssid" "$sec" "$pass" ;;
    # Switch between two test networks defined in .env:
    #   E2E_WIFI_A_SSID / E2E_WIFI_A_PASS  and  E2E_WIFI_B_SSID / E2E_WIFI_B_PASS
    # Used for the Wi-Fi -> Wi-Fi handoff test (call must survive the roam).
    wifi-switch)
      local which="${1:-}" ssid pass
      case "$which" in
        a) ssid="${E2E_WIFI_A_SSID:-}"; pass="${E2E_WIFI_A_PASS:-}" ;;
        b) ssid="${E2E_WIFI_B_SSID:-}"; pass="${E2E_WIFI_B_PASS:-}" ;;
        *) err "usage: $0 net wifi-switch {a|b}"; exit 2 ;;
      esac
      [ -n "$ssid" ] || { err "E2E_WIFI_${which}_SSID not set in .env (see .env.example)"; exit 2; }
      info "switching to Wi-Fi '$which' -> $ssid"
      adb -s "$d" shell cmd wifi connect-network "$ssid" wpa2 "$pass" ;;
    *) echo "usage: $0 net {wifi-on|wifi-off|data-on|data-off|offline|online|offline-for [sec]|flap [on] [off] [cycles]|status|wifi-connect <ssid> [sec] [pass]|wifi-switch {a|b}}"; exit 2 ;;
  esac
  # Note: on some MIUI builds `svc wifi/data` and `cmd wifi connect-network` need
  # "USB debugging (Security settings)" enabled, and both APs must be in range.
}

# One-time device prep for Maestro on MIUI/HyperOS:
#  - verifier_verify_adb_installs=0 lets Maestro install its instrumentation driver APK
#    (fixes INSTALL_FAILED_USER_RESTRICTED; newer HyperOS has no "MIUI optimization" toggle).
#  - autofill_service=null stops Chrome's saved-password popup clobbering typed login creds.
cmd_prep() {
  local d; d="$(require_device)"
  adb -s "$d" shell settings put global verifier_verify_adb_installs 0
  adb -s "$d" shell settings put secure autofill_service null
  info "prep done: adb-install verification OFF + system autofill OFF"
  info "(restore later: settings put global verifier_verify_adb_installs 1; and reset autofill in Settings)"
}

cmd_all() { cmd_doctor; cmd_prep; cmd_install; cmd_metro; cmd_smoke; }

case "${1:-}" in
  doctor)      cmd_doctor ;;
  install)     shift; cmd_install "${1:-}" ;;
  metro)       cmd_metro ;;
  prep)        cmd_prep ;;
  smoke)       cmd_smoke ;;
  regression)  cmd_regression ;;
  net)         shift; cmd_net "$@" ;;
  all)         cmd_all ;;
  *) echo "usage: $0 {doctor|prep|install [apk]|metro|smoke|regression|net <sub>|all}"; exit 2 ;;
esac
