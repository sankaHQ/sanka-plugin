---
description: Upload an import file into live Sanka. Use when the user explicitly invokes /sanka:upload-import-file.
disable-model-invocation: true
argument-hint: "<filename and base64 file content>"
---
# Upload Import File

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Require `filename` and `content_base64`. If either is missing, ask a concise follow-up.
2. Pass through `object_type` and `mime_type` only when the user explicitly provides them.
3. Call `upload_import_file` directly.
4. If the direct tool call returns `Auth required`, call `auth_status` exactly once. Tell the user to reconnect Sanka in their AI client (standard OAuth sign-in on Sanka), following its `reconnect_instructions`. After the user reconnects, retry the same Sanka request.
5. Return the uploaded file result clearly, especially the `file_id` needed for the next import step.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If the direct tool call returns `Auth required`, call `auth_status` exactly once and follow its `reconnect_instructions`.
- If `auth_status` reports that Sanka is not connected, tell the user to reconnect Sanka in their AI client and follow its `reconnect_instructions`.
- Do not fabricate a connect, OAuth, or login URL.
- Sanka uses standard MCP OAuth: the AI client signs the user in on Sanka's own page. Never ask the user to paste a token, password or URL.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `upload_import_file` covers the request.
- Do not claim the import is running yet. This skill only uploads the file and returns a `file_id`.
