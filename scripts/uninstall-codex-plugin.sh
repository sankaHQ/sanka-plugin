#!/bin/bash

set -euo pipefail

PLUGIN_NAME="sanka-plugin"
PLUGIN_DEST_DIR="$HOME/.codex/plugins/$PLUGIN_NAME"
MARKETPLACE_FILE="$HOME/.agents/plugins/marketplace.json"
BACKUP_SUFFIX="$(date +%Y%m%d%H%M%S)"

echo "Removing Sanka Plugin from Codex..."
echo

if [ -d "$PLUGIN_DEST_DIR" ]; then
  rm -rf "$PLUGIN_DEST_DIR"
  echo "Removed plugin files from $PLUGIN_DEST_DIR."
else
  echo "Plugin files were already removed."
fi

if [ -f "$MARKETPLACE_FILE" ]; then
  cp "$MARKETPLACE_FILE" "$MARKETPLACE_FILE.bak-$BACKUP_SUFFIX"

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

marketplace.plugins = marketplace.plugins.filter(function(plugin) {
  return plugin && plugin.name !== "sanka-plugin";
});

JSON.stringify(marketplace, null, 2);
JXA
)"

  printf '%s\n' "$MARKETPLACE_JSON" > "$MARKETPLACE_FILE"
  echo "Updated $MARKETPLACE_FILE."
else
  echo "No marketplace.json found. Nothing to update."
fi

echo
echo "Uninstall complete."
echo
echo "Next steps:"
echo "1. Restart Codex."
echo "2. Confirm 'Sanka Plugin' no longer appears under 'Personal Plugins'."
