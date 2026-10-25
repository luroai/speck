import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0509: speck panel --background starts the panel on its own, and speck panel --stop stops it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CLI, ROOT, env, panelRepo, freePort, request, startPanel, ended } from './support/panel.mjs';

const speckIn = (dir, ...args) => spawnSync(process.execPath, [CLI, ...args], { cwd: dir, env, encoding: 'utf8', timeout: 30000 });
const answers = async port => { try { return (await request(port, { pathName: '/api/panel', timeout: 2000 })).status === 200; } catch { return false; } };
const until = async (check, ms = 5000) => { for (const end = Date.now() + ms; Date.now() < end; await new Promise(r => setTimeout(r, 50))) if (await check()) return true; return false; };

// Runs `speck panel --background` from a shell that then ends, on a free port, trying another when one is taken by
// another test file in the meantime.
async function background(dir, extra = []) {
  for (let tries = 1; ; tries++) {
    const port = await freePort();
    const r = spawnSync('sh', ['-c', `"${process.execPath}" "${CLI}" panel --background --port ${port} ${extra.join(' ')}`], { cwd: dir, env, encoding: 'utf8', timeout: 30000 });
    if (r.status !== 0 && /already in use/.test(r.stderr) && tries < 5) continue;
    return { port, r };
  }
}

test('0509 AC1, AC3, AC4: --background starts a panel that outlives its shell, logs to panel.log, and --stop stops it', async () => {
  const { dir } = panelRepo();
  const { port, r } = await background(dir, ['--url', 'https://speck.example.ts.net']);
  try {
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, new RegExp(`http://127\\.0\\.0\\.1:${port}/ and https://speck\\.example\\.ts\\.net/`));
    // The shell and the command it ran have both ended, and the panel still serves its page and this repo.
    const page = await request(port);
    assert.equal(page.status, 200);
    const who = JSON.parse((await request(port, { pathName: '/api/panel' })).body);
    assert.equal(who.repo, fs.realpathSync(dir));
    // AC4: what it would print goes to speck/.cache/panel.log.
    const log = fs.readFileSync(path.join(dir, 'speck', '.cache', 'panel.log'), 'utf8');
    assert.match(log, new RegExp(`speck panel: http://127\\.0\\.0\\.1:${port}/`));
    assert.match(log, /speck panel --stop/);
  } finally {
    // AC3: --stop stops it, saying so, and then says none is running.
    const s = speckIn(dir, 'panel', '--stop');
    assert.equal(s.status, 0, s.stderr);
    assert.match(s.stdout, new RegExp(`stopped the panel at http://127\\.0\\.0\\.1:${port}/`));
  }
  assert.equal(await answers(port), false);
  const again = speckIn(dir, 'panel', '--stop');
  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, /no panel started with --background is running/);
});

test('0509 AC2: --background again on the same port starts nothing and prints the same address', async () => {
  const { dir } = panelRepo();
  const { port, r } = await background(dir);
  try {
    assert.equal(r.status, 0, r.stderr);
    const record = fs.readFileSync(path.join(dir, 'speck', '.cache', `panel-${port}.json`), 'utf8');
    const second = speckIn(dir, 'panel', '--background', '--port', String(port));
    assert.equal(second.status, 0, second.stderr);
    assert.match(second.stdout, new RegExp(`http://127\\.0\\.0\\.1:${port}/`));
    assert.equal(fs.readFileSync(path.join(dir, 'speck', '.cache', `panel-${port}.json`), 'utf8'), record);
    const log = fs.readFileSync(path.join(dir, 'speck', '.cache', 'panel.log'), 'utf8');
    assert.equal(log.match(/speck panel: http/g).length, 1, log);
  } finally { speckIn(dir, 'panel', '--stop'); }
});

test('0509 AC2: --background refuses a port something else holds, as speck panel does', async () => {
  const { dir } = panelRepo();
  const other = net.createServer(s => s.end('not a panel\n'));
  await new Promise(resolve => other.listen(0, '127.0.0.1', resolve));
  const port = other.address().port;
  try {
    const r = speckIn(dir, 'panel', '--background', '--port', String(port));
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, new RegExp(`Port ${port} is already in use, so the panel didn't start`));
    assert.equal(fs.existsSync(path.join(dir, 'speck', '.cache', `panel-${port}.json`)), false);
  } finally { await new Promise(resolve => other.close(resolve)); }
});

test('0509 AC3: --stop with only a foreground panel running says none is running and leaves it, and Ctrl+C still stops it', async () => {
  const { dir } = panelRepo();
  const p = await startPanel(dir, ['--port', String(await freePort())]);
  try {
    const s = speckIn(dir, 'panel', '--stop');
    assert.equal(s.status, 0, s.stderr);
    assert.match(s.stdout, /no panel started with --background is running/);
    assert.equal(await answers(p.port), true);
    const exit = new Promise(resolve => p.child.once('exit', resolve));
    p.child.kill('SIGINT');
    assert.equal(await exit, 0);
    assert.ok(await until(async () => !(await answers(p.port))), 'the panel still answers after Ctrl+C');
  } finally { await ended(p.child, 'the panel'); }
});

test('0509 AC4: speck help and the brief\'s speck panel row name --background and --stop', () => {
  const help = speckIn(ROOT, 'help').stdout;
  const line = help.split('\n').findIndex(l => l.startsWith('  speck panel'));
  const panelHelp = help.split('\n').slice(line, line + 2).join('\n');
  assert.match(panelHelp, /--background/);
  assert.match(panelHelp, /--stop/);
  const row = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8').split('\n').find(l => l.startsWith('| `speck panel'));
  assert.match(row, /--background/);
  assert.match(row, /--stop/);
  assert.match(row, /speck\/\.cache\/panel\.log/);
});
