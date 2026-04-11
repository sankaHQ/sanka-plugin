#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const skillsRoot = path.join(repoRoot, 'skills');

const checkMode = process.argv.includes('--check');
const SKILL_MISSING_TOOLS_STEP =
  '1. If the attached Sanka MCP tools are missing, stop and tell the user the Sanka plugin is not attached to this thread.';

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

  const header = body.slice(0, guardrailsStart + guardrailsMarker.length);
  const guardrailSection = body.slice(guardrailsStart + guardrailsMarker.length);
  const guardrailLines = guardrailSection
    .trim()
    .split('\n')
    .filter((line) => line.trim() !== '');

  if (!guardrailLines.includes(preflightLine)) {
    const insertAfterAuthGuardrail = guardrailLines.findIndex(
      (line) =>
        line.includes('`auth_status`') || line.includes('`connect_sanka`'),
    );
    const insertIndex = insertAfterAuthGuardrail >= 0 ? insertAfterAuthGuardrail + 1 : 0;
    guardrailLines.splice(insertIndex, 0, preflightLine, directCallLine);
  } else if (!guardrailLines.includes(directCallLine)) {
    const preflightIndex = guardrailLines.indexOf(preflightLine);
    guardrailLines.splice(preflightIndex + 1, 0, directCallLine);
  }

  return `${header}${guardrailLines.join('\n')}\n`;
}

function normalizeSkillBody(body, skillDirName) {
  let updated = body;
  updated = updated.replace(`${SKILL_MISSING_TOOLS_STEP}\n`, '');
  updated = updated.replace(SKILL_MISSING_TOOLS_STEP, '');
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
