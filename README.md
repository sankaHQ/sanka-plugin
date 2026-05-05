# sanka-plugin

Sanka Plugin attaches Sanka's hosted MCP server to Codex and Claude Code. Use it for live Sanka CRM, estimates, approvals, billing, private inbox, expenses, and workflow intents.

## Install

Codex uses a repo-local marketplace, while Claude Code supports a GitHub marketplace command. The install paths differ, but both attach the same hosted Sanka MCP server and the same `$sanka:...` skills.

### Codex

```text
Clone sankaHQ/sanka-plugin
Open the cloned repo in Codex
Restart Codex
Install Sanka Plugin from Sanka Local Plugins
Start with the Sanka Plugin chip or a plain $sanka:... mention
```

### Claude Code

```text
/plugin marketplace add sankaHQ/sanka-plugin
/plugin install sanka@sanka
/reload-plugins
Start with normal chat or a /sanka:... skill
```

Enable auto-update from `/plugin` if you want Claude Code to pull future updates from GitHub.

## Use

Examples:

```text
$sanka:deal-to-estimate https://app.hubspot.com/contacts/.../record/0-3/... Preview the estimate and do not create it yet.
$sanka:deal-to-estimate https://app.hubspot.com/contacts/.../record/0-3/... Create the estimate if the deal is synced in Sanka.
$sanka:list-deals Show recent deals.
$sanka:create-expense Create an expense from this receipt.
$sanka:refresh
```

For HubSpot deal URLs, use Sanka workflow skills such as `$sanka:deal-to-estimate` when the outcome is a Sanka estimate, approval request, workflow run, or audit trail. HubSpot is only the source record; Sanka owns the business action.

## Refresh

If Sanka says the plugin is outdated, the user should only need to answer "yes".

User-facing prompt:

```text
Sanka Plugin may be outdated.
This action needs a newer Sanka workflow skill.

Update Sanka Plugin?
Reply "yes" and Codex will refresh Sanka Plugin and make the new Sanka skills available.
```

Codex can then run:

```bash
cd /Users/haegwan/Sites/sanka/sanka-plugin
./scripts/refresh-codex-plugin.sh
```

After refresh, reload or reinstall Sanka Plugin in Codex and start a fresh thread from the Sanka Plugin chip or `$sanka:...`. Existing threads may keep an old MCP tool list.

## Notes

- Hosted MCP endpoint: `https://mcp.sanka.com/mcp`
- Codex MCP server name: `sanka_plugin`
- Live Sanka work must use attached hosted MCP tools. Do not substitute local Django shell, Postgres, repo files, or HubSpot MCP for Sanka actions.
- If only `search_docs` / `execute` appear, refresh the plugin attachment or start a fresh plugin-attached thread.
