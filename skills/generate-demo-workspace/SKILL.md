---
description: Seed a demo workspace in Sanka. Use when the user explicitly invokes /sakura:generate-demo-workspace.
disable-model-invocation: true
argument-hint: "<template and country>"
---
# Generate Demo Workspace

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Require `template` and `country`. If either is missing, ask a concise follow-up.
2. Pass through `workspace_id` only when the user explicitly wants to seed an existing workspace.
3. Pass through `seed` only when the user explicitly asks for deterministic replay.
4. Call `generate_demo_workspace` directly.
5. If the direct tool call returns `Auth required`, call `auth_status` exactly once. Include `required_user_facing_reply` verbatim when present; otherwise show `connect_url` verbatim. If neither is present, report that Connect Sanka could not be started and stop without attempting client-native OAuth. After the user connects, retry the same Sanka request.
6. Summarize the created or seeded workspace and the generated record counts.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If the direct tool call returns `Auth required`, call `auth_status` exactly once to surface Connect Sanka metadata.
- If `auth_status` returns `required_user_facing_reply`, include it verbatim; otherwise repeat `connect_url` verbatim.
- Do not fabricate a connect, OAuth, or login URL. Only repeat the Connect Sanka URL returned by `auth_status`.
- Do not start or recommend client-native OAuth. Hosted Sanka MCP authentication uses only the Connect Sanka session exchange.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `generate_demo_workspace` covers the request.
- Do not invent template or country values outside the supported tool options.
