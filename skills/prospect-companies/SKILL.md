---
description: Research and discover net-new companies with live Sanka prospecting. Use when the user explicitly invokes /sanka:prospect-companies.
disable-model-invocation: true
argument-hint: "[query and optional filters]"
---
# Prospect Companies

Use only the attached Sanka MCP tools in this thread.

Interpret `$ARGUMENTS` as the user's prospecting brief, such as target company type, region, industry, or employee range.

Workflow:

1. Pull out the best available prospecting inputs from the request, especially `query`, `location`, `industry`, `min_employee_count`, `max_employee_count`, and `limit`.
2. Call `prospect_companies` directly.
3. If the direct tool call returns `Auth required`, call `auth_status` exactly once. Tell the user to reconnect Sanka in their AI client (standard OAuth sign-in on Sanka), following its `reconnect_instructions`. After the user reconnects, retry the same Sanka request.
4. Summarize the strongest matches clearly, including why they fit when the tool returns enough context.

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
- Do not call `search_docs` or `execute` when `prospect_companies` covers the request.
- Do not fabricate prospecting filters that the user did not ask for.
- Do not fall back to local CRM searches when the user asked for net-new prospecting.
