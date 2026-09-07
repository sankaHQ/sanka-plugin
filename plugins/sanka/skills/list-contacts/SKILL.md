---
description: List or search contacts in live Sanka. Use when the user explicitly invokes /sanka:list-contacts.
disable-model-invocation: true
argument-hint: "[search text, filters, or limit]"
---
# List Contacts

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Pull out any explicit search text, filters, sort preference, or limit from the request.
2. Call `list_contacts` directly.
3. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["contacts:read"] }`. Include `required_user_facing_reply` verbatim when present; otherwise show `connect_url` verbatim. If neither is present, report that Connect Sanka could not be started and stop without attempting client-native OAuth. After the user connects, retry the same Sanka request.
4. Summarize the returned contacts clearly and do not mix in any local repo or database information.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["contacts:read"] }` to surface Connect Sanka metadata.
- If `auth_status` returns `required_user_facing_reply`, include it verbatim; otherwise repeat `connect_url` verbatim.
- Do not fabricate a connect, OAuth, or login URL. Only repeat the Connect Sanka URL returned by `auth_status`.
- Do not start or recommend client-native OAuth. Hosted Sanka MCP authentication uses only the Connect Sanka session exchange.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `list_contacts` covers the request.
