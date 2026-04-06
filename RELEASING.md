# Releasing `sanka-plugin`

## `v0.4.13` release checklist

Use this checklist for the release that includes:

- the Codex OAuth scope fix (`contacts:read companies:read` only)
- the vendored callback error fix for OAuth provider errors
- the Codex guidance to start from the installed plugin chip, not a raw skill link
- the Codex manifest alignment back to the canonical `./.mcp.json` path
- the installer cache purge for `~/.codex/plugins/cache/personal/sanka-plugin`

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

7. Verify the final ZIP preserves the notarized apps after extraction:

```bash
rm -rf /tmp/sanka-plugin-v0.4.13
mkdir -p /tmp/sanka-plugin-v0.4.13
unzip -q dist/Sanka-Plugin.zip -d /tmp/sanka-plugin-v0.4.13
spctl -a -vvv "/tmp/sanka-plugin-v0.4.13/Codex/Install Sanka Plugin.app"
spctl -a -vvv "/tmp/sanka-plugin-v0.4.13/Codex/Uninstall Sanka Plugin.app"
```

8. Smoke-test the installer on a clean Codex setup:
   - run `Install Sanka Plugin.app`
   - restart Codex
   - install `Sanka Plugin` from `Personal Plugins`
   - start a fresh thread and trigger `list_companies`
   - confirm the OAuth prompt appears
   - confirm the localhost callback listener is started before the browser round-trip if you inspect the `~/.mcp-auth/..._debug.log`

9. Publish the GitHub release from the notarized ZIP only:

```bash
gh release create v0.4.13 'dist/Sanka-Plugin.zip#Sanka-Plugin.zip' \
  --repo sankaHQ/sanka-plugin \
  --target main \
  --title v0.4.13
```

10. Download the published asset and verify it again:

```bash
rm -rf /tmp/sanka-plugin-release-check
mkdir -p /tmp/sanka-plugin-release-check
gh release download v0.4.13 -R sankaHQ/sanka-plugin -D /tmp/sanka-plugin-release-check
unzip -q /tmp/sanka-plugin-release-check/Sanka-Plugin.zip -d /tmp/sanka-plugin-release-check/unzip
spctl -a -vvv "/tmp/sanka-plugin-release-check/unzip/Codex/Install Sanka Plugin.app"
```

11. Announce the release only after the downloaded asset passes Gatekeeper.

## Notes

- `./scripts/build-plugin-package.sh` is now guarded and should fail on unsigned macOS apps by default.
- `SANKA_ALLOW_UNSIGNED_MACOS_APPS=1` exists only for local development and should never be used for a published GitHub release.
- `./scripts/macos-signing-env.sh` auto-loads the sibling `../sanka/.env` file before falling back to manually exported values.
- `.mcp.json` intentionally uses the vendored `vendor/mcp-remote/proxy.mjs` wrapper for Codex. Do not swap it back to raw upstream `npx mcp-remote` unless upstream fixes the late-401 callback-server bug and you have re-smoke-tested OAuth.
- If you update the vendored Codex proxy, rebuild the runtime artifact with `./scripts/rebuild-codex-mcp-remote-vendor.sh` before packaging a release.
