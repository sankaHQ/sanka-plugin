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
  const sankaPlugin = manifest.plugins?.find((plugin) => plugin?.name === "sanka");
  assert.ok(sankaPlugin, `${relativePath} must include the sanka plugin entry`);
  assert.equal(
    Object.prototype.hasOwnProperty.call(sankaPlugin.policy ?? {}, "authentication"),
    false,
    `${relativePath} must not use Codex plugin-level OAuth gating`,
  );
}

const legacyPluginIdentifiers = ["sakura", "sanka_plugin", "sanka_key"];

function resolvePluginSourcePath(source) {
  if (typeof source === "string") {
    return source;
  }
  if (source && typeof source === "object" && source.source === "local" && typeof source.path === "string") {
    return source.path;
  }
  return null;
}

function hostedMcpUrlsForPluginSource(relativeSourcePath) {
  const sourceRoot = path.resolve(repoRoot, relativeSourcePath);
  const urls = new Set();
  for (const manifestName of [".mcp.json", "codex.mcp.json", "mcp.json", "mcp.remote.json"]) {
    const manifestPath = path.join(sourceRoot, manifestName);
    if (!fs.existsSync(manifestPath)) {
      continue;
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    for (const server of Object.values(manifest.mcpServers ?? {})) {
      if (typeof server?.url === "string") {
        urls.add(server.url);
      }
      for (const arg of server?.args ?? []) {
        if (typeof arg === "string" && /^https?:\/\//.test(arg)) {
          urls.add(arg);
        }
      }
    }
  }
  return urls;
}

// Guard against re-listing a renamed or duplicate plugin. Installing two marketplace entries that
// attach the same hosted MCP server doubles every client's tool catalog; Codex code mode copies the
// server instructions into each tool definition, so a duplicate once pushed the catalog past the
// 64 MiB IPC frame limit and every shell command failed.
function assertSingleHostedPluginCatalog(relativePath) {
  const manifest = readJSON(relativePath);
  const plugins = manifest.plugins ?? [];
  assert.deepEqual(
    plugins.map((plugin) => plugin?.name),
    [expectedServerName],
    `${relativePath} must list exactly the ${expectedServerName} plugin`,
  );
  const urlOwners = new Map();
  for (const plugin of plugins) {
    const haystack = JSON.stringify(plugin).toLowerCase();
    for (const identifier of legacyPluginIdentifiers) {
      assert.equal(
        haystack.includes(identifier),
        false,
        `${relativePath} must not reference the legacy ${identifier} plugin identifier`,
      );
    }
    const sourcePath = resolvePluginSourcePath(plugin.source);
    assert.ok(sourcePath, `${relativePath} plugin ${plugin.name} must declare a local source path`);
    const urls = hostedMcpUrlsForPluginSource(sourcePath);
    assert.ok(urls.has("https://mcp.sanka.com/mcp"), `${relativePath} plugin ${plugin.name} must attach the hosted Sanka MCP URL`);
    for (const url of urls) {
      const owner = urlOwners.get(url);
      assert.equal(owner, undefined, `${relativePath} lists ${plugin.name} and ${owner} for the same MCP server ${url}`);
      urlOwners.set(url, plugin.name);
    }
  }
}

function assertSinglePackagedPluginDirectory() {
  const packaged = fs
    .readdirSync(path.join(repoRoot, "plugins"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.deepEqual(packaged, [expectedServerName], `plugins/ must contain only the ${expectedServerName} package`);
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

function listSkillFiles(root) {
  return fs
    .readdirSync(path.join(repoRoot, root), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(repoRoot, root, entry.name, "SKILL.md"))
    .filter((filePath) => fs.existsSync(filePath))
    .sort((left, right) => left.localeCompare(right));
}

for (const manifestPath of [".codex-plugin/plugin.json", "plugins/sanka/.codex-plugin/plugin.json"]) {
  assertPluginManifest(manifestPath);
}

assertCodexMarketplaceManifest(".agents/plugins/marketplace.json");
assertSingleHostedPluginCatalog(".agents/plugins/marketplace.json");
assertSingleHostedPluginCatalog(".claude-plugin/marketplace.json");
assertSinglePackagedPluginDirectory();
assertDirectClientPluginManifest(".claude-plugin/plugin.json");
assertDirectClientPluginManifest(".plugin/plugin.json");

for (const manifestPath of [".mcp.json", "codex.mcp.json", "plugins/sanka/.mcp.json", "plugins/sanka/codex.mcp.json"]) {
  assertCodexMcpManifest(manifestPath);
}

for (const manifestPath of ["mcp.json", "plugins/sanka/mcp.json"]) {
  assertDirectClientMcpManifest(manifestPath);
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

  for (const filePath of listSkillFiles(root)) {
    const relativePath = path.relative(repoRoot, filePath);
    const contents = fs.readFileSync(filePath, "utf8");
    for (const unsupportedNativeOauthInstruction of [
      "authorization_url",
      "authorization_server_url",
      "resource_metadata_url",
      "reconnect_rpc_method",
      "reconnect_server_name",
      "launch the MCP client's native",
      "start the client-native Sanka OAuth",
      "authentication challenge",
    ]) {
      assert.equal(
        contents.includes(unsupportedNativeOauthInstruction),
        false,
        `${relativePath} must route authentication through Connect Sanka instead of ${unsupportedNativeOauthInstruction}`,
      );
    }
  }
}

console.log(`Codex MCP manifest checks passed for ${checkedSkillCount} OpenAI skill metadata files.`);
