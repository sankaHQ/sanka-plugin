---
name: presentations
description: Create and revise Sanka Doc presentations, preview slides and export PowerPoint, PDF or Google Slides. Use when the user explicitly invokes /sanka:presentations.
disable-model-invocation: true
argument-hint: "[deck brief or presentation to edit]"
---
# Presentations

Use the attached Sanka MCP presentation tools for routine Sanka Doc decks. Preserve an explicit request for another presentation product or format.

Workflow:

1. Call `get_presentation_catalog` once per session. For writes, call `current_workspace` and carry its internal ID as `expected_workspace_id`; include `program_id` for migration program Docs and omit it for Sanka Flow Docs.
2. Outline first: one message per slide with a title stating the point. Aim for at most six bullets of 80 characters each (40 for Japanese). Preserve supplied facts, names and figures exactly. Write Japanese explanations in natural ですます.
3. Choose blocks by content shape, with one accent emphasis per slide. Images need descriptive alt text and asset IDs returned by the presentation upload or import tools.
4. Call `create_presentation`, then `preview_presentation` in batches of six. Fix every `SLIDE_OVERFLOW` by shortening, splitting or changing layout. Preview changed slides again.
5. Before editing, call `get_presentation` and use its revision. Prefer targeted ops. On a 409 conflict, read again and reapply only the intended change. Preserve other people’s slides unless deletion was requested.
6. When an export is requested, call `export_presentation`, poll `get_presentation_export` until terminal, then give the presentation’s `app_url` and the Google Slides or file download link. Use a fresh idempotency key per new export, retaining it only for a retry of the same operation.

Guardrails:
- Do not invent missing figures or silently switch workspace or program.
- Do not claim an export succeeded while it is queued or running, or a file is attached before saving or attaching its bytes.
- Google Slides export requires the workspace pilot and the requesting user’s personal Google Drive connection. Use the returned account-settings link for connection problems. Never use another user’s grant. Every new export creates a separate editable file; later edits in Google Slides do not sync back.
- Use `download_presentation_export` only when PowerPoint or PDF bytes are needed. It returns a session-bound URL or chunk token; complete that transfer before reporting a download.
- Exporting does not authorize changing sharing permissions or sending the deck to anyone.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["documents:write"] }` to surface Connect Sanka metadata.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If `auth_status` returns `required_user_facing_reply`, include it verbatim; otherwise repeat `connect_url` verbatim.
- Do not fabricate a connect, OAuth, or login URL. Only repeat the Connect Sanka URL returned by `auth_status`.
- Do not start or recommend client-native OAuth. Hosted Sanka MCP authentication uses only the Connect Sanka session exchange.
- Do not use local repo files, shell or database access as a fallback for live Sanka data.
