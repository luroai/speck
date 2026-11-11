// 0642: each agent's latest usage, kept after every build, review round and watch run on Claude Code or Codex.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { claudeUsageInLog, codexUsageInSession, codexUsage, readUsage, saveUsage, usageFile, keepUsage, keepBuildUsage, usageLines } from '../scripts/agent-usage.mjs';
import { agentsReport, reportLines } from '../scripts/your-agents.mjs';
import { foremanAgentQueue } from '../scripts/foreman-agent.mjs';
import { loadConfig } from '../scripts/speck.mjs';
import { limitQueues } from '../scripts/reviewer-limit.mjs';
import { reviewRepo } from './support/speck.mjs';
import { panelRepo, T } from './support/panel.mjs';
import { blockedRepo } from './support/blocked.mjs';
import { fakeAgents, READY } from './support/agents.mjs';
import { speck } from './support/cli.mjs';
import { CLAUDE_EVENT, claudeLog, codexHomeWith, codexEvent } from './support/agent-usage.mjs';

const NOW = Date.parse('2026-11-11T12:00:00Z');

// ---------- AC1 ----------

test('0642 AC1: Claude\'s latest usage is read from its stream-json log, each window with its percentage, reset and whether it\'s refused', () => {
  const log = claudeLog([CLAUDE_EVENT({ five: 0.06, seven: 0.39 }), { type: 'assistant', message: {} }, CLAUDE_EVENT({ five: 0.07, seven: 0.4 })]);
  assert.deepEqual(claudeUsageInLog(log, NOW), { read_at: '2026-11-11T12:00:00.000Z', windows: {
    five_hour: { used_percent: 7, resets_at: '2026-11-11T14:30:00.000Z', refused: false },
    seven_day: { used_percent: 40, resets_at: '2026-11-15T09:00:00.000Z', refused: false } } });
  const refused = claudeUsageInLog(claudeLog([CLAUDE_EVENT({ five: 1, seven: 0.5, status: 'rejected', type: 'five_hour' })]), NOW);
  assert.equal(refused.windows.five_hour.refused, true);
  assert.equal(refused.windows.five_hour.used_percent, 100);
  assert.equal(refused.windows.seven_day.refused, false);
});

test('0642 AC1: a Claude log with no rate_limit_event, or a malformed one, has no reading', () => {
  assert.equal(claudeUsageInLog('', NOW), null);
  assert.equal(claudeUsageInLog(undefined, NOW), null);
  assert.equal(claudeUsageInLog(claudeLog([{ type: 'result', subtype: 'success' }, { type: 'rate_limit_event', rate_limit_info: { status: 'allowed' } }]), NOW), null);
  assert.equal(claudeUsageInLog('{not json\n{"type":"rate_limit_event","rate_limit_info":{"unifiedWindows":{"__proto__":{}}}}', NOW), null);
});

test('0642 AC1: a Claude watch run that ends keeps Claude\'s usage from its log', () => {
  const r = blockedRepo({ status: 'building' }), w = watch(r);
  w.q.stuck({ id: '0001', what: 'its build ended with the ticket still building', log: '' });
  w.check();
  assert.equal(w.starts.length, 1);
  w.end(claudeLog([CLAUDE_EVENT({ five: 0.2, seven: 0.3 })]));
  w.check();
  assert.equal(readUsage(r.dir).claude.windows.five_hour.used_percent, 20);
});

test('0642 AC1: a Claude build that ends keeps Claude\'s usage from its log, as speck run\'s limits keep it', () => {
  const r = panelRepo(), dir = fs.mkdtempSync(path.join(r.dir, '..', 'runs-'));
  const rec = path.join(dir, '0001.json'), log = path.join(dir, '0001.log');
  fs.writeFileSync(rec, JSON.stringify({ session: 's', pid: 1, exited: 'x' }));
  fs.writeFileSync(log, claudeLog([CLAUDE_EVENT({ five: 0.55, seven: 0.6 })]));
  const limits = limitQueues({ repo: r.dir, runs: () => dir, settings: () => ({ cfg: { builder: 'claude' }, max: 1 }), running: new Set(), startBuild() {}, resumeHint: () => '' });
  assert.equal(limits.keepUsage(log, rec), true);
  assert.equal(readUsage(r.dir).claude.windows.seven_day.used_percent, 60);
  // A build on a provider, or with no log, keeps nothing.
  fs.writeFileSync(rec, JSON.stringify({ agent: 'deepseek', session: 's' }));
  assert.equal(limits.keepUsage(log, rec), false);
  fs.writeFileSync(rec, JSON.stringify({ session: 's' }));
  assert.equal(limits.keepUsage(path.join(dir, 'none.log'), rec), false);
});

// ---------- AC2 ----------

test('0642 AC2: Codex\'s latest usage is read from its session file: both windows, the plan and whether a limit is reached', () => {
  const text = [codexEvent({ at: '2026-11-11T11:00:00Z', five: 20, week: 1 }), codexEvent({ at: '2026-11-11T11:30:00Z', five: 25, week: 2, reached: 'primary' }),
    JSON.stringify({ type: 'event_msg', payload: { type: 'token_count', rate_limits: null } })].join('\n');
  assert.deepEqual(codexUsageInSession(text, NOW), { read_at: '2026-11-11T12:00:00.000Z', reported_at: '2026-11-11T11:30:00.000Z', plan: 'plus', limit_reached: true, limit_type: 'primary', windows: {
    five_hour: { used_percent: 25, resets_at: '2026-11-11T14:30:00.000Z' }, seven_day: { used_percent: 2, resets_at: '2026-11-15T09:00:00.000Z' } } });
  assert.equal(codexUsageInSession(codexEvent({ at: '2026-11-11T11:00:00Z', five: 1, week: 1 }), NOW).limit_reached, false);
  assert.equal(codexUsageInSession('{"type":"turn_context"}\nnot json', NOW), null);
});

test('0642 AC2: Codex\'s usage is found by the run\'s thread id, and none for an unknown or unsafe one', () => {
  const home = codexHomeWith('T7', [codexEvent({ at: '2026-11-11T11:00:00Z', five: 30, week: 4 })]);
  assert.equal(codexUsage('T7', { home }).windows.five_hour.used_percent, 30);
  assert.equal(codexUsage('nope', { home }), null);
  assert.equal(codexUsage('../T7', { home }), null);
  assert.equal(codexUsage(undefined, { home }), null);
});

test('0642 AC2: a Codex review round keeps Codex\'s usage from its session file', () => {
  const r = reviewRepo();
  const home = codexHomeWith('T1', [codexEvent({ at: '2026-11-11T11:00:00Z', five: 42, week: 7 })]);
  const res = r.runEnv({ CODEX_HOME: home }, 'review', '1');
  assert.equal(res.status, 10, res.stderr);
  const u = readUsage(r.dir).codex;
  assert.equal(u.windows.five_hour.used_percent, 42);
  assert.equal(u.plan, 'plus');
});

test('0642 AC2: a Codex build and a Codex watch run that end keep Codex\'s usage', () => {
  const home = codexHomeWith('TB', [codexEvent({ at: '2026-11-11T11:00:00Z', five: 11, week: 3 })]);
  const was = process.env.CODEX_HOME;
  process.env.CODEX_HOME = home;
  try {
    const r = panelRepo(), dir = fs.mkdtempSync(path.join(r.dir, '..', 'runs-'));
    const rec = path.join(dir, '0001.json'), log = path.join(dir, '0001.log');
    fs.writeFileSync(rec, JSON.stringify({ agent: 'codex', session: 'TB', pid: 1 }));
    fs.writeFileSync(log, `${JSON.stringify({ type: 'thread.started', thread_id: 'TB' })}\n`);
    assert.equal(keepBuildUsage(r.dir, rec, log, { builder: 'claude' }), true);
    assert.equal(readUsage(r.dir).codex.windows.five_hour.used_percent, 11);

    const b = blockedRepo({ status: 'building' }), w = watch(b, { watch_agent: 'codex' });
    w.q.stuck({ id: '0001', what: 'its build ended with the ticket still building', log: '' });
    w.check();
    assert.equal(w.starts[0].argv[0], 'codex');
    w.end(`${JSON.stringify({ type: 'thread.started', thread_id: 'TB' })}\n`);
    w.check();
    assert.equal(readUsage(b.dir).codex.windows.seven_day.used_percent, 3);
  } finally { if (was === undefined) delete process.env.CODEX_HOME; else process.env.CODEX_HOME = was; }
});

// ---------- AC3 ----------

test('0642 AC3: readings are kept per agent in the main checkout\'s speck/.cache/machine/, which git ignores', () => {
  const r = panelRepo();
  assert.equal(path.relative(r.dir, usageFile(r.dir)), path.join('speck', '.cache', 'machine', 'usage.json'));
  keepUsage(r.dir, 'claude', claudeLog([CLAUDE_EVENT({ five: 0.1, seven: 0.2 })]), { now: NOW });
  const home = codexHomeWith('TX', [codexEvent({ at: '2026-11-11T11:00:00Z', five: 5, week: 6 })]);
  keepUsage(r.dir, 'codex', '', { thread: 'TX', home });
  assert.deepEqual(Object.keys(readUsage(r.dir)).sort(), ['claude', 'codex']);
  assert.equal(spawnSync('git', ['status', '--porcelain'], { cwd: r.dir, encoding: 'utf8' }).stdout.trim(), '');
  // From a worktree, the same file in the main checkout.
  const wt = path.join(r.dir, '..', `wt-${path.basename(r.dir)}`);
  spawnSync('git', ['worktree', 'add', '-q', '-b', 'speck/0642-wt', wt], { cwd: r.dir });
  assert.equal(usageFile(wt), usageFile(r.dir));
});

test('0642 AC3: a newer reading replaces an older one, and a run with no reading leaves the last one as it was', () => {
  const r = panelRepo();
  assert.equal(keepUsage(r.dir, 'claude', claudeLog([CLAUDE_EVENT({ five: 0.1, seven: 0.2 })]), { now: NOW }), true);
  assert.equal(keepUsage(r.dir, 'claude', claudeLog([CLAUDE_EVENT({ five: 0.3, seven: 0.2 })]), { now: NOW + 60000 }), true);
  assert.equal(readUsage(r.dir).claude.windows.five_hour.used_percent, 30);
  assert.equal(keepUsage(r.dir, 'claude', claudeLog([CLAUDE_EVENT({ five: 0.9, seven: 0.9 })]), { now: NOW }), false, 'older than the one kept');
  assert.equal(keepUsage(r.dir, 'claude', claudeLog([{ type: 'result', subtype: 'success' }]), { now: NOW + 120000 }), false);
  assert.equal(keepUsage(r.dir, 'codex', 'no thread here', { now: NOW + 120000 }), false);
  const kept = readUsage(r.dir);
  assert.equal(kept.claude.windows.five_hour.used_percent, 30);
  assert.equal(kept.codex, undefined);
  assert.equal(saveUsage(r.dir, 'cursor', kept.claude), false, 'only Claude Code and Codex');
});

test('0642 AC3: of two Codex readings, the one Codex reported later wins, whenever speck read it', () => {
  const r = panelRepo();
  const late = codexHomeWith('TL', [codexEvent({ at: '2026-11-11T11:30:00Z', five: 50, week: 5 })]);
  const early = codexHomeWith('TE', [codexEvent({ at: '2026-11-11T11:00:00Z', five: 10, week: 1 })]);
  assert.equal(keepUsage(r.dir, 'codex', '', { thread: 'TL', home: late, now: NOW }), true);
  assert.equal(keepUsage(r.dir, 'codex', '', { thread: 'TE', home: early, now: NOW + 60000 }), false, 'read later, but reported earlier');
  assert.equal(readUsage(r.dir).codex.windows.five_hour.used_percent, 50);
});

test('0642 AC3: a save waits while another process holds the file, so neither undoes the other, and takes over a lock left by one that died', async () => {
  const r = panelRepo(), lock = `${usageFile(r.dir)}.lock`;
  keepUsage(r.dir, 'claude', claudeLog([CLAUDE_EVENT({ five: 0.1, seven: 0.2 })]), { now: NOW });
  fs.writeFileSync(lock, '1\n'); // another process is reading and writing it
  const child = saveIn(r.dir, 'codex', { read_at: '2026-11-11T12:00:00.000Z', windows: { five_hour: { used_percent: 9, resets_at: null } } });
  await child.started;
  await new Promise(res => setTimeout(res, 150));
  assert.equal(readUsage(r.dir).codex, undefined, 'nothing written while the lock is held');
  // What the other process writes meanwhile is kept.
  fs.writeFileSync(usageFile(r.dir), JSON.stringify({ ...readUsage(r.dir), claude: { ...readUsage(r.dir).claude, read_at: '2026-11-11T12:30:00.000Z' } }));
  fs.rmSync(lock);
  assert.equal(await child.exited, 0, child.err());
  const kept = readUsage(r.dir);
  assert.equal(kept.codex.windows.five_hour.used_percent, 9);
  assert.equal(kept.claude.read_at, '2026-11-11T12:30:00.000Z', 'the other process\'s write survives');
  assert.equal(fs.existsSync(lock), false);
  // A lock left long ago is taken over.
  fs.writeFileSync(lock, '1\n');
  const old = new Date(Date.now() - 60000);
  fs.utimesSync(lock, old, old);
  assert.equal(keepUsage(r.dir, 'claude', claudeLog([CLAUDE_EVENT({ five: 0.5, seven: 0.2 })]), { now: NOW + 3600e3 }), true);
  assert.equal(fs.existsSync(lock), false);
});

test('0642 AC3: of two processes taking over the same stale lock, neither removes the lock the other made, so both readings survive', async () => {
  const r = panelRepo(), lock = `${usageFile(r.dir)}.lock`, guard = `${lock}.stale`;
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  // This test is the first contender: it finds the lock stale and takes the guard to take it over.
  fs.writeFileSync(lock, '1\n');
  const old = new Date(Date.now() - 60000);
  fs.utimesSync(lock, old, old);
  fs.writeFileSync(guard, `${process.pid}\n`);
  const child = saveIn(r.dir, 'codex', { read_at: '2026-11-11T12:00:00.000Z', windows: { five_hour: { used_percent: 9, resets_at: null } } });
  await child.started;
  await new Promise(res => setTimeout(res, 150));
  assert.ok(Date.now() - fs.statSync(lock).mtimeMs > 30000, 'the second contender leaves the stale lock while the first holds the guard');
  // The first removes it, makes its own and lets go of the guard: the second must wait for that lock, not remove it.
  fs.rmSync(lock);
  fs.writeFileSync(lock, `${process.pid}\n`);
  fs.rmSync(guard);
  await new Promise(res => setTimeout(res, 150));
  assert.ok(fs.existsSync(lock), 'the first contender\'s new lock is still there');
  assert.equal(readUsage(r.dir).codex, undefined, 'and the second has written nothing');
  fs.writeFileSync(usageFile(r.dir), JSON.stringify({ claude: { read_at: '2026-11-11T12:30:00.000Z', windows: { five_hour: { used_percent: 3, resets_at: null } } } }));
  fs.rmSync(lock);
  assert.equal(await child.exited, 0, child.err());
  const kept = readUsage(r.dir);
  assert.equal(kept.claude.windows.five_hour.used_percent, 3);
  assert.equal(kept.codex.windows.five_hour.used_percent, 9);
  assert.equal(fs.existsSync(lock) || fs.existsSync(guard), false);
});

test('0642 AC3: a guard left by a process that died is cleared, so a stale lock can still be taken over', () => {
  const r = panelRepo(), lock = `${usageFile(r.dir)}.lock`, guard = `${lock}.stale`;
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  const old = new Date(Date.now() - 60000);
  for (const f of [lock, guard]) { fs.writeFileSync(f, '1\n'); fs.utimesSync(f, old, old); }
  assert.equal(keepUsage(r.dir, 'claude', claudeLog([CLAUDE_EVENT({ five: 0.5, seven: 0.2 })]), { now: NOW }), true);
  assert.equal(fs.existsSync(lock) || fs.existsSync(guard), false);
});

// A separate process saving `reading` as `agent`'s in `dir`: { started, exited, err() }.
function saveIn(dir, agent, reading) {
  const mod = new URL('../scripts/agent-usage.mjs', import.meta.url).href;
  const code = `import { saveUsage } from ${JSON.stringify(mod)};
    process.stdout.write('started\\n');
    saveUsage(${JSON.stringify(dir)}, ${JSON.stringify(agent)}, ${JSON.stringify(reading)});`;
  const p = spawn(process.execPath, ['--input-type=module', '-e', code], { stdio: ['ignore', 'pipe', 'pipe'] });
  let err = '';
  p.stderr.on('data', d => { err += d; });
  const started = new Promise(resolve => p.stdout.on('data', d => { if (String(d).includes('started')) resolve(); }));
  return { started, exited: new Promise(resolve => p.on('exit', resolve)), err: () => err };
}

test('0642 AC3: an unreadable usage file reads as no readings, and the next reading replaces it', () => {
  const r = panelRepo();
  fs.mkdirSync(path.dirname(usageFile(r.dir)), { recursive: true });
  fs.writeFileSync(usageFile(r.dir), '{broken');
  assert.deepEqual(readUsage(r.dir), {});
  fs.writeFileSync(usageFile(r.dir), JSON.stringify({ claude: { read_at: 'nonsense', windows: {} }, constructor: {} }));
  assert.deepEqual(readUsage(r.dir), {});
  assert.equal(keepUsage(r.dir, 'claude', claudeLog([CLAUDE_EVENT({ five: 0.1, seven: 0.2 })]), { now: NOW }), true);
  assert.equal(readUsage(r.dir).claude.windows.five_hour.used_percent, 10);
});

// ---------- AC4 ----------

const ONLY = { claude: READY.claude, codex: READY.codex };
const envOf = spec => ({ ...process.env, PATH: `${fakeAgents(spec)}:/usr/bin:/bin` });

test('0642 AC4: speck agents prints each window\'s percentage and reset under each agent with a reading, and how long ago it was read', () => {
  const r = panelRepo();
  keepUsage(r.dir, 'claude', claudeLog([CLAUDE_EVENT({ five: 0.07, seven: 0.4 })]), { now: Date.now() - 5 * 60000 });
  const out = speck(r.dir, envOf(ONLY), 'agents');
  assert.equal(out.status, 0, out.stderr);
  const lines = out.stdout.split('\n'), at = lines.findIndex(l => l.startsWith('Claude Code (claude): '));
  assert.match(lines[at + 1], /^ {2}Usage, read 5 minutes ago:$/);
  assert.match(lines[at + 2], /five-hour: 7% used, resets 2026-11-11 14:30 UTC/);
  assert.match(lines[at + 3], /weekly: 40% used, resets 2026-11-15 09:00 UTC/);
  const codexAt = lines.findIndex(l => l.startsWith('Codex (codex): '));
  assert.doesNotMatch(lines[codexAt + 1] ?? '', /Usage/, 'no reading, no usage');
});

test('0642 AC4: speck agents --json gives each reading as data, with how long ago it was read', () => {
  const r = panelRepo();
  const home = codexHomeWith('TJ', [codexEvent({ at: new Date(Date.now() - 2 * 3600e3).toISOString(), five: 25, week: 1, reached: 'primary' })]);
  keepUsage(r.dir, 'codex', '', { thread: 'TJ', home, now: Date.now() - 120000 });
  const out = speck(r.dir, envOf(ONLY), 'agents', '--json');
  assert.equal(out.status, 0, out.stderr);
  const report = JSON.parse(out.stdout), codex = report.agents.find(a => a.id === 'codex'), claude = report.agents.find(a => a.id === 'claude');
  assert.equal(codex.usage.windows.five_hour.used_percent, 25);
  assert.equal(codex.usage.windows.seven_day.resets_at, '2026-11-15T09:00:00.000Z');
  assert.equal(codex.usage.limit_reached, true);
  assert.ok(codex.usage.read_seconds_ago >= 119 && codex.usage.read_seconds_ago < 600, `how long ago speck read it, not when Codex wrote it: ${codex.usage.read_seconds_ago}`);
  const text = speck(r.dir, envOf(ONLY), 'agents').stdout;
  assert.match(text, /Usage, read 2 minutes ago, plus plan, limit reached:/);
  assert.equal(claude.usage, undefined);
});

test('0642 AC4: the usage lines name the plan, a reached limit and a refused window', () => {
  const lines = usageLines({ read_at: new Date(NOW - 3 * 3600e3).toISOString(), plan: 'plus', limit_reached: true,
    windows: { five_hour: { used_percent: 100, resets_at: '2026-11-11T14:30:00.000Z', refused: true }, seven_day: { used_percent: null, resets_at: null } } }, NOW);
  assert.equal(lines[0], '  Usage, read 3 hours ago, plus plan, limit reached:');
  assert.equal(lines[1], '    five-hour: 100% used, resets 2026-11-11 14:30 UTC, refused');
  assert.equal(lines[2], '    weekly: ?% used, reset time unknown');
  assert.equal(reportLines({ list: true, agents: [], providers: [] }, NOW), '');
  assert.equal(agentsReport(null, { find: () => ({ agents: [] }), providers: [] }).agents.length, 0);
});

// The watch agent's queue in a repo whose config sets `cfg`, with a stand-in for starting the agent that writes `text`
// to its log as its run ends (end()).
function watch(r, cfg = {}) {
  const starts = [], live = new Set();
  const q = foremanAgentQueue({ repo: r.dir, runs: () => r.runs, readConfig: () => ({ ...loadConfig(r.dir), watch: 'fix', ...cfg }),
    words: [], cfg: { base_branch: 'main', branch_prefix: 'speck/' }, max: 1, running: new Set(), ships: { again() {} }, say: () => {},
    startBuild() {}, providers: [], cantStart: () => '',
    start: (argv, cwd, file) => { const pid = 92000 + starts.length; fs.writeFileSync(file, ''); starts.push({ argv, file, pid }); live.add(pid); return { pid, exited: () => !live.has(pid) }; },
    alive: pid => live.has(pid), withToken: () => [] });
  const end = text => { const s = starts.at(-1); fs.writeFileSync(s.file, text); live.delete(s.pid); };
  return { q, starts, end, check: (tickets = [T('0001', 'building')]) => q.check(tickets) };
}

test('0642 AC4: the brief names the file the readings are kept in, and speck agents\' help mentions usage', () => {
  const brief = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
  const row = brief.split('\n').find(l => l.startsWith('| `speck agents [--json]`'));
  assert.ok(row.includes('`speck/.cache/machine/usage.json`'));
  assert.ok(row.includes('`usage`'));
  const help = fs.readFileSync(new URL('../scripts/speck.mjs', import.meta.url), 'utf8').split('\n').find(l => l.includes('speck agents [--json]'));
  assert.match(help, /latest usage/);
});
