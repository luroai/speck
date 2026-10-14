// 0166: time a ticket spends blocked or paused is waiting for the user, so it's left out of its build time.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { T, round, panelModel, panelRepo, fakePage, queueRows } from './support/panel.mjs';
import { runsPath, speck, json, tickerRepo, launched, cleanup } from './support/ticker.mjs';
import { parseTicket } from '../scripts/speck.mjs';

const NOW = Date.parse('2026-10-14T12:00:00.000Z');
const iso = ms => new Date(ms).toISOString();
const ago = m => iso(NOW - m * 60000);
const realAgo = s => iso(Date.now() - s * 1000);
const clock = start => {
  const c = { now: start };
  c.Date = class extends Date { constructor(...a) { super(...(a.length ? a : [c.now])); } static now() { return c.now; } };
  return c;
};
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const subOf = (p, id) => p.all(rowOf(p, id)).find(n => n.className === 'sub');
const fmOf = file => parseTicket(fs.readFileSync(file, 'utf8')).fm;
// Moves a frontmatter field's time back, as if that much time had gone by since it was written.
const backdate = (file, key, seconds) => fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(new RegExp(`^${key}: .*$`, 'm'), `${key}: "${realAgo(seconds)}"`));
const near = (actual, expected, msg) => assert.ok(Math.abs(actual - expected) <= 5, `${msg}: ${actual} isn't about ${expected}`);
const tick = async (p, c, ms) => { c.now += ms; for (const { fn } of p.intervals.values()) fn(); await p.settle(); };

// ---------- AC1: blocked time ----------

test('0166 AC1: blocking records the time, and leaving blocked adds the stretch to waited_seconds and clears it', () => {
  const r = panelRepo();
  assert.equal(r.run('set', '1', 'status', 'building').status, 0);
  assert.equal(fmOf(r.file).waited_seconds, undefined, 'nothing waited yet');
  assert.equal(r.run('set', '1', 'status', 'blocked').status, 0);
  assert.match(String(fmOf(r.file).blocked_at), /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
  backdate(r.file, 'blocked_at', 600);
  assert.equal(r.run('set', '1', 'status', 'reviewing').status, 0);
  const fm = fmOf(r.file);
  near(fm.waited_seconds, 600, 'the blocked stretch');
  assert.ok(!fm.blocked_at, 'no longer blocked');
});

test('0166 AC1: a ticket that blocks more than once adds each stretch, and setting blocked again keeps the first time', () => {
  const r = panelRepo();
  assert.equal(r.run('set', '1', 'status', 'building').status, 0);
  assert.equal(r.run('set', '1', 'status', 'blocked').status, 0);
  backdate(r.file, 'blocked_at', 300);
  assert.equal(r.run('set', '1', 'status', 'building').status, 0);
  assert.equal(r.run('set', '1', 'status', 'blocked').status, 0);
  backdate(r.file, 'blocked_at', 200);
  const at = fmOf(r.file).blocked_at;
  assert.equal(r.run('set', '1', 'status', 'blocked').status, 0);
  assert.equal(fmOf(r.file).blocked_at, at, 'still blocked since the same time');
  assert.equal(r.run('set', '1', 'status', 'approved').status, 0);
  near(fmOf(r.file).waited_seconds, 500, 'both stretches');
  assert.equal(fs.readFileSync(r.file, 'utf8').match(/^waited_seconds:/gm).length, 1, 'one waited_seconds line');
});

test('0166 AC1: a ticket that was blocked with no recorded time adds nothing when it leaves blocked', () => {
  const r = panelRepo();
  assert.equal(r.run('set', '1', 'status', 'building').status, 0);
  fs.writeFileSync(r.file, fs.readFileSync(r.file, 'utf8').replace(/^status: building/m, 'status: blocked'));
  assert.equal(r.run('set', '1', 'status', 'reviewing').status, 0);
  assert.equal(fmOf(r.file).waited_seconds, undefined);
});

// ---------- AC2: paused time ----------

// speck run launches only ready tickets, so the launched build's ticket is moved on to building, as a build does.
function building(t) {
  const file = path.join(t.dir, 'speck', 'tickets', '0001-t.md');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/^status: .*$/m, `status: building\nstarted: "${realAgo(900)}"`));
  t.g('commit', '-qam', 'building');
  return file;
}

test('0166 AC2: playing a paused build adds the time it spent paused to waited_seconds, committed with the ticket', async () => {
  const t = tickerRepo();
  const run = await launched(t);
  try {
    const file = building(t);
    assert.equal(speck(t.dir, 'pause', '0001').status, 0);
    const since = json(t.dir).tickets.find(x => x.id === '0001').paused_at;
    assert.ok(Math.abs(Date.parse(since) - Date.now()) < 10000, `status --json gives when it was paused: ${since}`);
    const markFile = runsPath(t.dir, '0001.paused');
    const mark = JSON.parse(fs.readFileSync(markFile, 'utf8'));
    fs.writeFileSync(markFile, JSON.stringify({ ...mark, paused: realAgo(120) }));
    const r = speck(t.dir, 'play', '0001');
    assert.equal(r.status, 0, r.stderr);
    near(fmOf(file).waited_seconds, 120, 'the paused stretch');
    assert.equal(t.g('status', '--porcelain', '--', 'speck/tickets'), '', 'the ticket is committed');
    assert.equal(json(t.dir).tickets.find(x => x.id === '0001').paused_at, null, 'no longer paused');
    // A second pause adds to the same total.
    assert.equal(speck(t.dir, 'pause', '0001').status, 0);
    fs.writeFileSync(markFile, JSON.stringify({ ...JSON.parse(fs.readFileSync(markFile, 'utf8')), paused: realAgo(60) }));
    assert.equal(speck(t.dir, 'play', '0001').status, 0);
    near(fmOf(file).waited_seconds, 180, 'both pauses');
  } finally { await cleanup(t, run)(); }
});

test('0166 AC2: stopping a paused build adds the paused stretch and starts the blocked one', async () => {
  const t = tickerRepo();
  const run = await launched(t);
  try {
    const file = building(t);
    assert.equal(speck(t.dir, 'pause', '0001').status, 0);
    const markFile = runsPath(t.dir, '0001.paused');
    fs.writeFileSync(markFile, JSON.stringify({ ...JSON.parse(fs.readFileSync(markFile, 'utf8')), paused: realAgo(240) }));
    const r = speck(t.dir, 'stop', '0001');
    assert.equal(r.status, 0, r.stderr);
    const fm = fmOf(file);
    assert.equal(fm.status, 'blocked');
    near(fm.waited_seconds, 240, 'the paused stretch');
    assert.ok(Math.abs(Date.parse(fm.blocked_at) - Date.now()) < 10000, 'blocked from now');
  } finally { await cleanup(t, run)(); }
});

// ---------- AC3: the Build queue's timer ----------

test('0166 AC3: a building ticket\'s timer leaves out its waited time and counts on', async () => {
  const c = clock(NOW);
  const p = fakePage([{ tickets: [T('0001', 'building', { started: ago(13), waited_seconds: 600 })], ideas: [] }], { Date: c.Date });
  await p.settle();
  assert.equal(subOf(p, '0001').textContent, '03:00');
  await tick(p, c, 5000);
  assert.equal(subOf(p, '0001').textContent, '03:05');
});

test('0166 AC3: a blocked ticket\'s timer stops at when it blocked, without its earlier waiting', async () => {
  const c = clock(NOW);
  const p = fakePage([{ tickets: [T('0001', 'blocked', { started: ago(10), blocked_at: ago(2), waited_seconds: 60 })], ideas: [] }], { Date: c.Date });
  await p.settle();
  assert.equal(subOf(p, '0001').textContent, '07:00');
  await tick(p, c, 5000);
  assert.equal(subOf(p, '0001').textContent, '07:00', 'it has stopped');
});

test('0166 AC3: a paused build\'s timer stops at when it paused, and carries on from the same figure once played', async () => {
  const c = clock(NOW);
  const paused = T('0001', 'building', { started: ago(5), build_running: true, paused: true, paused_at: ago(1) });
  const playing = T('0001', 'building', { started: ago(5), build_running: true, paused: false, paused_at: null, waited_seconds: 60 });
  const p = fakePage([{ tickets: [paused], ideas: [] }], { Date: c.Date });
  await p.settle();
  assert.equal(subOf(p, '0001').textContent, 'Paused · 04:00');
  await tick(p, c, 5000);
  assert.equal(subOf(p, '0001').textContent, 'Paused · 04:00', 'it has stopped');
  const m = panelModel()({ tickets: [{ ...playing, started: iso(Date.now() - 5 * 60000) }], ideas: [] });
  assert.equal(m.queue[0].counter, '04:00', 'played: the same figure, counting on from there');
});

test('0166 AC3: a blocked ticket with no recorded block time counts on as before', async () => {
  const c = clock(NOW);
  const p = fakePage([{ tickets: [T('0001', 'blocked', { started: ago(10) })], ideas: [] }], { Date: c.Date });
  await p.settle();
  assert.equal(subOf(p, '0001').textContent, '10:00');
  await tick(p, c, 3000);
  assert.equal(subOf(p, '0001').textContent, '10:03');
});

// ---------- AC4: Shipped minutes ----------

test('0166 AC4: a shipped ticket\'s minutes and the median leave out its waited time', () => {
  const m = panelModel()({ tickets: [
    T('0001', 'done', { started: ago(70), approved: ago(10), finished: ago(5), waited_seconds: 3000, rounds: [round(1, 10)] }),
    T('0002', 'done', { started: ago(30), approved: ago(10), finished: ago(5), rounds: [round(1, 10)] }),
    T('0003', 'done', { started: ago(40), approved: ago(10), finished: ago(5), waited_seconds: 0, rounds: [round(1, 10)] }),
  ], ideas: [] });
  const by = id => m.shipped.find(t => t.id === id);
  assert.equal(by('0001').minutes, 10, 'an hour from start to approval, 50 minutes of it waiting');
  assert.equal(by('0002').minutes, 20, 'no record of waiting: as today');
  assert.equal(by('0003').minutes, 30);
  assert.equal(m.stats.minutes.median, 20);
});

test('0166 AC4: an unreadable or too large waited_seconds never gives a negative time', () => {
  const m = panelModel()({ tickets: [
    T('0001', 'done', { started: ago(30), approved: ago(10), finished: ago(5), waited_seconds: 'lots' }),
    T('0002', 'done', { started: ago(30), approved: ago(10), finished: ago(5), waited_seconds: 99999 }),
    T('0003', 'done', { started: ago(30), approved: ago(10), finished: ago(5), waited_seconds: -600 }),
  ], ideas: [] });
  const by = id => m.shipped.find(t => t.id === id);
  assert.equal(by('0001').minutes, 20);
  assert.equal(by('0002').minutes, 0);
  assert.equal(by('0003').minutes, 20);
});

// ---------- self-check ----------

test('0166 AC1: an unreadable blocked_at adds nothing, and is cleared when the ticket leaves blocked', () => {
  const r = panelRepo();
  assert.equal(r.run('set', '1', 'status', 'building').status, 0);
  assert.equal(r.run('set', '1', 'status', 'blocked').status, 0);
  fs.writeFileSync(r.file, fs.readFileSync(r.file, 'utf8').replace(/^blocked_at: .*$/m, 'blocked_at: "not a date"'));
  assert.equal(r.run('set', '1', 'status', 'building').status, 0);
  const fm = fmOf(r.file);
  assert.equal(fm.waited_seconds, undefined);
  assert.ok(!fm.blocked_at);
});

test('0166 AC2: a paused time that can\'t be written to the ticket still plays the build, and says so', async () => {
  const t = tickerRepo();
  const run = await launched(t);
  const file = building(t);
  try {
    assert.equal(speck(t.dir, 'pause', '0001').status, 0);
    fs.chmodSync(file, 0o444);
    const r = speck(t.dir, 'play', '0001');
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /0001 playing again[^\n]*paused time couldn't be/);
    assert.doesNotMatch(r.stdout + r.stderr, /\n\s+at /, 'no stack trace');
    assert.equal(json(t.dir).tickets.find(x => x.id === '0001').paused, false);
  } finally { fs.chmodSync(file, 0o644); await cleanup(t, run)(); }
});

test('0166 AC2: status --json gives waited_seconds as a number', () => {
  const r = panelRepo();
  fs.writeFileSync(r.file, fs.readFileSync(r.file, 'utf8').replace(/^status: .*$/m, 'status: blocked\nwaited_seconds: 90'));
  assert.equal(json(r.dir).tickets.find(x => x.id === '0001').waited_seconds, 90);
});

// ---------- review round 1 ----------

test('0166 AC1: cancelling a blocked ticket adds its blocked stretch and clears blocked_at', () => {
  const r = panelRepo();
  assert.equal(r.run('set', '1', 'status', 'building').status, 0);
  assert.equal(r.run('set', '1', 'status', 'blocked').status, 0);
  backdate(r.file, 'blocked_at', 300);
  const c = r.run('cancel', '1', 'Not needed');
  assert.equal(c.status, 0, c.stderr);
  const file = path.join(r.dir, c.stdout.trim().split(' → ')[1]);
  const fm = fmOf(file);
  assert.equal(fm.status, 'cancelled');
  assert.equal(fm.cancel_reason, 'Not needed');
  near(fm.waited_seconds, 300, 'the blocked stretch');
  assert.ok(!fm.blocked_at, 'no longer blocked');
});
