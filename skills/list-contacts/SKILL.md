---
description: List or search contacts in live Sanka with the installed plugin. Use when the user explicitly invokes /sanka:list-contacts.
disable-model-invocation: true
argument-hint: "[search text or limit]"
---

# List Contacts

Use only the attached Sanka MCP tools in this thread.

Interpret `$ARGUMENTS` like this:

- If empty, list the most recent 10 contacts.
- If it is only an integer, use that as the result limit.
- Otherwise treat it as the search text and use a sensible small limit, usually 10.

Workflow:

1. If the attached Sanka MCP tools are missing, stop and tell the user the Sanka plugin is not attached to this thread.
2. Call `list_contacts` directly.
3. If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry.
4. Summarize the returned contacts clearly and do not mix in any local repo or database information.

Guardrails:

- Do not call `auth_status` as a preflight for this command.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `list_contacts` covers the request.
