---
description: Route natural-language Sanka requests to the right live Sanka workflow, record, inbox, billing, expense, refresh, or connect action. Use when the user explicitly invokes /sanka or /sanka:sanka, wants Sanka to handle a task without choosing a specific Sanka skill, or asks for a broad Sanka entrypoint.
disable-model-invocation: true
argument-hint: "[natural-language request, URL, record id, or business details]"
---

# Sanka

Use only the attached Sanka MCP tools in this thread. This is the broad Sanka router for Claude Code and other clients that require a skill selection. Do not load every Sanka skill; classify the request and run the smallest matching Sanka MCP workflow or record action.

Workflow:

1. Classify the user's intent from the request, pasted URL, record id, or attached file.
2. Prefer high-level Sanka workflow tools over low-level object writes when a workflow exists.
3. For HubSpot deal URLs, Sanka deal ids, estimate, quote, approval, or deal-to-estimate requests, run the deal-to-estimate route: extract the source deal, call `preview_workflow` with `workflow_type: "deal_to_estimate"`, summarize amount, line item count, approval requirement, warnings, planned records, and source status, then call `start_workflow` only when the user clearly asked to create and the preview says the source is synced in Sanka.
4. If the deal-to-estimate preview says `source_status: "external_only"`, do not call `start_workflow`. Explain that Sanka preview used the external source directly, but creation requires syncing or importing the deal into Sanka first.
5. For workflow status requests, call `get_workflow_run` when the user gives a workflow run id or asks for the status of a prior Sanka workflow.
6. For read requests, call the matching `list_*`, `get_*`, `download_*`, or `resolve_record` tool. Ask a concise follow-up only when multiple candidates remain ambiguous.
7. For explicit create or update requests, gather only missing required values, then call the matching `create_*`, `update_*`, upload, reply, import, export, sync, or apply tool.
8. For delete, cancel, archive, or other destructive requests, ask for confirmation unless the user's confirmation is already explicit in the same request.
9. For auth or connection requests, call `auth_status` once and surface reconnect instructions from the tool result.
10. For refresh, update, outdated plugin, or missing skill requests, stop live Sanka work and show the refresh prompt below.

Intent routes:
- Deals, HubSpot deal URLs, estimates, quotes, approvals, workflow runs: `resolve_record`, `preview_workflow`, `start_workflow`, `get_workflow_run`
- CRM records: companies, contacts, deals, tickets, tasks, properties, pipelines
- Sales and billing records: estimates, invoices, bills, orders, slips, payments, purchase orders, subscriptions, disbursements
- Expenses: expenses and expense attachments
- Inventory and catalog: items, inventories, inventory transactions, locations, company price tables
- Private inbox: private messages, message threads, replies, archive, sync
- Calendar: availability and attendance create, reschedule, cancel, bootstrap
- Data movement and integrations: imports, exports, integration channels, integration sync, demo workspace generation

Refresh prompt:

```text
Sanka Plugin may be outdated.
This action needs a newer Sanka workflow skill.

Update Sanka Plugin?
Reply "yes" and Codex or Claude Code can refresh Sanka Plugin, reload it, and make the new Sanka skills available.
```

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- If the direct tool call returns `Auth required`, call `auth_status` exactly once to surface reconnect metadata. If it only returns metadata, tell the user to start the client-native Sanka OAuth flow.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If `auth_status` returns an explicit reconnect URL such as `connect_url` or `authorization_url`, repeat it verbatim.
- Do not fabricate a manual connect, OAuth, or login URL. Only repeat reconnect URLs returned by `auth_status`.
- If `auth_status` only returns OAuth metadata such as `authorization_server_url`, `resource_metadata_url`, `resource_url`, `reconnect_rpc_method`, or `reconnect_server_name`, tell the user to trigger the MCP client's native Sanka OAuth flow or reconnect action and then retry.
- Use this router as the Sanka entrypoint; do not force the user to choose a narrower Sanka skill when the intent is clear.
- Do not use HubSpot MCP tools for Sanka business actions. HubSpot may be a source record, but Sanka owns estimates, approvals, invoices, workflow runs, audit trails, and record writes.
- If the needed Sanka MCP tool is unavailable, show the refresh prompt and stop instead of falling back to local repo files, terminal commands, Django shell, Postgres, HubSpot MCP, or generic web search.
- Do not invent business values, line items, commercial terms, approval outcomes, ids, or URLs that are not supplied by the user or returned by Sanka MCP.
