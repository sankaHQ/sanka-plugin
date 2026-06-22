Vendored from `mcp-remote@0.1.38`.

Files:

- `chunk-65X3S4HB.js`: copied from upstream package without local edits
- `sanka-local-file-bridge.mjs`: Sanka-specific local-client bridge for exact user-provided local expense attachment paths
- `proxy.mjs`: based on upstream `dist/proxy.js`, patched to keep tools attached before Sanka sign-in, disable `mcp-remote` native localhost OAuth, suppress native OAuth challenges in tool results, and apply the local expense attachment bridge.
- `bundled-proxy.mjs` / `bundled-proxy.cjs`: self-contained unminified rebuild artifacts kept in the source repo and omitted from the packaged plugin copy.
- `bundled-proxy.min.cjs`: self-contained runtime used by `codex.mcp.json`, `.mcp.json`, and `mcp.json`. This is packaged because local AI clients do not install `mcp-remote` npm dependencies inside plugin archives.

Patch rationale:

- Local AI clients must be able to list and attach Sanka tools before Sanka sign-in completes.
- Starting the native `mcp-remote` localhost OAuth coordinator creates stale `client_info.json`, `lock.json`, and `code_verifier.txt` files when the client does not complete or persist that OAuth round-trip.
- The Sanka proxy therefore disables native `mcp-remote` OAuth and suppresses tool-result `mcp/www_authenticate` metadata, leaving the hosted MCP `connect_url` in the normal tool result so agents can surface the stable Sanka connect link without losing the tool list.
- Hosted Sanka MCP cannot read a user's local receipt PDF path directly. Local Sanka Plugin clients expose `local_file_path` on expense attachment upload tools, reads that exact file in the local proxy, and forwards the original bytes as normal hosted MCP upload arguments.

Do not hand-edit the vendored chunk file or bundled artifacts. If upstream changes are needed, refresh from the tagged `mcp-remote` release, re-apply the `proxy.mjs` patch intentionally, then rebuild `bundled-proxy.cjs` and `bundled-proxy.min.cjs`.
