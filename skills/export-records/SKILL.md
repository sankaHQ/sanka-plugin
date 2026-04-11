---
description: Create a public export job in live Sanka. Use when the user explicitly invokes /sanka:export-records.
disable-model-invocation: true
argument-hint: "<channel id and export scope>"
---
# Export Records

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. If the attached Sanka MCP tools are missing, stop and tell the user the Sanka plugin is not attached to this thread.
2. Require `channel_id`. If it is missing, ask a concise follow-up.
3. Require either `record_ids` or `workspace_scope`, but never both.
4. Pass through other export settings only when the user explicitly provides them.
5. Call `export_records` directly.
6. If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry.
7. Summarize the created export job and its job id.

Guardrails:

- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `export_records` covers the request.
- Do not combine `record_ids` and `workspace_scope` in the same call.
