---
description: Create expense in live Sanka. Use when the user explicitly invokes /sanka:create-expense.
disable-model-invocation: true
argument-hint: "[details to create the record]"
---
# Create Expense

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Gather the required creation details from the request. If key required fields are missing, ask a concise follow-up.
2. Attachments are optional when the user did not provide or require one. If the request includes a receipt, invoice, PDF, screenshot, or other attachment, upload the original file first and keep the returned `file_id`.
   - In local Sanka Plugin clients, when the user provides a local receipt or invoice path, call `upload_expense_attachment` with `local_file_path` set to that exact absolute path. The packaged local proxy reads the original file bytes and forwards `content_base64` to hosted Sanka MCP.
   - For a small, already available `content_base64` payload, call `upload_expense_attachment`.
   - For an oversized client-local PDF/path or when direct upload reports a size limit, call `start_expense_attachment_upload` with the same `local_file_path`, append every chunk with `append_expense_attachment_upload_chunk` using `local_file_path`, the returned `next_offset`, and `local_chunk_size` at or below the returned `chunk_size`, then call `finish_expense_attachment_upload`.
   - Multiple append calls are expected. Do not abandon a user-provided or required attachment or create the expense without its `file_id` only because the upload needs many chunks.
3. Call `create_expense` with the expense fields and any uploaded attachment ids in `attachment_file_ids`.
4. If an upload or create tool returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["expenses:write"] }`. If it returns an explicit reconnect URL such as `connect_url` or `authorization_url`, show that URL verbatim. If it only returns OAuth metadata and not a reconnect URL, tell the user to launch the MCP client's native Sanka OAuth flow or reconnect action for this server, then retry the same Sanka request.
5. Read the created expense back with `get_expense` when attachment confirmation, base currency, or final status matters. Summarize the created expense and surface any returned ids or important fields.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["expenses:write"] }` to surface reconnect metadata. If it only returns metadata, tell the user to start the client-native Sanka OAuth flow.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If `auth_status` returns an explicit reconnect URL such as `connect_url` or `authorization_url`, repeat it verbatim.
- Do not fabricate a manual connect, OAuth, or login URL. Only repeat reconnect URLs returned by `auth_status`.
- If `auth_status` only returns OAuth metadata such as `authorization_server_url`, `resource_metadata_url`, `resource_url`, `reconnect_rpc_method`, or `reconnect_server_name`, tell the user to trigger the MCP client's native Sanka OAuth flow or reconnect action and then retry.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `create_expense` covers the request.
- Do not invent required business values that the user did not provide or clearly imply.
- If the client only exposes a user-provided local attachment path, pass only that exact path as `local_file_path` to the expense attachment upload tools. Do not manually print, summarize, or shuttle base64 through the chat.
- Preserve the original receipt or invoice bytes. Do not compress, rasterize, summarize, or replace a PDF with extracted text unless the original upload actually fails and the user explicitly approves a substitute.
- Do not skip an attachment that the user provided or required unless the upload failed and the user explicitly approves creating the expense without it.
