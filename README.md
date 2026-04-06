# sanka-plugin

Open Plugins-compatible Sanka plugin with a read-only CRM skill for listing contacts and companies.

## Download

This repo ships one shared release asset:

- [Sanka-Plugin.zip](https://github.com/sankaHQ/sanka-plugin/releases/latest/download/Sanka-Plugin.zip)
  - Use this for Claude, Cursor, and Codex.
- Release page: [sankaHQ/sanka-plugin Releases](https://github.com/sankaHQ/sanka-plugin/releases)

Important:

- Do not use GitHub's green `Code` button and `Download ZIP`.
- Do not use the auto-generated `Source code (zip)` file on the Releases page.
- `Sanka-Plugin.zip` contains `.claude-plugin/`, `.cursor-plugin/`, `.codex-plugin/`, and the shared MCP files at the ZIP root.
- The same ZIP also includes a visible `Codex/` folder with the macOS and Windows Codex installers.

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

- `https://mcp.sanka.com/mcp`

The config targets the unified Sanka MCP endpoint and relies on the MCP client's OAuth flow instead of a pasted API key:

- `auth_status`
- `list_contacts`
- `list_companies`

## Setup

No API key is required for the packaged plugin flow.

On first protected tool use, the MCP client should prompt you to sign in to Sanka and approve the requested access.

Codex also uses the same hosted MCP OAuth flow. No separate ChatGPT app install is required.

## Codex install

### Recommended for end users

For non-technical users, distribute a Release ZIP and use the bundled installer:

1. Download [Sanka-Plugin.zip](https://github.com/sankaHQ/sanka-plugin/releases/latest/download/Sanka-Plugin.zip).
2. Extract the ZIP.
3. Open the extracted `Codex` folder.
4. Run the installer for the user's OS:
   - macOS: `Install Sanka Plugin.app`
   - Windows: `Install Sanka Plugin.bat`
5. Restart Codex.
6. Open the Plugins screen, choose `Personal Plugins`, and install `Sanka Plugin`.
7. On first protected tool use, sign in to Sanka when Codex prompts for OAuth.

To remove the Codex plugin later, use the bundled uninstaller:

- macOS: `Uninstall Sanka Plugin.app`
- Windows: `Uninstall Sanka Plugin.bat`

The installer copies the plugin into `~/.codex/plugins/sanka-plugin` and merges a single `sanka-plugin` entry into `~/.agents/plugins/marketplace.json`. Existing marketplace entries are preserved so this flow does not remove other local plugins.

The Codex bundle uses a dedicated `codex.mcp.json` wrapper that runs `mcp-remote` against the hosted `/mcp` endpoint. Cursor and Claude continue to use the shared `.mcp.json` hosted endpoint.

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
        "authentication": "ON_USE"
      },
      "category": "Productivity"
    }
  ]
}
```

3. Restart Codex, open the Plugins menu, and install `Sanka Plugin`.

4. On first use, complete the browser-based Sanka OAuth flow when prompted by the client.

This repo keeps the shared `.plugin/` manifest for generic hosts and adds `.codex-plugin/` plus `codex.mcp.json` as the Codex-specific adapter.

## Cursor and Claude

Use [Sanka-Plugin.zip](https://github.com/sankaHQ/sanka-plugin/releases/latest/download/Sanka-Plugin.zip) for Claude and Cursor. That archive has the client manifests at the ZIP root, including `.claude-plugin/plugin.json`, so it can be uploaded directly. The same archive also contains the `Codex/` installer folder for Codex users.

## Troubleshooting

If Claude or Cursor shows `search_docs` / `execute` instead of `auth_status` / `list_contacts` / `list_companies`, the connector is not running in the intended CRM-only profile yet. In that state, the model may fall back to SDK-style execution and show confusing API-key/auth errors.

Try this reset flow:

1. Remove the installed connector/plugin from the client.
2. Restart the client so it reloads the hosted connector configuration.
3. Reinstall the plugin after GitHub raw cache has refreshed.
4. Start a fresh chat and confirm the available Sanka tools are `auth_status`, `list_contacts`, and `list_companies`.

If the client still exposes `search_docs` and `execute`, that is a profile-selection bug in the MCP/plugin integration rather than a missing workspace API key.

## macOS installer build

To build the macOS `.app` bundle from the repository, run:

```bash
./scripts/build-macos-installer-app.sh
```

The script writes `dist/macos/Install Sanka Plugin.app` and generates the app icon from `assets/logo.svg`.

## Release packaging

To build the shared package for Claude, Cursor, Codex, and other compatible clients:

```bash
./scripts/build-plugin-package.sh
```

The packaging scripts now refuse to emit a macOS installer ZIP unless the staged
`.app` bundles pass both `codesign` verification and Gatekeeper assessment via
`spctl`. That is intentional. Production releases must come from the notarized flow.

For local-only unsigned test builds, use:

```bash
SANKA_ALLOW_UNSIGNED_MACOS_APPS=1 ./scripts/build-plugin-package.sh
```

The script writes `dist/Sanka-Plugin.zip` with:

- plugin manifests at the ZIP root for Claude, Cursor, Codex, and generic hosts
- `Codex/Install Sanka Plugin.app` for macOS
- `Codex/Uninstall Sanka Plugin.app` for macOS
- `Codex/Install Sanka Plugin.bat` and `Codex/Install-Sanka-Plugin.ps1` for Windows
- `Codex/Uninstall Sanka Plugin.bat` and `Codex/Uninstall-Sanka-Plugin.ps1` for Windows

## Signing and notarization

On Sanka developer machines, the release helpers can auto-load the Apple signing
and notarization variables from the sibling `../sanka/.env` file when they are not
already exported in the shell. That includes:

- `MACOS_APPLE_CERTIFICATE`
- `MACOS_APPLE_CERTIFICATE_PASSWORD`
- `MACOS_APPLE_SIGNING_IDENTITY`
- `MACOS_APPLE_TEAM_ID`
- `MACOS_APPLE_ID`
- `MACOS_APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_NOTARY_PROFILE` (optional, if you prefer notarytool keychain profiles)

To sign the macOS app bundle with a Developer ID Application certificate:

```bash
APPLE_CODESIGN_IDENTITY="Developer ID Application: Example, Inc. (TEAMID1234)" \
./scripts/sign-macos-installer-app.sh
```

To produce a notarized release package:

```bash
./scripts/release-codex-package.sh
```

If you are not relying on auto-loaded `.env` values, set either:

- `APPLE_NOTARY_PROFILE`, or
- `MACOS_APPLE_ID`, `MACOS_APPLE_TEAM_ID`, and `MACOS_APPLE_APP_SPECIFIC_PASSWORD`

before running the release script.

See [RELEASING.md](RELEASING.md) for the concrete `v0.4.11` recovery-release checklist.

## Legacy local server / raw API use

If you are running Sanka locally or using the SDK directly, API keys still exist for those lower-level developer flows. The packaged plugin is intended to remove that manual setup step for the hosted MCP path.

## License

MIT
