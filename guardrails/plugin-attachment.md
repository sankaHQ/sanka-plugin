# Sanka Plugin attachment guardrails

This file is a maintainer reference for the packaged plugin behavior. It is not
shipped as a user-facing slash command.

- Live Sanka reads and writes must come from attached hosted MCP tools only.
- Protected MCP tools are the OAuth trigger in clients like Claude Code and Codex.
- Do not fall back to local repo search, terminal commands, Django ORM, or local database access for a plugin request.
- In Claude Code, do not recommend `/sanka` as an entrypoint for live Sanka work.
- If no live Sanka MCP tools are attached in the thread, stop and report a plugin attachment failure.
