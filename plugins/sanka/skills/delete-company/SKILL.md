---
description: Delete company from live Sanka. Use when the user explicitly invokes /sanka:delete-company.
disable-model-invocation: true
argument-hint: "<id>"
---
# Delete Company

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Require the target record identifier and explicit delete intent. If either is missing, ask a concise follow-up.
   - Default to `target: "sanka"` for Sanka-only archive/delete.
   - Use `target: "integration", provider: "salesforce"` only when the user explicitly asks to check or perform the provider-side archive/delete path.
   - Use `dry_run: true` for provider-side destructive checks unless the Sanka API explicitly requires stronger confirmation.
2. Call `delete_company` directly.
3. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["companies:write"] }`. Tell the user to reconnect Sanka in their AI client (standard OAuth sign-in on Sanka), following its `reconnect_instructions`. After the user reconnects, retry the same Sanka request.
4. Confirm deletion only after the tool succeeds.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["companies:write"] }` and follow its `reconnect_instructions`.
- If `auth_status` reports that Sanka is not connected, tell the user to reconnect Sanka in their AI client and follow its `reconnect_instructions`.
- Do not fabricate a connect, OAuth, or login URL.
- Sanka uses standard MCP OAuth: the AI client signs the user in on Sanka's own page. Never ask the user to paste a token, password or URL.
- Do not use provider-specific tool names such as `delete_salesforce_company`; use `delete_company` with `target`, `provider`, `channel_id`, and `dry_run` where needed.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `delete_company` covers the request.
- Do not delete records on vague or inferred intent.
