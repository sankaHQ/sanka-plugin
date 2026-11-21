---
description: Build a new Free demo workspace for a Sanka Desk, Sanka Flow, Sanka Monitor or Sanka Migrate demo. Use when the user explicitly invokes /sanka:generate-demo-workspace.
disable-model-invocation: true
argument-hint: "<product and case>"
---
# Generate Demo Workspace

Use only the attached Sanka MCP tools in this thread.

`generate_demo_workspace` builds a NEW workspace on the Free plan, filled with a case's fictional data, and the person who asks owns it. Only members of Sanka's own workspace can build one, and the Sanka colleagues they name become its admins too. It never writes into an existing workspace, connects no real account and pays for nothing. A Sanka Migrate demo is a pair of systems in one direction (for example Salesforce to HubSpot) between Sanka's own demo systems, and it stops at the free dry run: nothing is transferred.

Workflow:

1. If the product (`desk`, `flow`, `monitor` or `migrate`) or the case is missing, call `generate_demo_workspace` with `action: "cases"` and offer the matching cases in a concise follow-up.
2. Pass `language`, `currency`, `timezone` and, for Sanka Monitor, `size` only when the user names them; otherwise the case's own apply. Pass `colleagues` (up to five e-mail addresses) only for the Sanka colleagues the user names to add to the demo as admins; they are added directly and get no e-mail.
3. Call `generate_demo_workspace` with `action: "build"`, the `product`, the `case` and a `client_key` you keep for this request, so a retried call returns the same demo instead of a second one.
4. The build runs in the background and usually takes a few minutes. Read it back with `action: "status"` and the returned `demo_id` until it is `ready` or `failed`.
5. If the direct tool call returns `Auth required`, call `auth_status` exactly once. Tell the user to reconnect Sanka in their AI client (standard OAuth sign-in on Sanka), following its `reconnect_instructions`. After the user reconnects, retry the same Sanka request.
6. When it is ready, give the user the workspace name, its link, when it ends, the colleagues added as admins and the demo script as returned. If it failed, say at which step and with which code.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If the direct tool call returns `Auth required`, call `auth_status` exactly once and follow its `reconnect_instructions`.
- If `auth_status` reports that Sanka is not connected, tell the user to reconnect Sanka in their AI client and follow its `reconnect_instructions`.
- Do not fabricate a connect, OAuth, or login URL.
- Sanka uses standard MCP OAuth: the AI client signs the user in on Sanka's own page. Never ask the user to paste a token, password or URL.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `generate_demo_workspace` covers the request.
- Take product and case values from `action: "cases"`; do not invent them.
- Use `action: "extend"` or `action: "end"` only when the user asks for it.
- A refusal for who may ask (`DEMO_WORKSPACES_SANKA_MEMBERS_ONLY`, `DEMO_WORKSPACES_OFF`) or for the limits (`DEMO_WORKSPACES_LIVE_LIMIT`, `DEMO_WORKSPACES_MONTH_LIMIT`, `DEMO_WORKSPACES_TOTAL_LIMIT`) is final: report it and do not retry or work around it.
- `DEMO_COLLEAGUES_SANKA_MEMBERS_ONLY` names, in `details.emails`, the addresses that are not Sanka members. Ask the user to correct them or to build without them; never guess an address.
- Never run or offer a Sanka Migrate transfer from a demo: the demo shows the scan, the mapping and the dry run.
- Never build a demo inside an existing workspace or seed one by other means, and never connect HubSpot, Salesforce or any other real account to a demo.
