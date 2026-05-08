---
description: Check whether a Salesforce Opportunity is ready for governed quote creation using Sanka readiness and approval data. Use when the user asks whether a Salesforce Opportunity can be quoted or asks for blockers before quote creation.
disable-model-invocation: true
argument-hint: "[Salesforce Opportunity URL, Opportunity id, Sanka deal id, or request details]"
---

# Quote Readiness

Use only the attached Sanka MCP tools in this thread. This is a read-only Sanka workflow that checks Salesforce Opportunity quote readiness before any quote creation or workflow start.

Workflow:

1. Extract the Salesforce Opportunity reference. For a Salesforce Opportunity URL, pass it as `source_record.url` with `source_system: "salesforce"` and `object_type: "opportunity"`. For a Salesforce Opportunity id, pass it as `source_record.record_id`.
2. If the user gives only a company, deal, or opportunity phrase, call `resolve_record` first and ask a concise follow-up only when multiple candidates remain ambiguous.
3. Call `preview_workflow` with `workflow_type: "quote_readiness"` before any write. The hosted tool routes Salesforce quote-readiness through Sanka's `/api/v1/salesforce/*` API surface. Summarize `ready`, `target_record`, `financials`, line item checks, `approval`, hard blockers, warnings, suggested fixes, Salesforce source records, and Sanka records.
4. Stop after the preview result. Do not call `start_workflow`, create quotes, create estimates, or generate quote drafts for this workflow.
5. If the user explicitly asks to update Salesforce fields, only proceed when a dedicated Sanka MCP tool exposes safe writeback. Do not use generic code execution, local files, Salesforce MCP, or direct Salesforce APIs as a fallback.
6. If a Sanka MCP response includes `refresh_required`, `refresh_recommended`, or `suggested_user_facing_reply`, pause the workflow and show the refresh prompt before making further calls.

Refresh prompt:

```text
Sanka Plugin may be outdated.
This action needs a newer Sanka workflow skill.

Update Sanka Plugin?
Reply "yes" and Codex will run the refresh flow:

Refresh sanka-plugin. Reinstall it if needed, then make the new Sanka skills available.
```

Guardrails:
- Do not use Salesforce MCP tools for this workflow. Salesforce is only the source system; Sanka owns readiness rules, validation, source references, and permission checks.
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["deals:read","workflows:read"] }` to surface reconnect metadata. If it only returns metadata, tell the user to start the client-native Sanka OAuth flow.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If `preview_workflow` is unavailable, show the refresh prompt and stop instead of falling back to local repo files, terminal commands, Django shell, Postgres, Salesforce MCP, HubSpot MCP, or generic web search.
- If `auth_status` returns an explicit reconnect URL such as `connect_url` or `authorization_url`, repeat it verbatim.
- Do not fabricate a manual connect, OAuth, or login URL. Only repeat reconnect URLs returned by `auth_status`.
- If `auth_status` only returns OAuth metadata such as `authorization_server_url`, `resource_metadata_url`, `resource_url`, `reconnect_rpc_method`, or `reconnect_server_name`, tell the user to trigger the MCP client's native Sanka OAuth flow or reconnect action and then retry.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `preview_workflow` covers the request.
- Do not create quotes, estimates, orders, line items, or approval requests from quote readiness.
- Treat the preview as read-only. If the response includes `read_only: true`, preserve that in the summary and do not call write tools.
- Preserve returned line item readiness details, including product, quantity, price, currency mismatch, total mismatch, and duplicate-product warnings.
- Do not auto-fill pricing, quantity, discounts, currency, tax, payment terms, or other financial fields.
- Do not invent Salesforce or Sanka records, links, blockers, warnings, fixes, approval rules, or permission status that are not returned by Sanka MCP.
