import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// ---------- 0088: a speck-setup skill takes you through setting speck up in a conversation ----------
// A skill can't be fully tested automatically: these check that init installs it and that it names each step.
// The reviewer checks the rest by reading skills/speck-setup/SKILL.md.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(ROOT, 'scripts', 'speck.mjs');
const SKILL = path.join(ROOT, 'skills', 'speck-setup', 'SKILL.md');
const skill = () => fs.readFileSync(SKILL, 'utf8');
// The text of one `## ` section of the skill, found by the start of its heading.
const section = start => {
  const parts = skill().split('\n## ');
  const hit = parts.find(p => p.startsWith(start));
  assert.ok(hit, `the skill has a section starting "## ${start}"`);
  return hit;
};
const flat = s => s.replace(/\s+/g, ' ');

test('0088 AC1: speck init installs speck-setup in both skill folders, like the other speck skills', () => {
  assert.match(skill().split('\n---')[0], /^name: speck-setup$/m);
  assert.match(skill().split('\n---')[0], /^description: .+/m);
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-setup-')));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const r = spawnSync(process.execPath, [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  for (const base of ['.claude/skills', '.agents/skills']) {
    const installed = path.join(dir, base, 'speck-setup', 'SKILL.md');
    assert.equal(fs.readFileSync(installed, 'utf8'), skill(), base);
    assert.ok(fs.existsSync(path.join(dir, base, 'speck-build', 'SKILL.md')), `${base} has the other skills too`);
  }
});

test('0088 AC1: speck\'s own repo links speck-setup in both skill folders, as init does there', () => {
  for (const base of ['.claude/skills', '.agents/skills']) {
    const at = path.join(ROOT, base, 'speck-setup');
    assert.ok(fs.lstatSync(at).isSymbolicLink(), `${base}/speck-setup is a link`);
    assert.equal(fs.realpathSync(at), fs.realpathSync(path.join(ROOT, 'skills', 'speck-setup')));
  }
});

test('0088 AC1: the README and the brief name /speck-setup', () => {
  for (const f of ['README.md', 'docs/brief.md'])
    assert.ok(fs.readFileSync(path.join(ROOT, f), 'utf8').includes('`/speck-setup`'), f);
});

test('0088 AC2: the skill starts from speck detect', () => {
  const md = skill();
  const first = section('1.');
  assert.match(first, /speck detect/);
  assert.match(first, /npx 'github:luroai\/speck#semver:\*' detect/, 'works before speck is installed');
  assert.ok(md.indexOf('speck detect') < md.indexOf('speck config set'), 'detect comes before any setting');
});

test('0088 AC2: it asks before each change to the machine or to git', () => {
  const md = flat(skill());
  assert.match(md, /ask before every change to the machine or to git/i);
  for (const [what, re] of [
    ['installing Node', /Ask before installing Node/i],
    ['git init', /Ask before running `git init`/i],
    ['git name and email', /Ask before setting a git name and email/i],
    ['a commit', /Ask before making a commit/i],
  ]) assert.match(md, re, what);
});

test('0088 AC2: every setting goes through speck config set, never a direct edit of speck/config.yml', () => {
  const md = flat(skill());
  assert.match(md, /Record every setting with `speck config set <key> <value>`/);
  assert.match(md, /Never edit `speck\/config\.yml` directly/);
  for (const key of ['base_branch', 'commands.test', 'builder', 'reviewer', 'allow_same_model_review', 'build_command'])
    assert.match(md, new RegExp(`speck config set ${key.replace('.', '\\.')}\\b`), key);
});

test('0088 AC3: in an existing project it stops on uncommitted changes to tracked files until they are dealt with', () => {
  const s = flat(section('3.'));
  assert.match(s, /uncommitted_changes/);
  assert.match(s, /stop/i);
  assert.match(s, /run `speck detect` again/i, 'checks again before going on');
  assert.match(s, /Don't commit, stash or discard them yourself/i);
});

test('0088 AC3: it confirms the base branch and warns that ship pushes straight to it', () => {
  const s = flat(section('3.'));
  assert.match(s, /confirm the base branch/i);
  assert.match(s, /speck config set base_branch/);
  assert.match(s, /pushes straight to/i);
  assert.match(s, /requires pull requests[^.]*refuse/i);
});

test('0088 AC3: it confirms the test command by running it once', () => {
  const s = flat(section('3.'));
  assert.match(s, /suggestions\.test_command/);
  assert.match(s, /Run it once/i);
  assert.match(s, /speck config set commands\.test/);
});

test('0088 AC4: in a new project it makes the first commit, then creates a draft scaffold ticket', () => {
  const s = flat(section('4.'));
  const commit = s.search(/first commit/i), ticket = s.indexOf('speck new');
  assert.ok(commit !== -1 && ticket !== -1 && commit < ticket, 'the first commit comes before the ticket');
  assert.match(s, /speck new "Scaffold the app with a test runner"/);
  assert.match(s, /draft/);
  assert.match(s, /speck can't ship[^.]*until[^.]*test command[^.]*passes/i);
});

test('0088 AC5: it proposes a builder and a reviewer, preferring another model family', () => {
  const s = flat(section('5.'));
  assert.match(s, /agents/);
  assert.match(s, /another model family/i);
  assert.match(s, /speck config set builder/);
  assert.match(s, /speck config set reviewer codex/);
});

test('0088 AC5: with only Claude it explains same-model review and turns it on only if the user agrees', () => {
  const s = flat(section('5.'));
  assert.match(s, /only Claude/i);
  assert.match(s, /same-model review/i);
  assert.match(s, /only if the user agrees/i);
  assert.match(s, /speck config set reviewer claude-subagent/);
  assert.match(s, /speck config set allow_same_model_review true/);
});

test('0088 AC5: it explains that speck run builds skip permission prompts and asks before keeping that', () => {
  const s = flat(section('6.'));
  assert.match(s, /speck run/);
  assert.match(s, /--dangerously-skip-permissions/);
  assert.match(s, /skip(s)? (every |all )?permission prompts/i);
  assert.match(s, /Ask whether to keep/i);
  assert.match(s, /speck config set build_command ""/);
});

test('0088 AC5: it finishes once speck doctor passes, saying what to do next', () => {
  const s = flat(section('8.'));
  assert.match(s, /speck doctor/);
  assert.match(s, /passes/);
  assert.match(s, /what to do next/i);
  assert.match(s, /\/speck-capture|\/speck-build/);
});

test('0088: a blank build_command, as the skill sets it, is accepted and stops speck run with a plain message', () => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-setup-')));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  assert.equal(spawnSync(process.execPath, [CLI, 'init', '--skip-checks'], { cwd: dir }).status, 0);
  const set = spawnSync(process.execPath, [CLI, 'config', 'set', 'build_command', ''], { cwd: dir, encoding: 'utf8' });
  assert.equal(set.status, 0, set.stderr);
  const run = spawnSync(process.execPath, [CLI, 'run'], { cwd: dir, encoding: 'utf8', timeout: 10000 });
  assert.notEqual(run.status, 0);
  assert.match(run.stderr + run.stdout, /No build_command is set/);
});

test('0088 AC3: an existing project with code but no commits gets a first commit, asked for, before the base branch', () => {
  const s = flat(section('3.'));
  assert.match(s, /repo\.has_commits/);
  const commit = s.search(/Ask before making a commit of their code/i), base = s.search(/\*\*Base branch\.\*\*/);
  assert.ok(commit !== -1 && commit < base, 'the first commit is asked for before the base branch is set');
});

test('0088 review F1: a new project chooses its agents before the first ticket, so the ticket records them', () => {
  const s = flat(section('4.'));
  const agents = s.search(/sections 5 and 6/), ticket = s.indexOf('speck new');
  assert.ok(agents !== -1 && agents < ticket, 'sections 5 and 6 come before speck new');
  assert.doesNotMatch(s, /Continue with section 5\.\s*$/, 'section 4 does not end by sending setup on to section 5');
  assert.match(flat(section('6.')), /section 4, step 5/, 'section 6 sends a new project back for its first ticket');
});

test('0088 review F2: a new project that is already a repo records its base branch only once speck is installed', () => {
  const s = flat(section('4.'));
  const install = s.search(/\*\*install speck\*\*/), set = s.indexOf('speck config set base_branch');
  assert.ok(install !== -1 && set !== -1 && install < set, 'base_branch is set after speck is installed');
});

test('0088 review F3: the reviewer is chosen against the builder\'s model family, and a same-family pair needs consent', () => {
  const s = flat(section('5.'));
  assert.match(s, /another model family than the builder's/i);
  assert.match(s, /Codex builder/i);
  assert.match(s, /speck config set reviewer codex` and `speck config set allow_same_model_review true/);
  assert.match(s, /Never pair a builder and reviewer from the same family without/i);
});
