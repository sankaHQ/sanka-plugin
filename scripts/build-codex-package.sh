#!/bin/bash

set -euo pipefail
export COPYFILE_DISABLE=1

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
STAGE_ROOT="$DIST_DIR/stage"
PACKAGE_DIR="$STAGE_ROOT/Sanka Plugin for Codex"
ZIP_PATH="$DIST_DIR/Sanka-Plugin-Codex-Installer.zip"
INSTALL_APP_NAME="Install Sanka Plugin.app"
INSTALL_APP_PATH="$DIST_DIR/macos/$INSTALL_APP_NAME"
UNINSTALL_APP_NAME="Uninstall Sanka Plugin.app"
UNINSTALL_APP_PATH="$DIST_DIR/macos/$UNINSTALL_APP_NAME"
REUSE_MACOS_APPS=0

if [ "${1:-}" = "--reuse-app" ] || [ "${1:-}" = "--reuse-macos-apps" ]; then
  REUSE_MACOS_APPS=1
fi

if [ "$REUSE_MACOS_APPS" != "1" ] || [ ! -d "$INSTALL_APP_PATH" ]; then
  "$ROOT_DIR/scripts/build-macos-installer-app.sh"
fi

if [ "$REUSE_MACOS_APPS" != "1" ] || [ ! -d "$UNINSTALL_APP_PATH" ]; then
  "$ROOT_DIR/scripts/build-macos-uninstaller-app.sh"
fi

rm -rf "$STAGE_ROOT"
mkdir -p "$PACKAGE_DIR/Support"

cp -R "$INSTALL_APP_PATH" "$PACKAGE_DIR/$INSTALL_APP_NAME"
cp -R "$UNINSTALL_APP_PATH" "$PACKAGE_DIR/$UNINSTALL_APP_NAME"
cp "$ROOT_DIR/Install Sanka Plugin.bat" "$PACKAGE_DIR/"
cp "$ROOT_DIR/Install-Sanka-Plugin.ps1" "$PACKAGE_DIR/"
cp "$ROOT_DIR/Uninstall Sanka Plugin.bat" "$PACKAGE_DIR/"
cp "$ROOT_DIR/Uninstall-Sanka-Plugin.ps1" "$PACKAGE_DIR/"
cp "$ROOT_DIR/README.md" "$PACKAGE_DIR/"
cp "$ROOT_DIR/LICENSE" "$PACKAGE_DIR/"
"$ROOT_DIR/scripts/build-plugin-payload.sh" "$PACKAGE_DIR/Support/payload"

xattr -cr "$PACKAGE_DIR" 2>/dev/null || true
find "$PACKAGE_DIR" -name '._*' -delete

rm -f "$ZIP_PATH"
(
  cd "$STAGE_ROOT"
  /usr/bin/zip -qry "$ZIP_PATH" "Sanka Plugin for Codex"
)

echo "Created $ZIP_PATH"
