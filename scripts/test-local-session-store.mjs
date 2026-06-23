#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sanka-plugin-session-store-"));
process.env.SANKA_MCP_SESSION_STORE_DIR = tempDir;

const {
  applyPersistedMcpSessionHeader,
  clearPersistedMcpSessionId,
  hasMcpSessionHeader,
  persistAndApplyMcpSessionHeader,
  readPersistedMcpSessionId,
  removeMcpSessionHeader,
  writePersistedMcpSessionId
} = await import("../vendor/mcp-remote/sanka-local-session-store.mjs");

try {
  const serverUrl = "https://mcp.sanka.com/mcp";
  const headers = {};

  assert.equal(readPersistedMcpSessionId(serverUrl), undefined);
  assert.equal(applyPersistedMcpSessionHeader(serverUrl, headers), undefined);
  assert.equal(hasMcpSessionHeader(headers), false);

  assert.equal(writePersistedMcpSessionId(serverUrl, "session-one"), true);
  assert.equal(readPersistedMcpSessionId(serverUrl), "session-one");
  assert.equal(applyPersistedMcpSessionHeader(serverUrl, headers), "session-one");
  assert.equal(headers["mcp-session-id"], "session-one");
  assert.equal(hasMcpSessionHeader(headers), true);

  assert.equal(persistAndApplyMcpSessionHeader(serverUrl, headers, "session-two"), true);
  assert.equal(headers["mcp-session-id"], "session-two");
  assert.equal(readPersistedMcpSessionId(serverUrl), "session-two");
  removeMcpSessionHeader(headers);
  assert.equal(hasMcpSessionHeader(headers), false);
  assert.equal(readPersistedMcpSessionId(serverUrl), "session-two");

  const files = fs.readdirSync(tempDir);
  assert.equal(files.length, 1);
  const mode = fs.statSync(path.join(tempDir, files[0])).mode & 0o777;
  assert.equal(mode, 0o600);

  assert.equal(writePersistedMcpSessionId(serverUrl, "../bad"), false);
  assert.equal(readPersistedMcpSessionId(serverUrl), "session-two");
  assert.equal(clearPersistedMcpSessionId(serverUrl), true);
  assert.equal(readPersistedMcpSessionId(serverUrl), undefined);

  console.log("Local MCP session-store checks passed.");
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
