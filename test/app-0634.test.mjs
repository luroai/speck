import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0634: speck app <id> starts the project's app from a ticket's checkout on a free port, and --stop stops it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { gitIn } from './support/speck.mjs';
import { speck, speckProcess } from './support/cli.mjs';
import { startApp, answers } from '../scripts/app.mjs';
import { checkConfigValue } from '../scripts/config.mjs';
import { pidAlive } from '../scripts/run-switch.mjs';

const env = { ...process.env, NO_COLOR: '1' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const until = async (check, ms = 10000) => { for (const end = Date.now() + ms; Date.now() < end; await sleep(50)) if (await check()) return true; return false; };

// A stand-in app: answers every request with the folder it runs in, after starting a process of its own that writes
// its id to kid.pid, so a test can see every process it started is stopped.
const APP = `const http = require('http'), fs = require('fs'), { spawn } = require('child_process');
const kid = spawn('sleep', ['300'], { stdio: 'ignore' }); fs.writeFileSync('kid.pid', String(kid.pid));
console.log('app starting on ' + process.argv[2]);
http.createServer((q, s) => s.end(process.cwd())).listen(Number(process.argv[2]), '127.0.0.1');
`;
// One that writes lines and never listens.
const SILENT = `const fs = require('fs'), { spawn } = require('child_process');
const kid = spawn('sleep', ['300'], { stdio: 'ignore' }); fs.writeFileSync('kid.pid', String(kid.pid));
for (let i = 1; i <= 30; i++) console.log('line ' + i); console.error('cannot bind'); setInterval(() => {}, 1e6);
`;

// One that sends the start of a response, then a byte at a time, never finishing its headers.
const TRICKLE = `require('net').createServer(c => { c.write('HTTP/1.1 200 OK\\r\\n'); setInterval(() => c.write('X'), 100); }).listen(Number(process.argv[2]), '127.0.0.1');
`;

const ticketText = (id, title) => `---\nid: "${id}"\ntitle: "${title}"\nstatus: building\nsize: S\nrisk: low\n---\n# ${id} · ${title}\n\n## Problem\nx\n## Outcome\ny\n## Acceptance criteria\n1. z\n`;

// A committed repo with tickets 0001 and 0002 and both stand-in apps; `config` is added to speck/config.yml.
function repo(config) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0634-')));
  gitIn(dir, 'init', '-q', '-b', 'main');
  fs.mkdirSync(path.join(dir, 'speck', 'tickets'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), `base_branch: main\nbranch_prefix: speck/\nworktrees: true\n${config}`);
  fs.writeFileSync(path.join(dir, 'speck', 'tickets', '0001-one.md'), ticketText('0001', 'One'));
  fs.writeFileSync(path.join(dir, 'speck', 'tickets', '0002-two.md'), ticketText('0002', 'Two'));
  fs.writeFileSync(path.join(dir, 'app.js'), APP);
  fs.writeFileSync(path.join(dir, 'silent.js'), SILENT);
  fs.writeFileSync(path.join(dir, 'trickle.js'), TRICKLE);
  fs.writeFileSync(path.join(dir, '.gitignore'), 'kid.pid\nspeck/.cache/\n');
  gitIn(dir, 'add', '-A'); gitIn(dir, 'commit', '-qm', 'base');
  return dir;
}
// Ticket 0001's worktree, beside the main checkout as speck start makes it.
function worktree(dir) {
  const wt = path.join(`${dir}.worktrees`, 'speck', '0001-one');
  assert.equal(gitIn(dir, 'worktree', 'add', '-q', '-b', 'speck/0001-one', wt).status, 0);
  return fs.realpathSync(wt);
}
const node = JSON.stringify(process.execPath);
const startCmd = `commands:\n  start: '${node} app.js {port}'\n`;
const kidOf = folder => Number(fs.readFileSync(path.join(folder, 'kid.pid'), 'utf8'));
const get = url => fetch(url).then(r => r.text());

test('0634 AC1: speck app runs commands.start from the ticket\'s worktree on a free port, waits for app_url and leaves it running', async () => {
  const dir = repo(`${startCmd}app_url: http://localhost:{port}/health\n`), wt = worktree(dir);
  const r = speckProcess(dir, env, 'app', '1');
  try {
    assert.equal(r.status, 0, r.stderr);
    const url = r.stdout.match(/http:\/\/localhost:(\d+)\/health/);
    assert.ok(url, r.stdout);
    assert.notEqual(url[1], '0');
    // The command has returned, and the app still answers, from the ticket's worktree.
    assert.equal(await get(url[0]), wt);
    assert.ok(pidAlive(kidOf(wt)));
  } finally { speckProcess(dir, env, 'app', '1', '--stop'); }
});

test('0634 AC1: a ticket with no worktree runs it from the main checkout, at http://127.0.0.1:{port}/ by default', async () => {
  const dir = repo(startCmd);
  worktree(dir); // ticket 0001's, not 0002's
  const r = speckProcess(dir, env, 'app', '0002');
  try {
    assert.equal(r.status, 0, r.stderr);
    const url = r.stdout.match(/http:\/\/127\.0\.0\.1:\d+\//);
    assert.ok(url, r.stdout);
    assert.equal(await get(url[0]), dir);
  } finally { speckProcess(dir, env, 'app', '0002', '--stop'); }
});

test('0634 AC2: an app that doesn\'t answer within app_start_seconds is stopped with all it started, and its last lines are printed', async () => {
  const dir = repo(`commands:\n  start: '${node} silent.js {port}'\napp_start_seconds: 1\n`);
  const r = speckProcess(dir, env, 'app', '1');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /didn't answer at http:\/\/127\.0\.0\.1:\d+\/ within 1 seconds/);
  assert.match(r.stderr, /line 30/);
  assert.match(r.stderr, /cannot bind/);
  assert.doesNotMatch(r.stderr, /line 1\n/); // the last lines, not everything
  assert.ok(await until(() => !pidAlive(kidOf(dir))), 'the process the app started is still running');
  const stop = speckProcess(dir, env, 'app', '1', '--stop');
  assert.match(stop.stdout, /No app speck started for ticket 0001 is running/);
});

test('0634 AC3: --stop stops the ticket\'s app with every process it started and nothing else, and says so when none is running', async () => {
  const dir = repo(startCmd), wt = worktree(dir);
  const other = spawn('sleep', ['300'], { stdio: 'ignore', detached: true }); // someone else's, with the same name
  try {
    const r = speckProcess(dir, env, 'app', '1');
    assert.equal(r.status, 0, r.stderr);
    const url = r.stdout.match(/http:\/\/127\.0\.0\.1:\d+\//)[0], kid = kidOf(wt);
    const s = speckProcess(dir, env, 'app', '1', '--stop');
    assert.equal(s.status, 0, s.stderr);
    assert.match(s.stdout, /Stopped ticket 0001's app/);
    assert.equal(await answers(url), false);
    assert.ok(await until(() => !pidAlive(kid)), 'a process the app started is still running');
    assert.ok(pidAlive(other.pid), 'another process was stopped');
    const again = speckProcess(dir, env, 'app', '1', '--stop');
    assert.equal(again.status, 0, again.stderr);
    assert.equal(again.stdout.trim().split('\n').length, 1);
    assert.match(again.stdout, /No app speck started for ticket 0001 is running/);
  } finally { other.kill(); }
});

test('0634 AC4: with commands.start blank or missing, speck app refuses in one line and starts nothing', async () => {
  for (const config of ['', 'commands:\n  start: ""\n']) {
    const dir = repo(config);
    await assert.rejects(startApp(dir, '1'), e => /commands\.start/.test(e.message) && /speck config set commands\.start/.test(e.message) && !e.message.includes('\n'));
    assert.equal(fs.existsSync(path.join(dir, 'speck', '.cache', 'apps', '0001.json')), false);
    assert.equal(fs.existsSync(path.join(dir, 'kid.pid')), false);
  }
});

test('0634 AC5: speck config set checks and sets commands.start, app_url and app_start_seconds, and speck config show explains them', () => {
  assert.equal(checkConfigValue('commands.start', 'npm run dev -- --port {port}'), 'npm run dev -- --port {port}');
  assert.equal(checkConfigValue('app_url', 'http://localhost:{port}/app'), 'http://localhost:{port}/app');
  assert.equal(checkConfigValue('app_url', ''), '');
  assert.throws(() => checkConfigValue('app_url', 'localhost:{port}'), /app_url must be blank or an http or https address/);
  assert.throws(() => checkConfigValue('app_url', 'ftp://x/'), /app_url must be/);
  assert.equal(checkConfigValue('app_start_seconds', '90'), 90);
  assert.throws(() => checkConfigValue('app_start_seconds', '0'), /app_start_seconds must be a whole number/);

  const dir = repo('');
  for (const [k, v] of [['commands.start', 'npm start -- {port}'], ['app_url', 'http://localhost:{port}/'], ['app_start_seconds', '30']])
    assert.equal(speck(dir, env, 'config', 'set', k, v).status, 0);
  const cfg = fs.readFileSync(path.join(dir, 'speck', 'config.yml'), 'utf8');
  assert.match(cfg, /start: npm start -- \{port\}|start: "npm start -- \{port\}"/);
  assert.match(cfg, /app_url: "?http:\/\/localhost:\{port\}\/"?/);
  assert.match(cfg, /app_start_seconds: 30/);
  assert.notEqual(speck(dir, env, 'config', 'set', 'app_start_seconds', 'soon').status, 0);

  const show = JSON.parse(speck(dir, env, 'config', 'show', '--json').stdout);
  const shown = Object.fromEntries(show.groups.flatMap(g => g.settings).map(s => [s.key, s]));
  for (const k of ['commands.start', 'app_url', 'app_start_seconds']) assert.ok(shown[k]?.explain, `${k} isn't explained`);
  assert.equal(shown['commands.start'].value, 'npm start -- {port}');
  assert.equal(shown.app_start_seconds.value, 30);
  assert.equal(shown.app_start_seconds.speck_default, 60);
  assert.match(speck(dir, env, 'config', 'show').stdout, /app_url: http:\/\/localhost:\{port\}\//);
});

test('0634 AC5: the brief names speck app, its settings and their defaults', () => {
  const brief = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
  const row = brief.split('\n').find(l => l.startsWith('| `speck app <id>` |'));
  assert.ok(row, 'no row for speck app in the brief');
  for (const fact of ['`commands.start`', '`app_url`', '`http://127.0.0.1:{port}/`', '`app_start_seconds` (default 60)', '`speck app <id> --stop`', '`speck/.cache/apps/`'])
    assert.ok(row.includes(fact), `the row doesn't name ${fact}`);
});

test('0634 AC2: an app that keeps sending a response it never finishes still fails within app_start_seconds', async () => {
  const dir = repo(`commands:\n  start: '${node} trickle.js {port}'\napp_start_seconds: 1\n`);
  const began = Date.now(), r = speckProcess(dir, env, 'app', '1');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /didn't answer at .* within 1 seconds/);
  assert.ok(Date.now() - began < 8000, `took ${Date.now() - began} ms`);
});

// Runs `speck app <args>` as its own process without waiting for it: resolves to { status, stdout, stderr }.
const CLI = fileURLToPath(new URL('../scripts/speck.mjs', import.meta.url));
const speckAsync = (dir, ...args) => new Promise(resolve => {
  const c = spawn(process.execPath, [CLI, ...args], { cwd: dir, env });
  let stdout = '', stderr = '';
  c.stdout.on('data', d => { stdout += d; }); c.stderr.on('data', d => { stderr += d; });
  c.on('close', status => resolve({ status, stdout, stderr }));
});

test('0634 AC3: two starts at once leave one app, which --stop stops with all it started', async () => {
  const dir = repo(startCmd), wt = worktree(dir);
  const both = await Promise.all([speckAsync(dir, 'app', '1'), speckAsync(dir, 'app', '1')]);
  try {
    const ok = both.filter(r => r.status === 0);
    assert.ok(ok.length >= 1, JSON.stringify(both));
    for (const r of both.filter(r => r.status !== 0)) assert.match(r.stderr, /already starting or stopping ticket 0001's app/);
    const urls = new Set(ok.map(r => r.stdout.match(/http:\/\/127\.0\.0\.1:\d+\//)[0]));
    assert.equal(urls.size, 1, 'two apps were started');
  } finally {
    const s = speckProcess(dir, env, 'app', '1', '--stop');
    assert.equal(s.status, 0, s.stderr);
  }
  assert.ok(await until(() => !pidAlive(kidOf(wt))), 'a process the app started is still running');
  assert.match(speckProcess(dir, env, 'app', '1', '--stop').stdout, /No app speck started for ticket 0001 is running/);
});
