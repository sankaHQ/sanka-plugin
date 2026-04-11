---
description: List or search inventory transactions in live Sanka. Use when the user explicitly invokes /sanka:list-inventory-transactions.
disable-model-invocation: true
argument-hint: "[search text, filters, or limit]"
---
# List Inventory Transactions

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Pull out any explicit search text, filters, sort preference, or limit from the request.
2. Call `list_inventory_transactions` directly.
3. If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry.
4. Summarize the returned inventory transactions clearly and do not mix in any local repo or database information.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `list_inventory_transactions` covers the request.
