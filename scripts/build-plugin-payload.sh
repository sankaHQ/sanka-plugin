#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEST_DIR="${1:-}"

if [ -z "$DEST_DIR" ]; then
  echo "Usage: $0 <destination-dir>" >&2
  exit 1
fi

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

rm -rf "$DEST_DIR"
mkdir -p "$DEST_DIR"

for item in "${PAYLOAD_ITEMS[@]}"; do
  rsync -a "$ROOT_DIR/$item" "$DEST_DIR/"
done
