---
description: Read an earlier Sanka read Action run by its run id, with its status, result and method, free of charge. Use when the user explicitly invokes /sanka:get-read-action-run.
disable-model-invocation: true
argument-hint: "<run_id>"
---
# Get Read Action Run

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Require the `run_id` from an earlier `run_read_action`. If it is missing, ask for it.
2. Call `get_read_action_run` directly. It is free and does not read the CRM, calendar or mail again.
3. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["read_actions:read"] }`. Tell the user to reconnect Sanka in their AI client (standard OAuth sign-in on Sanka), following its `reconnect_instructions`. After the user reconnects, retry the same Sanka request.
4. Give the status and the result with its method (filters, records scanned, currency) and say it shows the system as it was at `as_of`. When `method.complete` is false or `more` is true, say the numbers are partial; never present them as complete totals. A `failed` run gives its reason and charged nothing.
5. When the run is still `running`, say so and read it again later; do not start a new run for the same question.
6. On `READ_ACTION_NOT_FOUND`, say the run does not exist or belongs to someone else: only the person who ran it can read it, for 30 days.
7. To read fresh numbers, run the Action again with `run_read_action` after telling the user its price, following [the read Actions workflow](../read-actions/SKILL.md).

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["read_actions:read"] }` and follow its `reconnect_instructions`.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If `auth_status` reports that Sanka is not connected, tell the user to reconnect Sanka in their AI client and follow its `reconnect_instructions`.
- Do not fabricate a connect, OAuth, or login URL.
- Sanka uses standard MCP OAuth: the AI client signs the user in on Sanka's own page. Never ask the user to paste a token, password or URL.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `get_read_action_run` covers the request.
- Reading a run changes nothing and costs nothing. Do not call `run_read_action` from this command without telling the user the price first.
