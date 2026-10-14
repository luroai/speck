import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { hasStopped, portClosed, STOP_MS } from './support/stopped.mjs';
import { alive, killAll } from './support/run.mjs';
import { freePort } from './support/panel.mjs';

// ---------- 0173: tests that check a stopped process has gone give it a moment to exit ----------

const TEST = path.dirname(fileURLToPath(import.meta.url));
const src = f => fs.readFileSync(path.join(TEST, f), 'utf8');
// The body of the test named `name` in `file`: from its name to the next test.
function body(file, name) {
  const s = src(file);
  const at = s.indexOf(`test('${name}'`);
  assert.ok(at >= 0, `${file} has the test "${name}"`);
  const next = s.indexOf('\ntest(', at + 1);
  return s.slice(at, next < 0 ? s.length : next);
}
const ticket = () => {
  const dir = path.join(TEST, '..', 'speck', 'tickets');
  const all = [dir, path.join(dir, 'done')].flatMap(d => fs.existsSync(d) ? fs.readdirSync(d).map(f => path.join(d, f)) : []);
  return fs.readFileSync(all.find(f => path.basename(f).startsWith('0173-')), 'utf8');
};

test('0173 AC1: the 0128 AC3 off-and-on-again test waits for the stopped speck run to exit', () => {
  const b = body('panel-0128.test.mjs', '0128 AC3: a speck run started from the panel can be turned off from it, and turned on again');
  assert.match(b, /assert\.ok\(await hasStopped\(\(\) => !alive\(pid\)\), 'speck run has stopped'\)/);
  assert.doesNotMatch(b, /assert\.equal\(alive\(pid\), false/);
});

test('0173 AC1: the 0148 AC2 Auto-build switch test waits for the stopped speck run to exit', () => {
  const b = body('panel-0148.test.mjs', '0148 AC2: the Auto-build switch turns speck run on and off from the --url page');
  assert.match(b, /assert\.ok\(await hasStopped\(\(\) => !alive\(pid\)\), 'speck run has stopped'\)/);
  assert.doesNotMatch(b, /assert\.equal\(alive\(pid\), false/);
});

test('0173 AC1: the wait lasts up to 10 seconds', () => {
  assert.equal(STOP_MS, 10000);
});

test('0173 AC1: a process that takes a moment to exit after it is stopped counts as stopped', async () => {
  // It takes a second to exit once stopped, as a process on a busy machine might.
  const child = spawn(process.execPath, ['-e', 'process.on("SIGTERM", () => setTimeout(() => process.exit(0), 1000)); console.log("ready"); setInterval(() => {}, 1000)'], { stdio: ['ignore', 'pipe', 'ignore'] });
  try {
    await new Promise(r => child.stdout.once('data', r));
    child.kill('SIGTERM');
    assert.equal(alive(child.pid), true, 'still running straight after it was stopped');
    assert.equal(await hasStopped(() => !alive(child.pid)), true);
  } finally { killAll([child.pid]); }
});

// The checks that look once, straight after stopping a process or after a fixed pause.
const ONCE = [
  [/assert\.equal\(alive\([^;]*\), false/, 'assert.equal(alive(…), false)'],
  [/assert\.ok\(!alive\(/, 'assert.ok(!alive(…))'],
  [/assert\.ok\(gone\(/, 'assert.ok(gone(…))'],
  [/await assert\.rejects\(request\(port\)/, 'await assert.rejects(request(port))'],
  [/within\(3000, \(\) => kids\.every/, 'within(3000, … every child to stop)'],
];
// Not a process the test stopped: spawnSync has already waited for it to exit, so one check is enough.
const EXEMPT = ['run-0047.test.mjs:  assert.ok(!alive(dead));'];

test('0173 AC2: no test in test/ checks once that a process it stopped has gone', () => {
  const found = [];
  for (const f of fs.readdirSync(TEST).filter(f => f.endsWith('.mjs') && f !== 'stopped-0173.test.mjs')) {
    src(f).split('\n').forEach((line, i) => {
      if (EXEMPT.includes(`${f}:${line}`)) return;
      for (const [re, what] of ONCE) if (re.test(line)) found.push(`${f}:${i + 1} ${what}`);
    });
  }
  assert.deepEqual(found, []);
});

test('0173 AC2: the ticket\'s Notes list the tests changed', () => {
  const notes = ticket().split('## Notes')[1].split('\n## ')[0];
  const changed = notes.split('\n').find(l => /^- Tests changed:/.test(l));
  assert.ok(changed, 'a "Tests changed:" line');
  for (const name of ['0128 AC3', '0148 AC2', 'Stop build works from the --url page', '0067 AC5', '0073 AC2', '0072 AC1', '0072 AC3', '0152 AC1', '0152 AC3'])
    assert.ok(changed.includes(name), `names ${name}`);
});

test('0173 AC3: a process still running when the time is up fails the check', async () => {
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
  try {
    const t0 = Date.now();
    assert.equal(await hasStopped(() => !alive(child.pid), 400), false);
    assert.ok(Date.now() - t0 >= 400, 'it waited the whole time');
  } finally { killAll([child.pid]); }
});

test('0173 AC3 (round 1 F1): a check still running when the time is up fails, within the time', async () => {
  const t0 = Date.now();
  // It would say stopped after 600 ms, too late for a 200 ms limit.
  assert.equal(await hasStopped(() => new Promise(r => setTimeout(() => r(true), 600)), 200), false);
  assert.ok(Date.now() - t0 < 500, `it gave up at the limit (${Date.now() - t0} ms)`);
});

test('0173 AC3 (round 1 F1): a server that accepts connections but never answers has not stopped', async () => {
  const sockets = [];
  const server = net.createServer(s => sockets.push(s)); // accepts, never answers
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  try {
    const t0 = Date.now();
    assert.equal(await hasStopped(portClosed(port), 1500), false);
    assert.ok(Date.now() - t0 < 2500, `it gave up at the limit (${Date.now() - t0} ms)`);
  } finally { for (const s of sockets) s.destroy(); server.close(); }
});

test('0173 AC3 (round 1 F1): a port nothing listens on counts as closed', async () => {
  assert.equal(await hasStopped(portClosed(await freePort()), 1000), true);
});

test('0173 AC3: the changed checks still say which process did not stop', () => {
  const says = [
    ['panel-0128.test.mjs', /hasStopped\([^\n]*\), 'speck run has stopped'\)/],
    ['panel-0148.test.mjs', /hasStopped\([^\n]*\), 'speck run has stopped'\)/],
    ['panel-0148.test.mjs', /hasStopped\([^\n]*\), 'the build has stopped'\)/],
    ['panel-0073.test.mjs', /hasStopped\([^\n]*\), 'the build is no longer running'\)/],
    ['panel-0073.test.mjs', /hasStopped\([^\n]*\), 'nor is the process it started'\)/],
    ['panel-0067.test.mjs', /hasStopped\([^\n]*\), 'the port is closed'\)/],
    ['stop-0072.test.mjs', /hasStopped\([^\n]*\), `process \$\{p\} is no longer running/],
    ['stop-0072.test.mjs', /hasStopped\([^\n]*\), `the stubborn process is no longer running/],
    ['stall-0152.test.mjs', /hasStopped\([^\n]*\), 'the background process the tests started was ended too'\)/],
  ];
  for (const [f, re] of says) assert.match(src(f), re, f);
});
