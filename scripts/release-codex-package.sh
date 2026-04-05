#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
APP_PATH="$DIST_DIR/macos/Install Sanka Plugin.app"
NOTARY_DIR="$DIST_DIR/notary"
NOTARY_ZIP="$NOTARY_DIR/Install-Sanka-Plugin-macOS.zip"

source "$ROOT_DIR/scripts/macos-signing-env.sh"
trap cleanup_sanka_macos_signing_env EXIT
setup_sanka_macos_signing_env

"$ROOT_DIR/scripts/build-macos-installer-app.sh"
"$ROOT_DIR/scripts/sign-macos-installer-app.sh" "$APP_PATH"

rm -rf "$NOTARY_DIR"
mkdir -p "$NOTARY_DIR"

/usr/bin/ditto -c -k --keepParent "$APP_PATH" "$NOTARY_ZIP"
/usr/bin/xcrun notarytool submit "$NOTARY_ZIP" "${SANKA_NOTARY_ARGS[@]}" --wait
/usr/bin/xcrun stapler staple "$APP_PATH"
/usr/sbin/spctl --assess --type execute --verbose=2 "$APP_PATH"

"$ROOT_DIR/scripts/build-codex-package.sh" --reuse-app

echo "Release package ready at $DIST_DIR/Sanka-Plugin-Codex.zip"
