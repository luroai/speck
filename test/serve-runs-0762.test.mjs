// 0762: speck serve's run keeper over a project turned off and on again, with stood-in runs, as 0758's tests check it.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runKeeper, runsIn } from '../scripts/serve-runs.mjs';

const tmp = prefix => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
const tick = () => new Promise(r => setImmediate(r));
const project = name => { const dir = path.join(tmp('speck-0762-'), name); fs.mkdirSync(runsIn(dir), { recursive: true }); return dir; };

// A keeper over stood-in runs of a project on a speck from before 0758, whose panel doesn't record its switch: `on`
// holds the folders whose run is on, and each start is recorded and turns it on.
function keeper(file) {
  const on = new Set(), started = [], said = [];
  const k = runKeeper({
    file, env: {}, say: t => said.push(t), records: () => false, boot: () => 'boot-a',
    stop: async () => true,
    state: runs => ({ on: on.has(path.dirname(path.dirname(path.dirname(runs)))), pid: 1 }),
    start: async folder => { started.push(folder); on.add(folder); return { pid: 4242 }; },
  });
  return { k, on, started, said };
}

test('0762 AC2, AC4: on an older speck, a run that ends by itself while its project is off is started again only once it\'s turned on', async () => {
  const dir = tmp('speck-0762-keeper-'), a = project('alpha');
  const { k, on, started, said } = keeper(path.join(dir, 'serve-runs.json'));
  on.add(a);
  k.check([a]); // seen on
  k.check([], [a]); // turned off
  on.delete(a); // its run ends by itself, without saying it stopped as it was told to
  k.check([], [a]);
  await tick();
  assert.deepEqual(started, [], 'not started while it\'s off');
  k.check([a]); // turned on
  await tick();
  assert.deepEqual(started, [a], 'started once it\'s on');
  assert.ok(said.some(t => /alpha: started speck run \(process 4242\), as it was on when the project was turned off\./.test(t)), said.join('\n'));
});

test('0762 AC4: on an older speck, a run turned off while its project is off stays off once it\'s turned on', async () => {
  const dir = tmp('speck-0762-keeper-'), a = project('alpha');
  const { k, on, started } = keeper(path.join(dir, 'serve-runs.json'));
  on.add(a);
  k.check([a]);
  k.check([], [a]);
  on.delete(a);
  fs.appendFileSync(path.join(runsIn(a), 'run.log'), 'speck run stopped.\n'); // as the switch or Ctrl+C stops it
  k.check([a]);
  await tick();
  assert.deepEqual(started, []);
});

test('0762 AC4: a project taken off the list, rather than turned off, is still forgotten', async () => {
  const dir = tmp('speck-0762-keeper-'), a = project('alpha');
  const { k, on, started } = keeper(path.join(dir, 'serve-runs.json'));
  on.add(a);
  k.check([a]);
  k.check([]);
  on.delete(a);
  k.check([a]);
  await tick();
  assert.deepEqual(started, [], 'looked at afresh, as one just added');
});
