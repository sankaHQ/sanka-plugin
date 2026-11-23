---
description: List the Sanka read Actions the user can run on their own HubSpot, Salesforce, Google Calendar and Gmail, with each one's price in Sanka Credits, inputs and whether their own login is connected. Use when the user explicitly invokes /sanka:list-read-actions.
disable-model-invocation: true
argument-hint: "[optional system or question to look for]"
---
# List Read Actions

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Call `list_read_actions` directly. It is free and runs nothing.
2. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["read_actions:read"] }`. Tell the user to reconnect Sanka in their AI client (standard OAuth sign-in on Sanka), following its `reconnect_instructions`. After the user reconnects, retry the same Sanka request.
3. Summarize each Action: its `key`, what it does, its price in Sanka Credits a completed run, its required inputs from `input_schema`, and whether the user's own login for that system is connected. Narrow the list to the system or question the user named.
4. For an Action whose login is not connected, give its connect link (`connect_url`) to Personal integrations in the user's Sanka account settings.
5. When the user wants an answer, run the Action with `run_read_action` after telling them its price, following [the read Actions workflow](../read-actions/SKILL.md).
6. On `FEATURE_DISABLED`, say read Actions are not available in this workspace yet and that a workspace admin can ask Sanka to turn them on.

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
- Do not call `search_docs` or `execute` when `list_read_actions` covers the request.
- Listing runs nothing and costs nothing. Do not call `run_read_action` from this command without telling the user the price first.
- Take prices, keys and inputs from the tool result; do not quote prices from memory.
