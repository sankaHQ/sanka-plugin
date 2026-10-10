---
name: export-presentation
description: Export a presentation to PowerPoint, PDF or Google Slides. Use when the user explicitly invokes /sanka:export-presentation.
disable-model-invocation: true
argument-hint: "[presentation or export details]"
---
# Export Presentation

Use the attached Sanka MCP tools. For the complete authoring workflow, see [Presentations](../presentations/SKILL.md).

Workflow:

1. Preview slides and fix overflow, then call `export_presentation` with the chosen format, a fresh idempotency key and expected workspace ID. Reuse the key only for retries of that export. Poll `get_presentation_export` until terminal. Google Slides requires the requesting user’s personal Google Drive connection and the workspace pilot; each new export creates a new file.
2. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["documents:write"] }`. Include `required_user_facing_reply` verbatim when present; otherwise show `connect_url` verbatim. If neither is present, report that Connect Sanka could not be started and stop without attempting client-native OAuth. After the user connects, retry the same Sanka request.
3. Report the result and relevant links from the tool response.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["documents:write"] }` to surface Connect Sanka metadata.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- Do not fabricate a connect, OAuth, or login URL. Only repeat the Connect Sanka URL returned by `auth_status`.
- Do not start or recommend client-native OAuth. Hosted Sanka MCP authentication uses only the Connect Sanka session exchange.
- If `auth_status` returns `required_user_facing_reply`, include it verbatim; otherwise repeat `connect_url` verbatim.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Keep the selected workspace, presentation and optional program IDs consistent across calls.
- Preserve supplied facts and existing slides outside the requested edits.
