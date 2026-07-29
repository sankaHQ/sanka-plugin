---
description: Copy selected production records into a live Sanka sandbox. Use when the user explicitly invokes /sakura:sync-sandbox-data.
disable-model-invocation: true
argument-hint: "<sandbox link id> <object families>"
---
# Sync Sandbox Data

Use only the attached Sakura MCP tools in this thread.

Workflow:

1. Require the sandbox link id from field `id` and one or more supported object families: contacts, companies, deals, items, orders, invoices, estimates, tasks, tickets, or custom_objects.
2. Call `sync_sandbox_data` directly with `sandbox_id` and `objects`.
3. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["sandboxes:write"] }`. If it returns an explicit reconnect URL such as `connect_url` or `authorization_url`, show that URL verbatim. If it only returns OAuth metadata and not a reconnect URL, tell the user to launch the MCP client's native Sanka OAuth flow or reconnect action for this server, then retry the same Sanka request.
4. Report that the additive data copy started and summarize the selected families; use later sandbox copy stats to report progress.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["sandboxes:write"] }` to surface reconnect metadata. If it only returns metadata, tell the user to start the client-native Sanka OAuth flow.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If `auth_status` returns an explicit reconnect URL such as `connect_url` or `authorization_url`, repeat it verbatim.
- Do not fabricate a manual connect, OAuth, or login URL. Only repeat reconnect URLs returned by `auth_status`.
- If `auth_status` only returns OAuth metadata such as `authorization_server_url`, `resource_metadata_url`, `resource_url`, `reconnect_rpc_method`, or `reconnect_server_name`, tell the user to trigger the MCP client's native Sanka OAuth flow or reconnect action and then retry.
- Do not substitute the sandbox workspace id or 8-digit workspace code for the sandbox link id.
- Explain that each selected family copies at most the newest 5,000 records and that reruns add newer records without duplicating existing copies.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `sync_sandbox_data` covers the request.
