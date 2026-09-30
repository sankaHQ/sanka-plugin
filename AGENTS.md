# sanka-plugin Agent Guide

Canonical agent instructions for this repo; Claude Code and Codex read it directly. Workspace-wide
rules and the repo map live in the sanka-project workspace repo (`../AGENTS.md`).

## What this is

The distributable Sanka plugin for AI clients (Claude Code, Codex, Cursor, and more).
It attaches Sanka's hosted MCP server (`https://mcp.sanka.com/mcp`) and ships the
`$sanka:...` / `/sanka:...` skills. Claude Code installs from the GitHub marketplace
(`/plugin marketplace add sankaHQ/sanka-plugin`); Codex uses the repo-local marketplace.

## Layout

- `skills/` — per-tool skill definitions (one directory per Sanka capability).
- `plugins/sanka/` — the packaged Codex plugin, synced from the root by `scripts/sync-codex-package.mjs`.
  Claude Code installs the repository root (`.claude-plugin/`).
- MCP server attachment manifests per client: `.mcp.json` / `codex.mcp.json` (Codex),
  `claude.mcp.json` (Claude Code; paths anchored at `${CLAUDE_PLUGIN_ROOT}` because Claude Code
  starts plugin MCP servers in the session's working directory), `mcp.json` (Cursor and other
  local clients), `mcp.remote.json` (remote-only clients).
- `guardrails/`, `i18n/`, `vendor/`, `assets/` — supporting material.
- `scripts/` — sync tooling: `sync-codex-package.mjs`, `sync-codex-skill-metadata.mjs`,
  `refresh-codex-plugin.sh`, `rebuild-codex-mcp-remote-vendor.sh`.

## Workflow

- Keep the packaged plugin **thin**: tool logic lives in `sanka-mcp` / the Sanka API;
  this repo only routes, describes, and packages. The end-to-end flow for exposing a
  new capability is the workspace `convert-api-mcp` skill (`../.codex/skills/convert-api-mcp/`).
- When MCP tools change in `../sanka-mcp`, regenerate/sync the matching skill metadata
  here (use the `scripts/` sync tooling rather than hand-editing duplicated metadata).
- Build/notarize/publish of the desktop plugin release is driven by the workspace
  `sanka-plugin-build` skill (`../.codex/skills/sanka-plugin-build/`).

## Gotchas

- This repo is public — no internal URLs, tokens, or workspace paths.
- Skill descriptions double as trigger rules in AI clients; edit them deliberately
  (they affect when clients invoke each tool).
