#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const codexHome =
  process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
const statePath = path.join(codexHome, ".codex-global-state.json");

const SKILL_LINK_RE =
  /\[\$(sanka:[A-Za-z0-9:_-]+)\]\(([^)]*\/plugins\/cache\/personal\/sanka\/[^)]+\/SKILL\.md)\)/g;

function normalizePrompt(prompt) {
  let replacements = 0;
  const normalized = prompt.replace(SKILL_LINK_RE, (_, mention) => {
    replacements += 1;
    return `$${mention}`;
  });
  return { normalized, replacements };
}

if (!fs.existsSync(statePath)) {
  console.error(`Codex global state not found: ${statePath}`);
  process.exit(1);
}

const raw = fs.readFileSync(statePath, "utf8");
const state = JSON.parse(raw);
const persisted = state["electron-persisted-atom-state"];

if (!persisted || !Array.isArray(persisted["prompt-history"])) {
  console.error(`prompt-history not found in ${statePath}`);
  process.exit(1);
}

let totalReplacements = 0;
let changedEntries = 0;

persisted["prompt-history"] = persisted["prompt-history"].map((prompt) => {
  if (typeof prompt !== "string") {
    return prompt;
  }
  const { normalized, replacements } = normalizePrompt(prompt);
  if (replacements > 0) {
    totalReplacements += replacements;
    changedEntries += 1;
  }
  return normalized;
});

if (totalReplacements === 0) {
  console.log(`No stale Sanka skill links found in ${statePath}`);
  process.exit(0);
}

fs.writeFileSync(statePath, JSON.stringify(state), "utf8");
console.log(
  `Normalized ${totalReplacements} stale Sanka skill link(s) across ${changedEntries} prompt history entr${changedEntries === 1 ? "y" : "ies"} in ${statePath}`,
);
