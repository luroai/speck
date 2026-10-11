import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { otherWorkflows } from '../scripts/detect.mjs';

// ---------- 0124: spot another workflow during setup ----------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(ROOT, 'scripts', 'speck.mjs');
const SKILL = fs.readFileSync(path.join(ROOT, 'skills', 'speck-setup', 'SKILL.md'), 'utf8');

const tmp = () => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0124-')));

// Makes each path under dir: a trailing slash makes a folder, anything else a file.
function make(dir, ...paths) {
  for (const p of paths) {
    const f = path.join(dir, p);
    if (p.endsWith('/')) fs.mkdirSync(f, { recursive: true });
    else { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, ''); }
  }
  return dir;
}

const byName = list => Object.fromEntries(list.map(w => [w.name, w]));

// The setup skill's section that deals with other workflows and the project's rules.
const section = (() => {
  const lines = SKILL.split('\n');
  const start = lines.findIndex(l => /^##+ .*other workflow/i.test(l));
  const end = lines.findIndex((l, i) => i > start && /^## /.test(l));
  return start < 0 ? '' : lines.slice(start, end < 0 ? undefined : end).join('\n');
})();

test('0124 AC1: speck detect reports other_workflows as an empty list when there are none', () => {
  const dir = tmp();
  const r = spawnSync(process.execPath, [CLI, 'detect'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout).other_workflows, []);
});

test('0124 AC1: speck detect reports OpenSpec with each path that shows it', () => {
  const dir = make(tmp(), 'openspec/config.yaml', '.claude/skills/openspec-propose/SKILL.md', '.agents/skills/openspec-apply/SKILL.md',
    '.claude/commands/opsx/propose.md', '.claude/skills/speck-build/SKILL.md');
  const r = spawnSync(process.execPath, [CLI, 'detect'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const [w, ...rest] = JSON.parse(r.stdout).other_workflows;
  assert.equal(rest.length, 0);
  assert.equal(w.name, 'OpenSpec');
  assert.deepEqual(w.paths, ['.agents/skills/openspec-apply/', '.claude/commands/opsx/', '.claude/skills/openspec-propose/', 'openspec/']);
});

test('0124 AC1: each OpenSpec sign is enough on its own, including /opsx command files', () => {
  for (const p of ['openspec/', '.claude/skills/openspec-explore/', '.agents/skills/openspec-x/', '.claude/commands/opsx/', '.claude/commands/opsx-apply.md']) {
    const w = byName(otherWorkflows(make(tmp(), p))).OpenSpec;
    assert.ok(w, p);
    assert.deepEqual(w.paths, [p], p);
  }
});

test('0124 AC1: GitHub Spec Kit from a .specify/ folder and Kiro from a .kiro/ folder', () => {
  const found = byName(otherWorkflows(make(tmp(), '.specify/feature.json', '.kiro/steering/tech.md')));
  assert.deepEqual(Object.keys(found).sort(), ['GitHub Spec Kit', 'Kiro']);
  assert.deepEqual(found['GitHub Spec Kit'].paths, ['.specify/']);
  assert.deepEqual(found.Kiro.paths, ['.kiro/']);
});

test('0124 AC1: files with those names, or look-alike names, are not other workflows', () => {
  const dir = make(tmp(), 'openspec', '.specify', '.kiro', '.claude/skills/openspec', '.claude/skills/myopenspec-x/',
    '.claude/commands/opsxx/', '.claude/commands/topsx.md', 'docs/openspec/');
  assert.deepEqual(otherWorkflows(dir), []);
});

test('0124 AC1: a folder that cannot be read, or does not exist, reports none rather than failing', () => {
  assert.deepEqual(otherWorkflows(path.join(tmp(), 'missing')), []);
});

test('0124 AC3: OpenSpec lists each change in progress under openspec/changes/, leaving out archive', () => {
  const dir = make(tmp(), 'openspec/changes/add-login/proposal.md', 'openspec/changes/fix-search/', 'openspec/changes/archive/old/', 'openspec/changes/README.md');
  assert.deepEqual(byName(otherWorkflows(dir)).OpenSpec.in_progress, ['openspec/changes/add-login/', 'openspec/changes/fix-search/']);
  assert.deepEqual(byName(otherWorkflows(make(tmp(), 'openspec/'))).OpenSpec.in_progress, []);
});

test('0124 AC1: detect changes nothing in the folder', () => {
  const dir = make(tmp(), 'openspec/changes/a/', '.kiro/x');
  const before = fs.readdirSync(dir, { recursive: true }).sort();
  otherWorkflows(dir);
  assert.deepEqual(fs.readdirSync(dir, { recursive: true }).sort(), before);
});

test('0124 AC2: the setup skill has a section on other workflows that comes before any change', () => {
  assert.ok(section, 'no "## … other workflow…" section in the setup skill');
  const at = SKILL.indexOf(section);
  for (const later of ['## 2. ', '## 3. ', '## 4. ']) assert.ok(at < SKILL.indexOf(later), later);
  assert.match(section, /other_workflows/);
  assert.match(section, /before (?:you )?chang/i);
});

test('0124 AC2: it explains conflicting instructions, recommends speck for new work, and asks to choose', () => {
  assert.match(section, /conflicting instructions/i);
  assert.match(section, /recommend[^.]*speck for new work/i);
  assert.match(section, /left where they are/i);
  assert.match(section, /keep(?:ing)? both/i);
  assert.match(section, /stop/i);
  assert.match(section, /wait for (?:their|the user's) (?:answer|choice)/i);
});

test('0124 AC3: on choosing speck it names work in progress and recommends finishing it or ticketing it', () => {
  assert.match(section, /in_progress/);
  assert.match(section, /openspec\/changes\//);
  assert.match(section, /archive/);
  assert.match(section, /finish/i);
  assert.match(section, /\/speck-ticket/);
});

test('0124 AC4: it reads AGENTS.md, CLAUDE.md and the guides they point to, and names each clashing rule', () => {
  assert.match(section, /AGENTS\.md/);
  assert.match(section, /CLAUDE\.md/);
  assert.match(section, /guide[^.]*point to/i);
  assert.match(section, /worktree/i);
  assert.match(section, /pull request/i);
  assert.match(section, /reviewer/i);
  assert.match(section, /unattended|without anyone watching/i);
  assert.match(section, /what would happen/i);
  assert.match(section, /`worktrees`/);
  assert.match(section, /`auto_ship`/);
});

test('0124 AC5: setup never deletes, moves or edits the other workflow\'s files or the project\'s rules', () => {
  const rules = SKILL.slice(SKILL.indexOf('## Rules'), SKILL.indexOf('## 1. '));
  assert.match(rules, /never delete, move or edit[^.]*other workflow[^.]*project's own rules/i);
  assert.match(section, /never delete, move or edit/i);
});

test('0124 AC5: a speck setting changes only after the user agrees', () => {
  assert.match(section, /only (?:once|after|if) the user agrees/i);
  assert.match(section, /speck config set/);
});

test('0124 AC1: the brief describes other_workflows in speck detect, and setup asking about it', () => {
  const brief = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8');
  assert.match(brief.split('\n').find(l => l.startsWith('| `speck detect`')) || '', /`other_workflows`/);
  assert.match(brief.split('\n').find(l => l.startsWith('| `/speck-setup`')) || '', /other workflow[^|]*never deletes, moves or edits/i);
});

test('0124 AC4: the skill matches speck\'s defaults: worktrees on, auto_ship off', () => {
  assert.match(section, /`worktrees` is on by default/);
  assert.match(section, /keep `auto_ship` off \(its default\)/);
  const config = fs.readFileSync(path.join(ROOT, 'templates', 'config.yml'), 'utf8');
  assert.match(config, /^worktrees: true/m);
  assert.match(config, /^auto_ship: false/m);
});
