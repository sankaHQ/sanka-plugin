---
description: Create item in live Sanka. Use when the user explicitly invokes /sanka:create-item.
disable-model-invocation: true
argument-hint: "[details to create the record]"
---
# Create Item

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Gather the required creation details from the request. If key required fields are missing, ask a concise follow-up.
2. Call `create_item` directly.
3. If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry.
4. Summarize the created item and surface any returned ids or important fields.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `create_item` covers the request.
- Do not invent required business values that the user did not provide or clearly imply.
