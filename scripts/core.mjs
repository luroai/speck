// speck's shared code: small utilities, config, tickets, their header and lint, and diff size.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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

export function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });
  if (r.error) throw new SpeckError(`${cmd} failed: ${r.error.message}`);
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

export function loadConfig(repo) {
  const cfg = parseYaml(fs.readFileSync(path.join(repo, 'speck', 'config.yml'), 'utf8'));
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
// A ticket's priority: null (none) or its value, which is valid only as a whole number from 1 to 5, or 0 on a fix ticket.
export const ticketPriority = ticket => fieldValue(ticket, 'priority');
const validPriority = (v, type) => v === null || (Number.isInteger(v) && v >= (type === 'fix' ? 0 : 1) && v <= 5);
// Fix tickets first, then lowest priority number first, no priority (or an invalid one) last, then by id.
// Takes { type, priority, id }. (Infinity - Infinity is NaN, which falls through to the id.)
const priorityRank = t => (Number.isInteger(t.priority) && validPriority(t.priority, t.type) ? t.priority : Infinity);
export const byPriority = (a, b) => ((b.type === 'fix') - (a.type === 'fix')) || (priorityRank(a) - priorityRank(b)) || padId(a.id).localeCompare(padId(b.id));

// The reviewer model and effort for a ticket: a ticket value wins, a blank one falls back to config, null means "reviewer's default".
export function reviewerSettings(fm = {}, cfg = {}) {
  const pick = k => !blank(fm[k]) ? String(fm[k]).trim() : !blank(cfg[k]) ? String(cfg[k]).trim() : null;
  return { model: pick('reviewer_model'), effort: pick('reviewer_effort') };
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
  if (ticketType(ticket) !== null && !TYPES.includes(fm.type)) errors.push(`type must be blank, bug or fix (got "${fm.type}").`);
  if (!validPriority(ticketPriority(ticket), fm.type))
    errors.push(fm.priority === 0
      ? 'priority must be blank or a whole number from 1 to 5 (got 0): priority 0 is only for a fix ticket.'
      : `priority must be blank or a whole number from 1 to 5, or 0 on a fix ticket (got ${JSON.stringify(fm.priority)}).`);
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
  wholeCriteria(sections['acceptance criteria']).forEach((c, i) => { if (asksWholeSuite(c)) warnings.push(`Criterion ${i + 1} asks for the whole test suite to pass ("${c}"). That can't be met when the base branch is already broken. Write "no test that passed before this change fails" instead.`); });
  if (!contentLines(sections['out of scope']).filter(l => l !== '-').length) warnings.push('"Out of scope" is empty. Say what this ticket will not do.');
  const body = ['problem', 'outcome', 'acceptance criteria', 'out of scope', 'notes']
    .reduce((n, s) => n + contentLines(sections[s]).length, 0);
  if (body > L.max_ticket_body_lines) errors.push(`Ticket body is ${body} lines (max ${L.max_ticket_body_lines}). It's too big for one agent: split it.`);
  warnings.push(...homePathWarnings(ticket.raw));
  const priv = privateWordProblems(ticket.raw);
  errors.push(...priv.errors);
  warnings.push(...priv.warnings);
  return { errors, warnings, acceptanceCriteria: ac };
}

// Each numbered acceptance criterion with the lines it wraps onto, without its number.
function wholeCriteria(lines) {
  const out = [];
  for (const l of contentLines(lines)) {
    const m = l.match(/^\d+\.\s+(\S.*)$/);
    if (m) out.push(m[1]);
    else if (out.length) out[out.length - 1] += ' ' + l;
  }
  return out;
}

// A criterion asks for the whole suite to pass when it names the full, whole or entire (test) suite, or all tests,
// and says they pass. Quoted text only talks about such wording, so it doesn't count.
const WILL_PASS = String.raw`\s+(?:(?:still|must|should|will|shall|do|does|can|also|now|then|continues?\s+to|keeps?|are|is)\s+)*(?:pass|passes|passed|passing|green)\b`;
const WHOLE_SUITE = new RegExp(String.raw`\b(?:full|whole|entire)\s+(?:test\s+)?suite` + WILL_PASS, 'i');
const ALL_TESTS = new RegExp(String.raw`\ball\s+(?:of\s+)?(?:the\s+)?(?:existing\s+)?tests` + WILL_PASS, 'i');
function asksWholeSuite(criterion) {
  criterion = criterion.replace(/"[^"]*"|“[^”]*”|`[^`]*`/g, '');
  return WHOLE_SUITE.test(criterion) || ALL_TESTS.test(criterion);
}

// Tickets are committed and often published, so warn about each line holding the user's home folder path, which
// usually contains their username. The path must stand on its own: not inside a longer path (/mnt/home/ann) or a
// longer name (/home/ann2). A home folder that can't be found, isn't absolute or is the root checks nothing.
function homePathWarnings(text) {
  let home = '';
  try { home = os.homedir(); } catch { /* no home folder */ }
  home = (home || '').replace(/[\\/]+$/, '');
  if (!home || !path.isAbsolute(home)) return [];
  const esc = home.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const name = '[\\p{L}\\p{N}\\p{M}_-]'; // a character that could continue a folder name, in any script
  const re = new RegExp(`(?<!${name}|\\.)${esc}(?!${name}|\\.${name})`, 'u');
  return text.split('\n').flatMap((l, i) => re.test(l)
    ? [`Line ${i + 1} contains your home folder's path (${home}). Write it as a \`~/\` path instead, so it doesn't publish your username.`]
    : []);
}

// Words the user keeps out of the repo, such as their real name, one per line in ~/.config/speck/private-words
// (blank lines and # lines skipped). Each line of the ticket holding one, in any case and matched literally, is an
// error that names the line but not the word. A missing file checks nothing; one that can't be read is a warning.
function privateWordProblems(text) {
  let home = '';
  try { home = os.homedir(); } catch { /* no home folder */ }
  if (!home) return { errors: [], warnings: [] };
  let list;
  try { list = fs.readFileSync(path.join(home, '.config', 'speck', 'private-words'), 'utf8'); }
  catch (e) {
    if (e.code === 'ENOENT' || e.code === 'ENOTDIR') return { errors: [], warnings: [] };
    return { errors: [], warnings: [`Can't read ~/.config/speck/private-words (${e.code || e.message}), so this ticket wasn't checked for your private words. Make it a readable file, or remove it to skip the check.`] };
  }
  const words = list.split('\n').map(l => l.trim().toLowerCase()).filter(l => l && !l.startsWith('#'));
  if (!words.length) return { errors: [], warnings: [] };
  const errors = text.split('\n').flatMap((l, i) => words.some(w => l.toLowerCase().includes(w))
    ? [`Line ${i + 1} contains one of your private words (from ~/.config/speck/private-words). Take it out before setting the ticket ready.`]
    : []);
  return { errors, warnings: [] };
}

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
  fs.writeFileSync(t.file, syncHeader(text));
}

export const isAncestor = (repo, a, b) => sh('git', ['merge-base', '--is-ancestor', a, b], { cwd: repo }).status === 0;

// Every checkout of this repo, the main one first, with the branch each one has (null when detached).
export function worktreeList(repo) {
  return git(['worktree', 'list', '--porcelain'], repo).split('\n\n').filter(b => b.trim()).map(block => {
    const lines = block.split('\n');
    const at = lines.find(l => l.startsWith('worktree '))?.slice(9);
    const ref = lines.find(l => l.startsWith('branch '))?.slice(7);
    return { path: fs.existsSync(at) ? fs.realpathSync(at) : at, branch: ref ? ref.replace(/^refs\/heads\//, '') : null };
  });
}

// Tickets being built in other worktrees, read from that worktree's copy, which has the real status.
export function ticketsElsewhere(repo, cfg) {
  const here = fs.realpathSync(repo);
  const ticketBranch = new RegExp(`^${cfg.branch_prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d{4})-`);
  return worktreeList(repo).flatMap(w => {
    const m = w.branch && w.branch.match(ticketBranch);
    if (!m || w.path === here || !fs.existsSync(w.path)) return [];
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

// What a build's builder spent, from the last `result` line of its log, as Claude Code's `--output-format stream-json`
// writes it: {tokens, cost_usd}, or null when there's no such line or it reports no usage. Each result line's
// modelUsage and total_cost_usd cover the whole session, a resumed one too, while its usage covers only its own turn,
// so tokens come from modelUsage (input, cache reads, cache writes and output, summed over models) when it's there.
// cost_usd is total_cost_usd, or null without one.
export function builderSpend(text) {
  const lines = String(text ?? '').split('\n');
  let e = null;
  for (let i = lines.length - 1; i >= 0 && !e; i--) {
    if (!lines[i].startsWith('{')) continue;
    try { const o = JSON.parse(lines[i]); if (o && typeof o === 'object' && o.type === 'result') e = o; } catch { /* not an event */ }
  }
  if (!e) return null;
  const n = v => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
  const obj = v => v && typeof v === 'object' && !Array.isArray(v);
  let tokens = null;
  if (obj(e.modelUsage) && Object.values(e.modelUsage).some(obj))
    tokens = Object.values(e.modelUsage).filter(obj).reduce((t, m) => t + n(m.inputTokens) + n(m.cacheReadInputTokens) + n(m.cacheCreationInputTokens) + n(m.outputTokens), 0);
  else if (obj(e.usage))
    tokens = n(e.usage.input_tokens) + n(e.usage.cache_read_input_tokens) + n(e.usage.cache_creation_input_tokens) + n(e.usage.output_tokens);
  if (tokens === null) return null;
  const cost = e.total_cost_usd;
  return { tokens, cost_usd: typeof cost === 'number' && Number.isFinite(cost) && cost >= 0 ? cost : null };
}

// What the builder of a build launched by `speck run` spent, as speck run recorded it in the run record when the build
// ended: {tokens, cost_usd}, each null when it isn't recorded.
export function builderSpent(runs, id) {
  id = String(id ?? '');
  const none = { tokens: null, cost_usd: null };
  if (!/^[\w-]+$/.test(id)) return none;
  let rec;
  try { rec = JSON.parse(fs.readFileSync(path.join(runs, `${id}.json`), 'utf8')); } catch { return none; }
  const b = rec && typeof rec === 'object' ? rec.builder : null;
  if (!b || typeof b !== 'object') return none;
  const num = v => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null);
  return { tokens: num(b.tokens), cost_usd: num(b.cost_usd) };
}
