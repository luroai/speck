import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0178: the full board the panel sends keeps each finished ticket outside the Shipped list's latest five small.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { panelRepo, startPanel, stop, freePort, panelModel, full, idea, round, CLI, env } from './support/panel.mjs';
import { panelBoard } from '../scripts/board-feed.mjs';
import { statusData } from '../scripts/speck.mjs';
import { spawnSync } from 'node:child_process';

const words = (what, n) => `Words about ${what}. `.repeat(n);
const iso = day => new Date(Date.UTC(2026, 8, 1 + day, 10)).toISOString();
// A finished ticket the size of a real one: long text, a long build log ending, review rounds and its figures.
const shipped = (n, o = {}) => full(String(n).padStart(4, '0'), {
  status: 'done', type: n % 3 ? '' : 'bug', problem: words('a problem', 100), notes: words('notes', 200), acceptance_criteria: [words('a criterion', 50), words('another', 50)],
  started: iso(n), approved: iso(n).replace('T10', 'T11'), finished: iso(n).replace('T10', 'T12'), waited_seconds: n % 4 ? 0 : 60,
  rounds: [round(1, 1000 + n), round(2, 2000)], builder_tokens: 5000 + n, builder_cost_usd: 1.25,
  build_exit: { at: iso(n), code: 0, message: words('the log', 500) }, ship: { running: false, auto: true, started: iso(n), ended: iso(n) }, ...o });
const board = n => ({
  tickets: [full('0900', { status: 'ready' }), full('0901', { status: 'building', started: iso(40) }), full('0902'), ...Array.from({ length: n }, (_, i) => shipped(i + 1))],
  ideas: [idea('one', 'inbox'), idea('two', 'shaped')],
  resume_command: 'claude --resume {session}',
});
const size = v => Buffer.byteLength(JSON.stringify(v));
const latestFive = b => b.tickets.filter(t => t.status === 'done').sort((x, y) => Date.parse(y.finished) - Date.parse(x.finished)).slice(0, 5).map(t => t.id);

// ---------- AC1: each finished ticket other than the latest five takes up no more than 500 bytes ----------

test('0178 AC1: each finished ticket outside the latest five is no more than 500 bytes, however long its text and log', () => {
  for (const repeat of [1, 50]) {
    const b = board(30);
    for (const t of b.tickets) if (t.status === 'done') { t.notes = t.notes.repeat(repeat); t.build_exit.message = t.build_exit.message.repeat(repeat); t.title = words('a title', 20 * repeat); }
    const out = panelBoard(b), keep = latestFive(b);
    for (const t of out.tickets.filter(t => t.status === 'done' && !keep.includes(t.id))) assert.ok(size(t) <= 500, `${t.id} is ${size(t)} bytes`);
    assert.deepEqual(out.tickets.filter(t => keep.includes(t.id)), b.tickets.filter(t => keep.includes(t.id)), 'the latest five whole');
  }
});

test('0178 AC1: a ticket still shipping and a cancelled one are no more than 500 bytes or stay whole as the page needs', () => {
  const b = board(8);
  b.tickets.push(shipped(1, { id: '0950', ship: { running: true, started: iso(1) }, finished: iso(1) }));
  b.tickets.push(full('0951', { status: 'cancelled', notes: words('notes', 500) }));
  const out = panelBoard(b);
  assert.deepEqual(out.tickets.find(t => t.id === '0950'), b.tickets.find(t => t.id === '0950'), 'one shipping now shows in the queue, whole');
  assert.ok(size(out.tickets.find(t => t.id === '0951')) <= 500);
});

test('0178 AC1: the panel sends the board with each finished ticket outside the latest five cut down', async () => {
  const r = panelRepo();
  const runs = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  for (let n = 2; n <= 9; n++) {
    const id = String(n).padStart(4, '0');
    r.write(`${id}-t.md`, `id: "${id}"\ntitle: Ticket ${n}\nstatus: done\nsize: S\nrisk: low\nbuilder: claude\nreviewer: codex\nstarted: "${iso(n)}"\nfinished: "${iso(n).replace('T10', 'T12')}"`,
      `## Problem\n${words('a problem', 100)}\n## Outcome\nDone.\n## Acceptance criteria\n1. ${words('a criterion', 100)}\n## Out of scope\n- None\n## Notes\n- ${words('notes', 200)}\n`, 'speck/tickets/done');
    fs.writeFileSync(path.join(runs, `${id}.json`), JSON.stringify({ exited: iso(n), exit_code: 0 }));
    fs.writeFileSync(path.join(runs, `${id}.log`), words('the log', 300));
  }
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    const body = await new Promise((resolve, reject) => {
      http.get({ host: '127.0.0.1', port: p.port, path: '/api/state', headers: { Host: `127.0.0.1:${p.port}` } }, res => {
        let text = ''; res.setEncoding('utf8'); res.on('data', d => { text += d; }); res.on('end', () => resolve(text));
      }).on('error', reject);
    });
    const done = JSON.parse(body).tickets.filter(t => t.status === 'done');
    const small = done.filter(t => size(t) <= 500).map(t => t.id).sort(), whole = done.filter(t => typeof t.notes === 'string').map(t => t.id).sort();
    assert.deepEqual(small, ['0002', '0003', '0004']);
    assert.deepEqual(whole, ['0005', '0006', '0007', '0008', '0009']);
    // AC2: against the board speck status --json gives for the same tickets.
    const before = spawnSync(process.execPath, [CLI, 'status', '--json'], { cwd: r.dir, encoding: 'utf8', env }).stdout;
    assert.ok(Buffer.byteLength(body) < Buffer.byteLength(JSON.stringify(JSON.parse(before))), 'smaller than before');
  } finally { await stop(p); }
});

// ---------- AC2: the full board is less than a third of the size it was ----------

test('0178 AC2: for the same tickets, the full board is less than a third of the size it was', () => {
  for (const n of [30, 150]) {
    const b = board(n), before = size(b), after = size(panelBoard(b));
    assert.ok(after * 3 < before, `${n} finished: ${after} bytes against ${before}`);
  }
});

// ---------- AC3: the panel shows the same as before ----------

test('0178 AC3: the panel works out the same queue, Plan, Shipped list and figures from the cut-down board', () => {
  const model = panelModel();
  const b = board(30);
  // Ones the page picks with care: finished at the same time, with no finished time, with a time it can't read, shipping
  // now, cancelled, and an open ticket waiting on a finished one.
  b.tickets.push(shipped(31, { id: '0931', finished: iso(30).replace('T10', 'T12') }));
  b.tickets.push(shipped(32, { id: '0932', finished: undefined }), shipped(33, { id: '0933', finished: 'not a time', started: 'nor this', approved: 7 }));
  b.tickets.push(shipped(34, { id: '0934', ship: { running: true, started: iso(34) } }), full('0935', { status: 'cancelled' }));
  b.tickets.push(full('0936', { status: 'draft', after: ['0003'], waiting_on: [] }));
  b.tickets.push(shipped(37, { id: '0937', rounds: [], builder_tokens: null, builder_cost_usd: -1, waited_seconds: 'x' }));
  for (const tickets of [b.tickets, [...b.tickets].reverse()]) {
    const whole = { ...b, tickets }, cut = panelBoard(whole);
    assert.deepEqual(model(cut), model(whole));
    assert.ok(size(cut) * 3 < size(whole));
  }
  // With fewer than five finished, nothing is cut.
  const few = board(4);
  assert.deepEqual(panelBoard(few), few);
});

test("0178 AC3: each finished ticket the page can open has its full text", () => {
  const model = panelModel(), b = board(30), m = model(panelBoard(b));
  assert.equal(m.shipped.length, 5);
  const fullText = t => [t.id, t.title, t.problem, t.outcome, t.acceptance_criteria, t.out_of_scope, t.notes];
  for (const t of m.shipped) assert.deepEqual(fullText(t), fullText(b.tickets.find(x => x.id === t.id)));
});

// ---------- AC4: speck status --json prints the same as before ----------

test('0178 AC4: speck status --json still gives every finished ticket whole', () => {
  const b = board(30), copy = structuredClone(b);
  panelBoard(b);
  assert.deepEqual(b, copy, 'the board it was given is unchanged');
  const r = panelRepo();
  for (let n = 2; n <= 8; n++) {
    const id = String(n).padStart(4, '0');
    r.write(`${id}-t.md`, `id: "${id}"\ntitle: Ticket ${n}\nstatus: done\nsize: S\nrisk: low\nbuilder: claude\nreviewer: codex\nfinished: "${iso(n)}"`,
      `## Problem\nProblem ${n}.\n## Outcome\nDone.\n## Acceptance criteria\n1. One.\n## Out of scope\n- None\n## Notes\n- Note ${n}.\n`, 'speck/tickets/done');
  }
  const printed = JSON.parse(spawnSync(process.execPath, [CLI, 'status', '--json'], { cwd: r.dir, encoding: 'utf8', env }).stdout);
  assert.deepEqual(printed, JSON.parse(JSON.stringify(statusData(r.dir))));
  for (const t of printed.tickets.filter(t => t.status === 'done')) {
    assert.equal(t.problem, `Problem ${Number(t.id)}.`);
    for (const k of ['title', 'notes', 'acceptance_criteria', 'lint_messages', 'build_exit', 'session', 'path']) assert.ok(Object.hasOwn(t, k), `${t.id} has ${k}`);
  }
});
