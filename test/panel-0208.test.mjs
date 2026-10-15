import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0208: a ticket changed in a new build worktree reaches the panel at once, however its making and the panel's watches
// interleave.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { panelRepo, startPanel, stop, freePort, env } from './support/panel.mjs';
import { openStream, stateFor, wait } from './support/stream.mjs';
import { boardWatcher } from '../scripts/board-feed.mjs';

const runs = r => path.join(r.dir, 'speck', '.cache', 'runs');
const watcher = (r, calls) => boardWatcher(fs.realpathSync(r.dir), runs(r), () => calls.push(Date.now()));
// Resolves once `calls` has grown past `from`, or fails after `ms`.
async function called(calls, from, ms = 1000, what = 'the change') {
  const t0 = Date.now();
  while (calls.length <= from) {
    if (Date.now() - t0 > ms) assert.fail(`${what} wasn't seen within ${ms} ms`);
    await wait(10);
  }
}
const ticketIn = (r, wt) => path.join(wt, path.relative(r.dir, r.file));
const setStatus = (file, to) => fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/^status: \w+/m, `status: ${to}`));

// Makes worktree `wt` on a new branch the way `git worktree add` does, one step at a time, with `between` awaited after
// each: its folder in git's list of worktrees (with a `locked` file), then the worktree's folder and the files that
// tie the two together, then its files checked out, then `locked` removed.
async function stepwiseWorktree(r, wt, between) {
  const name = path.basename(wt), meta = path.join(r.dir, '.git', 'worktrees', name), branch = `speck/0001-${name}`;
  r.g('branch', branch);
  fs.mkdirSync(meta, { recursive: true });
  fs.writeFileSync(path.join(meta, 'locked'), 'initializing\n');
  await between('its record');
  fs.mkdirSync(wt);
  fs.writeFileSync(path.join(meta, 'gitdir'), `${fs.realpathSync(wt)}/.git\n`);
  fs.writeFileSync(path.join(wt, '.git'), `gitdir: ${fs.realpathSync(meta)}\n`);
  fs.writeFileSync(path.join(meta, 'commondir'), '../..\n');
  fs.writeFileSync(path.join(meta, 'HEAD'), `ref: refs/heads/${branch}\n`);
  await between('its folder');
  assert.equal(spawnSync('git', ['reset', '-q', '--hard'], { cwd: wt, env }).status, 0);
  await between('its files');
  fs.unlinkSync(path.join(meta, 'locked'));
  await between('its record unlocked');
}

// ---------- AC1: a new worktree's first ticket change reaches the panel within a second ----------

for (const first of [true, false]) {
  test(`0208 AC1: a ticket changed in a worktree made while the panel looks at each step is seen within 1 second (${first ? 'the first worktree' : 'with another already there'})`, async () => {
    const r = panelRepo();
    const other = `${r.dir}-wt-other`;
    if (!first) r.g('worktree', 'add', '-q', '-b', 'speck/0002-other', other);
    const calls = [], files = watcher(r, calls);
    const wt = `${r.dir}-wt-new`;
    try {
      // Each step is looked at before the next is made, as a panel under load can.
      await stepwiseWorktree(r, wt, () => wait(150));
      const from = calls.length;
      setStatus(ticketIn(r, wt), 'building');
      await called(calls, from, 1000, 'the status in the new worktree');
    } finally { files.close(); fs.rmSync(wt, { recursive: true, force: true }); fs.rmSync(other, { recursive: true, force: true }); }
  });
}

test('0208 AC1: a worktree whose gitdir file is written after the panel listed the worktrees but before it looked for that file is seen within 1 second', async () => {
  const r = panelRepo();
  fs.mkdirSync(path.join(r.dir, '.git', 'worktrees')); // already watched, as once a build has run, so its look starts no watch
  const calls = [], files = watcher(r, calls);
  const wt = `${r.dir}-wt-gap`, name = path.basename(wt), meta = path.join(r.dir, '.git', 'worktrees', name), branch = 'speck/0001-gap';
  r.g('branch', branch);
  // git writes the file that lists the worktree just as the panel looks for it, after the panel listed the worktrees.
  const real = fs.existsSync, tied = {};
  fs.existsSync = p => {
    if (!tied.done && p === path.join(fs.realpathSync(meta), 'gitdir')) {
      tied.done = true;
      fs.writeFileSync(path.join(meta, 'gitdir'), `${fs.realpathSync(wt)}/.git\n`);
      fs.writeFileSync(path.join(wt, '.git'), `gitdir: ${fs.realpathSync(meta)}\n`);
      fs.writeFileSync(path.join(meta, 'commondir'), '../..\n');
      fs.writeFileSync(path.join(meta, 'HEAD'), `ref: refs/heads/${branch}\n`);
    }
    return real(p);
  };
  try {
    try {
      fs.mkdirSync(meta, { recursive: true });
      fs.writeFileSync(path.join(meta, 'locked'), 'initializing\n');
      fs.mkdirSync(wt);
      await wait(200); // the panel looks, on its record's folder appearing
    } finally { fs.existsSync = real; }
    assert.ok(tied.done, 'the panel looked for the file');
    assert.equal(spawnSync('git', ['reset', '-q', '--hard'], { cwd: wt, env }).status, 0);
    fs.unlinkSync(path.join(meta, 'locked'));
    await wait(150);
    const from = calls.length;
    setStatus(ticketIn(r, wt), 'building');
    await called(calls, from, 1000, 'the status in the new worktree');
  } finally { files.close(); fs.rmSync(wt, { recursive: true, force: true }); }
});

// A watch on the files the board is read from that, as the watch on `wt`'s speck/ folder starts, makes its tickets
// folder with a ticket in it: after the watcher checked for that folder, so that folder's watch can't see it appear.
function raceWatch(wt) {
  fs.rmSync(path.join(wt, 'speck', 'tickets'), { recursive: true, force: true });
  const real = fs.watch, made = {};
  fs.watch = (dir, opts, fn) => {
    if (dir === path.join(wt, 'speck') && opts && opts.recursive === false && !made.done) {
      made.done = true;
      fs.mkdirSync(path.join(wt, 'speck', 'tickets'));
      fs.writeFileSync(path.join(wt, 'speck', 'tickets', '0001-x.md'), 'status: building\n');
    }
    return real(dir, opts, fn);
  };
  return { made, put: () => { fs.watch = real; } };
}

test('0208 AC1: a worktree\'s tickets folder that appears while the panel is starting its watches is read at once, and a later change in it seen', async () => {
  const r = panelRepo();
  const calls = [], files = watcher(r, calls);
  const wt = fs.realpathSync(path.dirname(r.dir)) + `/${path.basename(r.dir)}-wt-race`;
  try {
    r.g('worktree', 'add', '-q', '-b', 'speck/0001-race', wt);
    const race = raceWatch(wt);
    const from = calls.length;
    try { files.sync(); } finally { race.put(); } // the keep-alive's look, before the worktree's events are handled
    assert.ok(race.made.done, 'the folder appeared as the watch started');
    assert.ok(calls.length > from, 'the board is read again, for the ticket written before its watch started');
    await wait(200);
    const later = calls.length;
    fs.writeFileSync(path.join(wt, 'speck', 'tickets', '0001-x.md'), 'status: reviewing\n');
    await called(calls, later, 1000, 'the change in the folder');
  } finally { files.close(); fs.rmSync(wt, { recursive: true, force: true }); }
});

test('0208 AC1: in the panel, a ticket changed as soon as its new worktree is checked out reaches every open page within 1 second', async () => {
  const r = panelRepo({ worktrees: 'true' });
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  const streams = [openStream(p.port), openStream(p.port)];
  const wt = `${r.dir}-wt-0001`, file = ticketIn(r, wt);
  try {
    await Promise.all(streams.map(s => s.until(e => e.event === 'message', 5000)));
    const from = streams.map(s => s.events.length);
    const git = spawn('git', ['worktree', 'add', '-q', '-b', 'speck/0001-export-bookings', wt], { cwd: r.dir, env, stdio: 'ignore' });
    const done = new Promise(resolve => git.on('exit', resolve));
    for (const t0 = Date.now(); !fs.existsSync(file); await wait(2)) if (Date.now() - t0 > 5000) assert.fail('the worktree was never checked out');
    await wait(5); // the ticket is there, as `speck start` finds it, and is written straight away
    setStatus(file, 'building');
    const t0 = Date.now();
    await Promise.all(streams.map(async (s, i) => {
      for (let at = from[i]; ;) {
        const e = await s.until(e => e.event === 'message', Math.max(1000 - (Date.now() - t0), 1), at, 'the status in the new worktree');
        at = s.events.indexOf(e) + 1;
        const board = (await stateFor(p.port, e.data)).body;
        if (board.tickets.find(t => t.id === '0001').status === 'building') return;
      }
    }));
    assert.equal(await done, 0);
  } finally { for (const s of streams) s.close(); await stop(p); fs.rmSync(wt, { recursive: true, force: true }); }
});

// ---------- AC2: new watches are followed by one reading of the board ----------

test('0208 AC2: a look that starts new watches asks for the board to be read once, and one that starts none doesn\'t', () => {
  const r = panelRepo();
  const calls = [], files = watcher(r, calls);
  const wt = `${r.dir}-wt-ac2`;
  try {
    assert.equal(calls.length, 0, 'starting the watcher reads nothing: the panel reads the board as it starts');
    r.g('worktree', 'add', '-q', '-b', 'speck/0001-ac2', wt); // its events wait until this test yields
    files.sync();
    assert.equal(calls.length, 1, 'the worktree is watched, and the board read again once');
    files.sync();
    assert.equal(calls.length, 1, 'nothing new to watch: no reading');
  } finally { files.close(); fs.rmSync(wt, { recursive: true, force: true }); }
});

// ---------- AC3: worktrees that were already there ----------

test('0208 AC3: a ticket changed in a worktree that was there before the panel started, or in the main checkout, is seen within 1 second', async () => {
  const r = panelRepo();
  const wt = `${r.dir}-wt-old`;
  r.g('worktree', 'add', '-q', '-b', 'speck/0001-old', wt);
  const calls = [], files = watcher(r, calls);
  try {
    await wait(100);
    let from = calls.length;
    setStatus(ticketIn(r, wt), 'building');
    await called(calls, from, 1000, 'the status in the worktree');
    await wait(100);
    from = calls.length;
    setStatus(r.file, 'blocked');
    await called(calls, from, 1000, 'the status in the main checkout');
  } finally { files.close(); fs.rmSync(wt, { recursive: true, force: true }); }
});
