import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, T, gitEnv, ROOT } from './support/panel.mjs';
import { OPTION, blockedRepo } from './support/blocked.mjs';
import { statusData, loadConfig, parseYaml } from '../scripts/speck.mjs';
import { checkConfigValue } from '../scripts/config.mjs';
import { panelSettings, panelSaveSettings } from '../scripts/settings.mjs';
import { fixingOf, foremanView, foremanLines, FIXING_SAYS } from '../scripts/foreman.mjs';
import { foremanFixQueue } from '../scripts/foreman-fix.mjs';
import { goWith, goWithMessage, goWithQueue } from '../scripts/go-with.mjs';
import { foremanBoard } from '../scripts/foreman-took.mjs';
import { foremanAgentQueue } from '../scripts/foreman-agent.mjs';

Object.assign(process.env, gitEnv); // goWith commits in this process

// ---------- 0564: take every recommendation with watch: decide ----------

const WORDS = ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'];
const CFG = { base_branch: 'main', branch_prefix: 'speck/' };
const NOTICED = `Should the export go in a new menu (A) or stay where it is (B)?\n\nRecommended: ${OPTION}\nChanges what you'd notice: yes\nClear winner: no`;
const NO_FACTS = `Should the export go in a new menu (A) or stay where it is (B)?\n\nRecommended: ${OPTION}`;
const NO_OPTION = 'Should the export go in a new menu (A) or stay where it is (B)?';
const RAISE = `The build is over the limit. Split it, or raise the limit?\n\nRecommended: Raise the limit to 2,000 lines\nChanges what you'd notice: no\nClear winner: yes\nSize guard: yes`;
const NOTE = n => `- Went with the recommendation: Option ${n} (chosen by speck, as watch is decide, 2026-11-0${n} 10:00 UTC).`;

const entryOf = dir => statusData(dir).tickets.find(t => t.id === '0001');
function setWatch(r, value) { // uncommitted, so it moves no branch
  const file = path.join(r.dir, 'speck', 'config.yml'), text = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, /^watch:/m.test(text) ? text.replace(/^watch:.*$/m, `watch: ${value}`) : `${text.trimEnd()}\nwatch: ${value}\n`);
}
function withNotes(r, ...lines) {
  fs.writeFileSync(r.file, fs.readFileSync(r.file, 'utf8').replace('- A note.', ['- A note.', ...lines].join('\n')));
  r.g('commit', '-qam', 'notes');
}
function highRisk(r) {
  fs.writeFileSync(r.file, fs.readFileSync(r.file, 'utf8').replace(/^risk: .*$/m, 'risk: high'));
  r.g('commit', '-qam', 'high risk');
}
// One check of speck run: the choices watch makes, then the resumes they lead to.
function runCheck(r, watch) {
  setWatch(r, watch);
  const said = [], started = [], running = new Set();
  const fixes = foremanFixQueue({ repo: r.dir, readConfig: () => ({ ...loadConfig(r.dir), watch }), say: m => said.push(m) });
  const goWiths = goWithQueue({ repo: r.dir, cfg: CFG, words: WORDS, max: 1, running,
    startBuild: (id, argv, cwd, session, flags, record) => { started.push({ id, argv, rec: JSON.parse(record(4242)) }); running.add(id); },
    saveRecord: (f, rec) => fs.writeFileSync(f, JSON.stringify(rec)), resumeHint: () => '', runs: () => r.runs });
  const tickets = statusData(r.dir).tickets;
  fixes.check(tickets);
  goWiths.check(tickets);
  return { said, started };
}

test('0564 AC1: speck config set takes decide for watch, and still refuses anything else', () => {
  for (const v of ['off', 'tell', 'fix', 'decide']) assert.equal(checkConfigValue('watch', v), v);
  for (const v of ['', 'Decide', 'always', 'constructor']) assert.throws(() => checkConfigValue('watch', v), /watch must be off, tell, fix, decide/);
  const r = panelRepo();
  const out = r.run('config', 'set', 'watch', 'decide');
  assert.equal(out.status, 0, out.stderr);
  assert.equal(loadConfig(r.dir).watch, 'decide');
});

test('0564 AC1: speck reads decide from speck/config.yml, and the template names it', () => {
  assert.equal(fixingOf({ watch: 'decide' }), 'decide');
  assert.equal(fixingOf({ watch: 'nonsense' }), 'tell');
  const text = fs.readFileSync(path.join(ROOT, 'templates', 'config.yml'), 'utf8');
  assert.match(text, /^watch: tell +# .*\bdecide\b/m);
  assert.equal(parseYaml(text).watch, 'tell');
});

test('0564 AC1: the Settings view offers decide, explains it and saves it, and refuses any other value', () => {
  const r = panelRepo();
  const s = panelSettings(r.dir).groups.find(x => x.title === 'Your engineering manager').settings.find(x => x.key === 'watch');
  assert.ok(s.choices.includes('decide'));
  assert.match(s.explain, /\bdecide\b/);
  assert.equal(panelSaveSettings(r.dir, [{ key: 'watch', value: 'decide' }]).status, 200);
  assert.equal(loadConfig(r.dir).watch, 'decide');
  assert.equal(panelSaveSettings(r.dir, [{ key: 'watch', value: 'always' }]).status, 422);
});

for (const [name, question] of [['changes what you would notice and is a close call', NOTICED], ['leaves both facts out', NO_FACTS]])
  test(`0564 AC2: decide takes the recommendation of a question that ${name}, and resumes its build`, () => {
    const r = blockedRepo({ question });
    const { said, started } = runCheck(r, 'decide');
    const text = r.ticket();
    assert.match(text, new RegExp(`^- Went with the recommendation: ${OPTION} \\(chosen by speck, as watch is decide, \\d{4}-\\d\\d-\\d\\d \\d\\d:\\d\\d UTC\\)\\.$`, 'm'));
    assert.match(text, /^status: building/m);
    assert.equal(started.length, 1, said.join('\n'));
    assert.match(said.join('\n'), /as watch is decide/);
    assert.match(started[0].rec.resume_command.join(' '), /speck \(watch: decide\) chose/);
  });

test('0564 AC2: the resumed build is told speck chose it, naming decide', () => {
  assert.match(goWithMessage('0001', OPTION, '/speck-build', 'foreman', false, 'decide'), /speck \(watch: decide\) chose the recommended option/);
  assert.match(goWithMessage('0001', OPTION, '/speck-build', 'foreman'), /speck \(watch: fix\) chose/, 'fix says as it did');
});

test('0564 AC3: with decide, a question with no recommendation waits for you', () => {
  const r = blockedRepo({ question: NO_OPTION });
  const before = r.head();
  assert.equal(runCheck(r, 'decide').started.length, 0);
  assert.equal(r.head(), before);
  assert.match(r.ticket(), /^status: blocked/m);
});

test('0564 AC3: with decide, a high-risk ticket waits for you, even with a question fix would take', () => {
  for (const question of [NOTICED, undefined]) {
    const r = blockedRepo(question ? { question } : {});
    highRisk(r);
    const before = r.head();
    assert.equal(runCheck(r, 'decide').started.length, 0);
    assert.equal(r.head(), before, 'nothing written');
    assert.match(r.ticket(), /^status: blocked/m);
    const refused = goWith(r.dir, '0001', new Date(), { by: 'foreman' });
    assert.equal(refused.status, 409);
    assert.match(refused.body.error, /high/);
  }
});

test('0564 AC3: with decide, speck takes a third recommendation for a ticket, then the fourth waits for you', () => {
  const third = blockedRepo({ question: NOTICED });
  withNotes(third, NOTE(1), NOTE(2));
  assert.equal(runCheck(third, 'decide').started.length, 1);

  const fourth = blockedRepo({ question: NOTICED });
  withNotes(fourth, NOTE(1), NOTE(2), NOTE(3));
  const before = fourth.head();
  const { said, started } = runCheck(fourth, 'decide');
  assert.equal(started.length, 0);
  assert.equal(fourth.head(), before);
  assert.match(fourth.ticket(), /^status: blocked/m);
  assert.match(said.join('\n'), /3 recommendations/);
});

test('0564 AC3: your own choices and those fix made before count as they should towards the 3', () => {
  const yours = blockedRepo({ question: NOTICED });
  withNotes(yours, ...[1, 2, 3].map(n => `- Went with the recommendation: Option ${n} (chosen by the user in the panel, 2026-11-0${n} 10:00 UTC).`));
  assert.equal(runCheck(yours, 'decide').started.length, 1, 'yours are not speck\'s');

  const mixed = blockedRepo({ question: NOTICED });
  withNotes(mixed, '- Went with the recommendation: Option 1 (chosen by the Foreman, as watch is fix, 2026-11-01 10:00 UTC).', NOTE(2), NOTE(3));
  assert.equal(runCheck(mixed, 'decide').started.length, 0, 'fix\'s and the older wording count');
});

test('0564 AC3: with decide, raising the size limit is still never taken', () => {
  const r = blockedRepo({ question: RAISE });
  assert.equal(runCheck(r, 'decide').started.length, 0);
  assert.match(r.ticket(), /^status: blocked/m);
});

test('0564 AC3: going back to fix after decide keeps fix to once per ticket', () => {
  const r = blockedRepo();
  withNotes(r, NOTE(1));
  assert.equal(runCheck(r, 'fix').started.length, 0);
});

test('0564 AC4: with decide, the card says speck will take it and it does not count under Needs you, while one it will not take does', () => {
  const r = blockedRepo({ question: NOTICED });
  setWatch(r, 'decide');
  const entry = entryOf(r.dir);
  assert.equal(entry.foreman_will, true);
  const high = blockedRepo({ question: NOTICED });
  setWatch(high, 'decide');
  highRisk(high);
  assert.equal(entryOf(high.dir).foreman_will, false);
  const done = blockedRepo({ question: NOTICED });
  setWatch(done, 'decide');
  withNotes(done, NOTE(1), NOTE(2), NOTE(3));
  assert.equal(entryOf(done.dir).foreman_will, false);
  const two = blockedRepo({ question: NOTICED });
  setWatch(two, 'decide');
  withNotes(two, NOTE(1), NOTE(2));
  assert.equal(entryOf(two.dir).foreman_will, true);

  const run = { on: true, pid: 1 };
  const counted = tickets => foremanView({ run, record: null, tickets, fixing: 'decide' }).word;
  assert.notEqual(counted([T('0001', 'blocked', { foreman_will: true })]), 'Needs you 1');
  assert.equal(counted([T('0001', 'blocked', { foreman_will: false })]), 'Needs you 1');
});

test('0564 AC4: speck status says with decide what watch does, as it does with fix', () => {
  const lines = foremanLines(foremanView({ run: { on: true, pid: 1 }, record: null, tickets: [], fixing: 'decide' }));
  assert.match(lines[0], / · watch: decide$/);
  assert.equal(lines[1], `  watch: ${FIXING_SAYS.decide}`);
  assert.ok(!FIXING_SAYS.decide.includes('undefined') && FIXING_SAYS.decide.startsWith('decide.'));
});

test('0564 AC4: foremanBoard, for speck status, gives decide its own answer too', () => {
  const r = blockedRepo({ question: NOTICED });
  setWatch(r, 'decide');
  const parsed = risk => [{ fm: { id: '0001', status: 'blocked', title: 'x', risk }, sections: { notes: [], 'blocked question': NOTICED.split('\n') } }];
  assert.equal(foremanBoard(parsed('low'), loadConfig(r.dir), r.runs)[0].foreman_will, true);
  assert.equal(foremanBoard(parsed('high'), loadConfig(r.dir), r.runs)[0].foreman_will, false);
});

test('0564 AC4: with decide, a stop speck has no steps for still starts its agent, as with fix', () => {
  const r = blockedRepo({ status: 'building' }), starts = [], said = [];
  const q = foremanAgentQueue({ repo: r.dir, runs: () => r.runs, readConfig: () => ({ ...loadConfig(r.dir), watch: 'decide' }), words: WORDS, cfg: CFG, max: 1, running: new Set(),
    ships: { again: () => {} }, say: m => said.push(m), startBuild: () => {}, withToken: () => [], alive: () => true,
    start: (argv, cwd, log, env) => { starts.push(argv); return { pid: 90000, exited: () => false }; } });
  q.stuck({ id: '0001', what: 'its build ended with the ticket still building', log: '' });
  q.check([T('0001', 'building')]);
  assert.equal(starts.length, 1, said.join('\n'));
  assert.match(said.join('\n'), /as watch is decide/);
});

test('0564 AC5: fix still leaves a question that changes what you would notice, and off and tell leave every one', () => {
  for (const watch of ['fix', 'tell', 'off']) {
    const r = blockedRepo({ question: NOTICED });
    const before = r.head();
    assert.equal(runCheck(r, watch).started.length, 0, watch);
    assert.equal(r.head(), before, watch);
  }
  const clear = blockedRepo();
  assert.equal(runCheck(clear, 'fix').started.length, 1);
  assert.match(clear.ticket(), /chosen by speck, as watch is fix,/);
  assert.doesNotMatch(clear.ticket(), /watch is decide/);
  for (const watch of ['tell', 'off']) assert.equal(runCheck(blockedRepo(), watch).started.length, 0, watch);
});

test('0564 AC5: fix still takes the recommendation of a high-risk ticket, as it did', () => {
  const r = blockedRepo();
  highRisk(r);
  assert.equal(runCheck(r, 'fix').started.length, 1);
  assert.match(r.ticket(), /chosen by speck, as watch is fix,/);
});

test('0564 AC5: the brief names decide', () => {
  const text = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8');
  assert.match(text, /`(watch: )?decide`/);
});
