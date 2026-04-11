---
description: Connect or re-authenticate the installed Sanka plugin in this thread. Use when the user explicitly wants to sign in, reconnect, or verify that Sanka is ready before running live Sanka actions.
disable-model-invocation: true
---

# Connect Sanka

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Call `auth_status` exactly once.
2. If the tool says Sanka is already connected, tell the user it is ready.
3. If the tool returns an authentication challenge, tell the user to complete the native Sanka sign-in flow shown by the client, then retry the original request.

Guardrails:
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` for this workflow.
- Call `auth_status` directly instead of probing attachment state through discovery tools.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka access.
- Do not fabricate a manual OAuth URL. Let the MCP client handle the challenge and only repeat a visible fallback URL if the client already surfaced one.
- Do not call `search_docs` or `execute` for this workflow.
