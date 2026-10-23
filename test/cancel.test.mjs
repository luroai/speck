import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { parseTicket, setField } from '../scripts/speck.mjs';
import { CLI, good, gitEnv } from './support/speck.mjs';
import { copied } from './support/copy.mjs';

// A speck repo, or with `title`, a copy of one holding that ticket as add() writes it, with its path as `p`: set up once
// per title, and copied for each call (0429).
const added = new Map();
function cancelRepo(title) {
  const env = { ...process.env, ...gitEnv };
  if (title) {
    const dir = copied('cancel', [title], 'speck-cancel-', d => { added.set(title, cancelRepoIn(d, env).add(title)); });
    return { ...cancelRepoIn(dir, env, false), p: added.get(title) };
  }
  return cancelRepoIn(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-cancel-')), env);
}
function cancelRepoIn(dir, env, setUp = true) {
  const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env });
  // The same, without blocking the file's other work while it runs (0429).
  const runAsync = (...a) => new Promise(resolve => {
    const c = spawn(process.execPath, [CLI, ...a], { cwd: dir, env });
    let stdout = '', stderr = '';
    c.stdout.setEncoding('utf8').on('data', d => { stdout += d; });
    c.stderr.setEncoding('utf8').on('data', d => { stderr += d; });
    c.on('error', e => { stderr += e.message; });
    c.on('close', status => resolve({ status, stdout, stderr }));
  });
  const at = p => fs.existsSync(path.join(dir, p));
  const read = p => fs.readFileSync(path.join(dir, p), 'utf8');
  const fm = p => parseTicket(read(p)).fm;
  const filed = p => path.join('speck', 'tickets', 'done', path.basename(p));
  if (setUp) {
    spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir, encoding: 'utf8', env });
    assert.equal(run('init', '--skip-checks').status, 0);
  }
  const add = title => {
    const p = run('new', ...title.split(' ')).stdout.trim();
    fs.writeFileSync(path.join(dir, p), read(p).split('## Problem')[0] + good);
    return p;
  };
  return { dir, run, runAsync, add, at, read, fm, filed };
}

test('AC1: speck cancel records the reason and the date, files the ticket under done/ and rewrites the header', () => {
  const r = cancelRepo();
  const live = r.add('Export bookings');
  const res = r.run('cancel', '1', 'Superseded by the new export work');
  assert.equal(res.status, 0, res.stderr);
  assert.equal(r.at(live), false, 'no longer in speck/tickets/');
  assert.equal(r.at(r.filed(live)), true, 'filed away with finished work, under the same name');
  const f = r.fm(r.filed(live));
  assert.equal(f.status, 'cancelled');
  assert.equal(f.cancel_reason, 'Superseded by the new export work', 'the reason is stored');
  assert.match(String(f.cancelled), /^\d{4}-\d{2}-\d{2}$/, 'the date it was cancelled is stored');
  assert.match(r.read(r.filed(live)), /^\*\*Status:\*\* ❌ cancelled$/m, 'the header says so');
});

test('AC1: cancel works from every status except done', () => {
  for (const status of ['draft', 'ready', 'building', 'reviewing', 'blocked', 'approved']) {
    const r = cancelRepo();
    const live = r.add('Export bookings');
    if (status !== 'draft') assert.equal(r.run('set', '1', 'status', status).status, 0, status);
    const res = r.run('cancel', '1', 'Not needed after all');
    assert.equal(res.status, 0, `${status}: ${res.stderr}`);
    assert.equal(r.fm(r.filed(live)).status, 'cancelled', `from ${status}`);
  }
});

test('AC2: cancel refuses a missing or blank reason and changes nothing', () => {
  for (const [name, args] of [['a missing reason', ['cancel', '1']], ['a blank reason', ['cancel', '1', '   ']]]) {
    const r = cancelRepo();
    const live = r.add('Export bookings');
    const before = r.read(live);
    const res = r.run(...args);
    assert.notEqual(res.status, 0, `${name} is refused`);
    assert.match(res.stderr + res.stdout, /reason/i, name);
    assert.equal(r.read(live), before, `${name}: the ticket is untouched`);
    assert.equal(r.at(r.filed(live)), false, `${name}: nothing moved`);
  }
});

test('AC2: cancel refuses a done ticket and an already-cancelled one, and changes nothing', () => {
  const r = cancelRepo();
  const live = r.add('Export bookings');
  assert.equal(r.run('set', '1', 'status', 'done').status, 0);
  const before = r.read(r.filed(live));
  const res = r.run('cancel', '1', 'Changed my mind');
  assert.notEqual(res.status, 0, 'delivered work cannot be cancelled');
  assert.match(res.stderr, /done/i);
  assert.equal(r.read(r.filed(live)), before, 'nothing changed');

  const c = cancelRepo();
  const cancelled = c.add('Export bookings');
  assert.equal(c.run('cancel', '1', 'First reason').status, 0);
  const filed = c.read(c.filed(cancelled));
  const again = c.run('cancel', '1', 'A second reason');
  assert.notEqual(again.status, 0, 'an already-cancelled ticket is refused');
  assert.match(again.stderr + again.stdout, /already cancelled/i);
  assert.equal(c.read(c.filed(cancelled)), filed, 'nothing changed');
});

test('AC3: set status cancelled refuses and points at speck cancel', () => {
  const r = cancelRepo();
  const live = r.add('Export bookings');
  const res = r.run('set', '1', 'status', 'cancelled');
  assert.notEqual(res.status, 0, 'it refuses');
  assert.match(res.stderr, /speck cancel/, 'and points at the command that records a reason');
  assert.equal(r.fm(live).status, 'draft', 'nothing changed');
  assert.equal(r.at(live), true, 'nothing moved');
});

test('AC3: reviving a cancelled ticket moves it back to speck/tickets/ and keeps the reason', () => {
  const r = cancelRepo();
  const live = r.add('Export bookings');
  assert.equal(r.run('cancel', '1', 'Superseded by 0007').status, 0);
  assert.equal(r.run('set', '1', 'status', 'ready').status, 0);
  assert.equal(r.at(live), true, 'back in speck/tickets/');
  assert.equal(r.at(r.filed(live)), false, 'only one copy is left behind');
  assert.equal(r.fm(live).status, 'ready');
  assert.equal(r.fm(live).cancel_reason, 'Superseded by 0007', 'the recorded reason is kept');
});

test('AC4: status lists cancelled tickets in a CANCELLED group after DONE, with the reason below', () => {
  const r = cancelRepo();
  r.add('Export bookings');
  r.add('Old idea');
  assert.equal(r.run('set', '1', 'status', 'done').status, 0);
  assert.equal(r.run('cancel', '2', 'Superseded by 0007').status, 0);
  const out = r.run('status').stdout;
  assert.match(out, /DONE \(1\)/);
  assert.match(out, /CANCELLED \(1\)/);
  assert.ok(out.indexOf('DONE') < out.indexOf('CANCELLED'), 'CANCELLED comes after DONE');
  const lines = out.split('\n');
  const head = lines.findIndex(l => /CANCELLED \(1\)/.test(l));
  assert.match(lines[head + 1], /0002/, 'the ticket follows its group heading');
  assert.match(lines[head + 2], /Superseded by 0007/, 'its reason is on the line below it');
});

test('AC4: speck new never reuses a cancelled ticket number', () => {
  const r = cancelRepo();
  r.add('Export bookings');
  assert.equal(r.run('cancel', '1', 'Not now').status, 0);
  assert.equal(r.run('new', 'Second').stdout.trim(), path.join('speck', 'tickets', '0002-second.md'));
});

// Review round 3 (F1): a reason is stored and shown exactly as typed.
const AWKWARD = ['false', '0', '123', 'true', 'null', 'Use option: "B"', 'C:\\temp\\x', 'Too costly # revisit later', "it's 'quoted'", 'line one\nline two', '[a, b]', 'say " # later', 'back\\" # slash', 'ends with backslash\\'];

// Each reason in a repo of its own, all at once (0429).
test('AC1/AC4: a reason reads back exactly as typed and appears in status, even when it looks like YAML', async () => {
  await Promise.all(AWKWARD.map(async reason => {
    const r = cancelRepo('Export bookings'), { p } = r;
    const res = await r.runAsync('cancel', '1', reason);
    assert.equal(res.status, 0, `${JSON.stringify(reason)}: ${res.stderr}`);
    assert.strictEqual(r.fm(r.filed(p)).cancel_reason, reason, `stored: ${JSON.stringify(reason)}`);
    assert.ok((await r.runAsync('status')).stdout.includes(`❌ ${reason}`), `shown in status: ${JSON.stringify(reason)}`);
  }));
});

test('AC3: reopening keeps an awkward reason exactly, and cancelling again replaces it', () => {
  const r = cancelRepo();
  const p = r.add('Export bookings');
  r.run('cancel', '1', 'false');
  assert.equal(r.run('set', '1', 'status', 'ready').status, 0);
  assert.strictEqual(r.fm(path.join('speck', 'tickets', path.basename(p))).cancel_reason, 'false');
  assert.equal(r.run('cancel', '1', 'Later # maybe').status, 0);
  const text = r.read(r.filed(p));
  assert.equal(text.match(/^cancel_reason:/gm).length, 1, 'one reason line');
  assert.strictEqual(r.fm(r.filed(p)).cancel_reason, 'Later # maybe');
});

test('AC1: cancelling leaves a "cancel_reason:" line in the ticket body byte for byte', () => {
  const r = cancelRepo();
  const p = r.add('Export bookings');
  const body = 'cancel_reason: an example field in the documentation\n';
  fs.writeFileSync(path.join(r.dir, p), `${r.read(p).trimEnd()}\n\n## Notes\n${body}`);
  assert.equal(r.run('cancel', '1', 'Not needed').status, 0);
  assert.ok(r.read(r.filed(p)).includes(`## Notes\n${body}`), 'the body line survives');
  assert.strictEqual(r.fm(r.filed(p)).cancel_reason, 'Not needed');
  assert.equal(r.run('set', '1', 'status', 'ready').status, 0);
  assert.equal(r.run('cancel', '1', 'Again').status, 0);
  assert.ok(r.read(r.filed(p)).includes(`## Notes\n${body}`), 'and survives a second cancel');
});

test('AC3: a reason on the last frontmatter line, with a "#" in it, is replaced rather than duplicated', () => {
  for (const old of ['Old#maybe', 'Old # maybe']) {
    const r = cancelRepo();
    const p = r.add('Export bookings');
    assert.equal(r.run('cancel', '1', old).status, 0);
    // Put the reason on the last frontmatter line, directly before the closing fence.
    const f = r.filed(p);
    const text = r.read(f).replace(/^cancel_reason:.*\n/m, '').replace(/\n+---\n/, `\ncancel_reason: ${JSON.stringify(old)}\n---\n`);
    fs.writeFileSync(path.join(r.dir, f), text);
    assert.equal(r.run('set', '1', 'status', 'ready').status, 0);
    assert.equal(r.run('cancel', '1', 'New').status, 0);
    const after = r.read(f);
    assert.equal(after.match(/^cancel_reason:/gm).length, 1, 'exactly one reason field');
    assert.strictEqual(r.fm(f).cancel_reason, 'New');
    assert.ok(!after.includes('maybe'), 'no stale reason text');
    assert.ok(after.includes('## Problem'), 'body kept');
  }
});

test('setField keeps a trailing comment and the space before it, including on empty fields', () => {
  const doc = '---\nid: "0001"\nstatus: draft            # draft | ready\nsource: ""               # e.g. speck/ideas/x.md\nreviewer_effort:      # blank: use config\nlast:\n---\nbody\n';
  let t = setField(doc, 'source', 'speck/ideas/example.md');
  assert.match(t, /^source: speck\/ideas\/example\.md {15}# e\.g\. speck\/ideas\/x\.md$/m);
  t = setField(t, 'reviewer_effort', 'high');
  assert.match(t, /^reviewer_effort: high {6}# blank: use config$/m);
  t = setField(t, 'status', 'ready');
  assert.match(t, /^status: ready {12}# draft \| ready$/m);
  t = setField(t, 'last', 'x');
  assert.match(t, /^last: x\n---\nbody\n$/m);
  const parsed = parseTicket(t).fm;
  assert.deepEqual([parsed.source, parsed.reviewer_effort, parsed.status, parsed.last], ['speck/ideas/example.md', 'high', 'ready', 'x']);
  assert.equal(setField(doc, 'last', 'x').match(/^last:/gm).length, 1);
});

// Ticket 0010: the overlap check is skill text only, so these tests read the skills.
