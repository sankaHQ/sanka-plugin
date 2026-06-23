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
  connectToRemoteServer,
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
import {
  applyPersistedMcpSessionHeader,
  clearPersistedMcpSessionId,
  removeMcpSessionHeader,
  persistAndApplyMcpSessionHeader
} from "./sanka-local-session-store.mjs";
import process2 from "node:process";

const REMOTE_INITIALIZE_PROTOCOL_VERSION = "2024-11-05";

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
  ignoredTools = [],
  onServerSessionId,
  onStaleServerSession
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

        let initializeClientProtocolVersion;
        if (message.method === "initialize") {
          const { clientInfo } = message.params;
          initializeClientProtocolVersion = message.params?.protocolVersion;
          message = {
            ...message,
            params: {
              ...message.params,
              protocolVersion: REMOTE_INITIALIZE_PROTOCOL_VERSION,
              clientInfo: clientInfo
                ? {
                    ...clientInfo,
                    name: "sanka-plugin-local-proxy",
                    title: "Sanka Plugin local proxy"
                  }
                : clientInfo
            }
          };
          log(JSON.stringify(message, null, 2));
          debugLog("Initialize message with proxied client info", {
            originalClientInfo: clientInfo,
            proxiedClientInfo: message.params.clientInfo,
            clientProtocolVersion: initializeClientProtocolVersion,
            remoteProtocolVersion: REMOTE_INITIALIZE_PROTOCOL_VERSION
          });
        }

        if (message.id !== void 0 && message.method) {
          pendingRequests.set(message.id, {
            method: message.method,
            initializeClientProtocolVersion
          });
        }

        try {
          await transportToServer.send(message);
        } catch (error) {
          if (isStaleMcpSessionError(error) && onStaleServerSession) {
            onStaleServerSession(error);
            await sendJsonRpcError(
              transportToClient,
              message.id,
              -32603,
              "Stored Sanka MCP session expired and was cleared. Retry the Sanka tool call to start a fresh session."
            );
            return;
          }
          throw error;
        }
        onServerSessionId?.(transportToServer.sessionId);
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
            } else if (
              request.method === "initialize" &&
              request.initializeClientProtocolVersion &&
              message.result?.protocolVersion
            ) {
              message = {
                ...message,
                result: {
                  ...message.result,
                  protocolVersion: request.initializeClientProtocolVersion
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

function isStaleMcpSessionError(error) {
  const code = Number(error?.code ?? error?.status ?? error?.statusCode ?? 0);
  const message = String(error?.message ?? error ?? "").toLowerCase();
  if (message.includes("mcp-session-id")) {
    return true;
  }
  if (message.includes("session") && /(invalid|unknown|expired|not found|missing)/.test(message)) {
    return true;
  }
  return code === 400 || code === 404;
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
  const remoteHeaders = { ...(headers ?? {}) };
  const restoredSessionId = applyPersistedMcpSessionHeader(serverUrl, remoteHeaders);
  if (restoredSessionId) {
    debugLog("Restored persisted Sanka MCP session id for local proxy");
  }

  log("Discovering OAuth server configuration...");
  const discoveryResult = await discoverOAuthServerInfo(serverUrl, remoteHeaders);
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

  const authProvider = null;

  const localTransport = new StdioServerTransport();

  const authInitializer = async () => {
    throw new Error(
      "Sanka Plugin disables mcp-remote native OAuth. Use the hosted Sanka MCP connect_url returned by Sanka tools."
    );
  };

  const clearRestoredSession = (error) => {
    clearPersistedMcpSessionId(serverUrl);
    removeMcpSessionHeader(remoteHeaders);
    log("Stored Sanka MCP session id was rejected; cleared it and will use a fresh session.");
    debugLog("Cleared stale persisted Sanka MCP session id", {
      errorMessage: error instanceof Error ? error.message : String(error)
    });
  };

  const connectRemoteTransport = async () => {
    try {
      return await connectToRemoteServer(
        null,
        serverUrl,
        authProvider,
        remoteHeaders,
        authInitializer,
        transportStrategy
      );
    } catch (error) {
      if (!restoredSessionId || !isStaleMcpSessionError(error)) {
        throw error;
      }
      clearRestoredSession(error);
      return await connectToRemoteServer(
        null,
        serverUrl,
        authProvider,
        remoteHeaders,
        authInitializer,
        transportStrategy
      );
    }
  };

  try {
    debugLog("Native mcp-remote OAuth is disabled for the Sanka local proxy");
    const remoteTransport = await connectRemoteTransport();

    sankaMcpProxy({
      transportToClient: localTransport,
      transportToServer: remoteTransport,
      ignoredTools,
      onStaleServerSession: clearRestoredSession,
      onServerSessionId: (sessionId) => {
        if (persistAndApplyMcpSessionHeader(serverUrl, remoteHeaders, sessionId)) {
          debugLog("Persisted Sanka MCP session id for local proxy reuse");
        }
      }
    });

    await localTransport.start();
    log("Local STDIO server running");
    log(`Proxy established successfully between local STDIO and remote ${remoteTransport.constructor.name}`);
    log("Press Ctrl+C to exit");

    const cleanup = async () => {
      await remoteTransport.close();
      await localTransport.close();
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
