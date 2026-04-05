#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
INSTALL_APP_PATH="$DIST_DIR/macos/Install Sanka Plugin.app"
UNINSTALL_APP_PATH="$DIST_DIR/macos/Uninstall Sanka Plugin.app"
PLUGIN_ZIP="$DIST_DIR/Sanka-Plugin.zip"
NOTARY_DIR="$DIST_DIR/notary"
NOTARY_ZIP="$NOTARY_DIR/Sanka-Plugin.zip"

source "$ROOT_DIR/scripts/macos-signing-env.sh"
trap cleanup_sanka_macos_signing_env EXIT
setup_sanka_macos_signing_env

"$ROOT_DIR/scripts/build-macos-installer-app.sh"
"$ROOT_DIR/scripts/build-macos-uninstaller-app.sh"
"$ROOT_DIR/scripts/sign-macos-installer-app.sh" "$INSTALL_APP_PATH"
"$ROOT_DIR/scripts/sign-macos-installer-app.sh" "$UNINSTALL_APP_PATH"

"$ROOT_DIR/scripts/build-plugin-package.sh" --reuse-macos-apps

rm -rf "$NOTARY_DIR"
mkdir -p "$NOTARY_DIR"

/bin/cp "$PLUGIN_ZIP" "$NOTARY_ZIP"
/usr/bin/xcrun notarytool submit "$NOTARY_ZIP" "${SANKA_NOTARY_ARGS[@]}" --wait
/usr/bin/xcrun stapler staple "$INSTALL_APP_PATH"
/usr/bin/xcrun stapler staple "$UNINSTALL_APP_PATH"
/usr/sbin/spctl --assess --type execute --verbose=2 "$INSTALL_APP_PATH"
/usr/sbin/spctl --assess --type execute --verbose=2 "$UNINSTALL_APP_PATH"

"$ROOT_DIR/scripts/build-plugin-package.sh" --reuse-macos-apps

echo "Release package ready at:"
echo "  $PLUGIN_ZIP"
