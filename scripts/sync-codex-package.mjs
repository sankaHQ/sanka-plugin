#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const packageRoot = path.join(repoRoot, 'plugins', 'sanka');
const checkMode = process.argv.includes('--check');

const entries = [
  ['.codex-plugin', '.codex-plugin'],
  ['skills', 'skills'],
  ['assets', 'assets'],
  ['codex.mcp.json', 'codex.mcp.json'],
];

function removeIgnoredNames(names) {
  return names.filter((name) => name !== '.DS_Store').sort((left, right) => left.localeCompare(right));
}

function listFiles(root) {
  if (!fs.existsSync(root)) {
    return [];
  }

  const results = [];
  const walk = (dir) => {
    for (const name of removeIgnoredNames(fs.readdirSync(dir))) {
      const fullPath = path.join(dir, name);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile()) {
        results.push(path.relative(root, fullPath));
      }
    }
  };

  if (fs.statSync(root).isDirectory()) {
    walk(root);
  } else {
    results.push(path.basename(root));
  }

  return results.sort((left, right) => left.localeCompare(right));
}

function compareEntry(source, target) {
  const sourcePath = path.join(repoRoot, source);
  const targetPath = path.join(packageRoot, target);

  if (!fs.existsSync(sourcePath)) {
    return [`missing source ${source}`];
  }
  if (!fs.existsSync(targetPath)) {
    return [`missing package copy ${target}`];
  }

  const sourceStat = fs.statSync(sourcePath);
  const targetStat = fs.statSync(targetPath);
  if (sourceStat.isFile() !== targetStat.isFile() || sourceStat.isDirectory() !== targetStat.isDirectory()) {
    return [`type mismatch for ${target}`];
  }

  const problems = [];
  if (sourceStat.isFile()) {
    if (!fs.readFileSync(sourcePath).equals(fs.readFileSync(targetPath))) {
      problems.push(`content mismatch for ${target}`);
    }
    return problems;
  }

  const sourceFiles = listFiles(sourcePath);
  const targetFiles = listFiles(targetPath);
  const allFiles = new Set([...sourceFiles, ...targetFiles]);
  for (const relativeFile of [...allFiles].sort((left, right) => left.localeCompare(right))) {
    if (!sourceFiles.includes(relativeFile)) {
      problems.push(`extra package file ${path.join(target, relativeFile)}`);
      continue;
    }
    if (!targetFiles.includes(relativeFile)) {
      problems.push(`missing package file ${path.join(target, relativeFile)}`);
      continue;
    }

    const sourceFile = path.join(sourcePath, relativeFile);
    const targetFile = path.join(targetPath, relativeFile);
    if (!fs.readFileSync(sourceFile).equals(fs.readFileSync(targetFile))) {
      problems.push(`content mismatch for ${path.join(target, relativeFile)}`);
    }
  }

  return problems;
}

function syncEntry(source, target) {
  const sourcePath = path.join(repoRoot, source);
  const targetPath = path.join(packageRoot, target);

  fs.rmSync(targetPath, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.cpSync(sourcePath, targetPath, {
    recursive: true,
    filter: (candidate) => path.basename(candidate) !== '.DS_Store',
  });
}

if (checkMode) {
  const problems = entries.flatMap(([source, target]) => compareEntry(source, target));
  if (problems.length > 0) {
    console.error('Codex package is out of sync:');
    for (const problem of problems) {
      console.error(`- ${problem}`);
    }
    console.error('Run `node scripts/sync-codex-package.mjs` and commit the updated plugins/sanka package.');
    process.exit(1);
  }
  console.log('Codex package is in sync.');
} else {
  fs.mkdirSync(packageRoot, { recursive: true });
  for (const [source, target] of entries) {
    syncEntry(source, target);
  }
  console.log('Synced Codex package to plugins/sanka.');
}
