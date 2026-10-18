// 0295: pull request mode. With ship_mode: pr, an approved ticket gets a GitHub pull request, opened with gh, instead
// of being merged locally.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseYaml, loadConfig, parseTicket } from '../scripts/core.mjs';
import { checkConfigValue } from '../scripts/config.mjs';
import { panelSettings } from '../scripts/settings.mjs';
import { plainPack } from '../scripts/pack.mjs';
import { statusData } from '../scripts/speck.mjs';
import { openAndKeep, prShown, readPrRecord } from '../scripts/pull-request.mjs';
import { prQueue } from '../scripts/pr-queue.mjs';
import { shipRepo, gIn, env, BRANCH } from './support/ship.mjs';
import { speck } from './support/cli.mjs';
import { prRepo, TICKET, runs } from './support/pr.mjs';
import { fakePage, T, queueRows, gitEnv } from './support/panel.mjs';

Object.assign(process.env, gitEnv); // the commits speck makes when the tests call it directly

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The ticket back to reviewing, as it is before speck close, with the sections close writes.
function toReviewing(r) {
  const file = path.join(r.wt, TICKET);
  fs.writeFileSync(file, `${fs.readFileSync(file, 'utf8').replace(/^status: approved/m, 'status: reviewing')}\n## Review log\n\n## Delivery log\n`);
  assert.equal(gIn(r.wt, 'commit', '-qam', 'reviewing').status, 0);
}

// ---------- AC1: the setting ----------

test('0295 AC1: ship_mode takes local or pr, and speck config set accepts it', () => {
  assert.equal(checkConfigValue('ship_mode', 'local'), 'local');
  assert.equal(checkConfigValue('ship_mode', 'pr'), 'pr');
  for (const bad of ['', 'PR', 'merge', 'constructor']) assert.throws(() => checkConfigValue('ship_mode', bad), /ship_mode must be local or pr/);
  const r = shipRepo();
  r.g('checkout', '-q', 'main');
  const set = speck(r.dir, env, 'config', 'set', 'ship_mode', 'pr');
  assert.equal(set.status, 0, set.stderr);
  assert.equal(loadConfig(r.dir).ship_mode, 'pr');
  const refused = speck(r.dir, env, 'config', 'set', 'ship_mode', 'github');
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /ship_mode must be local or pr/);
  assert.doesNotMatch(refused.stderr, /\n\s+at /);
});

test('0295 AC1: the config template has ship_mode, local by default, with a comment', () => {
  const text = fs.readFileSync(path.join(ROOT, 'templates', 'config.yml'), 'utf8');
  assert.equal(parseYaml(text).ship_mode, 'local');
  assert.match(text, /^ship_mode: local +# .*\bpr\b/m);
});

test('0295 AC1: the Settings view offers ship_mode, local or pr, with an explanation', () => {
  const r = shipRepo();
  const s = panelSettings(r.dir).groups.flatMap(g => g.settings).find(x => x.key === 'ship_mode');
  assert.ok(s, 'ship_mode is in the Settings view');
  assert.equal(s.value, 'local');
  assert.equal(s.editable, true);
  assert.deepEqual(s.choices, ['local', 'pr']);
  assert.match(s.explain, /pull request/);
});

// ---------- AC2: opening the pull request ----------

test('0295 AC2: speck pushes the approved branch and opens a pull request into the base branch, with the plain pack', () => {
  const r = prRepo();
  const pack = plainPack(r.dir, '1');
  const pr = openAndKeep(r.dir, r.cfg, '1', { gh: r.gh.gh });
  assert.equal(pr.url, 'https://github.com/o/r/pull/1');
  assert.equal(pr.found, false);
  const create = r.gh.calls().find(c => c.args[0] === 'pr' && c.args[1] === 'create');
  const opt = k => create.args[create.args.indexOf(k) + 1];
  assert.equal(opt('--base'), 'main');
  assert.equal(opt('--head'), BRANCH);
  assert.equal(opt('--title'), '0001 · Export bookings');
  assert.equal(create.body.trim(), pack.trim());
  // The link is kept on the ticket, committed on its branch, and the remote branch has that commit too.
  assert.equal(r.ticketIn(r.wt).fm.pull_request, pr.url);
  assert.equal(r.g('status', '--porcelain'), '');
  assert.equal(gIn(r.wt, 'status', '--porcelain').stdout, '');
  assert.equal(r.remoteHas(`${BRANCH}^1`), r.sha(BRANCH), 'pushed with the commit filing it as done on top (0315)');
  assert.equal(r.remoteHas('main'), r.sha('main'), 'main is as it was');
  assert.equal(r.ticketIn(r.wt).fm.status, 'approved');
  assert.deepEqual(statusData(r.dir).tickets.find(t => t.id === '0001').pull_request, { url: pr.url, error: null });
});

test('0295 AC2: speck close opens the pull request once the ticket is approved', () => {
  const r = prRepo();
  toReviewing(r);
  const closed = r.cli(r.wt, 'close', '1');
  assert.equal(closed.status, 0, closed.stderr);
  assert.match(closed.stdout, /Opened its pull request: https:\/\/github\.com\/o\/r\/pull\/1/);
  assert.equal(r.ticketIn(r.wt).fm.status, 'approved');
  assert.equal(r.ticketIn(r.wt).fm.pull_request, 'https://github.com/o/r/pull/1');
  assert.equal(r.remoteHas(`${BRANCH}^1`), r.sha(BRANCH), 'pushed with the commit filing it as done on top (0315)');
});

test('0295 AC2: the panel shows the ticket\'s pull request in its review pack, opening on GitHub', async () => {
  const url = 'https://github.com/o/r/pull/7';
  const p = await openPack({ url, error: null });
  const link = p.all(p.byId('full-ticket')).find(n => n.tagName === 'a' && n.href === url);
  assert.ok(link, 'the link is shown');
  assert.equal(link.textContent, url);
  assert.equal(link.target, '_blank');
});

test('0295 AC2: a branch changed since the reviewer approved it, or without an approving review, gets no pull request', () => {
  const changed = prRepo();
  fs.writeFileSync(path.join(changed.wt, 'shared.txt'), 'unreviewed\n');
  assert.equal(gIn(changed.wt, 'commit', '-qam', 'after approval').status, 0);
  const unreviewed = prRepo();
  const file = path.join(unreviewed.wt, TICKET);
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/\n## Review rounds[\s\S]*$/, '\n'));
  assert.equal(gIn(unreviewed.wt, 'commit', '-qam', 'no rounds').status, 0);
  for (const [r, said] of [[changed, /These files changed after the reviewer approved: shared\.txt/], [unreviewed, /The review loop says "review", not "ship"/]]) {
    assert.throws(() => openAndKeep(r.dir, r.cfg, '1', { gh: r.gh.gh }), e => said.test(e.message));
    assert.equal(r.remoteHas(BRANCH), '', 'nothing pushed');
    assert.deepEqual(r.gh.calls(), [], 'gh never asked');
    assert.match(statusData(r.dir).tickets.find(t => t.id === '0001').pull_request.error, said);
  }
});

test('0295 AC2: the link is written on the ticket even when its branch isn\'t checked out anywhere', () => {
  const r = prRepo();
  assert.equal(r.g('worktree', 'remove', r.wt), '');
  const pr = openAndKeep(r.dir, r.cfg, '1', { gh: r.gh.gh });
  assert.equal(parseTicket(r.g('show', `${BRANCH}:${TICKET}`)).fm.pull_request, pr.url);
  assert.equal(r.g('worktree', 'list', '--porcelain').split('\n').filter(l => l.startsWith('worktree ')).length, 1, 'the temporary worktree is gone');
  assert.equal(r.remoteHas(`${BRANCH}^1`), r.sha(BRANCH), 'pushed with the commit filing it as done on top (0315)');
  assert.equal(r.g('branch', '--show-current'), 'main');
});

test('0295 AC2: a link that couldn\'t be written on the ticket is shown with why, and written when tried again', () => {
  const r = prRepo();
  r.hook('exit 1', 'pre-commit');
  assert.throws(() => openAndKeep(r.dir, r.cfg, '1', { gh: r.gh.gh }), e => e.opened === true && /^Opened 0001's pull request, https:\/\/github\.com\/o\/r\/pull\/1, but couldn't write its link on the ticket/.test(e.message));
  const shown = statusData(r.dir).tickets.find(t => t.id === '0001').pull_request;
  assert.equal(shown.url, 'https://github.com/o/r/pull/1');
  assert.match(shown.error, /couldn't write its link on the ticket/);
  assert.equal(r.ticketIn(r.wt).fm.pull_request, undefined);
  assert.equal(gIn(r.wt, 'status', '--porcelain').stdout, '', 'the ticket is put back');
  fs.rmSync(path.join(r.dir, '.git', 'hooks', 'pre-commit'));
  const again = openAndKeep(r.dir, r.cfg, '1', { gh: r.gh.gh });
  assert.equal(again.found, true);
  assert.equal(r.ticketIn(r.wt).fm.pull_request, again.url);
  assert.deepEqual(statusData(r.dir).tickets.find(t => t.id === '0001').pull_request, { url: again.url, error: null });
  assert.equal(r.gh.prs().length, 1);
});

test('0295 AC4: speck run tries again a ticket whose link isn\'t on it yet', () => {
  const r = prRepo();
  const launched = [];
  const q = prQueue(r.dir, r.cfg, { say: () => {}, launch: (repo, id, log, done) => { launched.push(id); done(0); } });
  q.check([{ id: '0001', status: 'approved', build_running: false, pull_request: { url: 'https://github.com/o/r/pull/1', error: "Opened it, but couldn't write its link on the ticket." } }]);
  assert.deepEqual(launched, ['0001']);
});

// ---------- AC3: opening it again ----------

test('0295 AC3: opening it again finds the existing pull request instead of making a second one', () => {
  const r = prRepo();
  const first = openAndKeep(r.dir, r.cfg, '1', { gh: r.gh.gh });
  const again = openAndKeep(r.dir, r.cfg, '1', { gh: r.gh.gh });
  assert.equal(again.url, first.url);
  assert.equal(again.found, true);
  assert.equal(r.gh.prs().length, 1);
  assert.equal(r.gh.calls().filter(c => c.args[1] === 'create').length, 1);
  const cli = r.cli(r.dir, 'pr', '1');
  assert.equal(cli.status, 0, cli.stderr);
  assert.match(cli.stdout, /0001 already has a pull request: https:\/\/github\.com\/o\/r\/pull\/1\.$/m);
  assert.equal(r.gh.prs().length, 1);
});

test('0295 AC3: a pull request opened some other way, or already merged, is found too', () => {
  for (const state of ['OPEN', 'MERGED']) {
    const r = prRepo();
    r.gh.set('prs.json', [{ url: 'https://github.com/o/r/pull/9', state, head: BRANCH, base: 'main' }]);
    const pr = openAndKeep(r.dir, r.cfg, '1', { gh: r.gh.gh });
    assert.equal(pr.url, 'https://github.com/o/r/pull/9');
    assert.equal(r.gh.calls().filter(c => c.args[1] === 'create').length, 0, state);
  }
  const r = prRepo();
  r.gh.set('prs.json', [{ url: 'https://github.com/o/r/pull/9', state: 'CLOSED', head: BRANCH, base: 'main' }]);
  assert.equal(openAndKeep(r.dir, r.cfg, '1', { gh: r.gh.gh }).url, 'https://github.com/o/r/pull/2', 'a closed one is not reused');
});

// ---------- AC4: when it can't be opened ----------

function refusedAlone(r, gh, said) {
  const before = { main: r.sha('main'), branch: r.sha(BRANCH), remoteMain: r.remoteHas('main') };
  assert.throws(() => openAndKeep(r.dir, r.cfg, '1', { gh }), e => said.test(e.message) && !e.message.includes('\n'));
  assert.deepEqual({ main: r.sha('main'), branch: r.sha(BRANCH), remoteMain: r.remoteHas('main') }, before, 'nothing merged or committed');
  assert.equal(r.ticketIn(r.wt).fm.status, 'approved');
  const shown = statusData(r.dir).tickets.find(t => t.id === '0001').pull_request;
  assert.equal(shown.url, null);
  assert.match(shown.error, said);
}

test('0295 AC4: gh not installed, not signed in, or refusing leaves the ticket approved, with why in one line', () => {
  refusedAlone(prRepo(), path.join(os.tmpdir(), 'no-such-dir', 'gh'), /gh, GitHub's command line tool, isn't installed/);
  const signedOut = prRepo();
  signedOut.gh.set('auth', 'no');
  refusedAlone(signedOut, signedOut.gh.gh, /gh isn't signed in to GitHub.*gh auth login/);
  const refusing = prRepo();
  refusing.gh.set('create', 'fail');
  refusedAlone(refusing, refusing.gh.gh, /gh couldn't open 0001's pull request: pull request create failed/);
});

test('0295 AC4: speck close in pull request mode still approves when gh fails, saying why', () => {
  const r = prRepo();
  r.gh.set('auth', 'no');
  toReviewing(r);
  const main = r.sha('main');
  const closed = r.cli(r.wt, 'close', '1');
  assert.equal(closed.status, 0, closed.stderr);
  assert.match(closed.stdout, /^No pull request yet: gh isn't signed in to GitHub.*The ticket stays approved and nothing was merged\./m);
  assert.equal(r.ticketIn(r.wt).fm.status, 'approved');
  assert.equal(r.sha('main'), main);
});

test('0295 AC4: speck ship merges nothing in pull request mode until the ticket has a pull request', () => {
  const r = prRepo();
  const before = r.snapshot();
  const shipped = r.cli(r.dir, 'ship', '1');
  assert.notEqual(shipped.status, 0);
  assert.match(shipped.stderr, /0001 has no open or merged pull request.*speck pr 0001.*Nothing was changed\./); // 0296: with one, it merges it
  assert.deepEqual(r.snapshot(), before);
});

test('0295 AC4: speck run says in one line why a pull request wasn\'t opened, and tries again only after a new commit', () => {
  const r = prRepo();
  const said = [], launched = [];
  const q = prQueue(r.dir, r.cfg, { say: l => said.push(l), launch: (repo, id, log, done) => {
    launched.push(id);
    fs.writeFileSync(path.join(runs(r.dir), `${id}.pr.json`), JSON.stringify({ error: "gh isn't signed in to GitHub, so speck couldn't open 0001's pull request." }));
    done(1);
  } });
  const tickets = () => [{ id: '0001', status: 'approved', build_running: false, pull_request: null }];
  q.check(tickets());
  q.check(tickets());
  assert.deepEqual(launched, ['0001'], 'not tried again with nothing new');
  const line = said.find(l => /wasn't opened/.test(l));
  assert.match(line, /^0001's pull request wasn't opened: gh isn't signed in to GitHub/);
  assert.ok(!line.includes('\n'), 'one line');
  fs.writeFileSync(path.join(r.wt, 'new.txt'), 'x');
  gIn(r.wt, 'add', 'new.txt'); gIn(r.wt, 'commit', '-qm', 'new');
  q.check(tickets());
  assert.deepEqual(launched, ['0001', '0001'], 'tried again after a new commit');
  q.check([{ id: '0001', status: 'approved', build_running: false, pull_request: { url: 'https://github.com/o/r/pull/1', error: null } }, { id: '0002', status: 'reviewing' }]);
  assert.equal(launched.length, 2, 'one with a pull request, or not approved, is left alone');
});

test('0295 AC4: speck run reports the pull request it opened', () => {
  const r = prRepo();
  const said = [];
  const q = prQueue(r.dir, r.cfg, { say: l => said.push(l), launch: (repo, id, log, done) => {
    fs.writeFileSync(path.join(runs(r.dir), `${id}.pr.json`), JSON.stringify({ url: 'https://github.com/o/r/pull/3' }));
    done(0);
  } });
  q.check([{ id: '0001', status: 'approved', build_running: false, pull_request: null }]);
  assert.ok(said.includes('Opened 0001\'s pull request: https://github.com/o/r/pull/3'), said.join('\n'));
});

test('0295 AC4: the panel says why the pull request couldn\'t be opened', async () => {
  const p = await openPack({ url: null, error: "gh isn't signed in to GitHub, so speck couldn't open 0005's pull request." });
  const line = p.all(p.byId('full-ticket')).find(n => n.className === 'ship-said bad' && /No pull request yet/.test(n.textContent));
  assert.ok(line, 'the reason is shown');
  assert.equal(line.textContent, "No pull request yet: gh isn't signed in to GitHub, so speck couldn't open 0005's pull request.");
});

// ---------- AC5: local mode ----------

test('0295 AC5: with local, close approves as before and gh is never run', () => {
  const r = prRepo({ mode: 'local' });
  toReviewing(r);
  const closed = r.cli(r.wt, 'close', '1');
  assert.equal(closed.status, 0, closed.stderr);
  assert.match(closed.stdout, /^0001 approved, committed as speck\(0001\): approved\. Next: speck ship 0001 --auto/);
  assert.deepEqual(r.gh.calls(), []);
  assert.equal(r.remoteHas(BRANCH), '', 'the branch isn\'t pushed');
  assert.equal(statusData(r.dir).tickets.find(t => t.id === '0001').pull_request, null);
  const pr = r.cli(r.dir, 'pr', '1');
  assert.notEqual(pr.status, 0);
  assert.match(pr.stderr, /ship_mode is local, so speck opens no pull requests/);
  assert.deepEqual(r.gh.calls(), []);
});

test('0295 AC5: with local, speck ship still merges', () => {
  const r = prRepo({ mode: 'local' });
  const shipped = r.cli(r.dir, 'ship', '1');
  assert.equal(shipped.status, 0, shipped.stderr);
  assert.ok(fs.existsSync(path.join(r.dir, 'speck', 'tickets', 'done', '0001-export-bookings.md')));
  assert.deepEqual(r.gh.calls(), []);
  assert.equal(readPrRecord(runs(r.dir), '1'), null);
  assert.equal(prShown(runs(r.dir), '1', {}), null);
});

// ---------- the panel's review pack ----------

const PACK = ['## 0005 · Ticket 0005', '**Verdict:** ✅ Approved by reviewer', '', '_Generated by speck. The merge decision is yours._'].join('\n');
async function openPack(pull_request) {
  const state = { ideas: [], tickets: [T('0005', 'approved', { started: new Date(Date.now() - 60000).toISOString(), pull_request })] };
  const p = fakePage([structuredClone(state), { text: '', truncated: false }, { pack: PACK }, structuredClone(state)]);
  await p.settle();
  const row = () => queueRows(p).find(n => n.textContent.includes('0005'));
  p.press(row().children.find(n => n.className === 'top'));
  await p.settle();
  p.press(p.all(row()).find(n => n.tagName === 'button' && n.textContent === 'Review pack'));
  await p.settle();
  return p;
}
