---
description: Score a company or deal in live Sanka. Use when the user explicitly invokes /sanka:score-record.
disable-model-invocation: true
argument-hint: "<object type and record id>"
---
# Score Record

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. Require `object_type` and `record_id`. If either is missing, ask a concise follow-up.
2. Pass through `score_model_id` only when the user explicitly provides or asks for it.
3. Call `score_record` directly.
4. If the direct tool call returns `Auth required`, call `auth_status` exactly once. Tell the user to reconnect Sanka in their AI client (standard OAuth sign-in on Sanka), following its `reconnect_instructions`. After the user reconnects, retry the same Sanka request.
5. Summarize the returned score, band, and explanation clearly.

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
- Do not call `search_docs` or `execute` when `score_record` covers the request.
- Do not guess the target record when the user has not identified it clearly.
