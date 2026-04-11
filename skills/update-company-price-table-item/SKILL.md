---
description: Update a company-specific item price override in live Sanka. Use when the user explicitly invokes /sanka:update-company-price-table-item.
disable-model-invocation: true
argument-hint: "<company id, item id, and override changes>"
---
# Update Company Price Table Item Override

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Require `company_id` and `item_id`. If either is missing, ask a concise follow-up.
2. Require either the override the user wants or an explicit request to clear the override.
3. Call `update_company_price_table_item` directly.
4. If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry.
5. Summarize the resulting item-specific override clearly.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `update_company_price_table_item` covers the request.
