---
description: Refresh or reinstall the local Sakura plugin so newly shipped Sanka skills and hosted MCP tools are available. Use when the user explicitly invokes /sakura:refresh or agrees to update an outdated Sakura plugin.
disable-model-invocation: true
argument-hint: "[optional: refresh reason or target version]"
---

# Refresh Sakura plugin

Refresh the installed Sakura plugin when a Sakura MCP response says the plugin is outdated, a Sanka skill is missing, or the user says yes to an update prompt.

Workflow:

1. Tell the user you will refresh Sakura plugin and that the current thread may not receive a new MCP tool list automatically.
2. If you have local shell access to a Sakura plugin repository checkout, run `./scripts/refresh-codex-plugin.sh` from the repository root.
3. If the refresh script is unavailable, run `git fetch origin`, `git pull --ff-only`, and `node scripts/sync-codex-skill-metadata.mjs --check` when the metadata script exists.
4. If the plugin repo changed or the requested skill was missing, tell the user to reload/reinstall Sakura plugin from Codex Plugins, then start a fresh thread from the Sakura plugin chip or `$sakura:...`.
5. If you cannot access the local repo or plugin installer, provide the same concise refresh instruction instead of shell commands.

User-facing update prompt:

```text
Sakura plugin may be outdated.
Update Sakura plugin?
Reply "yes" and Codex will refresh Sakura plugin and make the new Sanka skills available.
```

Guardrails:
- Do not call live Sanka data tools during refresh unless the user also asks to retry the original Sanka task after refresh.
- Do not use local Sanka app data, Django shell, Postgres, or HubSpot MCP as a replacement for refreshing the Sakura plugin.
- Do not claim the current thread has the new MCP tool list unless you verified the tool exists in this thread after refresh.
- After refresh, prefer a fresh thread started from the Sakura plugin chip or a plain `$sakura:...` mention.
- If the user says "yes", "update it", or "go ahead" after a Sakura plugin update prompt, treat that as approval to refresh the plugin.
