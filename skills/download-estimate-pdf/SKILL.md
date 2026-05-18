---
description: Download estimate PDF from live Sanka. Use when the user explicitly invokes /sanka:download-estimate-pdf.
disable-model-invocation: true
argument-hint: "<id>"
---
# Download Estimate PDF

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Require the target record identifier. If it is missing, ask a concise follow-up.
2. Call `download_estimate_pdf` directly.
3. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["estimates:read"] }`. If it returns an explicit reconnect URL such as `connect_url` or `authorization_url`, show that URL verbatim. If it only returns OAuth metadata and not a reconnect URL, tell the user to launch the MCP client's native Sanka OAuth flow or reconnect action for this server, then retry the same Sanka request.
4. Complete the PDF transfer before reporting success:
   - If the result has `download_complete: true` and `content_base64`, decode the base64 payload and attach or save the PDF.
   - If the result has `download_complete: false` or `content_base64_available: false`, call `read_binary_download_chunk` with the returned `download_token`, starting at `next_offset` or `0`, until `done: true`. Concatenate each `content_base64` chunk in offset order, decode the combined base64, and attach or save the decoded PDF.
   - If chunk reading is unavailable, the token expired, or decoding fails, say the PDF download is not complete and retry the PDF tool; do not report it as downloaded from metadata alone.
5. If the PDF tool returns `404` after the record was visible earlier, verify the current workspace with `current_workspace` or `list_workspaces`, switch with `switch_workspace` using the internal workspace UUID, then retry the same PDF tool. Do not treat numeric record numbers as globally safe across workspaces.
6. Return the completed PDF result clearly, including the filename, byte length, and where the file was attached or saved.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["estimates:read"] }` to surface reconnect metadata. If it only returns metadata, tell the user to start the client-native Sanka OAuth flow.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If `auth_status` returns an explicit reconnect URL such as `connect_url` or `authorization_url`, repeat it verbatim.
- Do not fabricate a manual connect, OAuth, or login URL. Only repeat reconnect URLs returned by `auth_status`.
- If `auth_status` only returns OAuth metadata such as `authorization_server_url`, `resource_metadata_url`, `resource_url`, `reconnect_rpc_method`, or `reconnect_server_name`, tell the user to trigger the MCP client's native Sanka OAuth flow or reconnect action and then retry.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `download_estimate_pdf` covers the request.
- Do not tell the user the PDF was downloaded or saved unless the base64 bytes were decoded and attached or saved, either from `content_base64` or from a complete set of chunks.
