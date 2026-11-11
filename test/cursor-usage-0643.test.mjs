// 0643: Cursor's usage, read from the /usage screen of its interactive agent and kept as 0642 keeps the others.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { screenText, parseCursorUsage, resetsOn, readCursorUsage, ptyCommand, CURSOR_USAGE_TIMEOUT_MS } from '../scripts/cursor-usage.mjs';
import { readUsage, saveUsage, keepUsage, keepBuildUsage, keepUsageOfLog, cursorUsageStale, usageLines, CURSOR_STALE_MS } from '../scripts/agent-usage.mjs';
import { refreshCursorUsage } from '../scripts/your-agents.mjs';
import { panelRepo } from './support/panel.mjs';
import { speck } from './support/cli.mjs';
import { fakeCursor, usageScreen, alive } from './support/cursor-usage.mjs';
import { hasStopped } from './support/stopped.mjs';

// Whether every process the stand-in started has stopped, given a moment to exit.
const allStopped = async cursor => { assert.ok(cursor.pids().length > 0, 'it was opened'); return hasStopped(() => cursor.pids().every(p => !alive(p))); };

const NOW = Date.parse('2026-11-11T12:00:00Z');
const RECORDED = fs.readFileSync(new URL('./fixtures/cursor-usage-0643/usage-screen.txt', import.meta.url), 'utf8');
const parse = (screen, now = NOW) => parseCursorUsage(screenText(screen), now);
const envWith = cursor => ({ ...process.env, PATH: `${cursor.dir}:/usr/bin:/bin` });
const READING = (at = NOW, used = 1) => ({ read_at: new Date(at).toISOString(), plan: 'Premium', resets_on: '2026-11-12',
  windows: { included: { used_percent: used }, auto: { used_percent: used }, api: { used_percent: 0 } }, on_demand: { spent: 0, limit: null } });
const CURSOR = { id: 'cursor', name: 'Cursor', command: 'agent', installed: true, signed_in: true };
// A stand-in for reading the screen, counting each read.
function reader(result = { reading: READING(NOW, 5) }) {
  const calls = [];
  return { calls, read: o => { calls.push(o); return typeof result === 'function' ? result() : result; } };
}

// ---------- AC1 ----------

test('0643 AC1: Cursor\'s recorded usage screen still reads: plan, reset day, Included, Auto and API, and on-demand spend and limit', () => {
  // This screen was recorded from Cursor's CLI 2026.11.11. If Cursor changes it, this fails, naming the row it can't find.
  const got = parse(RECORDED);
  assert.equal(got.why, undefined, `Cursor's usage screen no longer reads: ${got.why}`);
  assert.deepEqual(got.reading, { read_at: '2026-11-11T12:00:00.000Z', plan: 'Premium', resets_on: '2026-11-12',
    windows: { included: { used_percent: 1 }, auto: { used_percent: 1 }, api: { used_percent: 0 } }, on_demand: { spent: 0, limit: null } });
});

test('0643 AC1: the screen\'s drawing codes are followed: lines rewritten in place, erased, and moved over', () => {
  assert.deepEqual(screenText('Loading...\r\x1b[2KDone\r\nab\x1b[1Dc\r\n\x1b]0;title\x07x\x1b[31my\x1b[0m', { cols: 20, rows: 4 }), ['Done', 'ac', 'xy', '']);
  assert.deepEqual(screenText('one\r\ntwo\r\nthree', { cols: 10, rows: 2 }), ['one', 'two', 'three'], 'lines scrolled off the top are kept');
  assert.deepEqual(screenText('abc\x1b[1;2HZ\x1b[2;1Hq', { cols: 5, rows: 2 }), ['aZc', 'q'], 'moved to a place');
  assert.deepEqual(screenText('abc\x1b[1;2HZ\x1b[2;1Hq\x1b[A\x1b[K', { cols: 5, rows: 2 }), ['a', 'q'], 'then up a line and erased to its end');
  assert.deepEqual(screenText('\x1b[<u\x1b[?25l\x1b[>1uok', { cols: 5, rows: 1 }), ['ok'], 'private codes skipped');
});

test('0643 AC1: a monthly on-demand limit, money with cents and a reset next year are read', () => {
  assert.deepEqual(parse(usageScreen({ onDemand: '$12.50 / $20', limit: '' })).reading.on_demand, { spent: 12.5, limit: 20 });
  assert.deepEqual(parse(usageScreen({ onDemand: '$3', limit: 'Monthly limit: $1,000' })).reading.on_demand, { spent: 3, limit: 1000 });
  assert.equal(parse(usageScreen({ resets: 'Resets 2 Jan' }), Date.parse('2026-12-30T10:00:00Z')).reading.resets_on, '2027-01-02');
  assert.equal(resetsOn('Nov 12', NOW), '2026-11-12');
  assert.equal(resetsOn('11 Nov', NOW), '2026-11-11');
  assert.equal(resetsOn('31 Feb', NOW), null);
  assert.equal(resetsOn('soon', NOW), null);
});

test('0643 AC1: speck agents opens Cursor with no prompt, shows /usage and closes it, and lists the plan, reset, rows and on-demand', async () => {
  const r = panelRepo(), cursor = fakeCursor();
  const out = speck(r.dir, envWith(cursor), 'agents');
  assert.equal(out.status, 0, out.stderr);
  assert.deepEqual(cursor.opened(), ['[--trust]'], 'opened once, with no prompt, so no model runs');
  const lines = out.stdout.split('\n'), at = lines.findIndex(l => l.startsWith('Cursor (agent): '));
  assert.match(lines[at + 1], /^ {2}Usage, read just now, Premium plan:$/);
  assert.equal(lines[at + 2], '    included: 1% used, resets 2026-11-12');
  assert.equal(lines[at + 3], '    Auto: 1% used, resets 2026-11-12');
  assert.equal(lines[at + 4], '    API: 0% used, resets 2026-11-12');
  assert.equal(lines[at + 5], '    on-demand: $0 spent, no monthly limit');
  assert.ok(await allStopped(cursor), 'everything it started is stopped');
});

// ---------- AC2 ----------

test('0643 AC2: the reading is kept as the others are, given in speck agents --json, and not read again within 10 minutes', () => {
  const r = panelRepo(), cursor = fakeCursor();
  const first = speck(r.dir, envWith(cursor), 'agents', '--json');
  assert.equal(first.status, 0, first.stderr);
  assert.equal(readUsage(r.dir).cursor.windows.auto.used_percent, 1);
  const usage = JSON.parse(first.stdout).agents.find(a => a.id === 'cursor').usage;
  assert.equal(usage.plan, 'Premium');
  assert.ok(usage.read_seconds_ago < 60);
  assert.equal(speck(r.dir, envWith(cursor), 'agents', '--json').status, 0);
  assert.equal(cursor.opened().length, 1, 'a fresh reading isn\'t read again');
});

test('0643 AC2: it\'s read again once the last reading is more than 10 minutes old', () => {
  const r = panelRepo(), { calls, read } = reader({ reading: READING(NOW + CURSOR_STALE_MS + 1000, 5) });
  assert.equal(CURSOR_STALE_MS, 10 * 60_000);
  assert.equal(saveUsage(r.dir, 'cursor', READING(NOW)), true);
  assert.equal(refreshCursorUsage(r.dir, { agents: [CURSOR] }, { readCursor: read, now: () => NOW + CURSOR_STALE_MS }), null);
  assert.equal(calls.length, 0);
  assert.equal(refreshCursorUsage(r.dir, { agents: [CURSOR] }, { readCursor: read, now: () => NOW + CURSOR_STALE_MS + 1000 }), '');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, 'agent');
  assert.ok(calls[0].cwd.endsWith(`machine${'/'}cursor-usage`), `in an empty folder of speck's own, not the project: ${calls[0].cwd}`);
  assert.deepEqual(fs.readdirSync(calls[0].cwd), []);
  assert.equal(readUsage(r.dir).cursor.windows.included.used_percent, 5);
});

test('0643 AC2: it\'s read again after a Cursor build, review round or watch run ends', () => {
  const r = panelRepo();
  const fresh = () => { assert.equal(saveUsage(r.dir, 'cursor', READING(Date.now())), true); assert.equal(cursorUsageStale(r.dir), false); };
  fresh();
  assert.equal(keepUsage(r.dir, 'cursor', 'any output'), false, 'Cursor\'s run reports no reading itself');
  assert.equal(cursorUsageStale(r.dir), true, 'a review round on Cursor ended');
  fresh();
  const record = `${r.dir}/rec.json`;
  fs.writeFileSync(record, JSON.stringify({ agent: 'cursor' }));
  keepBuildUsage(r.dir, record, `${r.dir}/missing.log`, {});
  assert.equal(cursorUsageStale(r.dir), true, 'a build on Cursor ended, even with no log');
  fresh();
  keepUsageOfLog(r.dir, 'cursor', `${r.dir}/missing.log`);
  assert.equal(cursorUsageStale(r.dir), true, 'a watch run on Cursor ended');
  fresh();
  keepUsage(r.dir, 'codex', '');
  assert.equal(cursorUsageStale(r.dir), false, 'another agent\'s run doesn\'t count');
});

test('0643 AC2: it isn\'t read when Cursor isn\'t installed or signed in, or outside a speck project', () => {
  const r = panelRepo(), { calls, read } = reader();
  assert.equal(refreshCursorUsage(r.dir, { agents: [{ ...CURSOR, signed_in: false }] }, { readCursor: read }), null);
  assert.equal(refreshCursorUsage(r.dir, { agents: [{ ...CURSOR, installed: false }] }, { readCursor: read }), null);
  assert.equal(refreshCursorUsage(null, { agents: [CURSOR] }, { readCursor: read }), null);
  assert.equal(calls.length, 0);
});

// ---------- AC3 ----------

test('0643 AC3: when it can\'t read a new one, it keeps the last reading and says why in one line', () => {
  const r = panelRepo();
  assert.equal(saveUsage(r.dir, 'cursor', READING(NOW)), true);
  const { read } = reader({ why: 'its usage screen couldn\'t be read within 20 seconds' });
  const said = refreshCursorUsage(r.dir, { agents: [{ ...CURSOR, usage: READING(NOW) }] }, { readCursor: read, now: () => NOW + 3600e3 });
  assert.equal(said, 'Couldn\'t read Cursor\'s usage: its usage screen couldn\'t be read within 20 seconds. Its usage below is the last reading.');
  assert.doesNotMatch(said, /\n/);
  assert.equal(readUsage(r.dir).cursor.read_at, READING(NOW).read_at);
  assert.match(refreshCursorUsage(r.dir, { agents: [CURSOR] }, { readCursor: () => ({}), now: () => NOW + 3600e3 }), /^Couldn't read Cursor's usage: it gave nothing to read\.$/);
});

test('0643 AC3: a screen that doesn\'t show what speck expects is said in one line in speck agents, and stops what it started', async () => {
  const r = panelRepo(), cursor = fakeCursor({ screen: usageScreen({ auto: null }) });
  const t = Date.now(), out = speck(r.dir, envWith(cursor), 'agents');
  assert.equal(out.status, 0, out.stderr);
  assert.ok(Date.now() - t < 15_000);
  assert.match(out.stderr, /^Couldn't read Cursor's usage: .*no Auto row.*\.\n$/);
  assert.equal(readUsage(r.dir).cursor, undefined);
  assert.ok(await allStopped(cursor), 'everything it started is stopped');
});

test('0643 AC3: a screen that never shows within the time limit stops everything it started, Cursor and what Cursor started', async () => {
  assert.equal(CURSOR_USAGE_TIMEOUT_MS, 20_000);
  const cursor = fakeCursor({ screen: 'Loading usage data...' });
  const t = Date.now();
  const got = await readCursorUsage({ command: `${cursor.dir}/agent`, timeoutMs: 1500 });
  assert.match(got.why, /couldn't be read within 2 seconds/);
  assert.ok(Date.now() - t < 8000);
  assert.equal(cursor.pids().length, 2, 'Cursor and the process it started');
  assert.ok(await allStopped(cursor), 'everything it started is stopped');
});

test('0643 AC3: when Cursor exits early, a process it started that outlives it is stopped too', async () => {
  const cursor = fakeCursor({ exitEarly: true });
  const got = await readCursorUsage({ command: `${cursor.dir}/agent`, timeoutMs: 8000 });
  assert.match(got.why, /closed before showing its usage/);
  assert.equal(cursor.pids().length, 2, 'Cursor and the process it started');
  assert.ok(await allStopped(cursor), 'everything it started is stopped');
});

test('0643 AC3: a folder Cursor asks to trust is never trusted: it says so and stops', async () => {
  const cursor = fakeCursor({ welcome: '  Workspace Trust Required\r\n    [a] Trust this workspace\r\n    [q] Quit\r\n' });
  const got = await readCursorUsage({ command: `${cursor.dir}/agent`, timeoutMs: 5000 });
  assert.match(got.why, /asked whether to trust the folder speck opens it in, which speck never answers/);
  assert.ok(await allStopped(cursor), 'everything it started is stopped');
});

// ---------- AC4 ----------

test('0643 AC4: it needs no packages: only node\'s own modules, and the system\'s script on Linux and macOS', () => {
  const src = fs.readFileSync(new URL('../scripts/cursor-usage.mjs', import.meta.url), 'utf8');
  const imports = [...src.matchAll(/^import .* from '([^']+)';$/gm)].map(m => m[1]);
  assert.ok(imports.length && imports.every(m => m.startsWith('node:')), imports.join(', '));
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.dependencies, undefined);
  assert.deepEqual(ptyCommand('agent', 'linux'), ['script', ['-qfec', 'stty cols 120 rows 40 2>/dev/null; exec agent --trust', '/dev/null']]);
  assert.deepEqual(ptyCommand('agent', 'darwin'), ['script', ['-q', '/dev/null', 'sh', '-c', 'stty cols 120 rows 40 2>/dev/null; exec agent --trust']]);
});

test('0643 AC4: Cursor\'s usage lines name an on-demand limit when there is one', () => {
  const lines = usageLines({ ...READING(NOW), on_demand: { spent: 12.5, limit: 20 } }, NOW + 120e3);
  assert.equal(lines[0], '  Usage, read 2 minutes ago, Premium plan:');
  assert.equal(lines.at(-1), '    on-demand: $12.50 spent, $20 monthly limit');
});

test('0643 AC1: the brief says speck agents reads Cursor\'s usage from its /usage screen through script', () => {
  const row = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8').split('\n').find(l => l.startsWith('| `speck agents [--json]`'));
  assert.ok(row.includes('`/usage`'));
  assert.ok(row.includes('`script`'));
  assert.ok(row.includes('`speck/.cache/machine/cursor-usage/`'));
});

test('0643 AC3: a system without script says so', async () => {
  const was = process.env.PATH;
  process.env.PATH = fakeCursor().dir;
  try { assert.match((await readCursorUsage({ timeoutMs: 3000 })).why, /no script command/); } finally { process.env.PATH = was; }
});
