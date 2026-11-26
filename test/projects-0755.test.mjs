// 0755: `speck projects`, a list of your speck projects on this machine, kept in the home folder.
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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const git = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8', env: { ...process.env, ...gitEnv } });
const tmp = prefix => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));

// A home folder of the test's own, so it never reads or writes yours, with no panels running.
function machine() {
  const home = tmp('speck-projects-home-');
  const env = { ...process.env, SPECK_HOME_SETTINGS_DIR: path.join(home, 'speck'), SPECK_PANELS_DIR: path.join(home, 'panels') };
  return { home, env, file: path.join(home, 'speck', 'projects.json') };
}

// A git repo called `name`, with speck set up (speck/config.yml and .speck/ with its VERSION) unless told otherwise.
function project(name, { config = true, dotSpeck = true, version = '1.2.3', gitRepo = true } = {}) {
  const dir = path.join(tmp('speck-projects-'), name);
  fs.mkdirSync(dir);
  if (gitRepo) git(dir, 'init', '-q', '-b', 'main');
  if (config) { fs.mkdirSync(path.join(dir, 'speck')); fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), 'base_branch: main\n'); }
  if (dotSpeck) { fs.mkdirSync(path.join(dir, '.speck')); if (version) fs.writeFileSync(path.join(dir, '.speck', 'VERSION'), `${version}\n`); }
  return dir;
}

const listed = file => JSON.parse(fs.readFileSync(file, 'utf8')).projects.map(p => p.folder);
// Every file under `dir` with its contents, to show nothing in it changed.
function snapshot(dir) {
  const out = {};
  const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else out[path.relative(dir, p)] = fs.readFileSync(p, 'utf8'); } };
  walk(dir);
  return out;
}
const lineOf = (out, folder) => out.split('\n').find(l => l.includes(folder)) || '';

test('0755 AC1: projects add adds the current folder by its real path, and says so', () => {
  const m = machine(), dir = project('alpha');
  const link = path.join(tmp('speck-projects-link-'), 'via-link');
  fs.symlinkSync(dir, link);
  const r = speck(link, m.env, 'projects', 'add');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Added alpha/);
  assert.ok(r.stdout.includes(dir), r.stdout);
  assert.deepEqual(listed(m.file), [dir]);
  assert.equal(fs.statSync(m.file).mode & 0o777, 0o600, 'only its owner can read the list');
});

test('0755 AC1: projects add <folder> adds that folder, and adding it again changes nothing', () => {
  const m = machine(), a = project('alpha'), b = project('beta');
  assert.equal(speck(ROOT, m.env, 'projects', 'add', a).status, 0);
  const rel = path.relative(path.dirname(b), b);
  assert.equal(speck(path.dirname(b), m.env, 'projects', 'add', rel).status, 0);
  const before = fs.readFileSync(m.file, 'utf8');
  const again = speck(ROOT, m.env, 'projects', 'add', a);
  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, /already/i);
  assert.equal(fs.readFileSync(m.file, 'utf8'), before);
  assert.deepEqual(listed(m.file), [a, b]);
});

test('0755 AC1: projects add from a worktree or a subfolder adds the project\'s main checkout', () => {
  const m = machine(), dir = project('alpha');
  git(dir, 'add', '.');
  git(dir, 'commit', '-qm', 'init');
  const wt = path.join(tmp('speck-projects-wt-'), 'side');
  git(dir, 'worktree', 'add', '-q', '-b', 'side', wt);
  assert.equal(speck(wt, m.env, 'projects', 'add').status, 0);
  assert.equal(speck(path.join(dir, 'speck'), m.env, 'projects', 'add').status, 0);
  assert.deepEqual(listed(m.file), [dir]);
});

test('0755 AC2: projects add refuses a folder that isn\'t a git repository with speck set up, and adds nothing', () => {
  const m = machine();
  const cases = [
    [project('plain', { gitRepo: false }), /isn't a git repository/],
    [project('noconfig', { config: false }), /speck\/config\.yml/],
    [project('nodot', { dotSpeck: false }), /\.speck\//],
    [path.join(os.tmpdir(), 'speck-projects-nowhere-0755'), /no folder/i],
  ];
  for (const [dir, why] of cases) {
    const r = speck(ROOT, m.env, 'projects', 'add', dir);
    assert.notEqual(r.status, 0, dir);
    assert.match(r.stderr, why, dir);
    assert.match(r.stderr, /Nothing was added/);
    assert.doesNotMatch(r.stderr, /\n\s+at /, 'no stack trace');
  }
  assert.equal(fs.existsSync(m.file), false);
  // No git on the PATH: it says so, rather than that the folder isn't a repository.
  const noGit = speck(ROOT, { ...m.env, PATH: tmp('speck-projects-nopath-') }, 'projects', 'add', project('withgit'));
  assert.notEqual(noGit.status, 0);
  assert.match(noGit.stderr, /Can't run git/);
  assert.equal(fs.existsSync(m.file), false);
});

test('0755 AC3: projects lists each one with its name, folder, speck version, and whether its panel and speck run are running', () => {
  const m = machine(), on = project('alpha', { version: '1.6.1' }), off = project('beta', { version: '' }), gone = project('gamma');
  for (const d of [on, off, gone]) assert.equal(speck(ROOT, m.env, 'projects', 'add', d).status, 0);
  // alpha's panel and speck run are running (this process stands in for both); beta's panel has stopped, leaving its record.
  fs.mkdirSync(path.join(m.home, 'panels'));
  fs.writeFileSync(path.join(m.home, 'panels', '4790.json'), JSON.stringify({ pid: process.pid, port: 4790, name: 'alpha', repo: on }));
  fs.writeFileSync(path.join(m.home, 'panels', '4791.json'), JSON.stringify({ pid: 2 ** 22 + 12345, port: 4791, name: 'beta', repo: off }));
  fs.mkdirSync(path.join(on, 'speck', '.cache', 'runs'), { recursive: true });
  fs.writeFileSync(path.join(on, 'speck', '.cache', 'runs', 'run.lock'), `${process.pid}\n`);
  fs.rmSync(gone, { recursive: true });

  const r = speck(ROOT, m.env, 'projects');
  assert.equal(r.status, 0, r.stderr);
  const a = lineOf(r.stdout, on), b = lineOf(r.stdout, off), g = lineOf(r.stdout, gone);
  assert.match(a, /alpha/); assert.match(a, /1\.6\.1/); assert.match(a, /panel running on port 4790/); assert.match(a, /speck run running/);
  assert.match(b, /beta/); assert.match(b, /version unknown/); assert.match(b, /panel off/); assert.match(b, /speck run off/);
  assert.match(g, /gamma/); assert.match(g, /missing/);
  assert.deepEqual(listed(m.file), [on, off, gone], 'listing changes nothing');
});

test('0755 AC3: projects with none listed says how to add one', () => {
  const m = machine();
  const r = speck(ROOT, m.env, 'projects');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /speck projects add/);
});

test('0755 AC3: a list file that can\'t be read gives a plain error', () => {
  const m = machine();
  fs.mkdirSync(path.dirname(m.file), { recursive: true });
  fs.writeFileSync(m.file, '{not json');
  const r = speck(ROOT, m.env, 'projects');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /projects\.json/);
  assert.doesNotMatch(r.stderr, /\n\s+at /);
});

test('0755 AC4: projects remove takes a project off by name or folder and touches nothing in it', () => {
  const m = machine(), a = project('alpha'), b = project('beta'), c = project('gamma');
  for (const d of [a, b, c]) assert.equal(speck(ROOT, m.env, 'projects', 'add', d).status, 0);
  const before = [snapshot(a), snapshot(b)];
  const byName = speck(ROOT, m.env, 'projects', 'remove', 'alpha');
  assert.equal(byName.status, 0, byName.stderr);
  assert.match(byName.stdout, /Removed alpha/);
  const byFolder = speck(path.dirname(b), m.env, 'projects', 'remove', './beta');
  assert.equal(byFolder.status, 0, byFolder.stderr);
  assert.deepEqual(listed(m.file), [c]);
  assert.deepEqual([snapshot(a), snapshot(b)], before);
  // A folder that's gone can still be removed, by its folder.
  fs.rmSync(c, { recursive: true });
  assert.equal(speck(ROOT, m.env, 'projects', 'remove', c).status, 0);
  assert.deepEqual(listed(m.file), []);
});

test('0755 AC4: projects remove refuses a project that isn\'t listed, and one name two projects share', () => {
  const m = machine(), a1 = project('alpha'), a2 = project('alpha');
  for (const d of [a1, a2]) assert.equal(speck(ROOT, m.env, 'projects', 'add', d).status, 0);
  const none = speck(ROOT, m.env, 'projects', 'remove', 'nope');
  assert.notEqual(none.status, 0);
  assert.match(none.stderr, /isn't on your list/);
  const both = speck(ROOT, m.env, 'projects', 'remove', 'alpha');
  assert.notEqual(both.status, 0);
  assert.ok(both.stderr.includes(a1) && both.stderr.includes(a2), both.stderr);
  const proto = speck(ROOT, m.env, 'projects', 'remove', '__proto__');
  assert.notEqual(proto.status, 0);
  assert.deepEqual(listed(m.file), [a1, a2]);
  const bare = speck(ROOT, m.env, 'projects', 'remove');
  assert.notEqual(bare.status, 0);
  assert.match(bare.stderr, /speck projects remove <name or folder>/);
});

test('0755 AC5: the brief\'s command table and speck help describe projects, projects add and projects remove', () => {
  const brief = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8');
  const row = brief.split('\n').find(l => l.startsWith('| `speck projects'));
  assert.ok(row, 'a row for speck projects');
  for (const c of ['speck projects add', 'speck projects remove']) assert.ok(row.includes(c), c);
  const help = speck(ROOT, process.env, 'help').stdout;
  assert.match(help, /speck projects/);
});
