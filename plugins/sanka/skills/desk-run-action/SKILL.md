---
description: File a Sanka Desk Action the user confirmed after its preview, as a Desk ticket with Desk's approvals. Use when the user explicitly invokes /sanka:desk-run-action.
disable-model-invocation: true
argument-hint: "<operation key and inputs of the previewed Action>"
---
# Desk Run Action

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Require a preview from `desk_preview_action` in this thread for the same `operation_key` and `inputs`, shown to the user, and their yes to "Create this ticket?". Without them, preview first and ask.
2. Call `desk_run_action` with the same `operation_key` and `inputs`, the preview's `plan_hash`, `confirmed: true` and `client_name` (for example `Claude` or `Codex`). To retry a failed call, pass the `client_key` of the first attempt.
3. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["desk_actions:write"] }`. Tell the user to reconnect Sanka in their AI client (standard OAuth sign-in on Sanka), following its `reconnect_instructions`. After the user reconnects, retry the same Sanka request.
4. Give the ticket reference and what happens next. When it waits for approval, give the approval page from `desk_get_ticket_status` (`pending_approval.approval_url`). Follow it with `desk_get_ticket_status`.
5. On `DESK_PLAN_CHANGED`, call `desk_preview_action` again, show the new preview, ask "Create this ticket?" again and run only with the new `plan_hash` after a new yes.
6. On `DESK_ACTION_NOT_ALLOWED` or `DESK_ACTION_SURFACE_OFF`, explain the integration's rule, do not retry, and offer to file an ordinary IT request with `desk_create_ticket`.
7. When the preview said `credits_short`, or the run is later cancelled with `DESK_CREDITS_REQUIRED`, say the workspace's Sanka Credits ran out and that a workspace admin can add them at `credits_url`.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["desk_actions:write"] }` and follow its `reconnect_instructions`.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If `auth_status` reports that Sanka is not connected, tell the user to reconnect Sanka in their AI client and follow its `reconnect_instructions`.
- Do not fabricate a connect, OAuth, or login URL.
- Sanka uses standard MCP OAuth: the AI client signs the user in on Sanka's own page. Never ask the user to paste a token, password or URL.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `desk_run_action` covers the request.
- Never set `confirmed: true` without the user's yes to the preview, and never reuse a `plan_hash` for different inputs.
- Never approve, reject or try to decide an approval; give the `approval_url`.
