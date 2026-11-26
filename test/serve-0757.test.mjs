import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0757: `speck serve [--port <n>] [--url https://<hostname>]` answers at one address that opens on All projects. These
// run speck serve itself, with each project's own speck a stand-in panel (support/stand-in-panel.mjs), as 0756's do.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { speck } from './support/cli.mjs';
import { ROOT, machine, standInProject, addProject, startServe, serveOnce, until, portOf, readJson, panelRecords, endServe, freePortNow } from './support/serve.mjs';
import { ask, cookieOf } from './support/serve-front.mjs';

const URL_HOST = 'speck.example.ts.net', URL_ORIGIN = `https://${URL_HOST}`;
const isAllProjects = body => /<meta name="speck-serve" id="speck-serve" content="1">/.test(body);
// Whether anything answers HTTP on 127.0.0.1:<port>.
const answers = port => new Promise(resolve => {
  const req = http.get({ host: '127.0.0.1', port, path: '/', timeout: 2000 }, res => { res.resume(); resolve(true); });
  req.on('timeout', () => req.destroy());
  req.on('error', () => resolve(false));
});

test('0757 AC1 AC2: speck serve --port --url answers there, opening on All projects with every project on the list, and shows a chosen one\'s own panel', async () => {
  const m = machine(), a = standInProject('alpha'), b = standInProject('bravo');
  addProject(m, a); addProject(m, b);
  const port = freePortNow(), local = `http://127.0.0.1:${port}`;
  const s = startServe(m, ['--port', String(port), '--url', URL_ORIGIN]);
  try {
    await until('its address said', () => s.out().includes(`speck serve: All projects: ${local}/ and ${URL_ORIGIN}/`));
    const record = readJson(m.record);
    assert.equal(record.port, port, 'its record says where it answers');
    assert.equal(record.url, URL_ORIGIN);
    for (const host of [`127.0.0.1:${port}`, `localhost:${port}`, URL_HOST]) assert.ok(isAllProjects((await ask(port, { host })).body), `All projects at ${host}`);
    assert.equal((await ask(port, { host: `evil.example:${port}` })).status, 403);
    const pa = await until('alpha started', () => portOf(s.out(), 'alpha')), pb = await until('bravo started', () => portOf(s.out(), 'bravo'));
    const listed = await until('both projects answering', async () => {
      const r = await ask(port, { method: 'POST', pathName: '/api/projects/summary', origin: local });
      const got = r.status === 200 && JSON.parse(r.body).projects;
      return got && got.length === 2 && got.every(p => p.running) && got;
    });
    assert.deepEqual(listed.map(p => [p.name, p.port]), [['alpha', pa], ['bravo', pb]]);
    // Chosen through the https address, as from a phone behind the tunnel.
    const chose = await ask(port, { method: 'POST', pathName: `/api/projects/${pb}`, host: URL_HOST, origin: URL_ORIGIN });
    assert.equal(chose.status, 200, chose.body);
    const cookie = cookieOf(chose);
    assert.match((await ask(port, { host: URL_HOST, cookie })).body, /The panel of bravo\./, 'bravo\'s own panel, at the same address');
    assert.equal(JSON.parse((await ask(port, { pathName: '/api/panel', host: URL_HOST, cookie })).body).repo, b);
    assert.ok(isAllProjects((await ask(port, { host: URL_HOST })).body), 'and All projects in a browser that hasn\'t chosen');
  } finally { await endServe(s); }
  assert.equal(await answers(port), false, 'nothing answers there once it has stopped');
});

test('0757 AC1: a speck serve whose port is taken says so, starts nothing and gives back the record it found', async () => {
  const m = machine(), a = standInProject('alpha');
  addProject(m, a);
  const busy = http.createServer((req, res) => res.end('mine'));
  await new Promise(r => busy.listen(0, '127.0.0.1', r));
  try {
    const taken = busy.address().port;
    const r = serveOnce(m, '--port', String(taken));
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stderr, new RegExp(`Port ${taken} is already in use, so speck serve didn't start\\. Stop whatever is using it, or give speck serve another port with --port <n>\\.`));
    assert.equal(fs.existsSync(m.record), false, 'no record left behind');
    assert.deepEqual(panelRecords(m, a), [], 'and no panel started');
    // A speck serve that was killed left its panels and record: one that can't take its port puts that record back,
    // so the next one still looks after those panels.
    const first = startServe(m);
    const pa = await until('alpha started', () => portOf(first.out(), 'alpha'));
    first.child.kill('SIGKILL');
    await until('the first speck serve ending', () => first.child.exitCode !== null || first.child.signalCode !== null);
    const was = readJson(m.record);
    assert.equal(serveOnce(m, '--port', String(taken)).status, 1);
    assert.deepEqual(readJson(m.record), was, 'its record, as it was');
    const next = startServe(m);
    try {
      await until('the next one taking alpha\'s panel over', () => /alpha: http:\/\/127\.0\.0\.1:\d+\/ \(started by the last speck serve, looked after again\)/.test(next.out()));
      assert.equal(portOf(next.out(), 'alpha'), pa);
    } finally { await endServe(next); }
  } finally { busy.close(); }
});

test('0757 AC1: --port and --url are checked before anything starts, and --stop takes neither', () => {
  const m = machine();
  for (const [args, said] of [
    [['--port', 'abc'], /--port must be a whole number from 1 to 65535 \(got "abc"\)/],
    [['--port'], /--port must be a whole number from 1 to 65535 \(got ""\)/],
    [['--url', 'http://speck.example.ts.net'], /--url must be an https:\/\/ address with only a hostname/],
    [['--url', URL_ORIGIN, '--url', URL_ORIGIN], /Give --url once/],
    [['--background', '--port', '0'], /--port must be a whole number from 1 to 65535 \(got "0"\)/],
    [['--stop', '--port', '4801'], /speck serve --stop stops the speck serve running on this machine, wherever it answers, so it doesn't take --port or --url\./],
    [['--stop', `--url=${URL_ORIGIN}`], /doesn't take --port or --url/],
    [['--port', '4801', '--bogus'], /speck serve doesn't take --bogus/],
  ]) {
    const r = serveOnce(m, ...args);
    assert.equal(r.status, 1, `${args.join(' ')}: ${r.stdout}${r.stderr}`);
    assert.match(r.stderr, said, args.join(' '));
  }
  assert.equal(fs.existsSync(m.record), false, 'nothing started');
});

test('0757 AC1: a second speck serve says where the first one answers', async () => {
  const m = machine(), port = freePortNow();
  const s = startServe(m, ['--port', String(port)]);
  try {
    await until('the first answering', () => s.out().includes(`All projects: http://127.0.0.1:${port}/`));
    const second = serveOnce(m);
    assert.equal(second.status, 1, second.stdout + second.stderr);
    assert.match(second.stderr, new RegExp(`speck serve is already running on this machine \\(process ${s.child.pid}\\), since [^,]+, at http://127\\.0\\.0\\.1:${port}/\\. Stop it with speck serve --stop`));
  } finally { await endServe(s); }
});

test('0757 AC1: speck serve --background answers at the address given, and --stop closes it', async () => {
  const m = machine(), port = freePortNow();
  try {
    const r = serveOnce(m, '--background', '--port', String(port), '--url', URL_ORIGIN);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, new RegExp(`speck serve: All projects: http://127\\.0\\.0\\.1:${port}/ and ${URL_ORIGIN.replace(/\./g, '\\.')}/`));
    assert.ok(isAllProjects((await ask(port, { host: URL_HOST })).body));
    assert.match(serveOnce(m, '--background').stdout, new RegExp(`already running on this machine \\(process \\d+\\), since [^,]+, at http://127\\.0\\.0\\.1:${port}/ and ${URL_ORIGIN.replace(/\./g, '\\.')}/`));
    const stop = serveOnce(m, '--stop');
    assert.equal(stop.status, 0, stop.stdout + stop.stderr);
    assert.equal(await answers(port), false, 'its address has gone with it');
  } finally { serveOnce(m, '--stop'); }
});

test('0757 AC5: the brief and speck help describe speck serve\'s --port and --url, its address and that it opens on All projects', () => {
  const row = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8').split('\n').find(l => l.startsWith('| `speck serve'));
  assert.ok(row, 'the command table has a row for speck serve');
  for (const fact of ['`speck serve [--port <n>] [--url https://<hostname>] [--background]`', '`http://127.0.0.1:4777`', 'All projects']) assert.ok(row.includes(fact), `its row has ${fact}`);
  const lines = speck(os.tmpdir(), process.env, 'help').stdout.split('\n'), at = lines.findIndex(l => l.startsWith('  speck serve'));
  const help = lines.slice(at, at + lines.slice(at + 1).findIndex(l => /^ {2}speck /.test(l)) + 1).join('\n');
  for (const fact of ['--port <n>', '--url https://<hostname>', 'http://127.0.0.1:4777', 'All projects']) assert.ok(help.includes(fact), `speck help has ${fact}: ${help}`);
});
