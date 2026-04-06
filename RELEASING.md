# Releasing `sanka-plugin`

## `v0.4.11` recovery release checklist

Use this checklist for the first post-`v0.4.10` macOS recovery release.

1. Use the dedicated macOS release machine that has:
   - a valid `Developer ID Application` signing certificate
   - a working `APPLE_NOTARY_PROFILE` or equivalent notary credentials
2. Confirm the release branch contains the desired changes and version bumps.
3. Export the signing inputs:

```bash
export APPLE_CODESIGN_IDENTITY="Developer ID Application: ..."
export APPLE_NOTARY_PROFILE="sanka-notary"
```

4. Build the notarized artifact:

```bash
rm -rf dist
./scripts/release-codex-package.sh
```

5. Verify the produced installer bundle before publishing:

```bash
spctl -a -vvv "dist/macos/Install Sanka Plugin.app"
spctl -a -vvv "dist/macos/Uninstall Sanka Plugin.app"
```

Expected result:
   - `accepted`
   - `source=Notarized Developer ID`

6. Verify the final ZIP preserves the notarized apps after extraction:

```bash
rm -rf /tmp/sanka-plugin-v0.4.11
mkdir -p /tmp/sanka-plugin-v0.4.11
unzip -q dist/Sanka-Plugin.zip -d /tmp/sanka-plugin-v0.4.11
spctl -a -vvv "/tmp/sanka-plugin-v0.4.11/Codex/Install Sanka Plugin.app"
spctl -a -vvv "/tmp/sanka-plugin-v0.4.11/Codex/Uninstall Sanka Plugin.app"
```

7. Smoke-test the installer on a clean Codex setup:
   - run `Install Sanka Plugin.app`
   - restart Codex
   - install `Sanka Plugin` from `Personal Plugins`
   - start a fresh thread and trigger `list_companies`
   - confirm the OAuth prompt appears

8. Publish the GitHub release from the notarized ZIP only:

```bash
gh release create v0.4.11 'dist/Sanka-Plugin.zip#Sanka-Plugin.zip' \
  --repo sankaHQ/sanka-plugin \
  --target main \
  --title v0.4.11
```

9. Download the published asset and verify it again:

```bash
rm -rf /tmp/sanka-plugin-release-check
mkdir -p /tmp/sanka-plugin-release-check
gh release download v0.4.11 -R sankaHQ/sanka-plugin -D /tmp/sanka-plugin-release-check
unzip -q /tmp/sanka-plugin-release-check/Sanka-Plugin.zip -d /tmp/sanka-plugin-release-check/unzip
spctl -a -vvv "/tmp/sanka-plugin-release-check/unzip/Codex/Install Sanka Plugin.app"
```

10. Announce the release only after the downloaded asset passes Gatekeeper.

## Notes

- `./scripts/build-plugin-package.sh` is now guarded and should fail on unsigned macOS apps by default.
- `SANKA_ALLOW_UNSIGNED_MACOS_APPS=1` exists only for local development and should never be used for a published GitHub release.
