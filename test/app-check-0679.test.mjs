import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { gitEnv } from './support/panel.mjs';
import { CHECK, blocked, checking } from './support/app-check.mjs';
import { OPTION } from './support/blocked.mjs';
import { runIn, gIn } from './support/ship.mjs';
import { read, TICKET } from './support/merge-rounds.mjs';
import { changesRepo } from './support/changes.mjs';
import { statusData } from '../scripts/speck.mjs';
import { readActions } from '../scripts/foreman-agent.mjs';
import { leftChecks, checkBrief } from '../scripts/app-check.mjs';
import { choseCount } from '../scripts/go-with.mjs';
import { autoShipWhyNot } from '../scripts/ship.mjs';
import { shipQueue } from '../scripts/ship-queue.mjs';
import { reviewPack, plainPack } from '../scripts/pack.mjs';

Object.assign(process.env, gitEnv); // speck watch commits in this process

// ---------- 0679: carry on when speck can't do a check in the app itself ----------

const COULDNT = 'It asks how the alert sounds, and I have no speakers';
const LEFT = `- Went with the recommendation: ${OPTION} (chosen by speck, as watch is decide, 2026-11-11 14:00 UTC). Left for you to check in the app: ${CHECK}. Couldn't check it: ${COULDNT}.`;
const refusals = (r, a, ...args) => {
  const head = r.head(), ticket = r.ticket();
  assert.throws(() => a.act('leave', '0001', ...args), err => { assert.match(err.message, /nothing was changed|waits for the user|only/); return true; });
  assert.equal(r.head(), head, 'nothing committed');
  assert.equal(r.ticket(), ticket, 'the ticket is unchanged');
  assert.deepEqual(readActions(r.runs), []);
};

test('0679 AC1: with watch: decide, leave goes with the recommendation, sets the ticket building and notes the check as left for you', () => {
  const { r, a } = checking();
  a.check();
  assert.match(a.act('leave', '0001', '--saw', COULDNT), /left for the user/);
  assert.ok(r.ticket().split('\n').includes(LEFT), r.ticket());
  assert.match(r.ticket(), /^status: building$/m);
  assert.deepEqual(readActions(r.runs).map(x => [x.action, x.text]), [['leave', OPTION]]);
  const t = statusData(r.dir).tickets.find(x => x.id === '0001');
  assert.deepEqual(t.foreman_took.map(w => w.option), [OPTION], 'read as a call speck made');
  a.end(); a.check(blocked({ status: 'building' })); // the agent has ended: speck run resumes the build with the recommendation
  assert.equal(a.resumed.length, 1, 'its build is resumed');
  const message = a.resumed[0].argv.find(w => w.includes('speck (watch: decide)'));
  assert.ok(message?.includes(OPTION) && /left for the user/.test(message), a.resumed[0].argv.join(' '));
});

test('0679 AC1: leave takes --saw= too, and the recommendation when it is named, but no other option', () => {
  const { r, a } = checking();
  a.check();
  refusals(r, a, 'A, remove it', `--saw=${COULDNT}`);
  a.act('leave', '0001', OPTION, `--saw=${COULDNT}`, '--why=No speakers here');
  assert.ok(r.ticket().split('\n').includes(LEFT), r.ticket());
});

test('0679 AC1: a leave counts towards the 3 recommendations speck may take, and is refused once it has taken 3', () => {
  assert.equal(choseCount([LEFT]), 1);
  const { r, a } = checking();
  const took = [1, 2, 3].map(n => `- Went with the recommendation: Option ${n} (chosen by speck, as watch is decide, 2026-11-1${n} 10:00 UTC).`).join('\n');
  fs.writeFileSync(r.file, r.ticket().replace('- A note.', `- A note.\n${took}`)); r.g('commit', '-qam', 'three taken');
  a.check();
  refusals(r, a, '--saw', COULDNT);
});

test('0679 AC1: leave refuses where decide refuses: watch fix, high risk, no recommendation, and needs --saw', () => {
  { const { r, a } = checking({ watch: 'fix' }); a.check(); refusals(r, a, '--saw', COULDNT); assert.throws(() => a.act('leave', '0001', '--saw', COULDNT), /speck watch leave works only with watch: decide/); }
  { const { r, a } = checking(); a.check(); fs.writeFileSync(r.file, r.ticket().replace(/^risk: .*$/m, 'risk: high')); r.g('commit', '-qam', 'high'); refusals(r, a, '--saw', COULDNT); }
  { const { r, a } = checking({ question: `Should the old test go?\nCheck in the app: ${CHECK}` }); a.check(); refusals(r, a, '--saw', COULDNT); }
  { const { r, a } = checking(); a.check(); refusals(r, a, '--why=No speakers'); }
});

test('0679 AC1: leave is only for a check in the app', () => {
  const { r, a } = checking();
  a.check();
  const head = r.head();
  assert.throws(() => a.act('resume', '0001', 'carry on', `--saw=${COULDNT}`, '--why=x'), /Use decide or ask, or leave/);
  assert.equal(r.head(), head);
});

test('0679 AC1, AC4: the check brief names speck watch leave only with watch: decide and a recommendation', () => {
  const check = { question: 'Q?', line: CHECK, recommendation: OPTION };
  assert.match(checkBrief({ id: '0001', check, skill: 's', watch: 'decide' }), /speck\.mjs watch leave 0001 --saw=/);
  assert.doesNotMatch(checkBrief({ id: '0001', check, skill: 's', watch: 'fix' }), /watch leave/);
  assert.doesNotMatch(checkBrief({ id: '0001', check: { ...check, recommendation: '' }, skill: 's', watch: 'decide' }), /watch leave/);
});

test('0679 AC3: the checks left for you are read from the Notes, and auto-ship gives them as its reason', () => {
  assert.deepEqual(leftChecks(['- A note.', LEFT, LEFT.replace(CHECK, 'Play the alert on a phone')]), [CHECK, 'Play the alert on a phone']);
  assert.deepEqual(leftChecks([`- Went with the recommendation: ${OPTION} (chosen by speck, as watch is decide, 2026-11-11 14:00 UTC). Checked in the app: ${CHECK}. Saw: fine.`]), []);
  const cfg = { auto_ship: true, auto_ship_risk: ['low'] };
  assert.equal(autoShipWhyNot(cfg, '0001', 'low', [], 'code', false, false, '', [CHECK]), `ticket 0001 waits for you to check in the app: ${CHECK}`);
  assert.equal(autoShipWhyNot(cfg, '0001', 'low', [], 'code', false, false, '', []), '');
});

// changesRepo's approved ticket, with a check left for you in its Notes.
function leftRepo() {
  const r = changesRepo();
  fs.writeFileSync(path.join(r.wt, TICKET), read(r.wt, TICKET).replace(/^## Review log$/m, `## Notes\n${LEFT}\n\n## Review log`));
  gIn(r.wt, 'commit', '-qam', 'a check left for you');
  return r;
}

test('0679 AC3: auto-ship leaves a ticket with a check left for you approved, giving the check as its reason', () => {
  const r = leftRepo();
  const shown = statusData(r.dir).tickets.find(t => t.id === '0001');
  assert.equal(shown.auto_ship, false);
  assert.match(shown.auto_ship_why, new RegExp(`check in the app: ${CHECK}`));
  const launches = [];
  shipQueue(r.dir, { base_branch: 'main', branch_prefix: 'speck/' }, { say: () => {}, launch: (repo, id) => launches.push(id), waiting: () => false }).check(statusData(r.dir).tickets);
  assert.deepEqual(launches, []);
  const main = r.sha('main');
  const out = runIn(r.dir, 'ship', '1', '--auto');
  assert.equal(out.status, 12, out.stdout + out.stderr);
  assert.ok(out.stderr.includes(CHECK), out.stderr);
  assert.equal(r.sha('main'), main, 'nothing shipped');
  assert.match(read(r.wt, TICKET), /^status: approved/m);
});

test('0679 AC3: the review pack lists each check left for you above its changes', () => {
  const r = leftRepo();
  for (const pack of [reviewPack(r.dir, '1'), plainPack(r.dir, '1')]) {
    const at = pack.indexOf('### Left for you to check in the app');
    assert.ok(at > 0, pack);
    assert.ok(pack.indexOf(`- ${CHECK}`, at) > at, pack);
  }
  const full = reviewPack(r.dir, '1');
  assert.ok(full.indexOf('### Left for you to check in the app') < full.indexOf('### Risk'), 'above its changes');
  assert.ok(!reviewPack(changesRepo().dir, '1').includes('Left for you'), 'none without one');
});

test('0679 AC3: speck ship run by you ships it', () => {
  const r = changesRepo();
  r.g('reset', '-q', '--hard', 'HEAD~2'); // main without the commit that makes the ticket's merge conflict, nor the auto_ship one
  fs.writeFileSync(path.join(r.wt, TICKET), read(r.wt, TICKET).replace(/^## Review log$/m, `## Notes\n${LEFT}\n\n## Review log`));
  gIn(r.wt, 'commit', '-qam', 'a check left for you');
  const out = runIn(r.dir, 'ship', '1');
  assert.equal(out.status, 0, out.stdout + out.stderr);
  assert.ok(fs.existsSync(path.join(r.dir, 'speck/tickets/done/0001-export-bookings.md')), 'filed as done on main');
});

test('0679 AC4: the brief describes leave in its speck watch row and its paragraph on checks in the app', () => {
  const brief = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
  assert.ok(brief.includes('`leave <id> --saw "<why it couldn\'t make the check>"`'), 'the speck watch row names it');
  assert.ok(brief.includes('`speck watch leave <id> --saw "<why it couldn\'t make the check>"`'), 'the paragraph on checks in the app names it');
  assert.ok(!brief.includes('never taken unchecked'));
  const skill = fs.readFileSync(new URL('../skills/speck-watch/SKILL.md', import.meta.url), 'utf8');
  assert.ok(skill.includes('speck watch leave <id> --saw='));
});
