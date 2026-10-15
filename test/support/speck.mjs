// Helpers shared by the speck CLI test files: sample tickets and verdicts, and throwaway repos set up for review, ship and start.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseTicket, setField, ticketRounds } from '../../scripts/speck.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CLI = path.join(ROOT, 'scripts', 'speck.mjs');
export const cfg = { allow_same_model_review: false, limits: { max_acceptance_criteria: 5, max_ticket_body_lines: 40, max_review_rounds: 3, escalate_after_repeat_disputes: 2 } };

export const ticket = (fm, body) => parseTicket(`---\n${fm}\n---\n${body}`);
export const good = `## Problem\nUsers cannot export.\n## Outcome\nUsers can export CSV.\n## Acceptance criteria\n1. Export button downloads a CSV.\n## Out of scope\n- PDF export\n`;
export const fm = (o = {}) => Object.entries({ id: '"0001"', title: 'Export bookings as CSV', status: 'draft', size: 'S', risk: 'low', builder: 'claude', reviewer: 'codex', ...o }).map(([k, v]) => `${k}: ${v}`).join('\n');

export const round = (verdict, findings = []) => ({ meta: {}, verdict: { verdict, findings, criteria: [], escalation_question: '' } });
export const gitIn = (dir, ...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd: dir, encoding: 'utf8' });

// A repo with speck installed, one ready ticket on a branch, and a fake `codex` on PATH that logs its arguments.
export function reviewRepo({ config = '', ticketFields = '', extraEnv = {} } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-bin-'));
  const log = path.join(bin, 'calls.log');
  fs.writeFileSync(path.join(bin, 'codex'), `#!${process.execPath}
const fs = require('fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify(args) + '\\n');
fs.appendFileSync(${JSON.stringify(log + '.prompts')}, JSON.stringify(fs.readFileSync(0, 'utf8')) + '\\n');
if (process.env.FAKE_CODEX_FAIL) { console.error('codex broke'); process.exit(2); }
// FAKE_HANG_PID (0180): starts a process that outlives it, writes that one's pid there, and never ends.
if (process.env.FAKE_HANG_PID) { const c = require('child_process').spawn('sleep', ['300'], { stdio: 'ignore' }); fs.writeFileSync(process.env.FAKE_HANG_PID, String(c.pid)); setInterval(() => {}, 1e6); }
const out = args[args.indexOf('-o') + 1];
fs.writeFileSync(out, JSON.stringify({ verdict: 'changes_requested', criteria: [{ id: 1, status: 'pass', evidence: 'ok' }], findings: [], summary: 'fine', escalation_question: '' }));
console.log(JSON.stringify({ type: 'thread.started', thread_id: 'T1' }));
if (process.env.FAKE_CODEX_EVENT) console.log(process.env.FAKE_CODEX_EVENT);
`, { mode: 0o755 });
  const env = { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}` };
  const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env: { ...env, ...extraEnv } });
  gitIn(dir, 'init', '-q', '-b', 'main');
  assert.equal(run('init', '--skip-checks').status, 0);
  const cfgFile = path.join(dir, 'speck', 'config.yml');
  fs.writeFileSync(cfgFile, fs.readFileSync(cfgFile, 'utf8') + config);
  const file = path.join(dir, run('new', 'Export bookings').stdout.trim());
  let text = fs.readFileSync(file, 'utf8').split('## Problem')[0] + good;
  for (const line of ticketFields.split('\n').filter(Boolean)) { const [k, ...v] = line.split(': '); text = setField(text, k, v.join(': ')); }
  fs.writeFileSync(file, text);
  gitIn(dir, 'add', '-A'); gitIn(dir, 'commit', '-qm', 'base');
  gitIn(dir, 'checkout', '-qb', 'speck/0001-x');
  fs.writeFileSync(path.join(dir, 'a.txt'), 'change\n');
  gitIn(dir, 'add', '-A'); gitIn(dir, 'commit', '-qm', 'work');
  const calls = () => fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').map(l => JSON.parse(l)) : [];
  const prompts = () => fs.existsSync(log + '.prompts') ? fs.readFileSync(log + '.prompts', 'utf8').trim().split('\n').map(l => JSON.parse(l)) : [];
  // Rounds are kept in the ticket file (0011).
  const roundFile = n => ticketRounds(fs.readFileSync(file, 'utf8')).rounds[n - 1];
  const runEnv = (more, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env: { ...env, ...extraEnv, ...more } });
  return { dir, run, runEnv, calls, prompts, roundFile, ticketFile: file, git: (...a) => gitIn(dir, ...a) };
}

export const gitEnv = { GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
export const approveVerdict = { verdict: 'approve', criteria: [{ id: 1, status: 'pass', evidence: 'ok' }], findings: [], summary: 's', escalation_question: '' };

// A repo with one ticket built on its branch, approved by the reviewer and set to `approved`. Building one takes about a
// second, so each kind is built once per test file, in a folder that stays until the file's process exits, and each
// call gets a copy of it of its own (0198).
const shipTemplates = new Map();
export function shipRepo({ test = 'true', approve = true } = {}) {
  const key = JSON.stringify([test, approve]);
  if (!shipTemplates.has(key)) shipTemplates.set(key, buildShipRepo(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-keep-ship-')), { test, approve }));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-ship-'));
  fs.cpSync(shipTemplates.get(key), dir, { recursive: true, preserveTimestamps: true });
  const env = { ...process.env, ...gitEnv };
  const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env });
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', env }).stdout.trim();
  // A shipped ticket moves into speck/tickets/done/, so look in both places.
  const ticketAt = () => ['speck/tickets/0001-export-bookings.md', 'speck/tickets/done/0001-export-bookings.md']
    .map(p => path.join(dir, p)).find(p => fs.existsSync(p));
  const status = () => parseTicket(fs.readFileSync(ticketAt(), 'utf8')).fm.status;
  const state = () => ({ branch: g('branch', '--show-current'), main: g('rev-parse', 'main'), feature: g('rev-parse', '--verify', '-q', 'speck/0001-export-bookings') });
  return { dir, run, g, status, state };
}
function buildShipRepo(dir, { test, approve }) {
  const env = { ...process.env, ...gitEnv };
  const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env });
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', env }).stdout.trim();
  g('init', '-q', '-b', 'main');
  assert.equal(run('init', '--skip-checks').status, 0);
  const cfgFile = path.join(dir, 'speck', 'config.yml');
  fs.writeFileSync(cfgFile, fs.readFileSync(cfgFile, 'utf8').replace(/^  test: .*$/m, `  test: ${JSON.stringify(test)}`));
  const file = path.join(dir, run('new', 'Export bookings').stdout.trim());
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').split('## Problem')[0] + good);
  fs.writeFileSync(path.join(dir, 'shared.txt'), 'base\n');
  g('add', '-A'); g('commit', '-qm', 'base');
  g('checkout', '-qb', 'speck/0001-export-bookings');
  fs.writeFileSync(path.join(dir, 'shared.txt'), 'feature\n');
  g('add', '-A'); g('commit', '-qm', 'work');
  if (approve) {
    const v = path.join(os.tmpdir(), `verdict-${path.basename(dir)}.json`);
    fs.writeFileSync(v, JSON.stringify(approveVerdict));
    run('record', '1', v);
    run('set', '1', 'status', 'approved');
    g('add', '-A'); g('commit', '-qm', 'approved');
  }
  return dir;
}

export function doneRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-done-'));
  const env = { ...process.env, ...gitEnv };
  const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env });
  const at = p => fs.existsSync(path.join(dir, p));
  const read = p => fs.readFileSync(path.join(dir, p), 'utf8');
  const fm = p => parseTicket(read(p)).fm;
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir, encoding: 'utf8', env });
  assert.equal(run('init', '--skip-checks').status, 0);
  const add = title => {
    const p = run('new', ...title.split(' ')).stdout.trim();
    fs.writeFileSync(path.join(dir, p), read(p).split('## Problem')[0] + good);
    return p;
  };
  return { dir, run, add, at, read, fm };
}

export const skillText = n => fs.readFileSync(path.join(ROOT, 'skills', n, 'SKILL.md'), 'utf8');
export const fenced = v => '```json\n' + JSON.stringify(v, null, 2) + '\n```\n';
export const subagentVerdict = (verdict, state) => ({
  round: 1, verdict, escalation_question: '', summary: `Round: ${verdict}`,
  criteria: [{ id: 1, status: verdict === 'approve' ? 'pass' : 'fail', evidence: 'a.txt' }],
  findings: [{ id: 'F1', severity: 'blocking', file: 'a.txt', issue: 'Deliberate bug.', suggested_fix: 'Fix it.', state }],
});
export const subagentRepo = () => reviewRepo({ config: 'allow_same_model_review: true\n', ticketFields: 'reviewer: claude-subagent' });

export const changesVerdict = { verdict: 'changes_requested', criteria: [{ id: 1, status: 'fail', evidence: 'a.txt' }], findings: [{ id: 'F1', severity: 'blocking', file: 'a.txt', issue: 'First problem.', suggested_fix: 'Fix it.', state: 'open' }], summary: 'Round one summary.', escalation_question: '' };

// A repo whose ticket uses reviewer "fake", run by a command in config. The fake logs its arguments,
// working folder and stdin, then answers in the format FAKE_MODE asks for.
export function commandRepo({ command = '{bin} --model {model} --effort {effort} --flag "two words"', ticketFields = '', limits = '', options = {} } = {}) {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-fake-'));
  const fake = path.join(bin, 'fake-reviewer');
  const log = path.join(bin, 'calls.log');
  fs.writeFileSync(fake, `#!${process.execPath}
const fs = require('fs');
const stdin = fs.readFileSync(0, 'utf8');
const ticketStatus = (fs.readFileSync('speck/tickets/' + fs.readdirSync('speck/tickets').find(n => n.startsWith('0001-')), 'utf8').match(/^status: (\\S+)/m) || [])[1]; // reads a temporary repo
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({ args: process.argv.slice(2), cwd: process.cwd(), stdin, ticketStatus }) + '\\n');
const v = process.env.FAKE_VERDICT || ${JSON.stringify(JSON.stringify(changesVerdict))};
// FAKE_HANG_PID (0180): starts a process that outlives it, writes that one's pid there, and never ends.
if (process.env.FAKE_HANG_PID) { const c = require('child_process').spawn('sleep', ['300'], { stdio: 'ignore' }); fs.writeFileSync(process.env.FAKE_HANG_PID, String(c.pid)); setInterval(() => {}, 1e6); }
const mode = process.env.FAKE_MODE || 'raw';
if (mode === 'raw') console.log(v);
if (mode === 'fenced') console.log('Here is my review.\\n\\n\`\`\`json\\n' + v + '\\n\`\`\`\\nThanks.');
if (process.env.FAKE_RESUME_FAIL && process.argv.includes('--resume')) { for (let i = 1; i <= 3; i++) console.error('resume err ' + i); process.exit(4); }
if (mode === 'envelope') console.log(JSON.stringify({ type: 'result', is_error: false, session_id: process.env.FAKE_SESSION || 'S1', meta: { sid: 'N1' }, result: 'Done.\\n\`\`\`json\\n' + v + '\\n\`\`\`', usage: { input_tokens: 100, output_tokens: 20 } }));
if (mode === 'garbage') { console.log('I looked at it and it seems fine.'); console.error('note one\\nnote two'); }
if (mode === 'fail') { for (let i = 1; i <= 7; i++) console.error('err line ' + i); process.exit(3); }
if (mode === 'badshape') { console.log(JSON.stringify({ verdict: 'approve' })); for (let i = 1; i <= 7; i++) console.error('warn line ' + i); }
`, { mode: 0o755 });
  const r = reviewRepo({ ticketFields: `reviewer: fake\n${ticketFields}` });
  const cfgFile = path.join(r.dir, 'speck', 'config.yml');
  const extra = Object.entries(options).map(([k, v]) => `    ${k}: ${JSON.stringify(String(v).replace('{bin}', fake))}\n`).join('');
  let c = fs.readFileSync(cfgFile, 'utf8').replace('reviewer_options:\n', `reviewer_options:\n  fake:\n    command: ${JSON.stringify(command.replace('{bin}', fake))}\n${extra}`);
  if (limits) c = c.replace('limits:\n', `limits:\n${limits}`);
  fs.writeFileSync(cfgFile, c);
  r.git('add', '-A'); r.git('commit', '-qm', 'reviewer command');
  const calls = () => fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').map(l => JSON.parse(l)) : [];
  const runEnv = (env, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: r.dir, encoding: 'utf8', env: { ...process.env, ...env } });
  return { ...r, fake, calls, runEnv };
}

export const buildSkill = () => fs.readFileSync(path.join(ROOT, 'skills', 'speck-build', 'SKILL.md'), 'utf8');
export function startRepo({ config = {}, ready = true, commitTooling = true } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  const env = { ...process.env, ...gitEnv };
  const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env });
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', env }).stdout.trim();
  g('init', '-q', '-b', 'main');
  assert.equal(run('init', '--skip-checks').status, 0);
  const cfgFile = path.join(dir, 'speck', 'config.yml');
  let c = fs.readFileSync(cfgFile, 'utf8').replace(/^  test: .*$/m, '  test: "true"');
  for (const [k, v] of Object.entries(config)) c = new RegExp(`^${k}:`, 'm').test(c) ? c.replace(new RegExp(`^${k}:.*$`, 'm'), `${k}: ${v}`) : c + `${k}: ${v}\n`;
  fs.writeFileSync(cfgFile, c);
  const file = path.join(dir, run('new', 'Export bookings').stdout.trim());
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').split('## Problem')[0] + good);
  if (ready) assert.equal(run('set', '1', 'status', 'ready').status, 0);
  g('add', ...(commitTooling ? ['-A'] : ['speck', 'AGENTS.md', 'CLAUDE.md']));
  g('commit', '-qm', 'base');
  const branch = 'speck/0001-export-bookings';
  const worktrees = () => g('worktree', 'list', '--porcelain').split('\n').filter(l => l.startsWith('worktree ')).map(l => fs.realpathSync(l.slice(9)));
  const statusIn = cwd => parseTicket(fs.readFileSync(path.join(cwd, 'speck', 'tickets', '0001-export-bookings.md'), 'utf8')).fm.status;
  return { dir, run, g, branch, worktrees, statusIn, file };
}
