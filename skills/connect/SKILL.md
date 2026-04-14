---
description: Connect or re-authenticate the installed Sanka plugin in this thread. Use when the user explicitly wants to sign in, reconnect, or verify that Sanka is ready before running live Sanka actions.
disable-model-invocation: true
---

# Connect Sanka

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Call `auth_status` exactly once.
2. If the tool says Sanka is already connected, tell the user it is ready.
3. If `auth_status` returns `connected: false`, surface any explicit reconnect URL such as `connect_url` or `authorization_url` verbatim. If it only returns OAuth metadata and not a reconnect URL, tell the user to launch the MCP client's native Sanka OAuth flow or reconnect action for this server, then retry the original request.

Guardrails:
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` for this workflow.
- If `auth_status` returns `connected: false`, surface any explicit reconnect URL it returns. If it only returns metadata, tell the user to start the client-native Sanka OAuth flow.
- Do not fabricate a manual connect, OAuth, or login URL. Only repeat reconnect URLs returned by `auth_status`.
- If `auth_status` only returns OAuth metadata such as `authorization_server_url`, `resource_metadata_url`, `resource_url`, `reconnect_rpc_method`, or `reconnect_server_name`, tell the user to trigger the MCP client's native Sanka OAuth flow or reconnect action and then retry.
- If `auth_status` returns an explicit reconnect URL such as `connect_url` or `authorization_url`, repeat it verbatim.
- Do not report a plugin attachment failure unless a direct `auth_status` call returns a tool-not-found or unavailable error from the client.
- Call `auth_status` directly instead of probing attachment state through discovery tools.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka access.
- Do not call `search_docs` or `execute` for this workflow.
