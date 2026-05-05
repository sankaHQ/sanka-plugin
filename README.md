# sanka-plugin

Sanka Plugin attaches Sanka's hosted MCP server to Codex and Claude Code. Use it for live Sanka CRM, estimates, approvals, billing, private inbox, expenses, and workflow intents.

## Install

### Codex

1. Clone this repo.
2. Open the repo in Codex.
3. Restart Codex so `.agents/plugins/marketplace.json` is discovered.
4. Install **Sanka Plugin** from **Sanka Local Plugins**.
5. Start Sanka work from the installed plugin chip or a plain `$sanka:...` mention.

### Claude Code

```text
/plugin marketplace add sankaHQ/sanka-plugin
/plugin install sanka@sanka
/reload-plugins
```

Enable auto-update from `/plugin` if you want Claude Code to pull future updates from GitHub.

## Use

Examples:

```text
$sanka:deal-to-estimate https://app.hubspot.com/contacts/.../record/0-3/... 見積もりをプレビューして
$sanka:list-deals 直近の取引を見せて
$sanka:create-expense この領収書で経費を作って
$sanka:refresh
```

For HubSpot deal URLs, use Sanka workflow skills such as `$sanka:deal-to-estimate` when the outcome is a Sanka estimate, approval request, workflow run, or audit trail. HubSpot is only the source record; Sanka owns the business action.

## Refresh

If Sanka says the plugin is outdated, the user should only need to answer "はい".

User-facing prompt:

```text
Sanka Pluginが古いバージョンの可能性があります。
更新しますか？
「はい」と返信すると、CodexがSanka Pluginを最新化して、新しいSanka skillが使える状態にします。
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
