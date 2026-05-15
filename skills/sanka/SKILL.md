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
3. For Salesforce Opportunity quote-readiness requests such as "Can this Salesforce Opportunity be quoted?", extract the Salesforce Opportunity reference, call `preview_workflow` with `workflow_type: "quote_readiness"`, `source_system: "salesforce"`, and `object_type: "opportunity"`. The hosted tool routes this read-only preview through Sanka's `/api/v1/salesforce/*` API surface. Summarize readiness, the target estimate preview, financials, line item checks, approval requirement, hard blockers, warnings, suggested fixes, Salesforce source records, Sanka records, and the generic `orchestration_plan` showing which Companies, Contacts, Items, and platform mappings would be reused or created. Do not call `start_workflow` for quote readiness.
4. For HubSpot deal URLs, Sanka deal ids, estimate, quote, approval, deal-to-estimate, deal-to-invoice, order-processing, inventory-check, delivery-timing, or fulfillment-handoff requests, extract the source deal and call `preview_workflow`. Use `workflow_type: "deal_to_estimate"` for estimates, `workflow_type: "deal_to_invoice"` for invoice drafts, and `workflow_type: "deal_to_order_handoff"` for order drafts or fulfillment handoffs. Summarize amount, line item count, approval requirement, customer/contact resolution, inventory and lead-time checks for order handoffs, duplicate warnings, blockers, planned records, and source status. Call `start_workflow` only when the user clearly asked to create and preview has no blockers.
5. For HubSpot order or fulfillment handoff prompts such as "move this HubSpot deal to order processing", "create an order draft from this HubSpot Deal", "preview fulfillment handoff", or "check inventory and delivery timing", use `preview_workflow` with `workflow_type: "deal_to_order_handoff"`, `source_system: "hubspot"`, `object_type: "deal"`, and `options.target_system: "sanka"`. Show inventory availability, shortages, lead-time and delivery timing, missing-data limitations, duplicate order or handoff warnings, and `required_confirmation`. Only call `start_workflow` after explicit confirmation, with a stable idempotency key; use `allow_duplicate_order` only when the user explicitly approved another order. HubSpot writeback happens only after successful Sanka order or handoff creation.
6. For deal-to-invoice, freee sync is optional and separate. Multiple invoices for one HubSpot deal require an explicit user request or `allow_multiple_invoices` in options. If the user also wants freee draft sync, compose a second generic workflow: preview `invoice_export` with `source_system: "sanka"`, `object_type: "invoice"`, `target_system: "freee"`, and `sync_scope: "created_in_workflow_run"` using the deal-to-invoice run id, then start it only after explicit approval.
7. For freee invoice draft sync requests, use `preview_workflow` and `start_workflow` with `workflow_type: "invoice_export"` rather than a provider-specific tool. Require an explicit sync scope: `created_in_workflow_run`, `selected_invoice_ids`, `selected_record_ids`, `filtered_unsynced_invoices`, or `all_eligible_unsynced` with `confirm_all`. If the request is ambiguous, do not start sync; return or ask for confirmation options.
8. For HubSpot revenue-control requests such as summarizing this month revenue, unbilled deals, approval waits, unpaid invoices, or blocked revenue, call `preview_workflow` with `workflow_type: "revenue_control_summary"`, `source_system: "hubspot"`, and `object_type: "deal"`. Pass an explicit `date_range` or `start_date`/`end_date` when the user provides one; otherwise the backend defaults safely. Summarize `won`, `quote_drafted`, `approval_pending`, `unbilled`, `invoiced`, `unpaid`, and `blocked`, plus totals by currency, owner, customer, and aging, top blockers, source links, and suggested next actions. This workflow is read-only; do not call `start_workflow` or mutate HubSpot, Sanka, freee, Stripe, invoices, approvals, payments, or platform mappings.
9. For sales incentive or commission requests such as "calculate April commissions", "calculate this month's sales incentives by rep", "show draft commissions", "why was this deal excluded from commission?", or "flag unpaid or low-margin deals", call `preview_workflow` with `workflow_type: "sales_incentive_commission"`, `source_system: "hubspot"`, and `object_type: "deal"`. Pass `period`, `date_range`, `start_date`/`end_date`, `channel_id`, CRM owner, rep, team, customer, `compensation_rule_id` or `plan_id`, `include_records`, `include_excluded`, `include_payment_status`, `include_margin`, `include_refunds`, and limits when the user provides them. Summarize total reps, included/excluded/flagged deals, eligible amount and commission totals by currency, compensation rule version or snapshot, rep summaries, deal-level explanations, exclusions, exceptions, warnings, blockers, and suggested next actions. This workflow is draft/read-only; do not call `start_workflow`, create payout records, approve commissions, write HubSpot/Salesforce deals into Sanka, or mutate HubSpot, Salesforce, Sanka invoices/orders/payments, freee, Stripe, platform mappings, compensation rules, payouts, or approvals.
10. For workflow status requests, call `get_workflow_run` when the user gives a workflow run id or asks for the status of a prior Sanka workflow.
11. For read requests, call the matching `list_*`, `get_*`, `download_*`, or `resolve_record` tool. Ask a concise follow-up only when multiple candidates remain ambiguous.
12. For integration-record reads, keep the generic Sanka tool name. Use `scope: "integration", provider: "salesforce"` for live Salesforce-side reads, and use `scope: "sanka", provider: "salesforce"` for Sanka records linked to Salesforce. If a tool returns `unavailable_reason`, surface it and do not retry as a Sanka-only read unless the user explicitly asks for Sanka-side records.
13. For explicit create or update requests, gather only missing required values, then call the matching generic `create_*`, `update_*`, upload, reply, import, export, sync, or apply tool. Use `target: "sanka"` for Sanka-only writes, `target: "integration"` for provider-only writes, and `target: "both"` only when the Sanka API allows both-side sync.
14. For delete, cancel, archive, or other destructive requests, ask for confirmation unless the user's confirmation is already explicit in the same request. Use `dry_run: true` for provider-side destructive checks when available.
15. For auth or connection requests, call `auth_status` once and surface reconnect instructions from the tool result.
16. For refresh, update, outdated plugin, or missing skill requests, stop live Sanka work and show the refresh prompt below.

Intent routes:
- Deals, HubSpot deal URLs, Salesforce Opportunity quote readiness, estimates, quotes, approvals, order handoffs, fulfillment handoffs, workflow runs: `resolve_record`, `preview_workflow`, `start_workflow`, `get_workflow_run`
- HubSpot revenue summaries, unbilled revenue, approval waits, unpaid invoices, blocked revenue: `preview_workflow` with `workflow_type: "revenue_control_summary"` only
- Sales incentives, sales commissions, draft commission reports, unpaid commission exceptions, low-margin commission exceptions, refund/credit commission exceptions: `preview_workflow` with `workflow_type: "sales_incentive_commission"` only
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
- Do not use Salesforce MCP tools for Sanka quote-readiness actions. Salesforce may be a source record, but Sanka owns readiness checks, approval rules, source references, and permission handling.
- Treat Salesforce quote-readiness previews as read-only and do not call write tools when `preview_workflow` returns `read_only: true`.
- Treat freee invoice draft sync as `workflow_type: "invoice_export"` through generic workflow tools. Do not invent `sync_sanka_invoice_to_freee`, `create_freee_invoice_draft`, or combined HubSpot-to-freee tool names.
- Treat HubSpot deal to order draft and fulfillment handoff as `workflow_type: "deal_to_order_handoff"` through generic `preview_workflow` and `start_workflow`. Do not invent provider-specific tools such as `create_order_from_hubspot_deal`, `hubspot_deal_to_order`, `create_hubspot_order_draft`, `create_fulfillment_from_hubspot_deal`, `check_hubspot_deal_inventory`, or `handoff_hubspot_deal_to_fulfillment`.
- Deal-to-order preview is read-only. Never create orders, create handoff tasks, create platform mappings, or update HubSpot during preview. Order creation and fulfillment handoff require explicit `start_workflow`.
- For deal-to-order handoff, surface inventory and lead-time limitations, duplicate order or handoff warnings, and blockers. HubSpot writeback must be described as happening only after successful Sanka order or handoff creation.
- Treat HubSpot revenue control summary as `workflow_type: "revenue_control_summary"` through generic `preview_workflow`. Do not invent provider-specific summary tools or bucket-specific tools.
- Revenue control summary is read-only. Never call `start_workflow` for it, and do not update HubSpot, Sanka invoices, quotes, approvals, payments, freee, Stripe, or platform mappings while answering a revenue-summary request.
- Revenue control buckets are `won`, `quote_drafted`, `approval_pending`, `unbilled`, `invoiced`, `unpaid`, and `blocked`. If multiple currencies are returned, report totals per currency unless the tool explicitly says conversion was applied.
- Suggested next actions from revenue control summary are recommendations only. Do not perform them unless the user explicitly asks for a separate create, approval, invoice, payment, or sync workflow.
- Treat sales incentive and commission calculation as `workflow_type: "sales_incentive_commission"` through generic `preview_workflow`. Do not invent provider-specific tools such as `calculate_hubspot_commissions`, `calculate_salesforce_commissions`, `calculate_rep_commission`, `get_unpaid_commission_deals`, or bucket-specific commission tools.
- Sales incentive commission calculation is draft/read-only. Never call `start_workflow` for it, and do not update HubSpot, Salesforce, Sanka deals, invoices, orders, payments, freee, Stripe, platform mappings, compensation rules, payout records, or approval state while answering a commission request.
- Commission reports must preserve included/excluded/flagged status and reasons for every returned deal. Surface unpaid, refunded/credited, low-margin, disputed, incomplete, unmapped, missing owner, missing amount, missing currency, and missing compensation-rule exceptions instead of hiding them.
- If multiple currencies are returned in a commission report, report totals per currency unless the tool explicitly says FX conversion was applied.
- Suggested next actions from commission reports are recommendations only. Do not perform them unless the user explicitly asks for a separate supported workflow.
- Do not sync all Sanka invoices to freee by default. `all_eligible_unsynced` requires explicit user confirmation and `confirm_all`.
- Existing freee mappings are duplicate warnings. Re-sync or multiple freee drafts require explicit user intent and `allow_resync` or `allow_multiple_freee_drafts`.
- freee arguments must go through backend-validated `freee_args`; do not send arbitrary freee payloads.
- Do not use or expect Salesforce-specific all-in-one create tools. If a future create flow is explicitly supported and requested, compose generic Sanka tools for company, contact, item, estimate, approval, and workflow-run operations using the returned platform mapping metadata.
- Do not invent provider-specific Sanka tool names such as `list_companies_salesforce` or `create_salesforce_company`. Use existing generic tools with `scope`, `provider`, `channel_id`, `external_object_type`, `target`, `operation`, and `dry_run`.
- Distinguish Sanka-side synced data from live provider-side data: `scope: "sanka", provider: "salesforce"` means Sanka records linked to Salesforce, while `scope: "integration", provider: "salesforce"` means live Salesforce records from the connected channel.
- Preserve returned line item readiness details, including product, quantity, price, currency mismatch, total mismatch, and duplicate-product warnings.
- If the needed Sanka MCP tool is unavailable, show the refresh prompt and stop instead of falling back to local repo files, terminal commands, Django shell, Postgres, HubSpot MCP, or generic web search.
- Do not invent business values, line items, commercial terms, approval outcomes, ids, or URLs that are not supplied by the user or returned by Sanka MCP.
