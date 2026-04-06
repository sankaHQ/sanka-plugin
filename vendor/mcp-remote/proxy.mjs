#!/usr/bin/env node
// Vendored from mcp-remote@0.1.38 and patched for the Codex plugin.
//
// Why this exists:
// Upstream mcp-remote opens the browser during a later tools/call 401 flow, but
// it does not start the localhost OAuth callback server first in that path. Codex
// then launches the authorization URL with a redirect_uri on 127.0.0.1 while
// nothing is listening, so the OAuth round-trip never completes.
//
// This wrapper eagerly initializes the auth coordinator before the first remote
// call so the callback listener is already running when the browser is opened.

import {
  JSONRPCMessageSchema,
  NodeOAuthClientProvider,
  connectToRemoteServer,
  createLazyAuthCoordinator,
  debugLog,
  discoverOAuthServerInfo,
  log,
  mcpProxy,
  parseCommandLineArgs,
  setupSignalHandlers
} from "./chunk-65X3S4HB.js";
import { EventEmitter } from "events";
import process2 from "node:process";

class ReadBuffer {
  append(chunk) {
    this._buffer = this._buffer ? Buffer.concat([this._buffer, chunk]) : chunk;
  }

  readMessage() {
    if (!this._buffer) {
      return null;
    }

    const index = this._buffer.indexOf("\n");
    if (index === -1) {
      return null;
    }

    const line = this._buffer.toString("utf8", 0, index).replace(/\r$/, "");
    this._buffer = this._buffer.subarray(index + 1);
    return deserializeMessage(line);
  }

  clear() {
    this._buffer = void 0;
  }
}

function deserializeMessage(line) {
  return JSONRPCMessageSchema.parse(JSON.parse(line));
}

function serializeMessage(message) {
  return JSON.stringify(message) + "\n";
}

class StdioServerTransport {
  constructor(_stdin = process2.stdin, _stdout = process2.stdout) {
    this._stdin = _stdin;
    this._stdout = _stdout;
    this._readBuffer = new ReadBuffer();
    this._started = false;
    this._ondata = (chunk) => {
      this._readBuffer.append(chunk);
      this.processReadBuffer();
    };
    this._onerror = (error) => {
      this.onerror?.(error);
    };
  }

  async start() {
    if (this._started) {
      throw new Error("StdioServerTransport already started! If using Server class, note that connect() calls start() automatically.");
    }

    this._started = true;
    this._stdin.on("data", this._ondata);
    this._stdin.on("error", this._onerror);
  }

  processReadBuffer() {
    while (true) {
      try {
        const message = this._readBuffer.readMessage();
        if (message === null) {
          break;
        }
        this.onmessage?.(message);
      } catch (error) {
        this.onerror?.(error);
      }
    }
  }

  async close() {
    this._stdin.off("data", this._ondata);
    this._stdin.off("error", this._onerror);

    const remainingDataListeners = this._stdin.listenerCount("data");
    if (remainingDataListeners === 0) {
      this._stdin.pause();
    }

    this._readBuffer.clear();
    this.onclose?.();
  }

  send(message) {
    return new Promise((resolve) => {
      const json = serializeMessage(message);
      if (this._stdout.write(json)) {
        resolve();
      } else {
        this._stdout.once("drain", resolve);
      }
    });
  }
}

async function runProxy(
  serverUrl,
  callbackPort,
  headers,
  transportStrategy = "http-first",
  host,
  staticOAuthClientMetadata,
  staticOAuthClientInfo,
  authorizeResource,
  ignoredTools,
  authTimeoutMs,
  serverUrlHash
) {
  const events = new EventEmitter();
  const authCoordinator = createLazyAuthCoordinator(serverUrlHash, callbackPort, events, authTimeoutMs);

  log("Discovering OAuth server configuration...");
  const discoveryResult = await discoverOAuthServerInfo(serverUrl, headers);
  if (discoveryResult.protectedResourceMetadata) {
    log(`Discovered authorization server: ${discoveryResult.authorizationServerUrl}`);
    if (discoveryResult.protectedResourceMetadata.scopes_supported) {
      debugLog("Protected Resource Metadata scopes", {
        scopes_supported: discoveryResult.protectedResourceMetadata.scopes_supported
      });
    }
  } else {
    debugLog("No Protected Resource Metadata found, using server URL as authorization server");
  }

  const authProvider = new NodeOAuthClientProvider({
    serverUrl: discoveryResult.authorizationServerUrl,
    callbackPort,
    host,
    clientName: "MCP CLI Proxy",
    staticOAuthClientMetadata,
    staticOAuthClientInfo,
    authorizeResource,
    serverUrlHash,
    authorizationServerMetadata: discoveryResult.authorizationServerMetadata,
    protectedResourceMetadata: discoveryResult.protectedResourceMetadata,
    wwwAuthenticateScope: discoveryResult.wwwAuthenticateScope
  });

  const localTransport = new StdioServerTransport();
  let server = null;

  const authInitializer = async () => {
    const authState = await authCoordinator.initializeAuth();
    server = authState.server;
    if (authState.skipBrowserAuth) {
      log("Authentication was completed by another instance - will use tokens from disk");
      await new Promise((res) => setTimeout(res, 1000));
    }
    return {
      waitForAuthCode: authState.waitForAuthCode,
      skipBrowserAuth: authState.skipBrowserAuth
    };
  };

  try {
    log("Preparing local OAuth callback listener...");
    await authInitializer();

    const remoteTransport = await connectToRemoteServer(
      null,
      serverUrl,
      authProvider,
      headers,
      authInitializer,
      transportStrategy
    );

    mcpProxy({
      transportToClient: localTransport,
      transportToServer: remoteTransport,
      ignoredTools
    });

    await localTransport.start();
    log("Local STDIO server running");
    log(`Proxy established successfully between local STDIO and remote ${remoteTransport.constructor.name}`);
    log("Press Ctrl+C to exit");

    const cleanup = async () => {
      await remoteTransport.close();
      await localTransport.close();
      if (server) {
        server.close();
      }
    };

    setupSignalHandlers(cleanup);
  } catch (error) {
    log("Fatal error:", error);
    if (error instanceof Error && error.message.includes("self-signed certificate in certificate chain")) {
      log(`You may be behind a VPN!

If you are behind a VPN, you can try setting the NODE_EXTRA_CA_CERTS environment variable to point
to the CA certificate file.`);
    }

    if (server) {
      server.close();
    }
    process.exit(1);
  }
}

parseCommandLineArgs(process.argv.slice(2), "Usage: node proxy.mjs <https://server-url> [callback-port] [--debug]")
  .then(
    ({
      serverUrl,
      callbackPort,
      headers,
      transportStrategy,
      host,
      staticOAuthClientMetadata,
      staticOAuthClientInfo,
      authorizeResource,
      ignoredTools,
      authTimeoutMs,
      serverUrlHash
    }) =>
      runProxy(
        serverUrl,
        callbackPort,
        headers,
        transportStrategy,
        host,
        staticOAuthClientMetadata,
        staticOAuthClientInfo,
        authorizeResource,
        ignoredTools,
        authTimeoutMs,
        serverUrlHash
      )
  )
  .catch((error) => {
    log("Fatal error:", error);
    process.exit(1);
  });
