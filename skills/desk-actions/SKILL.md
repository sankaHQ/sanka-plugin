---
description: Ask Sanka Desk, the company's IT service desk, for an IT change such as a HubSpot, Salesforce, Google Workspace, Microsoft 365, Okta, Slack or Sanka Flow account, access or license, previewed and confirmed before anything is filed. Use when the user explicitly invokes /sanka:desk-actions or asks Sanka to run a Desk Action.
disable-model-invocation: true
argument-hint: "[the IT change in your own words, and who it is for]"
---
# Desk Actions

Use only the attached Sanka MCP tools in this thread.

Sanka Desk is the company's IT service desk. Desk Actions are the changes Sanka Bot and Desk Workflows make in the company's systems, such as `hubspot_account_setup`. From an AI client the connected person asks for one as the requester: each integration's rule, set by the company's admin, says whether they may start it, and Desk's approvals still apply. No tool approves anything, and nothing is filed before the person says yes to the preview.

Workflow:

1. Call `desk_list_actions` and pick the Action whose `purpose` fits the request. Read its `not_for`, `systems`, `executable` and `access.mode` (`run`; `request`, which always waits for an approver; `none`, which is refused). When none fits, or the mode is `none`, offer to file an ordinary IT request with `desk_create_ticket` in the person's words instead.
2. Fill the Action's inputs from its `inputs_schema`. Ask a concise follow-up for a required input the person did not give, such as the e-mail of the person the change is for; never invent one.
3. Call `desk_preview_action` with the `operation_key` and `inputs`. Nothing is filed and nothing changes yet.
4. Show the preview: the planned changes per system and which of them the company's admin carries out by hand, the risk, who would approve it (`decision` `needs_approval` names them), and the Sanka Credits it costs against what the workspace has. Then ask "Create this ticket?" and wait for the answer.
5. Only after a clear yes to that preview, call `desk_run_action` with the same `operation_key` and `inputs`, the preview's `plan_hash`, `confirmed: true` and `client_name` (for example `Claude` or `Codex`). On no, or on any change to the inputs, file nothing; preview again for new inputs.
6. Give the person the ticket reference and what happens next. When it waits for approval, give the approval page (`approval_url`) so the approver decides there or in Slack.
7. Follow up with `desk_get_ticket_status` and the ticket reference when the person asks how it is going.
8. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["desk_actions:read","desk_actions:write"] }`. Tell the user to reconnect Sanka in their AI client (standard OAuth sign-in on Sanka), following its `reconnect_instructions`. After the user reconnects, retry the same Sanka request.

When something stops the Action:

- `decision: not_allowed` in the preview, or `DESK_ACTION_NOT_ALLOWED` from the run: the integration's rule does not let this person start the Action. Say so with the reason, do not retry, and offer `desk_create_ticket` so the company's IT decides.
- `DESK_ACTION_SURFACE_OFF`: the company does not let AI clients start Actions on this integration. Say so, do not retry, and offer `desk_create_ticket`.
- `DESK_PLAN_CHANGED`: the plan is no longer the one the person confirmed. Call `desk_preview_action` again, show the new preview, ask "Create this ticket?" again, and run only with the new `plan_hash` after a new yes.
- `credits_short: true` in the preview: tell the person first that the workspace's Sanka Credits are not enough and that a workspace admin can add them at `credits_url`. A run cancelled later with `DESK_CREDITS_REQUIRED` (`state_reason: credits_required`) means the same; the request then goes to the company's IT, and the Action can be run again once credits are added.
- `DESK_OPERATION_NOT_IN_CATALOG` or `DESK_PROVIDER_NOT_READY`: the Action is not offered here or its integration is not connected or ready. Offer `desk_create_ticket`.
- `DESK_INPUT_INVALID`: fix the inputs with the person against `inputs_schema`, then preview again.
- `DESK_NOT_ENABLED`: Sanka Desk is not switched on in this workspace. Tell the person to raise the request with their IT team the usual way.

Integrations (`desk_list_actions` is the source of truth for what this workspace offers; an item marked manual, or an Action with `executable: false`, is a step the company's admin carries out after approval):

- HubSpot: setting up a user in the company's existing HubSpot account (`hubspot_account_setup`, which never adds a paid seat), and changes to a user's role, team or seat. A new login waits for approval. Deactivating a HubSpot user is a step the company's HubSpot admin does by hand.
- Salesforce: setting up a user in the company's existing org (`salesforce_account_setup`, with the person's e-mail, last name and profile), and changes to profiles, permission sets, licenses, freezing or unlocking. A new user takes a license, so it waits for approval. Until Desk may make these changes itself, and for password resets, the company's Salesforce admin follows the written steps.
- Google Workspace: accounts, groups and licenses for joiners and leavers, signing out sessions, resetting 2-Step Verification and suspending a leaver. A password reset, and deleting an account, are done by the company's admin.
- Microsoft 365: accounts, groups and licenses in the company's Microsoft Entra ID, and signing out sessions. A new account's first password and password resets are set by the company's admin.
- Okta: accounts, groups and the account's lifecycle (activate, suspend, unlock), clearing sessions and resetting factors. Okta e-mails the activation and password-reset links itself.
- Slack: creating or deactivating a Slack account and channel invitations are steps the company's Slack admin carries out after approval.
- Sanka Flow: inviting members, roles and permission sets, team membership, and for leavers blocking login and handing their records to a successor. A higher role waits for a stricter approval.

Guardrails:
- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.
- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.
- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `{ required_scopes: ["desk_actions:read","desk_actions:write"] }` and follow its `reconnect_instructions`.
- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.
- If `auth_status` reports that Sanka is not connected, tell the user to reconnect Sanka in their AI client and follow its `reconnect_instructions`.
- Do not fabricate a connect, OAuth, or login URL.
- Sanka uses standard MCP OAuth: the AI client signs the user in on Sanka's own page. Never ask the user to paste a token, password or URL.
- Never call `desk_run_action` without showing the preview from `desk_preview_action` and getting the person's yes to "Create this ticket?" for exactly that preview.
- Never approve, reject or try to decide an approval, and never ask the person to approve their own request through this chat. Give the `approval_url`; the approver decides on the approval page in Sanka or in Slack.
- Do not retry a refused Action (`not_allowed`, `DESK_ACTION_NOT_ALLOWED`, `DESK_ACTION_SURFACE_OFF`) or work around the integration's rule with other tools; offer `desk_create_ticket`.
- IT requests go to Sanka Desk. Never file them with `create_ticket`, `update_ticket` or `update_ticket_status`, which stay for Flow ticket records, and do not save a directory workflow with `create_workflow` for one person's change when Desk takes it.
- Do not change accounts in HubSpot, Salesforce, Google Workspace, Microsoft 365, Okta or Slack through other MCP servers or tools for a request Desk handles.
- Take `operation_key` values and input names from `desk_list_actions`; do not invent them.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when the Desk tools cover the request.
