---
name: sanka-plugin-release
description: Use when releasing or repairing the sanka-plugin package, especially macOS Codex installer signing, notarization, or GitHub release artifacts. Prefers the notarized release flow, auto-loads Apple signing variables from the sibling sanka .env, and verifies Gatekeeper acceptance before publishing.
---

# Sanka Plugin Release

Use this skill when working in `/Users/haegwan/Sites/sanka/sanka-plugin` on release packaging, macOS installer signing, notarization, or recovery releases.

## Rules

- Do not publish GitHub releases from `./scripts/build-plugin-package.sh` alone.
- Use `./scripts/release-codex-package.sh` for any public macOS-bearing release.
- The release helpers auto-load Apple signing/notary variables from the sibling `../sanka/.env` file via `scripts/macos-signing-env.sh`.
- Never print secret values from `.env` in chat or logs.
- `SANKA_ALLOW_UNSIGNED_MACOS_APPS=1` is local-dev only and must not be used for a public release.

## Workflow

1. Read [RELEASING.md](/Users/haegwan/Sites/sanka/sanka-plugin/RELEASING.md).
2. Confirm the plugin versions are bumped for the intended release tag.
3. Run `rm -rf dist && ./scripts/release-codex-package.sh`.
4. Verify:
   - `spctl -a -vvv "dist/macos/Install Sanka Plugin.app"`
   - `spctl -a -vvv "dist/macos/Uninstall Sanka Plugin.app"`
5. Extract the final ZIP and verify Gatekeeper again on the extracted apps.
6. Publish the GitHub release only after the downloaded artifact also passes `spctl`.

## Recovery

- If packaging fails on unsigned apps, that is expected. Fix signing/notarization or use the local-only override for unpublished testing.
- If notarization credentials are missing, inspect the sibling `../sanka/.env` first before concluding the machine cannot sign.
