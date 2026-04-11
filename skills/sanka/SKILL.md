---
name: sanka
description: Use the installed Sanka Plugin as a remote-only MCP entrypoint for live Sanka work. Use the attached Sanka MCP tools for this thread, and never fall back to local repo or database access.
---

# Sanka

Use this skill when the user is working through the installed Sanka Plugin in Codex or Claude Code.

This skill is intentionally thin. The hosted MCP server is the source of truth for:
- tool descriptions
- tool schemas
- auth behavior
- business workflow guidance

## Guardrails

- Treat the plugin as remote-only. Live Sanka data and writes must come from the attached Sanka MCP tools in this thread.
- Prefer starting from the installed plugin chip such as `[@sanka-plugin](plugin://sanka-plugin@personal)`.
- Treat the currently attached Sanka tool list in this thread as the source of truth. If a newly deployed hosted MCP tool is present, use it even if this skill text does not mention it explicitly.
- In Codex, the attached namespace is usually `mcp__sanka_plugin__*`.
- In Claude Code or other hosts, the attached namespace may be host-generated or opaque, such as `mcp__<connector_id>__*`.
- Do not reject attached live Sanka tools solely because the namespace is not literally `mcp__sanka_plugin__*`.
- Call the matching protected MCP tool directly for live Sanka requests. Do not preflight with `auth_status` unless the user is explicitly debugging auth.
- Protected tools are the OAuth trigger in clients like Codex and Claude Code.
- Never substitute local code search, `.env`, `manage.py shell`, `psql`, Django ORM, terminal commands, or repo-local data access for a plugin request.
- Do not use `mcp__sanka__*` in Codex. That usually indicates a stale global server entry instead of the installed plugin attachment.

## If The Plugin Is Not Attached

- If no attached live Sanka MCP tools are available in the current thread, stop and say the plugin did not attach correctly.
- If a newly deployed hosted MCP tool is missing, ask the user to start a new thread or reconnect the plugin/connector first.
- Only suggest reinstalling or updating the plugin when the bundle itself changed. Hosted MCP-only changes should not require a reinstall.
