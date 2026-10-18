import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './support/panel.mjs';
import { setupPrompt } from './support/release.mjs';

// ---------- 0107: hide the setup skill from the slash menu ----------

const CLI = path.join(ROOT, '.speck', 'scripts', 'speck.mjs');
const SKILL = path.join(ROOT, 'skills', 'speck-setup', 'SKILL.md');
const frontmatter = text => (text.match(/^---\n([\s\S]*?)\n---/) || [])[1] || '';

test('AC1: the source skill has user-invocable: false in its frontmatter', () => {
  assert.match(frontmatter(fs.readFileSync(SKILL, 'utf8')), /^user-invocable: false$/m);
});

test('AC1: speck init installs it with user-invocable: false in both skill folders', () => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-setup-0107-')));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const r = spawnSync(process.execPath, [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  for (const base of ['.claude/skills', '.agents/skills']) {
    const installed = fs.readFileSync(path.join(dir, base, 'speck-setup', 'SKILL.md'), 'utf8');
    assert.match(frontmatter(installed), /^user-invocable: false$/m, base);
  }
});

test('AC1: the other speck skills stay in the slash menu', () => {
  for (const name of fs.readdirSync(path.join(ROOT, 'skills')).filter(n => n !== 'speck-setup' && n !== 'speck-foreman')) { // 0287: the Foreman agent's is agent-only too
    const file = path.join(ROOT, 'skills', name, 'SKILL.md');
    if (fs.existsSync(file)) assert.doesNotMatch(frontmatter(fs.readFileSync(file, 'utf8')), /^user-invocable:/m, name);
  }
});

test('AC2: the description says the README setup prompt starts it, not a typed command', () => {
  const desc = (frontmatter(fs.readFileSync(SKILL, 'utf8')).match(/^description: (.+)$/m) || [])[1] || '';
  assert.match(desc, /setup prompt/i);
  assert.match(desc, /README/);
  assert.match(desc, /not (as )?a command|not typed|isn't typed|not something .* types?/i);
});

test('AC3: the README setup prompt still names the skill', () => {
  assert.match(setupPrompt(fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8')) || '', /speck-setup/);
});

test('AC1 self-check: every frontmatter value is a valid plain YAML scalar (no ": " or " #" inside)', () => {
  for (const line of frontmatter(fs.readFileSync(SKILL, 'utf8')).split('\n')) {
    const value = line.slice(line.indexOf(': ') + 2);
    assert.doesNotMatch(value, /: | #/, line);
  }
});
