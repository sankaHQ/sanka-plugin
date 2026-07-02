#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const expectedServerName = "sakura";
function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function assertLocalMcpManifest(relativePath) {
  const manifest = readJSON(relativePath);
  const serverNames = Object.keys(manifest.mcpServers ?? {});
  assert.deepEqual(serverNames, [expectedServerName], `${relativePath} must define only the ${expectedServerName} MCP server`);

  const server = manifest.mcpServers[expectedServerName];
  const args = server.args ?? [];
  assert.equal(args.includes("--host"), false, `${relativePath} must not override the default OAuth callback host`);
}

function assertCodexMcpManifest(relativePath) {
  const manifest = readJSON(relativePath);
  assertLocalMcpManifest(relativePath);
  const server = manifest.mcpServers[expectedServerName];
  const args = server.args ?? [];
  assert.equal(
    server.command,
    "./vendor/mcp-remote/sanka-proxy-launcher.cjs",
    `${relativePath} must launch through the plugin-relative proxy launcher`,
  );
  assert.equal(args[0], "https://mcp.sanka.com/mcp", `${relativePath} must pass the hosted Sanka MCP URL as the first argument`);
  assert.equal(
    args.some((arg) => typeof arg === "string" && arg.startsWith("./vendor/")),
    false,
    `${relativePath} must not pass cwd-relative vendor paths as node arguments`,
  );
}

function assertDirectClientMcpManifest(relativePath) {
  const manifest = readJSON(relativePath);
  assertLocalMcpManifest(relativePath);
  const server = manifest.mcpServers[expectedServerName];
  const args = server.args ?? [];
  assert.equal(server.command, "node", `${relativePath} must launch through node for Windows and shell-less MCP clients`);
  assert.equal(
    args[0],
    "./vendor/mcp-remote/sanka-proxy-launcher.cjs",
    `${relativePath} must execute the local proxy launcher through node`,
  );
  assert.equal(args[1], "https://mcp.sanka.com/mcp", `${relativePath} must pass the hosted Sanka MCP URL after the launcher`);
}

function assertPluginManifest(relativePath) {
  const manifest = readJSON(relativePath);
  assert.equal(manifest.mcpServers, "./.mcp.json", `${relativePath} must load the shared .mcp.json manifest`);
  assert.ok((manifest.interface?.defaultPrompt?.length ?? 0) <= 3, `${relativePath} must keep at most 3 Codex default prompts`);
}

function assertDirectClientPluginManifest(relativePath) {
  const manifest = readJSON(relativePath);
  assert.equal(manifest.mcpServers, "./mcp.json", `${relativePath} must use the direct-client MCP manifest`);
}

function assertCodexMarketplaceManifest(relativePath) {
  const manifest = readJSON(relativePath);
  const sankaPlugin = manifest.plugins?.find((plugin) => plugin?.name === "sakura");
  assert.ok(sankaPlugin, `${relativePath} must include the sakura plugin entry`);
  assert.equal(
    Object.prototype.hasOwnProperty.call(sankaPlugin.policy ?? {}, "authentication"),
    false,
    `${relativePath} must not use Codex plugin-level OAuth gating`,
  );
}

function listOpenAiYamlFiles(root) {
  const results = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, name);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (fullPath.endsWith(path.join("agents", "openai.yaml"))) {
        results.push(fullPath);
      }
    }
  };
  walk(path.join(repoRoot, root));
  return results.sort((left, right) => left.localeCompare(right));
}

for (const manifestPath of [".codex-plugin/plugin.json", "plugins/sakura/.codex-plugin/plugin.json"]) {
  assertPluginManifest(manifestPath);
}

assertCodexMarketplaceManifest(".agents/plugins/marketplace.json");
assertDirectClientPluginManifest(".claude-plugin/plugin.json");
assertDirectClientPluginManifest(".plugin/plugin.json");

for (const manifestPath of [".mcp.json", "codex.mcp.json", "plugins/sakura/.mcp.json", "plugins/sakura/codex.mcp.json"]) {
  assertCodexMcpManifest(manifestPath);
}

for (const manifestPath of ["mcp.json", "plugins/sakura/mcp.json"]) {
  assertDirectClientMcpManifest(manifestPath);
}

const remoteManifest = readJSON("mcp.remote.json");
assert.equal(remoteManifest.mcpServers?.[expectedServerName]?.type, "http", "mcp.remote.json must keep the hosted HTTP transport");

let checkedSkillCount = 0;
for (const root of ["skills", "plugins/sakura/skills"]) {
  for (const filePath of listOpenAiYamlFiles(root)) {
    const relativePath = path.relative(repoRoot, filePath);
    const contents = fs.readFileSync(filePath, "utf8");
    assert.ok(contents.includes(`      value: "${expectedServerName}"`), `${relativePath} must reference ${expectedServerName}`);
    assert.equal(contents.includes("sanka_plugin"), false, `${relativePath} must not reference stale sanka_plugin`);
    checkedSkillCount += 1;
  }
}

console.log(`Codex MCP manifest checks passed for ${checkedSkillCount} OpenAI skill metadata files.`);
