---
description: List or search companies in live Sanka. Use when the user explicitly invokes /sanka:list-companies.
disable-model-invocation: true
argument-hint: "[search text, filters, or limit]"
---
# List Companies

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Pull out any explicit search text, filters, sort preference, limit, integration provider, or channel id from the request.
2. Call `list_companies` directly.
   - For normal Sanka data, omit `scope` or use `scope: "sanka"`.
   - For Sanka companies linked to Salesforce Accounts, use `scope: "sanka", provider: "salesforce"`.
   - For live Salesforce Account records, use `scope: "integration", provider: "salesforce"`, plus `channel_id` when multiple Salesforce channels may exist.
3. If the direct tool call returns `Auth required`, call `auth_status` exactly once. Tell the user to reconnect Sanka in their AI client (standard OAuth sign-in on Sanka), following its `reconnect_instructions`. After the user reconnects, retry the same Sanka request.
4. If `unavailable_reason` is returned for an integration read, surface it and do not silently fall back to a Sanka-only list.
5. Summarize the returned companies clearly and do not mix in any local repo or database information.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If the direct tool call returns `Auth required`, call `auth_status` exactly once and follow its `reconnect_instructions`.
- If `auth_status` reports that Sanka is not connected, tell the user to reconnect Sanka in their AI client and follow its `reconnect_instructions`.
- Do not fabricate a connect, OAuth, or login URL.
- Sanka uses standard MCP OAuth: the AI client signs the user in on Sanka's own page. Never ask the user to paste a token, password or URL.
- Do not use provider-specific tool names such as `list_companies_salesforce`; use `list_companies` with `scope` and `provider`.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `list_companies` covers the request.
