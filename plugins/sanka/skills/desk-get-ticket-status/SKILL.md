---
description: Read the status of one of the user's own Sanka Desk IT requests, including its approval page while it waits for approval. Use when the user explicitly invokes /sanka:desk-get-ticket-status.
disable-model-invocation: true
argument-hint: "<ticket number such as #123, or its id>"
---
# Desk Get Ticket Status

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Require the request's number (such as `#123`) or its UUID. If the user does not know it, call `desk_list_my_tickets` and let them pick.
2. Call `desk_get_ticket_status` directly.
3. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["mcp:access"] }`. Tell the user to reconnect Sanka in their AI client (standard OAuth sign-in on Sanka), following its `reconnect_instructions`. After the user reconnects, retry the same Sanka request.
4. Summarize the state, who it waits for, any question Desk asks and the latest message from Desk, with the Desk page link (`console_url`).
5. While it waits for approval, give the approval page (`pending_approval.approval_url`) so the person can pass it on, or open it if they are an approver.
6. When `state_reason` is `credits_required`, say that the change was cancelled because the workspace's Sanka Credits ran out, that the request went to the company's IT, and that a workspace admin can add credits so the Action can be run again.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["mcp:access"] }` and follow its `reconnect_instructions`.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If `auth_status` reports that Sanka is not connected, tell the user to reconnect Sanka in their AI client and follow its `reconnect_instructions`.
- Do not fabricate a connect, OAuth, or login URL.
- Sanka uses standard MCP OAuth: the AI client signs the user in on Sanka's own page. Never ask the user to paste a token, password or URL.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `desk_get_ticket_status` covers the request.
- Never try to approve, reject, answer, confirm or reopen the request through tools; the person does that on the Desk page, the approval page or where the request came from.
- Only the user's own requests can be read; `DESK_TICKET_NOT_FOUND` means it is not one of theirs or does not exist. Do not use `get_ticket`, which reads Flow ticket records.
