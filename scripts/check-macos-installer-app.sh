#!/bin/bash

set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "Usage: $0 <app-bundle> [<app-bundle> ...]" >&2
  exit 1
fi

if [ "${SANKA_ALLOW_UNSIGNED_MACOS_APPS:-0}" = "1" ]; then
  echo "Skipping macOS installer signing checks because SANKA_ALLOW_UNSIGNED_MACOS_APPS=1." >&2
  exit 0
fi

for app_path in "$@"; do
  if [ ! -d "$app_path" ]; then
    echo "macOS app bundle not found: $app_path" >&2
    exit 1
  fi

  if ! /usr/bin/codesign --verify --deep --strict --verbose=2 "$app_path"; then
    cat >&2 <<EOF
Refusing to package a macOS installer that fails codesign verification:
  $app_path

Build a signed and notarized release package with:
  ./scripts/release-codex-package.sh

For local-only unsigned test builds, rerun with:
  SANKA_ALLOW_UNSIGNED_MACOS_APPS=1
EOF
    exit 1
  fi

  if ! /usr/sbin/spctl --assess --type execute --verbose=2 "$app_path"; then
    cat >&2 <<EOF
Refusing to package a macOS installer that Gatekeeper rejects:
  $app_path

This usually means the app is unsigned, not notarized, or the notarization ticket
was lost before packaging. Use the notarized release flow:
  ./scripts/release-codex-package.sh

For local-only unsigned test builds, rerun with:
  SANKA_ALLOW_UNSIGNED_MACOS_APPS=1
EOF
    exit 1
  fi
done
