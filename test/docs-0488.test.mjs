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
// The old names a doc may give, in a sentence saying they still work.
const OLD = /`foreman_fixing`|`foreman_model`|`foreman_effort`|`foreman`|`speck foreman[^`]*`/g;
const sentences = text => text.split(/(?<=[.:])\s+|\n/);

test('0488 AC1: the docs say Foreman only for the old names, where they say those still work', () => {
  for (const f of DOCS) {
    for (const s of sentences(read(f)).filter(s => /foreman/i.test(s))) {
      assert.doesNotMatch(s.replace(OLD, ''), /foreman/i, `${f}: ${s}`);
      assert.match(s, /still/, `${f} names an old name without saying it still works: ${s}`);
    }
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
  const old = row.split(/(?<=\.) /).find(s => s.includes('`foreman_fixing`'));
  assert.ok(old, 'a sentence naming the old names');
  for (const name of ['`foreman`', '`foreman_model`', '`foreman_effort`']) assert.ok(old.includes(name), name);
  assert.match(old, /\bstill\b/, 'saying they still work');
});

test('0488 AC2: the agent\'s skill and the setup skill name the new commands and settings', () => {
  const watch = read('skills/speck-watch/SKILL.md');
  assert.match(watch, /^# speck watch$/m);
  for (const name of ['speck watch resume <id>', 'speck watch reship <id>', 'speck watch fix <id>', 'speck watch ask <id>', '`speck answer`', '`speck dismiss`', '`watch` set to fix']) assert.ok(watch.includes(name), name);
  const setup = read('skills/speck-setup/SKILL.md');
  for (const name of ['speck config set watch_agent <name>', 'speck config set watch_model <name>', 'speck config set watch_effort <effort>', '`watch: fix`']) assert.ok(setup.includes(name), name);
});

test('0488 AC4: CHANGELOG.md and docs/releases/ don\'t change', t => {
  const base = spawnSync('git', ['merge-base', 'HEAD', 'main'], { cwd: ROOT, encoding: 'utf8' });
  if (base.status !== 0) return t.skip('no main branch in this checkout');
  const diff = spawnSync('git', ['diff', '--name-only', base.stdout.trim(), '--', 'CHANGELOG.md', 'docs/releases'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(diff.stdout, '');
});
