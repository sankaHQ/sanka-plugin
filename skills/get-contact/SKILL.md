---
description: Load one contact from live Sanka. Use when the user explicitly invokes /sanka:get-contact.
disable-model-invocation: true
argument-hint: "<id or lookup details>"
---
# Get Contact

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Require the target record identifier or enough lookup details to resolve it safely. If that is missing, ask a concise follow-up.
2. Call `get_contact` directly.
3. If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry.
4. Summarize the returned contact clearly.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `get_contact` covers the request.
- Do not guess the target record when the user has not identified it clearly.
