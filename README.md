# sanka-plugin

Open Plugins-compatible Sanka plugin with a read-only CRM skill for listing contacts and companies.

## Included components

- `skills/list-contacts-companies/SKILL.md`
- `.mcp.json` (vendor-neutral MCP config)
- `mcp.json` (Cursor-compatible MCP config)
- `.plugin/plugin.json` (vendor-neutral manifest)
- `.codex-plugin/plugin.json` (Codex manifest)
- `.cursor-plugin/plugin.json` and `.claude-plugin/plugin.json` for tool-specific compatibility

## MCP endpoint

This plugin uses Sanka's hosted MCP endpoint:

- `https://mcp.sanka.com/mcp`

The config uses `mcp-remote` and forces `chatgpt` tool profile so the CRM list tools are available:

- `crm.list_contacts`
- `crm.list_companies`

## Setup

Set your API key before use:

```bash
export SANKA_API_KEY="your-api-key"
```

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

This repo keeps the shared `.plugin/` manifest for generic hosts and adds `.codex-plugin/` as the Codex-specific adapter.

## Cursor and Claude

Use the existing `.cursor-plugin/`, `.claude-plugin/`, and MCP config files for those hosts.

## License

MIT
