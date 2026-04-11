---
description: Reschedule calendar attendance in live Sanka. Use when the user explicitly invokes /sanka:reschedule-calendar-attendance.
disable-model-invocation: true
argument-hint: "<id and new schedule>"
---
# Reschedule Calendar Attendance

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. If the attached Sanka MCP tools are missing, stop and tell the user the Sanka plugin is not attached to this thread.
2. Require the target identifier and the new schedule details. If either is missing, ask a concise follow-up.
3. Call `reschedule_calendar_attendance` directly.
4. If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry.
5. Summarize the reschedule result clearly.

Guardrails:

- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `reschedule_calendar_attendance` covers the request.
