---
description: Queue an outbound integration sync from Sanka. Use when the user explicitly invokes /sanka:push-integration-sync.
disable-model-invocation: true
argument-hint: "<channel id, object type, and record ids or workspace scope>"
---
# Push Integration Sync

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Require `channel_id` and `object_type`. If either is missing, ask a concise follow-up.
2. Require either `record_ids` or `workspace_scope`, but never both.
3. Call `push_integration_sync` directly.
4. If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry.
5. Summarize the queued sync result, including requested and emitted counts.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `push_integration_sync` covers the request.
- Do not combine `record_ids` and `workspace_scope` in the same call.
