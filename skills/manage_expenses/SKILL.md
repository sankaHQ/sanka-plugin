---
name: manage_expenses
description: Manage Sanka expenses using dedicated MCP tools for listing, retrieving, uploading attachments, creating, updating, and deleting expenses.
---

# Manage expenses

Use this skill when the user wants to inspect, create, update, attach files to, or delete expenses in Sanka.

## Scope

- Read and write expense workflows
- Attachment upload followed by expense create or update
- Focused expense summaries from structured MCP output

## Required tools

- `mcp__sanka_plugin__list_expenses`
- `mcp__sanka_plugin__get_expense`
- `mcp__sanka_plugin__upload_expense_attachment`
- `mcp__sanka_plugin__create_expense`
- `mcp__sanka_plugin__update_expense`
- `mcp__sanka_plugin__delete_expense`

## Optional tool

- `mcp__sanka_plugin__auth_status`

## Hard rules

- Treat this plugin as remote-only. Results and mutations must come from the Sanka MCP tools above.
- For an expense data request, call the matching protected expense tool directly. Do not call `auth_status` as a preflight.
- In Codex, a mistaken `auth_status` preflight can suppress the OAuth browser launch. The first expense action for a real request should be the relevant protected tool call.
- Never use `exec_command`, `read_thread_terminal`, local code search, `.env`, `manage.py shell`, `psql`, Django ORM, or any repo-local database access to answer or perform a Sanka Plugin expense task.
- If the user invoked `[@sanka-plugin](plugin://sanka-plugin@personal)` and the `mcp__sanka_plugin__*` tools are unavailable in the current turn, stop and say the plugin did not attach correctly. Do not substitute a local fallback.

This skill is guidance, not the plugin attachment itself. In Codex, invoking
the skill file directly does not always attach the plugin's MCP server to the
thread. Prefer starting from the installed plugin chip such as
`[@sanka-plugin](plugin://sanka-plugin@personal)` or by selecting `Sanka Plugin`
from `Personal Plugins`.

Do not use `mcp__sanka__*` in Codex. That name often comes from a stale global
`[mcp_servers.sanka]` entry in `~/.codex/config.toml`, which bypasses the
plugin's OAuth wrapper and can return `Auth required` without opening the
browser flow.

Do not use MCP registry search as a blocking preflight. In some clients,
uploaded plugins lazily expose MCP tools and the registry can appear empty
before the first connector call. Do not fall back to `search_docs`, `execute`,
SDK method calls, or any local workaround.

## Workflow

1. For recent expense review, call `mcp__sanka_plugin__list_expenses`.
2. For one known expense, call `mcp__sanka_plugin__get_expense`.
3. For receipt or invoice uploads, call `mcp__sanka_plugin__upload_expense_attachment` first, then pass the returned `file_id` into `create_expense` or `update_expense`.
4. For create requests, call `mcp__sanka_plugin__create_expense` with only the fields the user actually supplied.
5. For updates, call `mcp__sanka_plugin__update_expense` with `expense_id` plus only the fields to change.
6. For deletes, call `mcp__sanka_plugin__delete_expense` only when the user clearly asked to remove the record.
7. If the user explicitly asks only whether the connector is connected, call `mcp__sanka_plugin__auth_status`.
8. If `auth_status` reports missing auth, or a protected expense tool returns an auth challenge, tell the user to approve the OAuth prompt in the client and stop there.
9. If the protected expense tool itself is unavailable at call time, do not use any local fallback. Tell the user to start a new thread from `[@sanka-plugin](plugin://sanka-plugin@personal)` or the installed `Sanka Plugin` chip first. If that still fails, ask them to reinstall or restart the plugin.

## Attachment rule

- `upload_expense_attachment` expects `filename` plus `content_base64`.
- Use it only when the client already provides the file bytes or the user gave the content in a form that can be converted safely.
- Do not pretend a local path is accessible to the hosted MCP server.

## Output format

- Brief summary line first
- For reads: list the most relevant identifiers such as `description`, `company_name`, `amount`, `currency`, `status`, and `created_at`
- For writes: state the action taken and return the key identifiers such as `expense_id`, `external_id`, or `file_id`

## Safety

- Do not fabricate fields that are not present in tool output.
- Do not perform deletes unless the user explicitly asked for deletion.
- Do not substitute documentation search, terminal access, local repo inspection, Django shell, or raw SDK execution when the expense tools are missing.
- Do not try to manually construct or open a static OAuth URL as a substitute for the client's built-in auth flow.
