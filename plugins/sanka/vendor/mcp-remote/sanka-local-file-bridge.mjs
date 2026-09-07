import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DIRECT_UPLOAD_TOOL = "upload_expense_attachment";
const CHUNK_START_TOOL = "start_expense_attachment_upload";
const CHUNK_APPEND_TOOL = "append_expense_attachment_upload_chunk";

const LOCAL_FILE_PATH_FIELD = "local_file_path";
const LOCAL_FILE_MIME_TYPE_FIELD = "local_file_mime_type";
const LOCAL_CHUNK_SIZE_FIELD = "local_chunk_size";
const LOCAL_UPLOAD_ROOTS_ENV = "SANKA_LOCAL_FILE_UPLOAD_DIRS";

const HOSTED_UPLOAD_MAX_BASE64_LENGTH = 12 * 1024 * 1024;
const HOSTED_UPLOAD_MAX_BYTES = Math.floor(HOSTED_UPLOAD_MAX_BASE64_LENGTH / 4) * 3;
const DEFAULT_LOCAL_CHUNK_SIZE = 160000;

const MIME_BY_EXTENSION = new Map([
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".csv", "text/csv"]
]);

export class LocalFileUploadError extends Error {
  constructor(message) {
    super(message);
    this.name = "LocalFileUploadError";
    this.code = -32602;
  }
}

export function augmentToolsListForLocalFileUploads(tools) {
  if (!Array.isArray(tools)) {
    return tools;
  }
  return tools.map((tool) => augmentToolForLocalFileUpload(tool));
}

export function prepareLocalFileUploadToolCall(message) {
  const toolName = message?.params?.name;
  if (!toolName || !isExpenseLocalFileUploadTool(toolName)) {
    return message;
  }

  const args = message?.params?.arguments;
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    return message;
  }
  if (!Object.prototype.hasOwnProperty.call(args, LOCAL_FILE_PATH_FIELD)) {
    return message;
  }

  assertLocalFileToolArguments(args);

  if (typeof args[LOCAL_FILE_PATH_FIELD] !== "string" || args[LOCAL_FILE_PATH_FIELD].trim() === "") {
    throw new LocalFileUploadError(`${LOCAL_FILE_PATH_FIELD} must be a non-empty absolute file path.`);
  }

  if (typeof args.content_base64 === "string" && args.content_base64.length > 0) {
    return cloneToolCallWithArguments(message, stripLocalOnlyArguments(args));
  }

  switch (toolName) {
    case DIRECT_UPLOAD_TOOL:
      return prepareDirectUploadCall(message, args);
    case CHUNK_START_TOOL:
      return prepareChunkStartCall(message, args);
    case CHUNK_APPEND_TOOL:
      return prepareChunkAppendCall(message, args);
    default:
      return message;
  }
}

function augmentToolForLocalFileUpload(tool) {
  if (!tool || !isExpenseLocalFileUploadTool(tool.name)) {
    return tool;
  }

  const inputSchema = cloneSchema(tool.inputSchema);
  inputSchema.properties = {
    ...(inputSchema.properties ?? {}),
    [LOCAL_FILE_PATH_FIELD]: {
      type: "string",
      description:
        "Exact absolute local path to a user-provided receipt or invoice file. The local Sanka plugin proxy reads this file and forwards its original bytes to hosted Sanka MCP; the path is not sent to Sanka."
    }
  };

  if (tool.name === DIRECT_UPLOAD_TOOL || tool.name === CHUNK_START_TOOL) {
    inputSchema.properties[LOCAL_FILE_MIME_TYPE_FIELD] = {
      type: "string",
      description:
        "Optional MIME type override for local_file_path. Defaults from the file extension, for example application/pdf for .pdf."
    };
  }

  if (tool.name === CHUNK_APPEND_TOOL) {
    inputSchema.properties[LOCAL_CHUNK_SIZE_FIELD] = {
      type: "integer",
      minimum: 1,
      maximum: DEFAULT_LOCAL_CHUNK_SIZE,
      description:
        "Optional chunk size to read from local_file_path. Use the chunk_size returned by start_expense_attachment_upload when present."
    };
  }

  inputSchema.required = removeLocalBridgeFilledRequiredFields(tool.name, inputSchema.required);

  if (tool.name === DIRECT_UPLOAD_TOOL && inputSchema.properties.content_base64) {
    inputSchema.properties.content_base64 = {
      ...inputSchema.properties.content_base64,
      description:
        "Base64 file content. In local Sanka Plugin clients, prefer local_file_path for user-provided local receipts instead of manually producing this value."
    };
  }

  return {
    ...tool,
    description: appendDescription(
      tool.description,
      localBridgeDescriptionForTool(tool.name)
    ),
    inputSchema
  };
}

function prepareDirectUploadCall(message, args) {
  const file = readLocalFileForUpload(args[LOCAL_FILE_PATH_FIELD], HOSTED_UPLOAD_MAX_BYTES);
  const nextArgs = {
    ...stripLocalOnlyArguments(args),
    filename: getFilename(args, file.path),
    mime_type: getMimeType(args, file.path),
    content_base64: file.contentBase64
  };
  return cloneToolCallWithArguments(message, nextArgs);
}

function prepareChunkStartCall(message, args) {
  const filePath = normalizeLocalFilePath(args[LOCAL_FILE_PATH_FIELD]);
  const stat = statLocalUploadFile(filePath, HOSTED_UPLOAD_MAX_BYTES);
  const nextArgs = {
    ...stripLocalOnlyArguments(args),
    filename: getFilename(args, stat.path),
    mime_type: getMimeType(args, stat.path),
    byte_length: stat.size,
    content_base64_length: base64LengthForByteLength(stat.size)
  };
  return cloneToolCallWithArguments(message, nextArgs);
}

function prepareChunkAppendCall(message, args) {
  const file = readLocalFileForUpload(args[LOCAL_FILE_PATH_FIELD], HOSTED_UPLOAD_MAX_BYTES);
  const offset = getNonNegativeInteger(args.offset, "offset");
  const localChunkSize = getPositiveInteger(
    args[LOCAL_CHUNK_SIZE_FIELD] ?? args.chunk_size ?? DEFAULT_LOCAL_CHUNK_SIZE,
    LOCAL_CHUNK_SIZE_FIELD
  );

  if (offset > file.contentBase64.length) {
    throw new LocalFileUploadError(
      `offset ${offset} is beyond the local file base64 length ${file.contentBase64.length}.`
    );
  }

  const nextArgs = {
    ...stripLocalOnlyArguments(args),
    content_base64: file.contentBase64.slice(offset, offset + localChunkSize)
  };
  delete nextArgs.chunk_size;
  return cloneToolCallWithArguments(message, nextArgs);
}

function readLocalFileForUpload(localFilePath, maxBytes) {
  const filePath = normalizeLocalFilePath(localFilePath);
  const stat = statLocalUploadFile(filePath, maxBytes);
  const content = fs.readFileSync(stat.path);
  return {
    path: stat.path,
    contentBase64: content.toString("base64")
  };
}

function normalizeLocalFilePath(localFilePath) {
  const filePath = localFilePath.trim();
  if (!path.isAbsolute(filePath)) {
    throw new LocalFileUploadError(`${LOCAL_FILE_PATH_FIELD} must be an absolute path.`);
  }
  return path.resolve(filePath);
}

function statLocalUploadFile(filePath, maxBytes) {
  let stat;
  let realPath;
  try {
    realPath = fs.realpathSync.native(filePath);
    stat = fs.statSync(realPath);
  } catch (error) {
    throw new LocalFileUploadError(
      `Cannot read local attachment file: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!stat.isFile()) {
    throw new LocalFileUploadError(`${LOCAL_FILE_PATH_FIELD} must point to a regular file.`);
  }
  if (stat.size <= 0) {
    throw new LocalFileUploadError("Local attachment file is empty.");
  }
  if (stat.size > maxBytes) {
    throw new LocalFileUploadError(
      `Local attachment file is ${stat.size} bytes, which exceeds the ${maxBytes} byte local upload limit.`
    );
  }
  assertAllowedLocalUploadPath(realPath);
  return {
    path: realPath,
    size: stat.size
  };
}

function assertLocalFileToolArguments(args) {
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    throw new LocalFileUploadError("Tool arguments must be an object when using local_file_path.");
  }
}

function cloneToolCallWithArguments(message, args) {
  return {
    ...message,
    params: {
      ...message.params,
      arguments: args
    }
  };
}

function stripLocalOnlyArguments(args) {
  const nextArgs = { ...args };
  delete nextArgs[LOCAL_FILE_PATH_FIELD];
  delete nextArgs[LOCAL_FILE_MIME_TYPE_FIELD];
  delete nextArgs[LOCAL_CHUNK_SIZE_FIELD];
  return nextArgs;
}

function getFilename(args, filePath) {
  if (typeof args.filename === "string" && args.filename.trim()) {
    return args.filename.trim();
  }
  return path.basename(filePath);
}

function getMimeType(args, filePath) {
  const explicit = args[LOCAL_FILE_MIME_TYPE_FIELD] ?? args.mime_type;
  if (typeof explicit === "string" && explicit.trim()) {
    return explicit.trim();
  }
  return MIME_BY_EXTENSION.get(path.extname(filePath).toLowerCase()) ?? "application/octet-stream";
}

function getNonNegativeInteger(value, fieldName) {
  if (!Number.isInteger(value) || value < 0) {
    throw new LocalFileUploadError(`${fieldName} must be a non-negative integer.`);
  }
  return value;
}

function getPositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new LocalFileUploadError(`${fieldName} must be a positive integer.`);
  }
  return Math.min(value, DEFAULT_LOCAL_CHUNK_SIZE);
}

function base64LengthForByteLength(byteLength) {
  return Math.ceil(byteLength / 3) * 4;
}

function assertAllowedLocalUploadPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!MIME_BY_EXTENSION.has(ext)) {
    throw new LocalFileUploadError(
      `${LOCAL_FILE_PATH_FIELD} must point to a supported attachment type: ${[...MIME_BY_EXTENSION.keys()].join(", ")}.`
    );
  }

  if (hasHiddenPathSegment(filePath)) {
    throw new LocalFileUploadError(`${LOCAL_FILE_PATH_FIELD} must not include hidden files or directories.`);
  }

  const roots = allowedLocalUploadRoots();
  if (!roots.some((root) => pathIsInsideRoot(filePath, root))) {
    throw new LocalFileUploadError(
      `${LOCAL_FILE_PATH_FIELD} must be inside an allowed upload directory. Set ${LOCAL_UPLOAD_ROOTS_ENV} to a ${path.delimiter}-separated allowlist when needed.`
    );
  }
}

function allowedLocalUploadRoots() {
  const configured = (process.env[LOCAL_UPLOAD_ROOTS_ENV] ?? "")
    .split(path.delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean);
  const roots = configured.length > 0 ? configured : defaultLocalUploadRoots();
  return roots
    .map((root) => {
      try {
        return fs.realpathSync.native(path.resolve(root));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function defaultLocalUploadRoots() {
  const home = os.homedir();
  return [
    path.join(home, "Desktop"),
    path.join(home, "Documents"),
    path.join(home, "Downloads"),
    path.join(home, "Pictures"),
    os.tmpdir()
  ];
}

function pathIsInsideRoot(filePath, root) {
  const relative = path.relative(root, filePath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function hasHiddenPathSegment(filePath) {
  const parsed = path.parse(filePath);
  const relative = filePath.slice(parsed.root.length);
  return relative.split(path.sep).some((segment) => segment.startsWith("."));
}

function isExpenseLocalFileUploadTool(toolName) {
  return toolName === DIRECT_UPLOAD_TOOL || toolName === CHUNK_START_TOOL || toolName === CHUNK_APPEND_TOOL;
}

function removeLocalBridgeFilledRequiredFields(toolName, required) {
  if (!Array.isArray(required)) {
    return required;
  }

  const bridgeFilledFields = new Set(["content_base64"]);
  if (toolName === DIRECT_UPLOAD_TOOL || toolName === CHUNK_START_TOOL) {
    bridgeFilledFields.add("filename");
    bridgeFilledFields.add("mime_type");
  }
  if (toolName === CHUNK_START_TOOL) {
    bridgeFilledFields.add("byte_length");
    bridgeFilledFields.add("content_base64_length");
  }

  return required.filter((field) => !bridgeFilledFields.has(field));
}

function localBridgeDescriptionForTool(toolName) {
  if (toolName === DIRECT_UPLOAD_TOOL) {
    return "Local Sanka Plugin clients also accept local_file_path for an exact user-provided local receipt or invoice path; the local proxy reads the file and forwards original bytes as content_base64.";
  }
  if (toolName === CHUNK_START_TOOL) {
    return "Local Sanka Plugin clients also accept local_file_path; the local proxy fills filename, mime_type, byte_length, and content_base64_length from the file.";
  }
  if (toolName === CHUNK_APPEND_TOOL) {
    return "Local Sanka Plugin clients also accept local_file_path plus offset; the local proxy reads the requested base64 chunk and forwards content_base64.";
  }
  return "";
}

function appendDescription(description, addition) {
  if (!addition) {
    return description;
  }
  return description ? `${description}\n\n${addition}` : addition;
}

function cloneSchema(schema) {
  if (!schema || typeof schema !== "object") {
    return { type: "object", properties: {} };
  }
  return JSON.parse(JSON.stringify(schema));
}
