Vendored from `mcp-remote@0.1.38`.

Files:

- `chunk-65X3S4HB.js`: copied from upstream package without local edits
- `sanka-local-file-bridge.mjs`: Sanka-specific local-client bridge for exact user-provided local expense attachment paths
- `proxy.mjs`: based on upstream `dist/proxy.js`, patched to eagerly start the OAuth callback listener for local AI clients and to apply the local expense attachment bridge.
- `bundled-proxy.cjs`: self-contained unminified rebuild artifact kept in the source repo and omitted from the packaged plugin copy.
- `bundled-proxy.min.cjs`: self-contained runtime used by `codex.mcp.json`, `.mcp.json`, and `mcp.json`. This is packaged because local AI clients do not install `mcp-remote` npm dependencies inside plugin archives.

Patch rationale:

- Local AI clients can trigger Sanka OAuth from a later `tools/call` request.
- Upstream `mcp-remote` opens the browser in that path before a localhost callback server is listening.
- The authorization flow then redirects to `127.0.0.1` with no listener, so OAuth never completes.
- Hosted Sanka MCP cannot read a user's local receipt PDF path directly. Local Sanka Plugin clients expose `local_file_path` on expense attachment upload tools, reads that exact file in the local proxy, and forwards the original bytes as normal hosted MCP upload arguments.

Do not hand-edit the vendored chunk file or bundled artifacts. If upstream changes are needed, refresh from the tagged `mcp-remote` release, re-apply the `proxy.mjs` patch intentionally, then rebuild `bundled-proxy.cjs` and `bundled-proxy.min.cjs`.
