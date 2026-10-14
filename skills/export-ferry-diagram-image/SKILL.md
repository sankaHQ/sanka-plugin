---
name: export-ferry-diagram-image
description: Render a saved Sanka diagram as a PNG image. Use when the user explicitly invokes /sanka:export-ferry-diagram-image.
disable-model-invocation: true
argument-hint: "[diagram name or ID]"
---
# Export Sanka Diagram Image

Use the attached Sanka MCP tools. To put a diagram on slides, see [Presentations](../presentations/SKILL.md).

Workflow:

1. When only a name is given, find the diagram with `list_ferry_diagrams`. Call `export_ferry_diagram_image` with its `diagram_id`. The PNG shows the diagram's latest revision as the diagram editor draws it, at twice its size.
2. Save or attach the bytes using the returned download URL or `read_binary_download_chunk` before claiming the file was saved.
3. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["ferry_diagrams:read"] }`. Include `required_user_facing_reply` verbatim when present; otherwise show `connect_url` verbatim. If neither is present, report that Connect Sanka could not be started and stop without attempting client-native OAuth. After the user connects, retry the same Sanka request.
4. Report the diagram revision, the image size and the download link from the tool response.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["ferry_diagrams:read"] }` to surface Connect Sanka metadata.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If `auth_status` returns `required_user_facing_reply`, include it verbatim; otherwise repeat `connect_url` verbatim.
- Do not fabricate a connect, OAuth, or login URL. Only repeat the Connect Sanka URL returned by `auth_status`.
- Do not start or recommend client-native OAuth. Hosted Sanka MCP authentication uses only the Connect Sanka session exchange.
- For a slide, prefer a `sankaDiagram` block in the presentation: it stays in sync with the diagram, while an exported PNG keeps the revision it was drawn from.
- An empty diagram (`DIAGRAM_EMPTY`) has nothing to draw; add shapes to it first.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
