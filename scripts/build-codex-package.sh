#!/bin/bash

set -euo pipefail
export COPYFILE_DISABLE=1

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
STAGE_ROOT="$DIST_DIR/stage"
PACKAGE_DIR="$STAGE_ROOT/Sanka Plugin for Codex"
ZIP_PATH="$DIST_DIR/Sanka-Plugin-Codex.zip"

rm -rf "$STAGE_ROOT"
mkdir -p "$PACKAGE_DIR"

(
  cd "$ROOT_DIR"
  tar --exclude='.git' --exclude='dist' --exclude='.DS_Store' -cf - .
) | (
  cd "$PACKAGE_DIR"
  tar -xf -
)

xattr -cr "$PACKAGE_DIR" 2>/dev/null || true
find "$PACKAGE_DIR" -name '._*' -delete

rm -f "$ZIP_PATH"
(
  cd "$STAGE_ROOT"
  /usr/bin/zip -qry "$ZIP_PATH" "Sanka Plugin for Codex"
)

echo "Created $ZIP_PATH"
