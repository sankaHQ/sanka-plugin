---
description: Seed a demo workspace in Sanka. Use when the user explicitly invokes /sanka:generate-demo-workspace.
disable-model-invocation: true
argument-hint: "<template and country>"
---
# Generate Demo Workspace

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. If the attached Sanka MCP tools are missing, stop and tell the user the Sanka plugin is not attached to this thread.
2. Require `template` and `country`. If either is missing, ask a concise follow-up.
3. Pass through `workspace_id` only when the user explicitly wants to seed an existing workspace.
4. Pass through `seed` only when the user explicitly asks for deterministic replay.
5. Call `generate_demo_workspace` directly.
6. If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry.
7. Summarize the created or seeded workspace and the generated record counts.

Guardrails:

- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `generate_demo_workspace` covers the request.
- Do not invent template or country values outside the supported tool options.
