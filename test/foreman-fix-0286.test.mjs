import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fakePage, T, panelRepo, gitEnv, ROOT } from './support/panel.mjs';
import { OPTION, QUESTION, blockedRepo } from './support/blocked.mjs';
import { statusData, loadConfig, parseYaml } from '../scripts/speck.mjs';
import { checkConfigValue } from '../scripts/config.mjs';
import { panelSettings, panelSaveSettings } from '../scripts/settings.mjs';
import { foremanView, fixingOf } from '../scripts/foreman.mjs';
import { foremanFixQueue } from '../scripts/foreman-fix.mjs';
import { goWithMessage, goWithQueue } from '../scripts/go-with.mjs';

Object.assign(process.env, gitEnv); // goWith commits in this process

// ---------- 0286: let the Foreman clear technical blocked questions ----------

const WORDS = ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'];
const CFG = { base_branch: 'main', branch_prefix: 'speck/' };
const ticketOf = r => statusData(r.dir).tickets.find(t => t.id === '0001');
const recordOf = r => JSON.parse(fs.readFileSync(r.record, 'utf8'));

// One check of speck run as tick() makes it: the Foreman's choices, then goWithQueue's resumes. Returns what started
// and what was said.
function runCheck(r, fixing, { said = [], started = [], queue = null } = {}) {
  const fixes = queue || foremanFixQueue({ repo: r.dir, readConfig: () => ({ ...loadConfig(r.dir), foreman_fixing: fixing }), say: m => said.push(m) });
  const running = new Set();
  const goWiths = goWithQueue({ repo: r.dir, cfg: CFG, words: WORDS, max: 1, running,
    startBuild: (id, argv, cwd, session, flags, record) => { started.push({ id, argv, rec: JSON.parse(record(4242)) }); running.add(id); },
    saveRecord: (f, rec) => fs.writeFileSync(f, JSON.stringify(rec)), resumeHint: () => '', runs: () => r.runs });
  const tickets = statusData(r.dir).tickets;
  fixes.check(tickets);
  goWiths.check(tickets);
  return { said, started, queue: fixes };
}

test('0286 AC1: foreman_fixing is in the config template, tell, with a comment, and speck reads tell when it is missing or unknown', () => {
  const text = fs.readFileSync(path.join(ROOT, 'templates', 'config.yml'), 'utf8');
  assert.match(text, /^foreman_fixing: tell +# .*off.*tell.*fix/m);
  assert.equal(parseYaml(text).foreman_fixing, 'tell');
  assert.equal(fixingOf({}), 'tell');
  assert.equal(fixingOf({ foreman_fixing: 'constructor' }), 'tell');
  assert.equal(fixingOf({ foreman_fixing: 'fix' }), 'fix');
});

test('0286 AC1: speck config set accepts off, tell and fix for foreman_fixing, and refuses anything else', () => {
  for (const v of ['off', 'tell', 'fix']) assert.equal(checkConfigValue('foreman_fixing', v), v);
  for (const v of ['', 'on', 'FIX', 'true']) assert.throws(() => checkConfigValue('foreman_fixing', v), /foreman_fixing must be off, tell, fix/);
  const r = panelRepo();
  const out = r.run('config', 'set', 'foreman_fixing', 'fix');
  assert.equal(out.status, 0, out.stderr);
  assert.equal(loadConfig(r.dir).foreman_fixing, 'fix');
});

test('0286 AC1: the settings give foreman_fixing in a Foreman group, explained, picked from off, tell and fix, and the panel saves it', () => {
  const r = panelRepo();
  const g = panelSettings(r.dir).groups.find(x => x.title === 'Foreman');
  const s = g.settings.find(x => x.key === 'foreman_fixing');
  assert.equal(s.value, 'tell');
  assert.equal(s.editable, true);
  assert.deepEqual(s.choices, ['off', 'tell', 'fix']);
  assert.match(s.explain, /fix/);
  assert.equal(panelSaveSettings(r.dir, [{ key: 'foreman_fixing', value: 'fix' }]).status, 200);
  assert.equal(loadConfig(r.dir).foreman_fixing, 'fix');
  assert.equal(panelSaveSettings(r.dir, [{ key: 'foreman_fixing', value: 'always' }]).status, 422);
});

test('0286 AC1: the Settings view shows foreman_fixing in its Foreman group, under the speck run switch, with its explanation', async () => {
  const settings = { groups: [
    { title: 'Foreman', settings: [{ key: 'foreman_fixing', value: 'tell', default: true, explain: 'What the Foreman does.', editable: true, choices: ['off', 'tell', 'fix'] }] },
    { title: 'Shipping', settings: [{ key: 'auto_ship', value: false, default: true, explain: 'Ships.' }] },
  ] };
  const fetch = async url => ({ ok: true, status: 200, json: async () => (String(url).startsWith('/api/settings') ? settings : { tickets: [], ideas: [] }) });
  const p = fakePage([], { fetch });
  await p.settle();
  p.press(p.byId('settings-open'));
  await p.settle();
  const groups = p.byId('settings').children.filter(n => n.className === 'sgroup');
  assert.equal(groups.filter(n => n.textContent.startsWith('Foreman')).length, 1, 'one Foreman group');
  const foreman = groups[0];
  assert.ok(foreman.textContent.startsWith('Foreman'), 'first');
  assert.ok(p.all(foreman).some(n => n.id === 'run-switch'), 'with the speck run switch');
  const pick = p.all(foreman).find(n => n.tagName === 'select' && n.attrs['aria-label'] === 'foreman_fixing');
  assert.ok(pick, 'a list to pick from');
  assert.deepEqual(p.all(pick).filter(n => n.tagName === 'option').map(o => o.value), ['off', 'tell', 'fix']);
  assert.ok(p.all(foreman).some(n => n.className === 'explain' && n.textContent === 'What the Foreman does.'), 'explained');
  assert.ok(!p.all(groups[1]).some(n => n.attrs?.['aria-label'] === 'foreman_fixing'), 'not in another group');
});

test('0286 AC2: with fix, speck run takes the recommendation on its check, notes that the Foreman chose it and resumes the build saying so', () => {
  const r = blockedRepo();
  const { said, started } = runCheck(r, 'fix');
  const text = r.ticket();
  assert.match(text, /^status: building$/m);
  assert.match(text, new RegExp(`- Went with the recommendation: ${OPTION} \\(chosen by the Foreman, as foreman_fixing is fix, \\d{4}-\\d\\d-\\d\\d \\d\\d:\\d\\d UTC\\)\\.`));
  assert.match(r.g('log', '-1', '--format=%s'), /^speck\(0001\): go with the recommendation$/);
  assert.equal(started.length, 1, 'resumed in the same check');
  assert.deepEqual(started[0].argv, ['claude', '-p', goWithMessage('0001', OPTION, '/speck-build', 'foreman'), '--resume', 'sess-1']);
  assert.match(started[0].argv[2], /^The Foreman \(foreman_fixing: fix\) chose the recommended option/);
  assert.equal(started[0].rec.went_with.by, 'foreman');
  assert.ok(said.some(m => /0001: the Foreman went with its recommendation/.test(m)));
});

test('0286 AC3: a question that changes what you\'d notice, is a close call or has any fact unknown is left for you, even with fix', () => {
  const cases = [
    QUESTION.replace("notice: no", 'notice: yes'),
    QUESTION.replace('winner: yes', 'winner: no'),
    QUESTION.replace(/^Recommended:.*\n/m, ''),
    QUESTION.replace(/^Changes what.*\n/m, ''),
    QUESTION.replace(/\nClear winner: yes$/, ''),
    'Should the old test be removed (A) or kept and fixed (B)?',
  ];
  for (const question of cases) {
    const r = blockedRepo({ question });
    const before = r.ticket(), head = r.head();
    const { started } = runCheck(r, 'fix');
    assert.equal(r.ticket(), before, question);
    assert.equal(r.head(), head, 'nothing committed');
    assert.equal(started.length, 0);
    assert.equal(Object.hasOwn(recordOf(r), 'go_with'), false);
    assert.equal(ticketOf(r).status, 'blocked');
  }
});

test('0286 AC4: the Foreman takes a ticket\'s recommendation once; when it blocks again, it\'s left for you, said once', () => {
  const r = blockedRepo();
  const first = runCheck(r, 'fix');
  assert.equal(first.started.length, 1);
  // The resumed build blocks again with another clear, technical question.
  fs.writeFileSync(r.file, r.ticket().replace(/^status: building$/m, 'status: blocked'));
  r.g('commit', '-qam', 'blocked again');
  const rec = recordOf(r);
  fs.writeFileSync(r.record, JSON.stringify({ ...rec, exited: '2026-10-18T11:00:00.000Z', exit_code: 0 }));
  const before = r.ticket(), head = r.head();
  const said = [];
  const again = runCheck(r, 'fix', { said });
  assert.equal(r.ticket(), before, 'left as it is');
  assert.equal(r.head(), head);
  assert.equal(again.started.length, 0);
  assert.equal(ticketOf(r).status, 'blocked');
  assert.equal(said.filter(m => /0001: the Foreman didn't take its recommendation: The Foreman has already gone with a recommendation for ticket 0001 once/.test(m)).length, 1);
  runCheck(r, 'fix', { said, queue: again.queue });
  assert.equal(said.length, 1, 'said once, not on every check');
});

test('0286 AC2: a build speck run still has running is left until a later check', () => {
  const r = blockedRepo();
  const said = [], calls = [];
  const q = foremanFixQueue({ repo: r.dir, running: new Set(['0001']), readConfig: () => ({ foreman_fixing: 'fix' }), say: m => said.push(m), goWith: (...a) => { calls.push(a); return { status: 200 }; } });
  q.check(statusData(r.dir).tickets);
  assert.deepEqual(calls, []);
  assert.deepEqual(said, []);
});

test('0286 AC5: with tell or off, a blocked ticket waits for you, as today', () => {
  for (const fixing of ['tell', 'off']) {
    const r = blockedRepo();
    const before = r.ticket();
    const { started, said } = runCheck(r, fixing);
    assert.equal(r.ticket(), before, fixing);
    assert.deepEqual(started, []);
    assert.deepEqual(said, []);
  }
});

test('0286 AC5: with tell, the Foreman counts blocked tickets under Needs you; with off, it doesn\'t', () => {
  const run = { on: true, pid: 7 }, record = { lock: 7, building: [], ready: [] };
  const tickets = [T('0001', 'blocked', { blocked_question: 'A or B?' }), T('0002', 'blocked')];
  assert.equal(foremanView({ run, record, tickets }).word, 'Needs you 2', 'tell by default');
  assert.equal(foremanView({ run, record, tickets, fixing: 'tell' }).word, 'Needs you 2');
  assert.equal(foremanView({ run, record, tickets, fixing: 'fix' }).word, 'Needs you 2', 'fix leaves the rest for you');
  const off = foremanView({ run, record, tickets, fixing: 'off' });
  assert.equal(off.word, 'Idle');
  assert.equal(off.blocked.length, 2, 'still listed in its detail');
});

test('0286 AC1: the README and the brief name foreman_fixing and its three values', () => {
  for (const doc of ['README.md', 'docs/brief.md']) {
    const text = fs.readFileSync(path.join(ROOT, doc), 'utf8');
    assert.ok(text.includes('`foreman_fixing'), doc);
    for (const v of ['off', 'tell', 'fix']) assert.match(text, new RegExp(`\`(foreman_fixing: )?${v}\``), `${doc}: ${v}`);
  }
});
