---
description: List the Sanka Desk Actions the user can ask for in this workspace and what each integration's rule lets them do. Use when the user explicitly invokes /sanka:desk-list-actions.
disable-model-invocation: true
argument-hint: "[optional system or change to look for]"
---
# Desk List Actions

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Call `desk_list_actions` directly.
2. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["desk_actions:read"] }`. Tell the user to reconnect Sanka in their AI client (standard OAuth sign-in on Sanka), following its `reconnect_instructions`. After the user reconnects, retry the same Sanka request.
3. Summarize each Action's purpose, the systems it touches, whether Desk makes the change or the company's admin carries it out (`executable`), and what the user may do (`access.mode`: `run`; `request`, which always waits for an approver; `none`, which is refused), with its required inputs. Narrow the list to the system or change the user named.
4. When the user wants one of them, preview it with `desk_preview_action` before anything is filed. When none fits, or the mode is `none`, offer to file an ordinary IT request with `desk_create_ticket`.

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
- Do not call `search_docs` or `execute` when `desk_list_actions` covers the request.
- Listing files nothing and changes nothing. Do not call `desk_run_action` from this command.
