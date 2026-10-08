#!/usr/bin/env node
// speck: small tickets, independent review, you merge.
// Deterministic helpers used by the speck skills. No dependencies.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATES = path.join(ROOT, 'templates');
const STATUSES = ['draft', 'ready', 'building', 'reviewing', 'blocked', 'approved', 'done'];
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
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
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
    allow_same_model_review: false, commands: {}, github: { status_check: 'speck/review' }, ...cfg, limits };
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
  const re = new RegExp(`^(${key}:\\s*)([^#\\n]*?)(\\s+#.*)?$`, 'm');
  if (re.test(head)) return head.replace(re, (_, k, _old, comment = '') => `${k}${v}${comment}`) + rest;
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

function ticketsDir(repo) { return path.join(repo, 'speck', 'tickets'); }

function listTickets(repo) {
  const dir = ticketsDir(repo);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => /^\d{4}-.*\.md$/.test(f)).sort().map(f => {
    const file = path.join(dir, f);
    return { file, ...parseTicket(fs.readFileSync(file, 'utf8')) };
  });
}

function findTicket(repo, id) {
  const pad = String(id).padStart(4, '0');
  const t = listTickets(repo).find(t => path.basename(t.file).startsWith(`${pad}-`));
  if (!t) throw new SpeckError(`Ticket ${pad} not found in speck/tickets/.`);
  return t;
}

export function nextId(repo) {
  const ids = listTickets(repo).map(t => parseInt(path.basename(t.file).slice(0, 4), 10));
  return String((ids.length ? Math.max(...ids) : 0) + 1).padStart(4, '0');
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'ticket';
}

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
  if (fm.builder && fm.builder === fm.reviewer && !cfg.allow_same_model_review)
    errors.push(`builder and reviewer are both "${fm.builder}". Use a different reviewer or set allow_same_model_review: true.`);
  for (const [where, v] of [['ticket', fm.reviewer_effort], ['config', cfg.reviewer_effort]])
    if (!blank(v) && !EFFORTS.includes(String(v).trim())) errors.push(`reviewer_effort "${v}" in ${where} must be blank or one of ${EFFORTS.join(', ')}.`);
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

function reviewDir(repo, id) { return path.join(repo, 'speck', 'reviews', String(id).padStart(4, '0')); }

function rounds(repo, id) {
  const dir = reviewDir(repo, id);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => /^round-\d+\.json$/.test(f))
    .sort((a, b) => parseInt(a.slice(6), 10) - parseInt(b.slice(6), 10))
    .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
}

export function validateVerdict(v) {
  const problems = [];
  if (!['approve', 'changes_requested', 'escalate'].includes(v.verdict)) problems.push('verdict');
  if (!Array.isArray(v.criteria)) problems.push('criteria');
  if (!Array.isArray(v.findings)) problems.push('findings');
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
  const dir = reviewDir(repo, id);
  fs.mkdirSync(dir, { recursive: true });
  const round = rounds(repo, id).length + 1;
  const record = { meta: { round, ...meta, saved_at: new Date().toISOString() }, verdict: validateVerdict({ ...verdict, round }) };
  fs.writeFileSync(path.join(dir, `round-${round}.json`), JSON.stringify(record, null, 2) + '\n');
  return record;
}

function reviewerPrompt(repo, ticket, cfg, round, extra) {
  const tpl = fs.readFileSync(path.join(TEMPLATES, 'reviewer-prompt.md'), 'utf8');
  const productFile = path.join(repo, 'speck', 'product.md');
  const product = fs.existsSync(productFile) ? fs.readFileSync(productFile, 'utf8') : '(no speck/product.md)';
  if (round === 1) {
    const values = { TICKET: ticket.raw, PRODUCT: product, BASE: cfg.base_branch, DIFF: extra.diff, TESTS: extra.tests };
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

function runCodexReview(repo, id, opts) {
  const cfg = loadConfig(repo);
  const ticket = findTicket(repo, id);
  const prior = rounds(repo, id);
  const round = prior.length + 1;
  if (round > cfg.limits.max_review_rounds) throw new SpeckError(`Max review rounds (${cfg.limits.max_review_rounds}) reached. Block the ticket.`, 3);
  const status = git(['status', '--porcelain'], repo).split('\n').filter(l => l && !l.slice(3).startsWith('speck/reviews/'));
  if (status.length) throw new SpeckError('Commit your work before review: the reviewer reviews commits, not the working tree.');
  const head = git(['rev-parse', 'HEAD'], repo).trim();
  const base = git(['merge-base', cfg.base_branch, 'HEAD'], repo).trim();
  const sinceSha = round === 1 ? base : prior[prior.length - 1].meta.reviewed_sha;
  const diff = git(['diff', `${sinceSha}..HEAD`, '--', '.', ':(exclude)speck/reviews'], repo);
  const tests = opts.tests ? fs.readFileSync(opts.tests, 'utf8') : '(no test output provided)';
  const response = opts.response ? fs.readFileSync(opts.response, 'utf8') : '';
  const prompt = reviewerPrompt(repo, ticket, cfg, round, { diff, tests, response, sinceSha });

  const dir = reviewDir(repo, id);
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `.round-${round}.out.json`);
  const schema = path.join(TEMPLATES, 'review-verdict.schema.json');
  const threadFile = path.join(dir, 'codex-thread');
  const sandbox = cfg.reviewer_options?.codex?.sandbox || 'read-only';
  const settings = reviewerSettings(ticket.fm, cfg);
  const common = ['--json', '--output-schema', schema, '-o', out, '-c', `sandbox_mode="${sandbox}"`,
    ...(settings.model ? ['-m', settings.model] : []), ...(settings.effort ? ['-c', `model_reasoning_effort="${settings.effort}"`] : [])];
  const args = round === 1 || !fs.existsSync(threadFile)
    ? ['exec', '--sandbox', sandbox, ...common, '-']
    : ['exec', 'resume', ...common, fs.readFileSync(threadFile, 'utf8').trim(), '-'];
  const started = Date.now();
  const r = sh('codex', args, { cwd: repo, input: prompt });
  if (r.status !== 0) throw new SpeckError(`codex exited ${r.status}: ${r.stderr.trim().split('\n').slice(-5).join('\n')}`);
  const events = r.stdout.split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return {}; } });
  const thread = events.find(e => e.type === 'thread.started')?.thread_id;
  if (thread) fs.writeFileSync(threadFile, thread + '\n');
  const usage = events.filter(e => e.type === 'turn.completed').map(e => e.usage).pop() || {};
  const verdict = JSON.parse(fs.readFileSync(out, 'utf8'));
  fs.rmSync(out);
  return saveRound(repo, id, verdict, { reviewer: 'codex', ...settingsMeta(settings), reviewed_sha: head, thread_id: thread, seconds: Math.round((Date.now() - started) / 1000), usage });
}

// ---------- review pack ----------

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
  const tokens = all.reduce((n, r) => n + (r.meta.usage?.input_tokens || 0) + (r.meta.usage?.output_tokens || 0), 0);
  const started = t.fm.started ? new Date(t.fm.started) : null;
  const who = m => `${m.reviewer}, model ${m.reviewer_model || 'default'}, effort ${m.reviewer_effort || 'default'}`;
  const lines = [
    `## ${t.fm.id} · ${t.fm.title}`,
    `**Verdict:** ${v.verdict === 'approve' ? '✅ Approved by reviewer' : `⛔ ${v.verdict}`} (${who(last.meta)}, round ${last.meta.round} of ${cfg.limits.max_review_rounds})`,
    '', `**Summary:** ${v.summary}`, '',
    '### Acceptance criteria', '| # | Criterion | Result | Evidence |', '|---|---|---|---|',
    ...v.criteria.map(c => `| ${c.id} | ${(ac[c.id - 1] || '').replace(/^\d+\.\s+/, '').replace(/\|/g, '\\|')} | ${icon[c.status] || c.status} | ${c.evidence.replace(/\n/g, ' ').replace(/\|/g, '\\|')} |`),
    '', '### Risk', `- Ticket risk: **${t.fm.risk}**`,
    risky.length ? `- Sensitive files touched: ${risky.map(f => `\`${f}\``).join(', ')}` : '- No sensitive file patterns touched',
    `- Changed lines (excluding tests and lockfiles): ${diff.total} (limit ${cfg.limits.max_changed_lines})`,
    `- product.md update: ${v.product_md.accurate ? 'checked and accurate' : `⚠️ ${v.product_md.note}`}`,
    '', '### Review history',
    ...all.map(r => {
      const f = r.verdict.findings;
      const open = f.filter(x => x.severity === 'blocking' && ['open', 'dispute_rejected'].includes(x.state)).length;
      const closed = f.filter(x => x.severity === 'blocking').length - open;
      return `- Round ${r.meta.round} (${who(r.meta)}): **${r.verdict.verdict}**, ${open} open blocking, ${closed} resolved, ${f.filter(x => x.severity === 'minor').length} minor`;
    }),
    ...(latest.size ? ['', '<details><summary>Findings</summary>', '',
      ...[...latest.values()].map(f => `- **${f.id}** (${f.severity}, ${f.state}) \`${f.file}\`: ${f.issue}`), '', '</details>'] : []),
    '', '### Actuals',
    `- Review rounds: ${all.length}`,
    `- Reviewer tokens: ${tokens.toLocaleString('en-GB')}`,
    started ? `- Elapsed since build started: ${Math.round((Date.now() - started) / 60000)} min` : '- Elapsed: not recorded',
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

export function doctorChecks(repo, cfg = {}) {
  const reviewer = cfg.reviewer || 'codex';
  const checks = [
    check('Node.js 20 or newer', Number(process.versions.node.split('.')[0]) >= 20,
      'Install the latest Node.js LTS from https://nodejs.org, then open a new terminal.'),
    check('git', runs('git', ['--version']),
      'Install git from https://git-scm.com/downloads.'),
    check('This folder is a git repository', runs('git', ['-C', repo, 'rev-parse', '--git-dir']),
      'Run `git init` here, or run speck from inside your project folder.'),
    check('Claude Code (builds tickets)', runs('claude', ['--version']),
      'Install Claude Code: https://claude.com/claude-code'),
  ];
  // speck ships locally with git, so the GitHub CLI is only a convenience.
  const ghInstalled = runs('gh', ['--version']);
  checks.push({ ...check('GitHub CLI (optional)', ghInstalled,
    'Not needed to build or ship. Install it from https://cli.github.com if you want to work with GitHub from the terminal.'), optional: true });
  if (reviewer === 'codex') {
    const codexInstalled = runs('codex', ['--version']);
    checks.push(check('Codex CLI (reviews tickets)', codexInstalled,
      'Install it with `npm install -g @openai/codex`, or set `reviewer: claude-subagent` and `allow_same_model_review: true` in speck/config.yml.'));
    if (codexInstalled) checks.push(check('Signed in to Codex', runs('codex', ['login', 'status']),
      'Run `codex login` and follow the prompts.'));
  }
  return checks;
}

function printChecks(checks) {
  for (const c of checks) console.log(`  ${c.ok ? '✓' : c.optional ? '–' : '✗'} ${c.name}${c.ok ? '' : `\n      ${c.optional ? 'Note' : 'Fix'}: ${c.fix}`}`);
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

// ---------- commands ----------

function cmdInit(args) {
  const repo = process.cwd();
  const force = args.includes('--force');
  console.log(`speck ${VERSION}: setting up ${repo}\n`);
  for (const d of ['speck/ideas', 'speck/tickets', 'speck/reviews']) fs.mkdirSync(path.join(repo, d), { recursive: true });
  const copies = [['config.yml', 'speck/config.yml'], ['product.md', 'speck/product.md']];
  for (const [from, to] of copies) {
    const dest = path.join(repo, to);
    if (fs.existsSync(dest) && !force) { console.log(`kept    ${to}`); continue; }
    fs.copyFileSync(path.join(TEMPLATES, from), dest);
    console.log(`created ${to}`);
  }
  for (const d of ['speck/ideas', 'speck/tickets', 'speck/reviews']) {
    const keep = path.join(repo, d, '.gitkeep');
    if (!fs.readdirSync(path.join(repo, d)).length) fs.writeFileSync(keep, '');
  }
  const skills = installTooling(repo);
  console.log(`updated .speck/ (the speck command)`);
  console.log(`updated ${SKILL_DIRS.join(' and ')} (${skills.length} skills)`);
  const pointer = '\n## speck\n\nThis repo uses speck. Read `speck/product.md` first: it describes what the product is today. Work only from a `ready` ticket in `speck/tickets/` (use `/speck-build <id>`). Never approve your own work, and never merge or ship unless the user runs `/speck-ship`.\n';
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

function cmdNew(args) {
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const title = args.filter(a => !a.startsWith('--')).join(' ').trim();
  if (!title) throw new SpeckError('Usage: speck new <title> [--source=path]');
  const source = (args.find(a => a.startsWith('--source=')) || '').slice(9);
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
  text = setField(text, 'created', new Date().toISOString().slice(0, 10));
  const file = path.join(ticketsDir(repo), `${id}-${slugify(title)}.md`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
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
    if (value === 'ready') {
      const { errors } = lintTicket(t, cfg);
      if (errors.length) throw new SpeckError(`Not ready:\n${errors.map(e => `  ✗ ${e}`).join('\n')}`);
    }
  }
  writeField(t, key, value);
  console.log(`${t.fm.id} ${key} → ${value}`);
}

function writeField(t, key, value) {
  let text = setField(t.raw, key, /^\d+$/.test(value) && key !== 'id' ? Number(value) : value);
  if (key === 'status' && value === 'building' && !t.fm.started) text = setField(text, 'started', new Date().toISOString());
  if (key === 'status' && value === 'done') text = setField(text, 'finished', new Date().toISOString());
  fs.writeFileSync(t.file, text);
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

export function shipTicket(repo, id) {
  const cfg = loadConfig(repo);
  const pad = String(id).padStart(4, '0');
  const base = cfg.base_branch;
  const branch = ticketBranch(repo, cfg, pad);
  if (git(['status', '--porcelain'], repo).trim())
    throw new SpeckError('You have uncommitted or untracked changes. Commit or remove them so the working tree is clean, then run this again.');
  const start = git(['branch', '--show-current'], repo).trim() || git(['rev-parse', 'HEAD'], repo).trim();
  const branchSha = git(['rev-parse', branch], repo).trim();
  git(['checkout', '-q', branch], repo);
  const back = () => git(['checkout', '-q', start], repo);
  try {
    shipChecks(repo, cfg, pad, branch);
    if (!runTests(repo, cfg)) throw new SpeckError('Tests failed on the approved branch, so nothing was shipped.');
  } catch (e) { back(); throw e; }
  // Close the ticket on the branch, so the merge is what makes it done.
  const t = findTicket(repo, pad);
  writeField(t, 'status', 'done');
  git(['add', t.file], repo);
  git(['commit', '-q', '-m', `speck(${pad}): ship`], repo);
  git(['checkout', '-q', base], repo);
  const merge = sh('git', ['merge', '--no-ff', '-m', `speck(${pad}): ${t.fm.title}`, branch], { cwd: repo });
  if (merge.status !== 0) {
    sh('git', ['merge', '--abort'], { cwd: repo });
    git(['update-ref', `refs/heads/${branch}`, branchSha], repo);
    back();
    throw new SpeckError(`Merging ${branch} into ${base} hit a conflict, so nothing was shipped and ${base} is unchanged. Rebuild the ticket on the latest ${base}, then ship again.`);
  }
  git(['branch', '-d', branch], repo);
  console.log(`Shipped ${pad}: merged ${branch} into ${base} and deleted the branch.`);
  const remote = sh('git', ['config', `branch.${base}.remote`], { cwd: repo }).stdout.trim();
  if (!remote) { console.log(`No remote set for ${base}, so nothing was pushed.`); return; }
  const push = sh('git', ['push', remote, base], { cwd: repo });
  if (push.status !== 0) throw new SpeckError(`Merged locally, but pushing ${base} to ${remote} failed:\n${push.stderr.trim()}\nIf ${base} is protected on GitHub, allow direct pushes (turn off "Require a pull request before merging"), then run \`git push ${remote} ${base}\`.`);
  console.log(`Pushed ${base} to ${remote}.`);
}

function cmdShip(args) {
  if (!args[0]) throw new SpeckError('Usage: speck ship <id>');
  shipTicket(findRepoRoot(), args[0]);
}

function cmdStatus() {
  const repo = findRepoRoot();
  const tickets = listTickets(repo);
  if (!tickets.length) return console.log('No tickets yet. Capture an idea, then run /speck-ticket.');
  const order = ['approved', 'blocked', 'reviewing', 'building', 'ready', 'draft', 'done'];
  for (const s of order) {
    const group = tickets.filter(t => t.fm.status === s).sort((a, b) => (a.fm.priority ?? 9) - (b.fm.priority ?? 9));
    if (!group.length) continue;
    console.log(`\n${s.toUpperCase()} (${group.length})${s === 'approved' ? ': waiting for you. Read `speck pack <id>`, then run /speck-ship <id>' : ''}`);
    for (const t of group) {
      console.log(`  ${t.fm.id}  P${t.fm.priority ?? '-'}  ${t.fm.size}/${t.fm.risk}  ${t.fm.title}`);
      if (s === 'blocked') {
        const q = contentLines(t.sections['blocked question']).join(' ');
        if (q) console.log(`        ? ${q}`);
      }
    }
  }
  const ideas = path.join(repo, 'speck', 'ideas');
  const n = fs.existsSync(ideas) ? fs.readdirSync(ideas).filter(f => f.endsWith('.md')).length : 0;
  console.log(`\nIDEAS (${n}) in speck/ideas/`);
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
  if (reviewer !== 'codex') throw new SpeckError(`speck review runs the codex adapter. For reviewer "${reviewer}", follow the review skill and record the verdict with \`speck record ${id} <file>\`.`);
  const rec = runCodexReview(repo, id, { tests: opt('tests'), response: opt('response') });
  const next = printRound(rec, cfg, rounds(repo, id));
  process.exitCode = { ship: 0, fix: 10, block: 11 }[next.action];
}

function cmdRecord(args) {
  const [id, file] = args;
  if (!id || !file) throw new SpeckError('Usage: speck record <id> <verdict.json> [--reviewer=name]');
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const reviewer = (args.find(a => a.startsWith('--reviewer=')) || '--reviewer=claude-subagent').slice(11);
  const verdict = JSON.parse(fs.readFileSync(file, 'utf8'));
  // A resumed reviewer keeps the settings it started with, saved by `speck reviewer-settings`.
  const saved = path.join(reviewDir(repo, id), 'reviewer-settings.json');
  const meta = fs.existsSync(saved) ? JSON.parse(fs.readFileSync(saved, 'utf8')) : settingsMeta(reviewerSettings(findTicket(repo, id).fm, cfg));
  const rec = saveRound(repo, id, verdict, { reviewer, ...meta, reviewed_sha: git(['rev-parse', 'HEAD'], repo).trim() });
  const next = printRound(rec, cfg, rounds(repo, id));
  process.exitCode = { ship: 0, fix: 10, block: 11 }[next.action];
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
  const dir = reviewDir(repo, args[0]);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'reviewer-settings.json'), JSON.stringify(s, null, 2) + '\n');
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
  const diff = git(['diff', `${base}..HEAD`, '--', '.', ':(exclude)speck/reviews'], repo);
  const testsArg = args.find(a => a.startsWith('--tests='));
  const tests = testsArg ? fs.readFileSync(testsArg.slice(8), 'utf8') : '(no test output provided)';
  console.log(reviewerPrompt(repo, t, cfg, 1, { diff, tests }));
  console.log(`\nReturn ONLY a JSON object matching this schema:\n${fs.readFileSync(path.join(TEMPLATES, 'review-verdict.schema.json'), 'utf8')}`);
}

const HELP = `speck: small tickets, independent review, you merge.

  speck init                          set up speck in this repo, or update it (re-run any time)
  speck doctor                        check that git, GitHub, Claude Code and Codex are ready
  speck new <title> [--source=path]   create the next numbered draft ticket
  speck lint <id>                     check a ticket against the size rules
  speck set <id> <field> <value>      update a ticket field (status ready runs lint first)
  speck status                        tickets by status, blocked first
  speck diffstat                      changed lines against the size limit
  speck review <id> [--tests=f] [--response=f]   run one codex review round
  speck record <id> <verdict.json> [--reviewer=x] record a round from another reviewer
  speck prompt <id> [--tests=f]       print the reviewer prompt (for subagent reviewers)
  speck reviewer-settings <id>        print and save the model and effort to start a reviewer with
  speck next <id>                     what the builder should do next: review, fix, block or ship
  speck pack <id>                     print the review pack
  speck ship <id>                     merge an approved ticket into the base branch (the user's gate)
`;

const COMMANDS = { init: cmdInit, doctor: cmdDoctor, new: cmdNew, lint: cmdLint, set: cmdSet, status: cmdStatus, diffstat: cmdDiffstat,
  review: cmdReview, record: cmdRecord, prompt: cmdPrompt, 'reviewer-settings': cmdReviewerSettings, next: cmdNext, pack: cmdPack, ship: cmdShip };

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
