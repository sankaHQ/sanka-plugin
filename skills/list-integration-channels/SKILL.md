---
description: List exportable integration channels in live Sanka. Use when the user explicitly invokes /sanka:list-integration-channels.
disable-model-invocation: true
argument-hint: "[object type or provider]"
---
# List Integration Channels

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. If the attached Sanka MCP tools are missing, stop and tell the user the Sanka plugin is not attached to this thread.
2. Call `list_integration_channels` directly with any explicit filter the user provided.
3. If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry.
4. Summarize the available channels clearly.

Guardrails:

- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `list_integration_channels` covers the request.
