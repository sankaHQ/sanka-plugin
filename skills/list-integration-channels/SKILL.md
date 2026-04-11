---
description: List exportable integration channels in live Sanka. Use when the user explicitly invokes /sanka:list-integration-channels.
disable-model-invocation: true
argument-hint: "[object type or provider]"
---
# List Integration Channels

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Call `list_integration_channels` directly with any explicit filter the user provided.
2. If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry.
3. Summarize the available channels clearly.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `list_integration_channels` covers the request.
