#!/bin/bash

set -euo pipefail
export COPYFILE_DISABLE=1

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
STAGE_DIR="$DIST_DIR/stage-plugin"
ZIP_PATH="$DIST_DIR/Sanka-Plugin.zip"

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
  "skills"
)

"$ROOT_DIR/scripts/build-plugin-payload.sh" "$STAGE_DIR"

xattr -cr "$STAGE_DIR" 2>/dev/null || true
find "$STAGE_DIR" -name '._*' -delete

rm -f "$ZIP_PATH"
(
  cd "$STAGE_DIR"
  /usr/bin/zip -qry "$ZIP_PATH" "${PAYLOAD_ITEMS[@]}"
)

echo "Created $ZIP_PATH"
