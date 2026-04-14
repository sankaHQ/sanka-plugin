---
description: Update bill in live Sanka. Use when the user explicitly invokes /sanka:update-bill.
disable-model-invocation: true
argument-hint: "<id and changes>"
---
# Update Bill

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Require the target record identifier and the changes to apply. If either is missing, ask a concise follow-up.
2. Call `update_bill` directly.
3. If the direct tool call returns `Auth required` or the client surfaces an authentication challenge, call `auth_status` exactly once. If it returns an explicit reconnect URL such as `connect_url` or `authorization_url`, show that URL verbatim. If it only returns OAuth metadata and not a reconnect URL, tell the user to launch the MCP client's native Sanka OAuth flow or reconnect action for this server, then retry the same Sanka request.
4. Summarize the updated bill and the changed fields clearly.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- If the direct tool call returns `Auth required`, call `auth_status` exactly once to surface reconnect metadata. If it only returns metadata, tell the user to start the client-native Sanka OAuth flow.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If `auth_status` returns an explicit reconnect URL such as `connect_url` or `authorization_url`, repeat it verbatim.
- Do not fabricate a manual connect, OAuth, or login URL. Only repeat reconnect URLs returned by `auth_status`.
- If `auth_status` only returns OAuth metadata such as `authorization_server_url`, `resource_metadata_url`, `resource_url`, `reconnect_rpc_method`, or `reconnect_server_name`, tell the user to trigger the MCP client's native Sanka OAuth flow or reconnect action and then retry.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `update_bill` covers the request.
- Do not guess target ids or mutate records when the requested change is ambiguous.
