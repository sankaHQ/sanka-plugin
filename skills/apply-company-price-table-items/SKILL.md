---
description: Apply a company-wide price-table percentage across all items in live Sanka. Use when the user explicitly invokes /sanka:apply-company-price-table-items.
disable-model-invocation: true
argument-hint: "<company id and percentage>"
---
# Apply Company Price Table Items

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. If the attached Sanka MCP tools are missing, stop and tell the user the Sanka plugin is not attached to this thread.
2. Require `company_id` and the percentage to apply. If either is missing, ask a concise follow-up.
3. Call `apply_company_price_table_items` directly.
4. If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry.
5. Summarize the applied company-wide pricing change.

Guardrails:

- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `apply_company_price_table_items` covers the request.
