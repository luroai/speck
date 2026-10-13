import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, cliCopy, freePort, startPanel, stop, request, ROOT } from './support/panel.mjs';

// ---------- 0018: the panel and the build controls in their own modules ----------

const SCRIPTS = path.join(ROOT, 'scripts');
const read = name => fs.readFileSync(path.join(SCRIPTS, name), 'utf8');
const defines = (src, name) => new RegExp(`^(?:export )?(?:async )?function ${name}\\(`, 'm').test(src);
const wait = ms => new Promise(r => setTimeout(r, ms));
async function within(ms, check, what) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { if (await check()) return; } catch { /* not answering yet */ }
    await wait(100);
  }
  throw new Error(`not within ${ms} ms: ${what}`);
}

const PANEL = ['cmdPanel', 'startPanelServer', 'panelServer', 'panelSetReady', 'panelSetPriority', 'panelStop', 'panelLog', 'panelCode'];
const RUN = ['cmdRun', 'cmdPause', 'cmdPlay', 'cmdStop', 'takeRunLock', 'pauseBuild', 'playBuild', 'stopBuild'];

test('0018 AC1: the panel is in scripts/panel.mjs, run, pause, play and stop in scripts/run.mjs, and speck.mjs is 600 lines shorter', () => {
  const speck = read('speck.mjs'), panel = read('panel.mjs'), run = read('run.mjs');
  for (const name of PANEL) {
    assert.ok(defines(panel, name), `panel.mjs defines ${name}`);
    assert.ok(!defines(speck, name) && !defines(run, name), `${name} is only in panel.mjs`);
  }
  for (const name of RUN) {
    assert.ok(defines(run, name), `run.mjs defines ${name}`);
    assert.ok(!defines(speck, name) && !defines(panel, name), `${name} is only in run.mjs`);
  }
  assert.ok(/^const COMMANDS = /m.test(speck) && /process\.argv\[1\]/.test(speck), 'speck.mjs keeps the entry point');
  assert.ok(speck.split('\n').length <= 2769 - 600, `speck.mjs has ${speck.split('\n').length} lines`);
});

test('0018 AC2: every name speck.mjs exported before can still be imported from it', async () => {
  const m = await import('../scripts/speck.mjs');
  for (const name of ['changedLines', 'commandArgs', 'doctorChecks', 'installTooling', 'lintTicket', 'nextAction', 'nextId', 'panelServer',
    'parseTicket', 'parseYaml', 'pathsOutside', 'readableLog', 'reviewPack', 'reviewerSettings', 'setField', 'shipTicket', 'splitCommand',
    'statusData', 'stripRounds', 'syncHeader', 'ticketHeader', 'ticketRounds', 'ticketedStatus', 'validateVerdict', 'verdictFromOutput'])
    assert.equal(typeof m[name], 'function', name);
});

test('0018 AC3: the moved commands give the same output and exit code as before', () => {
  const r = panelRepo();
  const cases = [
    [['pause'], 'Usage: speck pause <id>\n'],
    [['play'], 'Usage: speck play <id>\n'],
    [['stop'], 'Usage: speck stop <id>\n'],
    [['pause', '1'], "0001 has no running build launched by speck run, so there's nothing to pause.\n"],
    [['play', '1'], "0001 isn't paused, so there's nothing to play.\n"],
    [['stop', '1'], "0001 has no running or paused build launched by speck run, so there's nothing to stop.\n"],
    [['stop', '9'], 'Ticket 0009 not found in speck/tickets/ or speck/tickets/done/.\n'],
    [['panel', '--port', 'x'], '--port must be a whole number from 1 to 65535 (got "x").\n'],
  ];
  for (const [args, stderr] of cases) {
    const res = r.run(...args);
    assert.deepEqual([res.status, res.stdout, res.stderr], [1, '', stderr], args.join(' '));
  }
  const help = r.run('help');
  assert.equal(help.status, 0);
  assert.match(help.stdout, /speck panel \[--port <n>\]/);
  assert.match(help.stdout, /speck stop <id> +end a build speck run launched for good/);
});

test('0018 AC4: a change to panel.mjs or run.mjs makes a running panel hand over to the new code', async () => {
  const r = panelRepo();
  const c = cliCopy();
  const dir = path.dirname(c.cli);
  for (const name of ['panel.mjs', 'run.mjs']) assert.ok(fs.existsSync(path.join(dir, name)), `the copy has ${name}`);
  const p = await startPanel(r.dir, ['--port', String(await freePort())], c.cli);
  const { port } = p;
  const restarts = () => (p.out().match(/restarted with the new code/g) || []).length;
  try {
    const panelFile = path.join(dir, 'panel.mjs');
    fs.writeFileSync(panelFile, fs.readFileSync(panelFile, 'utf8')
      .replace("'X-Content-Type-Options': 'nosniff',", "'X-Content-Type-Options': 'nosniff', 'X-Speck-0018': 'panel',"));
    await within(5000, async () => (await request(port)).headers['x-speck-0018'] === 'panel', 'the changed panel.mjs served');
    assert.equal(restarts(), 1);
    const runFile = path.join(dir, 'run.mjs');
    fs.appendFileSync(runFile, '\n// 0018: a change to run.mjs\n');
    await within(5000, async () => restarts() === 2, 'a restart for run.mjs');
    assert.equal((await request(port)).status, 200);
  } finally { await stop(p); }
});

test('0018 AC5: speck init installs the new modules, and the panel serves its page from .speck/scripts/speck.mjs', async () => {
  const r = panelRepo();
  for (const name of ['speck.mjs', 'panel.mjs', 'run.mjs']) assert.ok(fs.existsSync(path.join(r.dir, '.speck', 'scripts', name)), name);
  const p = await startPanel(r.dir, ['--port', String(await freePort())], path.join(r.dir, '.speck', 'scripts', 'speck.mjs'));
  const { port } = p;
  try {
    const res = await request(port);
    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/html/);
    assert.equal((await request(port, { pathName: '/api/state' })).status, 200);
  } finally { await stop(p); }
});
