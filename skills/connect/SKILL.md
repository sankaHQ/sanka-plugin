---
description: Connect or re-authenticate the installed Sanka plugin in this thread. Use when the user explicitly wants to sign in, reconnect, or verify that Sanka is ready before running live Sanka actions.
disable-model-invocation: true
---

# Connect Sanka

Use only the attached Sakura MCP tools in this thread.

Workflow:

1. Call `auth_status` exactly once.
2. If the tool says Sanka is already connected, tell the user it is ready.
3. If `auth_status` returns `connected: false`, include `required_user_facing_reply` verbatim when present; otherwise show `connect_url` verbatim. If neither is present, report that Connect Sanka could not be started and stop without attempting client-native OAuth. After the user connects, retry the original request.

Guardrails:
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` for this workflow.
- If `auth_status` returns `connected: false`, surface its Connect Sanka reply or URL.
- Do not fabricate a connect, OAuth, or login URL. Only repeat the Connect Sanka URL returned by `auth_status`.
- Do not start or recommend client-native OAuth. Hosted Sanka MCP authentication uses only the Connect Sanka session exchange.
- If `auth_status` returns `required_user_facing_reply`, include it verbatim; otherwise repeat `connect_url` verbatim.
- Do not report a plugin attachment failure unless a direct `auth_status` call returns a tool-not-found or unavailable error from the client.
- Call `auth_status` directly instead of probing attachment state through discovery tools.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka access.
- Do not call `search_docs` or `execute` for this workflow.
