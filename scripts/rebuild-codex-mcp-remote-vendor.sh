#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VENDOR_DIR="$ROOT_DIR/vendor/mcp-remote"
VERSION="${1:-0.1.38}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

mkdir -p "$VENDOR_DIR"

echo "Rebuilding vendored Codex mcp-remote bundle from mcp-remote@$VERSION"

cd "$TMP_DIR"
npm init -y >/dev/null 2>&1
npm install "mcp-remote@$VERSION" esbuild >/dev/null 2>&1

cp "$TMP_DIR/node_modules/mcp-remote/dist/chunk-65X3S4HB.js" "$VENDOR_DIR/chunk-65X3S4HB.js"

python3 - "$VENDOR_DIR/chunk-65X3S4HB.js" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
source = path.read_text(encoding="utf-8")
old = """  app.get(options.path, (req, res) => {\n    const code = req.query.code;\n    if (!code) {\n      res.status(400).send(\"Error: No authorization code received\");\n      return;\n    }\n"""
new = """  app.get(options.path, (req, res) => {\n    const code = req.query.code;\n    const error = typeof req.query.error === \"string\" ? req.query.error : void 0;\n    const errorDescription = typeof req.query.error_description === \"string\" ? req.query.error_description : void 0;\n    if (!code) {\n      if (error) {\n        const message = errorDescription ? `OAuth error: ${error} (${errorDescription})` : `OAuth error: ${error}`;\n        res.status(400).send(message);\n        return;\n      }\n      res.status(400).send(\"Error: No authorization code received\");\n      return;\n    }\n"""
if old not in source:
    raise SystemExit("Expected OAuth callback block not found in vendored chunk")
path.write_text(source.replace(old, new, 1), encoding="utf-8")
PY

mkdir -p "$TMP_DIR/src"
cp "$VENDOR_DIR/proxy.mjs" "$TMP_DIR/src/proxy.mjs"
cp "$VENDOR_DIR/chunk-65X3S4HB.js" "$TMP_DIR/src/chunk-65X3S4HB.js"

npx esbuild "$TMP_DIR/src/proxy.mjs" \
  --bundle \
  --platform=node \
  --format=cjs \
  --outfile="$VENDOR_DIR/bundled-proxy.cjs" \
  >/dev/null

perl -0pi -e 's/var import_meta = \\{\\};/var import_meta = { url: import_node_url.pathToFileURL(__filename).href };/g' "$VENDOR_DIR/bundled-proxy.cjs"

echo "Updated:"
echo "  $VENDOR_DIR/chunk-65X3S4HB.js"
echo "  $VENDOR_DIR/bundled-proxy.cjs"
