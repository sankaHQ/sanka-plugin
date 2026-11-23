---
description: Answer a question from the user's own HubSpot, Salesforce, Google Calendar or Gmail with Sanka read Actions, read live as their own login, with the price told first and the method given with every number. Use when the user explicitly invokes /sanka:read-actions or asks Sanka for searches, totals, pipeline or win rate in their own CRM, their meetings, or a search of their own mail.
disable-model-invocation: true
argument-hint: "[the question about your own CRM, calendar or mail]"
---
# Read Actions

Use only the attached Sanka MCP tools in this thread.

Read Actions answer a person's question from their own HubSpot, Salesforce, Google Calendar or Gmail, read live with the login they connected under Personal integrations in their Sanka account settings. That system's own permissions decide which records they see, so a rep, a manager and an executive asking the same question get different rows. Nothing in the CRM, calendar or mail is changed. Each completed run costs the Action's Sanka Credits, an empty result too; listing Actions and reading a run are free, and refused or failed runs cost nothing.

Workflow:

1. Check the question is a read Action: searches, counts and totals (grouped by stage, owner or month), a record lookup with its related records, open pipeline or win rate in the person's own HubSpot or Salesforce; their own Google Calendar events between two dates or their meeting load; a search of their own Gmail. Sanka's own records keep `query_records` and `aggregate_records`, Sanka's booking calendar keeps the calendar tools, and Sanka's synced inboxes keep the private and workspace message tools.
2. Call `list_read_actions`. Pick the Action whose system and kind fit the question (`key` such as `hubspot:crm.aggregate`, `salesforce:metric.win_rate`, `google_calendar:events.meeting_load` or `gmail:messages.search`). When the person did not say which CRM and both are listed, ask. When the Action's login is not connected, give its connect link (`connect_url`) and stop; nothing was charged.
3. Fill the inputs from the Action's `input_schema`, with the system's own field names (`dealstage`, `closedate`, `StageName`, `CloseDate`) and ISO dates (`YYYY-MM-DD`). Pass the person's time zone and working hours for calendar Actions when known. Ask a concise follow-up for a required input the person did not give, such as the period; never invent ids, stage values or owners.
4. The first time in a conversation, tell the person the Action's price in Sanka Credits a run (the `credits` from `list_read_actions`), that it reads their own login, and that a refused or failed run costs nothing. When the question needs more than one run, say what they cost together.
5. Call `run_read_action` with `action_key` and `inputs`. Leave `client_key` out for a new question; pass the same `client_key` only to retry a call whose answer did not come back. When the run is `running`, read it with `get_read_action_run` and its `run_id`; do not run it again.
6. Answer with the numbers and the method: the filters, records scanned, `as_of`, and the currency for amounts, and say they are the records the person's own login can see. Keep amounts in different currencies apart. For meeting load give the result's formula; for win rate give the rate by count and by amount with its won and closed totals. For Gmail say it read senders, recipients, subjects, dates and snippets only, and that `result_size_estimate` is Gmail's estimate, not a count.
7. When `method.complete` is false, or a search says more records match than were returned (`more: true`), never present the numbers as complete totals: say they are partial, or ask the person to narrow the question and run it again.
8. A lookup with `status: "ambiguous"` lists candidates: show them, ask which one, and look up the chosen id (a new run at the same price). `not_found` means no record the person's login can see matched.
9. When the result says `reused: true`, it is an earlier run of the same question and nothing was charged again; say when it was read (`as_of`). To read the system again now, run it again without that `client_key`.
10. Read an earlier run with `get_read_action_run` when the person gives its `run_id` or asks about it again. It is free and shows the system as it was at `as_of`.
11. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["read_actions:read","read_actions:write"] }`. Tell the user to reconnect Sanka in their AI client (standard OAuth sign-in on Sanka), following its `reconnect_instructions`. After the user reconnects, retry the same Sanka request.

When something stops the run (nothing is charged for any of these):

- `READ_ACTION_CONNECT_REQUIRED`: the person has not connected their own HubSpot, Salesforce or Google login, or it needs reconnecting. Give the connect link (`connect_url`) to Personal integrations, then run again after they connect. For Gmail with `details.reason: "read_access_required"`, they must give Sanka read access to Gmail there; a Gmail connection only sends by default.
- `READ_ACTION_CREDITS_REQUIRED`: the workspace's Sanka Credits ran out (the details give the credits required and available). A workspace admin can add Sanka Credits; run it again after that.
- `READ_ACTION_TOO_BROAD`: more records match than can be counted completely, or the calendar range holds too many events. Ask the person to narrow the filter (a date range, stage, owner or pipeline, or a shorter range) and run again. Never estimate the total.
- `READ_ACTION_DAILY_LIMIT`: the person reached their daily limit of Sanka Credits for read Actions. It lifts the next day.
- `READ_ACTION_INPUT_INVALID`: fix what the details name against the Action's `input_schema`, then run again.
- `READ_ACTION_PROVIDER_ERROR`: the CRM or Google refused or failed with the message given. Tell the person; when it names a field, fix the filter, otherwise try later.
- `READ_ACTION_KEY_REUSED`: the `client_key` belongs to a different question; leave it out for a new question.
- `READ_ACTION_NOT_FOUND`: no such Action or run for this person. Call `list_read_actions` again; only the person who ran a run can read it.
- `FEATURE_DISABLED`: read Actions are not available in this workspace yet; a workspace admin can ask Sanka to turn them on. Say so, and do not quietly answer from other data. For a CRM question, offer `query_records` or `aggregate_records` with `scope: "integration"` only if the person wants it, and say those numbers come from the workspace's connection, not their own login.
- `WORKSPACE_CONTEXT_MISMATCH`, or no workspace selected: check `current_workspace` (or pick one with `list_workspaces` and `switch_workspace`), then ask again in the intended workspace.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["read_actions:read","read_actions:write"] }` and follow its `reconnect_instructions`.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If `auth_status` reports that Sanka is not connected, tell the user to reconnect Sanka in their AI client and follow its `reconnect_instructions`.
- Do not fabricate a connect, OAuth, or login URL.
- Sanka uses standard MCP OAuth: the AI client signs the user in on Sanka's own page. Never ask the user to paste a token, password or URL.
- Never present an incomplete result (`method.complete` false, or `more: true`) as a complete total, and never estimate, extrapolate or fill in missing numbers.
- Never loop, page or split one question into several runs to get around `READ_ACTION_TOO_BROAD`, the daily limit or the Sanka Credits. Each run is charged.
- Give the method (filters, records scanned, as of) with every number.
- Take Action keys and input names from `list_read_actions`; do not invent them, or field names, stage values, owner ids or record ids.
- Read Actions change nothing. Do not use them, or any other tool, to change records, events or mail for this request.
- Gmail results hold headers and snippets only: never claim to have read a message body or attachment.
- Do not swap in another tool's HubSpot, Salesforce, calendar or mail data for a read Action answer without saying where it comes from.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when the read Action tools cover the request.
