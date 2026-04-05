#!/bin/bash

set -euo pipefail

APP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RESOURCES_DIR="$APP_ROOT/Resources"
UNINSTALL_SCRIPT="$RESOURCES_DIR/uninstall-codex-plugin.sh"
LOG_DIR="$HOME/Library/Logs/Sanka"
LOG_FILE="$LOG_DIR/codex-plugin-uninstaller.log"

mkdir -p "$LOG_DIR"

show_success_dialog() {
  if [ "${SANKA_INSTALLER_NO_DIALOG:-0}" = "1" ]; then
    cat <<'EOF'
Sanka Plugin was removed successfully.

Next steps:
1. Restart Codex.
2. Confirm 'Sanka Plugin' no longer appears under 'Personal Plugins'.
EOF
    return
  fi

  /usr/bin/osascript <<'APPLESCRIPT'
display dialog "Sanka Plugin was removed successfully.\n\nNext steps:\n1. Restart Codex.\n2. Confirm 'Sanka Plugin' no longer appears under 'Personal Plugins'." buttons {"OK"} default button "OK" with title "Uninstall Sanka Plugin"
APPLESCRIPT
}

show_error_dialog() {
  local details="$1"

  if [ "${SANKA_INSTALLER_NO_DIALOG:-0}" = "1" ]; then
    echo "Uninstall failed." >&2
    echo "$details" >&2
    return
  fi

  /usr/bin/osascript <<APPLESCRIPT
display dialog "Sanka Plugin could not be removed.\n\n$details" buttons {"OK"} default button "OK" with title "Uninstall Sanka Plugin" with icon stop
APPLESCRIPT
}

if /bin/bash "$UNINSTALL_SCRIPT" >"$LOG_FILE" 2>&1; then
  show_success_dialog
  exit 0
fi

ERROR_SNIPPET="$(tail -n 20 "$LOG_FILE" | tr '\n' '\r' | tr '\r' '\n')"
show_error_dialog "See $LOG_FILE for details.\n\n$ERROR_SNIPPET"
exit 1
