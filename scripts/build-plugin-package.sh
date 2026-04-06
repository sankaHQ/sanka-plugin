#!/bin/bash

set -euo pipefail
export COPYFILE_DISABLE=1

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
STAGE_DIR="$DIST_DIR/stage-plugin"
ZIP_PATH="$DIST_DIR/Sanka-Plugin.zip"
CODEx_DIR="$STAGE_DIR/Codex"
INSTALL_APP_NAME="Install Sanka Plugin.app"
INSTALL_APP_PATH="$DIST_DIR/macos/$INSTALL_APP_NAME"
UNINSTALL_APP_NAME="Uninstall Sanka Plugin.app"
UNINSTALL_APP_PATH="$DIST_DIR/macos/$UNINSTALL_APP_NAME"
REUSE_MACOS_APPS=0
ALLOW_UNSIGNED_MACOS_APPS=0

PAYLOAD_ITEMS=(
  ".claude-plugin"
  ".codex-plugin"
  ".cursor-plugin"
  ".mcp.json"
  ".plugin"
  "LICENSE"
  "README.md"
  "assets"
  "mcp.json"
  "vendor"
)

PACKAGE_ITEMS=(
  ".claude-plugin"
  ".codex-plugin"
  ".cursor-plugin"
  ".mcp.json"
  ".plugin"
  "Codex"
  "LICENSE"
  "README.md"
  "assets"
  "codex.mcp.json"
  "mcp.json"
  "vendor"
)

for arg in "$@"; do
  case "$arg" in
    --reuse-app|--reuse-macos-apps)
      REUSE_MACOS_APPS=1
      ;;
    --allow-unsigned-macos-apps)
      ALLOW_UNSIGNED_MACOS_APPS=1
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done

if [ "$ALLOW_UNSIGNED_MACOS_APPS" = "1" ]; then
  export SANKA_ALLOW_UNSIGNED_MACOS_APPS=1
fi

if [ "$REUSE_MACOS_APPS" != "1" ] || [ ! -d "$INSTALL_APP_PATH" ]; then
  "$ROOT_DIR/scripts/build-macos-installer-app.sh"
fi

if [ "$REUSE_MACOS_APPS" != "1" ] || [ ! -d "$UNINSTALL_APP_PATH" ]; then
  "$ROOT_DIR/scripts/build-macos-uninstaller-app.sh"
fi

"$ROOT_DIR/scripts/build-plugin-payload.sh" "$STAGE_DIR"
mkdir -p "$CODEx_DIR"

cp -R "$INSTALL_APP_PATH" "$CODEx_DIR/$INSTALL_APP_NAME"
cp -R "$UNINSTALL_APP_PATH" "$CODEx_DIR/$UNINSTALL_APP_NAME"
cp "$ROOT_DIR/Install Sanka Plugin.bat" "$CODEx_DIR/"
cp "$ROOT_DIR/Install-Sanka-Plugin.ps1" "$CODEx_DIR/"
cp "$ROOT_DIR/Uninstall Sanka Plugin.bat" "$CODEx_DIR/"
cp "$ROOT_DIR/Uninstall-Sanka-Plugin.ps1" "$CODEx_DIR/"

xattr -cr "$STAGE_DIR" 2>/dev/null || true
find "$STAGE_DIR" -name '._*' -delete

"$ROOT_DIR/scripts/check-macos-installer-app.sh" \
  "$CODEx_DIR/$INSTALL_APP_NAME" \
  "$CODEx_DIR/$UNINSTALL_APP_NAME"

rm -f "$ZIP_PATH"
(
  cd "$STAGE_DIR"
  /usr/bin/zip -qry "$ZIP_PATH" "${PACKAGE_ITEMS[@]}"
)

echo "Created $ZIP_PATH"
