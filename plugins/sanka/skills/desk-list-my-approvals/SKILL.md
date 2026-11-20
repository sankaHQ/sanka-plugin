---
description: List the Sanka Desk approvals waiting for the user's decision, with each approval page. Use when the user explicitly invokes /sanka:desk-list-my-approvals.
disable-model-invocation: true
argument-hint: "[limit]"
---
# Desk List My Approvals

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Call `desk_list_my_approvals` directly, with a limit when the user gives one.
2. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["desk_actions:read"] }`. Tell the user to reconnect Sanka in their AI client (standard OAuth sign-in on Sanka), following its `reconnect_instructions`. After the user reconnects, retry the same Sanka request.
3. List each request, its Action, the risk, who asked, when the approval expires and its approval page (`approval_url`).
4. Tell the user they decide on the approval page in Sanka or with the Slack buttons.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["desk_actions:read"] }` and follow its `reconnect_instructions`.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If `auth_status` reports that Sanka is not connected, tell the user to reconnect Sanka in their AI client and follow its `reconnect_instructions`.
- Do not fabricate a connect, OAuth, or login URL.
- Sanka uses standard MCP OAuth: the AI client signs the user in on Sanka's own page. Never ask the user to paste a token, password or URL.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `desk_list_my_approvals` covers the request.
- No tool approves or rejects a Desk approval. Never try, and do not use `approve_record_approval` or `reject_record_approval`, which are for Flow record approvals.
