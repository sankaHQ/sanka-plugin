# Releasing `sanka-plugin`

## Release checklist

Use this checklist for the release that includes:

- the Codex OAuth scope fix (`contacts:read companies:read` only)
- the vendored callback error fix for OAuth provider errors
- the Codex guidance to start from the installed plugin chip, not a raw skill link
- the client manifest split:
  - Claude, Cursor, and generic hosts use `./.mcp.json`
  - Codex uses `./codex.mcp.json`
- the installer cache purge for `~/.codex/plugins/cache/personal/sanka-plugin`
- the package regression test that prevents Claude/Cursor from drifting onto the
  Codex-only MCP config

1. Use the dedicated macOS release machine that has:
   - a valid `Developer ID Application` signing certificate
   - a working `APPLE_NOTARY_PROFILE` or equivalent notary credentials
2. Confirm the release branch contains the desired changes and version bumps.
3. Prefer the shared Sanka `.env` source of truth. On the normal developer machine,
   the release helpers auto-load these from the sibling `../sanka/.env` file if they
   are not already exported:

   - `MACOS_APPLE_CERTIFICATE`
   - `MACOS_APPLE_CERTIFICATE_PASSWORD`
   - `MACOS_APPLE_SIGNING_IDENTITY`
   - `MACOS_APPLE_TEAM_ID`
   - `MACOS_APPLE_ID`
   - `MACOS_APPLE_APP_SPECIFIC_PASSWORD`
   - `APPLE_NOTARY_PROFILE` (optional)

4. If you need to override them manually, export the signing inputs:

```bash
export APPLE_CODESIGN_IDENTITY="Developer ID Application: ..."
export APPLE_NOTARY_PROFILE="sanka-notary"
```

5. Build the notarized artifact:

```bash
rm -rf dist
./scripts/release-codex-package.sh
```

6. Verify the produced installer bundle before publishing:

```bash
spctl -a -vvv "dist/macos/Install Sanka Plugin.app"
spctl -a -vvv "dist/macos/Uninstall Sanka Plugin.app"
```

Expected result:
   - `accepted`
   - `source=Notarized Developer ID`

7. Run the package-level regression checks against the actual ZIP:

```bash
./scripts/test-plugin-package.sh --skip-build
```

This validates the packaged manifests for Claude and Codex separately and
confirms the live OAuth metadata on `mcp.sanka.com`.

8. Verify the final ZIP preserves the notarized apps after extraction:

```bash
rm -rf /tmp/sanka-plugin-release-local
mkdir -p /tmp/sanka-plugin-release-local
unzip -q dist/Sanka-Plugin.zip -d /tmp/sanka-plugin-release-local
spctl -a -vvv "/tmp/sanka-plugin-release-local/Codex/Install Sanka Plugin.app"
spctl -a -vvv "/tmp/sanka-plugin-release-local/Codex/Uninstall Sanka Plugin.app"
```

9. Smoke-test the installer on a clean Codex setup:
   - run `Install Sanka Plugin.app`
   - restart Codex
   - install `Sanka Plugin` from `Personal Plugins`
   - start a fresh thread and trigger `list_companies`
   - confirm the OAuth prompt appears
   - confirm the localhost callback listener is started before the browser round-trip if you inspect the `~/.mcp-auth/..._debug.log`

10. Smoke-test the packaged connector on Claude:

- upload `dist/Sanka-Plugin.zip`
- confirm Claude recognizes the packaged connector instead of dropping straight
  into the generic "Add custom connector" sheet
- install the Sanka connector
- confirm the OAuth browser opens from the packaged connector flow

11. Publish the GitHub release from the notarized ZIP only:

```bash
gh release create vX.Y.Z 'dist/Sanka-Plugin.zip#Sanka-Plugin.zip' \
  --repo sankaHQ/sanka-plugin \
  --target main \
  --title vX.Y.Z
```

12. Download the published asset and verify it again:

```bash
rm -rf /tmp/sanka-plugin-release-check
mkdir -p /tmp/sanka-plugin-release-check
gh release download vX.Y.Z -R sankaHQ/sanka-plugin -D /tmp/sanka-plugin-release-check
unzip -q /tmp/sanka-plugin-release-check/Sanka-Plugin.zip -d /tmp/sanka-plugin-release-check/unzip
spctl -a -vvv "/tmp/sanka-plugin-release-check/unzip/Codex/Install Sanka Plugin.app"
```

13. Announce the release only after the downloaded asset passes Gatekeeper.

## Notes

- `./scripts/build-plugin-package.sh` is now guarded and should fail on unsigned macOS apps by default.
- `SANKA_ALLOW_UNSIGNED_MACOS_APPS=1` exists only for local development and should never be used for a published GitHub release.
- `./scripts/macos-signing-env.sh` auto-loads the sibling `../sanka/.env` file before falling back to manually exported values.
- `.mcp.json` is the shared hosted HTTP MCP config for Claude, Cursor, and generic hosts.
- `codex.mcp.json` is the dedicated Codex MCP config and should not be repointed back to `./.mcp.json`.
- If Claude stops recognizing the uploaded ZIP as a packaged connector, first inspect `.claude-plugin/plugin.json` inside the ZIP and confirm it still points at `./.mcp.json`.
