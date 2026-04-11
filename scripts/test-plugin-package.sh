#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
ZIP_PATH="$DIST_DIR/Sanka-Plugin.zip"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/sanka-plugin-test.XXXXXX")"
UNPACKED_DIR="$TMP_DIR/unpacked"
SKIP_BUILD=0

for arg in "$@"; do
  case "$arg" in
    --skip-build)
      SKIP_BUILD=1
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done

cleanup() {
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT

if [ "$SKIP_BUILD" != "1" ]; then
  SANKA_ALLOW_UNSIGNED_MACOS_APPS=1 "$ROOT_DIR/scripts/build-plugin-package.sh" >/dev/null
fi

if [ ! -f "$ZIP_PATH" ]; then
  echo "Missing package artifact: $ZIP_PATH" >&2
  exit 1
fi

unzip -q "$ZIP_PATH" -d "$UNPACKED_DIR"

PLUGIN_ROOT="$ROOT_DIR" UNPACKED_DIR="$UNPACKED_DIR" python3 <<'PY'
import json
import os
from pathlib import Path

plugin_root = Path(os.environ["PLUGIN_ROOT"])
unpacked_root = Path(os.environ["UNPACKED_DIR"])

def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def assert_equal(actual, expected, message):
    if actual != expected:
        raise AssertionError(f"{message}: expected {expected!r}, got {actual!r}")

claude_manifest = load_json(unpacked_root / ".claude-plugin" / "plugin.json")
claude_marketplace = load_json(unpacked_root / ".claude-plugin" / "marketplace.json")
generic_manifest = load_json(unpacked_root / ".plugin" / "plugin.json")
codex_manifest = load_json(unpacked_root / ".codex-plugin" / "plugin.json")
shared_mcp = load_json(unpacked_root / ".mcp.json")
legacy_mcp = load_json(unpacked_root / "mcp.json")
codex_mcp = load_json(unpacked_root / "codex.mcp.json")

assert_equal(claude_manifest["mcpServers"], "./.mcp.json", "Claude manifest must use the canonical shared MCP path")
assert_equal(claude_marketplace["name"], "sanka", "Claude marketplace must expose the expected marketplace name")
assert_equal(claude_marketplace["plugins"][0]["name"], "sanka-plugin", "Claude marketplace must expose the Sanka plugin")
assert_equal(claude_marketplace["plugins"][0]["source"], "./", "Claude marketplace must install from the repo root")
assert_equal(generic_manifest["mcpServers"], "./.mcp.json", "Generic plugin manifest must use the canonical shared MCP path")
if "skills" in generic_manifest:
    raise AssertionError("Generic plugin manifest must not expose a slash-command skill surface")
assert_equal(codex_manifest["mcpServers"], "./codex.mcp.json", "Codex manifest must use its dedicated MCP config")
if "skills" in codex_manifest:
    raise AssertionError("Codex manifest must not expose a slash-command skill surface")

expected_shared = {
    "mcpServers": {
        "sanka": {
            "type": "http",
            "url": "https://mcp.sanka.com/mcp",
        }
    }
}
assert_equal(shared_mcp, expected_shared, "Shared MCP config must stay Claude/generic compatible")
assert_equal(legacy_mcp, expected_shared, "Legacy mcp.json alias must match the shared MCP config")

codex_server = codex_mcp.get("mcpServers", {}).get("sanka_plugin", {})
assert_equal(codex_server.get("type"), "http", "Codex MCP config must use direct HTTP")
assert_equal(codex_server.get("url"), "https://mcp.sanka.com/mcp", "Codex MCP config must target the hosted MCP endpoint")
if "OAuth" not in codex_server.get("note", ""):
    raise AssertionError("Codex MCP config should explain the native OAuth path")

required_paths = [
    ".claude-plugin/plugin.json",
    ".claude-plugin/marketplace.json",
    ".plugin/plugin.json",
    ".codex-plugin/plugin.json",
    ".mcp.json",
    "mcp.json",
    "codex.mcp.json",
    "Codex/Install Sanka Plugin.app/Contents/Info.plist",
    "Codex/Install Sanka Plugin.bat",
]

for relative_path in required_paths:
    if not (unpacked_root / relative_path).exists():
        raise AssertionError(f"Missing packaged file: {relative_path}")

for source, packaged in [
    (plugin_root / ".claude-plugin" / "plugin.json", unpacked_root / ".claude-plugin" / "plugin.json"),
    (plugin_root / ".claude-plugin" / "marketplace.json", unpacked_root / ".claude-plugin" / "marketplace.json"),
    (plugin_root / ".codex-plugin" / "plugin.json", unpacked_root / ".codex-plugin" / "plugin.json"),
    (plugin_root / ".mcp.json", unpacked_root / ".mcp.json"),
    (plugin_root / "codex.mcp.json", unpacked_root / "codex.mcp.json"),
]:
    if source.read_text(encoding="utf-8") != packaged.read_text(encoding="utf-8"):
        raise AssertionError(f"Packaged file drifted from repo copy: {packaged.relative_to(unpacked_root)}")

print("Package manifest validation passed.")
PY

python3 <<'PY'
import json
import urllib.request

def get_json(url: str):
    with urllib.request.urlopen(url, timeout=20) as response:
        return json.load(response)

authorization_server = get_json("https://mcp.sanka.com/.well-known/oauth-authorization-server")
protected_resource = get_json("https://mcp.sanka.com/.well-known/oauth-protected-resource")

if not authorization_server.get("authorization_endpoint", "").startswith("https://"):
    raise SystemExit("authorization endpoint missing from OAuth metadata")

if protected_resource.get("resource") != "https://mcp.sanka.com/mcp":
    raise SystemExit("protected resource metadata points at the wrong MCP endpoint")

print("OAuth metadata validation passed.")
PY

echo "Client packaging checks passed for Claude and Codex."
