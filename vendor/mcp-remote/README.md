Vendored from `mcp-remote@0.1.38`.

Files:

- `chunk-65X3S4HB.js`: copied from upstream package without local edits
- `sanka-local-file-bridge.mjs`: Sanka-specific local-client bridge for exact user-provided local expense attachment paths
- `proxy.mjs`: based on upstream `dist/proxy.js`, patched to apply the local expense attachment bridge and to keep the client's MCP protocol version on `initialize`. Sign-in is upstream `mcp-remote` native MCP OAuth (client name "Sanka Plugin").
- `bundled-proxy.mjs` / `bundled-proxy.cjs`: self-contained unminified rebuild artifacts kept in the source repo and omitted from the packaged plugin copy.
- `bundled-proxy.min.cjs`: self-contained runtime used by `codex.mcp.json`, `.mcp.json`, `claude.mcp.json`, and `mcp.json`. This is packaged because local AI clients do not install `mcp-remote` npm dependencies inside plugin archives.

Patch rationale:

- Hosted Sanka MCP is a standard MCP OAuth protected resource. On its 401 the proxy uses `mcp-remote`'s native OAuth: it registers a public client, opens Sanka's consent page, receives the code on a localhost callback and stores the tokens under `~/.mcp-auth` (or `MCP_REMOTE_CONFIG_DIR`).
- Hosted Sanka MCP cannot read a user's local receipt PDF path directly. Local Sanka Plugin clients expose `local_file_path` on expense attachment upload tools, reads that exact file in the local proxy, and forwards the original bytes as normal hosted MCP upload arguments.

Do not hand-edit the vendored chunk file or bundled artifacts. If upstream changes are needed, refresh from the tagged `mcp-remote` release, re-apply the `proxy.mjs` patch intentionally, then rebuild `bundled-proxy.cjs` and `bundled-proxy.min.cjs`.

Local attachment uploads accept regular files inside the configured upload roots
(or the default Desktop, Documents, Downloads, Pictures, and temporary directories).
UNC/device paths are rejected before filesystem access. An approved root may be a
symlink, but files and directories below it must not be symlinks or junctions; copy
linked receipts into an approved directory before uploading. Paths must use the
configured root spelling or its canonical spelling.
