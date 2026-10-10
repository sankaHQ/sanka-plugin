---
name: download-presentation-export
description: Retrieve a completed PowerPoint or PDF file through MCP. Use when the user explicitly invokes /sanka:download-presentation-export.
disable-model-invocation: true
argument-hint: "[presentation or export details]"
---
# Download Presentation Export

Use the attached Sanka MCP tools. For the complete authoring workflow, see [Presentations](../presentations/SKILL.md).

Workflow:

1. Call `download_presentation_export`. Save or attach bytes using the returned download URL or `read_binary_download_chunk` before claiming the file was downloaded. For Google Slides return its editable link; for files exceeding the MCP limit use `app_download_url`.
2. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["documents:read"] }`. Include `required_user_facing_reply` verbatim when present; otherwise show `connect_url` verbatim. If neither is present, report that Connect Sanka could not be started and stop without attempting client-native OAuth. After the user connects, retry the same Sanka request.
3. Report the result and relevant links from the tool response.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["documents:read"] }` to surface Connect Sanka metadata.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- Do not fabricate a connect, OAuth, or login URL. Only repeat the Connect Sanka URL returned by `auth_status`.
- Do not start or recommend client-native OAuth. Hosted Sanka MCP authentication uses only the Connect Sanka session exchange.
- If `auth_status` returns `required_user_facing_reply`, include it verbatim; otherwise repeat `connect_url` verbatim.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Keep the selected workspace, presentation and optional program IDs consistent across calls.
- Preserve supplied facts and existing slides outside the requested edits.
