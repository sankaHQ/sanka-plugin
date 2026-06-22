#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  augmentToolsListForLocalFileUploads,
  prepareLocalFileUploadToolCall
} from "../vendor/mcp-remote/sanka-local-file-bridge.mjs";

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

  console.log("Local MCP file bridge checks passed.");
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
