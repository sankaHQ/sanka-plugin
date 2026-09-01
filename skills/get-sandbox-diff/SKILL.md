---
description: Compare a live Sanka sandbox configuration with production. Use when the user explicitly invokes /sakura:get-sandbox-diff.
disable-model-invocation: true
argument-hint: "<sandbox link id>"
---
# Get Sandbox Diff

Use only the attached Sakura MCP tools in this thread.

Workflow:

1. Require the sandbox link id returned in field `id` by `list_sandboxes` or `create_sandbox`.
2. Call `get_sandbox_diff` directly with `sandbox_id`.
3. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["sandboxes:read"] }`. Include `required_user_facing_reply` verbatim when present; otherwise show `connect_url` verbatim. If neither is present, report that Connect Sanka could not be started and stop without attempting client-native OAuth. After the user connects, retry the same Sanka request.
4. Summarize each configuration family's counts and bounded items for new-in-sandbox, modified-since-copy, and production-only changes.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["sandboxes:read"] }` to surface Connect Sanka metadata.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If `auth_status` returns `required_user_facing_reply`, include it verbatim; otherwise repeat `connect_url` verbatim.
- Do not fabricate a connect, OAuth, or login URL. Only repeat the Connect Sanka URL returned by `auth_status`.
- Do not start or recommend client-native OAuth. Hosted Sanka MCP authentication uses only the Connect Sanka session exchange.
- Do not substitute the sandbox workspace id or 8-digit workspace code for the sandbox link id.
- Treat the diff as a checklist for manually re-applying tested changes; do not claim the tool writes anything to production.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `get_sandbox_diff` covers the request.
