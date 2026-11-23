---
description: Run a Sanka read Action on the user's own HubSpot, Salesforce, Google Calendar or Gmail, as their own login, and give the result with its method. Each completed run costs the Action's Sanka Credits. Use when the user explicitly invokes /sanka:run-read-action.
disable-model-invocation: true
argument-hint: "<action key such as hubspot:crm.aggregate, and its inputs or the question>"
---
# Run Read Action

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Require the Action's `action_key` and inputs matching its `input_schema`. If the key or a required input is missing, call `list_read_actions` for the Action and its `input_schema` and ask a concise follow-up; never invent ids, field names or stage values.
2. The first time in a conversation, tell the user the Action's price in Sanka Credits a run (from `list_read_actions`), that it reads their own login, and that a refused or failed run costs nothing.
3. Call `run_read_action` with `action_key` and `inputs`. Leave `client_key` out for a new question; pass the same `client_key` only to retry a call whose answer did not come back.
4. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["read_actions:write"] }`. Tell the user to reconnect Sanka in their AI client (standard OAuth sign-in on Sanka), following its `reconnect_instructions`. After the user reconnects, retry the same Sanka request.
5. When the run is `running`, read it with `get_read_action_run` and its `run_id`; do not run it again.
6. Give the result with its method (filters, records scanned, `as_of`, currency) and the Sanka Credits charged, and say these are the records the user's own login can see. When `method.complete` is false or `more` is true, say the numbers are partial or ask the user to narrow the question; never present them as complete totals. When `reused` is true, it is an earlier identical run and nothing was charged again.
7. On `READ_ACTION_CONNECT_REQUIRED`, give the connect link (`connect_url`) to Personal integrations; for Gmail with `details.reason: "read_access_required"`, the user must give Sanka read access to Gmail there. On `READ_ACTION_CREDITS_REQUIRED`, say the workspace's Sanka Credits ran out and a workspace admin can add them. On `READ_ACTION_TOO_BROAD`, ask the user to narrow the filter or range; never estimate. On `READ_ACTION_DAILY_LIMIT`, say it lifts the next day. On `READ_ACTION_INPUT_INVALID`, fix the inputs against `input_schema` and run again. On `READ_ACTION_PROVIDER_ERROR`, give the system's message. Nothing is charged for any of these.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["read_actions:write"] }` and follow its `reconnect_instructions`.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If `auth_status` reports that Sanka is not connected, tell the user to reconnect Sanka in their AI client and follow its `reconnect_instructions`.
- Do not fabricate a connect, OAuth, or login URL.
- Sanka uses standard MCP OAuth: the AI client signs the user in on Sanka's own page. Never ask the user to paste a token, password or URL.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `run_read_action` covers the request.
- Never present an incomplete result as a complete total, and never estimate missing numbers.
- Never loop, page or split one question into several runs to get around a limit or the Sanka Credits; each completed run is charged.
- Gmail results hold headers and snippets only: never claim to have read a message body or attachment.
