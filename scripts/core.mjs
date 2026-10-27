// speck's shared code: small utilities, config, tickets and their header, and diff size. Lint is in lint.mjs.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { applyMachineConfig } from './machine.mjs';
export { lintTicket } from './lint.mjs';
export { builderSpend, builderSpent, earlierBuilds, reviewerCost } from './spend.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const TEMPLATES = path.join(ROOT, 'templates');
export const STATUSES = ['draft', 'ready', 'building', 'reviewing', 'blocked', 'approved', 'done', 'cancelled'];
export const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'];
export const LOCKFILES = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb|poetry\.lock|uv\.lock|Pipfile\.lock|Cargo\.lock|Gemfile\.lock|go\.sum|composer\.lock)$/;
const TESTFILES = /(^|\/)(test|tests|__tests__|spec)\/|\.(test|spec)\.[a-z]+$|_test\.[a-z]+$|(^|\/)test_[^/]+$/;
export const RISKY = /(auth|login|password|session|token|secret|\.env|payment|billing|stripe|migration|migrate|schema\.sql|terraform|\.tf$|dockerfile|docker-compose|\.github\/workflows|infra\/|deploy)/i;

// ---------- small utilities ----------

export class SpeckError extends Error {
  constructor(message, code = 1) { super(message); this.code = code; this.name = 'SpeckError'; }
}

// True while runInProcess (speck.mjs) runs a command in this process (0231): output a child would write straight to
// this process's stdout and stderr is collected and written through process.stdout and process.stderr instead, so it's
// returned with the command's own.
let collecting = false;
export const collectChildOutput = on => { collecting = on; };

export function sh(cmd, args, opts = {}) {
  const collect = collecting && opts.stdio === 'inherit';
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts, ...(collect ? { stdio: 'pipe' } : {}) });
  if (r.error) throw new SpeckError(`${cmd} failed: ${r.error.message}`);
  if (collect) { if (r.stdout) process.stdout.write(r.stdout); if (r.stderr) process.stderr.write(r.stderr); }
  return r;
}

export function git(args, cwd) {
  const r = sh('git', args, { cwd });
  if (r.status !== 0) throw new SpeckError(`git ${args.join(' ')}: ${r.stderr.trim()}`);
  return r.stdout;
}

export function findRepoRoot(start = process.cwd()) {
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

export function stripComment(line) {
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

// A value as it's written in speck/config.yml, so that it reads back exactly.
export function yamlValue(value) {
  if (typeof value !== 'string') return Array.isArray(value) ? `[${value.join(', ')}]` : String(value);
  const readsBack = v => parseYaml(`k: ${v}   # comment`).k === value;
  if (/^[A-Za-z0-9_./@~-][^#'"]*$/.test(value) && !/:\s|\s$/.test(value) && readsBack(value)) return value;
  if (!value.includes("'") && !/[\n\r]/.test(value) && readsBack(`'${value}'`)) return `'${value}'`;
  return JSON.stringify(value);
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

// 0487: the settings once named after the Foreman, by their old names. A config that sets only an old name is read as
// if it set the new one, and where both are set the new name wins.
export const RENAMED = Object.freeze({ foreman_fixing: 'watch', foreman: 'watch_agent', foreman_model: 'watch_model', foreman_effort: 'watch_effort' });
export const settingName = key => (Object.hasOwn(RENAMED, key) ? RENAMED[key] : key);
export function renameOld(cfg) {
  if (cfg === null || typeof cfg !== 'object') return cfg;
  for (const [old, name] of Object.entries(RENAMED)) if (Object.hasOwn(cfg, old)) {
    if (!Object.hasOwn(cfg, name)) cfg[name] = cfg[old];
    delete cfg[old];
  }
  return cfg;
}
// The setting `name` in a config object, or its old name's value when only that is set.
export function setting(cfg, name) {
  if (cfg === null || typeof cfg !== 'object') return undefined;
  if (Object.hasOwn(cfg, name)) return cfg[name];
  const old = Object.keys(RENAMED).find(o => RENAMED[o] === name);
  return old !== undefined && Object.hasOwn(cfg, old) ? cfg[old] : undefined;
}
// A config file's text as speck reads its settings: parseYaml, with old names read as new ones.
export const parseConfig = text => renameOld(parseYaml(text));

// speck/config.yml with speck's defaults, and with this machine's values over the file's unless `machine` is false.
export function loadConfig(repo, { machine = true } = {}) {
  const cfg = parseConfig(fs.readFileSync(path.join(repo, 'speck', 'config.yml'), 'utf8'));
  if (machine) applyMachineConfig(repo, cfg);
  const limits = {
    max_acceptance_criteria: 5, max_changed_lines: 300, max_review_rounds: 3, max_merge_rounds: 2,
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

export function contentLines(lines = []) {
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

export const blank = v => v === undefined || v === null || String(v).trim() === '';
// A frontmatter field's value: null when it's missing or blank, otherwise its value.
// A bare `key:` parses as an empty mapping, just like `key: {}`, so the frontmatter line itself says which it was.
function fieldValue(ticket, key) {
  const v = ticket.fm[key];
  if (v === undefined || v === null || (typeof v === 'string' && !v.trim())) return null;
  const line = ticket.raw.slice(0, fmEnd(ticket.raw)).match(new RegExp(`^${key}:(.*)$`, 'm'));
  const empty = v && typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length;
  return empty && line && stripComment(line[1]).trim() === '' ? null : v;
}
// A ticket's type: null or its value ("bug" or "fix", a fix for a broken base branch, are the only valid ones).
export const TYPES = ['bug', 'fix'];
export const ticketType = ticket => fieldValue(ticket, 'type');
// 0492: a ticket's kind: what its build does, change the project's code or do a task that leaves its result in
// outputs/. Missing or blank means "code". A ticket with no kind line reads its old `task:` line (0350), `code` as
// code and `document` as a task, and any other value as it is, for lint to refuse. Where it has both, kind wins.
export const KINDS = ['code', 'task'];
export const OLD_TASKS = ['code', 'document'];
// True when the ticket has no kind of its own, so its old task line (or nothing) decides.
export const kindFromTask = ticket => fieldValue(ticket, 'kind') === null;
export function ticketKind(ticket) {
  const kind = fieldValue(ticket, 'kind');
  if (kind !== null) return kind;
  const task = fieldValue(ticket, 'task');
  return task === null || task === 'code' ? 'code' : task === 'document' ? 'task' : task;
}
// 0351: a task ticket's folder, relative to outputs/ at the project root. null when it's missing or blank.
export const ticketOutput = ticket => fieldValue(ticket, 'output');
// A ticket's priority: null (none) or its value, which is valid only as a whole number from 1 to 5, or 0 on a fix ticket.
export const ticketPriority = ticket => fieldValue(ticket, 'priority');
export const validPriority = (v, type) => v === null || (Number.isInteger(v) && v >= (type === 'fix' ? 0 : 1) && v <= 5);
// Fix tickets first, then lowest priority number first, no priority (or an invalid one) last, then by id.
// Takes { type, priority, id }. (Infinity - Infinity is NaN, which falls through to the id.)
const priorityRank = t => (Number.isInteger(t.priority) && validPriority(t.priority, t.type) ? t.priority : Infinity);
export const byPriority = (a, b) => ((b.type === 'fix') - (a.type === 'fix')) || (priorityRank(a) - priorityRank(b)) || padId(a.id).localeCompare(padId(b.id));

// The reviewer model and effort for a ticket: a ticket value wins, a blank one falls back to config, null means "reviewer's default".
export function reviewerSettings(fm = {}, cfg = {}) {
  const pick = k => !blank(fm[k]) ? String(fm[k]).trim() : !blank(cfg[k]) ? String(cfg[k]).trim() : null;
  return { model: pick('reviewer_model'), effort: pick('reviewer_effort') };
}

// 0388: the agents a ticket is built and reviewed with: each field it names, or else what the settings give now.
export function ticketAgents(fm = {}, cfg = {}) {
  const pick = (k, dflt) => !blank(fm[k]) ? String(fm[k]).trim() : !blank(cfg[k]) ? String(cfg[k]).trim() : dflt;
  const s = reviewerSettings(fm, cfg);
  return { builder: pick('builder', 'claude'), reviewer: pick('reviewer', 'codex'), reviewer_model: s.model, reviewer_effort: s.effort };
}

export function settingsMeta(s) { return { reviewer_model: s.model || 'default', reviewer_effort: s.effort || 'default' }; }

// ---------- the readable header under the frontmatter ----------

const STATUS_EMOJI = { draft: '📝', ready: '📋', building: '🔨', reviewing: '🔍', blocked: '⛔', approved: '👍', done: '✅', cancelled: '❌' };

// The heading and status line that open every ticket, rendered from the frontmatter (the source of truth).
export function ticketHeader(fm) {
  return `# ${fm.id} · ${fm.title}\n\n**Status:** ${[STATUS_EMOJI[fm.status], fm.status].filter(Boolean).join(' ')}`;
}

// Splits a ticket body into the header speck wrote (heading and status line, if present) and everything after it.
// Works line by line and only ever skips empty lines inside the header, so the rest of the body is kept byte for byte.
export function splitHeader(body) {
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

export function fmEnd(text) { return text.indexOf('\n---', 4) + 5; }

// Rewrites the header to match the frontmatter, adding it if it's missing. Nothing else changes.
export function syncHeader(text) {
  const end = fmEnd(text);
  const { rest } = splitHeader(text.slice(end));
  // One empty line separates the header from the body; the body's own empty lines and indentation are kept as they are.
  const sep = rest === '' || rest.startsWith('\n') ? '' : '\n';
  return `${text.slice(0, end)}${ticketHeader(parseTicket(text).fm)}\n${sep}${rest}`;
}

export function ticketsDir(repo) { return path.join(repo, 'speck', 'tickets'); }
// Finished tickets sit in a done/ folder, so speck/tickets/ holds only work in progress.
function doneTicketsDir(repo) { return path.join(ticketsDir(repo), 'done'); }
export function ticketDirs(repo) { return [ticketsDir(repo), doneTicketsDir(repo)]; }
export function ideasDir(repo) { return path.join(repo, 'speck', 'ideas'); }
// Idea notes are filed here once ticketed, as done tickets are in speck/tickets/done/.
export function doneIdeasDir(repo) { return path.join(ideasDir(repo), 'done'); }
export const repoPath = (repo, file) => path.relative(repo, file).split(path.sep).join('/');

export function listTickets(repo) {
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

export function findTicket(repo, id) {
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
export function placeTicket(repo, t, status) {
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

export function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'ticket';
}

// A claude-subagent reviewer is Claude, so it counts as the same model as a claude builder, as a claude reviewer (0292) does.
export const modelFamily = agent => agent === 'claude-subagent' ? 'claude' : agent;

// ---------- diff size ----------

const numstat = out => out.trim().split('\n').filter(Boolean).map(r => {
  const [a, d, f] = r.split('\t');
  return { file: f, lines: (parseInt(a, 10) || 0) + (parseInt(d, 10) || 0) };
});

function countRows(rows) {
  const counted = rows.filter(r => !LOCKFILES.test(r.file) && !TESTFILES.test(r.file) && !r.file.startsWith('speck/'));
  return { total: counted.reduce((n, r) => n + r.lines, 0), files: rows, counted };
}

// The checkout's changes, uncommitted ones included, since `from`: by default where HEAD and the base branch meet.
export function changedLines(repo, base, from = null) {
  const mb = from || git(['merge-base', base, 'HEAD'], repo).trim();
  const rows = numstat(git(['diff', '--numstat', mb], repo));
  for (const f of git(['ls-files', '--others', '--exclude-standard'], repo).split('\n').filter(Boolean)) {
    try { rows.push({ file: f, lines: fs.readFileSync(path.join(repo, f), 'utf8').split('\n').length }); } catch { /* binary or unreadable */ }
  }
  return countRows(rows);
}

// The local branches for a ticket: <branch_prefix><id>-…
export function ticketBranches(repo, cfg, id) {
  const pad = padId(id);
  return git(['for-each-ref', '--format=%(refname:short)', `refs/heads/${cfg.branch_prefix}${pad}-*`], repo).split('\n').filter(Boolean);
}

// Where a branch left the base branch. Once the branch is merged in, it left from the base branch as it was just
// before that merge: its newest first-parent commit without the branch.
export function forkPoint(repo, base, branch) {
  const merged = new Set(git(['rev-list', '--ancestry-path', `${branch}..${base}`], repo).split('\n').filter(Boolean));
  const before = git(['rev-list', '--first-parent', base], repo).split('\n').find(c => c && !merged.has(c)) || base;
  return git(['merge-base', before, branch], repo).trim();
}

// A branch's committed changes since it left the base branch, from any checkout.
export function branchChangedLines(repo, base, branch) {
  return countRows(numstat(git(['diff', '--numstat', forkPoint(repo, base, branch), branch], repo)));
}

// ---------- reviews ----------

// Every review round lives in its ticket, in a `## Review rounds` section at the end that only speck writes.
// Each round is a collapsed <details> block with a one-line summary and the full record as JSON.
export const ROUNDS_HEADING = '## Review rounds';

// Splits a ticket into the text before the Review rounds section, the section, and anything after it.
export function splitRounds(text) {
  const m = text.match(/^## Review rounds[ \t]*$/m);
  if (!m) return { before: text, section: '', after: '' };
  const from = m.index + m[0].length;
  const next = text.slice(from).search(/^## /m);
  const end = next === -1 ? text.length : from + next;
  return { before: text.slice(0, m.index), section: text.slice(m.index, end), after: text.slice(end) };
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

// ---------- shared by the commands ----------

export const posix = p => p.split(path.sep).join('/');

// An idea note's status line, as /speck-capture writes it: `Captured: <date> · Status: <value>`.
export const STATUS_LINE = /^((?:.*·[ \t]*)?Status:[ \t]*)(.*)$/m;
export const ideaStatus = text => (text.match(STATUS_LINE) || [])[2]?.trim() ?? '';

export function writeField(t, key, value) {
  // A value holding a quote, or padded with spaces, is written as a JSON string so it reads back exactly as given:
  // left bare, a lone ' would hide the line's trailing comment from stripComment. after is the one list field, so
  // after ["0070"] stays a list, and any other bracketed value is text.
  const quoted = typeof value === 'string' && key !== 'after' && (/['"[]/.test(value) || value !== value.trim());
  let text = setField(t.raw, key, quoted ? JSON.stringify(value) : /^\d+$/.test(value) && key !== 'id' ? Number(value) : value);
  if (key === 'status' && value === 'building' && !t.fm.started) text = setField(text, 'started', new Date().toISOString());
  // A build is timed to its latest approval, so time waiting for the user to ship it isn't counted (0139).
  if (key === 'status' && value === 'approved') text = setField(text, 'approved', new Date().toISOString());
  if (key === 'status' && value === 'done') text = setField(text, 'finished', new Date().toISOString());
  if (key === 'status') text = waitFields(text, t.fm.status, value);
  fs.writeFileSync(t.file, syncHeader(text));
}

// Time a ticket spends blocked is waiting for the user, not building, so it's left out of its build time (0166):
// blocked_at marks when it blocked, and leaving blocked adds that stretch to waited_seconds. A status change makes
// both, whatever resumed the ticket.
export function waitFields(text, from, to, now = Date.now()) {
  if (to === 'blocked' && from !== 'blocked') return setField(text, 'blocked_at', new Date(now).toISOString());
  if (from !== 'blocked' || to === 'blocked') return text;
  const fm = parseTicket(text).fm, since = Date.parse(fm.blocked_at);
  if (fm.blocked_at === undefined) return text;
  return setField(Number.isFinite(since) ? addWaited(text, (now - since) / 1000) : text, 'blocked_at', '');
}

// Adds `seconds` of waiting to a ticket's waited_seconds, as a whole number. An unreadable total counts as none.
export function addWaited(text, seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return text;
  const old = Number(parseTicket(text).fm.waited_seconds);
  return setField(text, 'waited_seconds', Math.round((Number.isFinite(old) && old > 0 ? old : 0) + seconds));
}

// When a paused build's pause began, in ms, from its <id>.paused mark, or null when that's unreadable.
export function pausedSince(mark) {
  try { const at = Date.parse(JSON.parse(fs.readFileSync(mark, 'utf8')).paused); return Number.isFinite(at) ? at : null; } catch { return null; }
}

// A pause is waiting for the user too, so the time since `since` is added to the ticket's text. Only a ticket the build
// has in hand counts it: a blocked one is already counting its waiting, and an approved one's build time has ended.
export const addPaused = (t, since, now = Date.now()) =>
  (since !== null && (t.fm.status === 'building' || t.fm.status === 'reviewing') ? addWaited(t.raw, (now - since) / 1000) : t.raw);

export const isAncestor = (repo, a, b) => sh('git', ['merge-base', '--is-ancestor', a, b], { cwd: repo }).status === 0;

// Every checkout of this repo, the main one first, with the branch each one has (null when detached) and its commit.
export function worktreeList(repo) {
  return git(['worktree', 'list', '--porcelain'], repo).split('\n\n').filter(b => b.trim()).map(block => {
    const lines = block.split('\n');
    const at = lines.find(l => l.startsWith('worktree '))?.slice(9);
    const ref = lines.find(l => l.startsWith('branch '))?.slice(7);
    const head = lines.find(l => l.startsWith('HEAD '))?.slice(5) || null;
    return { path: fs.existsSync(at) ? fs.realpathSync(at) : at, branch: ref ? ref.replace(/^refs\/heads\//, '') : null, head };
  });
}

// Where a ticket's worktree goes: beside the main checkout, never inside it, and at the same path each time.
export function worktreePath(main, branch) {
  return path.join(path.dirname(main), `${path.basename(main)}.worktrees`, ...branch.split('/'));
}

// 0196: while speck ship tests a ticket merged with the base branch, its worktree has that merge checked out detached
// (0192). A detached worktree whose commit is a merge of a ticket branch's tip is taken as that branch's, so the ticket
// shows as it is there, approved, rather than as the base branch's copy has it.
function shipTestBranch(repo, w, isTicket, tips) {
  if (w.branch || !w.head) return null;
  const merged = sh('git', ['rev-parse', '--verify', '-q', `${w.head}^2`], { cwd: repo });
  if (merged.status !== 0) return null;
  tips.list ??= git(['for-each-ref', '--format=%(objectname) %(refname:short)', 'refs/heads/'], repo).split('\n')
    .map(l => l.split(' ')).filter(([, name]) => name && isTicket(name));
  return tips.list.find(([sha]) => sha === merged.stdout.trim())?.[1] ?? null;
}

// Tickets being built in other worktrees, read from that worktree's copy, which has the real status. With `only`, just that ticket's.
export function ticketsElsewhere(repo, cfg, only = null) {
  const here = fs.realpathSync(repo);
  const ticketBranch = new RegExp(`^${cfg.branch_prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d{4})-`);
  const tips = {}; // the ticket branches' tips, read once if a worktree is detached
  return worktreeList(repo).flatMap(w => {
    const branch = w.branch ?? shipTestBranch(repo, w, name => ticketBranch.test(name), tips);
    const m = branch && branch.match(ticketBranch);
    if (!m || (only !== null && m[1] !== padId(only)) || w.path === here || !fs.existsSync(w.path)) return [];
    try { return [{ ...findTicket(w.path, m[1]), at: w.path }]; } catch { return []; }
  });
}

// A ticket being built in another worktree is changed there, not here: a change on both sides of its file would make
// the ship's merge conflict. Its own worktree isn't "another", so a build can still set its own status.
const BEING_BUILT = ['building', 'reviewing', 'blocked', 'approved'];
export function checkNotBeingBuilt(repo, cfg, t, verb = 'change') {
  let elsewhere = [];
  try { elsewhere = ticketsElsewhere(repo, cfg); } catch { /* not a git checkout: no other worktrees */ }
  const there = elsewhere.find(x => padId(x.fm.id) === padId(t.fm.id) && BEING_BUILT.includes(x.fm.status));
  if (there)
    throw new SpeckError(`Ticket ${t.fm.id} is being built (${there.fm.status}) in\n${there.at}\nso changing it here would make its ship conflict. Wait until it ships, or ${verb} it there.`);
}

export const padId = id => String(id ?? '').padStart(4, '0');
