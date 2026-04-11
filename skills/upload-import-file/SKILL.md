---
description: Upload an import file into live Sanka. Use when the user explicitly invokes /sanka:upload-import-file.
disable-model-invocation: true
argument-hint: "<filename and base64 file content>"
---
# Upload Import File

Use only the attached Sanka MCP tools in this thread.

Workflow:

1. If the attached Sanka MCP tools are missing, stop and tell the user the Sanka plugin is not attached to this thread.
2. Require `filename` and `content_base64`. If either is missing, ask a concise follow-up.
3. Pass through `object_type` and `mime_type` only when the user explicitly provides them.
4. Call `upload_import_file` directly.
5. If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry.
6. Return the uploaded file result clearly, especially the `file_id` needed for the next import step.

Guardrails:

- Do not call `auth_status` or `connect_sanka` as a preflight for this command.
- Do not use local repo files, terminal commands, Django shell, Postgres, or any repo-local fallback for live Sanka data.
- Do not call `search_docs` or `execute` when `upload_import_file` covers the request.
- Do not claim the import is running yet. This skill only uploads the file and returns a `file_id`.
