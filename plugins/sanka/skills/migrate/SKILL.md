---
description: Resume or prepare a Sanka data migration using persisted journey state and reviewable results. Use when the user explicitly invokes /sanka:migrate.
disable-model-invocation: true
argument-hint: "[source, destination, migration, or requested scope]"
---
# Migrate Data

Use attached Sanka migration tools. The API owns execution state and prerequisites.
Load this workflow only for migration requests, including when routed here by the Sanka entrypoint; narrower tools remain individually usable. Before changing Program configuration, mappings, transfer state, ingestion, repair, review or code migration evidence, read [operation details](references/operations.md) for the relevant safety requirements.

Workflow:

1. Discover the intended workspace with `list_workspaces` and existing migrations with `list_migrations` when IDs are unknown. Pin the internal workspace UUID, program, migration, source and destination endpoint IDs throughout. Inspect existing connections/program configuration before asking for information already available. Ask only when the intended migration is ambiguous or a required decision remains unresolved.
2. Read `get_migration_journey` first. Reuse current persisted artifacts and follow the API's available next action and prerequisites. The grouped assessment, plan, scan/mapping and transfer/cutover stages may repeat. Free assessment/research is separate; do not claim that a record migration has performed it.
3. For an all-data request, establish object, property and relationship scope from available inventory and configuration. Report unsupported or uninspected portions explicitly. Use existing Programs/endpoints to create a migration only when no matching migration exists. Do not silently choose between multiple possible endpoints.
4. Use `start_migration_plan` only when the existing journey requires planning. Reuse valid plans; request a forced refresh only for an explicitly requested fresh scan/re-plan. Read the result and relevant evidence before requesting a decision. A queued response is not completion. After an uncertain response, inspect persisted state before resubmitting; avoid tight polling and respect returned retry guidance.
5. Use `get_migration_result` to fetch only relevant detailed sections, objects or problems referenced by the journey. Follow returned paths and offsets with `expected_result_version`; oversized-value references and truncated pages are not absent evidence. Small rows may be inline. Keep full evidence persisted in Sanka. Preserve totals, pagination and truncation; fetch all safety evidence required to review the selected transfer scope. A compact summary alone never establishes approval. Re-read changed or stale artifacts, and never silently substitute a different reviewed plan hash.
6. Use inventory, mapping and write-free sample validation tools as needed. Report saved mappings, unmapped portions, sample limits and blockers. A diagram or collaboration document is not an executable mapping. Resolve blockers through the owning configuration or mapping tools and recheck prerequisites.
7. Start destination writes only under explicit authorization for the pinned workspace, migration, exact reviewed plan hash and selected route scope. Preserve the authorized scope and idempotency key after uncertain outcomes. Inspection or planning authorization does not authorize apply, repair, paid review or other charges. Read API controls before pause/resume/cancel; cancellation does not roll back written data.
8. Return concise actual outputs and real returned review/result/monitoring links. Include result version, state, relevant counts, scope limits, outstanding decisions and next action. Say when a link is unavailable; never construct one. Preserve unknown counts versus zero, queued versus completed, and transfer completion versus verification completion. Report performed and unperformed checks, discrepancies, failed/skipped records and remaining repair failures. A missing or failed verification report is not successful verification.

Guardrails:
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- If the direct tool call returns `Auth required`, call `auth_status` exactly once to surface Connect Sanka metadata.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If `auth_status` returns `required_user_facing_reply`, include it verbatim; otherwise repeat `connect_url` verbatim.
- Do not fabricate a connect, OAuth, or login URL. Only repeat the Connect Sanka URL returned by `auth_status`.
- Do not start or recommend client-native OAuth. Hosted Sanka MCP authentication uses only the Connect Sanka session exchange.
- Keep every migration read/write bound to the same pinned workspace; never rely on mutable current-workspace state.
- Do not use local files, terminal commands or a database as a fallback for live migration state.
- Preserve required transfer safety evidence even when it increases response size.
