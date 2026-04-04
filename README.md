# sanka-plugin

Open Plugins-compatible Sanka plugin with a read-only CRM skill for listing contacts and companies.

## Included components

- `skills/list-contacts-companies/SKILL.md`
- `.mcp.json` (vendor-neutral MCP config)
- `mcp.json` (Cursor-compatible MCP config)
- `.plugin/plugin.json` (vendor-neutral manifest)
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

Then install/load this plugin in your host tool.

## License

MIT
