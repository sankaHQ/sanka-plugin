---
description: Copy selected production records into a live Sanka sandbox. Use when the user explicitly invokes /sanka:sync-sandbox-data.
disable-model-invocation: true
argument-hint: "<sandbox link id> <object families>"
---
# Sync Sandbox Data

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Require the sandbox link id from field `id` and one or more supported object families: contacts, companies, deals, items, orders, invoices, estimates, tasks, tickets, or custom_objects.
2. Call `sync_sandbox_data` directly with `sandbox_id` and `objects`.
3. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["sandboxes:write"] }`. Tell the user to reconnect Sanka in their AI client (standard OAuth sign-in on Sanka), following its `reconnect_instructions`. After the user reconnects, retry the same Sanka request.
4. Report that the additive data copy started and summarize the selected families; use later sandbox copy stats to report progress.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["sandboxes:write"] }` and follow its `reconnect_instructions`.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If `auth_status` reports that Sanka is not connected, tell the user to reconnect Sanka in their AI client and follow its `reconnect_instructions`.
- Do not fabricate a connect, OAuth, or login URL.
- Sanka uses standard MCP OAuth: the AI client signs the user in on Sanka's own page. Never ask the user to paste a token, password or URL.
- Do not substitute the sandbox workspace id or 8-digit workspace code for the sandbox link id.
- Explain that each selected family copies at most the newest 5,000 records and that reruns add newer records without duplicating existing copies.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `sync_sandbox_data` covers the request.
