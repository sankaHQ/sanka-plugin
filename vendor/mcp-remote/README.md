Vendored from `mcp-remote@0.1.38`.

Files:

- `chunk-65X3S4HB.js`: copied from upstream package without local edits
- `proxy.mjs`: based on upstream `dist/proxy.js`, patched to eagerly start the OAuth callback listener for Codex
- `bundled-proxy.cjs`: self-contained runtime artifact used by `codex.mcp.json`

Patch rationale:

- Codex triggers Sanka OAuth from a later `tools/call` request.
- Upstream `mcp-remote` opens the browser in that path before a localhost callback server is listening.
- The authorization flow then redirects to `127.0.0.1` with no listener, so OAuth never completes.

Do not hand-edit the vendored chunk file or bundled artifact. If upstream changes are needed, refresh from the tagged `mcp-remote` release, re-apply the `proxy.mjs` patch intentionally, then rebuild `bundled-proxy.cjs`.
