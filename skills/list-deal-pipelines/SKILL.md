---
description: List or search deal pipelines in live Sanka. Use when the user explicitly invokes /sanka:list-deal-pipelines.
disable-model-invocation: true
argument-hint: "[search text, filters, or limit]"
---
# List Deal Pipelines

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. If the attached Sanka MCP tools are missing, stop and tell the user the Sanka plugin is not attached to this thread.
2. Pull out any explicit search text, filters, sort preference, or limit from the request.
3. Call `list_deal_pipelines` directly.
4. If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry.
5. Summarize the returned deal pipelines clearly and do not mix in any local repo or database information.

Guardrails:

- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `list_deal_pipelines` covers the request.
