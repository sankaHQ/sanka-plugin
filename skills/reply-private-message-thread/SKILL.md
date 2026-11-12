---
description: Reply to a private inbox thread in live Sanka. Use when the user explicitly invokes /sanka:reply-private-message-thread.
disable-model-invocation: true
argument-hint: "<thread id and reply body>"
---
# Reply Private Message Thread

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Require `thread_id` and the reply `body`. If either is missing, ask a concise follow-up.
2. Verify that the user explicitly asked to send this exact reply. A request to draft, write, compose, revise, or show a reply is not send authorization; in that case, return the draft without calling the send tool.
3. Call `reply_private_message_thread` directly with `confirm_send: true` only after that explicit send request.
4. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["account_messages:write"] }`. Tell the user to reconnect Sanka in their AI client (standard OAuth sign-in on Sanka), following its `reconnect_instructions`. After the user reconnects, retry the same Sanka request.
5. Confirm the sent reply only after the tool succeeds, and state the actual `sender_email` returned by the tool. Never infer the sender from the channel label or authenticated account.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["account_messages:write"] }` and follow its `reconnect_instructions`.
- If `auth_status` reports that Sanka is not connected, tell the user to reconnect Sanka in their AI client and follow its `reconnect_instructions`.
- Do not fabricate a connect, OAuth, or login URL.
- Sanka uses standard MCP OAuth: the AI client signs the user in on Sanka's own page. Never ask the user to paste a token, password or URL.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `reply_private_message_thread` covers the request.
- This skill is only for the authenticated user private inbox, not the shared group inbox.
- Do not call the send tool for drafting-only requests, and never set `confirm_send: true` without an explicit user request to send the exact reply.
- If the tool reports a sender identity mismatch or missing provider thread metadata, stop and report the error. Do not fall back to another Gmail account or send as a different identity.
