#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const pluginRoot = process.env.SANKA_PLUGIN_ROOT
  ? path.resolve(process.env.SANKA_PLUGIN_ROOT)
  : repoRoot;
const manifestName = process.env.SANKA_MCP_MANIFEST || ".mcp.json";
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sanka-plugin-session-reuse-"));
const foreignCwd = fs.mkdtempSync(path.join(os.tmpdir(), "sanka-plugin-session-reuse-cwd-"));
const mcpManifestPath = path.join(pluginRoot, manifestName);
const mcpManifest = JSON.parse(fs.readFileSync(mcpManifestPath, "utf8"));
const serverConfig = mcpManifest.mcpServers?.sanka;
assert.ok(serverConfig, `${mcpManifestPath} must define the sanka MCP server`);

function resolvePluginCommand(command) {
  return command.startsWith(".") ? path.resolve(pluginRoot, command) : command;
}

function decodeSessionIdFromConnectUrl(connectUrl) {
  const token = new URL(connectUrl).searchParams.get("token");
  assert.ok(token, `connect_url missing token: ${connectUrl}`);
  const [payload] = token.split(".");
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  assert.equal(decoded.v, 1);
  assert.equal(Array.isArray(decoded.scp), true);
  assert.equal(decoded.scp.includes("mcp:access"), true);
  assert.equal(typeof decoded.sid, "string");
  return decoded.sid;
}

async function runUnauthenticatedCurrentWorkspace(runId) {
  const child = spawn(
    resolvePluginCommand(serverConfig.command),
    serverConfig.args ?? [],
    {
      cwd: foreignCwd,
      env: {
        ...process.env,
        MCP_REMOTE_CONFIG_DIR: tempDir,
        SANKA_MCP_SESSION_STORE_DIR: tempDir
      },
      stdio: ["pipe", "pipe", "pipe"]
    }
  );

  let stdoutBuffer = "";
  let stderrBuffer = "";
  const pending = new Map();

  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdoutBuffer += chunk;
    while (true) {
      const index = stdoutBuffer.indexOf("\n");
      if (index === -1) {
        break;
      }
      const line = stdoutBuffer.slice(0, index).trim();
      stdoutBuffer = stdoutBuffer.slice(index + 1);
      if (!line) {
        continue;
      }
      const message = JSON.parse(line);
      if (message.id != null && pending.has(message.id)) {
        pending.get(message.id)(message);
        pending.delete(message.id);
      }
    }
  });

  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderrBuffer += chunk;
  });

  function request(id, method, params = {}) {
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Timed out waiting for ${method} in run ${runId}. Stderr:\n${stderrBuffer}`));
      }, 20000);
      pending.set(id, (response) => {
        clearTimeout(timeout);
        resolve(response);
      });
    });
  }

  function notify(method, params = {}) {
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
  }

  try {
    const init = await request(1, "initialize", {
      protocolVersion: "2025-06-18",
      capabilities: { elicitation: {} },
      clientInfo: {
        name: "codex-mcp-client",
        title: "Codex",
        version: `session-reuse-${runId}`
      }
    });
    assert.equal(init.error, undefined, `initialize failed: ${JSON.stringify(init.error)}`);
    notify("notifications/initialized");

    const currentWorkspace = await request(2, "tools/call", {
      name: "current_workspace",
      arguments: {}
    });
    assert.equal(
      currentWorkspace.error,
      undefined,
      `current_workspace should return a Sanka tool result: ${JSON.stringify(currentWorkspace.error)}`
    );
    const connectUrl = currentWorkspace.result?.structuredContent?.connect_url;
    assert.equal(typeof connectUrl, "string", `current_workspace missing connect_url: ${JSON.stringify(currentWorkspace)}`);
    return decodeSessionIdFromConnectUrl(connectUrl);
  } finally {
    child.kill("SIGTERM");
    await new Promise((resolve) => child.once("exit", resolve));
  }
}

try {
  const firstSessionId = await runUnauthenticatedCurrentWorkspace("first");
  const secondSessionId = await runUnauthenticatedCurrentWorkspace("second");
  assert.equal(secondSessionId, firstSessionId);
  console.log("Local proxy session-reuse checks passed.");
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.rmSync(foreignCwd, { recursive: true, force: true });
}
