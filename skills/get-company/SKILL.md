---
description: Load one company from live Sanka. Use when the user explicitly invokes /sanka:get-company.
disable-model-invocation: true
argument-hint: "<id or lookup details>"
---
# Get Company

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. If the attached Sanka MCP tools are missing, stop and tell the user the Sanka plugin is not attached to this thread.
2. Require the target record identifier or enough lookup details to resolve it safely. If that is missing, ask a concise follow-up.
3. Call `get_company` directly.
4. If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry.
5. Summarize the returned company clearly.

Guardrails:

- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `get_company` covers the request.
- Do not guess the target record when the user has not identified it clearly.
