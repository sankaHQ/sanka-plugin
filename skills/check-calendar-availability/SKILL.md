---
description: Check calendar availability in live Sanka. Use when the user explicitly invokes /sanka:check-calendar-availability.
disable-model-invocation: true
argument-hint: "[availability request]"
---
# Check Calendar Availability

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Pull out the date, time range, duration, attendees, or other availability constraints from the request.
2. Call `check_calendar_availability` directly.
3. If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry.
4. Summarize the available or unavailable time windows clearly.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `check_calendar_availability` covers the request.
