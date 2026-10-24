import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// ---------- 0488: the docs call the Foreman speck, with the new setting and command names ----------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const SKILLS = fs.readdirSync(path.join(ROOT, 'skills')).map(n => `skills/${n}/SKILL.md`).filter(f => fs.existsSync(path.join(ROOT, f)));
const DOCS = ['README.md', 'docs/brief.md', ...SKILLS, 'templates/config.yml'];
// The old names a doc may still give. That it says they still work where it does is checked by review.
const OLD = /`foreman_fixing`|`foreman_model`|`foreman_effort`|`foreman`|`speck foreman[^`]*`/g;

test('0488 AC1: the docs say Foreman only in the old setting names and `speck foreman`', () => {
  for (const f of DOCS) {
    const left = read(f).replace(OLD, '').split('\n').filter(l => /foreman/i.test(l));
    assert.deepEqual(left, [], f);
  }
});

test('0488 AC2: the README and the brief name the new settings and commands', () => {
  for (const f of ['README.md', 'docs/brief.md']) {
    const text = read(f);
    for (const name of ['`watch`', '`watch_agent`', '`watch_model`', '`watch_effort`', '`speck answer <id> "<answer>"`', '`speck dismiss <id>`']) assert.ok(text.includes(name), `${f}: ${name}`);
  }
  assert.ok(read('README.md').includes('`watch: fix`'), 'README: `watch: fix`');
  const brief = read('docs/brief.md');
  for (const name of ['`speck watch <action> <id> … --why=<why>`', '`speck-watch`', '`speck(<id>): watch: <action>`']) assert.ok(brief.includes(name), name);
});

test('0488 AC2: the brief\'s speck config set row says the old setting names are still read', () => {
  const row = read('docs/brief.md').split('\n').find(l => l.startsWith('| `speck config set <key> <value>`'));
  assert.ok(row, 'the row');
  for (const name of ['`watch`', '`watch_agent`', '`watch_model`', '`watch_effort`']) assert.ok(row.includes(name), name);
  for (const name of ['`foreman_fixing`', '`foreman`', '`foreman_model`', '`foreman_effort`']) assert.ok(row.includes(name), name); // that they're still read: by review
});

test('0488 AC2: the agent\'s skill and the setup skill name the new commands and settings', () => {
  const watch = read('skills/speck-watch/SKILL.md');
  assert.match(watch, /^# speck watch$/m);
  for (const name of ['speck watch resume <id>', 'speck watch reship <id>', 'speck watch fix <id>', 'speck watch ask <id>', '`speck answer`', '`speck dismiss`']) assert.ok(watch.includes(name), name);
  const setup = read('skills/speck-setup/SKILL.md');
  for (const name of ['speck config set watch_agent <name>', 'speck config set watch_model <name>', 'speck config set watch_effort <effort>', '`watch: fix`']) assert.ok(setup.includes(name), name);
});

test('0488 AC4: CHANGELOG.md and docs/releases/ don\'t change', t => {
  const base = spawnSync('git', ['merge-base', 'HEAD', 'main'], { cwd: ROOT, encoding: 'utf8' });
  if (base.status !== 0) return t.skip('no main branch in this checkout');
  const diff = spawnSync('git', ['diff', '--name-only', base.stdout.trim(), '--', 'CHANGELOG.md', 'docs/releases'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(diff.stdout, '');
});
