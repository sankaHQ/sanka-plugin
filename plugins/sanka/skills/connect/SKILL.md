---
description: Connect or re-authenticate the installed Sanka plugin in this thread. Use when the user explicitly wants to sign in, reconnect, or verify that Sanka is ready before running live Sanka actions.
disable-model-invocation: true
---

# Connect Sanka

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Call `auth_status` exactly once.
2. If the tool says Sanka is already connected, tell the user it is ready.
3. Sanka uses standard MCP OAuth. If Sanka is not connected, the AI client opens Sanka's sign-in and consent page itself when it connects to the Sanka MCP server; tell the user to reconnect Sanka from the client's MCP settings if it did not, following `reconnect_instructions`. After the user connects, retry the original request.

Guardrails:
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` for this workflow.
- Do not fabricate a connect, OAuth, or login URL.
- Sanka uses standard MCP OAuth: the AI client signs the user in on Sanka's own page. Never ask the user to paste a token, password or URL.
- If `auth_status` reports that Sanka is not connected, tell the user to reconnect Sanka in their AI client and follow its `reconnect_instructions`.
- Do not report a plugin attachment failure unless a direct `auth_status` call returns a tool-not-found or unavailable error from the client.
- Call `auth_status` directly instead of probing attachment state through discovery tools.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka access.
- Do not call `search_docs` or `execute` for this workflow.
