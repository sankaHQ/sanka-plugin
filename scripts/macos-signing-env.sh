#!/bin/bash

set -euo pipefail

SANKA_MACOS_SIGNING_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SANKA_MACOS_SIGNING_ROOT_DIR="$(cd "$SANKA_MACOS_SIGNING_SCRIPT_DIR/.." && pwd)"
SANKA_MACOS_SIGNING_READY=0
SANKA_MACOS_SIGNING_WORKDIR=""
SANKA_MACOS_TEMP_KEYCHAIN=""
SANKA_MACOS_ORIGINAL_DEFAULT_KEYCHAIN=""
SANKA_MACOS_ORIGINAL_KEYCHAINS=()
SANKA_NOTARY_ARGS=()

trim_sanka_line() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  value="${value#\"}"
  value="${value%\"}"
  value="${value#\'}"
  value="${value%\'}"
  printf '%s' "$value"
}

load_sanka_macos_signing_env_file() {
  local env_path="$1"
  local line=""
  local key=""
  local value=""
  local loaded=0

  if [ ! -f "$env_path" ]; then
    return 0
  fi

  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"
    line="$(trim_sanka_line "$line")"

    if [ -z "$line" ]; then
      continue
    fi

    case "$line" in
      \#*)
        continue
        ;;
    esac

    if [[ "$line" != *=* ]]; then
      continue
    fi

    key="$(trim_sanka_line "${line%%=*}")"
    value="$(trim_sanka_line "${line#*=}")"

    case "$key" in
      APPLE_NOTARY_PROFILE|MACOS_APPLE_CERTIFICATE|MACOS_APPLE_CERTIFICATE_PASSWORD|MACOS_APPLE_SIGNING_IDENTITY|MACOS_APPLE_TEAM_ID|MACOS_APPLE_ID|MACOS_APPLE_APP_SPECIFIC_PASSWORD)
        ;;
      *)
        continue
        ;;
    esac

    if [ -n "${!key:-}" ]; then
      continue
    fi

    export "$key=$value"
    loaded=1
  done < "$env_path"

  if [ "$loaded" = "1" ]; then
    echo "Loaded macOS signing credentials from $env_path" >&2
  fi
}

load_sanka_macos_signing_env_candidates() {
  local env_path=""

  for env_path in \
    "$SANKA_MACOS_SIGNING_ROOT_DIR/.env" \
    "$SANKA_MACOS_SIGNING_ROOT_DIR/../sanka/.env" \
    "$HOME/Sites/sanka/sanka/.env"
  do
    load_sanka_macos_signing_env_file "$env_path"
  done
}

import_sanka_apple_intermediates() {
  local keychain_path="$1"
  local cert_url=""
  local cert_path=""

  for cert_url in \
    "https://www.apple.com/certificateauthority/DeveloperIDCA.cer" \
    "https://www.apple.com/certificateauthority/DeveloperIDG2CA.cer"
  do
    cert_path="$SANKA_MACOS_SIGNING_WORKDIR/$(basename "$cert_url")"
    /usr/bin/curl -fsSL "$cert_url" -o "$cert_path"
    /usr/bin/security import "$cert_path" -k "$keychain_path" >/dev/null
  done
}

setup_sanka_macos_signing_env() {
  if [ "$SANKA_MACOS_SIGNING_READY" = "1" ]; then
    return 0
  fi

  load_sanka_macos_signing_env_candidates

  if [ -z "${APPLE_CODESIGN_IDENTITY:-}" ] && [ -n "${MACOS_APPLE_SIGNING_IDENTITY:-}" ]; then
    export APPLE_CODESIGN_IDENTITY="$MACOS_APPLE_SIGNING_IDENTITY"
  fi

  if [ -z "${APPLE_CODESIGN_IDENTITY:-}" ]; then
    echo "Set APPLE_CODESIGN_IDENTITY or MACOS_APPLE_SIGNING_IDENTITY before signing." >&2
    return 1
  fi

  if [ -n "${MACOS_APPLE_CERTIFICATE:-}" ]; then
    if [ -z "${MACOS_APPLE_CERTIFICATE_PASSWORD:-}" ]; then
      echo "MACOS_APPLE_CERTIFICATE_PASSWORD is required when MACOS_APPLE_CERTIFICATE is set." >&2
      return 1
    fi

    SANKA_MACOS_SIGNING_WORKDIR="$(mktemp -d "${TMPDIR:-/tmp}/sanka-macos-signing.XXXXXX")"
    SANKA_MACOS_TEMP_KEYCHAIN="$SANKA_MACOS_SIGNING_WORKDIR/signing.keychain-db"
    local certificate_path="$SANKA_MACOS_SIGNING_WORKDIR/certificate.p12"

    printf '%s' "$MACOS_APPLE_CERTIFICATE" | /usr/bin/base64 -D > "$certificate_path"

    while IFS= read -r line; do
      line="$(trim_sanka_line "$line")"
      if [ -n "$line" ]; then
        SANKA_MACOS_ORIGINAL_KEYCHAINS+=("$line")
      fi
    done < <(/usr/bin/security list-keychains -d user)

    SANKA_MACOS_ORIGINAL_DEFAULT_KEYCHAIN="$(trim_sanka_line "$(/usr/bin/security default-keychain -d user 2>/dev/null || true)")"

    /usr/bin/security create-keychain -p "" "$SANKA_MACOS_TEMP_KEYCHAIN"
    /usr/bin/security set-keychain-settings -lut 21600 "$SANKA_MACOS_TEMP_KEYCHAIN"
    /usr/bin/security unlock-keychain -p "" "$SANKA_MACOS_TEMP_KEYCHAIN"
    import_sanka_apple_intermediates "$SANKA_MACOS_TEMP_KEYCHAIN"
    /usr/bin/security import "$certificate_path" \
      -k "$SANKA_MACOS_TEMP_KEYCHAIN" \
      -f pkcs12 \
      -P "$MACOS_APPLE_CERTIFICATE_PASSWORD" \
      -T /usr/bin/codesign \
      -T /usr/bin/security
    /usr/bin/security set-key-partition-list \
      -S apple-tool:,apple:,codesign: \
      -s \
      -k "" \
      "$SANKA_MACOS_TEMP_KEYCHAIN" >/dev/null

    /usr/bin/security list-keychains -d user -s \
      "$SANKA_MACOS_TEMP_KEYCHAIN" \
      "$HOME/Library/Keychains/login.keychain-db" \
      "/Users/haegwan/Library/Application Support/SankaDesktop/codesign/sanka-local-codesign.keychain-db" \
      "/Library/Keychains/System.keychain" \
      "/System/Library/Keychains/SystemRootCertificates.keychain"
    /usr/bin/security default-keychain -d user -s "$SANKA_MACOS_TEMP_KEYCHAIN"
  fi

  if [ -n "${APPLE_NOTARY_PROFILE:-}" ]; then
    SANKA_NOTARY_ARGS=(--keychain-profile "$APPLE_NOTARY_PROFILE")
  elif [ -n "${MACOS_APPLE_ID:-}" ] && [ -n "${MACOS_APPLE_TEAM_ID:-}" ] && [ -n "${MACOS_APPLE_APP_SPECIFIC_PASSWORD:-}" ]; then
    SANKA_NOTARY_ARGS=(
      --apple-id "$MACOS_APPLE_ID"
      --team-id "$MACOS_APPLE_TEAM_ID"
      --password "$MACOS_APPLE_APP_SPECIFIC_PASSWORD"
    )
  else
    echo "Set APPLE_NOTARY_PROFILE or MACOS_APPLE_ID / MACOS_APPLE_TEAM_ID / MACOS_APPLE_APP_SPECIFIC_PASSWORD before notarization." >&2
    return 1
  fi

  SANKA_MACOS_SIGNING_READY=1
}

cleanup_sanka_macos_signing_env() {
  if [ -n "$SANKA_MACOS_ORIGINAL_DEFAULT_KEYCHAIN" ]; then
    /usr/bin/security default-keychain -d user -s "$SANKA_MACOS_ORIGINAL_DEFAULT_KEYCHAIN" >/dev/null 2>&1 || true
  fi

  if [ "${#SANKA_MACOS_ORIGINAL_KEYCHAINS[@]}" -gt 0 ]; then
    /usr/bin/security list-keychains -d user -s "${SANKA_MACOS_ORIGINAL_KEYCHAINS[@]}" >/dev/null 2>&1 || true
  fi

  if [ -n "$SANKA_MACOS_TEMP_KEYCHAIN" ] && [ -f "$SANKA_MACOS_TEMP_KEYCHAIN" ]; then
    /usr/bin/security delete-keychain "$SANKA_MACOS_TEMP_KEYCHAIN" >/dev/null 2>&1 || true
  fi

  if [ -n "$SANKA_MACOS_SIGNING_WORKDIR" ]; then
    rm -rf "$SANKA_MACOS_SIGNING_WORKDIR"
  fi
}
