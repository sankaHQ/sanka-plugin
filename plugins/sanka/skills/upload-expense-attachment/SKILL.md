---
description: Upload expense attachment into live Sanka. Use when the user explicitly invokes /sanka:upload-expense-attachment.
disable-model-invocation: true
argument-hint: "[upload details]"
---
# Upload Expense Attachment

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Gather the required upload details from the request. If key required fields are missing, ask a concise follow-up.
2. In local Sanka plugin clients, when the user provides a local receipt or invoice path, call `upload_expense_attachment` with `local_file_path` set to that exact absolute path. The packaged local proxy reads the original file bytes and forwards `content_base64` to hosted Sanka MCP.
3. For a small, already available `content_base64` payload, call `upload_expense_attachment` directly.
4. For oversized client-local PDFs or when direct upload reports a size limit, use `start_expense_attachment_upload` with the same `local_file_path`, then `append_expense_attachment_upload_chunk` with `local_file_path`, the returned `next_offset`, and `local_chunk_size` at or below the returned `chunk_size`, then `finish_expense_attachment_upload`.
5. Once `start_expense_attachment_upload` succeeds, finish the upload sequence. Multiple append calls are expected; do not abandon the attachment only because the upload needs many chunks.
6. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["expenses:write"] }`. Include `required_user_facing_reply` verbatim when present; otherwise show `connect_url` verbatim. If neither is present, report that Connect Sanka could not be started and stop without attempting client-native OAuth. After the user connects, retry the same Sanka request.
7. Summarize the uploaded result clearly, including the returned `file_id`.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["expenses:write"] }` to surface Connect Sanka metadata.
- If `auth_status` returns `required_user_facing_reply`, include it verbatim; otherwise repeat `connect_url` verbatim.
- Do not fabricate a connect, OAuth, or login URL. Only repeat the Connect Sanka URL returned by `auth_status`.
- Do not start or recommend client-native OAuth. Hosted Sanka MCP authentication uses only the Connect Sanka session exchange.
- If the client only exposes a user-provided local attachment path, pass only that exact path as `local_file_path` to the expense attachment upload tools. Do not manually print, summarize, or shuttle base64 through the chat.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `upload_expense_attachment` covers the request.
- Preserve the original receipt or invoice bytes. Do not compress, rasterize, summarize, or replace a PDF with extracted text unless the original upload actually fails and the user explicitly approves a substitute.
