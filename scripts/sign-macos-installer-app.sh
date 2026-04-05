#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_PATH="${1:-$ROOT_DIR/dist/macos/Install Sanka Plugin.app}"

source "$ROOT_DIR/scripts/macos-signing-env.sh"
trap cleanup_sanka_macos_signing_env EXIT
setup_sanka_macos_signing_env

IDENTITY="${APPLE_CODESIGN_IDENTITY:-${2:-}}"

if [ ! -d "$APP_PATH" ]; then
  if [ "$(basename "$APP_PATH")" = "Uninstall Sanka Plugin.app" ]; then
    "$ROOT_DIR/scripts/build-macos-uninstaller-app.sh"
  else
    "$ROOT_DIR/scripts/build-macos-installer-app.sh"
  fi
fi

/usr/bin/codesign \
  --force \
  --deep \
  --options runtime \
  --timestamp \
  --sign "$IDENTITY" \
  "$APP_PATH"

/usr/bin/codesign --verify --deep --strict --verbose=2 "$APP_PATH"

echo "Signed $APP_PATH"
