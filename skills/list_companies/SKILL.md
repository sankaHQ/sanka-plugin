---
name: list_companies
description: List and inspect Sanka companies using the read-only CRM MCP company tool.
---

# List companies

Use this skill when the user wants to find or inspect companies in Sanka CRM.

## Scope

- Read-only company retrieval and filtering
- Quick summaries from structured tool output

## Required tool

- `mcp__sanka_plugin__list_companies`

## Optional tool

- `mcp__sanka_plugin__auth_status`

## Hard rules

- Treat this plugin as remote-only. Results must come from the Sanka MCP tools above.
- For company data requests, call `mcp__sanka_plugin__list_companies` first. Do not call `auth_status` as a preflight.
- In Codex, a mistaken `auth_status` preflight can suppress the OAuth browser launch. The first CRM read for a data request must be a protected `list_companies` call.
- Never use `exec_command`, `read_thread_terminal`, local code search, `.env`, `manage.py shell`, `psql`, Django ORM, or any repo-local database access to answer a Sanka Plugin company query.
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
SDK method calls, or any create/update/delete path.

## Workflow

1. Immediately call `mcp__sanka_plugin__list_companies` for company lookup requests. Do not call `mcp__sanka_plugin__auth_status` first.
2. If the user explicitly asks only whether OAuth is required or whether the connector is connected, call `mcp__sanka_plugin__auth_status`.
3. If `mcp__sanka_plugin__auth_status` reports missing auth, or the protected call returns an auth challenge, tell the user to approve the OAuth prompt in the client and stop there.
4. If the protected CRM tool itself is unavailable at call time, do not use any local fallback. In Codex this often means the thread loaded only the skill instructions, not the plugin attachment. Tell the user to start a new thread from `[@sanka-plugin](plugin://sanka-plugin@personal)` or the installed `Sanka Plugin` chip first. If that still fails, then ask them to reinstall or restart the plugin.
5. Call `mcp__sanka_plugin__list_companies` with narrow filters first:
   - `search` for free-text terms
   - `limit` for concise results (default 10, max 100)
   - `page` for pagination
   - `sort` when ordering matters
6. If the result set is large, iterate with pagination instead of increasing `limit` too aggressively.
7. Return a short summary first, then list key records.
8. If auth errors appear, ask the user to reconnect instead of guessing.

## Output format

- Brief summary line
- Bullet list of top company matches with the most useful identifiers such as `name` and any obvious domain fields
- Optional note about next page availability when more records exist

## Safety

- Do not perform create/update/delete actions.
- Do not fabricate fields that are not present in tool output.
- Do not substitute documentation search, terminal access, local repo inspection, Django shell, or raw SDK execution when the CRM tools are missing.
- Do not try to manually construct or open a static OAuth URL as a substitute for the client's built-in auth flow.
