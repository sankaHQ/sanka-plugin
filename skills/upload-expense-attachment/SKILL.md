---
description: Upload expense attachment into live Sanka. Use when the user explicitly invokes /sanka:upload-expense-attachment.
disable-model-invocation: true
argument-hint: "[upload details]"
---
# Upload Expense Attachment

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Gather the required upload details from the request. If key required fields are missing, ask a concise follow-up.
2. Call `upload_expense_attachment` directly.
3. If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry.
4. Summarize the uploaded result clearly.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `upload_expense_attachment` covers the request.
