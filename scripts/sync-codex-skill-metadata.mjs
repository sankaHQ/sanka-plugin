#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const skillsRoot = path.join(repoRoot, 'skills');

const checkMode = process.argv.includes('--check');
function escapeYaml(value) {
  return JSON.stringify(value);
}

function listSkillDirectories() {
  return fs
    .readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(skillsRoot, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

function parseSkillFile(contents, skillDirName) {
  const match = contents.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error(`Missing frontmatter in ${skillDirName}/SKILL.md`);
  }

  const frontmatter = match[1];
  const body = match[2];
  const descriptionMatch = frontmatter.match(/^description:\s*(.+)$/m);
  const headingMatch = body.match(/^#\s+(.+)$/m);

  if (!descriptionMatch) {
    throw new Error(`Missing description in ${skillDirName}/SKILL.md`);
  }
  if (!headingMatch) {
    throw new Error(`Missing H1 heading in ${skillDirName}/SKILL.md`);
  }

  const description = descriptionMatch[1].trim();
  const title = headingMatch[1].trim();

  return { frontmatter, body, description, title };
}

function shortDescriptionFromDescription(description) {
  const shortDescription = description.split(' Use when ')[0].trim();
  return shortDescription.endsWith('.') ? shortDescription : `${shortDescription}.`;
}

function lowerCaseFirst(value) {
  if (!value) {
    return value;
  }
  return `${value.charAt(0).toLowerCase()}${value.slice(1)}`;
}

function defaultPromptForSkill(skillName, shortDescription) {
  const promptBody = lowerCaseFirst(shortDescription.replace(/\.$/, ''));
  return `Use $${skillName} to ${promptBody}.`;
}

function buildOpenAiYaml(skillName, title, description) {
  const shortDescription = shortDescriptionFromDescription(description);
  const defaultPrompt = defaultPromptForSkill(skillName, shortDescription);

  return [
    'interface:',
    `  display_name: ${escapeYaml(title)}`,
    `  short_description: ${escapeYaml(shortDescription)}`,
    `  default_prompt: ${escapeYaml(defaultPrompt)}`,
    '',
    'dependencies:',
    '  tools:',
    '    - type: "mcp"',
    '      value: "sanka_plugin"',
    '      description: "Hosted Sanka MCP server for live Sanka workflows"',
    '      transport: "streamable_http"',
    '      url: "https://mcp.sanka.com/mcp"',
    '',
    'policy:',
    '  allow_implicit_invocation: false',
    '',
  ].join('\n');
}

function operationForSkill(skillDirName) {
  return /^(create|update|delete|upload|reply|archive|cancel|reschedule|import|export|generate|push|sync|apply)-/.test(
    skillDirName,
  )
    ? 'write'
    : 'read';
}

function scopeKeyForSkill(skillDirName) {
  if (skillDirName === 'connect') {
    return undefined;
  }
  if (skillDirName.includes('private-message')) {
    return 'messages';
  }
  if (skillDirName === 'apply-company-price-table-items' || skillDirName.includes('company-price-table')) {
    return 'companies';
  }
  if (skillDirName.includes('purchase-order')) {
    return 'purchase_orders';
  }
  if (skillDirName.includes('inventory-transaction')) {
    return 'inventory_transactions';
  }
  if (skillDirName.startsWith('overdue-invoices')) {
    return 'invoices';
  }
  if (skillDirName.startsWith('ticket-pipelines')) {
    return 'tickets';
  }
  if (skillDirName.startsWith('deal-pipelines')) {
    return 'deals';
  }
  if (skillDirName.includes('expense')) {
    return 'expenses';
  }
  if (skillDirName.startsWith('bill')) {
    return 'bills';
  }
  if (skillDirName.startsWith('company') || skillDirName.includes('-company')) {
    return 'companies';
  }
  if (skillDirName.startsWith('contact') || skillDirName.includes('-contact')) {
    return 'contacts';
  }
  if (skillDirName.startsWith('deal') || skillDirName.includes('-deal')) {
    return 'deals';
  }
  if (skillDirName.startsWith('estimate') || skillDirName.includes('-estimate')) {
    return 'estimates';
  }
  if (skillDirName.startsWith('invoice') || skillDirName.includes('-invoice')) {
    return 'invoices';
  }
  if (skillDirName.startsWith('item') || skillDirName.includes('-item')) {
    return 'items';
  }
  if (skillDirName.startsWith('location') || skillDirName.includes('-location')) {
    return 'locations';
  }
  if (skillDirName.startsWith('order') || skillDirName.includes('-order')) {
    return 'orders';
  }
  if (skillDirName.startsWith('payment') || skillDirName.includes('-payment')) {
    return 'payments';
  }
  if (skillDirName.startsWith('slip') || skillDirName.includes('-slip')) {
    return 'slips';
  }
  if (skillDirName.startsWith('subscription') || skillDirName.includes('-subscription')) {
    return 'subscriptions';
  }
  if (skillDirName.startsWith('task') || skillDirName.includes('-task')) {
    return 'tasks';
  }
  if (skillDirName.startsWith('ticket') || skillDirName.includes('-ticket')) {
    return 'tickets';
  }
  if (skillDirName.startsWith('inventory') || skillDirName.includes('-inventory')) {
    return 'inventories';
  }
  if (skillDirName.startsWith('disbursement') || skillDirName.includes('-disbursement')) {
    return 'disbursements';
  }
  return undefined;
}

function requiredScopesForSkill(skillDirName) {
  if (skillDirName.includes('property')) {
    return { mode: 'dynamic' };
  }

  const scopeKey = scopeKeyForSkill(skillDirName);
  if (!scopeKey) {
    return { mode: 'none' };
  }

  return {
    mode: 'static',
    values: [`${scopeKey}:${operationForSkill(skillDirName)}`],
  };
}

function authReconnectInstructionForSkill(skillDirName) {
  const requiredScopes = requiredScopesForSkill(skillDirName);
  if (requiredScopes.mode === 'static') {
    return `1. If the direct tool call returns \`Auth required\`, \`missing_scope\`, or \`insufficient_scope\`, call \`auth_status\` exactly once with \`{ required_scopes: ${JSON.stringify(requiredScopes.values)} }\`. If it returns an explicit reconnect URL such as \`connect_url\` or \`authorization_url\`, show that URL verbatim. If it only returns OAuth metadata and not a reconnect URL, tell the user to launch the MCP client's native Sanka OAuth flow or reconnect action for this server, then retry the same Sanka request.`;
  }

  if (requiredScopes.mode === 'dynamic') {
    return '1. If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `required_scopes` derived from `object_name` and the property operation. Normalize object names such as `purchase-orders -> purchase_orders`, `inventory-transactions -> inventory_transactions`, and `cases -> cases`, then use the matching `:read` or `:write` scope. If `auth_status` returns an explicit reconnect URL such as `connect_url` or `authorization_url`, show that URL verbatim. If it only returns OAuth metadata and not a reconnect URL, tell the user to launch the MCP client\'s native Sanka OAuth flow or reconnect action for this server, then retry the same Sanka request.';
  }

  return "1. If the direct tool call returns `Auth required` or the client surfaces an authentication challenge, call `auth_status` exactly once. If it returns an explicit reconnect URL such as `connect_url` or `authorization_url`, show that URL verbatim. If it only returns OAuth metadata and not a reconnect URL, tell the user to launch the MCP client's native Sanka OAuth flow or reconnect action for this server, then retry the same Sanka request.";
}

function authGuardrailLineForSkill(skillDirName) {
  const requiredScopes = requiredScopesForSkill(skillDirName);
  if (requiredScopes.mode === 'static') {
    return `- If the direct tool call returns \`Auth required\`, \`missing_scope\`, or \`insufficient_scope\`, call \`auth_status\` exactly once with \`{ required_scopes: ${JSON.stringify(requiredScopes.values)} }\` to surface reconnect metadata. If it only returns metadata, tell the user to start the client-native Sanka OAuth flow.`;
  }

  if (requiredScopes.mode === 'dynamic') {
    return '- If the direct tool call returns `Auth required`, `missing_scope`, or `insufficient_scope`, call `auth_status` exactly once with `required_scopes` derived from `object_name` and the property operation so reconnect requests the correct object-specific scope. If it only returns metadata, tell the user to start the client-native Sanka OAuth flow.';
  }

  return '- If the direct tool call returns `Auth required`, call `auth_status` exactly once to surface reconnect metadata. If it only returns metadata, tell the user to start the client-native Sanka OAuth flow.';
}

function renumberWorkflowSection(body) {
  const workflowMarker = 'Workflow:\n';
  const guardrailsMarker = '\nGuardrails:\n';
  const workflowStart = body.indexOf(workflowMarker);
  const guardrailsStart = body.indexOf(guardrailsMarker, workflowStart);

  if (workflowStart === -1 || guardrailsStart === -1) {
    return body;
  }

  const beforeWorkflow = body.slice(0, workflowStart + workflowMarker.length);
  const workflowSection = body.slice(
    workflowStart + workflowMarker.length,
    guardrailsStart,
  );
  const afterWorkflow = body.slice(guardrailsStart);

  const lines = workflowSection.split('\n');
  let stepIndex = 1;
  const updatedLines = lines.map((line) => {
    if (/^\d+\.\s/.test(line)) {
      const renumbered = line.replace(/^\d+\.\s/, `${stepIndex}. `);
      stepIndex += 1;
      return renumbered;
    }
    return line;
  });

  return `${beforeWorkflow}${updatedLines.join('\n')}${afterWorkflow}`;
}

function updateAuthWorkflow(body, skillDirName) {
  if (skillDirName === 'connect') {
    return body.replace(
      /^\d+\.\s+(?:If the tool returns an authentication challenge, tell the user to complete the native Sanka sign-in flow shown by the client, then retry the original request\.|If `auth_status` returns `connected: false`.+)$/m,
      "1. If `auth_status` returns `connected: false`, surface any explicit reconnect URL such as `connect_url` or `authorization_url` verbatim. If it only returns OAuth metadata and not a reconnect URL, tell the user to launch the MCP client's native Sanka OAuth flow or reconnect action for this server, then retry the original request.",
    );
  }

  return body.replace(
    /^\d+\.\s+(?:If the client surfaces an authentication prompt or challenge, tell the user to complete Sanka sign-in and then retry\.|If the direct tool call returns `Auth required`.+)$/m,
    authReconnectInstructionForSkill(skillDirName),
  );
}

function injectGuardrails(body, skillDirName) {
  const guardrailsMarker = 'Guardrails:\n';
  const guardrailsStart = body.indexOf(guardrailsMarker);
  if (guardrailsStart === -1) {
    return body;
  }

  const preflightLine =
    skillDirName === 'connect'
      ? '- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` for this workflow.'
      : '- Do not call `list_mcp_resources`, `list_mcp_resource_templates`, or `tool_search` as a preflight for this command.';
  const directCallLine =
    skillDirName === 'connect'
      ? '- Call `auth_status` directly instead of probing attachment state through discovery tools.'
      : '- Call the named Sanka MCP tool directly instead of probing attachment state through discovery tools.';
  const authRequiredLine =
    skillDirName === 'connect'
      ? '- If `auth_status` returns `connected: false`, surface any explicit reconnect URL it returns. If it only returns metadata, tell the user to start the client-native Sanka OAuth flow.'
      : authGuardrailLineForSkill(skillDirName);
  const attachmentFailureLine =
    skillDirName === 'connect'
      ? '- Do not report a plugin attachment failure unless a direct `auth_status` call returns a tool-not-found or unavailable error from the client.'
      : '- Do not report a plugin attachment failure unless a direct call to the named Sanka MCP tool returns a tool-not-found or unavailable error from the client.';
  const reconnectUrlLine =
    '- If `auth_status` returns an explicit reconnect URL such as `connect_url` or `authorization_url`, repeat it verbatim.';
  const noFabricationLine =
    '- Do not fabricate a manual connect, OAuth, or login URL. Only repeat reconnect URLs returned by `auth_status`.';
  const nativeOauthLine =
    "- If `auth_status` only returns OAuth metadata such as `authorization_server_url`, `resource_metadata_url`, `resource_url`, `reconnect_rpc_method`, or `reconnect_server_name`, tell the user to trigger the MCP client's native Sanka OAuth flow or reconnect action and then retry.";

  const header = body.slice(0, guardrailsStart + guardrailsMarker.length);
  const guardrailSection = body.slice(guardrailsStart + guardrailsMarker.length);
  let guardrailLines = guardrailSection
    .trim()
    .split('\n')
    .filter((line) => line.trim() !== '');

  guardrailLines = guardrailLines.map((line) => {
    if (line.startsWith('- If the direct tool call returns `Auth required`')) {
      return authRequiredLine;
    }
    if (
      line.startsWith('- If `auth_status` returns `authorization_url` or `sign_in_url`') ||
      line.startsWith('- If `auth_status` returns an explicit reconnect URL such as `authorization_url`')
    ) {
      return reconnectUrlLine;
    }
    if (
      line.startsWith('- Do not fabricate a manual OAuth URL.') ||
      line.startsWith('- Do not fabricate a manual OAuth URL or fall back to `https://app.sanka.com/login`.')
    ) {
      return noFabricationLine;
    }
    if (line.startsWith('- If `auth_status` only returns OAuth metadata')) {
      return nativeOauthLine;
    }
    if (line.startsWith('- If `auth_status` returns `connected: false`, surface the returned reconnect URLs')) {
      return authRequiredLine;
    }
    return line;
  });
  guardrailLines = guardrailLines.filter(
    (line, index) => guardrailLines.indexOf(line) === index,
  );

  if (!guardrailLines.includes(preflightLine)) {
    const insertAfterAuthGuardrail = guardrailLines.findIndex(
      (line) =>
        line.includes('`auth_status`') || line.includes('`connect_sanka`'),
    );
    const insertIndex = insertAfterAuthGuardrail >= 0 ? insertAfterAuthGuardrail + 1 : 0;
    guardrailLines.splice(
      insertIndex,
      0,
      preflightLine,
      directCallLine,
      authRequiredLine,
      attachmentFailureLine,
      reconnectUrlLine,
      noFabricationLine,
      nativeOauthLine,
    );
  } else {
    const preflightIndex = guardrailLines.indexOf(preflightLine);
    const insertedLines = [
      directCallLine,
      authRequiredLine,
      attachmentFailureLine,
      reconnectUrlLine,
      noFabricationLine,
      nativeOauthLine,
    ];
    let offset = 1;
    for (const line of insertedLines) {
      if (!guardrailLines.includes(line)) {
        guardrailLines.splice(preflightIndex + offset, 0, line);
        offset += 1;
      }
    }
  }

  return `${header}${guardrailLines.join('\n')}\n`;
}

function normalizeSkillBody(body, skillDirName) {
  let updated = body;
  updated = updateAuthWorkflow(updated, skillDirName);
  updated = renumberWorkflowSection(updated);
  updated = injectGuardrails(updated, skillDirName);
  return updated;
}

function writeIfChanged(filePath, nextContents, changedFiles) {
  const currentContents = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, 'utf8')
    : null;
  if (currentContents === nextContents) {
    return;
  }
  changedFiles.push(filePath);
  if (!checkMode) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, nextContents);
  }
}

const changedFiles = [];

for (const skillDir of listSkillDirectories()) {
  const skillDirName = path.basename(skillDir);
  const skillFilePath = path.join(skillDir, 'SKILL.md');
  const skillContents = fs.readFileSync(skillFilePath, 'utf8');
  const { frontmatter, body, description, title } = parseSkillFile(
    skillContents,
    skillDirName,
  );
  const normalizedSkillBody = normalizeSkillBody(body, skillDirName);
  const updatedSkillContents = `---\n${frontmatter}\n---\n${normalizedSkillBody}`;
  const skillName = `sanka:${skillDirName}`;
  const openAiYamlPath = path.join(skillDir, 'agents', 'openai.yaml');
  const openAiYaml = buildOpenAiYaml(skillName, title, description);

  writeIfChanged(skillFilePath, updatedSkillContents, changedFiles);
  writeIfChanged(openAiYamlPath, openAiYaml, changedFiles);
}

if (checkMode) {
  if (changedFiles.length > 0) {
    console.error('Out-of-date skill metadata or guardrails:');
    for (const filePath of changedFiles) {
      console.error(filePath);
    }
    process.exit(1);
  }
  process.exit(0);
}

console.log(`Updated ${changedFiles.length} file(s).`);
