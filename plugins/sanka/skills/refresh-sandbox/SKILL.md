---
description: Permanently replace a live Sanka sandbox with a fresh production copy. Use when the user explicitly invokes /sanka:refresh-sandbox.
disable-model-invocation: true
argument-hint: "<sandbox link id>"
---
# Refresh Sandbox

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Require the sandbox link id and explain that refresh permanently discards every sandbox change and all copied data.
2. Call `refresh_sandbox` with `confirm=false` for a preview unless the current request itself explicitly approves the destructive refresh; pass `confirm=true` only after that approval.
3. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["sandboxes:write"] }`. Tell the user to reconnect Sanka in their AI client (standard OAuth sign-in on Sanka), following its `reconnect_instructions`. After the user reconnects, retry the same Sanka request.
4. Report a refresh as started only after the confirmed tool call succeeds, and poll `list_sandboxes` until the sandbox is active again.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["sandboxes:write"] }` and follow its `reconnect_instructions`.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If `auth_status` reports that Sanka is not connected, tell the user to reconnect Sanka in their AI client and follow its `reconnect_instructions`.
- Do not fabricate a connect, OAuth, or login URL.
- Sanka uses standard MCP OAuth: the AI client signs the user in on Sanka's own page. Never ask the user to paste a token, password or URL.
- This action is destructive: call `refresh_sandbox` with `confirm=true` only after the user explicitly approves permanently discarding all sandbox changes and copied data.
- Do not substitute the sandbox workspace id or 8-digit workspace code for the sandbox link id.
- Do not treat a preview response as a completed refresh.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `refresh_sandbox` covers the request.
