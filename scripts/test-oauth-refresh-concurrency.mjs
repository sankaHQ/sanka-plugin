#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { createInterface } from "node:readline";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const launcher = process.env.SANKA_TEST_PROXY_LAUNCHER ??
  fileURLToPath(new URL("../plugins/sanka/vendor/mcp-remote/sanka-proxy-launcher.cjs", import.meta.url));
const codex = process.env.SANKA_TEST_CODEX;
const temp = await mkdtemp(path.join(tmpdir(), "sanka-oauth-test-"));
const children = [];
const refreshRequests = [];
const rejected = [];
const scope = "mcp:access";
const tool = { name: "oauth_fixture", inputSchema: { type: "object" } };
const cached = (access_token, refresh_token) => ({ access_token, refresh_token, token_type: "Bearer", expires_in: 3600, scope });
const original = cached("expired-access", "original-refresh");
const rotated = cached("fresh-access", "rotated-refresh");

const server = createServer(async (request, response) => {
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    const resource = `${origin}/mcp`;
    function json(status, body) {
      response.writeHead(status, { "content-type": "application/json" });
      response.end(JSON.stringify(body));
    }
    if (request.url === "/.well-known/oauth-protected-resource/mcp") {
      return json(200, { resource, authorization_servers: [origin], scopes_supported: [scope] });
    }
    if (request.url === "/.well-known/oauth-authorization-server") {
      return json(200, {
        issuer: origin, authorization_endpoint: `${origin}/authorize`, token_endpoint: `${origin}/token`,
        response_types_supported: ["code"], grant_types_supported: ["refresh_token"],
        token_endpoint_auth_methods_supported: ["none"], code_challenge_methods_supported: ["S256"],
      });
    }
    if (request.url === "/token") {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const form = new URLSearchParams(Buffer.concat(chunks).toString());
      assert.equal(form.get("grant_type"), "refresh_token");
      refreshRequests.push(form.get("refresh_token"));
      if (refreshRequests.length > 1) {
        // The losing process sees invalid_grant after the winning process writes its tokens.
        for (let attempt = 0; attempt < 40; attempt++) {
          if ((await readFile(tokenFile, "utf8")).includes(rotated.refresh_token)) break;
          await delay(25);
        }
        return json(400, { error: "invalid_grant", error_description: "Refresh token was already used." });
      }
      await delay(350);
      return json(200, rotated);
    }
    if (request.url !== "/mcp") return json(404, {});
    const challenge = `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource/mcp", scope="${scope}"`;
    if (request.method === "POST") {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const message = JSON.parse(Buffer.concat(chunks).toString());
      if (request.headers.authorization === `Bearer ${original.access_token}`) {
        // Both processes must send the expired token before either sees the challenge.
        rejected.push(response);
        if (rejected.length === 2) {
          for (const pending of rejected) pending.writeHead(401, { "www-authenticate": challenge }).end();
        }
        return;
      }
      assert.equal(request.headers.authorization, `Bearer ${rotated.access_token}`);
      if (message.id === undefined) return response.writeHead(202).end();
      const result = {
        initialize: { protocolVersion: message.params?.protocolVersion, capabilities: { tools: {} }, serverInfo: { name: "fixture", version: "1" } },
        "tools/list": { tools: [tool] },
        "resources/list": { resources: [] },
        "resources/templates/list": { resourceTemplates: [] },
      }[message.method];
      assert.ok(result, message.method);
      return json(200, { jsonrpc: "2.0", id: message.id, result });
    }
    if (request.headers.authorization === `Bearer ${rotated.access_token}`) return response.writeHead(405).end();
    response.writeHead(401, { "www-authenticate": challenge }).end();
  } catch (error) {
    console.error(error);
    response.writeHead(500).end();
  }
});

server.listen(0, "127.0.0.1");
await once(server, "listening");
const resource = `http://127.0.0.1:${server.address().port}/mcp`;
const hash = createHash("md5").update(resource).digest("hex");
const cache = path.join(temp, "mcp-remote-0.1.37");
const tokenFile = path.join(cache, `${hash}_tokens.json`);

async function startClient(index) {
  const args = [launcher, resource];
  const codexHome = path.join(temp, `codex-${index}`);
  await mkdir(codexHome);
  const child = spawn(codex || process.execPath, codex ? [
    "app-server",
    "-c", `mcp_servers.sanka.command=${JSON.stringify(process.execPath)}`,
    "-c", `mcp_servers.sanka.args=${JSON.stringify(args)}`,
    "-c", 'mcp_servers.sanka.env_vars=["MCP_REMOTE_CONFIG_DIR","NODE_OPTIONS"]',
    "-c", "mcp_servers.sanka.startup_timeout_sec=12",
  ] : args, {
    cwd: codexHome,
    env: { ...process.env, CODEX_HOME: codexHome, MCP_REMOTE_CONFIG_DIR: temp, NODE_OPTIONS: `--require=${path.join(temp, "block-browser.cjs")}` },
    stdio: "pipe",
  });
  children.push(child);
  let stderr = "";
  child.stdin.on("error", () => {});
  const send = message => child.stdin.write(JSON.stringify({ jsonrpc: "2.0", ...message }) + "\n");
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Client ${index} timed out\n${stderr}`)), 15_000);
    child.stderr.on("data", chunk => {
      stderr += chunk;
      if (stderr.includes("Please authorize this client")) {
        clearTimeout(timer);
        reject(new Error(`Client ${index} requested browser authorization`));
      }
    });
    child.once("error", error => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("exit", code => {
      clearTimeout(timer);
      reject(new Error(`Client ${index} exited (${code})\n${stderr}`));
    });
    createInterface({ input: child.stdout }).on("line", line => {
      const message = JSON.parse(line);
      if (message.id === 1) {
        send({ method: codex ? "initialized" : "notifications/initialized" });
        send({ id: 2, method: codex ? "mcpServerStatus/list" : "tools/list", params: {} });
      }
      if (message.id === 2) {
        clearTimeout(timer);
        resolve({ result: message.result, stderr });
      }
    });
    send({ id: 1, method: "initialize", params: codex ? {
      clientInfo: { name: "oauth-fixture", version: "1" },
    } : {
      protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "fixture", version: "1" },
    } });
  });
}

try {
  await mkdir(cache);
  await writeFile(tokenFile, JSON.stringify(original));
  await writeFile(path.join(cache, `${hash}_client_info.json`), JSON.stringify({
    client_id: "fixture-client", redirect_uris: ["http://localhost:0/oauth/callback"],
  }));
  // Fail closed if the code under test tries to open the consent page.
  await writeFile(path.join(temp, "block-browser.cjs"), `
const child = require("node:child_process");
child.spawn = command => {
  require("node:fs").writeFileSync(require("node:path").join(process.env.MCP_REMOTE_CONFIG_DIR, "browser-requested"), "1");
  throw new Error("Unexpected browser launch: " + command);
};
require("node:module").syncBuiltinESMExports();
`);
  const results = await Promise.all([startClient(1), startClient(2)]);
  assert.equal(rejected.length, 2);
  assert.deepEqual(refreshRequests, [original.refresh_token]);
  assert.deepEqual(JSON.parse(await readFile(tokenFile, "utf8")), rotated);
  assert.equal(await readFile(path.join(temp, "browser-requested"), "utf8").catch(error => {
    if (error.code === "ENOENT") return "";
    throw error;
  }), "", "Consent browser was requested");
  for (const { result, stderr } of results) {
    const tools = codex ? Object.values(result?.data?.find(server => server.name === "sanka")?.tools ?? {}) : result?.tools;
    assert.ok(tools?.some(entry => entry.name === tool.name), JSON.stringify(result));
    assert.doesNotMatch(stderr, /Please authorize this client|Unexpected browser launch/);
  }
  console.log(`Two ${codex ? "Codex app-server" : "MCP proxy"} processes connected, one token refresh, no browser authorization.`);
} finally {
  const exits = children.filter(child => child.pid && child.exitCode === null && child.signalCode === null)
    .map(child => {
      const exited = once(child, "exit");
      child.kill();
      return exited;
    });
  server.closeAllConnections();
  server.close();
  await Promise.all(exits);
  await rm(temp, { recursive: true, force: true });
}
