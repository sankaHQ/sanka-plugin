---
description: Download payment PDF from live Sanka. Use when the user explicitly invokes /sanka:download-payment-pdf.
disable-model-invocation: true
argument-hint: "<id>"
---
# Download Payment PDF

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. If the attached Sanka MCP tools are missing, stop and tell the user the Sanka plugin is not attached to this thread.
2. Require the target record identifier. If it is missing, ask a concise follow-up.
3. Call `download_payment_pdf` directly.
4. If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry.
5. Return the PDF result clearly, including any download URL or file metadata the tool provides.

Guardrails:

- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `download_payment_pdf` covers the request.
