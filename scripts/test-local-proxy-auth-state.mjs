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
const usePluginCwd = process.env.SANKA_CHILD_CWD === "plugin";
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sanka-plugin-auth-state-"));
const foreignCwd = usePluginCwd ? null : fs.mkdtempSync(path.join(os.tmpdir(), "sanka-plugin-foreign-cwd-"));
const childCwd = usePluginCwd ? pluginRoot : foreignCwd;
const mcpManifestPath = path.join(pluginRoot, manifestName);
const mcpManifest = JSON.parse(fs.readFileSync(mcpManifestPath, "utf8"));
const serverConfig = mcpManifest.mcpServers?.sanka;
assert.ok(serverConfig, `${mcpManifestPath} must define the sanka MCP server`);
const clientProtocolVersion = process.env.SANKA_CLIENT_PROTOCOL_VERSION || "2025-06-18";

function resolvePluginCommand(command) {
  return command.startsWith(".") ? path.resolve(pluginRoot, command) : command;
}

const child = spawn(
  resolvePluginCommand(serverConfig.command),
  serverConfig.args ?? [],
  {
    cwd: childCwd,
    env: {
      ...process.env,
      MCP_REMOTE_CONFIG_DIR: tempDir
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

    let message;
    try {
      message = JSON.parse(line);
    } catch (error) {
      throw new Error(`Proxy emitted non-JSON stdout: ${line}`, { cause: error });
    }

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
  const message = { jsonrpc: "2.0", id, method, params };
  child.stdin.write(`${JSON.stringify(message)}\n`);
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timed out waiting for ${method}. Stderr:\n${stderrBuffer}`));
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

function listAuthFiles() {
  if (!fs.existsSync(tempDir)) {
    return [];
  }
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        files.push(path.relative(tempDir, fullPath));
      }
    }
  };
  walk(tempDir);
  return files.sort();
}

try {
  const init = await request(1, "initialize", {
    protocolVersion: clientProtocolVersion,
    capabilities: { elicitation: {} },
    clientInfo: {
      name: "codex-mcp-client",
      title: "Codex",
      version: "0.142.0-alpha.6"
    }
  });
  assert.equal(init.error, undefined, `initialize failed: ${JSON.stringify(init.error)}`);
  assert.equal(
    init.result?.protocolVersion,
    clientProtocolVersion,
    `initialize should preserve the client protocol version; got ${JSON.stringify(init.result?.protocolVersion)}`
  );
  notify("notifications/initialized");

  const tools = await request(2, "tools/list");
  assert.equal(tools.error, undefined, `tools/list failed: ${JSON.stringify(tools.error)}`);
  assert.ok(Array.isArray(tools.result?.tools), "tools/list did not return tools");
  assert.ok(tools.result.tools.some((tool) => tool.name === "auth_status"), "auth_status tool missing");
  const uploadTool = tools.result.tools.find((tool) => tool.name === "upload_expense_attachment");
  assert.equal(uploadTool?.inputSchema?.properties?.local_file_path?.type, "string");

  const auth = await request(3, "tools/call", {
    name: "auth_status",
    arguments: {}
  });
  assert.equal(auth.error, undefined, `auth_status failed: ${JSON.stringify(auth.error)}`);

  const currentWorkspace = await request(4, "tools/call", {
    name: "current_workspace",
    arguments: {}
  });
  assert.equal(
    currentWorkspace.error,
    undefined,
    `current_workspace should return a Sanka tool result instead of triggering native OAuth: ${JSON.stringify(currentWorkspace.error)}`
  );

  const authFiles = listAuthFiles();
  assert.equal(
    authFiles.some(
      (file) =>
        file.endsWith("_client_info.json") ||
        file.endsWith("_lock.json") ||
        file.endsWith("_code_verifier.txt")
    ),
    false,
    `proxy should not create native OAuth client info, lock, or code verifier during unauthenticated attach; saw ${authFiles.join(", ")}`
  );

  console.log("Local proxy auth-state checks passed.");
} finally {
  child.kill("SIGTERM");
  await new Promise((resolve) => child.once("exit", resolve));
  fs.rmSync(tempDir, { recursive: true, force: true });
  if (foreignCwd) {
    fs.rmSync(foreignCwd, { recursive: true, force: true });
  }
}
