#!/usr/bin/env node
// speck: small tickets, independent review, you merge.
// Deterministic helpers used by the speck skills. No dependencies.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATES = path.join(ROOT, 'templates');
const STATUSES = ['draft', 'ready', 'building', 'reviewing', 'blocked', 'approved', 'done', 'cancelled'];
const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'];
const LOCKFILES = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb|poetry\.lock|uv\.lock|Pipfile\.lock|Cargo\.lock|Gemfile\.lock|go\.sum|composer\.lock)$/;
const TESTFILES = /(^|\/)(test|tests|__tests__|spec)\/|\.(test|spec)\.[a-z]+$|_test\.[a-z]+$|(^|\/)test_[^/]+$/;
const RISKY = /(auth|login|password|session|token|secret|\.env|payment|billing|stripe|migration|migrate|schema\.sql|terraform|\.tf$|dockerfile|docker-compose|\.github\/workflows|infra\/|deploy)/i;

// ---------- small utilities ----------

class SpeckError extends Error {
  constructor(message, code = 1) { super(message); this.code = code; this.name = 'SpeckError'; }
}

function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });
  if (r.error) throw new SpeckError(`${cmd} failed: ${r.error.message}`);
  return r;
}

function git(args, cwd) {
  const r = sh('git', args, { cwd });
  if (r.status !== 0) throw new SpeckError(`git ${args.join(' ')}: ${r.stderr.trim()}`);
  return r.stdout;
}

function findRepoRoot(start = process.cwd()) {
  let dir = start;
  while (true) {
    if (fs.existsSync(path.join(dir, 'speck', 'config.yml'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new SpeckError('No speck/config.yml found. Run `speck init` in your repo first.');
    dir = parent;
  }
}

// Minimal YAML for speck's own config: nested maps by indentation, scalars, inline [] and {}.
export function parseYaml(text) {
  const root = {};
  const stack = [{ indent: -1, obj: root }];
  for (const raw of text.split('\n')) {
    const line = stripComment(raw);
    if (!line.trim()) continue;
    const indent = line.length - line.trimStart().length;
    const m = line.trim().match(/^([A-Za-z0-9_.-]+):\s*(.*)$/);
    if (!m) continue;
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].obj;
    if (m[2] === '') {
      parent[m[1]] = {};
      stack.push({ indent, obj: parent[m[1]] });
    } else {
      parent[m[1]] = scalar(m[2]);
    }
  }
  return root;
}

function stripComment(line) {
  let inS = false, inD = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '\\' && inD) { i++; continue; } // an escaped character inside double quotes never closes them
    if (c === "'" && !inD) inS = !inS;
    else if (c === '"' && !inS) inD = !inD;
    else if (c === '#' && !inS && !inD && (i === 0 || /\s/.test(line[i - 1]))) return line.slice(0, i).trimEnd();
  }
  return line.trimEnd();
}

function scalar(v) {
  v = v.trim();
  if (v === '[]') return [];
  if (v === '{}') return {};
  if (v.startsWith('[') && v.endsWith(']')) return v.slice(1, -1).split(',').map(s => scalar(s)).filter(s => s !== '');
  if (v.length > 1 && v.startsWith('"') && v.endsWith('"')) { try { return JSON.parse(v); } catch { return v.slice(1, -1); } }
  if (v.length > 1 && v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1);
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+$/.test(v)) return Number(v);
  return v;
}

function loadConfig(repo) {
  const cfg = parseYaml(fs.readFileSync(path.join(repo, 'speck', 'config.yml'), 'utf8'));
  const limits = {
    max_acceptance_criteria: 5, max_changed_lines: 300, max_review_rounds: 3,
    escalate_after_repeat_disputes: 2, max_ticket_body_lines: 40, ...(cfg.limits || {}),
  };
  return { base_branch: 'main', branch_prefix: 'speck/', builder: 'claude', reviewer: 'codex',
    allow_same_model_review: false, auto_ship: false, auto_ship_risk: ['low'], worktrees: false, worktree_setup: '', commands: {}, github: { status_check: 'speck/review' }, ...cfg, limits };
}

// ---------- tickets ----------

export function parseTicket(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new SpeckError('Ticket has no frontmatter.');
  const fm = parseYaml(m[1]);
  const sections = {};
  let current = null;
  for (const line of m[2].split('\n')) {
    const h = line.match(/^##\s+(.+?)\s*$/);
    if (h) { current = h[1].toLowerCase(); sections[current] = []; continue; }
    if (current) sections[current].push(line);
  }
  return { fm, sections, raw: text };
}

function contentLines(lines = []) {
  return lines.join('\n').replace(/<!--[\s\S]*?-->/g, '').split('\n').map(l => l.trim()).filter(Boolean);
}

export function setField(text, key, value) {
  const fmEnd = text.indexOf('\n---', 4);
  const head = text.slice(0, fmEnd);
  const rest = text.slice(fmEnd);
  const needsQuotes = typeof value === 'string' && !/^".*"$/.test(value) && (key === 'id' || /[:#]/.test(value) || value === '');
  const v = needsQuotes ? JSON.stringify(value) : value;
  // Replace the existing line whatever its old value holds (even a "#"), keeping only a trailing comment.
  const re = new RegExp(`^${key}:(.*)$`, 'm');
  if (re.test(head)) return head.replace(re, (_, old) => `${key}: ${v}${old.slice(stripComment(old).length)}`) + rest;
  // Keep any blank line before the closing fence (it stops Markdown viewers rendering the frontmatter as a heading).
  const gap = head.match(/\n*$/)[0];
  return `${head.slice(0, head.length - gap.length)}\n${key}: ${v}${gap}${rest}`;
}

const blank = v => v === undefined || v === null || String(v).trim() === '';
// A ticket's type: null when it's missing or blank, otherwise its value ("bug" is the only valid one).
// A bare `type:` parses as an empty mapping, just like `type: {}`, so the frontmatter line itself says which it was.
function ticketType(ticket) {
  const v = ticket.fm.type;
  if (v === undefined || v === null || (typeof v === 'string' && !v.trim())) return null;
  const line = ticket.raw.slice(0, fmEnd(ticket.raw)).match(/^type:(.*)$/m);
  const empty = v && typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length;
  return empty && line && stripComment(line[1]).trim() === '' ? null : v;
}

// The reviewer model and effort for a ticket: a ticket value wins, a blank one falls back to config, null means "reviewer's default".
export function reviewerSettings(fm = {}, cfg = {}) {
  const pick = k => !blank(fm[k]) ? String(fm[k]).trim() : !blank(cfg[k]) ? String(cfg[k]).trim() : null;
  return { model: pick('reviewer_model'), effort: pick('reviewer_effort') };
}

function settingsMeta(s) { return { reviewer_model: s.model || 'default', reviewer_effort: s.effort || 'default' }; }

// ---------- the readable header under the frontmatter ----------

const STATUS_EMOJI = { draft: '📝', ready: '📋', building: '🔨', reviewing: '🔍', blocked: '⛔', approved: '👍', done: '✅', cancelled: '❌' };

// The heading and status line that open every ticket, rendered from the frontmatter (the source of truth).
export function ticketHeader(fm) {
  return `# ${fm.id} · ${fm.title}\n\n**Status:** ${[STATUS_EMOJI[fm.status], fm.status].filter(Boolean).join(' ')}`;
}

// Splits a ticket body into the header speck wrote (heading and status line, if present) and everything after it.
// Works line by line and only ever skips empty lines inside the header, so the rest of the body is kept byte for byte.
function splitHeader(body) {
  const lines = body.split('\n');
  const isHeading = l => /^# \d{4} · /.test(l);
  const isStatus = l => /^\*\*Status:\*\*/.test(l);
  const skipEmpty = i => { while (i < lines.length && lines[i] === '') i++; return i; };
  let i = skipEmpty(0), heading, status;
  if (isHeading(lines[i] ?? '')) { heading = lines[i]; i = skipEmpty(i + 1); }
  if (isStatus(lines[i] ?? '')) { status = lines[i]; i += 1; }
  else if (heading) i = lines.indexOf(heading) + 1; // no status line: keep any empty lines after the heading as body
  if (!heading && !status) return { rest: body };
  return { heading, status, rest: lines.slice(i).join('\n') };
}

function fmEnd(text) { return text.indexOf('\n---', 4) + 5; }

// Rewrites the header to match the frontmatter, adding it if it's missing. Nothing else changes.
export function syncHeader(text) {
  const end = fmEnd(text);
  const { rest } = splitHeader(text.slice(end));
  // One empty line separates the header from the body; the body's own empty lines and indentation are kept as they are.
  const sep = rest === '' || rest.startsWith('\n') ? '' : '\n';
  return `${text.slice(0, end)}${ticketHeader(parseTicket(text).fm)}\n${sep}${rest}`;
}

function ticketsDir(repo) { return path.join(repo, 'speck', 'tickets'); }
// Finished tickets sit in a done/ folder, so speck/tickets/ holds only work in progress.
function doneTicketsDir(repo) { return path.join(ticketsDir(repo), 'done'); }
function ticketDirs(repo) { return [ticketsDir(repo), doneTicketsDir(repo)]; }
function ideasDir(repo) { return path.join(repo, 'speck', 'ideas'); }
// Idea notes are filed here once ticketed, as done tickets are in speck/tickets/done/.
function doneIdeasDir(repo) { return path.join(ideasDir(repo), 'done'); }
const repoPath = (repo, file) => path.relative(repo, file).split(path.sep).join('/');

function listTickets(repo) {
  const seen = new Map();
  for (const dir of ticketDirs(repo)) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!/^\d{4}-.*\.md$/.test(f)) continue;
      // ticketDirs lists the live folder first, so if a name is in both (which shouldn't happen) the live copy wins.
      // findTicket reports that clash rather than guessing.
      if (!seen.has(f)) seen.set(f, path.join(dir, f));
    }
  }
  return [...seen.keys()].sort().map(f => ({ file: seen.get(f), ...parseTicket(fs.readFileSync(seen.get(f), 'utf8')) }));
}

function findTicket(repo, id) {
  const pad = String(id).padStart(4, '0');
  const found = ticketDirs(repo).flatMap(dir => {
    if (!fs.existsSync(dir)) return [];
    const f = fs.readdirSync(dir).find(n => n.startsWith(`${pad}-`) && n.endsWith('.md'));
    return f ? [path.join(dir, f)] : [];
  });
  if (found.length > 1)
    throw new SpeckError(`Ticket ${pad} is in two places: ${found.map(f => path.relative(repo, f)).join(' and ')}. Keep one copy, then run this again.`);
  if (!found.length) throw new SpeckError(`Ticket ${pad} not found in speck/tickets/ or speck/tickets/done/.`);
  return { file: found[0], ...parseTicket(fs.readFileSync(found[0], 'utf8')) };
}

// A ticket lives in speck/tickets/, or in speck/tickets/done/ while it is closed. Closed means done or cancelled:
// both are filed away with finished work, so speck/tickets/ holds only live work. Moves it if the status it is
// being given says otherwise, and returns where it was found, so the caller can stage the move.
function placeTicket(repo, t, status) {
  const from = t.file;
  const closed = status === 'done' || status === 'cancelled';
  const to = path.join(closed ? doneTicketsDir(repo) : ticketsDir(repo), path.basename(from));
  if (path.resolve(from) === path.resolve(to)) return from;
  // Never overwrite: the same name already in the other folder is a second copy, and losing it would be data loss.
  if (fs.existsSync(to))
    throw new SpeckError(`There are two tickets called ${path.basename(from)}: ${path.relative(repo, to)} and ${path.relative(repo, from)}. Keep one and delete the other, then run this again.`);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.renameSync(from, to);
  t.file = to;
  return from;
}

export function nextId(repo) {
  const ids = listTickets(repo).map(t => parseInt(path.basename(t.file).slice(0, 4), 10));
  return String((ids.length ? Math.max(...ids) : 0) + 1).padStart(4, '0');
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'ticket';
}

// A claude-subagent reviewer is Claude, so it counts as the same model as a claude builder.
const modelFamily = agent => agent === 'claude-subagent' ? 'claude' : agent;

export function lintTicket(ticket, cfg) {
  const errors = [], warnings = [];
  const { fm, sections } = ticket;
  const L = cfg.limits;
  if (!fm.title) errors.push('Title is empty.');
  else if (/\band\b|&|\+/i.test(fm.title)) warnings.push(`Title "${fm.title}" may join two outcomes. Split it unless it's genuinely one outcome.`);
  if (!['S', 'M', 'L'].includes(fm.size)) errors.push(`size must be S or M (got "${fm.size}").`);
  if (fm.size === 'L') errors.push('size L can never be ready: split it into sibling tickets.');
  if (!['low', 'high'].includes(fm.risk)) errors.push(`risk must be low or high (got "${fm.risk}").`);
  if (ticketType(ticket) !== null && fm.type !== 'bug') errors.push(`type must be blank or bug (got "${fm.type}").`);
  if (!STATUSES.includes(fm.status)) errors.push(`status must be one of ${STATUSES.join(', ')}.`);
  if (fm.builder && modelFamily(fm.builder) === modelFamily(fm.reviewer) && !cfg.allow_same_model_review)
    errors.push(fm.builder === fm.reviewer
      ? `builder and reviewer are both "${fm.builder}". Use a different reviewer or set allow_same_model_review: true.`
      : `builder "${fm.builder}" and reviewer "${fm.reviewer}" are the same model. Use a different reviewer or set allow_same_model_review: true.`);
  const top = splitHeader(ticket.raw.slice(fmEnd(ticket.raw)));
  const [wantHeading, , wantStatus] = ticketHeader(fm).split('\n');
  if (!top.heading) warnings.push(`No \`${wantHeading}\` heading at the top. Run \`speck init\` again to add it.`);
  else if (top.heading !== wantHeading) warnings.push(`The heading "${top.heading}" doesn't match the frontmatter title. Run \`speck init\` again to fix it.`);
  if (!top.status) warnings.push(`No \`${wantStatus}\` status line under the heading. Run \`speck init\` again to add it.`);
  else if (top.status !== wantStatus) warnings.push(`The status line "${top.status}" doesn't match the frontmatter status. Run \`speck init\` again to fix it.`);
  for (const [where, v] of [['ticket', fm.reviewer_effort], ['config', cfg.reviewer_effort]])
    if (!blank(v) && !EFFORTS.includes(String(v).trim())) errors.push(`reviewer_effort "${v}" in ${where} must be blank or one of ${EFFORTS.join(', ')}.`);
  errors.push(...ticketRounds(ticket.raw).errors);
  for (const s of ['problem', 'outcome']) if (!contentLines(sections[s]).length) errors.push(`"${s}" section is empty.`);
  const ac = contentLines(sections['acceptance criteria']).filter(l => /^\d+\.\s+\S/.test(l));
  if (ac.length === 0) errors.push('No numbered acceptance criteria.');
  if (ac.length > L.max_acceptance_criteria) errors.push(`${ac.length} acceptance criteria (max ${L.max_acceptance_criteria}). Split the ticket.`);
  if (!contentLines(sections['out of scope']).filter(l => l !== '-').length) warnings.push('"Out of scope" is empty. Say what this ticket will not do.');
  const body = ['problem', 'outcome', 'acceptance criteria', 'out of scope', 'notes']
    .reduce((n, s) => n + contentLines(sections[s]).length, 0);
  if (body > L.max_ticket_body_lines) errors.push(`Ticket body is ${body} lines (max ${L.max_ticket_body_lines}). It's too big for one agent: split it.`);
  return { errors, warnings, acceptanceCriteria: ac };
}

// ---------- diff size ----------

export function changedLines(repo, base) {
  const mb = git(['merge-base', base, 'HEAD'], repo).trim();
  const rows = git(['diff', '--numstat', mb], repo).trim().split('\n').filter(Boolean).map(r => {
    const [a, d, f] = r.split('\t');
    return { file: f, lines: (parseInt(a, 10) || 0) + (parseInt(d, 10) || 0) };
  });
  for (const f of git(['ls-files', '--others', '--exclude-standard'], repo).split('\n').filter(Boolean)) {
    try { rows.push({ file: f, lines: fs.readFileSync(path.join(repo, f), 'utf8').split('\n').length }); } catch { /* binary or unreadable */ }
  }
  const counted = rows.filter(r => !LOCKFILES.test(r.file) && !TESTFILES.test(r.file) && !r.file.startsWith('speck/'));
  return { total: counted.reduce((n, r) => n + r.lines, 0), files: rows, counted };
}

// ---------- reviews ----------

// Every review round lives in its ticket, in a `## Review rounds` section at the end that only speck writes.
// Each round is a collapsed <details> block with a one-line summary and the full record as JSON.
const ROUNDS_HEADING = '## Review rounds';

// Splits a ticket into the text before the Review rounds section, the section, and anything after it.
function splitRounds(text) {
  const m = text.match(/^## Review rounds[ \t]*$/m);
  if (!m) return { before: text, section: '', after: '' };
  const from = m.index + m[0].length;
  const next = text.slice(from).search(/^## /m);
  const end = next === -1 ? text.length : from + next;
  return { before: text.slice(0, m.index), section: text.slice(m.index, end), after: text.slice(end) };
}

// The ticket without its Review rounds section, for the reviewer's diff and prompt.
export function stripRounds(text) {
  const { before, after } = splitRounds(text);
  return (before + after).replace(/\n*$/, '\n');
}

// The rounds recorded in a ticket, plus any problems with them (bad JSON, or rounds not numbered 1, 2, 3… in order).
export function ticketRounds(text) {
  const { section } = splitRounds(text);
  const rounds = [], errors = [];
  // Split on <details> at the start of a line first, so a damaged block can't borrow the next block's code fence
  // and hide a round. JSON strings never start a line, so a reviewer quoting "<details>" can't split a round.
  const [prefix, ...blocks] = section.split(/^(?=<details>)/m);
  // Before the first round only the heading, comments and empty lines are allowed, so nothing there is silently ignored.
  if (prefix.replace(/^## Review rounds[ \t]*$/m, '').replace(/<!--[\s\S]*?-->/g, '').trim())
    errors.push(`"${ROUNDS_HEADING}" has something before its first round that isn't a round block. Only speck writes this section.`);
  blocks.forEach((block, i) => {
    const m = block.match(/^<details><summary>[^\n]*<\/summary>\n\n```json\n([\s\S]*)\n```\n\n<\/details>\s*$/);
    if (!m) return errors.push(`Review round ${i + 1} in "${ROUNDS_HEADING}" isn't a complete block (a <details> summary, a \`json\` code block and </details>).`);
    try { rounds.push(JSON.parse(m[1])); } catch (e) { errors.push(`Review round ${i + 1} in "${ROUNDS_HEADING}" isn't valid JSON (${e.message}).`); }
  });
  const numbers = rounds.map(r => r?.meta?.round);
  if (!errors.length && numbers.some((r, i) => r !== i + 1))
    errors.push(`Review rounds are numbered ${numbers.join(', ')}, but must be 1, 2, 3… in order.`);
  return { rounds, errors };
}

function roundBlock(rec) {
  return `<details><summary>Round ${rec.meta.round} · ${rec.meta.reviewer} · ${rec.verdict.verdict}</summary>\n\n\`\`\`json\n${JSON.stringify(rec, null, 2)}\n\`\`\`\n\n</details>`;
}

// Adds rounds to the end of the Review rounds section, creating it at the end of the ticket if needed. Nothing else changes.
function appendRounds(text, recs) {
  const { before, section, after } = splitRounds(text);
  const head = section ? before : before.replace(/\n*$/, '\n\n');
  const body = section ? section.replace(/\n*$/, '\n') : `${ROUNDS_HEADING}\n<!-- Written by speck after each review round. Don't edit it by hand. -->\n`;
  return head + body + recs.map(r => `\n${roundBlock(r)}\n`).join('') + (after ? `\n${after}` : '');
}

function rounds(repo, id) {
  const t = findTicket(repo, id);
  const { rounds: all, errors } = ticketRounds(t.raw);
  if (errors.length) throw new SpeckError(`${path.relative(repo, t.file)}: ${errors[0]} Restore that section from git, then run this again.`);
  return all;
}

// Working files for a review in progress (raw reviewer output, saved reviewer settings). Not history, so git ignores them.
function cacheDir(repo, id) {
  const root = path.join(repo, 'speck', '.cache');
  const dir = path.join(root, String(id).padStart(4, '0'));
  fs.mkdirSync(dir, { recursive: true });
  const ignore = path.join(root, '.gitignore');
  if (!fs.existsSync(ignore)) fs.writeFileSync(ignore, '# Working files for reviews in progress. Review history is in each ticket.\n*\n');
  return dir;
}

const posix = p => p.split(path.sep).join('/');

// The first review round moves a ticket from building to reviewing, and any round moves an approved one back to
// reviewing (a re-review after merging the base branch in). Returns the text unchanged otherwise.
function startReviewing(text, round = 1) {
  const status = parseTicket(text).fm.status;
  return status === 'approved' || (status === 'building' && round === 1) ? syncHeader(setField(text, 'status', 'reviewing')) : text;
}

// True if the ticket's only uncommitted changes are to its Review rounds section, and the building → reviewing or
// approved → reviewing status change a round makes, so it can't hide unreviewed work.
function onlyRoundsChanged(repo, rel, text) {
  const head = sh('git', ['show', `HEAD:${rel}`], { cwd: repo });
  if (head.status !== 0) return false;
  const now = stripRounds(text);
  return stripRounds(head.stdout) === now || stripRounds(startReviewing(head.stdout)) === now;
}

// What the reviewer sees: every change from `since` to `to`, with every ticket's Review rounds section, and any old speck/reviews/ files, left out.
function reviewDiff(repo, since, to = 'HEAD') {
  const tickets = git(['diff', '--no-renames', '--name-only', `${since}..${to}`, '--', 'speck/tickets'], repo)
    .split('\n').filter(f => /\.md$/.test(f));
  // Old speck/reviews/ files are history too: removing them when init moves them into tickets isn't a code change.
  let out = git(['diff', '--no-renames', `${since}..${to}`, '--', '.', ':(exclude)speck/reviews', ...tickets.map(f => `:(exclude,literal)${f}`)], repo);
  for (const rel of tickets) {
    const version = rev => { const r = sh('git', ['show', `${rev}:${rel}`], { cwd: repo }); return r.status === 0 ? stripRounds(r.stdout) : ''; };
    const a = version(since), b = version(to);
    if (a === b) continue;
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-diff-'));
    try {
      fs.writeFileSync(path.join(tmp, 'a'), a);
      fs.writeFileSync(path.join(tmp, 'b'), b);
      const d = sh('git', ['diff', '--no-index', '--no-color', 'a', 'b'], { cwd: tmp }).stdout;
      const header = { 'diff --git a/a b/b': `diff --git a/${rel} b/${rel}`, '--- a/a': `--- a/${rel}`, '+++ b/b': `+++ b/${rel}` };
      out += d.split('\n').map(l => header[l] ?? l).join('\n');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  }
  return out;
}

export function validateVerdict(v) {
  const problems = [];
  if (!['approve', 'changes_requested', 'escalate'].includes(v.verdict)) problems.push('verdict');
  const entries = a => Array.isArray(a) && a.every(e => e && typeof e === 'object' && !Array.isArray(e));
  if (!entries(v.criteria)) problems.push('criteria');
  if (!entries(v.findings)) problems.push('findings');
  if (typeof v.summary !== 'string') problems.push('summary');
  if (problems.length) throw new SpeckError(`Reviewer output is missing or invalid: ${problems.join(', ')}.`);
  // An approval is only valid with no open blocking findings and every criterion passing.
  const openBlocking = v.findings.filter(f => f.severity === 'blocking' && ['open', 'dispute_rejected'].includes(f.state));
  const notPassing = v.criteria.filter(c => c.status !== 'pass');
  if (v.verdict === 'approve' && (openBlocking.length || notPassing.length)) {
    v.verdict = 'changes_requested';
    v.summary = `[speck: approval overridden: ${openBlocking.length} open blocking finding(s), ${notPassing.length} criterion/criteria not passing] ${v.summary}`;
  }
  return v;
}

// Decide what the builder must do next, given all rounds so far.
export function nextAction(all, cfg) {
  const last = all[all.length - 1];
  if (!last) return { action: 'review' };
  const v = last.verdict;
  if (v.verdict === 'approve') return { action: 'ship' };
  if (v.verdict === 'escalate') return { action: 'block', reason: v.escalation_question || 'Reviewer escalated.' };
  const n = cfg.limits.escalate_after_repeat_disputes;
  if (all.length >= n) {
    const recent = all.slice(-n).map(r => new Set(r.verdict.findings.filter(f => f.state === 'dispute_rejected').map(f => f.id)));
    const repeated = [...recent[0]].filter(id => recent.every(s => s.has(id)));
    if (repeated.length) return { action: 'block', reason: `Builder and reviewer disagree on ${repeated.join(', ')} for ${n} rounds in a row. Needs your decision.` };
  }
  if (all.length >= cfg.limits.max_review_rounds) return { action: 'block', reason: `No approval after ${all.length} review rounds.` };
  return { action: 'fix' };
}

// Round 1 also sets a building ticket to reviewing, and any round an approved one, in the same write, so a refused verdict changes nothing.
function saveRound(repo, id, verdict, meta) {
  const t = findTicket(repo, id);
  const round = rounds(repo, id).length + 1;
  const record = { meta: { round, ...meta, saved_at: new Date().toISOString() }, verdict: validateVerdict({ ...verdict, round }) };
  fs.writeFileSync(t.file, appendRounds(startReviewing(t.raw, round), [record]));
  return record;
}

function reviewerPrompt(repo, ticket, cfg, round, extra) {
  const tpl = fs.readFileSync(path.join(TEMPLATES, 'reviewer-prompt.md'), 'utf8');
  if (round === 1) {
    const values = { TICKET: stripRounds(ticket.raw), BASE: cfg.base_branch, DIFF: extra.diff, TESTS: extra.tests };
    return tpl.replace(/\{\{(TICKET|BASE|DIFF|TESTS)\}\}/g, (_, k) => values[k]);
  }
  return [
    `# Review round ${round}`,
    'The builder has responded to your previous findings. Keep finding ids stable. For each earlier finding, set state to resolved, dispute_accepted or dispute_rejected (or keep it open if the fix is incomplete). Raise new findings only for real problems introduced or missed.',
    '## Builder response', extra.response || '(none provided)',
    ...(extra.merged ? [`This round follows a merge of ${cfg.base_branch} into the ticket branch, made to resolve a conflict when shipping. So the diff below is the branch's whole change against ${cfg.base_branch} as merged, which is what would ship, not only the changes since your last review. Check that each resolved file keeps the intent of both sides.`] : []),
    `## ${extra.merged ? `The whole change against ${cfg.base_branch} as merged` : 'Changes since your last review'} (${extra.sinceSha.slice(0, 8)}..HEAD)`, '```diff', extra.diff, '```',
    '## Test output', '```', extra.tests, '```',
    'Re-check every acceptance criterion against the code as it is now and return the full verdict JSON.',
  ].join('\n\n');
}

const NO_INSPECT = '⚠️ Reviewer could not inspect the repo; reviewed the diff only';

// True when a command the reviewer ran failed because its sandbox (bubblewrap) could not start.
function sandboxFailed(events) {
  return events.some(e => e.item?.type === 'command_execution' && e.item.status !== 'in_progress' && (e.item.status === 'failed' || (e.item.exit_code ?? 0) !== 0)
    && /bwrap/i.test(String(e.item.aggregated_output ?? '')));
}

// Refuses if a tracked file is modified or staged and not committed, apart from the ticket's own recorded rounds and
// the status change round 1 makes. Untracked files don't count: they may be another session's, and they aren't
// part of what the reviewer reviews.
function requireCommitted(repo, ticket, message) {
  const rel = posix(path.relative(repo, ticket.file));
  // Both the ticket's working copy and its staged copy must differ from HEAD only by those, so a staged edit can't hide.
  const staged = sh('git', ['show', `:${rel}`], { cwd: repo });
  const ticketOk = () => onlyRoundsChanged(repo, rel, ticket.raw) && staged.status === 0 && onlyRoundsChanged(repo, rel, staged.stdout);
  const status = git(['status', '--porcelain', '--untracked-files=no'], repo).split('\n')
    .filter(l => l && !(l.slice(3) === rel && ticketOk()));
  if (status.length) throw new SpeckError(`${message} Uncommitted: ${status.map(l => l.slice(3)).join(', ')}. Untracked files are fine.`);
}

// The base branch as ship would merge into it: its remote copy as last fetched, when that is ahead of the local
// branch (ship catches up with it first), otherwise the local branch. No fetch: it reads what's already there.
function shipBase(repo, base) {
  const remote = sh('git', ['config', `branch.${base}.remote`], { cwd: repo }).stdout.trim();
  const theirs = remote && sh('git', ['rev-parse', '--verify', '-q', `refs/remotes/${remote}/${base}`], { cwd: repo }).stdout.trim();
  return theirs && isAncestor(repo, base, theirs) ? `${remote}/${base}` : base;
}

// Where the reviewer's diff starts: the base branch's merge base in round 1, otherwise the commit the last round
// reviewed. If the branch has merged the base branch in since then (its merge base moved), it starts at the new merge
// base instead, so the reviewer sees the branch's whole change against the base as merged: what would ship.
function reviewSince(repo, cfg, prior) {
  const target = shipBase(repo, cfg.base_branch);
  const base = git(['merge-base', target, 'HEAD'], repo).trim();
  const last = prior[prior.length - 1]?.meta?.reviewed_sha;
  if (!last) return { base, sinceSha: base, merged: false };
  const was = sh('git', ['merge-base', target, last], { cwd: repo });
  const merged = was.status === 0 && was.stdout.trim() !== base;
  return { base, sinceSha: merged ? base : last, merged };
}

// Everything a review round needs, checked before any reviewer runs: the round number, the commit under review,
// the diff since the last round and the builder's inputs.
function reviewSetup(repo, id, opts) {
  const cfg = loadConfig(repo);
  const ticket = findTicket(repo, id);
  const prior = rounds(repo, id);
  const round = prior.length + 1;
  if (round > cfg.limits.max_review_rounds) throw new SpeckError(`Max review rounds (${cfg.limits.max_review_rounds}) reached. Block the ticket.`, 3);
  requireCommitted(repo, ticket, 'Commit your work before review: the reviewer reviews commits, not the working tree.');
  const head = git(['rev-parse', 'HEAD'], repo).trim();
  const { base, sinceSha, merged } = reviewSince(repo, cfg, prior);
  const diff = reviewDiff(repo, sinceSha);
  const tests = opts.tests ? fs.readFileSync(opts.tests, 'utf8') : '(no test output provided)';
  const response = opts.response ? fs.readFileSync(opts.response, 'utf8') : '';
  return { cfg, ticket, prior, round, head, base, sinceSha, merged, diff, tests, response };
}

// Runs a review round. Round 1 on a building ticket, or any round on an approved one, sets it to reviewing before the
// reviewer starts, and puts the ticket back exactly as it was if the round fails, so only a recorded round leaves the status changed.
function reviewRound(repo, id, opts, run) {
  const s = reviewSetup(repo, id, opts);
  const marked = startReviewing(s.ticket.raw, s.round);
  if (marked === s.ticket.raw) return run(s);
  fs.writeFileSync(s.ticket.file, marked);
  try { return run(s); } catch (e) { fs.writeFileSync(s.ticket.file, s.ticket.raw); throw e; }
}

function runCodexReview(repo, id, s) {
  const { cfg, ticket, prior, round, head, sinceSha, merged, diff, tests, response } = s;
  const prompt = reviewerPrompt(repo, ticket, cfg, round, { diff, tests, response, sinceSha, merged });

  const out = path.join(cacheDir(repo, id), `round-${round}.out.json`);
  const schema = path.join(TEMPLATES, 'review-verdict.schema.json');
  // Later rounds resume the Codex session recorded with the most recent round that has one.
  const lastThread = [...prior].reverse().find(r => r.meta?.thread_id)?.meta.thread_id;
  const sandbox = cfg.reviewer_options?.codex?.sandbox || 'read-only';
  const settings = reviewerSettings(ticket.fm, cfg);
  const common = ['--json', '--output-schema', schema, '-o', out, '-c', `sandbox_mode="${sandbox}"`,
    ...(settings.model ? ['-m', settings.model] : []), ...(settings.effort ? ['-c', `model_reasoning_effort="${settings.effort}"`] : [])];
  const args = round === 1 || !lastThread
    ? ['exec', '--sandbox', sandbox, ...common, '-']
    : ['exec', 'resume', ...common, lastThread, '-'];
  const started = Date.now();
  const r = sh('codex', args, { cwd: repo, input: prompt });
  if (r.status !== 0) throw new SpeckError(`codex exited ${r.status}: ${r.stderr.trim().split('\n').slice(-5).join('\n')}`);
  const events = r.stdout.split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return {}; } });
  const thread = events.find(e => e.type === 'thread.started')?.thread_id || (round > 1 ? lastThread : undefined);
  const usage = events.filter(e => e.type === 'turn.completed').map(e => e.usage).pop() || {};
  const verdict = JSON.parse(fs.readFileSync(out, 'utf8'));
  fs.rmSync(out);
  return saveRound(repo, id, verdict, { reviewer: 'codex', ...settingsMeta(settings), reviewed_sha: head, thread_id: thread, ...(sandboxFailed(events) ? { sandbox_ok: false } : {}), seconds: Math.round((Date.now() - started) / 1000), usage });
}

// ---------- review pack ----------

// The round-1 prompt with the verdict schema: what `speck prompt` prints, and what a command reviewer gets on stdin.
function fullPrompt(repo, ticket, cfg, diff, tests) {
  return `${reviewerPrompt(repo, ticket, cfg, 1, { diff, tests })}\n\nReturn ONLY a JSON object matching this schema:\n${fs.readFileSync(path.join(TEMPLATES, 'review-verdict.schema.json'), 'utf8')}`;
}

// Splits a command into words the way a shell would for plain quoting, so it can run without a shell.
export function splitCommand(cmd) {
  const words = [];
  let word = null, quote = null;
  for (const ch of String(cmd)) {
    if (quote) { if (ch === quote) quote = null; else word += ch; }
    else if (ch === '"' || ch === "'") { quote = ch; word ??= ''; }
    else if (/\s/.test(ch)) { if (word !== null) words.push(word); word = null; }
    else word = (word ?? '') + ch;
  }
  if (quote) throw new SpeckError(`The reviewer command has an unclosed ${quote} quote: ${cmd}`);
  if (word !== null) words.push(word);
  return words;
}

// Fills in {model}, {effort} and {session}. A blank value removes its word, and the flag just before it when the placeholder stands alone.
export function commandArgs(cmd, values) {
  const out = [];
  for (const word of splitCommand(cmd)) {
    const keys = [...word.matchAll(/\{(model|effort|session)\}/g)].map(m => m[1]);
    if (keys.some(k => !values[k])) {
      if (/^\{(model|effort|session)\}$/.test(word) && out.length && out[out.length - 1].startsWith('-')) out.pop();
      continue;
    }
    out.push(word.replace(/\{(model|effort|session)\}/g, (_, k) => values[k]));
  }
  return out;
}

// A JSON object from text that is JSON, or holds a ```json fenced block.
function jsonIn(text) {
  const tries = [text.trim(), ...[...String(text).matchAll(/```[a-z]*\r?\n([\s\S]*?)\r?\n```/gi)].map(m => m[1])];
  for (const s of tries) {
    try { const v = JSON.parse(s); if (v && typeof v === 'object' && !Array.isArray(v)) return v; } catch { /* try the next */ }
  }
  return null;
}

// The verdict in a command reviewer's stdout: the whole output, a fenced block, or an envelope whose `result` string holds it.
export function verdictFromOutput(stdout) {
  const v = jsonIn(stdout);
  if (v && !('verdict' in v) && typeof v.result === 'string') return { verdict: jsonIn(v.result), envelope: v };
  return { verdict: v, envelope: null };
}

// The round-1 prompt exactly as it was sent, saved with the review's working files. If that copy is gone (another
// machine, or a cleared cache), it is rebuilt from the commit round 1 reviewed. Only its test output can't be recovered.
// A copy saved by a speck that still sent speck/product.md is rebuilt the same way, keeping the test output it holds.
const roundOneFile = (repo, id) => path.join(cacheDir(repo, id), 'round-1.prompt.md');
const LEGACY_SPEC = '## Living spec (speck/product.md)';
function savedTests(text) {
  const head = '## Test output (from the builder)\n\n```\n';
  const from = text.indexOf(head);
  const to = text.lastIndexOf('\n```', text.lastIndexOf('Return ONLY a JSON object'));
  return from >= 0 && to >= from + head.length ? text.slice(from + head.length, to) : '(the round-1 test output was not kept)';
}
function roundOnePrompt(repo, s, id) {
  const file = roundOneFile(repo, id);
  const saved = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (saved !== null && !saved.includes(LEGACY_SPEC)) return saved;
  const sha = s.prior[0].meta.reviewed_sha;
  const at = rel => { const r = sh('git', ['show', `${sha}:${rel}`], { cwd: repo }); return r.status === 0 ? r.stdout : null; };
  const ticket = { raw: at(posix(path.relative(repo, s.ticket.file))) ?? s.ticket.raw };
  // Against the base as it was then: the branch may have merged a newer base since.
  const base = git(['merge-base', s.cfg.base_branch, sha], repo).trim();
  return fullPrompt(repo, ticket, s.cfg, reviewDiff(repo, base, sha), saved === null ? '(the round-1 test output was not kept)' : savedTests(saved));
}

// Later rounds give a reviewer with no memory everything it has seen: the round-1 prompt, every earlier verdict and
// builder response in order, then this round's response, diff and tests.
function historyPrompt(repo, s, id) {
  const parts = [roundOnePrompt(repo, s, id), '# Earlier review rounds'];
  for (const r of s.prior) {
    if (r.meta.builder_response) parts.push(`## Builder response before round ${r.meta.round}`, r.meta.builder_response);
    parts.push(`## Your round ${r.meta.round} verdict`, '```json', JSON.stringify(r.verdict, null, 2), '```');
  }
  parts.push(reviewerPrompt(repo, s.ticket, s.cfg, s.round, { diff: s.diff, tests: s.tests, response: s.response, sinceSha: s.sinceSha, merged: s.merged }));
  return parts.join('\n\n');
}

// Runs one reviewer command with the prompt on stdin. Returns the process result, or { error } if it couldn't start.
function runReviewer(repo, command, values, prompt) {
  const [cmd, ...args] = commandArgs(command, values);
  if (!cmd) return { cmd: '', error: 'the command is empty' };
  const r = spawnSync(cmd, args, { cwd: repo, input: prompt, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.error) return { cmd, error: r.error.code === 'ENOENT' ? `\`${cmd}\` isn't installed or isn't on your PATH` : `\`${cmd}\` failed (${r.error.message})` };
  return { ...r, cmd };
}

// The value at a dot path such as `session_id` or `meta.session.id`, as a string, or '' if there isn't one.
function atPath(obj, dotted) {
  const v = String(dotted).split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);
  return typeof v === 'string' || typeof v === 'number' ? String(v) : '';
}

// Runs a reviewer set up in config as a command. speck reads the verdict from its output, so the builder never handles it.
// If the reviewer can resume a session (session_id_path and resume_command), later rounds continue it with only the new
// round's prompt. Otherwise, or if resuming fails, a fresh run gets the full history.
function runCommandReview(repo, id, name, command, s) {
  const options = s.cfg.reviewer_options?.[name] || {};
  const settings = reviewerSettings(s.ticket.fm, s.cfg);
  const values = { model: settings.model, effort: settings.effort };
  // Only the latest round's session has seen every round so far. An older one would miss the rounds since.
  const lastThread = s.prior[s.prior.length - 1]?.meta?.thread_id;
  const resume = typeof options.resume_command === 'string' && options.resume_command.includes('{session}') ? options.resume_command : '';
  const started = Date.now();
  let r = null, session = 'fresh';
  if (s.round > 1) {
    let why = '';
    if (!resume) why = 'no resume_command with {session} is set for it';
    else if (!lastThread) why = `no session id was saved from round ${s.round - 1}`;
    else {
      const tried = runReviewer(repo, resume, { ...values, session: lastThread }, reviewerPrompt(repo, s.ticket, s.cfg, s.round, { diff: s.diff, tests: s.tests, response: s.response, sinceSha: s.sinceSha, merged: s.merged }));
      if (tried.error) why = `resuming session ${lastThread} failed: ${tried.error}`;
      else if (tried.status !== 0) why = `resuming session ${lastThread} exited ${tried.status}`;
      else { r = tried; session = 'continued'; }
    }
    if (!r) console.log(`Started a fresh ${name} session with the full history, because ${why}.`);
  }
  if (!r) {
    const prompt = s.round === 1 ? fullPrompt(repo, s.ticket, s.cfg, s.diff, s.tests) : historyPrompt(repo, s, id);
    if (s.round === 1) fs.writeFileSync(roundOneFile(repo, id), prompt);
    r = runReviewer(repo, command, values, prompt);
  }
  if (r.error) throw new SpeckError(`Couldn't run the ${name} reviewer: ${r.error}. Check reviewer_options.${name} in speck/config.yml.`);
  const tail = r.stderr.trim().split('\n').slice(-5).join('\n');
  const stderrNote = tail ? `\nLast lines of its error output:\n${tail}` : '';
  if (r.status !== 0) throw new SpeckError(`The ${name} reviewer (${r.cmd}) exited ${r.status}, so no round was recorded.${stderrNote}`);
  const { verdict, envelope } = verdictFromOutput(r.stdout);
  if (!verdict) throw new SpeckError(`The ${name} reviewer (${r.cmd}) didn't return a verdict: its output wasn't JSON, a \`\`\`json block or a JSON envelope with a "result". No round was recorded.${stderrNote}`);
  // An invalid verdict is the reviewer's failure too, so it gets the same stderr lines.
  try { validateVerdict(structuredClone(verdict)); } catch (e) { if (e instanceof SpeckError) throw new SpeckError(`${e.message} The ${name} reviewer's verdict wasn't recorded.${stderrNote}`); throw e; }
  const usage = envelope?.usage && typeof envelope.usage === 'object' ? { usage: envelope.usage } : {};
  // A resumed run that doesn't report its session id keeps the one it resumed.
  const thread = (options.session_id_path ? atPath(envelope ?? jsonIn(r.stdout), options.session_id_path) : '') || (session === 'continued' ? lastThread : '');
  return saveRound(repo, id, verdict, { reviewer: name, ...settingsMeta(settings), reviewed_sha: s.head, session,
    ...(thread ? { thread_id: thread } : {}), ...(s.response ? { builder_response: s.response } : {}),
    seconds: Math.round((Date.now() - started) / 1000), ...usage });
}

// Whether a round continued the reviewer's session or started fresh. Command rounds record it. Codex rounds resume
// whenever an earlier round saved a session, so that rule gives theirs.
function sessionLabel(r, earlier) {
  if (r.meta.session) return `${r.meta.session} session`;
  if (r.meta.round === 1) return 'fresh session';
  if (r.meta.reviewer === 'codex') return earlier.some(p => p.meta.thread_id) ? 'continued session' : 'fresh session';
  return 'session not recorded';
}

const who = m => `${m.reviewer}, model ${m.reviewer_model || 'default'}, effort ${m.reviewer_effort || 'default'}`;

// The reviewer tokens and elapsed time, worded for both the review pack and the delivery log.
function reviewTotals(t, all) {
  const tokens = all.reduce((n, r) => n + (r.meta.usage?.input_tokens || 0) + (r.meta.usage?.output_tokens || 0), 0);
  const started = t.fm.started ? new Date(t.fm.started) : null;
  return {
    tokens: tokens.toLocaleString('en-GB'),
    elapsed: started ? `Elapsed since build started: ${Math.round((Date.now() - started) / 60000)} min` : 'Elapsed: not recorded',
  };
}

export function reviewPack(repo, id) {
  const cfg = loadConfig(repo);
  const t = findTicket(repo, id);
  const all = rounds(repo, id);
  const last = all[all.length - 1];
  if (!last) throw new SpeckError('No review rounds recorded.');
  const v = last.verdict;
  const ac = lintTicket(t, cfg).acceptanceCriteria;
  const diff = changedLines(repo, cfg.base_branch);
  const risky = diff.files.map(f => f.file).filter(f => RISKY.test(f));
  const icon = { pass: '✅', fail: '❌', unclear: '⚠️' };
  const findings = all.flatMap(r => r.verdict.findings.map(f => ({ ...f, round: r.meta.round })));
  const latest = new Map(findings.map(f => [f.id, f]));
  const { tokens, elapsed } = reviewTotals(t, all);
  const blind = all.filter(r => r.meta.sandbox_ok === false);
  const lines = [
    `## ${t.fm.id} · ${t.fm.title}`,
    `**Verdict:** ${v.verdict === 'approve' ? '✅ Approved by reviewer' : `⛔ ${v.verdict}`} (${who(last.meta)}, round ${last.meta.round} of ${cfg.limits.max_review_rounds})`,
    ...(blind.length ? ['', ...blind.map(r => `${NO_INSPECT} (round ${r.meta.round})`)] : []),
    '', `**Summary:** ${v.summary}`, '',
    '### Acceptance criteria', '| # | Criterion | Result | Evidence |', '|---|---|---|---|',
    ...v.criteria.map(c => `| ${c.id} | ${(ac[c.id - 1] || '').replace(/^\d+\.\s+/, '').replace(/\|/g, '\\|')} | ${icon[c.status] || c.status} | ${c.evidence.replace(/\n/g, ' ').replace(/\|/g, '\\|')} |`),
    '', '### Risk', `- Ticket risk: **${t.fm.risk}**`,
    risky.length ? `- Sensitive files touched: ${risky.map(f => `\`${f}\``).join(', ')}` : '- No sensitive file patterns touched',
    `- Changed lines (excluding tests and lockfiles): ${diff.total} (limit ${cfg.limits.max_changed_lines})`,
    '', '### Review history',
    ...all.map((r, i) => {
      const f = r.verdict.findings;
      const open = f.filter(x => x.severity === 'blocking' && ['open', 'dispute_rejected'].includes(x.state)).length;
      const closed = f.filter(x => x.severity === 'blocking').length - open;
      return `- Round ${r.meta.round} (${who(r.meta)}): **${r.verdict.verdict}**, ${open} open blocking, ${closed} resolved, ${f.filter(x => x.severity === 'minor').length} minor; ${sessionLabel(r, all.slice(0, i))}`;
    }),
    ...(latest.size ? ['', '<details><summary>Findings</summary>', '',
      ...[...latest.values()].map(f => `- **${f.id}** (${f.severity}, ${f.state}) \`${f.file}\`: ${f.issue}`), '', '</details>'] : []),
    '', '### Actuals',
    `- Review rounds: ${all.length}`,
    `- Reviewer tokens: ${tokens}`,
    `- ${elapsed}`,
    '', '_Generated by speck. The merge decision is yours._',
  ];
  return lines.join('\n');
}

// ---------- install and doctor ----------

const SKILLS = path.join(ROOT, 'skills');
const SKILL_DIRS = ['.claude/skills', '.agents/skills']; // Claude Code reads the first; Codex, cptr and others read the second
const VERSION = (() => {
  // From the source package, or from the VERSION file written next to an installed copy.
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version; } catch {}
  try { return fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim(); } catch {}
  return 'unknown';
})();

function copyDir(from, to) {
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true });
}

function linkDir(target, at) {
  fs.rmSync(at, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(at), { recursive: true });
  fs.symlinkSync(path.relative(path.dirname(at), target), at, 'dir');
}

// Puts the CLI in .speck/ and the skills where agents look for them. Safe to re-run: it refreshes both.
// Inside speck's own source repo it links instead of copying, so edits show up straight away.
export function installTooling(repo) {
  if (!fs.existsSync(SKILLS)) throw new SpeckError('This copy of speck can\'t install itself. Run `npx github:luroai/speck init` instead.');
  const dev = fs.realpathSync(repo) === fs.realpathSync(ROOT);
  const place = dev ? linkDir : copyDir;
  const skills = fs.readdirSync(SKILLS).filter(n => n.startsWith('speck-') && fs.existsSync(path.join(SKILLS, n, 'SKILL.md')));
  for (const d of ['scripts', 'templates']) place(path.join(ROOT, d), path.join(repo, '.speck', d));
  fs.writeFileSync(path.join(repo, '.speck', 'VERSION'), VERSION + '\n');
  for (const dir of SKILL_DIRS) {
    fs.mkdirSync(path.join(repo, dir), { recursive: true });
    for (const s of skills) place(path.join(SKILLS, s), path.join(repo, dir, s));
  }
  return skills;
}

function check(name, ok, fix) { return { name, ok, fix }; }

function runs(cmd, args) {
  try { return sh(cmd, args).status === 0; } catch { return false; }
}

// The builders doctor knows how to check: the name shown, the command on the PATH, and how to install it.
// Cursor's installer also provides `agent`, but `cursor-agent` is the name that can't clash with other tools.
const BUILDERS = {
  claude: ['Claude Code', 'claude', 'Install Claude Code: https://claude.com/claude-code'],
  cursor: ['Cursor CLI', 'cursor-agent', 'Install the Cursor CLI: https://cursor.com/docs/cli/installation'],
  codex: ['Codex CLI', 'codex', 'Install it with `npm install -g @openai/codex`: https://github.com/openai/codex'],
  gemini: ['Gemini CLI', 'gemini', 'Install it with `npm install -g @google/gemini-cli`: https://github.com/google-gemini/gemini-cli'],
};

// True if `cmd` is an executable file: a path as given, or a name found on the PATH. Nothing is run.
function onPath(cmd) {
  const ok = f => { try { fs.accessSync(f, fs.constants.X_OK); return fs.statSync(f).isFile(); } catch { return false; } };
  if (cmd.includes('/') || cmd.includes(path.sep)) return ok(cmd);
  const exts = process.platform === 'win32' ? ['', ...(process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';')] : [''];
  return (process.env.PATH || '').split(path.delimiter).filter(Boolean).some(d => exts.some(e => ok(path.join(d, cmd + e))));
}

export function doctorChecks(repo, cfg = {}) {
  const reviewer = cfg.reviewer || 'codex';
  const builder = cfg.builder || 'claude';
  const checks = [
    check('Node.js 20 or newer', Number(process.versions.node.split('.')[0]) >= 20,
      'Install the latest Node.js LTS from https://nodejs.org, then open a new terminal.'),
    check('git', runs('git', ['--version']),
      'Install git from https://git-scm.com/downloads.'),
    check('This folder is a git repository', runs('git', ['-C', repo, 'rev-parse', '--git-dir']),
      'Run `git init` here, or run speck from inside your project folder.'),
  ];
  // Only the configured builder is checked. speck can't check one it doesn't know, and that isn't a failure.
  // hasOwn, so a name like `constructor` or `toString` is an unknown builder, not a built-in object property.
  if (Object.hasOwn(BUILDERS, builder)) {
    const [label, cmd, fix] = BUILDERS[builder];
    checks.push(check(`${label} (builds tickets)`, onPath(cmd), fix));
  } else checks.push({ name: `speck can't check builder "${builder}": it only knows ${Object.keys(BUILDERS).join(', ')}. Make sure it reads skills from .agents/skills/ or .claude/skills/.`, ok: true, info: true });
  // speck ships locally with git, so the GitHub CLI is only a convenience.
  const ghInstalled = runs('gh', ['--version']);
  checks.push({ ...check('GitHub CLI (optional)', ghInstalled,
    'Not needed to build or ship. Install it from https://cli.github.com if you want to work with GitHub from the terminal.'), optional: true });
  const command = cfg.reviewer_options?.[reviewer]?.command;
  if (typeof command === 'string' && command.trim()) {
    let first = '';
    try { first = splitCommand(command)[0] || ''; } catch { /* an unclosed quote: reported as not found */ }
    checks.push(check(`Reviewer command for "${reviewer}" (${first || 'empty'})`, Boolean(first) && onPath(first),
      `Install ${first || 'the reviewer'} so it's on your PATH, or fix reviewer_options.${reviewer}.command in speck/config.yml.`));
  } else if (reviewer === 'codex') {
    const codexInstalled = runs('codex', ['--version']);
    checks.push(check('Codex CLI (reviews tickets)', codexInstalled,
      'Install it with `npm install -g @openai/codex`, or set `reviewer: claude-subagent` and `allow_same_model_review: true` in speck/config.yml.'));
    if (codexInstalled) checks.push(check('Signed in to Codex', runs('codex', ['login', 'status']),
      'Run `codex login` and follow the prompts.'));
  }
  return checks;
}

function printChecks(checks) {
  for (const c of checks) console.log(c.info ? `  ℹ ${c.name}` : `  ${c.ok ? '✓' : c.optional ? '–' : '✗'} ${c.name}${c.ok ? '' : `\n      ${c.optional ? 'Note' : 'Fix'}: ${c.fix}`}`);
  return checks.every(c => c.ok || c.optional);
}

function cmdDoctor() {
  let repo = process.cwd(), cfg = {};
  try { repo = findRepoRoot(); cfg = loadConfig(repo); } catch {}
  console.log('Checking what speck needs:');
  const ok = printChecks(doctorChecks(repo, cfg));
  console.log(ok ? '\nAll set.' : '\nFix the ✗ items above, then run this again.');
  if (!ok) throw new SpeckError('', 1);
}

// Moves review rounds from an older speck's speck/reviews/<id>/round-N.json files into their tickets.
// Anything it can't place is left where it is with the reason, and the rest are still moved.
function migrateReviews(repo) {
  const root = path.join(repo, 'speck', 'reviews');
  if (!fs.existsSync(root)) return;
  let moved = 0;
  for (const id of fs.readdirSync(root).filter(n => /^\d{4}$/.test(n)).sort()) {
    const dir = path.join(root, id);
    try {
      let t;
      try { t = findTicket(repo, id); }
      catch (e) { throw new Error(/not found/.test(e.message) ? `there's no ticket ${id}.` : e.message); }
      const files = fs.readdirSync(dir).filter(f => /^round-\d+\.json$/.test(f));
      const recs = files.map(f => {
        try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); }
        catch (e) { throw new Error(`${f} isn't valid JSON (${e.message}).`); }
      }).sort((a, b) => (a?.meta?.round ?? 0) - (b?.meta?.round ?? 0));
      const existing = ticketRounds(t.raw);
      if (recs.length && (existing.rounds.length || existing.errors.length))
        throw new Error(`${path.relative(repo, t.file)} already has review rounds.`);
      if (recs.length) {
        const next = appendRounds(t.raw, recs);
        const problems = ticketRounds(next).errors;
        if (problems.length) throw new Error(problems[0]);
        fs.writeFileSync(t.file, next);
        moved++;
      }
      for (const f of files) fs.rmSync(path.join(dir, f));
      fs.rmSync(path.join(dir, 'codex-thread'), { force: true }); // each round records its thread id
      const settings = path.join(dir, 'reviewer-settings.json');
      if (fs.existsSync(settings)) fs.renameSync(settings, path.join(cacheDir(repo, id), 'reviewer-settings.json'));
      const left = fs.readdirSync(dir);
      if (left.length) console.log(`kept    speck/reviews/${id}/: it still has ${left.join(', ')}. Move or delete them yourself.`);
      else fs.rmdirSync(dir);
    } catch (e) {
      console.log(`skipped speck/reviews/${id}/: ${e.message} Its files are left where they are.`);
    }
  }
  if (moved) console.log(`moved   review rounds for ${moved} ticket${moved === 1 ? '' : 's'} into the ticket files`);
  if (fs.readdirSync(root).every(n => n === '.gitkeep')) fs.rmSync(root, { recursive: true, force: true });
}

// File each ticketed note in speck/ideas/ in speck/ideas/done/, for a repo from before notes were filed when ticketed.
// Then point every ticket whose source is a filed note's old path at its new one.
function fileTicketedIdeas(repo) {
  const from = ideasDir(repo), to = doneIdeasDir(repo);
  const notes = fs.readdirSync(from).filter(f => f.endsWith('.md') && fs.statSync(path.join(from, f)).isFile());
  let moved = 0;
  for (const f of notes) {
    if (!ideaStatus(fs.readFileSync(path.join(from, f), 'utf8')).startsWith('ticketed')) continue;
    if (fs.existsSync(path.join(to, f))) { console.log(`kept    speck/ideas/${f}: speck/ideas/done/${f} already exists. Rename one, then run init again to file it.`); continue; }
    fs.mkdirSync(to, { recursive: true });
    fs.renameSync(path.join(from, f), path.join(to, f));
    moved++;
  }
  if (moved) console.log(`moved   ${moved} ticketed idea note${moved === 1 ? '' : 's'} into speck/ideas/done/`);
  for (const dir of ticketDirs(repo).filter(d => fs.existsSync(d))) {
    for (const f of fs.readdirSync(dir).filter(n => /^\d{4}-.*\.md$/.test(n))) {
      const file = path.join(dir, f);
      const text = fs.readFileSync(file, 'utf8');
      let source;
      try { source = parseTicket(text).fm.source; } catch { continue; }
      if (typeof source !== 'string' || !source) continue;
      const at = path.resolve(repo, source);
      const filed = path.join(to, path.basename(at));
      if (path.dirname(at) !== from || fs.existsSync(at) || !fs.existsSync(filed)) continue;
      fs.writeFileSync(file, setField(text, 'source', JSON.stringify(repoPath(repo, filed))));
    }
  }
}

// ---------- commands ----------

function cmdInit(args) {
  const repo = process.cwd();
  const force = args.includes('--force');
  console.log(`speck ${VERSION}: setting up ${repo}\n`);
  const dirs = ['speck/ideas', 'speck/tickets', 'speck/tickets/done'];
  for (const d of dirs) fs.mkdirSync(path.join(repo, d), { recursive: true });
  const copies = [['config.yml', 'speck/config.yml']];
  for (const [from, to] of copies) {
    const dest = path.join(repo, to);
    if (fs.existsSync(dest) && !force) { console.log(`kept    ${to}`); continue; }
    fs.copyFileSync(path.join(TEMPLATES, from), dest);
    console.log(`created ${to}`);
  }
  // Tidy up after a version of speck that kept done tickets in speck/tickets/, so the layout above holds.
  // A ticket file speck can't read is left where it is with a warning, so it can't stop an update.
  const strays = fs.readdirSync(ticketsDir(repo)).filter(f => /^\d{4}-.*\.md$/.test(f)).flatMap(f => {
    const file = path.join(ticketsDir(repo), f);
    try { return [{ file, ...parseTicket(fs.readFileSync(file, 'utf8')) }]; }
    catch (e) { console.log(`skipped speck/tickets/${f}: ${e.message} Fix it, then run init again to file it if it's done.`); return []; }
  }).filter(t => t.fm.status === 'done');
  for (const t of strays) placeTicket(repo, t, 'done');
  if (strays.length) console.log(`moved   ${strays.length} done ticket${strays.length === 1 ? '' : 's'} into speck/tickets/done/`);
  migrateReviews(repo);
  fileTicketedIdeas(repo);
  // Give every ticket the readable header, or bring it up to date. Unreadable files were reported above (or are in done/) and are left alone.
  let synced = 0;
  for (const dir of ticketDirs(repo).filter(d => fs.existsSync(d))) {
    for (const f of fs.readdirSync(dir).filter(n => /^\d{4}-.*\.md$/.test(n))) {
      const file = path.join(dir, f);
      const text = fs.readFileSync(file, 'utf8');
      let next;
      try { next = syncHeader(text); } catch { continue; }
      if (next !== text) { fs.writeFileSync(file, next); synced++; }
    }
  }
  if (synced) console.log(`updated ${synced} ticket header${synced === 1 ? '' : 's'} (title and status)`);
  for (const d of dirs) {
    const keep = path.join(repo, d, '.gitkeep');
    if (!fs.readdirSync(path.join(repo, d)).length) fs.writeFileSync(keep, '');
  }
  const skills = installTooling(repo);
  console.log(`updated .speck/ (the speck command)`);
  console.log(`updated ${SKILL_DIRS.join(' and ')} (${skills.length} skills)`);
  const pointer = '\n## speck\n\nThis repo uses speck. Work only from a `ready` ticket in `speck/tickets/` (use `/speck-build <id>`). Never approve your own work, and never merge or ship unless the user runs `/speck-ship`, except for the `speck ship <id> --auto` step in `/speck-build`, which ships only when `auto_ship` in `speck/config.yml` allows it.\n';
  const agents = path.join(repo, 'AGENTS.md');
  const agentsText = fs.existsSync(agents) ? fs.readFileSync(agents, 'utf8') : '# Agent guide\n';
  if (!agentsText.includes('This repo uses speck')) { fs.writeFileSync(agents, agentsText + pointer); console.log('updated AGENTS.md'); }
  const claude = path.join(repo, 'CLAUDE.md');
  const claudeText = fs.existsSync(claude) ? fs.readFileSync(claude, 'utf8') : '';
  if (!claudeText.includes('@AGENTS.md') && !claudeText.includes('This repo uses speck')) {
    fs.writeFileSync(claude, claudeText + (claudeText ? '\n' : '') + '@AGENTS.md\n');
    console.log('updated CLAUDE.md (imports AGENTS.md)');
  }
  const cfg = loadConfig(repo);
  let ready = true;
  if (!args.includes('--skip-checks')) {
    console.log('\nChecking what speck needs:');
    ready = printChecks(doctorChecks(repo, cfg));
  }
  console.log(`
${ready ? 'speck is installed.' : 'speck is installed, but fix the ✗ items above before building a ticket. Run `node .speck/scripts/speck.mjs doctor` to check again.'}

Next:
  1. Commit the new files so everyone working on this repo gets speck.
  2. Set commands.test in speck/config.yml (the command that runs your tests).
  3. Open your coding agent in this folder and type /speck-capture to save your first idea.

Each ticket is built and reviewed on its own branch and then waits as "approved".
Read it with \`node .speck/scripts/speck.mjs pack <id>\`, then type /speck-ship <id> to merge it into ${cfg.base_branch}.

To update speck later, run the same install command again.`);
}

// An idea note's status line, as /speck-capture writes it: `Captured: <date> · Status: <value>`.
const STATUS_LINE = /^((?:.*·[ \t]*)?Status:[ \t]*)(.*)$/m;
const ideaStatus = text => (text.match(STATUS_LINE) || [])[2]?.trim() ?? '';

// `ticketed (<ids>)`, with the new id added unless it's already listed. Any other value is replaced.
export function ticketedStatus(value, id) {
  const m = value.match(/^ticketed\b\s*(?:\(([^)]*)\))?(.*)$/);
  const ids = m ? (m[1] || '').split(',').map(s => s.trim()).filter(Boolean) : [];
  if (!ids.includes(id)) ids.push(id);
  return `ticketed (${ids.join(', ')})${m ? m[2] : ''}`;
}

function cmdNew(args) {
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const title = args.filter(a => !a.startsWith('--')).join(' ').trim();
  if (!title) throw new SpeckError('Usage: speck new <title> [--source=path] [--type=bug]');
  const source = (args.find(a => a.startsWith('--source=')) || '').slice(9);
  // Every --type must be --type=bug, so a mistyped or second value creates nothing.
  const types = args.filter(a => a === '--type' || a.startsWith('--type=')).map(a => a.slice(7));
  const badType = types.find(v => v !== 'bug');
  if (badType !== undefined) throw new SpeckError(`--type must be --type=bug (got "${badType}"). Leave it out for any other ticket.`);
  const type = types.length ? 'bug' : '';
  // The source is checked before anything is written, so a mistyped path creates no ticket.
  // A note in speck/ideas/ that has already been filed in speck/ideas/done/ is found there.
  let sourceFile = source && path.resolve(repo, source);
  const isFile = f => fs.statSync(f, { throwIfNoEntry: false })?.isFile();
  const inInbox = sourceFile && path.dirname(sourceFile) === ideasDir(repo);
  if (inInbox && !isFile(sourceFile) && isFile(path.join(doneIdeasDir(repo), path.basename(sourceFile))))
    sourceFile = path.join(doneIdeasDir(repo), path.basename(sourceFile));
  if (sourceFile && !isFile(sourceFile))
    throw new SpeckError(`No idea note at ${source}. Check the path (relative to the repo root), then run this again.`);
  const filed = inInbox && path.join(doneIdeasDir(repo), path.basename(sourceFile));
  if (filed && filed !== sourceFile && fs.existsSync(filed))
    throw new SpeckError(`${repoPath(repo, filed)} already exists, so ${source} can't be filed there once it's ticketed. Rename one of them, then run this again.`);
  const id = nextId(repo);
  let text = fs.readFileSync(path.join(TEMPLATES, 'ticket.md'), 'utf8');
  text = setField(text, 'id', id);
  text = setField(text, 'title', JSON.stringify(title));
  text = setField(text, 'builder', cfg.builder);
  text = setField(text, 'reviewer', cfg.reviewer);
  const settings = reviewerSettings({}, cfg);
  text = setField(text, 'reviewer_model', settings.model || '');
  text = setField(text, 'reviewer_effort', settings.effort || '');
  // A note that gets a status is filed in speck/ideas/done/, so the ticket points at it there.
  const note = sourceFile && fs.readFileSync(sourceFile, 'utf8');
  const target = note && STATUS_LINE.test(note) && filed ? filed : sourceFile;
  text = setField(text, 'source', JSON.stringify(target && target !== path.resolve(repo, source) ? repoPath(repo, target) : source));
  if (type) text = setField(text, 'type', type);
  text = syncHeader(setField(text, 'created', new Date().toISOString().slice(0, 10)));
  const file = path.join(ticketsDir(repo), `${id}-${slugify(title)}.md`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  if (sourceFile) {
    if (STATUS_LINE.test(note)) {
      fs.writeFileSync(sourceFile, note.replace(STATUS_LINE, (_, head, value) => head + ticketedStatus(value, id)));
      if (target !== sourceFile) { fs.mkdirSync(doneIdeasDir(repo), { recursive: true }); fs.renameSync(sourceFile, target); }
    } else console.error(`⚠️ ${source} has no \`Status:\` line, so its status couldn't be updated. Add \`Status: ticketed (${id})\` to it by hand.`);
  }
  console.log(path.relative(process.cwd(), file));
}

function cmdLint(args) {
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const t = findTicket(repo, args[0]);
  const { errors, warnings, acceptanceCriteria } = lintTicket(t, cfg);
  for (const e of errors) console.log(`✗ ${e}`);
  for (const w of warnings) console.log(`! ${w}`);
  if (!errors.length) console.log(`✓ ${t.fm.id} passes size rules (${acceptanceCriteria.length} acceptance criteria, size ${t.fm.size}, risk ${t.fm.risk}).`);
  if (errors.length) throw new SpeckError('', 1);
}

function cmdSet(args) {
  const [id, key, ...rest] = args;
  const value = rest.join(' ');
  if (!id || !key || !value) throw new SpeckError('Usage: speck set <id> <field> <value>');
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const t = findTicket(repo, id);
  if (key === 'status') {
    if (!STATUSES.includes(value)) throw new SpeckError(`status must be one of ${STATUSES.join(', ')}.`);
    // Cancelling records why, so it has its own command; `set` would lose the reason.
    if (value === 'cancelled') throw new SpeckError(`Use \`speck cancel ${t.fm.id} "<reason>"\` instead: cancelling records the reason.`);
    if (value === 'ready') {
      const { errors } = lintTicket(t, cfg);
      if (errors.length) throw new SpeckError(`Not ready:\n${errors.map(e => `  ✗ ${e}`).join('\n')}`);
    }
  }
  writeField(t, key, value);
  // Setting done moves the ticket into speck/tickets/done/, and any other status brings it back.
  if (key === 'status') placeTicket(repo, t, value);
  console.log(`${t.fm.id} ${key} → ${value}`);
}

function writeField(t, key, value) {
  // A value holding a quote, or padded with spaces, is written as a JSON string so it reads back exactly as given:
  // left bare, a lone ' would hide the line's trailing comment from stripComment. after is the one list field, so
  // after ["0070"] stays a list, and any other bracketed value is text.
  const quoted = typeof value === 'string' && key !== 'after' && (/['"[]/.test(value) || value !== value.trim());
  let text = setField(t.raw, key, quoted ? JSON.stringify(value) : /^\d+$/.test(value) && key !== 'id' ? Number(value) : value);
  if (key === 'status' && value === 'building' && !t.fm.started) text = setField(text, 'started', new Date().toISOString());
  if (key === 'status' && value === 'done') text = setField(text, 'finished', new Date().toISOString());
  fs.writeFileSync(t.file, syncHeader(text));
}

// Cancelling is a status change with a why. The reason and the date are part of the record, so it gets its own
// command rather than `speck set`. The ticket is filed with the finished ones, where it stays visible as cancelled.
function cmdCancel(args) {
  const [id, ...rest] = args;
  if (!id) throw new SpeckError('Usage: speck cancel <id> "<reason>"');
  const reason = rest.join(' ').trim();
  const repo = findRepoRoot();
  const t = findTicket(repo, id);
  // Every refusal comes before the first write, so a refused cancel changes nothing.
  if (blank(reason)) throw new SpeckError(`Give a reason: speck cancel ${t.fm.id} "<reason>".`);
  if (t.fm.status === 'done') throw new SpeckError(`Ticket ${t.fm.id} is done, so it can't be cancelled: delivered work is part of the record.`);
  if (t.fm.status === 'cancelled') throw new SpeckError(`Ticket ${t.fm.id} is already cancelled.`);
  // Stored as a JSON string, so text like `false`, `0` or `a "quoted" word` reads back exactly as typed. A reason kept from an earlier cancel is replaced in place.
  let text = setField(t.raw, 'cancel_reason', JSON.stringify(reason));
  text = setField(text, 'cancelled', new Date().toISOString().slice(0, 10));
  fs.writeFileSync(t.file, syncHeader(setField(text, 'status', 'cancelled')));
  placeTicket(repo, t, 'cancelled');
  console.log(`${t.fm.id} cancelled → ${path.relative(repo, t.file)}`);
}

// ---------- start a build ----------

// True if `p` exists in commit `rev`, following committed symlinks the way a checkout would (speck's own repo links
// .speck/scripts to ../scripts). Nothing on disk or in the index counts.
function inCommit(repo, rev, p, hops = 0) {
  const parts = p.split('/').filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    const r = sh('git', ['ls-tree', rev, '--', parts.slice(0, i + 1).join('/')], { cwd: repo });
    const [mode, , obj] = r.stdout.trim().split(/\s+/);
    if (r.status !== 0 || !obj) return false;
    if (mode === '120000') {
      const target = sh('git', ['cat-file', '-p', obj], { cwd: repo }).stdout;
      const next = path.posix.normalize(path.posix.join(parts.slice(0, i).join('/'), target, ...parts.slice(i + 1)));
      return hops < 10 && !next.startsWith('..') && inCommit(repo, rev, next, hops + 1);
    }
  }
  return true;
}

// Where a ticket's worktree goes: beside the main checkout, never inside it, and at the same path each time.
function worktreePath(main, branch) {
  return path.join(path.dirname(main), `${path.basename(main)}.worktrees`, ...branch.split('/'));
}

// Starts building a ready ticket: makes its branch from the local base branch, in its own worktree when worktrees
// are on, sets it to building and commits that there. Anything that goes wrong before the start commit is undone.
function cmdStart(args) {
  const id = args[0];
  if (!id) throw new SpeckError('Usage: speck start <id>');
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const t = findTicket(repo, id);
  const pad = t.fm.id;
  // An existing build comes first, so resuming from anywhere (even inside its worktree) gets the path to carry on in.
  const list = worktreeList(repo);
  const existing = git(['for-each-ref', '--format=%(refname:short)', `refs/heads/${cfg.branch_prefix}${pad}-*`], repo).split('\n').filter(Boolean);
  if (existing.length) {
    const at = list.find(w => existing.includes(w.branch));
    throw new SpeckError(at
      ? `Ticket ${pad} has already started: ${at.branch} is checked out at\n${at.path}\nCarry on the build there.`
      : `Ticket ${pad} already has a branch, ${existing.join(', ')}. Check it out to carry on the build, or delete it to start again.`);
  }
  if (t.fm.status !== 'ready') throw new SpeckError(`Ticket ${pad} is "${t.fm.status}", not "ready". Only a ready ticket can be started.`);
  const rel = posix(path.relative(repo, t.file));
  if (git(['status', '--porcelain', '--', rel], repo).trim())
    throw new SpeckError(`${rel} has uncommitted changes. Commit it first, so the build starts from the ticket as you approved it.`);
  // Named after the ticket's file, which keeps its name when the title changes.
  const branch = `${cfg.branch_prefix}${path.basename(t.file, '.md')}`;
  if (cfg.worktrees !== true) {
    if (git(['status', '--porcelain'], repo).trim()) throw new SpeckError('You have uncommitted or untracked changes. Commit or remove them so the working tree is clean, then run this again.');
    const from = git(['branch', '--show-current'], repo).trim() || git(['rev-parse', 'HEAD'], repo).trim();
    git(['switch', '-q', '-c', branch, cfg.base_branch], repo);
    try { finishStart(repo, pad); } catch (e) {
      sh('git', ['checkout', '-q', '-f', from], { cwd: repo }); // drops the half-made status change with the branch
      sh('git', ['branch', '-D', branch], { cwd: repo });
      throw e;
    }
    console.log(`Started ${pad} on ${branch}, in this checkout:\n${fs.realpathSync(repo)}`);
    return;
  }
  // A worktree only has what's in the base commit it's made from, so the CLI and every installed skill must be there.
  const skills = SKILL_DIRS.flatMap(d => {
    const abs = path.join(repo, d);
    const names = fs.existsSync(abs) ? fs.readdirSync(abs).filter(n => n.startsWith('speck-')) : [];
    return (names.length ? names : ['speck-build']).map(n => `${d}/${n}/SKILL.md`);
  });
  const missing = ['.speck/scripts/speck.mjs', ...skills].filter(p => !inCommit(repo, cfg.base_branch, p));
  if (missing.length) {
    const what = [...new Set(missing.map(m => m.startsWith('.speck/') ? '.speck/' : m))];
    throw new SpeckError(`${what.join(', ')} ${missing.length > 1 ? 'aren\'t' : 'isn\'t'} in ${cfg.base_branch}'s latest commit, so a worktree wouldn't have ${missing.length > 1 ? 'them' : 'it'}. Commit .speck/ and the skills folders on ${cfg.base_branch} (git add .speck .claude/skills .agents/skills, then commit), then run this again.`);
  }
  const at = worktreePath(list[0].path, branch);
  if (fs.existsSync(at)) throw new SpeckError(`There's already a folder at ${at}. Move or remove it, then run this again.`);
  fs.mkdirSync(path.dirname(at), { recursive: true });
  git(['worktree', 'add', '-q', '-b', branch, at, cfg.base_branch], repo);
  const undo = () => { sh('git', ['worktree', 'remove', '--force', at], { cwd: repo }); sh('git', ['branch', '-D', branch], { cwd: repo }); };
  const setup = String(cfg.worktree_setup || '').trim();
  if (setup) {
    console.log(`Running worktree_setup in the new worktree: ${setup}`);
    const r = sh('sh', ['-c', setup], { cwd: at });
    if (r.status !== 0) {
      undo();
      const tail = (r.stderr || r.stdout).trim().split('\n').slice(-5).join('\n');
      throw new SpeckError(`worktree_setup (${setup}) failed with exit ${r.status}, so the worktree and branch were removed and ${pad} is still ready.${tail ? `\n${tail}` : ''}`);
    }
  }
  try { finishStart(at, pad); } catch (e) { undo(); throw e; }
  console.log(`Started ${pad} on ${branch}, in its own worktree. Do all of the build there:\n${at}`);
}

function finishStart(dir, pad) {
  writeField(findTicket(dir, pad), 'status', 'building');
  git(['add', '-A', '--', 'speck/tickets'], dir);
  git(['commit', '-q', '-m', `speck(${pad}): start`], dir);
}

// ---------- ship (the user's gate: merge an approved ticket locally) ----------

function ticketBranch(repo, cfg, id) {
  const pad = String(id).padStart(4, '0');
  const names = git(['for-each-ref', '--format=%(refname:short)', `refs/heads/${cfg.branch_prefix}${pad}-*`], repo).split('\n').filter(Boolean);
  if (names.length !== 1) throw new SpeckError(names.length
    ? `Found ${names.length} branches for ticket ${pad} (${names.join(', ')}). Delete the extra ones, then run this again.`
    : `No branch called ${cfg.branch_prefix}${pad}-… found. Has the ticket been built?`);
  return names[0];
}

// Every reason not to ship, checked with the ticket branch checked out and before anything changes.
function shipChecks(repo, cfg, pad, branch) {
  const t = findTicket(repo, pad);
  if (t.fm.status !== 'approved')
    throw new SpeckError(`Ticket ${pad} is "${t.fm.status}" on ${branch}, not "approved". Only a ticket the reviewer approved can be shipped.`);
  const all = rounds(repo, pad);
  const next = nextAction(all, cfg);
  if (next.action !== 'ship')
    throw new SpeckError(`The review loop says "${next.action}", not "ship"${next.reason ? `: ${next.reason}` : ''}. Finish the review first.`);
  const reviewed = all[all.length - 1].meta.reviewed_sha;
  if (!reviewed || sh('git', ['merge-base', '--is-ancestor', reviewed, branch], { cwd: repo }).status !== 0)
    throw new SpeckError(`The reviewer's approved commit isn't on ${branch}. Run the review again.`);
  // Every commit since the approval, not just the end result, so a change that was later reverted still counts.
  const changed = [...new Set(git(['log', '-m', '--name-only', '--format=', `${reviewed}..${branch}`], repo)
    .split('\n').filter(f => f && !f.startsWith('speck/')))];
  if (changed.length)
    throw new SpeckError(`These files changed after the reviewer approved: ${changed.join(', ')}. Run the review again so the reviewer sees them.`);
}

function runTests(repo, cfg) {
  const cmd = (cfg.commands?.test || '').trim();
  if (!cmd) throw new SpeckError('No test command is set, so speck can\'t check the tests pass before shipping. Set commands.test in speck/config.yml (for example `npm test`), commit it, then run this again.');
  console.log(`Running tests: ${cmd}`);
  return sh('sh', ['-c', cmd], { cwd: repo, stdio: 'inherit' }).status === 0;
}

const isAncestor = (repo, a, b) => sh('git', ['merge-base', '--is-ancestor', a, b], { cwd: repo }).status === 0;

// Checks the remote's base branch before anything changes. Returns the commit to fast-forward the local base to, if any.
function remoteBaseCatchUp(repo, remote, base) {
  if (!remote) return null;
  const fetched = sh('git', ['fetch', '-q', remote, base], { cwd: repo });
  if (fetched.status !== 0) {
    console.log(`Couldn't reach ${remote} to check for new commits on ${base} (${fetched.stderr.trim().split('\n').pop()}). Carrying on with your local ${base}.`);
    return null;
  }
  const theirs = git(['rev-parse', 'FETCH_HEAD'], repo).trim();
  const ours = git(['rev-parse', base], repo).trim();
  if (isAncestor(repo, theirs, ours)) return null; // up to date, or only ahead
  if (isAncestor(repo, ours, theirs)) {
    console.log(`${remote} has new commits on ${base}: bringing your ${base} up to date before merging.`);
    return theirs;
  }
  throw new SpeckError(`Your ${base} and ${remote}'s ${base} each have commits the other doesn't, so nothing was shipped. Combine them with \`git checkout ${base} && git pull\`, then ship again.`);
}

// Every checkout of this repo, the main one first, with the branch each one has (null when detached).
function worktreeList(repo) {
  return git(['worktree', 'list', '--porcelain'], repo).split('\n\n').filter(b => b.trim()).map(block => {
    const lines = block.split('\n');
    const at = lines.find(l => l.startsWith('worktree '))?.slice(9);
    const ref = lines.find(l => l.startsWith('branch '))?.slice(7);
    return { path: fs.existsSync(at) ? fs.realpathSync(at) : at, branch: ref ? ref.replace(/^refs\/heads\//, '') : null };
  });
}

// Where shipping happens. The ticket-branch steps run where the branch is checked out (or in this folder if it
// isn't checked out anywhere, as before worktrees). The merge runs where the base branch is checked out, or in
// that same folder if it isn't checked out anywhere. `linked` is the ticket's own worktree, removed after shipping.
function shipFolders(repo, branch, base) {
  const list = worktreeList(repo);
  const main = list[0].path;
  const at = b => list.find(w => w.branch === b)?.path || null;
  const branchAt = at(branch), baseAt = at(base);
  const work = branchAt || fs.realpathSync(repo);
  return { main, work, mergeAt: baseAt || work, linked: branchAt && branchAt !== main ? branchAt : null };
}

// Tracked files with uncommitted changes, staged or not.
const changedFiles = dir => git(['status', '--porcelain', '--untracked-files=no'], dir).split('\n').filter(Boolean).map(l => l.slice(3));
// Tracked files with changes in the index.
const stagedFiles = dir => git(['status', '--porcelain', '--untracked-files=no'], dir).split('\n').filter(l => l && l[0] !== ' ').map(l => l.slice(3));

// The files git lists, one per line and indented, after the line that says why it refused.
function listedIn(r, why) {
  const lines = r.stderr.split('\n');
  const at = lines.findIndex(l => l.includes(why));
  if (at < 0) return [];
  const files = [];
  for (const l of lines.slice(at + 1)) { if (!/^\s+\S/.test(l)) break; files.push(l.trim()); }
  return files;
}

export function shipTicket(repo, id) {
  const cfg = loadConfig(repo);
  const pad = String(id).padStart(4, '0');
  const base = cfg.base_branch;
  const branch = ticketBranch(repo, cfg, pad);
  const { main, work, mergeAt, linked } = shipFolders(repo, branch, base);
  const here = fs.realpathSync(repo);
  if (!fs.existsSync(work))
    throw new SpeckError(`${branch} is checked out in a worktree at ${work}, but that folder is missing. Run \`git worktree prune\` so git forgets it, then ship again.`);
  if (git(['status', '--porcelain'], work).trim())
    throw new SpeckError(work === here
      ? 'You have uncommitted or untracked changes. Commit or remove them so the working tree is clean, then run this again.'
      : `The ticket's worktree at ${work} has uncommitted or untracked changes. Commit or remove them there, then run this again.`);
  // Uncommitted edits in the base checkout can stay through the merge, so you can keep working there while
  // builds ship, unless they're staged (git won't merge over a changed index) or in a file the ticket changes.
  const clash = when => {
    // Without a worktree, the ship runs in this folder, which was clean before the tests, so any change at all stops it.
    if (mergeAt === work) {
      const changed = changedFiles(work);
      if (changed.length) throw new SpeckError(`These files in ${work} have uncommitted changes${when}: ${changed.join(', ')}. Nothing was shipped and they're untouched. Commit or stash them, then ship again.`);
      return;
    }
    const staged = new Set(stagedFiles(mergeAt));
    const touched = new Set(git(['diff', '--name-only', `${base}...${branch}`], repo).split('\n').filter(Boolean));
    const why = changedFiles(mergeAt).flatMap(f => staged.has(f) ? [`${f} (staged)`] : touched.has(f) ? [`${f} (the ticket changes it too)`] : []);
    if (why.length)
      throw new SpeckError(`These files in ${mergeAt}, where ${base} is checked out, have uncommitted changes${when} that stop the merge: ${why.join(', ')}. Nothing was shipped and they're untouched. Commit or stash them (git won't merge over staged changes, even in other files), then ship again.`);
  };
  clash('');
  const remote = sh('git', ['config', `branch.${base}.remote`], { cwd: repo }).stdout.trim();
  const catchUp = remoteBaseCatchUp(repo, remote, base);
  const start = git(['branch', '--show-current'], work).trim() || git(['rev-parse', 'HEAD'], work).trim();
  const branchSha = git(['rev-parse', branch], repo).trim();
  const baseSha = git(['rev-parse', base], repo).trim();
  git(['checkout', '-q', branch], work);
  const back = () => git(['checkout', '-q', start], work);
  try {
    shipChecks(work, cfg, pad, branch);
    if (!runTests(work, cfg)) throw new SpeckError('Tests failed on the approved branch, so nothing was shipped.');
    clash(', made while the tests ran');
  } catch (e) { back(); throw e; }
  // Close the ticket on the branch, so the merge is what makes it done.
  const t = findTicket(work, pad);
  writeField(t, 'status', 'done');
  git(['add', '-A', '--', placeTicket(work, t, 'done'), t.file], work);
  git(['commit', '-q', '-m', `speck(${pad}): ship`], work);
  // Uncommitted changes to tracked files, taken again just before each step that moves a branch, so a failure can put them back exactly.
  const kept = {};
  const snap = () => { for (const dir of new Set([mergeAt, work])) kept[dir] = git(['stash', 'create'], dir).trim(); };
  const lost = [];
  const putBack = dir => {
    if (!kept[dir] || sh('git', ['stash', 'apply', '-q', '--index', kept[dir]], { cwd: dir }).status === 0) return;
    sh('git', ['reset', '-q', '--hard'], { cwd: dir }); // drop the half-applied copy: the stash holds it all
    sh('git', ['stash', 'store', '-m', `speck ship ${pad}: uncommitted changes in ${dir}`, kept[dir]], { cwd: dir });
    lost.push(` Your uncommitted changes in ${dir} couldn't be put back in place, so they're saved in git's stash: run \`git stash pop --index\` there.`);
  };
  if (mergeAt === work) {
    snap();
    const out = sh('git', ['checkout', '-q', base], { cwd: work });
    if (out.status !== 0) { // something changed a file in the folder since the check above: undo the ship commit, keeping the change
      git(['reset', '-q', '--hard', branchSha], work);
      back();
      putBack(work);
      const files = listedIn(out, 'Your local changes');
      throw new SpeckError(`Couldn't switch ${work} to ${base}${files.length ? ` over uncommitted changes to ${files.join(', ')}` : `: ${out.stderr.trim().split('\n').pop()}`}. Nothing was shipped. Commit or stash them, then ship again.${lost.join('')}`);
    }
  }
  snap();
  // From the ship commit on, any failure puts back the base branch, the ticket branch, both folders and their uncommitted changes.
  const undo = () => {
    sh('git', ['merge', '--abort'], { cwd: mergeAt });
    git(['reset', '-q', '--hard', baseSha], mergeAt); // undo any catch-up, so the base is exactly as it was
    if (mergeAt === work) { git(['update-ref', `refs/heads/${branch}`, branchSha], work); back(); }
    else { git(['reset', '-q', '--hard', branchSha], work); putBack(work); } // the branch is checked out there, so undo the ship commit in place
    putBack(mergeAt);
  };
  const fail = message => new SpeckError(message + lost.join(''));
  const overwriteError = (what, files, kind) => fail(kind === 'untracked'
    ? `${what} would overwrite untracked files in ${mergeAt}: ${files.join(', ')}. Nothing was shipped. Move or remove them, then ship again.`
    : `${what} would overwrite uncommitted changes in ${mergeAt}: ${files.join(', ')}. Nothing was shipped and your changes are untouched. Commit or stash them, then ship again.`);
  // Git refuses to overwrite untracked files or uncommitted changes, listing them.
  const refused = r => {
    const untracked = listedIn(r, 'untracked working tree files would be overwritten');
    if (untracked.length) return [untracked, 'untracked'];
    const local = listedIn(r, 'Your local changes to the following files would be overwritten');
    return local.length ? [local, 'local'] : null;
  };
  if (catchUp) {
    const ff = sh('git', ['merge', '-q', '--ff-only', catchUp], { cwd: mergeAt });
    if (ff.status !== 0) {
      const why = refused(ff);
      undo();
      throw why ? overwriteError(`Bringing ${base} up to date with ${remote}`, ...why)
        : fail(`Couldn't bring ${base} up to date with ${remote}, so nothing was shipped: ${ff.stderr.trim().split('\n').pop()}`);
    }
    snap(); // a hook may have changed files during the catch-up
  }
  const merge = sh('git', ['merge', '--no-ff', '-m', `speck(${pad}): ${t.fm.title}`, branch], { cwd: mergeAt });
  if (merge.status !== 0) {
    const why = refused(merge);
    const conflicts = sh('git', ['diff', '--name-only', '--diff-filter=U'], { cwd: mergeAt }).stdout.split('\n').filter(Boolean);
    undo();
    if (why) throw overwriteError(`Merging ${branch} into ${base}`, ...why);
    if (!conflicts.length) throw fail(`Merging ${branch} into ${base} failed, so nothing was shipped and ${base} is unchanged: ${merge.stderr.trim().split('\n').pop()}`);
    // A conflict has its own exit code, so a build can merge the base branch in, get it re-reviewed and ship again.
    // After catching up with the remote, the conflict is with the remote's commits, which the local base no longer has.
    const target = catchUp ? `${remote}/${base}` : base;
    const e = fail(`Merging ${branch} into ${base} hit a conflict, so nothing was shipped and ${base} is unchanged. Conflicting files: ${conflicts.join(', ')}. Merge ${target} into ${branch}, resolve the conflicts, get the result reviewed, then ship again.`);
    e.code = 13;
    throw e;
  }
  // From here on, run git from the main checkout, which always survives: the ticket's worktree is about to go.
  const branchRemote = sh('git', ['config', `branch.${branch}.remote`], { cwd: main }).stdout.trim() || remote;
  // -d would compare against the branch's upstream, which lacks the ship commit, so check against the base ourselves.
  if (sh('git', ['merge-base', '--is-ancestor', branch, base], { cwd: main }).status !== 0)
    throw new SpeckError(`${branch} isn't fully in ${base} after the merge, so it wasn't deleted. Check it with \`git log ${base}..${branch}\`.`);
  // The worktree was clean before the tests, and the ship commit holds everything since, so --force only drops what the test run left behind.
  // If it can't be removed (a locked worktree, say), the ship still completes, and the branch stays until it's gone.
  const removed = linked ? sh('git', ['worktree', 'remove', '--force', linked], { cwd: main }) : null;
  if (!removed || removed.status === 0) {
    git(['branch', '-D', branch], main);
    console.log(`Shipped ${pad}: merged ${branch} into ${base} and deleted the local branch.`);
  } else {
    console.log(`Shipped ${pad}: merged ${branch} into ${base}.`);
    const unlock = /locked/i.test(removed.stderr) ? `\`git worktree unlock ${linked}\`, then ` : '';
    console.log(`Couldn't remove the worktree at ${linked} (${removed.stderr.trim().split('\n').pop()}), so ${branch} is kept. Run ${unlock}\`git worktree remove ${linked}\`, then \`git branch -D ${branch}\`.`);
  }
  if (linked && removed.status === 0) {
    console.log(`Removed the ticket's worktree at ${linked}.`);
    if (here === linked) console.log(mergeAt !== linked
      ? `You ran this from that folder, which is gone now. ${base} is checked out at ${mergeAt}.`
      : `You ran this from that folder, which is gone now. ${base} isn't checked out anywhere; your main checkout is at ${main}.`);
  }
  if (!remote) { console.log(`No remote set for ${base}, so nothing was pushed.`); return; }
  const push = sh('git', ['push', remote, base], { cwd: main });
  if (push.status !== 0) {
    const behind = /\((fetch first|non-fast-forward)\)/.test(push.stderr);
    const fix = behind
      ? `${remote} got new commits on ${base} while you were shipping. Run \`git pull\`, then \`git push ${remote} ${base}\`.`
      : `If ${base} is protected on GitHub, allow direct pushes (turn off "Require a pull request before merging"), then run \`git push ${remote} ${base}\`.`;
    throw new SpeckError(`Merged locally, but pushing ${base} to ${remote} failed:\n${push.stderr.trim()}\n${fix}${branchRemote ? ` ${branch} is kept on ${branchRemote} until then.` : ''}`);
  }
  console.log(`Pushed ${base} to ${remote}.`);
  deleteRemoteBranch(main, branchRemote, branch);
}

// Only once the base branch is safely pushed: until then, the remote copy is the backup.
function deleteRemoteBranch(repo, remote, branch) {
  const found = sh('git', ['ls-remote', '--exit-code', '--heads', remote, branch], { cwd: repo });
  if (found.status === 2) return;
  const del = found.status === 0 ? sh('git', ['push', remote, '--delete', branch], { cwd: repo }) : found;
  if (del.status === 0) console.log(`Deleted ${branch} on ${remote}.`);
  else console.log(`Couldn't delete ${branch} on ${remote} (${del.stderr.trim().split('\n').pop()}). Delete it with \`git push ${remote} --delete ${branch}\`.`);
}

// Why an approved ticket can't ship without the user, or '' if config lets the builder ship it straight after approval.
function autoShipBlocker(repo, cfg, id) {
  const pad = String(id).padStart(4, '0');
  if (cfg.auto_ship !== true) return 'auto_ship is off in speck/config.yml';
  const t = findTicket(repo, pad);
  const allowed = [].concat(cfg.auto_ship_risk ?? []).map(String);
  if (!allowed.includes(String(t.fm.risk))) return `ticket ${pad} has risk "${t.fm.risk}", and auto_ship_risk only allows ${allowed.length ? allowed.join(', ') : 'none'}`;
  const blind = rounds(repo, pad).filter(r => r.meta.sandbox_ok === false).map(r => r.meta.round);
  if (blind.length) return `the reviewer couldn't inspect the repo in round ${blind.join(', ')}, so it only reviewed the diff`;
  return '';
}

function cmdShip(args) {
  const id = args.find(a => !a.startsWith('--'));
  if (!id) throw new SpeckError('Usage: speck ship <id> [--auto]');
  const repo = findRepoRoot();
  // --auto is how the builder ships straight after approval. It only goes ahead when config allows it for this ticket.
  if (args.includes('--auto')) {
    // Read the ticket where its branch is checked out, so the checks see the approved copy, not the base branch's.
    const cfg = loadConfig(repo);
    let folder = repo;
    try { folder = shipFolders(repo, ticketBranch(repo, cfg, id), cfg.base_branch).work; } catch { /* no branch: shipTicket says so */ }
    const why = autoShipBlocker(folder, cfg, id);
    if (why) throw new SpeckError(`Not shipping automatically: ${why}. The ticket stays approved, waiting for you to run /speck-ship ${String(id).padStart(4, '0')}.`, 12);
  }
  shipTicket(repo, id);
}

// Tickets being built in other worktrees, read from that worktree's copy, which has the real status.
function ticketsElsewhere(repo, cfg) {
  const here = fs.realpathSync(repo);
  const ticketBranch = new RegExp(`^${cfg.branch_prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d{4})-`);
  return worktreeList(repo).flatMap(w => {
    const m = w.branch && w.branch.match(ticketBranch);
    if (!m || w.path === here || !fs.existsSync(w.path)) return [];
    try { return [{ ...findTicket(w.path, m[1]), at: w.path }]; } catch { return []; }
  });
}

// Every ticket once. A ticket being built elsewhere replaces this checkout's copy of it, so it shows under its real status.
function statusTickets(repo, cfg) {
  const tickets = listTickets(repo);
  for (const t of ticketsElsewhere(repo, cfg)) {
    const i = tickets.findIndex(x => x.fm.id === t.fm.id);
    if (i >= 0) tickets[i] = t; else tickets.push(t);
  }
  return tickets;
}

const padId = id => String(id ?? '').padStart(4, '0');

// Each acceptance criterion's full text without its number: a numbered line at the start of a line begins one, and
// the lines under it (wrapped text, nested lists) belong to it, so a multi-line criterion comes through whole.
function criteriaText(lines = []) {
  const items = [];
  for (const line of lines.join('\n').replace(/<!--[\s\S]*?-->/g, '').split('\n')) {
    const m = line.match(/^\d+\.\s+(\S.*)$/);
    if (m) items.push([m[1]]);
    else if (items.length) items[items.length - 1].push(line);
  }
  return items.map(l => l.join('\n').replace(/\s+$/, ''));
}

// A section's text without template comments, with leading and trailing empty lines dropped, or null if nothing else is in it.
function sectionText(lines) {
  const text = (lines || []).join('\n').replace(/<!--[\s\S]*?-->/g, '').replace(/^(?:[ \t]*\n)+/, '').replace(/\s+$/, '');
  return text.trim() ? text : null;
}

// The text after `Self-check:` on the first line of Notes that starts with it (a list marker before it is allowed), or null.
function selfCheck(lines) {
  for (const line of (sectionText(lines) || '').split('\n')) {
    const m = line.match(/^\s*(?:[-*+]\s+)?Self-check:(.*)$/);
    if (m) return m[1].trim() || null;
  }
  return null;
}

// A build log as people read it. With `--output-format stream-json`, Claude Code writes one JSON event per line as it
// works: these become the agent's text and one line per tool call ("→ Bash: run the tests"), and the rest (tool output,
// session and rate-limit events) are left out. Any other line, such as plain `claude -p` output or an error, is kept as is.
const LOG_DETAIL = 200;
export function readableLog(text) {
  const out = [];
  let last = null; // the agent's latest text, so the result that repeats it isn't shown twice
  const short = s => { s = String(s).replace(/\s+/g, ' ').trim(); return s.length > LOG_DETAIL ? `${s.slice(0, LOG_DETAIL - 1)}…` : s; };
  for (const line of String(text ?? '').split('\n')) {
    let e = null;
    if (line.startsWith('{')) { try { e = JSON.parse(line); } catch { /* not an event */ } }
    if (!e || typeof e !== 'object' || typeof e.type !== 'string') { out.push(line); continue; }
    if (e.type === 'assistant' && Array.isArray(e.message?.content)) {
      for (const b of e.message.content) {
        if (b?.type === 'text' && typeof b.text === 'string' && b.text.trim()) { out.push(b.text.trim(), ''); last = b.text.trim(); }
        else if (b?.type === 'tool_use') {
          const i = b.input && typeof b.input === 'object' ? b.input : {};
          const what = i.description || i.command || i.file_path || i.path || i.pattern || i.url || i.query || i.prompt || i.skill || '';
          out.push(`→ ${b.name || 'tool'}${what ? `: ${short(what)}` : ''}`);
        }
      }
    } else if (e.type === 'user' && Array.isArray(e.message?.content)) {
      for (const b of e.message.content) {
        if (b?.type !== 'tool_result' || b.is_error !== true) continue;
        const c = typeof b.content === 'string' ? b.content : Array.isArray(b.content) ? b.content.map(x => x?.text || '').join(' ') : '';
        out.push(`  ✗ ${short(c) || 'failed'}`);
      }
    } else if (e.type === 'result') {
      const r = typeof e.result === 'string' ? e.result.trim() : '';
      if (r && r !== last) out.push(r);
      if (e.is_error === true || (e.subtype && e.subtype !== 'success')) out.push(`Build ended: ${e.subtype || 'error'}`);
    }
  }
  return out.join('\n');
}

// How a build launched by `speck run` ended, from its run record and log in the main checkout's speck/.cache/runs/
// (where speck run keeps them): {at, code, message}, or null when there's no record, it can't be read or the build
// hasn't exited. message is the last 50 lines of the log, trailing blank lines dropped, or null when it's missing or empty.
function buildExit(runs, id) {
  id = String(id ?? '');
  if (!/^[\w-]+$/.test(id)) return null;
  const dir = runs;
  let rec;
  try { rec = JSON.parse(fs.readFileSync(path.join(dir, `${id}.json`), 'utf8')); } catch { return null; }
  if (!rec || typeof rec !== 'object' || !Object.hasOwn(rec, 'exited')) return null;
  let message = null;
  try { message = readableLog(fs.readFileSync(path.join(dir, `${id}.log`), 'utf8')).replace(/\s+$/, '').split('\n').slice(-50).join('\n') || null; } catch { /* no log */ }
  return { at: rec.exited ?? null, code: rec.exit_code ?? null, message };
}

// The session a build launched by `speck run` ran in, from its run record: {id, cwd}, where cwd is the folder the build
// started from (where its session is kept), or null when there's no record, it can't be read or it lacks either.
function buildSession(runs, id) {
  id = String(id ?? '');
  if (!/^[\w-]+$/.test(id)) return null;
  let rec;
  try { rec = JSON.parse(fs.readFileSync(path.join(runs, `${id}.json`), 'utf8')); } catch { return null; }
  const text = v => typeof v === 'string' && v !== '';
  return rec && typeof rec === 'object' && text(rec.session) && text(rec.cwd) ? { id: rec.session, cwd: rec.cwd } : null;
}

// True while a build launched by `speck run` is paused: `speck pause` left a <id>.paused file beside its run record
// naming this build's session and pid, and the build has neither exited nor gone. The mark is a file of its own, so
// pause and play never write the run record that speck run keeps.
function buildPaused(runs, id) {
  id = String(id ?? '');
  if (!/^[\w-]+$/.test(id)) return false;
  let rec, mark;
  try { rec = JSON.parse(fs.readFileSync(path.join(runs, `${id}.json`), 'utf8')); mark = JSON.parse(fs.readFileSync(path.join(runs, `${id}.paused`), 'utf8')); } catch { return false; }
  return !!rec && typeof rec === 'object' && !!mark && typeof mark === 'object' && !Object.hasOwn(rec, 'exited')
    && Number.isInteger(rec.pid) && rec.pid > 0 && mark.pid === rec.pid && mark.session === rec.session && pidAlive(rec.pid);
}

// What `speck status --json` prints: everything status knows, for programs such as the control panel.
// The field names are a contract (0030); don't rename them.
export function statusData(repo) {
  const cfg = loadConfig(repo);
  const tickets = statusTickets(repo, cfg);
  const done = new Set(tickets.filter(t => t.fm.status === 'done').map(t => padId(t.fm.id)));
  let main = repo;
  try { main = worktreeList(repo)[0]?.path || repo; } catch { /* not a git checkout: this one */ }
  const runs = path.join(main, 'speck', '.cache', 'runs');
  const entries = tickets.map(t => {
    const lint = lintTicket(t, cfg);
    const question = contentLines(t.sections['blocked question']).join('\n');
    const after = Array.isArray(t.fm.after) ? t.fm.after : [];
    const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null);
    return {
      ...t.fm,
      type: ticketType(t),
      path: posix(path.relative(t.at || repo, t.file)),
      worktree: t.at || null,
      acceptance_criteria: criteriaText(t.sections['acceptance criteria']),
      blocked_question: question || null,
      lint: { errors: lint.errors.length, warnings: lint.warnings.length },
      problem: sectionText(t.sections.problem),
      outcome: sectionText(t.sections.outcome),
      out_of_scope: sectionText(t.sections['out of scope']),
      notes: sectionText(t.sections.notes),
      self_check: selfCheck(t.sections.notes),
      lint_messages: { errors: lint.errors, warnings: lint.warnings },
      rounds: ticketRounds(t.raw).rounds.map(r => ({
        round: r?.meta?.round ?? null,
        reviewer: r?.meta?.reviewer ?? null,
        verdict: r?.verdict?.verdict ?? null,
        seconds: num(r?.meta?.seconds),
        tokens: (num(r?.meta?.usage?.input_tokens) || 0) + (num(r?.meta?.usage?.output_tokens) || 0),
      })),
      waiting_on: after.filter(id => !done.has(padId(id))),
      build_exit: buildExit(runs, t.fm.id),
      session: buildSession(runs, t.fm.id),
      paused: buildPaused(runs, t.fm.id),
    };
  });
  // Lowest priority number first, no priority last, then by id. (Infinity - Infinity is NaN, which falls through to the id.)
  const rank = e => (typeof e.priority === 'number' && Number.isFinite(e.priority) ? e.priority : Infinity);
  entries.sort((a, b) => (rank(a) - rank(b)) || padId(a.id).localeCompare(padId(b.id)));
  const dir = path.join(repo, 'speck', 'ideas');
  const ideas = (fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort() : []).map(f => {
    const text = fs.readFileSync(path.join(dir, f), 'utf8');
    return { path: `speck/ideas/${f}`, title: (text.match(/^# (.+)$/m) || [])[1]?.trim() || f, status: ideaStatus(text) || null, body: text };
  });
  // The command that reopens a build's session, for the panel. A config without the setting gets the default.
  const resume = !Object.hasOwn(cfg, 'resume_command') ? DEFAULT_RESUME_COMMAND : typeof cfg.resume_command === 'string' ? cfg.resume_command.trim() : '';
  return { tickets: entries, ideas, resume_command: resume };
}

function cmdStatus(args = []) {
  const repo = findRepoRoot();
  if (args.includes('--json')) return console.log(JSON.stringify(statusData(repo), null, 2));
  const tickets = statusTickets(repo, loadConfig(repo));
  if (!tickets.length) return console.log('No tickets yet. Capture an idea, then run /speck-ticket.');
  const order = ['approved', 'blocked', 'reviewing', 'building', 'ready', 'draft', 'done', 'cancelled'];
  for (const s of order) {
    const group = tickets.filter(t => t.fm.status === s).sort((a, b) => (a.fm.priority ?? 9) - (b.fm.priority ?? 9));
    if (!group.length) continue;
    console.log(`\n${s.toUpperCase()} (${group.length})${s === 'approved' ? ': waiting for you. Read `speck pack <id>`, then run /speck-ship <id>' : ''}`);
    for (const t of group) {
      console.log(`  ${t.fm.id}${t.fm.type === 'bug' ? ' bug' : ''}  P${t.fm.priority ?? '-'}  ${t.fm.size}/${t.fm.risk}  ${t.fm.title}`);
      if (t.at) console.log(`        ↳ being built in ${t.at}`);
      if (s === 'blocked') {
        const q = contentLines(t.sections['blocked question']).join(' ');
        if (q) console.log(`        ? ${q}`);
      }
      if (s === 'cancelled' && !blank(t.fm.cancel_reason)) console.log(`        ❌ ${t.fm.cancel_reason}`);
    }
  }
  // Notes filed in speck/ideas/done/ count as ticketed, whatever their status says.
  const mdIn = d => (fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith('.md')) : []);
  const notes = mdIn(ideasDir(repo)), filed = mdIn(doneIdeasDir(repo)).length;
  const ticketed = filed + notes.filter(f => ideaStatus(fs.readFileSync(path.join(ideasDir(repo), f), 'utf8')).startsWith('ticketed')).length;
  const total = notes.length + filed;
  console.log(`\nIDEAS (${total}: ${total - ticketed} waiting, ${ticketed} ticketed) in speck/ideas/`);
}

// ---------- panel (a view in the browser, with two writes: Set ready and a draft's priority) ----------

const PANEL_PORT = 4777;
const htmlEscape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function panelPort(args) {
  const i = args.findIndex(a => a === '--port' || a.startsWith('--port='));
  if (i === -1) return PANEL_PORT;
  const v = args[i].startsWith('--port=') ? args[i].slice(7) : args[i + 1];
  if (!/^\d+$/.test(v ?? '') || +v < 1 || +v > 65535) throw new SpeckError(`--port must be a whole number from 1 to 65535 (got "${v ?? ''}").`);
  return +v;
}

// The panel's one write: set a draft ticket to ready, as `speck set <id> status ready` does, and commit only that
// ticket, since `speck start` needs it committed. Every refusal comes before the first write. Returns
// { status, body } for the server to send.
function panelSetReady(repo, id) {
  const cfg = loadConfig(repo);
  let t;
  try { t = findTicket(repo, id); } catch (e) { return { status: 404, body: { error: e.message } }; }
  const pad = t.fm.id;
  if (t.fm.status !== 'draft') return { status: 409, body: { error: `Ticket ${pad} is "${t.fm.status}", not a draft, so it can't be set ready from here.` } };
  const { errors } = lintTicket(t, cfg);
  if (errors.length) return { status: 422, body: { error: `Not ready:\n${errors.map(e => `  ✗ ${e}`).join('\n')}` } };
  const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repo }).stdout.trim();
  if (branch !== cfg.base_branch)
    return { status: 409, body: { error: `This checkout is on "${branch}", not ${cfg.base_branch}, so the ticket would be committed to the wrong branch. Switch to ${cfg.base_branch}, then try again.` } };
  const rel = path.relative(repo, t.file);
  writeField(t, 'status', 'ready');
  const commit = commitTicketOnly(repo, t.file, t.raw, `speck(${pad}): ready`);
  if (commit.status !== 0)
    return { status: 500, body: { error: `Couldn't commit ${rel}, so it's still a draft:\n${(commit.stderr || commit.stdout || '').trim().split('\n').slice(-5).join('\n')}` } };
  return { status: 200, body: { ok: true, id: pad } };
}

// The panel's other write: set a draft ticket's priority, as `speck set <id> priority <n>` does, and commit only that
// ticket. `value` is from the URL, so anything but 1 to 5 is refused. Every refusal comes before the first write.
function panelSetPriority(repo, id, value) {
  const cfg = loadConfig(repo);
  let t;
  try { t = findTicket(repo, id); } catch (e) { return { status: 404, body: { error: e.message } }; }
  const pad = t.fm.id;
  if (t.fm.status !== 'draft') return { status: 409, body: { error: `Ticket ${pad} is "${t.fm.status}", not a draft, so its priority can't be changed from here.` } };
  if (!/^[1-5]$/.test(value)) return { status: 422, body: { error: `Priority must be a whole number from 1 to 5, not "${value.slice(0, 20)}".` } };
  const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repo }).stdout.trim();
  if (branch !== cfg.base_branch)
    return { status: 409, body: { error: `This checkout is on "${branch}", not ${cfg.base_branch}, so the ticket would be committed to the wrong branch. Switch to ${cfg.base_branch}, then try again.` } };
  if (String(t.fm.priority) === value) return { status: 200, body: { ok: true, id: pad } }; // already at that priority
  const rel = path.relative(repo, t.file);
  writeField(t, 'priority', value);
  const commit = commitTicketOnly(repo, t.file, t.raw, `speck(${pad}): priority ${value}`);
  if (commit.status !== 0)
    return { status: 500, body: { error: `Couldn't commit ${rel}, so its priority is unchanged:\n${(commit.stderr || commit.stdout || '').trim().split('\n').slice(-5).join('\n')}` } };
  return { status: 200, body: { ok: true, id: pad } };
}

// True only for the token this server made, compared in constant time.
// Compared as bytes, since a header with non-ASCII characters can match in length but not in bytes.
function sameToken(given, token) {
  if (typeof given !== 'string') return false;
  const a = Buffer.from(given), b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// The tail of a build's log from `speck run`, for the panel: its last 200 lines, from the main checkout, with trailing
// blank lines dropped, and whether it has more. A ticket with no log gets empty text. Reads only, writing nothing.
const PANEL_LOG_LINES = 200;
function panelLog(repo, id) {
  let main = repo;
  try { main = worktreeList(repo)[0]?.path || repo; } catch { /* not a git checkout: this one */ }
  let text;
  try { text = readableLog(fs.readFileSync(path.join(main, 'speck', '.cache', 'runs', `${padId(id)}.log`), 'utf8')); }
  catch (e) { if (e.code === 'ENOENT' || e.code === 'ENOTDIR') return { text: '', truncated: false }; throw e; }
  const lines = text.split('\n');
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  return { text: lines.slice(-PANEL_LOG_LINES).join('\n'), truncated: lines.length > PANEL_LOG_LINES };
}

// `speck panel`. The process you start only launches the first server process and waits until the last one has gone.
// Everything else, serving, watching the code and restarting, happens in server processes, each running the code as it
// was when it started: when the code changes, a server starts its successor on the new code, hands it the port and stops.
function cmdPanel(args) {
  findRepoRoot(); // plain errors before anything starts
  panelPort(args);
  // Made once, when `speck panel` starts, and passed down through every restart, so an open page's token keeps working.
  const { child } = startPanelServer(args, crypto.randomBytes(32).toString('hex'), null, 'pipe');
  // Each server process writes its exit code to this pipe as it exits, and the pipe closes once they all have.
  let code = 1, piped = false, disconnected = false;
  const done = () => { if (piped && disconnected) process.exit(code); };
  child.on('message', m => { if (m && m.type === 'failed') console.error(m.message); });
  child.on('disconnect', () => { disconnected = true; done(); });
  child.on('error', e => { console.error(`The panel couldn't start: ${e.message}`); process.exit(1); });
  child.stdio[4].setEncoding('utf8');
  child.stdio[4].on('data', d => { const last = d.trim().split('\n').pop(); if (/^\d+$/.test(last)) code = +last; });
  child.stdio[4].on('close', () => { piped = true; done(); });
  // Server processes stop by themselves once this has gone.
  process.on('SIGINT', () => process.exit(0));
  process.on('SIGTERM', () => process.exit(0));
}

// Starts a server process on the code as it is now, with the token, and the port to take over from `from` (the running
// server, if any). `lifeline` is the pipe to `cmdPanel` ('pipe' for the first, then fd 4, passed on). The new process
// says 'ready' once it's serving, or { type: 'failed', line, message } and exits if it can't start.
function startPanelServer(args, token, from, lifeline) {
  const code = codeHash();
  const loader = `try { const m = await import(process.env.SPECK_PANEL_CODE_URL); await m.panelServer(); }
catch (e) { const line = (e && e.name === 'SpeckError' ? '' : (e && e.name || 'Error') + ': ') + String(e && e.message || e).split('\\n')[0];
  process.send({ type: 'failed', line, message: e && e.name === 'SpeckError' ? e.message : line }, () => process.exit(typeof e?.code === 'number' ? e.code : 1)); }`;
  const child = spawn(process.execPath, ['--input-type=module', '-e', loader], {
    stdio: ['ignore', 'inherit', 'inherit', 'ipc', lifeline],
    env: { ...process.env, SPECK_PANEL_CODE_URL: pathToFileURL(fileURLToPath(import.meta.url)).href, SPECK_PANEL_ARGS: JSON.stringify(args),
      SPECK_PANEL_TOKEN: token, SPECK_PANEL_CODE: code, SPECK_PANEL_HANDOVER: from ? '1' : '' } });
  if (from) child.on('message', m => { if (m === 'port') child.send('listen', from, () => {}); });
  return { child, code };
}

const PANEL_WATCH_MS = 250, PANEL_SETTLE_MS = 500, PANEL_START_MS = 10000, PANEL_STOP_MS = 3000;

// The code `speck panel` runs from: every .mjs file in the CLI's own folder (scripts/, or .speck/scripts/ in a repo set
// up with `speck init`). `codeStamp` is cheap, to notice a change; `codeHash` is the content, to tell a real change.
function panelCode() {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  let names = [];
  try { names = fs.readdirSync(dir).filter(n => n.endsWith('.mjs')).sort(); } catch { /* gone for now: no code to compare */ }
  return names.map(n => path.join(dir, n));
}
function codeStamp() {
  return panelCode().map(f => { try { const st = fs.statSync(f); return `${f}:${st.size}:${st.mtimeMs}:${st.ino}`; } catch { return `${f}:-`; } }).join('|');
}
function codeHash() {
  const h = crypto.createHash('sha256');
  for (const f of panelCode()) { h.update(f); h.update('\0'); try { h.update(fs.readFileSync(f)); } catch { h.update('-'); } h.update('\0'); }
  return h.digest('hex');
}

// One server process: serves the panel page, /api/state and each build's log to this machine only, plus the two writes,
// POST /api/tickets/<id>/ready and POST /api/tickets/<id>/priority/<n>. Every request reads the files afresh, the page
// included, so a changed panel.html shows on a reload. It also watches the code, and when it changes, hands over to a
// server on the new code (see cmdPanel).
export async function panelServer() {
  const env = process.env;
  const args = JSON.parse(env.SPECK_PANEL_ARGS || '[]'), handover = env.SPECK_PANEL_HANDOVER === '1';
  // A web page elsewhere can send a POST here (the Host check doesn't stop a form post to 127.0.0.1), but can't read
  // this token, which goes only into the page, and its Origin gives it away. Taken out of the environment, so the
  // commands this runs don't get it.
  const token = env.SPECK_PANEL_TOKEN, running = env.SPECK_PANEL_CODE || codeHash();
  for (const k of ['SPECK_PANEL_ARGS', 'SPECK_PANEL_HANDOVER', 'SPECK_PANEL_TOKEN', 'SPECK_PANEL_CODE', 'SPECK_PANEL_CODE_URL']) delete env[k];
  if (!token || !process.send) throw new SpeckError('Start the panel with: speck panel');
  let successor = null; // the server starting on new code, until it's ready or fails
  // The pipe to cmdPanel: this writes its exit code there, and stops once cmdPanel has gone (Ctrl+C or a kill).
  process.on('exit', c => { if (successor) successor.kill('SIGKILL'); try { fs.writeSync(4, `${c}\n`); } catch { /* cmdPanel has gone */ } });
  const life = new net.Socket({ fd: 4, readable: true, writable: false, allowHalfOpen: true });
  life.on('end', () => process.exit(0));
  life.on('error', () => process.exit(0));
  life.resume();

  const repo = findRepoRoot();
  const port = panelPort(args);
  const cfg = loadConfig(repo);
  const repoName = htmlEscape(path.basename(worktreeList(repo)[0]?.path || repo)), base = htmlEscape(cfg.base_branch);
  let restartError = null; // the last failed restart, shown on the page until a restart works or the code is put back
  let stopping = false;
  const pageFile = path.join(TEMPLATES, 'panel.html');
  const page = () => fs.readFileSync(pageFile, 'utf8')
    .replace('{{repo}}', () => repoName).replace('{{base}}', () => base).replace('{{token}}', () => token);
  const origins = new Set([`http://127.0.0.1:${port}`, `http://localhost:${port}`]);
  // Only these Host headers are served, so a web page on another name that resolves here (DNS rebinding) gets nothing.
  const hosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
  const send = (res, status, type, body) => {
    res.writeHead(status, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
      ...(status === 405 ? { Allow: 'GET' } : {}), ...(stopping ? { Connection: 'close' } : {}) });
    res.end(body);
  };
  const server = http.createServer((req, res) => {
    if (!hosts.has(String(req.headers.host || '').toLowerCase())) return send(res, 403, 'text/plain', 'Forbidden: open the panel at 127.0.0.1 or localhost.\n');
    const where = req.url.split('?')[0];
    const ready = where.match(/^\/api\/tickets\/(\d{1,4})\/ready$/);
    if (req.method === 'POST' && ready) {
      if (!origins.has(String(req.headers.origin || '').toLowerCase()) || !sameToken(req.headers['x-speck-token'], token))
        return send(res, 403, 'application/json', JSON.stringify({ error: 'Forbidden: only the panel page this server sent can do that. Reload it.' }));
      try {
        const out = panelSetReady(repo, ready[1]);
        return send(res, out.status, 'application/json', JSON.stringify(out.body));
      } catch (e) { return send(res, 500, 'application/json', JSON.stringify({ error: e instanceof SpeckError ? e.message : String(e?.message || e) })); }
    }
    const priority = where.match(/^\/api\/tickets\/(\d{1,4})\/priority\/([^/]*)$/);
    if (req.method === 'POST' && priority) {
      if (!origins.has(String(req.headers.origin || '').toLowerCase()) || !sameToken(req.headers['x-speck-token'], token))
        return send(res, 403, 'application/json', JSON.stringify({ error: 'Forbidden: only the panel page this server sent can do that. Reload it.' }));
      try {
        const out = panelSetPriority(repo, priority[1], priority[2]);
        return send(res, out.status, 'application/json', JSON.stringify(out.body));
      } catch (e) { return send(res, 500, 'application/json', JSON.stringify({ error: e instanceof SpeckError ? e.message : String(e?.message || e) })); }
    }
    if (req.method !== 'GET') return send(res, 405, 'text/plain', 'Method not allowed.\n');
    if (where === '/') {
      try { return send(res, 200, 'text/html', page()); }
      catch (e) { return send(res, 500, 'text/plain', `Couldn't read the panel page, ${pageFile}: ${e.message}\nPut the file back, then reload.\n`); }
    }
    if (where === '/api/state') {
      try { return send(res, 200, 'application/json', JSON.stringify({ ...statusData(repo), ...(restartError ? { restart_error: restartError } : {}) })); }
      catch (e) { return send(res, 500, 'application/json', JSON.stringify({ error: e instanceof SpeckError ? e.message : String(e?.message || e) })); }
    }
    const log = where.match(/^\/api\/tickets\/(\d{1,4})\/log$/);
    if (log) {
      try { return send(res, 200, 'application/json', JSON.stringify(panelLog(repo, log[1]))); }
      catch (e) { return send(res, 500, 'application/json', JSON.stringify({ error: `Couldn't read the build log: ${e.message}` })); }
    }
    return send(res, 404, 'text/plain', 'Not found.\n');
  });

  // The port: the server this one replaces hands over the socket it's listening on, and both take connections until
  // the old one stops. The first server listens itself.
  const where = handover
    ? await new Promise(resolve => { process.on('message', (m, h) => { if (m === 'listen' && h) resolve(h); }); process.send('port'); })
    : { port, host: '127.0.0.1' };
  await new Promise((resolve, reject) => {
    server.once('error', e => reject(e.code === 'EADDRINUSE'
      ? new SpeckError(`Port ${port} is already in use, so the panel didn't start. Stop whatever is using it, or pick another port with --port <n>.`)
      : new SpeckError(`The panel couldn't start on port ${port}: ${e.message}`)));
    server.listen(where, resolve);
  });
  server.on('error', e => console.error(`speck panel: ${e.message}`));
  if (!handover) console.log(`speck panel: http://127.0.0.1:${port}/ (press Ctrl+C to stop)`);
  process.send('ready');

  // Stops taking connections, closes the idle ones at once and the rest once answered (each answer then says
  // Connection: close), so the browser's next request reaches the new server, then exits.
  const stop = () => {
    stopping = true;
    clearInterval(watcher);
    setTimeout(() => process.exit(0), PANEL_STOP_MS).unref();
    server.close(() => process.exit(0));
    server.closeIdleConnections();
  };
  // Starts a server on the new code and hands over to it once it's ready. If it can't start, this one keeps serving and
  // says why, until a later change.
  const restart = () => {
    if (codeHash() === running) { restartError = null; return; } // back to the code that's running: nothing to do
    const { child } = startPanelServer(args, token, server, 4);
    successor = child;
    let settled = false;
    const fail = line => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill('SIGKILL');
      successor = null;
      restartError = line;
      console.error(`speck panel couldn't restart with the new code: ${line}\nIt's still running the code it had, and tries again on the next change.`);
    };
    const timer = setTimeout(() => fail(`it wasn't ready within ${PANEL_START_MS / 1000} seconds`), PANEL_START_MS);
    child.on('error', e => fail(e.message));
    child.on('exit', c => fail(`it stopped with exit code ${c} before it was ready`));
    child.on('message', m => {
      if (m && m.type === 'failed') fail(m.line);
      if (m !== 'ready' || settled) return;
      settled = true;
      clearTimeout(timer);
      successor = null;
      child.removeAllListeners();
      child.disconnect();
      child.unref();
      console.log('speck panel: the code changed, so it restarted with the new code.');
      stop();
    });
  };
  // Checks the code four times a second, and once a change has settled (unchanged for PANEL_SETTLE_MS), restarts if
  // the content differs from what's running. The first check always compares, in case the code changed while starting.
  let stamp = '', changedAt = 0;
  const watcher = setInterval(() => {
    const now = codeStamp();
    if (now !== stamp) { stamp = now; changedAt = Date.now(); return; }
    if (!changedAt || successor || stopping || Date.now() - changedAt < PANEL_SETTLE_MS) return;
    changedAt = 0;
    restart();
  }, PANEL_WATCH_MS);
}

// ---------- run (start a non-interactive build for each ready ticket) ----------

const RUN_POLL_MS = 5000;
const DEFAULT_RESUME_COMMAND = 'claude --resume {session}';
const DEFAULT_BUILD_COMMAND = 'claude -p "/speck-build {id}" --session-id {session} --output-format stream-json --verbose --dangerously-skip-permissions';

// The folder for speck run's records and logs, inside speck/.cache/, which git ignores.
function runsDir(repo) {
  const root = path.join(repo, 'speck', '.cache');
  const dir = path.join(root, 'runs');
  fs.mkdirSync(dir, { recursive: true });
  const ignore = path.join(root, '.gitignore');
  if (!fs.existsSync(ignore)) fs.writeFileSync(ignore, '# Working files for reviews in progress. Review history is in each ticket.\n*\n');
  return dir;
}

const pidAlive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };

// One speck run per repo: a lock file holding its pid. The file is made complete and then linked into place, which
// is atomic, so no runner ever sees a half-written lock. A lock whose process is gone (killed outright) is taken
// over, but only while holding a second, short-lived recovery lock, so two runners can't both take over the same one.
function takeRunLock(repo) {
  const dir = runsDir(repo);
  const lock = path.join(dir, 'run.lock'), recover = path.join(dir, 'run.lock.recover');
  const mine = path.join(dir, `run.lock.${process.pid}.tmp`);
  fs.writeFileSync(mine, String(process.pid));
  const link = to => { try { fs.linkSync(mine, to); return true; } catch (e) { if (e.code === 'EEXIST') return false; throw e; } };
  const holder = f => { try { return fs.readFileSync(f, 'utf8').trim(); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } };
  const busy = pid => { const n = Number(pid); return Number.isInteger(n) && n > 0 && n !== process.pid && pidAlive(n); };
  try {
    for (let tries = 0; tries < 5; tries++) {
      if (link(lock)) return lock;
      const pid = holder(lock);
      if (pid === null) continue; // removed just now: try again
      if (busy(pid))
        throw new SpeckError(`speck run is already running in this repo (process ${pid}). Stop that one first, or leave it running. If it isn't speck run, delete ${path.relative(repo, lock)}.`);
      // A stale lock. Take it over only while holding the recovery lock, and only if it's still the same stale one.
      if (!link(recover)) {
        const other = holder(recover);
        if (other !== null && !busy(other))
          throw new SpeckError(`A speck run was stopped while taking over a stale lock. If no speck run is running, delete ${path.relative(repo, recover)}, then run this again.`);
        throw new SpeckError(`Another speck run is starting in this repo (process ${other}). Leave that one running.`);
      }
      try {
        if (holder(lock) === pid) fs.rmSync(lock, { force: true });
        if (link(lock)) return lock;
      } finally { fs.rmSync(recover, { force: true }); }
    }
    throw new SpeckError('speck run couldn\'t take its lock file. Try again.');
  } finally { fs.rmSync(mine, { force: true }); }
}

// Watches the board and starts a build for each ready ticket that isn't waiting on another, up to
// max_parallel_builds at once. Builds run in their own process group, so stopping speck run leaves them running.
function cmdRun() {
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const command = typeof cfg.build_command === 'string' ? cfg.build_command.trim() : '';
  if (!command)
    throw new SpeckError(`No build_command is set in speck/config.yml, so speck run has nothing to start builds with. Add, for example:\n  build_command: '${DEFAULT_BUILD_COMMAND}'`);
  let words;
  try { words = splitCommand(command); } catch { throw new SpeckError(`build_command in speck/config.yml has a quote that isn't closed: ${command}`); }
  const max = cfg.max_parallel_builds ?? 1;
  if (!Number.isInteger(max) || max < 1) throw new SpeckError(`max_parallel_builds in speck/config.yml must be a whole number of at least 1 (got "${max}").`);
  const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repo }).stdout.trim();
  if (branch !== cfg.base_branch)
    throw new SpeckError(`This checkout is on "${branch}", not ${cfg.base_branch}. speck run starts builds from ${cfg.base_branch}, so switch to it, then run this again.`);
  const lock = takeRunLock(repo);
  const release = () => { try { if (fs.readFileSync(lock, 'utf8').trim() === String(process.pid)) fs.rmSync(lock, { force: true }); } catch { /* already gone */ } };
  process.on('exit', release);
  const stop = () => {
    console.log(`speck run stopped.${running.size ? ` ${running.size} build${running.size === 1 ? ' is' : 's are'} still running: ${[...running].join(', ')}.` : ''}`);
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  const launched = new Set(); // every ticket this speck run has launched, so none is launched twice
  const running = new Set();
  const pollMs = Number(process.env.SPECK_RUN_POLL_MS) > 0 ? Number(process.env.SPECK_RUN_POLL_MS) : RUN_POLL_MS;
  let lastError = null;

  // Adds the exit to a build's run record, keeping what's there, so the board can tell a build that has finished.
  // Written to a temporary file and renamed into place, so nothing reading it sees half a record.
  const recordExit = (id, file, code) => {
    const tmp = `${file}.${process.pid}.tmp`;
    try {
      const rec = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (!rec || typeof rec !== 'object' || Array.isArray(rec)) throw new Error('it isn\'t a JSON object');
      fs.writeFileSync(tmp, `${JSON.stringify({ ...rec, exited: new Date().toISOString(), exit_code: code }, null, 2)}\n`);
      fs.renameSync(tmp, file);
    } catch (e) {
      fs.rmSync(tmp, { force: true, recursive: true });
      console.error(`${id}: couldn't save its exit in ${path.relative(repo, file)} (${e.message}), so the board won't show that this build has finished.`);
    }
  };

  const finished = (id, log, code, signal, failed, recordFile) => {
    running.delete(id);
    if (failed) console.log(`${id} build couldn't start: ${failed}`);
    else if (stoppedBySpeck(recordFile)) {
      console.log(`${id} build ended by \`speck stop\`.`);
      recordExit(id, recordFile, signal ? null : code);
      return tick();
    } else {
      console.log(`${id} build exited with ${signal ? `signal ${signal}` : `code ${code}`}.`);
      recordExit(id, recordFile, signal ? null : code);
    }
    if (!failed) reportIfStillReady(id, log);
    tick();
  };

  // A build that ended with its ticket still ready never started it: say so, with the end of its log.
  const reportIfStillReady = (id, log) => {
    let status = null;
    // From the same reading as the board, so a build's own worktree copy of the ticket counts.
    try { status = statusData(repo).tickets.find(t => t.id === id)?.status ?? null; } catch { /* unreadable: nothing to say */ }
    if (status !== 'ready') return;
    let tail = '';
    try { tail = readableLog(fs.readFileSync(log, 'utf8')).replace(/\s+$/, '').split('\n').slice(-5).join('\n'); } catch { /* no log */ }
    console.log(`${id} is still ready, so the build never started it. speck run won't launch it again. Last lines of ${path.relative(repo, log)}:\n${tail}`);
  };

  // Builds an earlier speck run launched: each run file with no exit recorded. One whose process is still running is
  // left alone and watched until it stops; it counts towards max_parallel_builds meanwhile. One whose process has
  // gone gets its exit recorded now. Its exit code can't be known, as it isn't this speck run's child.
  const adopted = new Map();
  const adoptEarlierBuilds = () => {
    const dir = runsDir(repo);
    for (const name of fs.readdirSync(dir).filter(f => /^[^.]+\.json$/.test(f)).sort()) {
      const id = name.slice(0, -'.json'.length), file = path.join(dir, name);
      let rec;
      try { rec = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { continue; }
      if (!rec || typeof rec !== 'object' || Array.isArray(rec) || Object.hasOwn(rec, 'exited')) continue;
      const pid = rec.pid;
      if (!(Number.isInteger(pid) && pid > 0 && pid !== process.pid && pidAlive(pid))) { recordExit(id, file, null); continue; }
      launched.add(id);
      running.add(id);
      const session = rec.session ?? 'unknown';
      adopted.set(id, { pid, session, file, log: path.join(dir, `${id}.log`) });
      console.log(`${id} is already being built (session ${session}, process ${pid}), so speck run won't launch it. It counts towards max_parallel_builds until it stops.${buildPaused(dir, id) ? ` It's paused: run \`speck play ${id}\` to carry it on.` : ''}`);
    }
  };
  const checkAdopted = () => {
    for (const [id, b] of adopted) {
      if (pidAlive(b.pid)) continue;
      adopted.delete(id);
      running.delete(id);
      const byStop = stoppedBySpeck(b.file);
      recordExit(id, b.file, null);
      if (byStop) { console.log(`${id} build (session ${b.session}) ended by \`speck stop\`.`); continue; }
      console.log(`${id} build (session ${b.session}, process ${b.pid}) stopped.`);
      reportIfStillReady(id, b.log);
    }
  };

  const launch = id => {
    launched.add(id);
    running.add(id);
    const session = crypto.randomUUID();
    const argv = words.map(w => w.replace(/\{id\}/g, id).replace(/\{session\}/g, session));
    const dir = runsDir(repo);
    const log = path.join(dir, `${id}.log`);
    const recordFile = path.join(dir, `${id}.json`);
    const record = pid => `${JSON.stringify({ id, session, cwd: repo, started: new Date().toISOString(), pid, command: argv }, null, 2)}\n`;
    let fd = null, child;
    try {
      // Written before the build starts, so a record that can't be written stops the build from starting at all.
      fs.writeFileSync(recordFile, record(null));
      fd = fs.openSync(log, 'w');
      child = spawn(argv[0], argv.slice(1), { cwd: repo, detached: true, stdio: ['ignore', fd, fd], env: { ...process.env, [BUILD_ENV]: session } });
    } catch (e) { if (fd !== null) fs.closeSync(fd); return finished(id, log, null, null, e.message); }
    fs.closeSync(fd);
    let done = false;
    child.on('error', e => { if (!done) { done = true; finished(id, log, null, null, e.message); } });
    child.on('exit', (code, signal) => { if (!done) { done = true; finished(id, log, code, signal, null, recordFile); } });
    child.unref();
    if (child.pid) {
      try { fs.writeFileSync(recordFile, record(child.pid)); } catch (e) {
        console.error(`${id}: couldn't save its process id in ${path.relative(repo, recordFile)} (${e.message}). The build is running as process ${child.pid}, session ${session}.`);
      }
      console.log(`Launched ${id} (session ${session}). Log: ${path.relative(repo, log)}`);
    }
  };

  function tick() {
    checkAdopted();
    let tickets;
    try { tickets = statusData(repo).tickets; lastError = null; } catch (e) {
      const msg = e instanceof SpeckError ? e.message : String(e?.message || e);
      if (msg !== lastError) console.error(`speck run couldn't read the tickets, and will try again: ${msg}`);
      lastError = msg;
      return;
    }
    for (const t of tickets) {
      if (running.size >= max) break;
      if (t.status !== 'ready' || (t.waiting_on || []).length || launched.has(t.id)) continue;
      launch(t.id);
    }
  }

  console.log(`speck run: watching for ready tickets every ${pollMs / 1000}s, up to ${max} build${max === 1 ? '' : 's'} at a time. Press Ctrl+C to stop.`);
  adoptEarlierBuilds();
  tick();
  setInterval(tick, pollMs);
}

// ---------- pause and play (hold a build speck run launched, then carry it on) ----------

// Set in the environment of each build speck run launches, so every process the build starts inherits it.
const BUILD_ENV = 'SPECK_BUILD_SESSION';

// Every process, as [pid, ppid, pgid].
function processRows() {
  const r = sh('ps', ['-A', '-o', 'pid=,ppid=,pgid=']);
  if (r.status !== 0) throw new SpeckError(`Couldn't list processes with ps (${(r.stderr || '').trim() || `it exited with ${r.status}`}). Try again.`);
  return r.stdout.trim().split('\n').map(l => l.trim().split(/\s+/).map(Number)).filter(a => a.length === 3 && a.every(Number.isInteger));
}

// The processes whose environment holds `entry` (NAME=value). Linux reads /proc; macOS asks ps for each process's
// environment. Anywhere else, or for a process whose environment can't be read, it finds nothing.
function processesWithEnv(entry) {
  if (process.platform === 'linux') {
    const found = [];
    for (const d of fs.readdirSync('/proc').filter(d => /^\d+$/.test(d))) {
      try { if (fs.readFileSync(`/proc/${d}/environ`, 'utf8').split('\0').includes(entry)) found.push(Number(d)); } catch { /* gone, or not ours */ }
    }
    return found;
  }
  if (process.platform !== 'darwin') return [];
  const r = sh('ps', ['-A', '-E', '-ww', '-o', 'pid=,command=']);
  if (r.status !== 0) throw new SpeckError(`Couldn't list processes with ps (${(r.stderr || '').trim() || `it exited with ${r.status}`}). Try again.`);
  const has = new RegExp(`(^|\\s)${entry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`);
  return r.stdout.split('\n').filter(l => has.test(l)).map(l => Number(l.trim().split(/\s+/)[0])).filter(Number.isInteger);
}

// A build and every process it started, still running: its process group, every process holding its session in
// BUILD_ENV, and everything descended from those. Claude Code runs each Bash command in a session of its own, and a
// background process whose parent has exited is no longer in the build's tree, so neither the group nor the tree
// alone would reach them all. This process and its own children are left out, so a build that pauses itself still
// finishes saying so.
function buildProcesses(pid, session) {
  const rows = processRows();
  const self = p => p === process.pid || rows.some(([q, pp]) => q === p && pp === process.pid);
  const found = new Set(rows.filter(([p, , g]) => p === pid || g === pid).map(([p]) => p));
  if (typeof session === 'string' && session) for (const p of processesWithEnv(`${BUILD_ENV}=${session}`)) found.add(p);
  for (let grew = true; grew;) {
    grew = false;
    for (const [p, pp] of rows) if (!found.has(p) && found.has(pp)) { found.add(p); grew = true; }
  }
  return [...found].filter(p => !self(p));
}

// Sends `signal` to a build and everything it started. Stopping goes round again for any process started meanwhile.
// A process that has gone meanwhile is skipped. Returns the processes it signalled, and the first error that stopped
// it (null if none), so the caller can undo what it did.
function signalBuild(b, signal) {
  const sent = [];
  try {
    for (let pass = 0; pass < 10; pass++) {
      const fresh = buildProcesses(b.pid, b.rec.session).filter(p => !sent.includes(p));
      if (!fresh.length) break;
      for (const p of fresh) {
        try { process.kill(p, signal); sent.push(p); }
        catch (e) { if (e.code !== 'ESRCH') throw new SpeckError(`Couldn't send ${signal} to process ${p} (${e.code || e.message}).`); }
      }
      if (signal !== 'SIGSTOP') break;
    }
  } catch (e) { return { sent, error: e instanceof SpeckError ? e.message : String(e?.message || e) }; }
  return { sent, error: null };
}
const carryOn = pids => { for (const p of pids) try { process.kill(p, 'SIGCONT'); } catch { /* gone */ } };

// The run record of a ticket's build, from the main checkout's speck/.cache/runs/, with what pause and play need.
function runRecord(repo, args, usage) {
  if (!args[0]) throw new SpeckError(`Usage: speck ${usage} <id>`);
  if (process.platform === 'win32') throw new SpeckError(`speck ${usage} needs signals that Windows doesn't have, so it works on macOS and Linux only.`);
  const t = findTicket(repo, args[0]);
  const id = t.fm.id;
  let main = repo;
  try { main = worktreeList(repo)[0]?.path || repo; } catch { /* not a git checkout: this one */ }
  const file = path.join(main, 'speck', '.cache', 'runs', `${id}.json`);
  let rec = null;
  try { rec = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* no record */ }
  if (!rec || typeof rec !== 'object' || Array.isArray(rec)) rec = null;
  const pid = rec?.pid;
  // Running: no exit recorded, and its pid still leads its own process group, as a build speck run launched does.
  const running = !!rec && !Object.hasOwn(rec, 'exited') && Number.isInteger(pid) && pid > 0 && pidAlive(pid)
    && processRows().some(([p, , g]) => p === pid && g === pid);
  return { id, rec, pid, running, mark: path.join(path.dirname(file), `${id}.paused`), paused: running && buildPaused(path.dirname(file), id) };
}

// Written to a temporary file and renamed into place, so nothing reading it sees half of it.
function saveRecord(file, rec) {
  const tmp = `${file}.${process.pid}.tmp`;
  try { fs.writeFileSync(tmp, `${JSON.stringify(rec, null, 2)}\n`); fs.renameSync(tmp, file); }
  catch (e) { fs.rmSync(tmp, { force: true }); throw e; }
}

// Stops the build, then marks it paused. If either fails, whatever it stopped is carried on again.
function cmdPause(args) {
  const b = runRecord(findRepoRoot(), args, 'pause');
  if (!b.running) throw new SpeckError(`${b.id} has no running build launched by speck run, so there's nothing to pause.`);
  if (b.paused) throw new SpeckError(`${b.id} is already paused. Run \`speck play ${b.id}\` to carry it on.`);
  const { sent, error } = signalBuild(b, 'SIGSTOP');
  if (error) { carryOn(sent); throw new SpeckError(`Couldn't pause ${b.id}: ${error} It's still running.`); }
  try { saveRecord(b.mark, { session: b.rec.session ?? null, pid: b.pid, paused: new Date().toISOString() }); } catch (e) {
    carryOn(sent);
    throw new SpeckError(`Couldn't mark ${b.id} paused in ${b.mark} (${e.message}), so it's still running.`);
  }
  console.log(`${b.id} paused (session ${b.rec.session ?? 'unknown'}). Run \`speck play ${b.id}\` to carry it on.`);
}

// Carries the build on, then drops the paused mark. Until both have worked it stays marked paused, so play can be run again.
function cmdPlay(args) {
  const b = runRecord(findRepoRoot(), args, 'play');
  if (!b.paused) throw new SpeckError(`${b.id} isn't paused, so there's nothing to play.`);
  const { error } = signalBuild(b, 'SIGCONT');
  if (error) throw new SpeckError(`Couldn't play ${b.id}: ${error} It may be only partly playing, so it's still marked paused. Run \`speck play ${b.id}\` again.`);
  try { fs.rmSync(b.mark, { force: true }); } catch (e) {
    throw new SpeckError(`${b.id} is playing, but its paused mark ${b.mark} couldn't be removed (${e.message}). Run \`speck play ${b.id}\` again.`);
  }
  console.log(`${b.id} playing again (session ${b.rec.session ?? 'unknown'}).`);
}

// ---------- stop (end a build speck run launched for good, and block its ticket) ----------

const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// True if `speck stop` ended the build in this run record: a <id>.stopped file beside it names its session and pid.
function stoppedBySpeck(recordFile) {
  try {
    const rec = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
    const mark = JSON.parse(fs.readFileSync(recordFile.replace(/\.json$/, '.stopped'), 'utf8'));
    return !!rec && typeof rec === 'object' && !!mark && typeof mark === 'object' && Number.isInteger(mark.pid) && mark.pid === rec.pid && mark.session === rec.session;
  } catch { return false; }
}

// The build's processes that are still running. One that has exited and waits only for its parent to collect it is over.
function liveBuildProcesses(b) {
  const r = sh('ps', ['-A', '-o', 'pid=,stat=']);
  if (r.status !== 0) throw new SpeckError(`Couldn't list processes with ps (${(r.stderr || '').trim() || `it exited with ${r.status}`}).`);
  const zombies = new Set(r.stdout.trim().split('\n').map(l => l.trim().split(/\s+/)).filter(([, s]) => /^Z/.test(s || '')).map(([p]) => Number(p)));
  return buildProcesses(b.pid, b.rec.session).filter(p => !zombies.has(p));
}

// Ends a build and everything it started, already held with SIGSTOP so none can start anything more: asks each to end
// (SIGTERM, and SIGCONT so a held one hears it), and ends any still there after a few seconds with SIGKILL.
// Returns the processes still running at the end.
function endBuild(b) {
  const each = (pids, signal) => { for (const p of pids) try { process.kill(p, signal); } catch { /* gone */ } };
  let left = liveBuildProcesses(b);
  each(left, 'SIGTERM');
  each(left, 'SIGCONT');
  for (let i = 0; i < 50 && left.length; i++) { sleep(100); left = liveBuildProcesses(b); }
  for (let i = 0; i < 20 && left.length; i++) { each(left, 'SIGKILL'); sleep(100); left = liveBuildProcesses(b); }
  return left;
}

// Where the ticket's build keeps it: the checkout its branch is in, or the main checkout before the build has started it.
function buildTicket(repo, cfg, id) {
  const list = worktreeList(repo);
  const branch = new RegExp(`^${cfg.branch_prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${id}-`);
  const at = list.find(w => w.branch && branch.test(w.branch) && fs.existsSync(w.path))?.path || list[0].path;
  return { at, t: findTicket(at, id) };
}

// Ends the build, then blocks its ticket and commits that where the build keeps it. A <id>.stopped mark is left first,
// so speck run knows the build ended because of this rather than reporting it as a build that stopped or failed.
function cmdStop(args) {
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const b = runRecord(repo, args, 'stop');
  if (!b.running) throw new SpeckError(`${b.id} has no running or paused build launched by speck run, so there's nothing to stop.`);
  const stopMark = path.join(path.dirname(b.mark), `${b.id}.stopped`);
  try { saveRecord(stopMark, { session: b.rec.session ?? null, pid: b.pid, stopped: new Date().toISOString() }); } catch (e) {
    throw new SpeckError(`Couldn't mark ${b.id} stopped in ${stopMark} (${e.message}), so it's still ${b.paused ? 'paused' : 'running'}.`);
  }
  const { sent, error } = signalBuild(b, 'SIGSTOP');
  if (error) {
    if (!b.paused) carryOn(sent);
    fs.rmSync(stopMark, { force: true });
    throw new SpeckError(`Couldn't stop ${b.id}: ${error} It's still ${b.paused ? 'paused' : 'running'}.`);
  }
  let left;
  try { left = endBuild(b); } catch (e) {
    throw new SpeckError(`${b.id}'s build may be only partly stopped: ${e.message} Its ticket is unchanged. Run \`speck stop ${b.id}\` again. If it says there's nothing to stop, end any of its processes still running yourself, then block its ticket with \`speck set ${b.id} status blocked\`.`);
  }
  if (left.length)
    throw new SpeckError(`Couldn't end all of ${b.id}'s build: process${left.length === 1 ? '' : 'es'} ${left.join(', ')} ${left.length === 1 ? 'is' : 'are'} still running. End ${left.length === 1 ? 'it' : 'them'} with \`kill -9 ${left.join(' ')}\`. Its ticket is unchanged.`);
  fs.rmSync(b.mark, { force: true });
  console.log(`${b.id} stopped (session ${b.rec.session ?? 'unknown'}).`);

  const { at, t } = buildTicket(repo, cfg, b.id);
  if (['approved', 'done', 'cancelled'].includes(t.fm.status)) { console.log(`Its ticket is ${t.fm.status}, so it was left as it is.`); return; }
  const d = new Date();
  const question = `Stopped by you on ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.`;
  const comments = old => (old.match(/<!--[\s\S]*?-->/g) || []).map(c => `${c}\n`).join('');
  let text = setField(t.raw, 'status', 'blocked');
  text = /^## Blocked question[ \t]*$/m.test(text) ? replaceSection(text, 'Blocked question', old => `${comments(old)}${question}`, t.file)
    : `${text.replace(/\s*$/, '')}\n\n## Blocked question\n${question}\n`;
  fs.writeFileSync(t.file, syncHeader(text));
  const commit = commitTicketOnly(at, t.file, t.raw, `speck(${b.id}): stopped`);
  if (commit.status !== 0)
    throw new SpeckError(`${b.id}'s build is stopped, but its ticket couldn't be committed in ${at}, so it's unchanged:\n${(commit.stderr || commit.stdout || '').trim().split('\n').slice(-5).join('\n')}\nFix that, then run \`speck set ${b.id} status blocked\` there and commit it.`);
  console.log(`${b.id} is blocked, with its branch and work kept. Resume its session, or run /speck-build ${b.id}, to carry on.`);
}

function cmdDiffstat() {
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const { total, counted } = changedLines(repo, cfg.base_branch);
  for (const r of counted) console.log(`  ${String(r.lines).padStart(5)}  ${r.file}`);
  console.log(`${total} changed lines (limit ${cfg.limits.max_changed_lines}, excluding tests, lockfiles and speck/)`);
  if (total > cfg.limits.max_changed_lines) throw new SpeckError('Over the size limit: stop and propose a split.', 2);
}

function printRound(rec, cfg, all) {
  const v = rec.verdict;
  console.log(`Round ${rec.meta.round}: ${v.verdict}`);
  console.log(v.summary);
  if (rec.meta.sandbox_ok === false) console.log(NO_INSPECT);
  for (const c of v.criteria) console.log(`  AC${c.id} ${c.status}: ${c.evidence}`);
  for (const f of v.findings) console.log(`  ${f.id} [${f.severity}/${f.state}] ${f.file}: ${f.issue}${f.suggested_fix ? ` → ${f.suggested_fix}` : ''}`);
  const next = nextAction(all, cfg);
  console.log(`NEXT: ${next.action}${next.reason ? `: ${next.reason}` : ''}`);
  return next;
}

function cmdReview(args) {
  const id = args[0];
  if (!id) throw new SpeckError('Usage: speck review <id> [--tests=file] [--response=file]');
  const opt = k => (args.find(a => a.startsWith(`--${k}=`)) || '').slice(k.length + 3) || undefined;
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const t = findTicket(repo, id);
  const reviewer = t.fm.reviewer || cfg.reviewer;
  const command = cfg.reviewer_options?.[reviewer]?.command;
  const opts = { tests: opt('tests'), response: opt('response') };
  let rec;
  if (typeof command === 'string' && command.trim()) rec = reviewRound(repo, id, opts, s => runCommandReview(repo, id, reviewer, command, s));
  else if (reviewer === 'codex') rec = reviewRound(repo, id, opts, s => runCodexReview(repo, id, s));
  else throw new SpeckError(`speck review runs the codex adapter, or a reviewer with a command under reviewer_options in speck/config.yml. For reviewer "${reviewer}", follow the review skill and record the verdict with \`speck record ${id} <file>\`.`);
  const next = printRound(rec, cfg, rounds(repo, id));
  process.exitCode = { ship: 0, fix: 10, block: 11 }[next.action];
}

// A subagent often wraps its JSON verdict in a ```json fence, even when asked not to, so a reply saved as it was sent is accepted.
function parseReply(text, file) {
  const body = text.trim().replace(/^```[a-z]*\r?\n([\s\S]*?)\r?\n```$/i, '$1');
  let v = null;
  try { v = JSON.parse(body); } catch { /* not JSON: refused below */ }
  if (v && typeof v === 'object' && !Array.isArray(v)) return v;
  throw new SpeckError(`${file} isn't a JSON verdict. Save the reviewer's JSON reply (a \`\`\`json fence around it is fine), then run this again.`);
}

function cmdRecord(args) {
  const [id, file] = args;
  if (!id || !file) throw new SpeckError('Usage: speck record <id> <verdict.json> [--reviewer=name]');
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const reviewer = (args.find(a => a.startsWith('--reviewer=')) || '--reviewer=claude-subagent').slice(11);
  const verdict = parseReply(fs.readFileSync(file, 'utf8'), file);
  requireCommitted(repo, findTicket(repo, id), 'Commit your work before recording a round: the round is saved against the latest commit.');
  // A resumed reviewer keeps the settings it started with, saved by `speck reviewer-settings`.
  const saved = path.join(cacheDir(repo, id), 'reviewer-settings.json');
  const meta = fs.existsSync(saved) ? JSON.parse(fs.readFileSync(saved, 'utf8')) : settingsMeta(reviewerSettings(findTicket(repo, id).fm, cfg));
  const rec = saveRound(repo, id, verdict, { reviewer, ...meta, reviewed_sha: git(['rev-parse', 'HEAD'], repo).trim() });
  const next = printRound(rec, cfg, rounds(repo, id));
  process.exitCode = { ship: 0, fix: 10, block: 11 }[next.action];
}

// ---------- close (write the logs, set approved and commit, once the reviewer has approved) ----------

// Replaces the body of a `## <name>` section, or throws a plain error if the ticket has no such section.
function replaceSection(text, name, body, where) {
  const m = text.match(new RegExp(`^## ${name}[ \\t]*$`, 'm'));
  if (!m) throw new SpeckError(`${where} has no "## ${name}" section. Add the heading back, then run this again.`);
  const from = m.index + m[0].length;
  const next = text.slice(from).search(/^## /m);
  const end = next === -1 ? text.length : from + next;
  const rest = text.slice(end);
  return `${text.slice(0, from)}\n${body(text.slice(from, end).trim())}\n${rest ? `\n${rest}` : ''}`;
}

const firstSentence = s => { const t = String(s).replace(/\s+/g, ' ').trim(); return (t.match(/^.*?[.!?](?=\s|$)/) || [t])[0]; };

// One line per round: the verdict, and the blocking findings that appear for the first time in that round.
function reviewLogLines(all) {
  const seen = new Set();
  return all.map(r => {
    const fresh = r.verdict.findings.filter(f => f.severity === 'blocking' && !seen.has(f.id));
    for (const f of r.verdict.findings) seen.add(f.id);
    return `Round ${r.meta.round} (${r.meta.reviewer}): ${r.verdict.verdict.replace(/_/g, ' ')}${fresh.length ? `: ${fresh.map(f => `${f.id ?? '?'} ${firstSentence(f.issue ?? '')}`).join('; ')}` : ''}.`
      .replace(/\.\.$/, '.');
  });
}

// Paths named in `git status --porcelain -z` output, other than the ticket itself. A rename or copy names two paths
// (the new one, then the old one), and both count: the old one may be a change outside the ticket.
export function pathsOutside(porcelain, rel) {
  const parts = porcelain.split('\0').filter(Boolean);
  const paths = [];
  for (let i = 0; i < parts.length; i++) {
    paths.push(parts[i].slice(3));
    if (/[RC]/.test(parts[i].slice(0, 2)) && i + 1 < parts.length) paths.push(parts[++i]);
  }
  return [...new Set(paths.filter(p => p !== rel))];
}

const changesOutside = (repo, rel) => pathsOutside(git(['status', '--porcelain', '-z', '--untracked-files=all'], repo), rel);

// Commits only the ticket file, already written, as `message`. Anything else staged stays staged and uncommitted.
// If the commit fails, the file goes back to `original` and its index entry back exactly as it was (staged
// content kept, or out of the index if it was never added). Returns the failing git result, or { status: 0 }.
function commitTicketOnly(repo, file, original, message) {
  const rel = path.relative(repo, file);
  const entry = git(['ls-files', '-s', '--', rel], repo).trim().split('\t')[0].split(' ');
  const staged = sh('git', ['add', '--', rel], { cwd: repo });
  const commit = staged.status === 0 ? sh('git', ['commit', '-q', '-m', message, '--', rel], { cwd: repo }) : staged;
  if (commit.status !== 0) {
    fs.writeFileSync(file, original);
    if (entry.length === 3) sh('git', ['update-index', '--cacheinfo', `${entry[0]},${entry[1]},${rel}`], { cwd: repo });
    else sh('git', ['reset', '-q', '--', rel], { cwd: repo });
  }
  return commit;
}

function cmdClose(args) {
  const id = args.find(a => !a.startsWith('--'));
  if (!id) throw new SpeckError('Usage: speck close <id>');
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const t = findTicket(repo, id);
  const pad = String(t.fm.id).padStart(4, '0');
  const rel = posix(path.relative(repo, t.file));
  if (['approved', 'done', 'cancelled'].includes(t.fm.status))
    throw new SpeckError(`Ticket ${pad} is already ${t.fm.status}, so there is nothing to close.`);
  const all = rounds(repo, pad);
  const next = nextAction(all, cfg);
  if (next.action !== 'ship')
    throw new SpeckError(`The review loop says "${next.action}", not "ship"${next.reason ? `: ${next.reason}` : ''}. Close the build once the reviewer has approved.`);
  const outside = changesOutside(repo, rel);
  if (outside.length)
    throw new SpeckError(`These files have uncommitted changes outside the ticket: ${outside.join(', ')}. Commit or remove them (the reviewer must see them first), then run this again.`);

  const { tokens, elapsed } = reviewTotals(t, all);
  const diff = changedLines(repo, cfg.base_branch);
  const figures = [
    `- Review rounds: ${all.length}`,
    `- Reviewer: ${who(all[all.length - 1].meta)}`,
    `- Reviewer tokens: ${tokens}`,
    `- ${elapsed}`,
    `- Changed lines: ${diff.total} (limit ${cfg.limits.max_changed_lines})`,
  ].join('\n');
  let text = replaceSection(t.raw, 'Review log', () => reviewLogLines(all).join('\n'), rel);
  // A re-review after merging the base branch closes again, so figures from an earlier close are replaced, not repeated.
  const fresh = old => old.replace(/^- (Review rounds|Reviewer|Reviewer tokens|Elapsed since build started|Elapsed|Changed lines): .*(\n|$)/gm, '').trim();
  text = replaceSection(text, 'Delivery log', old => `${figures}${fresh(old) ? `\n${fresh(old)}` : ''}`, rel);
  const original = t.raw;
  t.raw = text;
  writeField(t, 'status', 'approved');
  // Only the ticket file is committed, so nothing else can ride along with the approval.
  const commit = commitTicketOnly(repo, t.file, original, `speck(${pad}): approved`);
  if (commit.status !== 0)
    throw new SpeckError(`Couldn't commit the ticket, so nothing was changed.\n${(commit.stderr || commit.stdout || '').trim().split('\n').slice(-5).join('\n')}`);
  console.log(`${pad} approved, committed as speck(${pad}): approved. Next: speck ship ${pad} --auto (or /speck-ship ${pad}).`);
}

function cmdNext(args) {
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const next = nextAction(rounds(repo, args[0]), cfg);
  console.log(`${next.action}${next.reason ? `: ${next.reason}` : ''}`);
}

function cmdReviewerSettings(args) {
  // The model and effort to start a reviewer with, for reviewers that speck doesn't start itself.
  // Saved so that `speck record` reports what the running reviewer actually uses, even if the ticket changes later.
  const repo = findRepoRoot();
  const s = settingsMeta(reviewerSettings(findTicket(repo, args[0]).fm, loadConfig(repo)));
  fs.writeFileSync(path.join(cacheDir(repo, args[0]), 'reviewer-settings.json'), JSON.stringify(s, null, 2) + '\n');
  console.log(`model: ${s.reviewer_model}\neffort: ${s.reviewer_effort}`);
}

function cmdPack(args) {
  console.log(reviewPack(findRepoRoot(), args[0]));
}

function cmdPrompt(args) {
  // Prints the round-1 reviewer prompt, for reviewers other than codex (e.g. a Claude subagent).
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const t = findTicket(repo, args[0]);
  const base = git(['merge-base', cfg.base_branch, 'HEAD'], repo).trim();
  const diff = reviewDiff(repo, base);
  const testsArg = args.find(a => a.startsWith('--tests='));
  const tests = testsArg ? fs.readFileSync(testsArg.slice(8), 'utf8') : '(no test output provided)';
  console.log(fullPrompt(repo, t, cfg, diff, tests));
}

function cmdDiff(args) {
  // The changes since the reviewer last looked (or since the base branch, or the whole change after a merge), as a reviewer sees them.
  if (!args[0]) throw new SpeckError('Usage: speck diff <id>');
  const repo = findRepoRoot();
  const { sinceSha } = reviewSince(repo, loadConfig(repo), rounds(repo, args[0]));
  process.stdout.write(reviewDiff(repo, sinceSha));
}

const HELP = `speck: small tickets, independent review, you merge.

  speck init                          set up speck in this repo, or update it (re-run any time)
  speck doctor                        check that git, GitHub, Claude Code and Codex are ready
  speck new <title> [--source=path]   create the next numbered draft ticket
  speck lint <id>                     check a ticket against the size rules
  speck set <id> <field> <value>      update a ticket field (status ready runs lint first)
  speck start <id>                    start building a ready ticket, in its own worktree if worktrees are on
  speck cancel <id> "<reason>"         cancel a ticket, and record why
  speck status [--json]               tickets by status, blocked first (--json: everything, for programs)
  speck panel [--port <n>]           a control panel in your browser, at http://127.0.0.1:4777
  speck run                           start a build for each ready ticket as it becomes ready, until stopped
  speck pause <id>                    hold a build speck run launched where it is, until it's played
  speck play <id>                     carry a paused build on from where it was paused
  speck stop <id>                     end a build speck run launched for good, and block its ticket
  speck diffstat                      changed lines against the size limit
  speck review <id> [--tests=f] [--response=f]   run one codex review round
  speck record <id> <verdict.json> [--reviewer=x] record a round from another reviewer
  speck prompt <id> [--tests=f]       print the reviewer prompt (for subagent reviewers)
  speck reviewer-settings <id>        print and save the model and effort to start a reviewer with
  speck diff <id>                     the changes since the reviewer's last round, as the reviewer sees them
  speck close <id>                    write the review and delivery logs, set approved and commit, once the reviewer approves
  speck next <id>                     what the builder should do next: review, fix, block or ship
  speck pack <id>                     print the review pack
  speck ship <id> [--auto]            merge an approved ticket into the base branch (the user's gate; --auto
                                      ships only if auto_ship in speck/config.yml allows it for this ticket)
`;

const COMMANDS = { init: cmdInit, doctor: cmdDoctor, new: cmdNew, lint: cmdLint, set: cmdSet, start: cmdStart, cancel: cmdCancel, status: cmdStatus, panel: cmdPanel, run: cmdRun, pause: cmdPause, play: cmdPlay, stop: cmdStop, diffstat: cmdDiffstat,
  review: cmdReview, record: cmdRecord, prompt: cmdPrompt, 'reviewer-settings': cmdReviewerSettings, diff: cmdDiff, close: cmdClose, next: cmdNext, pack: cmdPack, ship: cmdShip };

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, ...args] = process.argv.slice(2);
  try {
    if (!cmd || cmd === 'help' || cmd === '--help') console.log(HELP);
    else if (COMMANDS[cmd]) COMMANDS[cmd](args);
    else throw new SpeckError(`Unknown command "${cmd}".\n\n${HELP}`);
  } catch (e) {
    if (e instanceof SpeckError) { if (e.message) console.error(e.message); process.exit(e.code); }
    throw e;
  }
}
