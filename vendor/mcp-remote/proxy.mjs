#!/usr/bin/env node
// Vendored from mcp-remote@0.1.38 and patched for local Sanka plugin clients.
//
// Why this exists:
// Local plugin clients must keep the hosted Sanka tool list attached before a
// user signs in, and Sanka's expense upload flow needs to read exact local file
// paths from the user's machine. Authentication should be initiated only when
// the hosted MCP returns an explicit Sanka connect URL, not by preemptively
// starting mcp-remote's native localhost OAuth coordinator during proxy boot.

import {
  JSONRPCMessageSchema,
  NodeOAuthClientProvider,
  connectToRemoteServer,
  createLazyAuthCoordinator,
  debugLog,
  discoverOAuthServerInfo,
  log,
  parseCommandLineArgs,
  setupSignalHandlers
} from "./chunk-65X3S4HB.js";
import {
  LocalFileUploadError,
  augmentToolsListForLocalFileUploads,
  prepareLocalFileUploadToolCall
} from "./sanka-local-file-bridge.mjs";
import { suppressNativeOAuthChallenge } from "./sanka-local-auth-bridge.mjs";
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

function sankaMcpProxy({
  transportToClient,
  transportToServer,
  ignoredTools = []
}) {
  let transportToClientClosed = false;
  let transportToServerClosed = false;
  const pendingRequests = new Map();

  transportToClient.onmessage = (incomingMessage) => {
    Promise.resolve()
      .then(async () => {
        let message = incomingMessage;
        if (message.method === "tools/call" && message.params?.name) {
          const toolName = message.params.name;
          if (!shouldIncludeTool(ignoredTools, toolName)) {
            await sendJsonRpcError(transportToClient, message.id, -32603, `Tool "${toolName}" is not available`);
            return;
          }

          try {
            message = prepareLocalFileUploadToolCall(message);
          } catch (error) {
            const code = error instanceof LocalFileUploadError ? error.code : -32603;
            const errorMessage = error instanceof Error ? error.message : String(error);
            await sendJsonRpcError(transportToClient, message.id, code, errorMessage);
            return;
          }
        }

        log("[Local→Remote]", message.method || message.id);
        debugLog("Local → Remote message", {
          method: message.method,
          id: message.id,
          params: message.params ? JSON.stringify(message.params).substring(0, 500) : void 0
        });

        if (message.method === "initialize") {
          const { clientInfo } = message.params;
          if (clientInfo) clientInfo.name = `${clientInfo.name} (via Sanka Plugin local proxy)`;
          log(JSON.stringify(message, null, 2));
          debugLog("Initialize message with modified client info", { clientInfo });
        }

        if (message.id !== void 0 && message.method) {
          pendingRequests.set(message.id, { method: message.method });
        }

        await transportToServer.send(message);
      })
      .catch(onServerError);
  };

  transportToServer.onmessage = (incomingMessage) => {
    Promise.resolve()
      .then(async () => {
        let message = incomingMessage;
        if (message.id !== void 0) {
          const request = pendingRequests.get(message.id);
          if (request) {
            pendingRequests.delete(message.id);
            if (request.method === "tools/list" && Array.isArray(message.result?.tools)) {
              message = {
                ...message,
                result: {
                  ...message.result,
                  tools: augmentToolsListForLocalFileUploads(
                    message.result.tools.filter((tool) => shouldIncludeTool(ignoredTools, tool.name))
                  )
                }
              };
            }
          }
        }
        message = suppressNativeOAuthChallenge(message);

        log("[Remote→Local]", message.method || message.id);
        debugLog("Remote → Local message", {
          method: message.method,
          id: message.id,
          result: message.result ? "result-present" : void 0,
          error: message.error
        });
        await transportToClient.send(message);
      })
      .catch(onClientError);
  };

  transportToClient.onclose = () => {
    if (transportToServerClosed) {
      return;
    }
    transportToClientClosed = true;
    debugLog("Local transport closed, closing remote transport");
    transportToServer.close().catch(onServerError);
  };
  transportToServer.onclose = () => {
    if (transportToClientClosed) {
      return;
    }
    transportToServerClosed = true;
    debugLog("Remote transport closed, closing local transport");
    transportToClient.close().catch(onClientError);
  };
  transportToClient.onerror = onClientError;
  transportToServer.onerror = onServerError;

  function onClientError(error) {
    log("Error from local client:", error);
    debugLog("Error from local client", { stack: error.stack });
  }
  function onServerError(error) {
    log("Error from remote server:", error);
    debugLog("Error from remote server", { stack: error.stack });
  }
}

async function sendJsonRpcError(transport, id, code, message) {
  if (id === void 0) {
    log("Cannot send JSON-RPC error for notification:", message);
    return;
  }
  await transport.send({
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message
    }
  });
}

function patternToRegex(pattern) {
  const parts = pattern.split("*");
  const escapedParts = parts.map((part) => part.replace(/\W/g, "\\$&"));
  const regexPattern = escapedParts.join(".*");
  return new RegExp(`^${regexPattern}$`, "i");
}

function shouldIncludeTool(ignorePatterns, toolName) {
  if (!ignorePatterns || ignorePatterns.length === 0) {
    return true;
  }
  for (const pattern of ignorePatterns) {
    const regex = patternToRegex(pattern);
    if (regex.test(toolName)) {
      return false;
    }
  }
  return true;
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
    debugLog("Deferring local OAuth callback listener until the remote transport explicitly requires native OAuth");
    const remoteTransport = await connectToRemoteServer(
      null,
      serverUrl,
      authProvider,
      headers,
      authInitializer,
      transportStrategy
    );

    sankaMcpProxy({
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
