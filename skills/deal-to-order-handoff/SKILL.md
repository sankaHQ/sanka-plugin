---
description: Preview or create a Sanka order draft and fulfillment handoff from a closed-won HubSpot Deal. Use when the user explicitly invokes /sanka:deal-to-order-handoff or asks Sanka to move a HubSpot deal to order processing, check inventory and delivery timing, create an order draft, or create a fulfillment handoff.
disable-model-invocation: true
argument-hint: "[HubSpot deal URL, HubSpot deal id, or fulfillment handoff details]"
---

# Deal To Order Handoff

Use only the attached Sanka MCP tools in this thread. This workflow converts a closed-won HubSpot Deal into a Sanka order draft and fulfillment handoff through generic workflow tools.

Workflow:

1. Extract the HubSpot Deal reference. For a HubSpot deal URL, pass it as `source_record.url` with `source_system: "hubspot"` and `object_type: "deal"`. For a HubSpot deal id, pass it as `source_record.external_id`.
2. If the user gives only a company or deal phrase, call `resolve_record` first and ask a concise follow-up only when multiple candidates remain ambiguous.
3. Call `preview_workflow` with `workflow_type: "deal_to_order_handoff"` before any write. Include `options.target_system: "sanka"`, `include_inventory_check`, `include_lead_time_check`, delivery details, `handoff_target`, `ops_owner`, or `channel_id` when the user provides them.
4. Summarize the preview: HubSpot deal, customer/contact resolution, line items, proposed order draft, proposed handoff, inventory availability, shortages, lead-time and delivery timing, duplicate order or handoff warnings, blockers, and required confirmation.
5. If inventory or lead-time data is unavailable, say that Sanka could not confirm that part because the workspace data or integration is missing. Do not invent quantities, dates, locations, or delivery constraints.
6. If the user asked only to preview or check timing, summarize and stop.
7. If the user explicitly asked to create and the preview has no hard blockers, call `start_workflow` with the same source record and a stable idempotency key based on `deal_to_order_handoff` and the HubSpot Deal reference.
8. Pass `allow_duplicate_order` only when the user explicitly approved creating another order for a deal that already has an order or handoff.
9. If `start_workflow` returns a run id, summarize created order references, handoff task/reference, inventory summary, delivery summary, HubSpot writeback result, warnings, blockers, and run id. Call `get_workflow_run` only when the start result is incomplete or the user asks for status.
10. If a Sanka MCP response includes `refresh_required`, `refresh_recommended`, or `suggested_user_facing_reply`, pause the workflow and show the refresh prompt before making further write calls.

Refresh prompt:

```text
Sanka Plugin may be outdated.
This action needs a newer Sanka workflow skill.

Update Sanka Plugin?
Reply "yes" and Codex or Claude Code can refresh Sanka Plugin, reload it, and make the new Sanka skills available.
```

Guardrails:
- Do not use HubSpot MCP tools for this workflow. HubSpot is only the source record; Sanka owns preview, order draft creation, handoff task creation, duplicate checks, workflow run state, audit history, and writeback timing.
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["deals:read","orders:write","tasks:write","items:read","inventories:read","workflows:write"] }` to surface reconnect metadata. If it only returns metadata, tell the user to start the client-native Sanka OAuth flow.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If `preview_workflow`, `start_workflow`, or `get_workflow_run` is unavailable, show the refresh prompt and stop instead of falling back to HubSpot MCP, local repo files, terminal commands, Django shell, or Postgres.
- If `auth_status` returns an explicit reconnect URL such as `connect_url` or `authorization_url`, repeat it verbatim.
- Do not fabricate a manual connect, OAuth, or login URL. Only repeat reconnect URLs returned by `auth_status`.
- If `auth_status` only returns OAuth metadata such as `authorization_server_url`, `resource_metadata_url`, `resource_url`, `reconnect_rpc_method`, or `reconnect_server_name`, tell the user to trigger the MCP client's native Sanka OAuth flow or reconnect action and then retry.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `preview_workflow` or `start_workflow` covers the request.
- Do not invent business values, inventory quantities, delivery dates, line items, owners, order numbers, task ids, writeback status, or URLs that are not supplied by the user or returned by Sanka MCP.
- Preview is read-only. Never call `start_workflow`, create orders, create tasks, create mappings, or update HubSpot for preview-only requests.
- Order draft and handoff creation require explicit user confirmation through `start_workflow`.
- HubSpot writeback is reported only after successful Sanka order or handoff creation. If writeback fails or is skipped, surface that result without hiding the created Sanka records.
- Duplicate order and handoff warnings must be surfaced. Do not create another order unless the user explicitly approves it and the workflow supports `allow_duplicate_order`.
- Do not sync or create unrelated records. This workflow is scoped to the supplied HubSpot Deal, associated customer/contact, associated line items, order draft, fulfillment handoff, and audit metadata.
