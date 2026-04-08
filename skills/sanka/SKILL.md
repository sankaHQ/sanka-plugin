---
name: sanka
description: Use the installed Sanka Plugin as a remote-only MCP entrypoint for live CRM and expense work. Start from the plugin attachment, use `mcp__sanka_plugin__*` tools directly, and never fall back to local repo or database access.
---

# Sanka

Use this skill when the user is working through the installed Sanka Plugin in Codex, Claude, or Cursor.

This skill is intentionally thin. The hosted MCP server is the source of truth for:
- tool descriptions
- tool schemas
- auth behavior
- business workflow guidance

## Guardrails

- Treat the plugin as remote-only. Live Sanka data and writes must come from `mcp__sanka_plugin__*`.
- Prefer starting from the installed plugin chip such as `[@sanka-plugin](plugin://sanka-plugin@personal)`.
- Call the matching protected MCP tool directly for real CRM or expense requests. Do not preflight with `auth_status`.
- Protected tools are the OAuth trigger in clients like Codex, Claude, and Cursor.
- Never substitute local code search, `.env`, `manage.py shell`, `psql`, Django ORM, terminal commands, or repo-local data access for a plugin request.
- Do not use `mcp__sanka__*` in Codex. That usually indicates a stale global server entry instead of the installed plugin attachment.

## If The Plugin Is Not Attached

- If `mcp__sanka_plugin__*` tools are unavailable in the current thread, stop and say the plugin did not attach correctly.
- Ask the user to start a new thread from the installed `Sanka Plugin` chip or reinstall/restart the plugin if needed.
- Do not fall back to `search_docs`, `execute`, SDK code, or local workspace access for live user data requests.
