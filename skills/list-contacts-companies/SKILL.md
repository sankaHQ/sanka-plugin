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

- `crm.list_contacts`
- `crm.list_companies`

If either required tool is unavailable in the MCP registry, stop immediately and tell the user the Sanka connector is mis-profiled or not authenticated yet. Do not fall back to `search_docs`, `execute`, SDK method calls, or any create/update/delete path.

## Workflow

1. Decide whether the user intent is about contacts, companies, or both.
2. Confirm `crm.list_contacts` / `crm.list_companies` are actually available before trying to answer.
2. Call `crm.list_contacts` or `crm.list_companies` with narrow filters first:
   - `search` for free-text terms
   - `limit` for concise results (default 10, max 100)
   - `page` for pagination
   - `sort` when ordering matters
3. If the result set is large, iterate with pagination instead of increasing `limit` too aggressively.
4. Return a short summary first, then list key records.
5. If auth/scope errors appear, ask the user to reconnect with valid scopes instead of guessing.

## Output format

- Brief summary line (count and what matched)
- Bullet list of top matches with the most useful identifiers (for example `name` and any obvious email/domain fields)
- Optional note about next page availability when more records exist

## Safety

- Do not perform create/update/delete actions.
- Do not fabricate fields that are not present in tool output.
- Do not substitute documentation search or raw SDK execution when the CRM tools are missing.
