---
description: File an IT request with Sanka Desk, the company's IT service desk, in the user's own words. Use when the user explicitly invokes /sanka:desk-create-ticket.
disable-model-invocation: true
argument-hint: "[the IT request in your own words, and who it is about]"
---
# Desk Create Ticket

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Take the request in the user's own words: access, an account, a login problem, a joiner or leaver, an app setting or an IT question, with the details IT needs. If the request is too vague for IT to act on, ask a concise follow-up.
2. When the request is about another person, such as a new hire or a leaver, pass their e-mail as `subject_email`. Ask for it when it is missing; never invent one.
3. Call `desk_create_ticket` directly. To retry a failed call, pass the `client_key` of the first attempt.
4. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["mcp:access"] }`. Tell the user to reconnect Sanka in their AI client (standard OAuth sign-in on Sanka), following its `reconnect_instructions`. After the user reconnects, retry the same Sanka request.
5. Give the user the ticket reference and the Desk page link (`console_url`). Say that Desk may answer, ask follow-up questions or need approvals, that it also posts updates where the request came from, and that `desk_get_ticket_status` shows its progress.

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
- Do not call `search_docs` or `execute` when `desk_create_ticket` covers the request.
- IT requests go to Sanka Desk. Never file them with `create_ticket`, which stays for Flow ticket records, not even after `DESK_NOT_ENABLED`; then tell the user to raise the request with their IT team the usual way.
- For a change Desk can make itself, such as setting up a HubSpot account, the `desk-actions` skill previews it first with `desk_list_actions` and `desk_preview_action`.
- No tool approves, answers, confirms or closes a Desk request; the user does that on the Desk page or where the request came from.
