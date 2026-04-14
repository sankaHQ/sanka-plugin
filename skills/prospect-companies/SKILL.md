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
3. If the direct tool call returns `Auth required` or the client surfaces an authentication challenge, call `auth_status` exactly once. If it returns an explicit reconnect URL such as `connect_url` or `authorization_url`, show that URL verbatim. If it only returns OAuth metadata and not a reconnect URL, tell the user to launch the MCP client's native Sanka OAuth flow or reconnect action for this server, then retry the same Sanka request.
4. Summarize the strongest matches clearly, including why they fit when the tool returns enough context.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- If the direct tool call returns `Auth required`, call `auth_status` exactly once to surface reconnect metadata. If it only returns metadata, tell the user to start the client-native Sanka OAuth flow.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If `auth_status` returns an explicit reconnect URL such as `connect_url` or `authorization_url`, repeat it verbatim.
- Do not fabricate a manual connect, OAuth, or login URL. Only repeat reconnect URLs returned by `auth_status`.
- If `auth_status` only returns OAuth metadata such as `authorization_server_url`, `resource_metadata_url`, `resource_url`, `reconnect_rpc_method`, or `reconnect_server_name`, tell the user to trigger the MCP client's native Sanka OAuth flow or reconnect action and then retry.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `prospect_companies` covers the request.
- Do not fabricate prospecting filters that the user did not ask for.
- Do not fall back to local CRM searches when the user asked for net-new prospecting.
