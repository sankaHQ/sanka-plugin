---
description: Preview a Sanka Desk Action with its inputs, with nothing filed, and ask the user whether to create the ticket. Use when the user explicitly invokes /sanka:desk-preview-action.
disable-model-invocation: true
argument-hint: "<operation key such as hubspot_account_setup, and its inputs>"
---
# Desk Preview Action

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Require the Action's `operation_key` and its inputs. If the key or a required input is missing, call `desk_list_actions` for the Action's `inputs_schema` and ask a concise follow-up; never invent an e-mail or other value.
2. Call `desk_preview_action` directly. Nothing is filed and nothing changes.
3. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["desk_actions:read"] }`. Tell the user to reconnect Sanka in their AI client (standard OAuth sign-in on Sanka), following its `reconnect_instructions`. After the user reconnects, retry the same Sanka request.
4. Show the preview: the planned changes per system and which the company's admin carries out by hand, the risk, who would approve it, and the Sanka Credits it costs against what the workspace has. When `credits_short` is true, say first that the workspace's Sanka Credits are not enough and that a workspace admin can add them at `credits_url`.
5. Ask "Create this ticket?". Only after a clear yes, file it with `desk_run_action` using the same `operation_key` and `inputs`, the preview's `plan_hash` and `confirmed: true`.
6. When the decision is `not_allowed`, give the refusal's reason, do not retry, and offer to file an ordinary IT request with `desk_create_ticket`.

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
- Do not call `search_docs` or `execute` when `desk_preview_action` covers the request.
- Never treat a preview as consent: the user's yes to "Create this ticket?" for this exact preview is required before `desk_run_action`.
- No tool approves anything; when the preview needs approval, the approver decides in Sanka or in Slack.
