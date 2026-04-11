---
description: Delete item from live Sanka. Use when the user explicitly invokes /sanka:delete-item.
disable-model-invocation: true
argument-hint: "<id>"
---
# Delete Item

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. If the attached Sanka MCP tools are missing, stop and tell the user the Sanka plugin is not attached to this thread.
2. Require the target record identifier and explicit delete intent. If either is missing, ask a concise follow-up.
3. Call `delete_item` directly.
4. If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry.
5. Confirm deletion only after the tool succeeds.

Guardrails:

- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `delete_item` covers the request.
- Do not delete records on vague or inferred intent.
