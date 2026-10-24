import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fakePage, T, click, gitEnv, ROOT, openQueueRows, nowOf } from './support/panel.mjs';
import { OPTION, blockedRepo } from './support/blocked.mjs';
import { statusData, loadConfig } from '../scripts/speck.mjs';
import { foremanView, foremanLines } from '../scripts/foreman.mjs';
import { foremanFixQueue } from '../scripts/foreman-fix.mjs';
import { goWith } from '../scripts/go-with.mjs';
import { wentWithLines } from '../scripts/foreman-took.mjs';

Object.assign(process.env, gitEnv); // goWith commits in this process

// ---------- 0317: show what the Foreman will do and has done for a blocked ticket ----------

const ON = { on: true, pid: 4242 };
const rec = (o = {}) => ({ lock: 4242, max: 2, building: [], switching: null, ready: [], ship: { running: null, hold: null, refused: [] }, ...o });
const view = (tickets = [], o = {}) => foremanView({ run: ON, record: rec(), tickets, ...o });
const state = (foreman, tickets = []) => ({ tickets, ideas: [], resume_command: '', run: ON, foreman });
const header = p => p.byId('run');
const detail = p => p.byId('foreman');
const rowOf = (p, id) => p.byId('queue').children.find(n => /\bq\b/.test(n.className) && n.textContent.includes(id));
const BLOCKED = (id, o = {}) => T(id, 'blocked', { blocked_question: 'A or B?', blocked_recommendation: OPTION, blocked_noticeable: false, blocked_clear: true, blocked_resumable: true, ...o });
const shown = r => statusData(r.dir).tickets.find(t => t.id === '0001');
const setFixing = (r, v) => {
  const file = path.join(r.dir, 'speck', 'config.yml'), text = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, /^watch:/m.test(text) ? text.replace(/^watch:.*$/m, `watch: ${v}`) : `${text.replace(/\s*$/, '')}\nforeman_fixing: ${v}\n`);
};
async function opened(f, tickets = []) {
  const p = fakePage([state(f, tickets)]);
  await p.settle();
  click(header(p));
  await p.settle();
  return p;
}

test('0317 AC1: with Fixing fix, the header keeps the status word, and 0451: its name no longer says "fixing on"', async () => {
  for (const fixing of ['fix', 'tell', 'off']) {
    const p = fakePage([state(view([], { fixing }))]);
    await p.settle();
    // 0451: speck's screen shows the time where "FIXING ON" was, and its name is the status word alone
    assert.match(header(p).title, /^speck: Idle · /, `with ${fixing}`);
  }
});

test('0317 AC1: the board says which setting Fixing has, and speck status says Fixing is on', async () => {
  // 0458: the Foreman's detail shows only the log now, so this is the board's, which speck status says
  for (const fixing of ['fix', 'tell', 'off']) assert.match(view([], { fixing }).fixing_says, new RegExp(`^${fixing}\\. speck `));
  assert.equal(view([], { fixing: 'constructor' }).fixing_says, '', 'a setting speck doesn\'t know isn\'t said');
  const lines = foremanLines(view([], { fixing: 'fix' }));
  assert.equal(lines[0], 'SPECK: Idle · Fixing on');
  assert.match(lines[1], /^ {2}Fixing: fix\. /);
  assert.equal(foremanLines(view([], { fixing: 'tell' }))[0], 'SPECK: Idle');
});

test('0317 AC2: the board says the Foreman will take a recommendation only with Fixing fix, nothing you\'d notice, a clear winner, a build it can resume and no earlier choice', () => {
  const r = blockedRepo();
  assert.equal(shown(r).foreman_will, false, 'Fixing is tell by default');
  setFixing(r, 'fix');
  assert.equal(shown(r).foreman_will, true);
  setFixing(r, 'off');
  assert.equal(shown(r).foreman_will, false);
  const noticed = blockedRepo({ question: `A or B?\n\nRecommended: ${OPTION}\nChanges what you'd notice: yes\nClear winner: yes` });
  setFixing(noticed, 'fix');
  assert.equal(shown(noticed).foreman_will, false, 'it changes what you\'d notice');
  const close = blockedRepo({ question: `A or B?\n\nRecommended: ${OPTION}\nChanges what you'd notice: no\nClear winner: no` });
  setFixing(close, 'fix');
  assert.equal(shown(close).foreman_will, false, 'a close call');
  const unresumable = blockedRepo({ record: null });
  setFixing(unresumable, 'fix');
  assert.equal(shown(unresumable).foreman_will, false, 'speck run can\'t resume its build');
  const before = blockedRepo();
  setFixing(before, 'fix');
  fs.writeFileSync(before.file, before.ticket().replace('- A note.', `- A note.\n- Went with the recommendation: A (chosen by the Foreman, as watch is fix, 2026-10-18 10:00 UTC).`));
  assert.equal(shown(before).foreman_will, false, 'the Foreman has answered one for it before');
});

test('0317 AC2: a blocked card says the Foreman will take its recommendation, and any other says it\'s waiting for you', async () => {
  const p = fakePage([state(view(), [BLOCKED('0001', { foreman_will: true }), BLOCKED('0002', { foreman_will: false }), BLOCKED('0003')])]);
  await p.settle();
  await openQueueRows(p); // 0434: what's under a Build card's two lines shows while it's open
  const one = rowOf(p, '0001').textContent;
  assert.ok(one.includes(`speck will take its recommendation: ${OPTION}`), one);
  assert.doesNotMatch(one, /Waiting for you|Answer the question, then run|question for you/);
  // 0462: open, its facts' Now cell says it in short words, with the sentence as their tooltip
  assert.equal(nowOf(rowOf(p, '0001')).textContent, 'speck will answer');
  assert.equal(nowOf(rowOf(p, '0001')).title, 'Blocked · speck will take its recommendation');
  for (const id of ['0002', '0003']) {
    assert.match(rowOf(p, id).textContent, /Waiting for you\. Answer the question, then run \/speck-build /);
    assert.doesNotMatch(rowOf(p, id).textContent, /speck will/);
  }
});

test('0317 AC2: the board says the same for each blocked ticket, and doesn\'t count the Foreman\'s under Needs you', async () => {
  const tickets = [BLOCKED('0001', { foreman_will: true }), BLOCKED('0002')];
  const f = view(tickets, { fixing: 'fix' });
  assert.equal(f.word, 'Needs you 1');
  assert.equal(view([tickets[0]], { fixing: 'fix' }).word, 'Idle', 'nothing is waiting for you');
  assert.deepEqual(f.blocked.map(b => [b.id, b.foreman]), [['0001', true], ['0002', false]]); // 0458: the cards say it, not the detail
});

test('0317 AC2: speck status says the same for each blocked ticket', () => {
  const r = blockedRepo();
  assert.match(r.run('status').stdout, /\n {8}→ Waiting for you\n/);
  setFixing(r, 'fix');
  const out = r.run('status').stdout;
  assert.ok(out.includes(`\n        → speck will take its recommendation: ${OPTION}\n`), out);
  assert.match(out, /^SPECK: Off · Fixing on$/m);
});

test('0317 AC3: once the Foreman goes with it, the board, card and speck status say so with the option and time, until the ticket moves on', async () => {
  const r = blockedRepo();
  setFixing(r, 'fix');
  const at = new Date();
  assert.equal(goWith(r.dir, '0001', at, { by: 'foreman' }).status, 200);
  const time = `${at.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
  const t = shown(r);
  assert.deepEqual(t.went_with, { option: OPTION, by: 'foreman', at: `${at.toISOString().slice(0, 16)}:00.000Z` });
  assert.equal(t.foreman_will, false);
  const p = fakePage([state(view(), [t])]);
  await p.settle();
  await openQueueRows(p); // 0434: what's under a Build card's two lines shows while it's open
  assert.ok(rowOf(p, '0001').textContent.includes(`speck went with the recommendation: ${OPTION} · ${time}`), rowOf(p, '0001').textContent);
  const out = r.run('status').stdout;
  assert.ok(out.includes(`        ✓ speck went with the recommendation: ${OPTION} (${time})\n`), out);
  assert.ok(out.includes(`  speck went with the recommendation for 0001: ${OPTION} (${time})\n`), out);
  fs.writeFileSync(r.file, r.ticket().replace(/^status: .*$/m, 'status: reviewing'));
  assert.ok(shown(r).went_with, 'still carrying on with it in review');
  fs.writeFileSync(r.file, r.ticket().replace(/^status: .*$/m, `status: reviewing\napproved: "${new Date(at.getTime() + 120000).toISOString()}"`));
  assert.equal(shown(r).went_with, null, 'approved since, then back in review: it has moved on');
  fs.writeFileSync(r.file, r.ticket().replace(/^status: .*$/m, 'status: approved'));
  assert.equal(shown(r).went_with, null, 'approved');
  assert.doesNotMatch(r.run('status').stdout, /✓/);
});

test('0317 AC3: the board lists the recommendations the Foreman took in the last 24 hours, newest first', async () => {
  const now = Date.parse('2026-10-18T22:00:00Z');
  const tickets = [T('0001', 'done', { foreman_took: [{ option: 'old', at: '2026-10-17T21:00:00.000Z' }, { option: 'A', at: '2026-10-18T12:00:00.000Z' }] }),
    T('0002', 'building', { foreman_took: [{ option: 'B', at: '2026-10-18T21:30:00.000Z' }] }), T('0003', 'ready', { foreman_took: [{ option: 'bad', at: 'never' }] })];
  const f = view(tickets, { now, fixing: 'fix' });
  assert.deepEqual(f.took.map(w => [w.id, w.option]), [['0002', 'B'], ['0001', 'A']]);
  assert.deepEqual(f.took.map(w => w.at), ['2026-10-18T21:30:00.000Z', '2026-10-18T12:00:00.000Z']);
  assert.deepEqual(view([], { now }).took, []); // 0458: the Foreman's detail no longer lists them
});

test('0317 AC4: the Foreman\'s choice is recorded as the Foreman\'s, the button\'s as yours, and each is shown as such', async () => {
  const r = blockedRepo(), said = [];
  foremanFixQueue({ repo: r.dir, readConfig: () => ({ ...loadConfig(r.dir), watch: 'fix' }), say: m => said.push(m) }).check(statusData(r.dir).tickets);
  assert.match(r.ticket(), /Went with the recommendation: .*\(chosen by speck, as watch is fix, /);
  assert.equal(shown(r).went_with.by, 'foreman');
  const u = blockedRepo();
  assert.equal(goWith(u.dir, '0001', new Date()).status, 200);
  assert.match(u.ticket(), /Went with the recommendation: .*\(chosen by the user in the panel, /);
  const t = shown(u);
  assert.equal(t.went_with.by, 'user');
  assert.deepEqual(t.foreman_took, [], 'not counted as the Foreman\'s');
  const p = fakePage([state(view(), [t])]);
  await p.settle();
  await openQueueRows(p); // 0434: what's under a Build card's two lines shows while it's open
  assert.match(rowOf(p, '0001').textContent, /You went with the recommendation: /);
  assert.doesNotMatch(rowOf(p, '0001').textContent, /speck went/);
  assert.match(u.run('status').stdout, /✓ You went with the recommendation: /);
});

test('0317 AC4: a choice from anyone else is refused, changing nothing, and only the panel\'s button and the Foreman call goWith', () => {
  const r = blockedRepo(), before = r.ticket();
  for (const by of ['someone', '', 'constructor']) {
    const out = goWith(r.dir, '0001', new Date(), { by });
    assert.equal(out.status, 500);
    assert.match(out.body.error, /can't tell who went with/);
  }
  assert.equal(r.ticket(), before);
  const calls = file => [...fs.readFileSync(path.join(ROOT, 'scripts', file), 'utf8').matchAll(/\bgoWith\(([^)]*\)[^)]*)\)/g)].map(m => m[1]);
  assert.deepEqual(calls('panel.mjs'), ["repo, recommendation[1], new Date(), { by: 'user' }"]);
  assert.deepEqual(calls('foreman-fix.mjs'), ["repo, t.id, new Date(), { by: 'foreman' }"]);
  assert.deepEqual(wentWithLines(['- Went with the recommendation: A (b) (chosen by the user in the panel, 2026-10-18 22:18 UTC).', '- Went with: no']),
    [{ option: 'A (b)', by: 'user', at: '2026-10-18T22:18:00.000Z' }]);
});
