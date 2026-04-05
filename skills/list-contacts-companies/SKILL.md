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

- `crm.auth_status`
- `crm.list_contacts`
- `crm.list_companies`

If either required tool is unavailable in the MCP registry, stop immediately and tell the user the Sanka connector is mis-profiled or not authenticated yet. Do not fall back to `search_docs`, `execute`, SDK method calls, or any create/update/delete path.

## Workflow

1. Decide whether the user intent is about contacts, companies, or both.
2. Confirm `crm.auth_status`, `crm.list_contacts`, and `crm.list_companies` are actually available before trying to answer.
3. If the user explicitly asks whether OAuth is required or whether the connector is connected, call `crm.auth_status`.
4. If the user wants contact or company data, call `crm.list_contacts` or `crm.list_companies` directly instead of using `crm.auth_status` as a preflight. Protected tool calls are what trigger OAuth in clients like Codex via `mcp-remote`.
5. If `crm.auth_status` reports missing auth, tell the user to approve the OAuth prompt in the client and stop there.
6. Call `crm.list_contacts` or `crm.list_companies` with narrow filters first:
   - `search` for free-text terms
   - `limit` for concise results (default 10, max 100)
   - `page` for pagination
   - `sort` when ordering matters
7. If the result set is large, iterate with pagination instead of increasing `limit` too aggressively.
8. Return a short summary first, then list key records.
9. If auth/scope errors appear, ask the user to reconnect with valid scopes instead of guessing.

## Output format

- Brief summary line (count and what matched)
- Bullet list of top matches with the most useful identifiers (for example `name` and any obvious email/domain fields)
- Optional note about next page availability when more records exist

## Safety

- Do not perform create/update/delete actions.
- Do not fabricate fields that are not present in tool output.
- Do not substitute documentation search or raw SDK execution when the CRM tools are missing.
