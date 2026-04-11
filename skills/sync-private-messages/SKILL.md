---
description: Sync the authenticated user's private inbox in live Sanka. Use when the user explicitly invokes /sanka:sync-private-messages.
disable-model-invocation: true
argument-hint: "[optional sync filters]"
---
# Sync Private Messages

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Call `sync_private_messages` directly with any explicit filters the user provided.
2. If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry.
3. Summarize what was synced and the newest relevant threads.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `sync_private_messages` covers the request.
- This skill is only for the authenticated user private inbox, not the shared group inbox.
