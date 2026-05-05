---
description: Create or preview a Sanka estimate workflow from a Sanka deal or HubSpot deal URL. Use when the user explicitly invokes /sanka:deal-to-estimate or asks Sanka to make an estimate from a HubSpot deal.
disable-model-invocation: true
argument-hint: "[HubSpot deal URL, Sanka deal id, or request details]"
---

# Deal To Estimate

Use only the attached Sanka MCP tools in this thread. This is a Sanka lead-to-cash workflow, even when the source is a HubSpot deal URL.

Workflow:

1. Extract the source deal reference. For a HubSpot deal URL, pass it as `source_record.url` with `source_system: "hubspot"` and `object_type: "deal"`.
2. If the user gives only a company or deal phrase, call `resolve_record` first and ask a concise follow-up only when multiple candidates remain ambiguous.
3. Call `preview_workflow` with `workflow_type: "deal_to_estimate"` before any write. Summarize amount, line item count, approval requirement, source status, warnings, and planned records.
4. If the user asked only to preview, summarize and stop.
5. If the user explicitly asked to create and the preview `source_status` is `synced`, call `start_workflow` with the same source record and a stable idempotency key based on the workflow type and source deal reference.
6. If the preview `source_status` is `external_only`, do not call `start_workflow`. Explain that Sanka preview used HubSpot directly, but creation requires syncing/importing the deal into Sanka first.
7. If `start_workflow` returns a run id, summarize the created estimate, approval status, created records, and the run id. Call `get_workflow_run` only when the start result is incomplete or the user asks for status.
8. If a Sanka MCP response includes `refresh_required`, `refresh_recommended`, or `suggested_user_facing_reply`, pause the workflow and show the refresh prompt before making further write calls.

Refresh prompt:

```text
Sanka Plugin may be outdated.
This action needs a newer Sanka workflow skill.

Update Sanka Plugin?
Reply "yes" and Codex will run the refresh flow:

Refresh sanka-plugin. Reinstall it if needed, then make the new Sanka skills available.
```

Guardrails:
- Do not use HubSpot MCP tools for this workflow. HubSpot is only the source record; Sanka owns preview, approval rules, estimate creation, workflow run state, and audit history.
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["deals:read","estimates:write","workflows:write"] }` to surface reconnect metadata. If it only returns metadata, tell the user to start the client-native Sanka OAuth flow.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If `preview_workflow`, `start_workflow`, or `get_workflow_run` is unavailable, show the refresh prompt and stop instead of falling back to HubSpot MCP, local repo files, terminal commands, Django shell, or Postgres.
- If `auth_status` returns an explicit reconnect URL such as `connect_url` or `authorization_url`, repeat it verbatim.
- Do not fabricate a manual connect, OAuth, or login URL. Only repeat reconnect URLs returned by `auth_status`.
- If `auth_status` only returns OAuth metadata such as `authorization_server_url`, `resource_metadata_url`, `resource_url`, `reconnect_rpc_method`, or `reconnect_server_name`, tell the user to trigger the MCP client's native Sanka OAuth flow or reconnect action and then retry.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `preview_workflow` or `start_workflow` covers the request.
- Do not invent commercial terms, line items, or approval outcomes that are not returned by Sanka MCP.
