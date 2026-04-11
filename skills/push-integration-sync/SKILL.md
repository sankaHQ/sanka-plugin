---
description: Queue an outbound integration sync from Sanka. Use when the user explicitly invokes /sanka:push-integration-sync.
disable-model-invocation: true
argument-hint: "<channel id, object type, and record ids or workspace scope>"
---
# Push Integration Sync

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. If the attached Sanka MCP tools are missing, stop and tell the user the Sanka plugin is not attached to this thread.
2. Require `channel_id` and `object_type`. If either is missing, ask a concise follow-up.
3. Require either `record_ids` or `workspace_scope`, but never both.
4. Call `push_integration_sync` directly.
5. If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry.
6. Summarize the queued sync result, including requested and emitted counts.

Guardrails:

- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `push_integration_sync` covers the request.
- Do not combine `record_ids` and `workspace_scope` in the same call.
