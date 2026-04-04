# sanka-plugin

Open Plugins-compatible Sanka plugin with a read-only CRM skill for listing contacts and companies.

## Included components

- `skills/list-contacts-companies/SKILL.md`
- `.mcp.json` (vendor-neutral MCP config)
- `mcp.json` (Cursor-compatible MCP config)
- `.plugin/plugin.json` (vendor-neutral manifest)
- `.app.json` (Codex ChatGPT app binding for OAuth install)
- `.codex-plugin/plugin.json` (Codex manifest)
- `.cursor-plugin/plugin.json` and `.claude-plugin/plugin.json` for tool-specific compatibility

## MCP endpoint

This plugin uses Sanka's hosted MCP endpoint:

- `https://mcp.sanka.com/mcp/crm`

The config uses `mcp-remote`, targets the dedicated CRM endpoint, and relies on browser-based OAuth instead of a pasted API key:

- `crm.auth_status`
- `crm.list_contacts`
- `crm.list_companies`

## Setup

No API key is required for the packaged plugin flow.

On first use, `mcp-remote` will open a browser window so you can sign in to Sanka and approve the requested access. The resulting tokens are stored locally by `mcp-remote` under `~/.mcp-auth`.

If you need to reset the OAuth session:

```bash
rm -rf ~/.mcp-auth
```

For Codex, OAuth via the Sanka app is the preferred path. The API key is kept as an MCP fallback.

## Codex install

Codex custom plugins are installed through a local marketplace, not directly from the repo root.

1. Symlink or copy this repo into `~/plugins/sanka-plugin`.

```bash
mkdir -p ~/plugins
ln -s /absolute/path/to/sanka-plugin ~/plugins/sanka-plugin
```

2. Add `~/.agents/plugins/marketplace.json`.

```json
{
  "name": "personal",
  "interface": {
    "displayName": "Personal Plugins"
  },
  "plugins": [
    {
      "name": "sanka-plugin",
      "source": {
        "source": "local",
        "path": "./plugins/sanka-plugin"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Productivity"
    }
  ]
}
```

3. Restart Codex, open the Plugins menu, and install `Sanka Plugin`.

4. In Codex, connect the bundled Sanka app when prompted.

The Codex manifest includes `.app.json` with Sanka's OpenAI app id, so Codex can use the same OAuth-backed app you created in ChatGPT. The bundled `.mcp.json` now points at the same dedicated CRM OAuth endpoint for MCP-capable hosts.

This repo keeps the shared `.plugin/` manifest for generic hosts and adds `.codex-plugin/` as the Codex-specific adapter.

## Cursor and Claude

Use the existing `.cursor-plugin/`, `.claude-plugin/`, and MCP config files for those hosts. They now follow the same OAuth-based `mcp-remote` flow.

## Troubleshooting

If Claude or Cursor shows `search_docs` / `execute` instead of `crm.auth_status` / `crm.list_contacts` / `crm.list_companies`, the connector is not running in the intended CRM-only profile yet. In that state, the model may fall back to SDK-style execution and show confusing API-key/auth errors.

Try this reset flow:

1. Remove the installed connector/plugin from the client.
2. Clear cached OAuth tokens with `rm -rf ~/.mcp-auth`.
3. Reinstall the plugin after GitHub raw cache has refreshed.
4. Start a fresh chat and confirm the available Sanka tools are `crm.auth_status`, `crm.list_contacts`, and `crm.list_companies`.

If the client still exposes `search_docs` and `execute`, that is a profile-selection bug in the MCP/plugin integration rather than a missing workspace API key.

## Legacy local server / raw API use

If you are running Sanka locally or using the SDK directly, API keys still exist for those lower-level developer flows. The packaged plugin is intended to remove that manual setup step for the hosted MCP path.

## License

MIT
