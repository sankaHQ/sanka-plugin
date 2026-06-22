---
description: Upload expense attachment into live Sanka. Use when the user explicitly invokes /sanka:upload-expense-attachment.
disable-model-invocation: true
argument-hint: "[upload details]"
---
# Upload Expense Attachment

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Gather the required upload details from the request. If key required fields are missing, ask a concise follow-up.
2. In local Sanka Plugin clients, when the user provides a local receipt or invoice path, call `upload_expense_attachment` with `local_file_path` set to that exact absolute path. The packaged local proxy reads the original file bytes and forwards `content_base64` to hosted Sanka MCP.
3. For a small, already available `content_base64` payload, call `upload_expense_attachment` directly.
4. For oversized client-local PDFs or when direct upload reports a size limit, use `start_expense_attachment_upload` with the same `local_file_path`, then `append_expense_attachment_upload_chunk` with `local_file_path`, the returned `next_offset`, and `local_chunk_size` at or below the returned `chunk_size`, then `finish_expense_attachment_upload`.
5. Once `start_expense_attachment_upload` succeeds, finish the upload sequence. Multiple append calls are expected; do not abandon the attachment only because the upload needs many chunks.
6. If any upload tool returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["expenses:write"] }`. If it returns an explicit reconnect URL such as `connect_url` or `authorization_url`, show that URL verbatim. If it only returns OAuth metadata and not a reconnect URL, tell the user to launch the MCP client's native Sanka OAuth flow or reconnect action for this server, then retry the same Sanka request.
7. Summarize the uploaded result clearly, including the returned `file_id`.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["expenses:write"] }` to surface reconnect metadata. If it only returns metadata, tell the user to start the client-native Sanka OAuth flow.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If `auth_status` returns an explicit reconnect URL such as `connect_url` or `authorization_url`, repeat it verbatim.
- Do not fabricate a manual connect, OAuth, or login URL. Only repeat reconnect URLs returned by `auth_status`.
- If `auth_status` only returns OAuth metadata such as `authorization_server_url`, `resource_metadata_url`, `resource_url`, `reconnect_rpc_method`, or `reconnect_server_name`, tell the user to trigger the MCP client's native Sanka OAuth flow or reconnect action and then retry.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- If the client only exposes a user-provided local attachment path, pass only that exact path as `local_file_path` to the expense attachment upload tools. Do not manually print, summarize, or shuttle base64 through the chat.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `upload_expense_attachment` covers the request.
- Preserve the original receipt or invoice bytes. Do not compress, rasterize, summarize, or replace a PDF with extracted text unless the original upload actually fails and the user explicitly approves a substitute.
