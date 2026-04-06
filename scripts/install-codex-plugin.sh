#!/bin/bash

set -euo pipefail
export COPYFILE_DISABLE=1

PLUGIN_NAME="sanka-plugin"
PLUGIN_SOURCE_DIR="${1:-}"
PLUGIN_DEST_DIR="$HOME/.codex/plugins/$PLUGIN_NAME"
PLUGIN_CACHE_DIR="$HOME/.codex/plugins/cache/personal/$PLUGIN_NAME"
MARKETPLACE_DIR="$HOME/.agents/plugins"
MARKETPLACE_FILE="$MARKETPLACE_DIR/marketplace.json"
CODEX_CONFIG_FILE="$HOME/.codex/config.toml"
BACKUP_SUFFIX="$(date +%Y%m%d%H%M%S)"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/sanka-plugin.XXXXXX")"
PAYLOAD_ITEMS=(
  ".claude-plugin"
  ".codex-plugin"
  ".cursor-plugin"
  ".mcp.json"
  ".plugin"
  "LICENSE"
  "README.md"
  "assets"
  "codex.mcp.json"
  "mcp.json"
  "skills"
  "vendor"
)

if [ -z "$PLUGIN_SOURCE_DIR" ]; then
  PLUGIN_SOURCE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
fi

if [ ! -d "$PLUGIN_SOURCE_DIR/.codex-plugin" ]; then
  echo "Installer payload is missing .codex-plugin metadata." >&2
  exit 1
fi

cleanup() {
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT

echo "Installing Sanka Plugin for Codex..."
echo

mkdir -p "$HOME/.codex/plugins" "$MARKETPLACE_DIR"

STAGING_DIR="$TMP_DIR/$PLUGIN_NAME"
mkdir -p "$STAGING_DIR"

for item in "${PAYLOAD_ITEMS[@]}"; do
  if [ ! -e "$PLUGIN_SOURCE_DIR/$item" ]; then
    echo "Installer payload is missing $item." >&2
    exit 1
  fi

  rsync -a --exclude='.DS_Store' "$PLUGIN_SOURCE_DIR/$item" "$STAGING_DIR/"
done

rm -rf "$PLUGIN_DEST_DIR"
mv "$STAGING_DIR" "$PLUGIN_DEST_DIR"

if [ -d "$PLUGIN_CACHE_DIR" ]; then
  rm -rf "$PLUGIN_CACHE_DIR"
  echo "Cleared stale personal plugin cache at $PLUGIN_CACHE_DIR."
fi

if [ -f "$MARKETPLACE_FILE" ]; then
  cp "$MARKETPLACE_FILE" "$MARKETPLACE_FILE.bak-$BACKUP_SUFFIX"
fi

export MARKETPLACE_FILE
MARKETPLACE_JSON="$(
/usr/bin/osascript -l JavaScript <<'JXA'
ObjC.import('Foundation');

function readJSON(path) {
  const nsPath = $(path);
  const fm = $.NSFileManager.defaultManager;
  if (!fm.fileExistsAtPath(nsPath)) {
    return null;
  }

  const data = $.NSData.dataWithContentsOfFile(nsPath);
  if (!data) {
    throw new Error("Unable to read " + path);
  }

  const text = $.NSString.alloc.initWithDataEncoding(data, $.NSUTF8StringEncoding).js;

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error("Existing marketplace.json is not valid JSON.");
  }
}

const marketplacePath = $.NSProcessInfo.processInfo.environment.objectForKey("MARKETPLACE_FILE").js;
const entry = {
  name: "sanka-plugin",
  source: {
    source: "local",
    path: "./.codex/plugins/sanka-plugin"
  },
  policy: {
    installation: "AVAILABLE",
    authentication: "ON_INSTALL"
  },
  category: "Productivity"
};

const marketplace = readJSON(marketplacePath) || {
  name: "personal",
  interface: {
    displayName: "Personal Plugins"
  },
  plugins: []
};

if (!marketplace.name) {
  marketplace.name = "personal";
}

if (!marketplace.interface || typeof marketplace.interface !== "object") {
  marketplace.interface = {};
}

if (!marketplace.interface.displayName) {
  marketplace.interface.displayName = "Personal Plugins";
}

if (!Array.isArray(marketplace.plugins)) {
  marketplace.plugins = [];
}

const otherPlugins = [];
for (let index = 0; index < marketplace.plugins.length; index += 1) {
  const plugin = marketplace.plugins[index];
  if (!plugin || plugin.name !== "sanka-plugin") {
    otherPlugins.push(plugin);
  }
}

otherPlugins.push(entry);
marketplace.plugins = otherPlugins;

JSON.stringify(marketplace, null, 2);
JXA
)"

printf '%s\n' "$MARKETPLACE_JSON" > "$MARKETPLACE_FILE"

if [ -f "$CODEX_CONFIG_FILE" ]; then
  export CODEX_CONFIG_FILE BACKUP_SUFFIX
  CONFLICT_STATUS="$(
python3 <<'PY'
from pathlib import Path
import os
import re
import shutil

path = Path(os.environ["CODEX_CONFIG_FILE"])
text = path.read_text(encoding="utf-8")
match = re.search(r"(?ms)^\[mcp_servers\.sanka\]\n(.*?)(?=^\[|\Z)", text)
if not match:
    print("missing")
    raise SystemExit

block = match.group(1)
if re.search(r"(?m)^enabled\s*=\s*false\s*$", block):
    print("already-disabled")
    raise SystemExit

if re.search(r"(?m)^enabled\s*=.*$", block):
    new_block = re.sub(r"(?m)^enabled\s*=.*$", "enabled = false", block, count=1)
else:
    new_block = "enabled = false\n" + block

backup_path = f"{path}.bak-{os.environ['BACKUP_SUFFIX']}"
shutil.copy2(path, backup_path)
new_text = text[: match.start(1)] + new_block + text[match.end(1) :]
path.write_text(new_text, encoding="utf-8")
print(f"disabled::{backup_path}")
PY
)"

  case "$CONFLICT_STATUS" in
    disabled::*)
      echo "Disabled conflicting global MCP server in $CODEX_CONFIG_FILE."
      echo "Backup written to ${CONFLICT_STATUS#disabled::}."
      ;;
    already-disabled)
      echo "Global MCP server conflict was already disabled in $CODEX_CONFIG_FILE."
      ;;
  esac
fi

echo "Installation complete."
echo
echo "Next steps:"
echo "1. Restart Codex."
echo "2. Open Plugins and choose 'Personal Plugins'."
echo "3. Install 'Sanka Plugin'."
echo "4. Sign in to Sanka when prompted."
