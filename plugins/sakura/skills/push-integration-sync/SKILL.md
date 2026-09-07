---
description: Queue an outbound integration sync from Sanka. Use when the user explicitly invokes /sakura:push-integration-sync.
disable-model-invocation: true
argument-hint: "<channel id, object type, and record ids or workspace scope>"
---
# Push Integration Sync

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Require `channel_id` and `object_type`. If either is missing, ask a concise follow-up. HubSpot supports contact, company, deal, ticket, and custom_object pushes; custom_object also requires `custom_object_id`.
2. Require either `record_ids` or `workspace_scope`, but never both.
3. Call `push_integration_sync` directly.
4. If the direct tool call returns `Auth required`, call `auth_status` exactly once. Include `required_user_facing_reply` verbatim when present; otherwise show `connect_url` verbatim. If neither is present, report that Connect Sanka could not be started and stop without attempting client-native OAuth. After the user connects, retry the same Sanka request.
5. Summarize the queued sync result, including requested and emitted counts. Queued means asynchronous delivery; do not poll for a completed status.

Guardrails:
- If the tool call fails with error code `INTEGRATION_EXPORT_NOT_SUPPORTED` (HTTP 400), tell the user that provider and object type pair has no native outbound delivery yet (HubSpot supports contact, company, deal, ticket, and custom_object; custom_object requires `custom_object_id`) and do not retry the same pair.
- If the tool call fails with error code `JOB_QUEUE_UNAVAILABLE` (HTTP 503), tell the user the dispatch queue is temporarily unavailable and to retry shortly.
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If the direct tool call returns `Auth required`, call `auth_status` exactly once to surface Connect Sanka metadata.
- If `auth_status` returns `required_user_facing_reply`, include it verbatim; otherwise repeat `connect_url` verbatim.
- Do not fabricate a connect, OAuth, or login URL. Only repeat the Connect Sanka URL returned by `auth_status`.
- Do not start or recommend client-native OAuth. Hosted Sanka MCP authentication uses only the Connect Sanka session exchange.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `push_integration_sync` covers the request.
- Do not combine `record_ids` and `workspace_scope` in the same call.
