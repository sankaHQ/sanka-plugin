---
description: Reply from a shared workspace inbox in live Sanka. Use when the user explicitly invokes /sakura:reply-workspace-message-thread.
disable-model-invocation: true
argument-hint: "<thread id and reply body>"
---
# Reply Workspace Message Thread

Use only the attached Sakura MCP tools in this thread.

Workflow:

1. Require `thread_id` and the reply `body`. If either is missing, ask a concise follow-up.
2. Verify that the user explicitly asked to send this exact reply. A request to draft, write, compose, revise, or show a reply is not send authorization; in that case, return the draft without calling the send tool.
3. Call `reply_workspace_message_thread` directly with `confirm_send: true` only after that explicit send request.
4. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["workspace_messages:write"] }`. If it returns an explicit reconnect URL such as `connect_url` or `authorization_url`, show that URL verbatim. If it only returns OAuth metadata and not a reconnect URL, tell the user to launch the MCP client's native Sanka OAuth flow or reconnect action for this server, then retry the same Sanka request.
5. Confirm the sent reply only after the tool succeeds, and state the actual `sender_email` returned by the tool. Never infer the sender from the channel label or authenticated account.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["workspace_messages:write"] }` to surface reconnect metadata. If it only returns metadata, tell the user to start the client-native Sanka OAuth flow.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If `auth_status` returns an explicit reconnect URL such as `connect_url` or `authorization_url`, repeat it verbatim.
- Do not fabricate a manual connect, OAuth, or login URL. Only repeat reconnect URLs returned by `auth_status`.
- If `auth_status` only returns OAuth metadata such as `authorization_server_url`, `resource_metadata_url`, `resource_url`, `reconnect_rpc_method`, or `reconnect_server_name`, tell the user to trigger the MCP client's native Sanka OAuth flow or reconnect action and then retry.
- Do not call discovery tools as a preflight. Call `reply_workspace_message_thread` directly.
- Do not use `reply_private_message_thread` for a workspace integration inbox, `/conversation`, Contact Conversation, shared inbox, group inbox, or workspace inbox thread.
- Do not call the send tool for drafting-only requests, and never set `confirm_send: true` without an explicit user request to send the exact reply.
- If the tool reports a sender identity mismatch or missing provider thread metadata, stop and report the error. Do not fall back to a personal Gmail account or send as a different identity.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `reply_workspace_message_thread` covers the request.
- If `auth_status` returns an explicit reconnect URL such as `connect_url` or `authorization_url`, repeat it verbatim. Do not fabricate a manual connect, OAuth, or login URL.
