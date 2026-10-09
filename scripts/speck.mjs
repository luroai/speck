#!/usr/bin/env node
// speck: small tickets, independent review, you merge.
// Deterministic helpers used by the speck skills. No dependencies.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATES = path.join(ROOT, 'templates');
const STATUSES = ['draft', 'ready', 'building', 'reviewing', 'blocked', 'approved', 'done', 'cancelled'];
const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'];
const LOCKFILES = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb|poetry\.lock|uv\.lock|Pipfile\.lock|Cargo\.lock|Gemfile\.lock|go\.sum|composer\.lock)$/;
const TESTFILES = /(^|\/)(test|tests|__tests__|spec)\/|\.(test|spec)\.[a-z]+$|_test\.[a-z]+$|(^|\/)test_[^/]+$/;
const RISKY = /(auth|login|password|session|token|secret|\.env|payment|billing|stripe|migration|migrate|schema\.sql|terraform|\.tf$|dockerfile|docker-compose|\.github\/workflows|infra\/|deploy)/i;

// ---------- small utilities ----------

class SpeckError extends Error {
  constructor(message, code = 1) { super(message); this.code = code; }
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

// True if the ticket's only uncommitted change is to its Review rounds section, so it can't hide unreviewed work.
function onlyRoundsChanged(repo, rel, text) {
  const head = sh('git', ['show', `HEAD:${rel}`], { cwd: repo });
  return head.status === 0 && stripRounds(head.stdout) === stripRounds(text);
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
  if (!v.product_md || typeof v.product_md.accurate !== 'boolean') problems.push('product_md');
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

function saveRound(repo, id, verdict, meta) {
  const t = findTicket(repo, id);
  const round = rounds(repo, id).length + 1;
  const record = { meta: { round, ...meta, saved_at: new Date().toISOString() }, verdict: validateVerdict({ ...verdict, round }) };
  fs.writeFileSync(t.file, appendRounds(t.raw, [record]));
  return record;
}

function reviewerPrompt(repo, ticket, cfg, round, extra) {
  const tpl = fs.readFileSync(path.join(TEMPLATES, 'reviewer-prompt.md'), 'utf8');
  const productFile = path.join(repo, 'speck', 'product.md');
  const product = extra.product ?? (fs.existsSync(productFile) ? fs.readFileSync(productFile, 'utf8') : '(no speck/product.md)');
  if (round === 1) {
    const values = { TICKET: stripRounds(ticket.raw), PRODUCT: product, BASE: cfg.base_branch, DIFF: extra.diff, TESTS: extra.tests };
    return tpl.replace(/\{\{(TICKET|PRODUCT|BASE|DIFF|TESTS)\}\}/g, (_, k) => values[k]);
  }
  return [
    `# Review round ${round}`,
    'The builder has responded to your previous findings. Keep finding ids stable. For each earlier finding, set state to resolved, dispute_accepted or dispute_rejected (or keep it open if the fix is incomplete). Raise new findings only for real problems introduced or missed.',
    '## Builder response', extra.response || '(none provided)',
    `## Changes since your last review (${extra.sinceSha.slice(0, 8)}..HEAD)`, '```diff', extra.diff, '```',
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

// Everything a review round needs, checked before any reviewer runs: the round number, the commit under review,
// the diff since the last round and the builder's inputs.
function reviewSetup(repo, id, opts) {
  const cfg = loadConfig(repo);
  const ticket = findTicket(repo, id);
  const prior = rounds(repo, id);
  const round = prior.length + 1;
  if (round > cfg.limits.max_review_rounds) throw new SpeckError(`Max review rounds (${cfg.limits.max_review_rounds}) reached. Block the ticket.`, 3);
  const rel = posix(path.relative(repo, ticket.file));
  const status = git(['status', '--porcelain'], repo).split('\n').filter(l => l && !(l.slice(3) === rel && onlyRoundsChanged(repo, rel, ticket.raw)));
  if (status.length) throw new SpeckError('Commit your work before review: the reviewer reviews commits, not the working tree.');
  const head = git(['rev-parse', 'HEAD'], repo).trim();
  const base = git(['merge-base', cfg.base_branch, 'HEAD'], repo).trim();
  const sinceSha = round === 1 ? base : prior[prior.length - 1].meta.reviewed_sha;
  const diff = reviewDiff(repo, sinceSha);
  const tests = opts.tests ? fs.readFileSync(opts.tests, 'utf8') : '(no test output provided)';
  const response = opts.response ? fs.readFileSync(opts.response, 'utf8') : '';
  return { cfg, ticket, prior, round, head, base, sinceSha, diff, tests, response };
}

function runCodexReview(repo, id, opts) {
  const { cfg, ticket, prior, round, head, sinceSha, diff, tests, response } = reviewSetup(repo, id, opts);
  const prompt = reviewerPrompt(repo, ticket, cfg, round, { diff, tests, response, sinceSha });

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
function fullPrompt(repo, ticket, cfg, diff, tests, product) {
  return `${reviewerPrompt(repo, ticket, cfg, 1, { diff, tests, product })}\n\nReturn ONLY a JSON object matching this schema:\n${fs.readFileSync(path.join(TEMPLATES, 'review-verdict.schema.json'), 'utf8')}`;
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
const roundOneFile = (repo, id) => path.join(cacheDir(repo, id), 'round-1.prompt.md');
function roundOnePrompt(repo, s, id) {
  const saved = roundOneFile(repo, id);
  if (fs.existsSync(saved)) return fs.readFileSync(saved, 'utf8');
  const sha = s.prior[0].meta.reviewed_sha;
  const at = rel => { const r = sh('git', ['show', `${sha}:${rel}`], { cwd: repo }); return r.status === 0 ? r.stdout : null; };
  const ticket = { raw: at(posix(path.relative(repo, s.ticket.file))) ?? s.ticket.raw };
  return fullPrompt(repo, ticket, s.cfg, reviewDiff(repo, s.base, sha), '(the round-1 test output was not kept)', at('speck/product.md') ?? '(no speck/product.md)');
}

// Later rounds give a reviewer with no memory everything it has seen: the round-1 prompt, every earlier verdict and
// builder response in order, then this round's response, diff and tests.
function historyPrompt(repo, s, id) {
  const parts = [roundOnePrompt(repo, s, id), '# Earlier review rounds'];
  for (const r of s.prior) {
    if (r.meta.builder_response) parts.push(`## Builder response before round ${r.meta.round}`, r.meta.builder_response);
    parts.push(`## Your round ${r.meta.round} verdict`, '```json', JSON.stringify(r.verdict, null, 2), '```');
  }
  parts.push(reviewerPrompt(repo, s.ticket, s.cfg, s.round, { diff: s.diff, tests: s.tests, response: s.response, sinceSha: s.sinceSha }));
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
function runCommandReview(repo, id, name, command, opts) {
  const s = reviewSetup(repo, id, opts);
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
      const tried = runReviewer(repo, resume, { ...values, session: lastThread }, reviewerPrompt(repo, s.ticket, s.cfg, s.round, { diff: s.diff, tests: s.tests, response: s.response, sinceSha: s.sinceSha }));
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
    `- product.md update: ${v.product_md.accurate ? 'checked and accurate' : `⚠️ ${v.product_md.note}`}`,
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

// ---------- commands ----------

function cmdInit(args) {
  const repo = process.cwd();
  const force = args.includes('--force');
  console.log(`speck ${VERSION}: setting up ${repo}\n`);
  const dirs = ['speck/ideas', 'speck/tickets', 'speck/tickets/done'];
  for (const d of dirs) fs.mkdirSync(path.join(repo, d), { recursive: true });
  const copies = [['config.yml', 'speck/config.yml'], ['product.md', 'speck/product.md']];
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
  const pointer = '\n## speck\n\nThis repo uses speck. Read `speck/product.md` first: it describes what the product is today. Work only from a `ready` ticket in `speck/tickets/` (use `/speck-build <id>`). Never approve your own work, and never merge or ship unless the user runs `/speck-ship`, except for the `speck ship <id> --auto` step in `/speck-build`, which ships only when `auto_ship` in `speck/config.yml` allows it.\n';
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
  if (!title) throw new SpeckError('Usage: speck new <title> [--source=path]');
  const source = (args.find(a => a.startsWith('--source=')) || '').slice(9);
  // The source is checked before anything is written, so a mistyped path creates no ticket.
  const sourceFile = source && path.resolve(repo, source);
  if (sourceFile && !fs.statSync(sourceFile, { throwIfNoEntry: false })?.isFile())
    throw new SpeckError(`No idea note at ${source}. Check the path (relative to the repo root), then run this again.`);
  const id = nextId(repo);
  let text = fs.readFileSync(path.join(TEMPLATES, 'ticket.md'), 'utf8');
  text = setField(text, 'id', id);
  text = setField(text, 'title', JSON.stringify(title));
  text = setField(text, 'builder', cfg.builder);
  text = setField(text, 'reviewer', cfg.reviewer);
  const settings = reviewerSettings({}, cfg);
  text = setField(text, 'reviewer_model', settings.model || '');
  text = setField(text, 'reviewer_effort', settings.effort || '');
  text = setField(text, 'source', JSON.stringify(source));
  text = syncHeader(setField(text, 'created', new Date().toISOString().slice(0, 10)));
  const file = path.join(ticketsDir(repo), `${id}-${slugify(title)}.md`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  if (sourceFile) {
    const note = fs.readFileSync(sourceFile, 'utf8');
    if (STATUS_LINE.test(note)) fs.writeFileSync(sourceFile, note.replace(STATUS_LINE, (_, head, value) => head + ticketedStatus(value, id)));
    else console.error(`⚠️ ${source} has no \`Status:\` line, so its status couldn't be updated. Add \`Status: ticketed (${id})\` to it by hand.`);
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
  let text = setField(t.raw, key, /^\d+$/.test(value) && key !== 'id' ? Number(value) : value);
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
  if (mergeAt !== work && git(['status', '--porcelain', '--untracked-files=no'], mergeAt).trim())
    throw new SpeckError(`${base} is checked out at ${mergeAt}, and it has uncommitted changes. Commit or stash them there so the merge can update it, then run this again.`);
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
  } catch (e) { back(); throw e; }
  // Close the ticket on the branch, so the merge is what makes it done.
  const t = findTicket(work, pad);
  writeField(t, 'status', 'done');
  git(['add', '-A', '--', placeTicket(work, t, 'done'), t.file], work);
  git(['commit', '-q', '-m', `speck(${pad}): ship`], work);
  // From the ship commit on, any failure puts back the base branch, the ticket branch and both folders.
  const undo = () => {
    sh('git', ['merge', '--abort'], { cwd: mergeAt });
    git(['reset', '-q', '--hard', baseSha], mergeAt); // undo any catch-up, so the base is exactly as it was
    if (mergeAt === work) { git(['update-ref', `refs/heads/${branch}`, branchSha], work); back(); }
    else git(['reset', '-q', '--hard', branchSha], work); // the branch is checked out there, so undo the ship commit in place
  };
  // Git refuses to overwrite untracked files, listing them one per line, indented.
  const untrackedIn = r => /untracked working tree files would be overwritten/.test(r.stderr)
    ? r.stderr.split('\n').filter(l => /^\s+\S/.test(l)).map(l => l.trim()) : [];
  const overwriteError = (what, files) => new SpeckError(`${what} would overwrite untracked files in ${mergeAt}: ${files.join(', ')}. Nothing was shipped. Move or remove them, then ship again.`);
  if (mergeAt === work) git(['checkout', '-q', base], work);
  if (catchUp) {
    const ff = sh('git', ['merge', '-q', '--ff-only', catchUp], { cwd: mergeAt });
    if (ff.status !== 0) {
      undo();
      const files = untrackedIn(ff);
      throw files.length ? overwriteError(`Bringing ${base} up to date with ${remote}`, files)
        : new SpeckError(`Couldn't bring ${base} up to date with ${remote}, so nothing was shipped: ${ff.stderr.trim().split('\n').pop()}`);
    }
  }
  const merge = sh('git', ['merge', '--no-ff', '-m', `speck(${pad}): ${t.fm.title}`, branch], { cwd: mergeAt });
  if (merge.status !== 0) {
    undo();
    const files = untrackedIn(merge);
    throw files.length ? overwriteError(`Merging ${branch} into ${base}`, files)
      : new SpeckError(`Merging ${branch} into ${base} hit a conflict, so nothing was shipped and ${base} is unchanged. Rebuild the ticket on the latest ${base}, then ship again.`);
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

// What `speck status --json` prints: everything status knows, for programs such as the control panel.
// The field names are a contract (0030); don't rename them.
export function statusData(repo) {
  const cfg = loadConfig(repo);
  const tickets = statusTickets(repo, cfg);
  const done = new Set(tickets.filter(t => t.fm.status === 'done').map(t => padId(t.fm.id)));
  const entries = tickets.map(t => {
    const lint = lintTicket(t, cfg);
    const question = contentLines(t.sections['blocked question']).join('\n');
    const after = Array.isArray(t.fm.after) ? t.fm.after : [];
    const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null);
    return {
      ...t.fm,
      path: posix(path.relative(t.at || repo, t.file)),
      worktree: t.at || null,
      acceptance_criteria: criteriaText(t.sections['acceptance criteria']),
      blocked_question: question || null,
      lint: { errors: lint.errors.length, warnings: lint.warnings.length },
      rounds: ticketRounds(t.raw).rounds.map(r => ({
        round: r?.meta?.round ?? null,
        reviewer: r?.meta?.reviewer ?? null,
        verdict: r?.verdict?.verdict ?? null,
        seconds: num(r?.meta?.seconds),
        tokens: (num(r?.meta?.usage?.input_tokens) || 0) + (num(r?.meta?.usage?.output_tokens) || 0),
      })),
      waiting_on: after.filter(id => !done.has(padId(id))),
    };
  });
  // Lowest priority number first, no priority last, then by id. (Infinity - Infinity is NaN, which falls through to the id.)
  const rank = e => (typeof e.priority === 'number' && Number.isFinite(e.priority) ? e.priority : Infinity);
  entries.sort((a, b) => (rank(a) - rank(b)) || padId(a.id).localeCompare(padId(b.id)));
  const dir = path.join(repo, 'speck', 'ideas');
  const ideas = (fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort() : []).map(f => {
    const text = fs.readFileSync(path.join(dir, f), 'utf8');
    return { path: `speck/ideas/${f}`, title: (text.match(/^# (.+)$/m) || [])[1]?.trim() || f, status: ideaStatus(text) || null };
  });
  return { tickets: entries, ideas };
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
      console.log(`  ${t.fm.id}  P${t.fm.priority ?? '-'}  ${t.fm.size}/${t.fm.risk}  ${t.fm.title}`);
      if (t.at) console.log(`        ↳ being built in ${t.at}`);
      if (s === 'blocked') {
        const q = contentLines(t.sections['blocked question']).join(' ');
        if (q) console.log(`        ? ${q}`);
      }
      if (s === 'cancelled' && !blank(t.fm.cancel_reason)) console.log(`        ❌ ${t.fm.cancel_reason}`);
    }
  }
  const ideas = path.join(repo, 'speck', 'ideas');
  const notes = fs.existsSync(ideas) ? fs.readdirSync(ideas).filter(f => f.endsWith('.md')) : [];
  const ticketed = notes.filter(f => ideaStatus(fs.readFileSync(path.join(ideas, f), 'utf8')).startsWith('ticketed')).length;
  console.log(`\nIDEAS (${notes.length}: ${notes.length - ticketed} waiting, ${ticketed} ticketed) in speck/ideas/`);
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
  if (typeof command === 'string' && command.trim()) rec = runCommandReview(repo, id, reviewer, command, opts);
  else if (reviewer === 'codex') rec = runCodexReview(repo, id, opts);
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
  text = replaceSection(text, 'Delivery log', old => `${figures}${old ? `\n${old}` : ''}`, rel);
  const original = t.raw;
  t.raw = text;
  writeField(t, 'status', 'approved');
  // The ticket's own staged state, so a failed commit puts it back exactly as it was.
  const entry = git(['ls-files', '-s', '--', rel], repo).trim().split('\t')[0].split(' ');
  // Only the ticket file is committed, so nothing else can ride along with the approval.
  const staged = sh('git', ['add', '--', rel], { cwd: repo });
  const commit = staged.status === 0 ? sh('git', ['commit', '-q', '-m', `speck(${pad}): approved`, '--', rel], { cwd: repo }) : staged;
  if (commit.status !== 0) {
    fs.writeFileSync(t.file, original);
    if (entry.length === 3) sh('git', ['update-index', '--cacheinfo', `${entry[0]},${entry[1]},${rel}`], { cwd: repo });
    else sh('git', ['reset', '-q', '--', rel], { cwd: repo });
    throw new SpeckError(`Couldn't commit the ticket, so nothing was changed.\n${(commit.stderr || commit.stdout || '').trim().split('\n').slice(-5).join('\n')}`);
  }
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
  // The changes since the reviewer last looked (or since the base branch), as a reviewer sees them.
  if (!args[0]) throw new SpeckError('Usage: speck diff <id>');
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const all = rounds(repo, args[0]);
  const since = all.length ? all[all.length - 1].meta.reviewed_sha : git(['merge-base', cfg.base_branch, 'HEAD'], repo).trim();
  process.stdout.write(reviewDiff(repo, since));
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

const COMMANDS = { init: cmdInit, doctor: cmdDoctor, new: cmdNew, lint: cmdLint, set: cmdSet, start: cmdStart, cancel: cmdCancel, status: cmdStatus, diffstat: cmdDiffstat,
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
