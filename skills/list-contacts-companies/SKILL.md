---
name: list-contacts-companies
description: List and inspect Sanka contacts and companies using read-only CRM MCP tools.
---

# List contacts and companies

Use this skill when the user wants to find contacts or companies in Sanka CRM.

## Scope

- Read-only retrieval and filtering
- Contact and company lookups
- Quick summaries from structured tool output

## Required tools

- `mcp__sanka_plugin__auth_status`
- `mcp__sanka_plugin__list_contacts`
- `mcp__sanka_plugin__list_companies`

This skill is guidance, not the plugin attachment itself. In Codex, invoking
the skill file directly does not always attach the plugin's MCP server to the
thread. Prefer starting from the installed plugin chip such as
`[@sanka-plugin](plugin://sanka-plugin@personal)` or by selecting `Sanka Plugin`
from `Personal Plugins`.

Do not use `mcp__sanka__*` in Codex. That name often comes from a stale global
`[mcp_servers.sanka]` entry in `~/.codex/config.toml`, which bypasses the
plugin's OAuth wrapper and can return `Auth required` without opening the
browser flow.

Do not use MCP registry search as a blocking preflight. In some clients, uploaded plugins lazily expose MCP tools and the registry can appear empty before the first connector call. Do not fall back to `search_docs`, `execute`, SDK method calls, or any create/update/delete path.

## Workflow

1. Decide whether the user intent is about contacts, companies, or both.
2. Do not stop on an empty MCP registry search result. Treat that as a client-side lazy-load issue and continue with the intended CRM tool call.
3. If the user explicitly asks whether OAuth is required or whether the connector is connected, call `mcp__sanka_plugin__auth_status`.
4. If the user wants contact or company data, call `mcp__sanka_plugin__list_contacts` or `mcp__sanka_plugin__list_companies` directly instead of using `mcp__sanka_plugin__auth_status` as a preflight. Protected tool calls are what trigger OAuth in clients like Codex and Claude.
5. If `mcp__sanka_plugin__auth_status` reports missing auth, or the protected call returns an auth challenge, tell the user to approve the OAuth prompt in the client and stop there.
6. If the protected CRM tool itself is unavailable at call time, do not jump straight to reinstall advice. In Codex this often means the thread loaded only the skill instructions, not the plugin attachment. Tell the user to start a new thread from `[@sanka-plugin](plugin://sanka-plugin@personal)` or the installed `Sanka Plugin` chip first. If that still fails, then ask them to reinstall or restart the plugin.
7. Call `mcp__sanka_plugin__list_contacts` or `mcp__sanka_plugin__list_companies` with narrow filters first:
   - `search` for free-text terms
   - `limit` for concise results (default 10, max 100)
   - `page` for pagination
   - `sort` when ordering matters
8. If the result set is large, iterate with pagination instead of increasing `limit` too aggressively.
9. Return a short summary first, then list key records.
10. If auth/scope errors appear, ask the user to reconnect with valid scopes instead of guessing.

## Output format

- Brief summary line (count and what matched)
- Bullet list of top matches with the most useful identifiers (for example `name` and any obvious email/domain fields)
- Optional note about next page availability when more records exist

## Safety

- Do not perform create/update/delete actions.
- Do not fabricate fields that are not present in tool output.
- Do not substitute documentation search or raw SDK execution when the CRM tools are missing.
- Do not try to manually construct or open a static OAuth URL as a substitute for the client's built-in auth flow.
