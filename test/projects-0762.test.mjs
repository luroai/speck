// 0762: `speck projects off` and `on`, which keep a project on the list but leave it out of speck serve, or put it back.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { speck } from './support/cli.mjs';
import { gitEnv } from './support/speck.mjs';
import { listedProjects, onProjects, projectsState } from '../scripts/projects.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = prefix => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));

function machine() {
  const home = tmp('speck-projects-0762-home-');
  const env = { ...process.env, SPECK_HOME_SETTINGS_DIR: path.join(home, 'speck'), SPECK_PANELS_DIR: path.join(home, 'panels') };
  return { home, env, file: path.join(home, 'speck', 'projects.json') };
}
function project(name) {
  const dir = path.join(tmp('speck-projects-0762-'), name);
  fs.mkdirSync(path.join(dir, 'speck'), { recursive: true });
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir, env: { ...process.env, ...gitEnv } });
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), 'base_branch: main\n');
  fs.mkdirSync(path.join(dir, '.speck'));
  fs.writeFileSync(path.join(dir, '.speck', 'VERSION'), '1.7.0\n');
  return dir;
}
function snapshot(dir) {
  const out = {};
  const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else out[path.relative(dir, p)] = fs.readFileSync(p, 'utf8'); } };
  walk(dir);
  return out;
}
const lineOf = (out, folder) => out.split('\n').find(l => l.includes(folder)) || '';

test('0762 AC1: projects off keeps a project on the list but marks it off, by name or folder, and on turns it back on', () => {
  const m = machine(), a = project('alpha'), b = project('bravo');
  for (const d of [a, b]) assert.equal(speck(ROOT, m.env, 'projects', 'add', d).status, 0);
  const before = [snapshot(a), snapshot(b)];

  const off = speck(ROOT, m.env, 'projects', 'off', 'alpha');
  assert.equal(off.status, 0, off.stderr);
  assert.match(off.stdout, /alpha/);
  assert.deepEqual(listedProjects(m.env), [a, b], 'still on the list, in its place');
  assert.deepEqual(onProjects(m.env), [b], 'but off');
  assert.deepEqual(projectsState(m.env).map(p => [p.name, p.off]), [['alpha', true], ['bravo', false]]);

  const list = speck(ROOT, m.env, 'projects');
  assert.equal(list.status, 0, list.stderr);
  assert.match(lineOf(list.stdout, a), /\boff\b.*speck serve/, 'the list says alpha is off');
  assert.doesNotMatch(lineOf(list.stdout, b), /speck serve leaves it out/, 'and bravo isn\'t');

  // Turning it off again changes nothing, and says so.
  const again = speck(ROOT, m.env, 'projects', 'off', a);
  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, /already off/);

  // Adding it again keeps it off.
  assert.equal(speck(ROOT, m.env, 'projects', 'add', a).status, 0);
  assert.deepEqual(onProjects(m.env), [b]);

  const on = speck(path.dirname(a), m.env, 'projects', 'on', './alpha');
  assert.equal(on.status, 0, on.stderr);
  assert.deepEqual(onProjects(m.env), [a, b]);
  assert.doesNotMatch(lineOf(speck(ROOT, m.env, 'projects').stdout, a), /speck serve leaves it out/);
  const onAgain = speck(ROOT, m.env, 'projects', 'on', 'alpha');
  assert.equal(onAgain.status, 0, onAgain.stderr);
  assert.match(onAgain.stdout, /already on/);

  assert.deepEqual([snapshot(a), snapshot(b)], before, 'nothing in either project changed');
});

test('0762 AC1: projects off and on refuse a project that isn\'t listed, one name two projects share, and no name, changing nothing', () => {
  const m = machine(), a1 = project('alpha'), a2 = project('alpha');
  for (const d of [a1, a2]) assert.equal(speck(ROOT, m.env, 'projects', 'add', d).status, 0);
  const file = fs.readFileSync(m.file, 'utf8');
  for (const verb of ['off', 'on']) {
    const none = speck(ROOT, m.env, 'projects', verb, 'nope');
    assert.notEqual(none.status, 0);
    assert.match(none.stderr, /isn't on your list/);
    const proto = speck(ROOT, m.env, 'projects', verb, '__proto__');
    assert.notEqual(proto.status, 0);
    const both = speck(ROOT, m.env, 'projects', verb, 'alpha');
    assert.notEqual(both.status, 0);
    assert.ok(both.stderr.includes(a1) && both.stderr.includes(a2), both.stderr);
    assert.match(both.stderr, new RegExp(`speck projects ${verb} <folder>`));
    const bare = speck(ROOT, m.env, 'projects', verb);
    assert.notEqual(bare.status, 0);
    assert.match(bare.stderr, new RegExp(`speck projects ${verb} <name or folder>`));
    assert.doesNotMatch(none.stderr + both.stderr + bare.stderr, /\n\s+at /, 'no stack trace');
  }
  assert.equal(fs.readFileSync(m.file, 'utf8'), file, 'the list is as it was');
  // A folder that has gone can still be turned off by its folder.
  const gone = project('gone');
  assert.equal(speck(ROOT, m.env, 'projects', 'add', gone).status, 0);
  fs.rmSync(gone, { recursive: true });
  assert.equal(speck(ROOT, m.env, 'projects', 'off', gone).status, 0);
  assert.deepEqual(onProjects(m.env), [a1, a2]);
});

test('0762 AC1: a list from before 0762, with no off marks, has every project on', () => {
  const m = machine(), a = project('alpha');
  fs.mkdirSync(path.dirname(m.file), { recursive: true });
  fs.writeFileSync(m.file, JSON.stringify({ projects: [{ folder: a }, { folder: a }, { folder: 'relative' }, null] }));
  assert.deepEqual(onProjects(m.env), [a]);
  assert.equal(speck(ROOT, m.env, 'projects', 'off', 'alpha').status, 0);
  assert.deepEqual(JSON.parse(fs.readFileSync(m.file, 'utf8')).projects, [{ folder: a, off: true }]);
});

test('0762 AC5: the brief\'s command table and speck help describe projects off and projects on', () => {
  const brief = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8');
  const row = brief.split('\n').find(l => l.startsWith('| `speck projects'));
  assert.ok(row, 'a row for speck projects');
  for (const c of ['speck projects off', 'speck projects on']) assert.ok(row.includes(c), c);
  const help = speck(ROOT, process.env, 'help').stdout;
  assert.match(help, /speck projects .*off <name or folder>/);
  assert.match(help, /speck projects .*on <name or folder>/);
});
