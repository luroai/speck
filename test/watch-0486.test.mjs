import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { T, gitEnv, ROOT } from './support/panel.mjs';
import { blockedRepo } from './support/blocked.mjs';
import { stringsIn } from './support/strings.mjs';
import { loadConfig, runCommand } from '../scripts/speck.mjs';
import { foremanView, foremanLines } from '../scripts/foreman.mjs';
import { foremanAgentQueue, foremanBrief, skillPath, foremanOnly, foremanSubject } from '../scripts/foreman-agent.mjs';
import { lastOwnTicketCommit } from '../scripts/build-records.mjs';
import { goWith } from '../scripts/go-with.mjs';
import { wentWithLines } from '../scripts/foreman-took.mjs';
import { installTooling } from '../scripts/install.mjs';

Object.assign(process.env, gitEnv); // speck watch commits in this process

// ---------- 0486: call the Foreman speck in speck's messages and commands ----------

// What may still say foreman in a string in scripts/, each because no one reads it as a message.
const NOT_MESSAGES = [
  /\bforeman_(fixing|model|effort)\b/g, // setting names (0487)
  /\bset foreman to\b/g, // the setting `foreman` named in a message (0487)
  /\bSPECK_FOREMAN_RUN\b/g, // the agent's run token, an environment variable
  /\brun\.foreman[\w.-]*/g, // speck run's own files in its runs folder
  /^--foreman$/, // the word provider-build.mjs is started with for the agent
  /^\/api\/foreman\//, // the panel's address for your reply
  /^\.\/foreman[\w-]*\.mjs$/, // file names inside scripts/, out of scope
];
// Literals that are whole non-message values: the setting `foreman` and `by: 'foreman'`, the retired skill, and the
// old Notes and commit wording speck still reads in tickets that have it.
const WHOLE = new Set(['foreman', 'speck-foreman', 'chosen by the Foreman', '): Foreman:']);
// The role's name in Your agents, which only the panel shows (0485): removeAgent's refusal words it its own way.
const ROLE = { file: 'your-agents.mjs', text: 'Foreman' };
const leftOver = (s, file) => {
  if (WHOLE.has(s) || (file === ROLE.file && s === ROLE.text)) return '';
  let out = s;
  for (const re of NOT_MESSAGES) out = out.replace(re, '');
  return out;
};

test('0486 AC1: no string in scripts/ that speck prints or logs says Foreman, in any case', () => {
  const dir = path.join(ROOT, 'scripts'), found = [];
  for (const name of fs.readdirSync(dir).filter(n => n.endsWith('.mjs'))) {
    for (const { text, line } of stringsIn(fs.readFileSync(path.join(dir, name), 'utf8')))
      if (/foreman/i.test(leftOver(text, name))) found.push(`${name}:${line}: ${text.slice(0, 160)}`);
  }
  assert.deepEqual(found, []);
});

test('0486 AC1: the scanner finds the strings a file has, and only those', () => {
  const src = "const a = 'one'; // 'not this'\nconst b = `two ${x('three')} four`;\n/* 'nor this' */ const c = /'re'/.test(\"five\");\n";
  assert.deepEqual(stringsIn(src).map(s => s.text), ['one', 'two  four', 'three', 'five']);
});

// The agent's queue, as 0318's tests have it: an agent runs until end().
function agents(r) {
  const starts = [], said = [], live = new Set();
  const q = foremanAgentQueue({ repo: r.dir, runs: () => r.runs, readConfig: () => ({ ...loadConfig(r.dir), foreman_fixing: 'fix' }),
    words: ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'], cfg: { base_branch: 'main', branch_prefix: 'speck/' }, max: 1, running: new Set(),
    ships: { again: () => {} }, say: m => said.push(m), startBuild: () => {},
    start: (argv, cwd, log, env) => { const pid = 91000 + starts.length; starts.push({ token: env.SPECK_FOREMAN_RUN, pid }); live.add(pid); return { pid, exited: () => !live.has(pid) }; },
    alive: pid => live.has(pid), withToken: () => [] });
  return { q, starts, said, end: s => live.delete(s.pid) };
}
const QUESTION = 'Should it keep the old test?';
// A repo whose ticket 0001 the agent has asked you about with `speck watch ask`, the agent ended.
function asked() {
  const r = blockedRepo({ status: 'building' }), a = agents(r);
  a.q.stuck({ id: '0001', what: 'its build ended', log: '' });
  a.q.check([T('0001', 'building')]);
  const ask = runCommand(['watch', 'ask', '0001', QUESTION, '--why=the build stopped on a choice'], { cwd: r.dir, env: { ...process.env, SPECK_FOREMAN_RUN: a.starts[0].token } });
  assert.equal(ask.status, 0, ask.stderr);
  a.end(a.starts[0]);
  a.q.check([T('0001', 'building')]);
  return { r, a };
}
const run = (r, args) => runCommand(args, { cwd: r.dir, env: { ...process.env, SPECK_FOREMAN_RUN: '' } });

test('0486 AC1: speck run\'s lines and speck status say speck where they said the Foreman', () => {
  const { r, a } = asked();
  assert.ok(a.said.some(l => /^0001: speck \(claude\) is looking into it\. Log: /.test(l)), a.said.join('\n'));
  const lines = foremanLines(foremanView({ run: { on: true, pid: process.pid }, record: { lock: process.pid }, tickets: [T('0001', 'building')], fixing: 'fix',
    agent: { running: null, waiting: [], did: [], asks: [{ id: '0001', question: QUESTION, at: '' }] } }));
  assert.ok(lines.includes(`  speck asks you about 0001: ${QUESTION}`), lines.join('\n'));
  assert.ok(lines.some(l => l.includes('speck answer 0001') && l.includes('speck dismiss 0001')), lines.join('\n'));
  for (const l of [...a.said, ...lines]) assert.doesNotMatch(l.replace(/\bforeman_fixing\b/g, ''), /foreman/i); // the setting's name is 0487's
  assert.doesNotMatch(r.ticket(), /The Foreman/);
});

test('0486 AC1: a note saying the Foreman chose a recommendation still counts as speck\'s one choice for the ticket', () => {
  const r = blockedRepo();
  const old = '- Went with the recommendation: A (chosen by the Foreman, as foreman_fixing is fix, 2026-10-18 10:00 UTC).';
  fs.writeFileSync(r.file, r.ticket().replace('- A note.', `- A note.\n${old}`));
  r.g('commit', '-qam', 'old choice');
  assert.equal(wentWithLines([old])[0].by, 'foreman');
  const out = goWith(r.dir, '0001', new Date(), { by: 'foreman' });
  assert.equal(out.status, 409);
  assert.match(out.body.error, /^speck has already gone with a recommendation for ticket 0001 once/);
  const fresh = blockedRepo();
  assert.equal(goWith(fresh.dir, '0001', new Date('2026-10-24T10:00:00Z'), { by: 'foreman' }).status, 200);
  assert.match(fresh.ticket(), /\(chosen by speck, as foreman_fixing is fix, 2026-10-24 10:00 UTC\)/);
  assert.equal(wentWithLines(fresh.ticket().split('\n'))[0].by, 'foreman');
});

test('0486 AC2: speck answer does what speck foreman answer does, refusals included', () => {
  const { r } = asked();
  const none = blockedRepo({ status: 'building' });
  for (const args of [['answer'], ['answer', '0001'], ['dismiss', '0001']]) {
    const now = run(none, args), old = run(none, ['foreman', ...args]);
    assert.notEqual(now.status, 0);
    assert.equal(now.status, old.status);
    assert.equal(now.stderr, old.stderr);
    assert.doesNotMatch(now.stderr, /foreman/i);
  }
  const ok = run(r, ['answer', '0001', 'Keep', 'it']);
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(r.ticket(), /- You answered speck \([^)]*\): Keep it\. Its question: Should it keep the old test\?/);
  assert.equal(run(r, ['foreman', 'answer', '0001', 'Again']).status, run(r, ['answer', '0001', 'Again']).status);
});

test('0486 AC2: speck dismiss and the old speck foreman dismiss both dismiss the question', () => {
  for (const args of [['dismiss', '0001'], ['foreman', 'dismiss', '0001']]) {
    const { r } = asked();
    const out = run(r, args);
    assert.equal(out.status, 0, out.stderr);
    assert.match(out.stdout, /^Dismissed speck's question about 0001/);
    assert.match(r.ticket(), /- You dismissed speck's question \(/);
  }
});

test('0486 AC2: speck watch takes the agent\'s actions, and speck foreman still does', () => {
  for (const cmd of ['watch', 'foreman']) {
    const r = blockedRepo({ status: 'building' }), a = agents(r);
    a.q.stuck({ id: '0001', what: 'its build ended', log: '' });
    a.q.check([T('0001', 'building')]);
    const theirs = { cwd: r.dir, env: { ...process.env, SPECK_FOREMAN_RUN: a.starts[0].token } };
    const out = runCommand([cmd, 'ask', '0001', QUESTION, '--why=it needs you'], theirs);
    assert.equal(out.status, 0, out.stderr);
    assert.match(out.stdout, /Noted in 0001's Notes/);
    assert.doesNotMatch(out.stdout, /foreman/i);
    assert.match(r.ticket(), /- speck \([^)]*\) asked you: Should it keep the old test\?\. Why: it needs you/);
    const again = runCommand([cmd, 'ask', '0001', 'Twice?', '--why=x'], theirs);
    assert.notEqual(again.status, 0);
    assert.doesNotMatch(again.stderr, /foreman/i);
  }
  const r = blockedRepo({ status: 'building' });
  const refused = run(r, ['watch', 'resume', '0001', 'Go on', '--why=x']);
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /speck watch/);
  assert.doesNotMatch(refused.stderr, /foreman/i);
  assert.equal(run(r, ['foreman', 'resume', '0001', 'Go on', '--why=x']).stderr, refused.stderr);
});

test('0486 AC2: speck\'s usage text lists the new commands and not speck foreman', () => {
  const help = runCommand(['help']).stdout;
  for (const cmd of ['speck answer <id>', 'speck dismiss <id>', 'speck watch <action> <id>']) assert.ok(help.includes(cmd), cmd);
  assert.doesNotMatch(help, /foreman/i);
});

test('0486 AC3: the agent\'s commits start speck(<id>): watch:, and its old Foreman: commits still count as its own', () => {
  assert.equal(foremanSubject('0001'), 'speck(0001): watch:');
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0486-')));
  const g = (...a) => { const x = spawnSync('git', a, { cwd: dir, encoding: 'utf8' }); assert.equal(x.status, 0, x.stderr); return x.stdout.trim(); };
  g('init', '-q', '-b', 'main');
  const rel = 'speck/tickets/0001-t.md', file = path.join(dir, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const commit = (line, subject) => { fs.appendFileSync(file, `${line}\n`); g('add', rel); g('commit', '-qm', subject); return g('rev-parse', 'HEAD'); };
  const own = commit('ready', 'speck(0001): ready');
  commit('- old note', 'speck(0001): Foreman: ask');
  const last = commit('- new note', 'speck(0001): watch: ask');
  assert.equal(lastOwnTicketCommit(dir, rel, '0001'), own);
  assert.equal(foremanOnly(dir, '0001', own, last), true);
  const mine = commit('- edited', 'speck(0001): edited');
  assert.equal(lastOwnTicketCommit(dir, rel, '0001'), mine);
  assert.equal(foremanOnly(dir, '0001', own, mine), false);
});

test('0486 AC4: installing speck puts in speck-watch and takes out an older speck-foreman', () => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0486-')));
  for (const base of ['.claude/skills', '.agents/skills']) {
    fs.mkdirSync(path.join(dir, base, 'speck-foreman'), { recursive: true });
    fs.writeFileSync(path.join(dir, base, 'speck-foreman', 'SKILL.md'), '---\nname: speck-foreman\n---\n');
  }
  const skills = installTooling(dir);
  assert.ok(skills.includes('speck-watch'));
  assert.ok(!skills.includes('speck-foreman'));
  for (const base of ['.claude/skills', '.agents/skills']) {
    assert.match(fs.readFileSync(path.join(dir, base, 'speck-watch', 'SKILL.md'), 'utf8'), /^name: speck-watch$/m);
    assert.ok(!fs.existsSync(path.join(dir, base, 'speck-foreman')), base);
  }
});

test('0486 AC4: the skill lives at speck-watch, and the agent\'s brief names it', () => {
  assert.ok(!fs.existsSync(path.join(ROOT, 'skills', 'speck-foreman')));
  assert.match(fs.readFileSync(path.join(ROOT, 'skills', 'speck-watch', 'SKILL.md'), 'utf8'), /^name: speck-watch$/m);
  assert.equal(skillPath('claude'), '.claude/skills/speck-watch/SKILL.md');
  assert.equal(skillPath('codex'), '.agents/skills/speck-watch/SKILL.md');
  const brief = foremanBrief({ id: '0001', what: 'its build ended', log: 'its log', tail: '', agent: 'claude' });
  assert.match(brief, /speck-watch skill \(\.claude\/skills\/speck-watch\/SKILL\.md\)/);
  assert.match(brief, /node \.speck\/scripts\/speck\.mjs watch resume 0001/);
  assert.doesNotMatch(brief, /foreman/i);
});
