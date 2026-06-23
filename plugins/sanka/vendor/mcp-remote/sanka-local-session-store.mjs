import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const STORE_DIR_ENV = "SANKA_MCP_SESSION_STORE_DIR";
const STORE_VERSION = 1;

const isUsableSessionId = (value) =>
  typeof value === "string" && /^[A-Za-z0-9._~:-]{8,256}$/.test(value);

const storeDir = () => {
  const configured = process.env[STORE_DIR_ENV]?.trim();
  const dir = configured || path.join(os.homedir(), ".sanka-mcp");
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  try {
    fs.chmodSync(dir, 0o700);
  } catch {
    // Best effort: some filesystems do not support chmod.
  }
  return dir;
};

const storePath = (serverUrl) => {
  const hash = createHash("sha256").update(serverUrl).digest("hex").slice(0, 32);
  return path.join(storeDir(), `mcp-session-${hash}.json`);
};

export const readPersistedMcpSessionId = (serverUrl) => {
  try {
    const filePath = storePath(serverUrl);
    if (!fs.existsSync(filePath)) {
      return undefined;
    }
    const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (
      payload?.version !== STORE_VERSION ||
      payload?.serverUrl !== serverUrl ||
      !isUsableSessionId(payload?.mcpSessionId)
    ) {
      return undefined;
    }
    return payload.mcpSessionId;
  } catch {
    return undefined;
  }
};

export const writePersistedMcpSessionId = (serverUrl, mcpSessionId) => {
  if (!isUsableSessionId(mcpSessionId)) {
    return false;
  }

  const filePath = storePath(serverUrl);
  const tempPath = `${filePath}.${process.pid}.tmp`;
  const payload = {
    version: STORE_VERSION,
    serverUrl,
    mcpSessionId,
    updatedAt: new Date().toISOString()
  };
  fs.writeFileSync(tempPath, `${JSON.stringify(payload, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600
  });
  try {
    fs.chmodSync(tempPath, 0o600);
  } catch {
    // Best effort: writeFileSync mode is enough on normal local filesystems.
  }
  fs.renameSync(tempPath, filePath);
  return true;
};

export const hasMcpSessionHeader = (headers = {}) =>
  Object.keys(headers).some((key) => key.toLowerCase() === "mcp-session-id");

export const applyPersistedMcpSessionHeader = (serverUrl, headers = {}) => {
  if (hasMcpSessionHeader(headers)) {
    return undefined;
  }
  const mcpSessionId = readPersistedMcpSessionId(serverUrl);
  if (!mcpSessionId) {
    return undefined;
  }
  headers["mcp-session-id"] = mcpSessionId;
  return mcpSessionId;
};

export const persistAndApplyMcpSessionHeader = (serverUrl, headers = {}, mcpSessionId) => {
  if (!writePersistedMcpSessionId(serverUrl, mcpSessionId)) {
    return false;
  }
  headers["mcp-session-id"] = mcpSessionId;
  return true;
};
