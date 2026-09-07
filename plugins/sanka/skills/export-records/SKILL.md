---
description: Create a public export job in live Sanka. Use when the user explicitly invokes /sanka:export-records.
disable-model-invocation: true
argument-hint: "<channel id and export scope>"
---
# Export Records

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Require `channel_id`. If it is missing, ask a concise follow-up.
2. Require either `record_ids` or `workspace_scope`, but never both.
3. Pass through other export settings only when the user explicitly provides them. Runnable integration exports are company/contact/deal to HubSpot and item/order to HubSpot or NextEngine; invoice accounting sync belongs to `preview_workflow`/`start_workflow` with `workflow_type: "invoice_export"`.
4. Call `export_records` directly.
5. If the direct tool call returns `Auth required`, call `auth_status` exactly once. Include `required_user_facing_reply` verbatim when present; otherwise show `connect_url` verbatim. If neither is present, report that Connect Sanka could not be started and stop without attempting client-native OAuth. After the user connects, retry the same Sanka request.
6. Summarize the created export job and its job id. Integration exports report status `queued` and deliver asynchronously; treat `queued` as successful submission rather than waiting for `completed`.

Guardrails:
- If the tool call fails with error code `INTEGRATION_EXPORT_NOT_SUPPORTED` (HTTP 400), tell the user that provider and object type pair has no native export delivery yet. Currently runnable integration exports are company/contact/deal to HubSpot and item/order to HubSpot or NextEngine. Do not retry the same unsupported pair.
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
- Do not call `search_docs` or `execute` when `export_records` covers the request.
- Do not combine `record_ids` and `workspace_scope` in the same call.
