import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, freePort, startPanel, stop, request, post, tokenOf, headOf, gitEnv, deferred } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf, controlOf, changeTo, tick, posted } from './support/settings.mjs';
import { panelSettings, panelSaveSettings, panelSaveRequest } from '../scripts/settings.mjs';
import { machineConfig } from '../scripts/machine.mjs';

// ---------- 0274: save every changed setting with one Save button ----------

Object.assign(process.env, gitEnv); // panelSaveSettings commits in this process

const byKey = v => Object.fromEntries(v.groups.flatMap(g => g.settings).map(s => [s.key, s]));
const cfgOf = r => path.join(r.dir, 'speck', 'config.yml');
const readCfg = r => fs.readFileSync(cfgOf(r), 'utf8');
// What a refusal must leave as it was: the file, HEAD, what git says has changed and this machine's values.
const snapshot = r => ({ text: readCfg(r), head: headOf(r), status: r.g('status', '--porcelain'), machine: machineConfig(r.dir) });
const cls = (n, c) => new RegExp(`\\b${c}\\b`).test(n.className || '');
// What a POST /api/settings/save asked for, by name.
const asked = url => Object.fromEntries(new URLSearchParams(url.split('?')[1] || ''));

// A Settings view as the server sends it.
const S = (key, value, more = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, ...more });
const view = (o = {}) => ({ groups: [
  { title: 'Shipping', settings: [
    S('auto_ship', o.auto_ship ?? false, { choices: [true, false] }),
    S('auto_ship_risk', o.auto_ship_risk ?? ['low'], { choices: ['low', 'high'] })] },
  { title: 'Building and reviewing', settings: [
    S('builder', 'claude', { editable: false }),
    S('reviewer_effort', o.reviewer_effort ?? '', { choices: ['', 'low', 'medium', 'high', 'xhigh', 'max'] }),
    S('reviewer_model', o.reviewer_model ?? '')] },
  { title: 'How much runs at once', settings: [
    S('max_parallel_builds', o.max_parallel_builds ?? 1, { for_machine: true, from: o.machine === undefined ? 'repo' : 'machine', repo_value: 1,
      ...(o.machine === undefined ? {} : { value: o.machine }) }),
    S('max_parallel_tests', o.max_parallel_tests ?? 1, { for_machine: true, from: 'repo', repo_value: 1 })] },
  { title: 'Ticket size limits', settings: [S('limits.max_review_rounds', o.rounds ?? 3)] },
] });
// A page whose confirm() records what it asked and answers `answer`.
function page(views, saves = [], answer = true) {
  const asks = [];
  const p = settingsPage(views, saves, { confirm: msg => { asks.push(String(msg)); return answer; } });
  p.asks = asks;
  return p;
}
const opened = async p => { await p.settle(); await openSettings(p); return p; };
const OK = { ok: true, changed: ['x'] };
const pick = (p, key, label) => p.press(p.all(rowOf(p, key)).find(n => n.tagName === 'button' && n.textContent === label));

// 0731: the one Save is gone: each setting saves by itself as it changes.
test('0274, since 0731: no Save, and each change is sent by itself as it\'s made, with where it goes', async () => {
  const p = await opened(page([view(), view({ reviewer_effort: 'high' }), view({ reviewer_effort: 'high', rounds: 4 }), view({ reviewer_effort: 'high', rounds: 4, machine: 3 })], [OK, OK, OK]));
  assert.ok(!p.all(p.byId('settings')).some(n => n.tagName === 'button' && /^Save$/.test(n.textContent || '')), 'no Save');
  changeTo(p, 'reviewer_effort', 'high');
  await p.settle();
  changeTo(p, 'limits.max_review_rounds', '4');
  await p.settle();
  changeTo(p, 'max_parallel_builds', '3');
  await p.settle();
  const sent = p.settingsCalls.filter(c => c.method === 'POST');
  assert.ok(sent.every(c => c.url.startsWith('/api/settings/save?') && c.headers['X-Speck-Token']), 'each with the token');
  assert.deepEqual(sent.map(c => asked(c.url)), [{ 'repo:reviewer_effort': 'high' }, { 'repo:limits.max_review_rounds': '4' }, { 'machine:max_parallel_builds': '3' }]);
});

test('0274 AC2: the changed shared settings go into one commit of speck/config.yml on the base branch, this machine\'s are saved for it, and the rest are left alone', () => {
  const r = panelRepo();
  fs.writeFileSync(path.join(r.dir, 'other.txt'), 'not mine\n'); // another session's file, left alone
  const before = readCfg(r).split('\n'), head = headOf(r);
  // 0387: reviewer_effort is one of your own settings, so it's saved for this machine with max_parallel_tests.
  const out = panelSaveSettings(r.dir, [
    { key: 'reviewer_effort', value: 'high' }, { key: 'limits.max_review_rounds', value: '5' }, { key: 'ship_mode', value: 'pr' },
    { key: 'max_parallel_tests', value: '3', machine: true }, { key: 'reviewer', value: 'codex' }, // codex: as it is
  ]);
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.deepEqual(out.body.changed, ['limits.max_review_rounds', 'ship_mode', 'reviewer_effort', 'max_parallel_tests']);
  assert.equal(r.g('rev-parse', 'HEAD~1'), head, 'one commit');
  assert.equal(r.g('diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'), 'speck/config.yml');
  assert.equal(r.g('log', '-1', '--format=%s'), 'speck: config limits.max_review_rounds 5; ship_mode pr');
  assert.equal(r.g('status', '--porcelain'), '?? other.txt');
  const after = readCfg(r).split('\n');
  assert.equal(after.length, before.length);
  assert.equal(after.filter((l, i) => l !== before[i]).length, 2, 'only their two lines');
  const s = byKey(panelSettings(r.dir));
  assert.equal(s.reviewer_effort.value, 'high');
  assert.equal(s['limits.max_review_rounds'].value, 5);
  assert.deepEqual(machineConfig(r.dir), { reviewer_effort: 'high', max_parallel_tests: 3 }, 'this machine\'s, not committed');
  assert.equal(s.max_parallel_tests.from, 'machine');

  // Only this machine's: no commit at all.
  const was = headOf(r);
  assert.equal(panelSaveSettings(r.dir, [{ key: 'max_parallel_tests', value: '', machine: true }]).status, 200);
  assert.deepEqual(machineConfig(r.dir), { reviewer_effort: 'high' });
  assert.equal(headOf(r), was);
});

test('0274 AC2: the panel server takes the changes together from the view, only with its token', async () => {
  const r = panelRepo();
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    const token = tokenOf((await request(p.port)).body);
    const where = '/api/settings/save?repo%3Aship_mode=pr&machine%3Amax_parallel_builds=2';
    const was = snapshot(r);
    assert.equal((await post(p.port, where)).status, 403);
    assert.equal((await post(p.port, where, { token, origin: 'http://evil.example' })).status, 403);
    assert.deepEqual(snapshot(r), was);
    const ok = await post(p.port, where, { token });
    assert.equal(ok.status, 200, ok.body);
    assert.match(readCfg(r), /^ship_mode: pr /m);
    assert.deepEqual(machineConfig(r.dir), { max_parallel_builds: 2 }, '0387: for this machine');
    assert.equal(r.g('log', '-1', '--format=%s'), 'speck: config ship_mode pr');
  } finally { await stop(p); }
});

test('0274 AC3: a change that lets more tickets ship asks first, and nothing is sent unless you confirm (0731: as it\'s made)', async () => {
  const p = await opened(page([view()], [], false));
  changeTo(p, 'auto_ship', 'true');
  await p.settle();
  assert.equal(p.asks.length, 1);
  assert.match(p.asks[0], /approved low-risk tickets/);
  assert.deepEqual(posted(p), [], 'cancelled: nothing is saved');
  assert.equal(controlOf(p, 'auto_ship').value, 'false', 'auto_ship as it was');

  // Adding high while auto_ship is on asks about both, and says so when it's sent.
  const q = await opened(page([view({ auto_ship: true }), view({ auto_ship: true, auto_ship_risk: ['low', 'high'] })], [OK], true));
  tick(q, 'auto_ship_risk', 'high', true);
  await q.settle();
  assert.match(q.asks[0], /approved low-risk and high-risk tickets/);
  assert.equal(posted(q).length, 1);
  assert.deepEqual(asked(posted(q)[0]), { 'repo:auto_ship_risk': 'low,high', confirm: 'low,high' });
});

test('0274 AC3: the server saves nothing that lets more tickets ship unless it was confirmed, judging the changes together', () => {
  const r = panelRepo();
  const was = snapshot(r);
  const changes = [{ key: 'auto_ship', value: 'true' }, { key: 'auto_ship_risk', value: 'low,high' }, { key: 'max_parallel_builds', value: '2', machine: true }, { key: 'reviewer_effort', value: 'high' }];
  for (const confirmed of [null, 'low']) {
    const out = panelSaveSettings(r.dir, changes, { confirmed });
    assert.equal(out.status, 409, String(confirmed));
    assert.equal(out.body.confirm, true);
    assert.match(out.body.error, /approved low-risk and high-risk tickets/);
    assert.deepEqual(Object.keys(out.body.refused).sort(), ['auto_ship', 'auto_ship_risk']);
  }
  assert.deepEqual(snapshot(r), was, 'nothing saved, not even this machine\'s');
  assert.equal(panelSaveSettings(r.dir, changes, { confirmed: 'low,high' }).status, 200);
  const s = byKey(panelSettings(r.dir));
  assert.equal(s.auto_ship.value, true);
  assert.deepEqual(s.auto_ship_risk.value, ['low', 'high']);
});

test('0274 AC4: when any change is refused nothing is saved, and the refusal names the setting and why', () => {
  const r = panelRepo();
  let was = snapshot(r);
  let out = panelSaveSettings(r.dir, [{ key: 'reviewer_effort', value: 'high' }, { key: 'max_parallel_tests', value: '2', machine: true },
    { key: 'limits.max_review_rounds', value: 'lots' }]);
  assert.equal(out.status, 422);
  assert.deepEqual(Object.keys(out.body.refused), ['limits.max_review_rounds']);
  assert.match(out.body.refused['limits.max_review_rounds'], /whole number of 1 or more/);
  assert.deepEqual(snapshot(r), was);

  // A setting the panel can't change, one for this machine that no machine holds, or one given twice.
  out = panelSaveSettings(r.dir, [{ key: 'reviewer_effort', value: 'low' }, { key: 'build_command', value: 'x' }]); // 0293: not builder, which can be now
  assert.equal(out.status, 403);
  assert.match(out.body.refused.build_command, /can't be changed from the panel/);
  out = panelSaveSettings(r.dir, [{ key: 'limits.max_review_rounds', value: '4', machine: true }]); // 0387: reviewer_model is one now
  assert.equal(out.status, 422);
  out = panelSaveSettings(r.dir, [{ key: 'reviewer_model', value: 'm' }, { key: 'reviewer_model', value: 'n', machine: true }]);
  assert.equal(out.status, 400);
  assert.deepEqual(snapshot(r), was);

  // Off the base branch the repo's changes are refused, so this machine's isn't saved either.
  r.g('checkout', '-q', '-b', 'elsewhere');
  was = snapshot(r);
  out = panelSaveSettings(r.dir, [{ key: 'max_parallel_tests', value: '2', machine: true }, { key: 'ship_mode', value: 'pr' }]);
  assert.equal(out.status, 409);
  assert.deepEqual(Object.keys(out.body.refused), ['ship_mode']);
  assert.match(out.body.refused.ship_mode, /"elsewhere", not main/);
  assert.deepEqual(snapshot(r), was);

  // The request's own address: something that isn't a change is refused.
  assert.equal(panelSaveRequest(r.dir, 'repo%3Areviewer_effort=low&delete=all').status, 400);
  assert.equal(panelSaveRequest(r.dir, 'repo%3A__proto__=x').status, 403);
  assert.deepEqual(snapshot(r), was);
});

test('0274 AC4 F1: when writing or committing speck/config.yml fails, this machine\'s changes are put back too', { skip: process.getuid?.() === 0 ? 'root can write a read-only file' : false }, () => {
  const r = panelRepo();
  const changes = [{ key: 'max_parallel_tests', value: '3', machine: true }, { key: 'reviewer_effort', value: 'high' }, { key: 'ship_mode', value: 'pr' }];
  let was = snapshot(r);
  fs.chmodSync(cfgOf(r), 0o444); // can't be written
  try {
    const out = panelSaveSettings(r.dir, changes);
    assert.equal(out.status, 500);
    assert.match(out.body.error, /nothing was saved/);
  } finally { fs.chmodSync(cfgOf(r), 0o644); }
  assert.deepEqual(snapshot(r), was);

  // A commit that fails, here refused by a hook.
  const hook = path.join(r.dir, '.git', 'hooks', 'pre-commit');
  fs.writeFileSync(hook, '#!/bin/sh\nexit 1\n', { mode: 0o755 });
  was = snapshot(r);
  const out = panelSaveSettings(r.dir, changes);
  assert.equal(out.status, 500);
  assert.match(out.body.error, /Couldn't commit speck\/config.yml, so nothing was saved/);
  assert.deepEqual(snapshot(r), was);
});

test('0274 AC2 F2, since 0731: a change made while a save is on its way is saved next, by itself', async () => {
  const answer = deferred();
  const p = await opened(page([view(), view({ reviewer_effort: 'high' }), view({ reviewer_effort: 'high', rounds: 5 })], [answer, OK]));
  changeTo(p, 'reviewer_effort', 'high');
  await p.settle();
  changeTo(p, 'limits.max_review_rounds', '5'); // made while waiting
  await p.settle();
  assert.equal(controlOf(p, 'limits.max_review_rounds').value, '5', 'kept while it waits');
  answer.resolve(OK);
  await p.settle();
  await p.settle();
  assert.equal(controlOf(p, 'reviewer_effort').value, 'high');
  assert.equal(controlOf(p, 'limits.max_review_rounds').value, '5');
  assert.deepEqual(posted(p).map(asked), [{ 'repo:reviewer_effort': 'high' }, { 'repo:limits.max_review_rounds': '5' }]);
});

test('0274 AC4, since 0731: the view shows a refusal beside its setting, which goes back to the saved value', async () => {
  const refused = { 'limits.max_review_rounds': 'limits.max_review_rounds must be a whole number of 1 or more (got "0").' };
  const p = await opened(page([view()], [{ status: 422, body: { error: refused['limits.max_review_rounds'], refused } }]));
  changeTo(p, 'limits.max_review_rounds', '0');
  await p.settle();
  assert.match(rowOf(p, 'limits.max_review_rounds').textContent, /must be a whole number of 1 or more/);
  assert.equal(controlOf(p, 'limits.max_review_rounds').value, '3');
  assert.equal(p.settingsCalls.filter(c => c.method === 'GET' && c.url.startsWith('/api/settings')).length, 1, 'not read again');

  // A refusal that's no one setting's shows under the setting sent. 0387: a change to your own setting goes for this machine, unasked.
  const q = await opened(page([view()], [{ status: 500, body: { error: 'Couldn\'t commit speck/config.yml, so nothing was saved.' } }]));
  changeTo(q, 'max_parallel_builds', '4');
  await q.settle();
  assert.deepEqual(asked(posted(q)[0]), { 'machine:max_parallel_builds': '4' });
  assert.match(rowOf(q, 'max_parallel_builds').textContent, /Couldn't commit/);
  assert.equal(controlOf(q, 'max_parallel_builds').value, '1');
});

test('0274 AC5: after a save the view shows the values as speck now reads them (0731: clearing this machine\'s value saves at once)', async () => {
  const p = await opened(page([view(), view({ reviewer_effort: 'high' })], [OK]));
  changeTo(p, 'reviewer_effort', 'high');
  await p.settle();
  assert.equal(p.settingsCalls.filter(c => c.method === 'GET' && c.url.startsWith('/api/settings')).length, 2, 'read again');
  assert.equal(controlOf(p, 'reviewer_effort').value, 'high');

  const q = await opened(page([view({ machine: 3 }), view()], [{ ok: true, changed: ['max_parallel_builds'] }]));
  pick(q, 'max_parallel_builds', 'Clear this machine\'s value');
  await q.settle();
  assert.deepEqual(asked(posted(q)[0]), { 'machine:max_parallel_builds': '' });
  assert.equal(controlOf(q, 'max_parallel_builds').value, '1');
  assert.ok(!q.all(rowOf(q, 'max_parallel_builds')).some(n => n.tagName === 'button' && /this machine's value/.test(n.textContent)), 'the repo\'s value now (0397: no mark)');
});
