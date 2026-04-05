#!/bin/bash

set -euo pipefail

APP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RESOURCES_DIR="$APP_ROOT/Resources"
INSTALL_SCRIPT="$RESOURCES_DIR/install-codex-plugin.sh"
PAYLOAD_DIR="$RESOURCES_DIR/payload"
LOG_DIR="$HOME/Library/Logs/Sanka"
LOG_FILE="$LOG_DIR/codex-plugin-installer.log"

mkdir -p "$LOG_DIR"

show_success_dialog() {
  if [ "${SANKA_INSTALLER_NO_DIALOG:-0}" = "1" ]; then
    cat <<'EOF'
Sanka Plugin was installed successfully.

Next steps:
1. Restart Codex.
2. Open Plugins and choose 'Personal Plugins'.
3. Install 'Sanka Plugin'.
4. Sign in to Sanka when prompted.
EOF
    return
  fi

  /usr/bin/osascript <<'APPLESCRIPT'
display dialog "Sanka Plugin was installed successfully.\n\nNext steps:\n1. Restart Codex.\n2. Open Plugins and choose 'Personal Plugins'.\n3. Install 'Sanka Plugin'.\n4. Sign in to Sanka when prompted." buttons {"OK"} default button "OK" with title "Install Sanka Plugin"
APPLESCRIPT
}

show_error_dialog() {
  local details="$1"

  if [ "${SANKA_INSTALLER_NO_DIALOG:-0}" = "1" ]; then
    echo "Installation failed." >&2
    echo "$details" >&2
    return
  fi

  /usr/bin/osascript <<APPLESCRIPT
display dialog "Sanka Plugin could not be installed.\n\n$details" buttons {"OK"} default button "OK" with title "Install Sanka Plugin" with icon stop
APPLESCRIPT
}

if /bin/bash "$INSTALL_SCRIPT" "$PAYLOAD_DIR" >"$LOG_FILE" 2>&1; then
  show_success_dialog
  exit 0
fi

ERROR_SNIPPET="$(tail -n 20 "$LOG_FILE" | tr '\n' '\r' | tr '\r' '\n')"
show_error_dialog "See $LOG_FILE for details.\n\n$ERROR_SNIPPET"
exit 1
