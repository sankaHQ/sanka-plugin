---
description: Upload expense attachment into live Sanka. Use when the user explicitly invokes /sanka:upload-expense-attachment.
disable-model-invocation: true
argument-hint: "[upload details]"
---
# Upload Expense Attachment

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. If the attached Sanka MCP tools are missing, stop and tell the user the Sanka plugin is not attached to this thread.
2. Gather the required upload details from the request. If key required fields are missing, ask a concise follow-up.
3. Call `upload_expense_attachment` directly.
4. If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry.
5. Summarize the uploaded result clearly.

Guardrails:

- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `upload_expense_attachment` covers the request.
