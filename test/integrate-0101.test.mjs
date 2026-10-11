import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './support/panel.mjs';

// ---------- 0101: a skill for the shipping agent, for ships that need help ----------

const CLI = path.join(ROOT, '.speck', 'scripts', 'speck.mjs');
const SKILL = path.join(ROOT, 'skills', 'speck-integrate', 'SKILL.md');
const read = () => fs.readFileSync(SKILL, 'utf8');
const frontmatter = text => (text.match(/^---\n([\s\S]*?)\n---/) || [])[1] || '';
const body = () => read().replace(/^---\n[\s\S]*?\n---\n/, '');
const section = (text, heading) => (text.match(new RegExp(`^## ${heading}[^\\n]*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm')) || [])[1] || '';

test('AC1: the skill is agent-only, with its name matching its folder', () => {
  const fm = frontmatter(read());
  assert.match(fm, /^name: speck-integrate$/m);
  assert.match(fm, /^user-invocable: false$/m);
  assert.doesNotMatch(fm, /^disable-model-invocation:/m, 'the agent must still be able to load it');
});

test('AC1: the description says only the ship queue starts it, never a person or another skill', () => {
  const desc = (frontmatter(read()).match(/^description: (.+)$/m) || [])[1] || '';
  assert.match(desc, /only the ship queue starts it/i);
  assert.match(desc, /never a person/i);
  assert.match(desc, /another skill/i);
});

test('AC1: every frontmatter value is a plain YAML scalar (no ": " or " #" inside)', () => {
  for (const line of frontmatter(read()).split('\n')) assert.doesNotMatch(line.slice(line.indexOf(': ') + 2), /: | #/, line);
});

test('AC1: speck init installs it, agent-only, in both skill folders', () => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-integrate-0101-')));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const r = spawnSync(process.execPath, [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  for (const base of ['.claude/skills', '.agents/skills']) {
    const installed = fs.readFileSync(path.join(dir, base, 'speck-integrate', 'SKILL.md'), 'utf8');
    assert.equal(installed, read(), base);
  }
});

test('AC1: this repo uses the skill too, linked from both skill folders', () => {
  for (const base of ['.claude/skills', '.agents/skills']) {
    const link = path.join(ROOT, base, 'speck-integrate');
    assert.ok(fs.lstatSync(link).isSymbolicLink(), base);
    assert.equal(fs.readlinkSync(link), '../../skills/speck-integrate', base);
  }
});

test('AC2: a conflict is merged in and classed with speck merge-check', () => {
  const s = section(body(), 'Conflict');
  assert.ok(s, 'has a Conflict section');
  assert.match(s, /exits with 13/);
  assert.match(s, /`speck merge-check <id>`/);
  assert.match(s, /git merge <ref>/);
  for (const cls of ['added-lines', 'lockfile', 'logic', 'ticket']) assert.match(s, new RegExp('`' + cls + '`'), cls);
  assert.match(s, /keep both sides/i);
  assert.match(s, /install command/i);
  assert.match(s, /intent of both sides/i);
});

test('AC2: every conflict merge gets a merge round before it ships, whatever its class', () => {
  const s = section(body(), 'Conflict');
  assert.match(s, /`speck test/);
  assert.match(s, /merge round/i);
  assert.match(s, /`speck review <id>/);
  assert.match(s, /`speck next <id>`/);
  assert.match(s, /`speck close <id>`/);
  assert.match(s, /every conflict merge/i);
  assert.doesNotMatch(s, /no extra review|ship(s)? without (a |another )?review/i);
  // The merge round comes after the tests and before the ship.
  assert.ok(s.indexOf('speck test') < s.indexOf('speck review <id>'));
  assert.ok(s.indexOf('speck review <id>') < s.lastIndexOf('speck ship <id>'));
});

test('AC3: a failing base branch gets one fix ticket and no code changes', () => {
  const s = section(body(), 'Base branch failing');
  assert.ok(s, 'has a Base branch failing section');
  assert.match(s, /exits with 14/);
  assert.match(s, /change no code/i);
  assert.match(s, /`speck new "<title>" --type=fix`/);
  assert.match(s, /already covers/i);
  assert.match(s, /plain words/i);
  assert.match(s, /`auto_fix_main`/);
  assert.match(s, /`speck set <fix-id> status ready`/);
  assert.match(s, /only when `auto_fix_main` is `true`/);
  assert.match(s, /then stop/i);
});

test('AC4: it asks only for contradicting tickets or a blocked merge round, in plain words', () => {
  const s = section(body(), 'Asking the user');
  assert.ok(s, 'has an Asking the user section');
  assert.match(s, /only/);
  assert.match(s, /contradict/i);
  assert.match(s, /`speck next <id>` says `block`/);
  assert.match(s, /## Blocked question/);
  assert.match(s, /`speck set <id> status blocked`/);
  assert.match(s, /without git terms/i);
  assert.match(s, /options/i);
  assert.match(s, /recommend/i);
});

test('AC5: the rules keep the merge minimal and leave merging, pushing and Review rounds to speck', () => {
  const s = section(body(), 'Rules');
  assert.ok(s, 'has a Rules section');
  assert.match(s, /never change a file the merge doesn't need/i);
  assert.match(s, /never merge into the base branch or push/i);
  assert.match(s, /except through `speck ship <id>`/);
  assert.match(s, /never edit a ticket's `## Review rounds`/i);
});

test('AC3/AC5: the skill never tells the agent to push, force or merge into the base branch by hand', () => {
  assert.doesNotMatch(body(), /git push|--force|git checkout (main|<base)/);
});

test('AC1: the brief lists the skill as agent-only, started by the ship queue', () => {
  const row = fs.readFileSync(path.join(ROOT, 'docs/brief.md'), 'utf8').match(/^\| `speck-integrate` \|.*$/m);
  assert.ok(row, 'brief has a speck-integrate row');
  assert.match(row[0], /user-invocable: false/);
  assert.match(row[0], /ship queue/);
});

test('AC2 self-check: the merge round gets a fresh response file, not one left from the build', () => {
  assert.match(section(body(), 'Conflict'), /response file fresh/i);
});

test('AC3 self-check: an existing open fix ticket is still set ready when auto_fix_main allows it', () => {
  assert.match(section(body(), 'Base branch failing'), /don't make another: go to step 3 with that ticket/);
});
