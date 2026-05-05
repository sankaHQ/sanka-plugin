#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT_DIR"

before_sha="$(git rev-parse --short HEAD)"

echo "Refreshing Sanka Plugin from origin/main..."
git fetch origin
git pull --ff-only

after_sha="$(git rev-parse --short HEAD)"

if [ -f "scripts/sync-codex-skill-metadata.mjs" ]; then
  node scripts/sync-codex-skill-metadata.mjs --check
fi

echo "Sanka Plugin refresh complete: ${before_sha} -> ${after_sha}"
echo "Reload or reinstall Sanka Plugin in Codex, then start a fresh thread from the Sanka Plugin chip or a plain \$sanka:... mention."
