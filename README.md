# sanka-plugin

Open Plugins-compatible Sanka plugin that attaches Sanka's hosted MCP server for live Sanka workflows.

## Claude Code

Recommended for Claude Code users:

```text
/plugin marketplace add sankaHQ/sanka-plugin
/plugin install sanka@sanka
/reload-plugins
```

After install, open `/plugin`, go to `Marketplaces`, select `sanka`, and enable auto-update if you want Claude Code to pull future plugin updates from GitHub at startup instead of re-uploading a ZIP.

After the plugin is attached, you can use plugin skills like `/sanka:connect`, `/sanka:prospect-companies`, `/sanka:list-private-messages`, `/sanka:list-companies`, `/sanka:list-contacts`, and other `sanka:<mcp-tool-name>` skills, or ask in normal chat. The first protected tool call should trigger the native Sanka OAuth flow when authentication is missing.

## Included components

- `.mcp.json` (shared MCP config for Claude and generic hosts)
- `codex.mcp.json` (Codex MCP config)
- `mcp.json` (legacy alias for the shared hosted HTTP MCP config)
- `.plugin/plugin.json` (vendor-neutral manifest)
- `.codex-plugin/plugin.json` (Codex manifest)
- `.claude-plugin/plugin.json` for Claude upload compatibility
- `skills/` (thin namespaced wrappers such as `sanka:list-companies`)
- `vendor/mcp-remote/` (vendored Codex-only MCP proxy patch)
- `scripts/rebuild-codex-mcp-remote-vendor.sh` (vendor refresh helper)

## MCP endpoint

This plugin uses Sanka's hosted MCP endpoint:

- `https://mcp.sanka.com/mcp`

The config targets the unified Sanka MCP endpoint and relies on the MCP client's OAuth flow instead of a pasted API key.

The hosted MCP server is the source of truth for tool behavior, schemas, and workflow guidance. The packaged plugin stays intentionally thin so new MCP capabilities can ship without requiring a plugin reinstall whenever possible.

The currently attached Sanka tool list in each thread is the source of truth for what the client can do at that moment. In Codex, that namespace is usually `mcp__sanka_plugin__*`. In Claude Code or other hosts, the namespace may be host-generated or opaque such as `mcp__<connector_id>__*`. Common hosted tools include:

- `list_contacts`
- `list_companies`
- `list_deals`
- `get_deal`
- `list_deal_pipelines`
- `list_private_messages`
- `sync_private_messages`
- `get_private_message_thread`
- `reply_private_message_thread`
- `archive_private_message_thread`
- `list_expenses`
- `get_expense`
- `upload_expense_attachment`
- `create_expense`
- `update_expense`
- `delete_expense`

That list may expand over time as new hosted MCP tools ship.

## Setup

No API key is required for the plugin flow.

On install or first protected tool use, the MCP client should prompt you to sign in to Sanka and approve the requested access.

ChatGPT Codex also uses the same hosted MCP OAuth flow. No separate ChatGPT app install is required.

## ChatGPT Codex

### Recommended flow

For Codex, the preferred path is to keep the plugin in a cloned Git repo and update it with `git pull`. This repo includes a repo-local Codex marketplace at `.agents/plugins/marketplace.json`.

1. Clone `sankaHQ/sanka-plugin`.
2. Open that repo in Codex.
3. Restart Codex so the repo marketplace is discovered.
4. Open Plugins, choose `Sanka Local Plugins`, and install `Sanka Plugin`.
5. On first protected tool use, sign in to Sanka when Codex prompts for OAuth.

This keeps updates simple because users can pull the latest plugin changes from GitHub instead of re-running a packaged installer.

Codex does not yet document a self-serve public GitHub marketplace flow like Claude Code. The supported low-friction Git-backed option today is the repo marketplace inside a local clone.

Claude and the generic plugin manifest should keep using the canonical
shared `./.mcp.json` path. Codex uses its own `./codex.mcp.json` file so the
Codex-specific server alias can stay isolated from the generic clients.

The Codex bundle uses a dedicated `codex.mcp.json` file with the same direct
hosted HTTP MCP shape as the official plugins. The native
OAuth path depends on `mcp.sanka.com` exposing same-origin OAuth discovery and
auth endpoints, so Codex can show its standard install/use auth screen instead
of relying on a vendored wrapper.

In Codex, the plugin MCP server is intentionally named `sanka_plugin`, not
`sanka`. That avoids collisions with any stale global
`[mcp_servers.sanka]` or `[mcp_servers.sanka_key]` entry in `~/.codex/config.toml`.

When testing in Codex, start from the installed plugin itself, for example
`[@sanka](plugin://sanka@personal) Review my latest private inbox threads in Sanka`.

A direct skill-file invocation can still load the skill instructions without
attaching the plugin MCP server to that thread, so the installed plugin chip is
the safer entrypoint for end users.

If you need to refresh the vendored runtime after an upstream `mcp-remote`
update, use:

```bash
./scripts/rebuild-codex-mcp-remote-vendor.sh
```

This repo keeps the shared `.plugin/` manifest plus `./.mcp.json` for Claude
and generic hosts, and uses `.codex-plugin/` plus `./codex.mcp.json`
for Codex. Keep those client-specific MCP paths separate. A Codex-only manifest
change can break the Claude upload flow if it drifts the shared clients
off the canonical `./.mcp.json` path.

If you previously configured Sanka manually in Codex, remove any duplicate
global entry like these from `~/.codex/config.toml` before testing the plugin:

```toml
[mcp_servers.sanka]
enabled = true
url = "https://mcp.sanka.com/mcp"

[mcp_servers.sanka_key]
enabled = true
url = "https://mcp.sanka.com/mcp"
```

## Claude Code

The recommended Claude Code flow is the GitHub-backed marketplace install shown above. The packaged ZIP is still useful as a fallback when `/plugin` is unavailable or when you need to test the uploaded connector path explicitly.

If Claude opens an "Add custom connector" sheet instead of attaching the packaged connector normally, first confirm the uploaded ZIP still has `.claude-plugin/plugin.json` pointing at `./.mcp.json`. The working Claude releases use that canonical shared MCP path.

## Troubleshooting

If Claude shows `search_docs` / `execute` instead of the dedicated Sanka tools such as `list_private_messages`, `list_contacts`, `list_companies`, `list_deals`, `list_expenses`, or `create_expense`, the connector is not running in the intended profile yet. In that state, the model may fall back to SDK-style execution and show confusing API-key/auth errors.

Try this reset flow:

1. Start a fresh chat or thread first so the client refreshes the attached tool list.
2. If the new hosted tools are still missing, reconnect or remove/re-add the installed connector/plugin.
3. Restart the client so it reloads the hosted connector configuration.
4. Reinstall the plugin only when the plugin bundle itself changed.
5. Start a fresh chat and confirm the available Sanka tools include the currently hosted surface, such as `list_private_messages`, `sync_private_messages`, `get_private_message_thread`, `reply_private_message_thread`, `archive_private_message_thread`, `list_contacts`, `list_companies`, `list_deals`, `get_deal`, `list_deal_pipelines`, `list_expenses`, `get_expense`, `upload_expense_attachment`, `create_expense`, `update_expense`, and `delete_expense`.

If the client still exposes `search_docs` and `execute`, that is a profile-selection bug in the MCP/plugin integration rather than a missing workspace API key.

If Claude says a live Sanka object like Deals does not exist even though the hosted MCP server supports it, the most likely cause is stale connector metadata in that session. Refresh the connector surface first before trusting the answer.

If Codex returns a native `streamable_http_client ... Auth required` error and
no browser OAuth window opens, inspect `~/.codex/config.toml`. A stale global
block like `[mcp_servers.sanka]` or `[mcp_servers.sanka_key]` can hijack
`mcp__sanka__*` or `mcp__sanka_key__*` calls and bypass the plugin's
`sanka_plugin` server attachment.

If Claude answers a Sanka request by reading the local repo, local database, or
terminal output instead of prompting for OAuth and using attached MCP tools,
the thread is not using the installed plugin correctly. In Claude Code, do not
start Sanka requests with `/sanka`. Ask in normal chat after the plugin is
attached, or start a fresh thread and reconnect the installed plugin first.

If Claude shows attached Sanka tools under an opaque namespace like
`mcp__0e3f8181__*`, that is still a valid plugin attachment. Do not treat that
alone as an attachment failure.

If Codex answers a Sanka Plugin CRM query by referencing local Django models,
`manage.py shell`, `.env`, `DB_HOST`, `psql`, or repo-local records, that answer
is invalid. The Sanka Plugin is remote-only. Those queries must come from
`mcp__sanka_plugin__*`, and if those tools are missing the assistant should stop
and report a plugin attachment failure instead of falling back to the local
workspace.

If this keeps happening after reinstalling, clear the installed personal plugin
cache or reinstall the plugin from the repo-local marketplace so Codex does not
keep resolving an older cached bundle while the installed plugin has newer manifests.

## Legacy local server / raw API use

If you are running Sanka locally or using the SDK directly, API keys still exist for those lower-level developer flows. The packaged plugin is intended to remove that manual setup step for the hosted MCP path.

## License

MIT
