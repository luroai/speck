import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runIn, gIn } from './support/ship.mjs';
import { read, TICKET } from './support/merge-rounds.mjs';
import { changesRepo } from './support/changes.mjs';
import { T, fakePage, queueRows, round, fullViewOf } from './support/panel.mjs';
import { statusData } from '../scripts/speck.mjs';
import { autoShipWhyNot } from '../scripts/ship.mjs';
import { shipQueue } from '../scripts/ship-queue.mjs';
import { reviewPack, plainPack } from '../scripts/pack.mjs';
import { criteriaChange } from '../scripts/criteria-changed.mjs';

// ---------- 0565: hold back a ticket whose criteria changed from shipping by itself ----------

const CFG = { base_branch: 'main', branch_prefix: 'speck/' };
const OLD = '1. Export button downloads a CSV.';
const shown = r => statusData(r.dir).tickets.find(t => t.id === '0001');
// Commits `edit` of the ticket on its branch, or on main with `at`.
function edit(r, fn, at = r.wt) {
  fs.writeFileSync(path.join(at, TICKET), fn(read(at, TICKET)));
  gIn(at, 'commit', '-qam', 'edit the ticket');
}
const reword = (r, now = '1. Export button downloads an Excel file.') => edit(r, s => s.replace(OLD, now));
const change = r => criteriaChange(r.dir, CFG, '1');
const part = pack => pack.split('### Criteria changed')[1]?.split('\n### ')[0];

test('0565 AC1: a ticket whose branch has the criteria it started with has not changed, whatever else changed in it', () => {
  const r = changesRepo();
  edit(r, s => s.replace('Users cannot export.', 'Users really cannot export.'));
  assert.equal(change(r), null);
  assert.equal(shown(r).criteria_changed, false);
});

test('0565 AC1: spaces at the ends of lines do not count', () => {
  const r = changesRepo();
  edit(r, s => s.replace(OLD, `${OLD}   `));
  assert.equal(change(r), null);
});

test('0565 AC1: changed words count, from either checkout', () => {
  const r = changesRepo();
  reword(r);
  assert.ok(change(r));
  assert.ok(criteriaChange(r.wt, CFG, '1'), 'from its worktree too');
});

test('0565 AC1: a change to the section that leaves every criterion alone still counts', () => {
  const r = changesRepo();
  edit(r, s => s.replace(OLD, `Read these first.\n${OLD}`));
  assert.ok(change(r));
});

test('0565 AC1: losing the whole section counts', () => {
  const r = changesRepo();
  edit(r, s => s.replace(`## Acceptance criteria\n${OLD}\n`, ''));
  assert.ok(change(r));
});

test('0565 AC1: it compares with the base branch where the branch started, not as the base branch is now', () => {
  const r = changesRepo();
  edit(r, s => s.replace(OLD, '1. Something else on main.'), r.dir);
  assert.equal(change(r), null, 'main moved on: the branch still has what it started with');
});

test('0565 AC1: a change stays counted once the base branch has been merged in', () => {
  const r = changesRepo();
  reword(r);
  r.mergeMain();
  assert.ok(change(r));
});

test('0565 AC1: merging the base branch in does not move where the branch started', () => {
  const r = changesRepo();
  r.mergeMain();
  assert.equal(change(r), null, 'a merge alone changes nothing');
});

test('0565 AC1, AC2, AC3: criteria that arrive by merging the base branch in still count as changed', () => {
  const r = changesRepo();
  edit(r, s => s.replace(OLD, '1. Criteria from main.'), r.dir);
  r.mergeMain();
  assert.match(read(r.wt, TICKET), /Criteria from main/, 'the branch took them');
  assert.ok(change(r));
  assert.equal(shown(r).criteria_changed, true);
  assert.equal(shown(r).auto_ship, false);
  assert.match(part(reviewPack(r.dir, '1')), /\| 1 \| changed \| Export button downloads a CSV\. \| Criteria from main\. \|/);
  const main = r.sha('main');
  const out = runIn(r.dir, 'ship', '1', '--auto');
  assert.equal(out.status, 12, out.stdout + out.stderr);
  assert.match(out.stderr, /acceptance criteria changed since it was set ready/);
  assert.equal(r.sha('main'), main, 'nothing shipped');
});

test('0565 AC1: a ticket with no branch, or none in the base branch where it started, has nothing to compare', () => {
  const r = changesRepo();
  assert.equal(criteriaChange(r.dir, CFG, '2'), null, 'no such branch');
  r.g('branch', 'speck/0002-new', 'main');
  gIn(r.dir, 'worktree', 'add', '-q', path.join(r.dir, '..', `${path.basename(r.dir)}-two`), 'speck/0002-new');
  assert.equal(criteriaChange(r.dir, CFG, '2'), null, 'a branch with no copy of the ticket');
  assert.equal(criteriaChange(r.dir, { ...CFG, base_branch: 'nope' }, '1'), null, 'no base branch: nothing to compare, and no stack trace');
});

test('0565 AC2: autoShipWhyNot refuses a ticket whose criteria changed, saying so, whatever else it says', () => {
  const cfg = { auto_ship: true, auto_ship_risk: ['low'] };
  assert.match(autoShipWhyNot(cfg, '0001', 'low', [], 'code', false, true), /acceptance criteria changed since it was set ready/);
  assert.equal(autoShipWhyNot(cfg, '0001', 'low', [], 'code', false, false), '');
  assert.equal(autoShipWhyNot(cfg, '0001', 'low', [], 'code'), '', 'left out: it has not changed');
});

test('0565 AC2: speck ship --auto refuses it, saying why, and nothing ships', () => {
  const r = changesRepo();
  reword(r);
  assert.equal(shown(r).auto_ship, false, 'auto_ship no longer covers it');
  const main = r.sha('main');
  const out = runIn(r.dir, 'ship', '1', '--auto');
  assert.equal(out.status, 12, out.stdout + out.stderr);
  assert.match(out.stderr, /acceptance criteria changed since it was set ready/);
  assert.equal(r.sha('main'), main, 'nothing shipped');
  assert.match(read(r.wt, TICKET), /^status: approved/m, 'still approved');
});

test('0565 AC2: speck run\'s ship queue leaves it approved', () => {
  const r = changesRepo();
  const launches = [], queue = () => shipQueue(r.dir, CFG, { say: () => {}, launch: (repo, id) => launches.push(id), waiting: () => false });
  reword(r);
  queue().check(statusData(r.dir).tickets);
  assert.deepEqual(launches, []);
  assert.match(read(r.wt, TICKET), /^status: approved/m);
});

test('0565 AC2: speck ship run by hand ships it as before', () => {
  const r = changesRepo();
  r.g('reset', '-q', '--hard', 'HEAD~2'); // main without the commit that makes the ticket's merge conflict, nor the auto_ship one
  reword(r);
  const out = runIn(r.dir, 'ship', '1');
  assert.equal(out.status, 0, out.stdout + out.stderr);
  assert.ok(fs.existsSync(path.join(r.dir, 'speck/tickets/done/0001-export-bookings.md')), 'filed as done on main');
});

test('0565 AC3: the review pack has a Criteria changed part above the criteria, with the text it was set ready with and the text now', () => {
  const r = changesRepo();
  reword(r);
  for (const pack of [reviewPack(r.dir, '1'), reviewPack(r.wt, '1')]) {
    assert.ok(pack.indexOf('### Criteria changed') > 0 && pack.indexOf('### Criteria changed') < pack.indexOf('### Acceptance criteria'), pack);
    assert.match(part(pack), /Export button downloads a CSV\./);
    assert.match(part(pack), /Export button downloads an Excel file\./);
    assert.match(part(pack), /changed/);
  }
});

test('0565 AC3: added and removed criteria each have a row, and one that only moved has none', () => {
  const r = changesRepo();
  edit(r, s => s.replace(`${OLD}\n`, '1. Brand new.\n2. Export button downloads a CSV.\n3. Also new.\n'));
  const added = part(reviewPack(r.dir, '1'));
  assert.equal(added.split('\n').filter(l => /^\| \d/.test(l)).length, 2, added);
  assert.match(added, /\| 1 \| added \| \(none\) \| Brand new\. \|/);
  assert.match(added, /\| 3 \| added \| \(none\) \| Also new\. \|/);
  const r2 = changesRepo();
  edit(r2, x => x.replace(`${OLD}\n`, ''));
  const removed = part(reviewPack(r2.dir, '1'));
  assert.match(removed, /\| 1 \| removed \| Export button downloads a CSV\. \| \(none\) \|/);
});

test('0565 AC3: a criterion over several lines or holding a pipe keeps the table whole', () => {
  const r = changesRepo();
  reword(r, '1. Exports a | b\n   over two lines.');
  const rows = part(reviewPack(r.dir, '1')).split('\n').filter(l => /^\| 1 /.test(l));
  assert.equal(rows.length, 1);
  assert.ok(rows[0].includes('Exports a \\| b over two lines.'), rows[0]);
});

test('0565 AC3: a change that touches no criterion shows the section as it was and as it is', () => {
  const r = changesRepo();
  edit(r, s => s.replace(OLD, `Read these first.\n${OLD}`));
  const got = part(reviewPack(r.dir, '1'));
  assert.match(got, /Read these first\./);
  assert.match(got, /\|\s+\| order or layout \|/);
});

test('0565 AC3: no such part when the criteria have not changed, and the plain pack has it too', () => {
  const r = changesRepo();
  assert.ok(!reviewPack(r.dir, '1').includes('Criteria changed'));
  assert.ok(!plainPack(r.dir, '1').includes('Criteria changed'));
  reword(r);
  const plain = plainPack(r.dir, '1');
  assert.ok(plain.indexOf('### Criteria changed') > plain.indexOf('### Did it do what was asked?'), plain);
  assert.match(part(plain), /Excel file/);
});

test('0565 AC4: speck status --json gives criteria_changed true or false', () => {
  const r = changesRepo();
  assert.equal(shown(r).criteria_changed, false);
  reword(r);
  assert.equal(shown(r).criteria_changed, true);
  const out = runIn(r.dir, 'status', '--json');
  assert.equal(JSON.parse(out.stdout).tickets.find(t => t.id === '0001').criteria_changed, true, 'from the CLI');
});

const ago = s => new Date(Date.now() - s * 1000).toISOString();
const approved = o => T('0701', 'approved', { started: ago(900), approved: ago(60), rounds: [round(1, 10)], build_exit: { at: ago(30), code: 0 }, auto_ship: false, ...o });
const page = async t => {
  const p = fakePage([], { fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify({ tickets: [t], ideas: [], run: { on: true } }))) }) });
  await p.settle();
  return p;
};
const words = (p, n) => [n, ...p.all(n)].map(x => [x.attrs?.['aria-label'], x._text].join(' ')).join(' ');

const tip = (p, n) => [n, ...p.all(n)].map(x => x.title).join(' ');

test('0565 AC4: the Build row of an approved ticket whose criteria changed says it waits for you because of that, and so does its full view', async () => {
  const p = await page(approved({ criteria_changed: true }));
  assert.match(tip(p, queueRows(p)[0]), /waiting for you because a criterion changed/);
  assert.match((await fullViewOf(p, '0701')).textContent, /waits for you to ship it because a criterion changed/);
});

test('0565 AC4: a task\'s Build row says so too, and an unchanged ticket\'s does not', async () => {
  const task = await page(approved({ criteria_changed: true, kind: 'task' }));
  assert.match(tip(task, queueRows(task)[0]), /because a criterion changed/);
  const same = await page(approved({ criteria_changed: false }));
  assert.ok(!/criterion changed/.test(words(same, queueRows(same)[0]) + tip(same, queueRows(same)[0])));
  assert.ok(!/criterion changed/.test((await fullViewOf(same, '0701')).textContent));
  const old = await page(approved({})); // from an older speck status, with no such field
  assert.ok(!/criterion changed/.test(words(old, queueRows(old)[0]) + tip(old, queueRows(old)[0])));
});
