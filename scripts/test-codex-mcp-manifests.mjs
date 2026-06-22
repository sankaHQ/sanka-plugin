#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const expectedServerName = "sanka";
function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function assertLocalMcpManifest(relativePath) {
  const manifest = readJSON(relativePath);
  const serverNames = Object.keys(manifest.mcpServers ?? {});
  assert.deepEqual(serverNames, [expectedServerName], `${relativePath} must define only the ${expectedServerName} MCP server`);

  const args = manifest.mcpServers[expectedServerName].args ?? [];
  assert.equal(args.includes("--host"), false, `${relativePath} must not override the default OAuth callback host`);
}

function assertPluginManifest(relativePath) {
  const manifest = readJSON(relativePath);
  assert.equal(manifest.mcpServers, "./.mcp.json", `${relativePath} must load the shared .mcp.json manifest`);
}

function assertCodexMarketplaceManifest(relativePath) {
  const manifest = readJSON(relativePath);
  const sankaPlugin = manifest.plugins?.find((plugin) => plugin?.name === "sanka");
  assert.ok(sankaPlugin, `${relativePath} must include the sanka plugin entry`);
  assert.equal(
    sankaPlugin.policy?.authentication,
    "ON_USE",
    `${relativePath} must authenticate Sanka only when it is used`,
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

for (const manifestPath of [".codex-plugin/plugin.json", "plugins/sanka/.codex-plugin/plugin.json"]) {
  assertPluginManifest(manifestPath);
}

assertCodexMarketplaceManifest(".agents/plugins/marketplace.json");

for (const manifestPath of [".mcp.json", "codex.mcp.json", "mcp.json", "plugins/sanka/.mcp.json", "plugins/sanka/codex.mcp.json"]) {
  assertLocalMcpManifest(manifestPath);
}

const remoteManifest = readJSON("mcp.remote.json");
assert.equal(remoteManifest.mcpServers?.[expectedServerName]?.type, "http", "mcp.remote.json must keep the hosted HTTP transport");

let checkedSkillCount = 0;
for (const root of ["skills", "plugins/sanka/skills"]) {
  for (const filePath of listOpenAiYamlFiles(root)) {
    const relativePath = path.relative(repoRoot, filePath);
    const contents = fs.readFileSync(filePath, "utf8");
    assert.ok(contents.includes(`      value: "${expectedServerName}"`), `${relativePath} must reference ${expectedServerName}`);
    assert.equal(contents.includes("sanka_plugin"), false, `${relativePath} must not reference stale sanka_plugin`);
    checkedSkillCount += 1;
  }
}

console.log(`Codex MCP manifest checks passed for ${checkedSkillCount} OpenAI skill metadata files.`);
