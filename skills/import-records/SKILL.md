---
description: Create a public import job in live Sanka. Use when the user explicitly invokes /sanka:import-records.
disable-model-invocation: true
argument-hint: "<file id and import settings>"
---
# Import Records

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. If the attached Sanka MCP tools are missing, stop and tell the user the Sanka plugin is not attached to this thread.
2. Require `file_id`. If it is missing, ask a concise follow-up.
3. Pass through import settings such as `object_type`, `operation`, `mapping_mode`, `key_field`, and `column_mappings` only when the user explicitly provides them.
4. Call `import_records` directly.
5. If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry.
6. Summarize the created import job and its job id.

Guardrails:

- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `import_records` covers the request.
