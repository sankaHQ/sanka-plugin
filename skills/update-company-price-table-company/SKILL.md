---
description: Update company-wide price table settings in live Sanka. Use when the user explicitly invokes /sanka:update-company-price-table-company.
disable-model-invocation: true
argument-hint: "<company id and pricing changes>"
---
# Update Company Price Table Company Settings

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. If the attached Sanka MCP tools are missing, stop and tell the user the Sanka plugin is not attached to this thread.
2. Require `company_id` and the pricing change the user wants. If either is missing, ask a concise follow-up.
3. Call `update_company_price_table_company` directly.
4. If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry.
5. Summarize the resulting company-wide pricing mode or percentage.

Guardrails:

- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `update_company_price_table_company` covers the request.
