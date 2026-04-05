# sanka-plugin

Open Plugins-compatible Sanka plugin with a read-only CRM skill for listing contacts and companies.

## Download

This repo now ships two release assets from the same source:

- [Sanka-Plugin.zip](https://github.com/sankaHQ/sanka-plugin/releases/latest/download/Sanka-Plugin.zip)
  - Use this for Claude, Cursor, and any client that uploads or imports a plugin ZIP directly.
- [Sanka-Plugin-Codex-Installer.zip](https://github.com/sankaHQ/sanka-plugin/releases/latest/download/Sanka-Plugin-Codex-Installer.zip)
  - Use this for Codex on macOS or Windows when you want the double-click installer flow.
- Release page: [sankaHQ/sanka-plugin Releases](https://github.com/sankaHQ/sanka-plugin/releases)

Important:

- Do not use GitHub's green `Code` button and `Download ZIP`.
- Do not use the auto-generated `Source code (zip)` file on the Releases page.
- `Sanka-Plugin.zip` is the shared plugin archive. It contains `.claude-plugin/`, `.cursor-plugin/`, `.codex-plugin/`, and the shared MCP files at the ZIP root.
- `Sanka-Plugin-Codex-Installer.zip` is the Codex-only installer bundle. It extracts to `Sanka Plugin for Codex` and includes `Install Sanka Plugin.app`.

## Included components

- `skills/list-contacts-companies/SKILL.md`
- `.mcp.json` (vendor-neutral MCP config)
- `mcp.json` (Cursor-compatible MCP config)
- `.plugin/plugin.json` (vendor-neutral manifest)
- `.codex-plugin/plugin.json` (Codex manifest)
- `.cursor-plugin/plugin.json` and `.claude-plugin/plugin.json` for tool-specific compatibility
- `macos/installer-app/` (macOS app bundle template)
- `scripts/` (payload, build, signing, notarization, and release helpers)

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

Codex also uses the same hosted MCP OAuth flow. No separate ChatGPT app install is required.

## Codex install

### Recommended for end users

For non-technical users, distribute a Release ZIP and use the bundled installer:

1. Download [Sanka-Plugin-Codex-Installer.zip](https://github.com/sankaHQ/sanka-plugin/releases/latest/download/Sanka-Plugin-Codex-Installer.zip).
2. Extract the ZIP.
3. Open the extracted `Sanka Plugin for Codex` folder.
4. Run the installer for the user's OS:
   - macOS: `Install Sanka Plugin.app`
   - Windows: `Install Sanka Plugin.bat`
5. Restart Codex.
6. Open the Plugins screen, choose `Personal Plugins`, and install `Sanka Plugin`.
7. On first use, sign in to Sanka in the browser window when `mcp-remote` prompts for OAuth.

To remove the Codex plugin later, use the bundled uninstaller:

- macOS: `Uninstall Sanka Plugin.app`
- Windows: `Uninstall Sanka Plugin.bat`

The installer copies the plugin into `~/.codex/plugins/sanka-plugin` and merges a single `sanka-plugin` entry into `~/.agents/plugins/marketplace.json`. Existing marketplace entries are preserved so this flow does not remove other local plugins.

The Codex bundle uses the same `.mcp.json` hosted CRM endpoint as the other clients, so Codex, Cursor, and Claude all follow the same browser-based OAuth flow.

### Manual setup for developers

Codex custom plugins are installed through a local marketplace, not directly from the repo root.

1. Copy this repo into `~/.codex/plugins/sanka-plugin`.

```bash
mkdir -p ~/.codex/plugins
cp -R /absolute/path/to/sanka-plugin ~/.codex/plugins/sanka-plugin
```

2. Add or update `~/.agents/plugins/marketplace.json`.

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
        "path": "./.codex/plugins/sanka-plugin"
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

4. On first use, complete the browser-based Sanka OAuth flow when prompted by `mcp-remote`.

This repo keeps the shared `.plugin/` manifest for generic hosts and adds `.codex-plugin/` as the Codex-specific adapter.

## Cursor and Claude

Use [Sanka-Plugin.zip](https://github.com/sankaHQ/sanka-plugin/releases/latest/download/Sanka-Plugin.zip) for Claude and Cursor. That archive has the client manifests at the ZIP root, including `.claude-plugin/plugin.json`, so it can be uploaded directly. The Codex installer ZIP is intentionally different and should not be uploaded to Claude.

## Troubleshooting

If Claude or Cursor shows `search_docs` / `execute` instead of `crm.auth_status` / `crm.list_contacts` / `crm.list_companies`, the connector is not running in the intended CRM-only profile yet. In that state, the model may fall back to SDK-style execution and show confusing API-key/auth errors.

Try this reset flow:

1. Remove the installed connector/plugin from the client.
2. Clear cached OAuth tokens with `rm -rf ~/.mcp-auth`.
3. Reinstall the plugin after GitHub raw cache has refreshed.
4. Start a fresh chat and confirm the available Sanka tools are `crm.auth_status`, `crm.list_contacts`, and `crm.list_companies`.

If the client still exposes `search_docs` and `execute`, that is a profile-selection bug in the MCP/plugin integration rather than a missing workspace API key.

## macOS installer build

To build the macOS `.app` bundle from the repository, run:

```bash
./scripts/build-macos-installer-app.sh
```

The script writes `dist/macos/Install Sanka Plugin.app` and generates the app icon from `assets/logo.svg`.

## Release packaging

To build the end-user Codex package:

```bash
./scripts/build-codex-package.sh
```

The script writes `dist/Sanka-Plugin-Codex-Installer.zip` and includes:

- `Install Sanka Plugin.app` for macOS
- `Uninstall Sanka Plugin.app` for macOS
- `Install Sanka Plugin.bat` and `Install-Sanka-Plugin.ps1` for Windows
- `Uninstall Sanka Plugin.bat` and `Uninstall-Sanka-Plugin.ps1` for Windows
- `Support/payload/` containing the plugin files consumed by the installers

To build the shared upload package for Claude, Cursor, and other compatible clients:

```bash
./scripts/build-plugin-package.sh
```

The script writes `dist/Sanka-Plugin.zip` with the plugin manifests at the ZIP root.

## Signing and notarization

To sign the macOS app bundle with a Developer ID Application certificate:

```bash
APPLE_CODESIGN_IDENTITY="Developer ID Application: Example, Inc. (TEAMID1234)" \
./scripts/sign-macos-installer-app.sh
```

To produce a notarized release package:

```bash
APPLE_CODESIGN_IDENTITY="Developer ID Application: Example, Inc. (TEAMID1234)" \
APPLE_NOTARY_PROFILE="sanka-notary" \
./scripts/release-codex-package.sh
```

`APPLE_NOTARY_PROFILE` should point to a keychain profile created with `xcrun notarytool store-credentials`.

## Legacy local server / raw API use

If you are running Sanka locally or using the SDK directly, API keys still exist for those lower-level developer flows. The packaged plugin is intended to remove that manual setup step for the hosted MCP path.

## License

MIT
