#!/bin/bash

set -euo pipefail
export COPYFILE_DISABLE=1

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
BUILD_DIR="$DIST_DIR/build/macos-installer"
APP_NAME="Install Sanka Plugin.app"
APP_DIR="$DIST_DIR/macos/$APP_NAME"
ICONSET_DIR="$BUILD_DIR/AppIcon.iconset"
ICON_SOURCE_SVG="$ROOT_DIR/assets/logo.svg"
ICON_SOURCE_PNG="$BUILD_DIR/logo.png"
ICON_PREVIEW_PNG="$BUILD_DIR/$(basename "$ICON_SOURCE_SVG").png"
VERSION="$(/usr/bin/plutil -extract version raw -o - "$ROOT_DIR/.codex-plugin/plugin.json")"

rm -rf "$APP_DIR" "$BUILD_DIR"
mkdir -p "$APP_DIR/Contents/MacOS" "$APP_DIR/Contents/Resources" "$BUILD_DIR"

"$ROOT_DIR/scripts/build-plugin-payload.sh" "$APP_DIR/Contents/Resources/payload"
cp "$ROOT_DIR/scripts/install-codex-plugin.sh" "$APP_DIR/Contents/Resources/install-codex-plugin.sh"
cp "$ROOT_DIR/macos/installer-app/launcher.sh" "$APP_DIR/Contents/MacOS/Install Sanka Plugin"
chmod +x "$APP_DIR/Contents/MacOS/Install Sanka Plugin" "$APP_DIR/Contents/Resources/install-codex-plugin.sh"

sed "s/__VERSION__/$VERSION/g" "$ROOT_DIR/macos/installer-app/Info.plist" > "$APP_DIR/Contents/Info.plist"

/usr/bin/qlmanage -t -s 1024 -o "$BUILD_DIR" "$ICON_SOURCE_SVG" >/dev/null 2>&1
cp "$ICON_PREVIEW_PNG" "$ICON_SOURCE_PNG"

mkdir -p "$ICONSET_DIR"
for size in 16 32 128 256 512; do
  /usr/bin/sips -z "$size" "$size" "$ICON_SOURCE_PNG" --out "$ICONSET_DIR/icon_${size}x${size}.png" >/dev/null
  /usr/bin/sips -z $((size * 2)) $((size * 2)) "$ICON_SOURCE_PNG" --out "$ICONSET_DIR/icon_${size}x${size}@2x.png" >/dev/null
done

/usr/bin/iconutil -c icns "$ICONSET_DIR" -o "$APP_DIR/Contents/Resources/AppIcon.icns"
/usr/bin/plutil -lint "$APP_DIR/Contents/Info.plist" >/dev/null

echo "Created $APP_DIR"
