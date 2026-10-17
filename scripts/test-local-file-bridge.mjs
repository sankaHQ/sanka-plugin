#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  augmentToolsListForLocalFileUploads,
  prepareLocalFileUploadToolCall
} from "../vendor/mcp-remote/sanka-local-file-bridge.mjs";
import { suppressNativeOAuthChallenge } from "../vendor/mcp-remote/sanka-local-auth-bridge.mjs";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sanka-plugin-upload-"));

try {
  const filePath = path.join(tempDir, "receipt.pdf");
  const bytes = Buffer.from("%PDF-1.4\nSanka receipt fixture\n%%EOF\n", "utf8");
  fs.writeFileSync(filePath, bytes);
  const expectedBase64 = bytes.toString("base64");

  const direct = prepareLocalFileUploadToolCall({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "upload_expense_attachment",
      arguments: { local_file_path: filePath }
    }
  });
  assert.equal(direct.params.arguments.filename, "receipt.pdf");
  assert.equal(direct.params.arguments.mime_type, "application/pdf");
  assert.equal(direct.params.arguments.content_base64, expectedBase64);
  assert.equal("local_file_path" in direct.params.arguments, false);

  const start = prepareLocalFileUploadToolCall({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "start_expense_attachment_upload",
      arguments: { local_file_path: filePath }
    }
  });
  assert.equal(start.params.arguments.filename, "receipt.pdf");
  assert.equal(start.params.arguments.byte_length, bytes.length);
  assert.equal(start.params.arguments.content_base64_length, expectedBase64.length);
  assert.equal("local_file_path" in start.params.arguments, false);

  const append = prepareLocalFileUploadToolCall({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "append_expense_attachment_upload_chunk",
      arguments: {
        upload_token: "tok",
        offset: 4,
        local_chunk_size: 10,
        local_file_path: filePath
      }
    }
  });
  assert.equal(append.params.arguments.content_base64, expectedBase64.slice(4, 14));
  assert.equal(append.params.arguments.upload_token, "tok");
  assert.equal("local_file_path" in append.params.arguments, false);
  assert.equal("local_chunk_size" in append.params.arguments, false);

  const unsupportedPath = path.join(tempDir, "secret.key");
  fs.writeFileSync(unsupportedPath, "not an attachment");
  assert.throws(
    () =>
      prepareLocalFileUploadToolCall({
        jsonrpc: "2.0",
        id: 31,
        method: "tools/call",
        params: {
          name: "upload_expense_attachment",
          arguments: { local_file_path: unsupportedPath }
        }
      }),
    /supported attachment type/
  );

  const hiddenDir = path.join(tempDir, ".hidden");
  fs.mkdirSync(hiddenDir);
  const hiddenPath = path.join(hiddenDir, "receipt.pdf");
  fs.writeFileSync(hiddenPath, bytes);
  assert.throws(
    () =>
      prepareLocalFileUploadToolCall({
        jsonrpc: "2.0",
        id: 32,
        method: "tools/call",
        params: {
          name: "upload_expense_attachment",
          arguments: { local_file_path: hiddenPath }
        }
      }),
    /hidden files or directories/
  );

  // No denied model-supplied path may reach the filesystem, through any tool.
  const originalRoots = process.env.SANKA_LOCAL_FILE_UPLOAD_DIRS;
  process.env.SANKA_LOCAL_FILE_UPLOAD_DIRS = tempDir;
  const realpath = fs.realpathSync.native;
  const statSync = fs.statSync;
  const lstatSync = fs.lstatSync;
  const readFileSync = fs.readFileSync;
  const fileOperations = [];
  fs.realpathSync.native = (target, ...rest) => {
    fileOperations.push(["realpath", target]);
    return realpath(target, ...rest);
  };
  fs.lstatSync = (target, ...rest) => {
    fileOperations.push(["lstat", target]);
    return lstatSync(target, ...rest);
  };
  fs.statSync = (target, ...rest) => {
    fileOperations.push(["stat", target]);
    return statSync(target, ...rest);
  };
  fs.readFileSync = (target, ...rest) => {
    fileOperations.push(["read", target]);
    return readFileSync(target, ...rest);
  };
  try {
    const deniedPaths = [
      String.raw`\\attacker.example\share\receipt.pdf`,
      "//attacker.example/share/receipt.pdf",
      String.raw`\\?\UNC\attacker.example\share\receipt.pdf`,
      String.raw`\\.\pipe\receipt.pdf`,
      path.resolve(tempDir, "..", "outside-receipt.pdf"),
      unsupportedPath,
      hiddenPath
    ];
    for (const name of [
      "upload_expense_attachment", "start_expense_attachment_upload",
      "append_expense_attachment_upload_chunk"
    ]) {
      for (const deniedPath of deniedPaths) {
        fileOperations.length = 0;
        assert.throws(() => prepareLocalFileUploadToolCall({
          method: "tools/call", params: {
            name, arguments: { local_file_path: deniedPath, offset: 0 }
          }
        }));
        assert.equal(fileOperations.some(([, target]) =>
          target === deniedPath || target === path.resolve(deniedPath)), false,
          `${name} accessed denied path ${deniedPath}`);
      }
    }

    // Approved roots may themselves be symlinks (e.g. /tmp on macOS).
    const aliasRoot = path.join(tempDir, "approved-alias");
    fs.symlinkSync(tempDir, aliasRoot, "dir");
    process.env.SANKA_LOCAL_FILE_UPLOAD_DIRS = aliasRoot;
    for (const localPath of [path.join(aliasRoot, "receipt.pdf"), realpath(filePath)]) {
      const result = prepareLocalFileUploadToolCall({
        method: "tools/call", params: {
          name: "upload_expense_attachment", arguments: { local_file_path: localPath }
        }
      });
      assert.equal(result.params.arguments.content_base64, expectedBase64);
    }

    process.env.SANKA_LOCAL_FILE_UPLOAD_DIRS = path.relative(process.cwd(), tempDir);
    assert.equal(prepareLocalFileUploadToolCall({
      method: "tools/call", params: {
        name: "upload_expense_attachment", arguments: { local_file_path: filePath }
      }
    }).params.arguments.content_base64, expectedBase64);

    // Canonical containment is checked before stat/read, not after metadata leaks.
    process.env.SANKA_LOCAL_FILE_UPLOAD_DIRS = tempDir;
    const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), "sanka-plugin-outside-"));
    try {
      const outsideFile = path.join(outsideDir, "receipt.pdf");
      fs.writeFileSync(outsideFile, bytes);
      const link = path.join(tempDir, "escape.pdf");
      fs.symlinkSync(outsideFile, link);
      fileOperations.length = 0;
      assert.throws(() => prepareLocalFileUploadToolCall({
        method: "tools/call", params: {
          name: "upload_expense_attachment", arguments: { local_file_path: link }
        }
      }), /symlinks inside an allowed upload directory/);
      assert.equal(fileOperations.some(([operation, target]) =>
        target === realpath(outsideFile)), false);
      const directoryLink = path.join(tempDir, "escape-directory");
      fs.symlinkSync(outsideDir, directoryLink, "dir");
      const networkLink = path.join(tempDir, "network.pdf");
      fs.symlinkSync("//attacker.example/share/receipt.pdf", networkLink);
      for (const localPath of [path.join(directoryLink, "receipt.pdf"), networkLink]) {
        fileOperations.length = 0;
        assert.throws(() => prepareLocalFileUploadToolCall({
          method: "tools/call", params: {
            name: "start_expense_attachment_upload", arguments: { local_file_path: localPath }
          }
        }), /symlinks inside an allowed upload directory/);
        assert.equal(fileOperations.some(([operation, target]) =>
          operation === "realpath" && target !== tempDir), false);
      }
    } finally {
      fs.rmSync(outsideDir, { recursive: true, force: true });
    }
  } finally {
    fs.realpathSync.native = realpath;
    fs.statSync = statSync;
    fs.lstatSync = lstatSync;
    fs.readFileSync = readFileSync;
    if (originalRoots === undefined) delete process.env.SANKA_LOCAL_FILE_UPLOAD_DIRS;
    else process.env.SANKA_LOCAL_FILE_UPLOAD_DIRS = originalRoots;
  }

  const alreadyEncoded = prepareLocalFileUploadToolCall({
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "upload_expense_attachment",
      arguments: {
        local_file_path: filePath,
        content_base64: "YWJj",
        filename: "x.pdf"
      }
    }
  });
  assert.equal(alreadyEncoded.params.arguments.content_base64, "YWJj");
  assert.equal(alreadyEncoded.params.arguments.filename, "x.pdf");
  assert.equal("local_file_path" in alreadyEncoded.params.arguments, false);

  const [directTool, appendTool, untouchedTool] = augmentToolsListForLocalFileUploads([
    {
      name: "upload_expense_attachment",
      description: "Upload",
      inputSchema: {
        type: "object",
        properties: {
          filename: { type: "string" },
          content_base64: { type: "string" }
        },
        required: ["filename", "content_base64"]
      }
    },
    {
      name: "append_expense_attachment_upload_chunk",
      description: "Append",
      inputSchema: {
        type: "object",
        properties: {
          upload_token: { type: "string" },
          offset: { type: "integer" },
          content_base64: { type: "string" }
        },
        required: ["upload_token", "offset", "content_base64"]
      }
    },
    { name: "list_expenses", inputSchema: { type: "object" } }
  ]);
  assert.equal(directTool.inputSchema.properties.local_file_path.type, "string");
  assert.deepEqual(directTool.inputSchema.required, []);
  assert.equal(appendTool.inputSchema.properties.local_chunk_size.type, "integer");
  assert.deepEqual(appendTool.inputSchema.required, ["upload_token", "offset"]);
  assert.equal(untouchedTool.inputSchema.properties?.local_file_path, undefined);

  const authChallenge = suppressNativeOAuthChallenge({
    jsonrpc: "2.0",
    id: 5,
    result: {
      _meta: {
        "mcp/www_authenticate": ['Bearer resource_metadata="https://mcp.sanka.com/.well-known/oauth-protected-resource"'],
        retained: "value"
      },
      structuredContent: {
        connect_url: "https://app.sanka.com/oauth/authorize?client_id=test",
        required_user_facing_reply: "Connect Sanka."
      },
      isError: true
    }
  });
  assert.equal(authChallenge.result._meta["mcp/www_authenticate"], undefined);
  assert.equal(authChallenge.result._meta.retained, "value");
  assert.equal(authChallenge.result._meta["sanka/native_oauth_suppressed"], true);
  assert.equal(authChallenge.result.structuredContent.connect_url.includes("app.sanka.com"), true);

  console.log("Local MCP file bridge checks passed.");
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
