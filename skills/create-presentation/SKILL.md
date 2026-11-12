---
name: create-presentation
description: Create a Sanka Doc presentation from slides, Markdown or an existing Doc. Use when the user explicitly invokes /sanka:create-presentation.
disable-model-invocation: true
argument-hint: "[presentation or export details]"
---
# Create Presentation

Use the attached Sanka MCP tools. For the complete authoring workflow, see [Presentations](../presentations/SKILL.md).

Workflow:

1. Call `current_workspace` and pass its internal ID as `expected_workspace_id`. Use one source: slides, Markdown or a source Doc. Show a saved Sanka diagram with a `sankaDiagram` block (its `diagramId` from `list_ferry_diagrams`) so the slide follows later diagram edits. Call `create_presentation`, then `preview_presentation` and fix overflow before presenting the result.
2. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["documents:write"] }`. Tell the user to reconnect Sanka in their AI client (standard OAuth sign-in on Sanka), following its `reconnect_instructions`. After the user reconnects, retry the same Sanka request.
3. Report the result and relevant links from the tool response.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["documents:write"] }` and follow its `reconnect_instructions`.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- Do not fabricate a connect, OAuth, or login URL.
- Sanka uses standard MCP OAuth: the AI client signs the user in on Sanka's own page. Never ask the user to paste a token, password or URL.
- If `auth_status` reports that Sanka is not connected, tell the user to reconnect Sanka in their AI client and follow its `reconnect_instructions`.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Keep the selected workspace, presentation and optional program IDs consistent across calls.
- Preserve supplied facts and existing slides outside the requested edits.
