import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRunOn } from '../scripts/panel.mjs';
import { runRepo, until, killAll } from './support/run.mjs';
import { keptFile } from './support/copy.mjs';

// ---------- 0220: a refusal to turn speck run on shows only what the refusing speck run said ----------

const runsOf = dir => path.join(dir, 'speck', '.cache', 'runs');
const logOf = dir => path.join(runsOf(dir), 'run.log');
// Only run.log and the lock: nothing the panel made to hear the refusal is left behind.
const leftovers = dir => fs.readdirSync(runsOf(dir)).filter(f => !['run.log', 'run.lock'].includes(f) && !/^\d{4}\.(json|log)$/.test(f));

test('0220 AC1 AC2: a refusal shows only the refusing speck run\'s own words, in its own wording, even when another speck run writes to run.log meanwhile', async () => {
  const r = runRepo({ tickets: [] });
  fs.mkdirSync(runsOf(r.dir), { recursive: true });
  // Another speck run holds the lock: this process, which is alive.
  fs.writeFileSync(path.join(runsOf(r.dir), 'run.lock'), String(process.pid));
  fs.writeFileSync(logOf(r.dir), 'speck run: watching for ready tickets every 5s, up to 1 build at a time. Press Ctrl+C to stop.\n');
  const on = panelRunOn(r.dir);
  // The other speck run writes a line just after the click, before this one has refused.
  fs.appendFileSync(logOf(r.dir), 'Launched 0012 (session 1234).\n');
  const res = await on;
  assert.equal(res.status, 409, JSON.stringify(res.body));
  assert.equal(res.body.error, `speck run is already running in this repo (process ${process.pid}). Stop that one first, or leave it running. If it isn't speck run, delete ${path.join('speck', '.cache', 'runs', 'run.lock')}.`);
  // It still wrote its refusal to run.log, as today.
  const log = fs.readFileSync(logOf(r.dir), 'utf8');
  assert.match(log, /Launched 0012/);
  assert.match(log, /speck run is already running in this repo/);
  assert.deepEqual(leftovers(r.dir), []);
});

test('0220 AC1: any other refusal, such as a build_command with a quote that isn\'t closed, also shows only its own words', async () => {
  const r = runRepo({ tickets: [] });
  fs.writeFileSync(r.cfgFile, `${fs.readFileSync(r.cfgFile, 'utf8')}\nbuild_command: 'node "unclosed {id}'\n`);
  fs.mkdirSync(runsOf(r.dir), { recursive: true });
  const on = panelRunOn(r.dir);
  fs.appendFileSync(logOf(r.dir), 'Launched 0012 (session 1234).\n');
  const res = await on;
  assert.equal(res.status, 409, JSON.stringify(res.body));
  assert.doesNotMatch(res.body.error, /Launched 0012/);
  assert.match(res.body.error, /^build_command in speck\/config\.yml has a quote that isn't closed/);
  assert.deepEqual(leftovers(r.dir), []);
});

test('0220 AC3: turning speck run on when it can start works as before, its lines go to run.log, and its builds don\'t get the refusal file', async () => {
  const seen = keptFile('env-build-0220.cjs', `require('fs').writeFileSync(process.argv[2], JSON.stringify(Object.keys(process.env))); setTimeout(() => {}, 60000);\n`);
  const r = runRepo({ command: null });
  const envFile = path.join(r.out, 'env.json');
  fs.writeFileSync(r.cfgFile, `${fs.readFileSync(r.cfgFile, 'utf8')}\nbuild_command: ${JSON.stringify(`"${process.execPath}" "${seen}" "${envFile}" {id} {session}`)}\n`);
  let pid = null;
  try {
    const res = await panelRunOn(r.dir);
    assert.equal(res.status, 200, JSON.stringify(res.body));
    pid = res.body.run.pid;
    assert.equal(res.body.run.on, true);
    assert.match(fs.readFileSync(logOf(r.dir), 'utf8'), /^speck run: watching for ready tickets/m);
    assert.ok(await until(() => fs.existsSync(envFile) && fs.readFileSync(envFile, 'utf8').length > 0), 'the build started');
    assert.ok(await until(() => /Launched 0001/.test(fs.readFileSync(logOf(r.dir), 'utf8'))), 'speck run wrote its launch to run.log');
    assert.deepEqual(JSON.parse(fs.readFileSync(envFile, 'utf8')).filter(k => k.startsWith('SPECK_RUN_REFUSAL')), []);
  } finally {
    if (pid) killAll([pid]);
    try { const rec = JSON.parse(fs.readFileSync(path.join(runsOf(r.dir), '0001.json'), 'utf8')); if (rec.pid) killAll([-rec.pid, rec.pid]); } catch {}
  }
});
