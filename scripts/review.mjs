// speck review, record, prompt, diff, next, review-running and reviewer-settings: review rounds, kept in each ticket, and the codex reviewer.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TEMPLATES, SpeckError, sh, git, findRepoRoot, loadConfig, parseTicket, setField, reviewerSettings, settingsMeta, syncHeader, findTicket, ROUNDS_HEADING, splitRounds, ticketRounds, posix, isAncestor } from './core.mjs';
import { fullPrompt, runCommandReview, runLimited, reviewTimeoutMs, tookTooLong } from './reviewers.mjs';
import { testOutput, testsMeta } from './tap.mjs';
import { markRoundRunning, markSubagentRound, endRound } from './review-running.mjs';

// The ticket without its Review rounds section, for the reviewer's diff and prompt.
export function stripRounds(text) {
  const { before, after } = splitRounds(text);
  return (before + after).replace(/\n*$/, '\n');
}

function roundBlock(rec) {
  return `<details><summary>Round ${rec.meta.round} · ${rec.meta.reviewer} · ${rec.verdict.verdict}${rec.meta.merge ? ' · merge round' : ''}</summary>\n\n\`\`\`json\n${JSON.stringify(rec, null, 2)}\n\`\`\`\n\n</details>`;
}

// Adds rounds to the end of the Review rounds section, creating it at the end of the ticket if needed. Nothing else changes.
export function appendRounds(text, recs) {
  const { before, section, after } = splitRounds(text);
  const head = section ? before : before.replace(/\n*$/, '\n\n');
  const body = section ? section.replace(/\n*$/, '\n') : `${ROUNDS_HEADING}\n<!-- Written by speck after each review round. Don't edit it by hand. -->\n`;
  return head + body + recs.map(r => `\n${roundBlock(r)}\n`).join('') + (after ? `\n${after}` : '');
}

export function rounds(repo, id) {
  return ticketsRounds(repo, findTicket(repo, id));
}

// The rounds recorded in a ticket already read, such as a copy from its branch.
export function ticketsRounds(repo, t) {
  const { rounds: all, errors } = ticketRounds(t.raw);
  if (errors.length) throw new SpeckError(`${path.relative(repo, t.file)}: ${errors[0]} Restore that section from git, then run this again.`);
  return all;
}

// Working files for a review in progress (raw reviewer output, saved reviewer settings). Not history, so git ignores them.
export function cacheDir(repo, id) {
  const root = path.join(repo, 'speck', '.cache');
  const dir = path.join(root, String(id).padStart(4, '0'));
  fs.mkdirSync(dir, { recursive: true });
  const ignore = path.join(root, '.gitignore');
  if (!fs.existsSync(ignore)) fs.writeFileSync(ignore, '# Working files for reviews in progress. Review history is in each ticket.\n*\n');
  return dir;
}

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
export function reviewDiff(repo, since, to = 'HEAD') {
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

// A merge round re-reviews a merge of the base branch made after an approval: the round after an approved one when the
// branch has merged the base branch in since, and each round after that until one approves. Merge rounds don't count
// towards max_review_rounds. `merged` says whether the branch merged the base branch in since the last round.
export function isMergeRound(prior, merged) {
  const last = prior[prior.length - 1];
  if (!last) return false;
  return last.verdict.verdict === 'approve' ? merged : last.meta?.merge === true;
}

// The merge rounds in a row at the end of `all` since the last approval before them: the ones max_merge_rounds caps.
export function mergeRun(all) {
  let n = 0;
  for (let i = all.length - 1; i >= 0 && all[i].meta?.merge && !(n && all[i].verdict.verdict === 'approve'); i--) n++;
  return n;
}

export const ordinaryRounds = all => all.filter(r => !r.meta?.merge).length;

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
  if (last.meta?.merge) {
    const run = mergeRun(all);
    if (run >= cfg.limits.max_merge_rounds) return { action: 'block', reason: `No approval after ${run} merge rounds in a row re-reviewing the merge of ${cfg.base_branch || 'the base branch'} (limits.max_merge_rounds).` };
  } else if (ordinaryRounds(all) >= cfg.limits.max_review_rounds) return { action: 'block', reason: `No approval after ${ordinaryRounds(all)} review rounds.` };
  return { action: 'fix' };
}

// Round 1 also sets a building ticket to reviewing, and any round an approved one, in the same write, so a refused verdict changes nothing.
export function saveRound(repo, id, verdict, meta) {
  const t = findTicket(repo, id);
  const round = rounds(repo, id).length + 1;
  const record = { meta: { round, ...meta, saved_at: new Date().toISOString() }, verdict: validateVerdict({ ...verdict, round }) };
  fs.writeFileSync(t.file, appendRounds(startReviewing(t.raw, round), [record]));
  return record;
}

export function reviewerPrompt(repo, ticket, cfg, round, extra) {
  const tpl = fs.readFileSync(path.join(TEMPLATES, 'reviewer-prompt.md'), 'utf8');
  if (round === 1) {
    const values = { TICKET: stripRounds(ticket.raw), BASE: cfg.base_branch, DIFF: extra.diff, TESTS: extra.tests };
    // Round 1's response file, when the builder gives one, says which test files it ran (0235). It goes before the
    // test output, which ends the prompt, so a saved round-1 prompt still gives its test output back (savedTests).
    const fill = s => s.replace(/\{\{(TICKET|BASE|DIFF|TESTS)\}\}/g, (_, k) => values[k]);
    const at = tpl.indexOf('## Test output (from the builder)');
    if (!extra.response || at < 0) return fill(tpl);
    return `${fill(tpl.slice(0, at))}## Builder response\n\n${extra.response.replace(/\n*$/, '')}\n\n${fill(tpl.slice(at))}`;
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

export const NO_INSPECT = '⚠️ Reviewer could not inspect the repo; reviewed the diff only';

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

// The builder's response file given with --response, or '' without one.
function readResponse(file) {
  if (!file) return '';
  try { return fs.readFileSync(file, 'utf8'); } catch (e) {
    throw new SpeckError(`Can't read the builder's response in ${file} (${e.code || e.message}). Check the file given with --response, then run this again.`);
  }
}

// Everything a review round needs, checked before any reviewer runs: the round number, the commit under review,
// the diff since the last round and the builder's inputs.
function reviewSetup(repo, id, opts) {
  const cfg = loadConfig(repo);
  const ticket = findTicket(repo, id);
  const prior = rounds(repo, id);
  const round = prior.length + 1;
  const { base, sinceSha, merged } = reviewSince(repo, cfg, prior);
  const merge = isMergeRound(prior, merged);
  // A merge round after an approval starts a new run, so only a run that hasn't approved yet can use up the limit.
  const used = prior.at(-1)?.verdict.verdict === 'approve' ? 0 : mergeRun(prior);
  if (merge && used >= cfg.limits.max_merge_rounds) throw new SpeckError(`Max merge rounds (${cfg.limits.max_merge_rounds}) reached. Block the ticket.`, 3);
  if (!merge && ordinaryRounds(prior) >= cfg.limits.max_review_rounds) throw new SpeckError(`Max review rounds (${cfg.limits.max_review_rounds}) reached. Block the ticket.`, 3);
  requireCommitted(repo, ticket, 'Commit your work before review: the reviewer reviews commits, not the working tree.');
  const head = git(['rev-parse', 'HEAD'], repo).trim();
  const diff = reviewDiff(repo, sinceSha);
  const tests = testOutput(opts.tests, ticket.fm.id || id);
  const testsSeen = testsMeta(opts.tests);
  const response = readResponse(opts.response);
  return { cfg, ticket, prior, round, head, base, sinceSha, merged, merge, diff, tests, testsSeen, response };
}

// Runs a review round. Round 1 on a building ticket, or any round on an approved one, sets it to reviewing before the
// reviewer starts, and puts the ticket back exactly as it was if the round fails, so only a recorded round leaves the status changed.
// 0223: the round counts as running from then until it's recorded, fails or times out.
function reviewRound(repo, id, opts, run) {
  const s = reviewSetup(repo, id, opts);
  const marked = startReviewing(s.ticket.raw, s.round);
  const ended = markRoundRunning(repo, s.ticket.fm.id || id, s.round);
  try {
    if (marked === s.ticket.raw) return run(s);
    fs.writeFileSync(s.ticket.file, marked);
    try { return run(s); } catch (e) { fs.writeFileSync(s.ticket.file, s.ticket.raw); throw e; }
  } finally { ended(); }
}

function runCodexReview(repo, id, s) {
  const { cfg, ticket, prior, round, head, sinceSha, merged, merge, diff, tests, testsSeen, response } = s;
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
  const ms = reviewTimeoutMs(cfg);
  const started = Date.now();
  // A verdict file left by an earlier attempt that was ended must never be read as this one's (0180).
  fs.rmSync(out, { force: true });
  const r = runLimited('codex', args, { cwd: repo, input: prompt, ms });
  if (r.timedOut) { fs.rmSync(out, { force: true }); throw new SpeckError(tookTooLong('codex', ms)); }
  if (r.error) throw new SpeckError(`codex failed: ${r.error.message}`);
  if (r.status !== 0) throw new SpeckError(`codex exited ${r.status}: ${r.stderr.trim().split('\n').slice(-5).join('\n')}`);
  const events = r.stdout.split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return {}; } });
  const thread = events.find(e => e.type === 'thread.started')?.thread_id || (round > 1 ? lastThread : undefined);
  const usage = events.filter(e => e.type === 'turn.completed').map(e => e.usage).pop() || {};
  const verdict = JSON.parse(fs.readFileSync(out, 'utf8'));
  fs.rmSync(out);
  return saveRound(repo, id, verdict, { reviewer: 'codex', ...settingsMeta(settings), reviewed_sha: head, ...(merge ? { merge } : {}), thread_id: thread, ...(sandboxFailed(events) ? { sandbox_ok: false } : {}), seconds: Math.round((Date.now() - started) / 1000), usage, ...testsSeen });
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

export function cmdReview(args) {
  const id = args[0];
  if (!id) throw new SpeckError('Usage: speck review <id> [--tests=file] [--response=file]');
  const opt = k => (args.find(a => a.startsWith(`--${k}=`)) || '').slice(k.length + 3) || undefined;
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const t = findTicket(repo, id);
  const reviewer = t.fm.reviewer || cfg.reviewer;
  const command = cfg.reviewer_options?.[reviewer]?.command;
  const opts = { tests: opt('tests'), response: opt('response') };
  // A bad review_timeout_minutes is refused before the ticket changes or any reviewer runs (0180).
  if ((typeof command === 'string' && command.trim()) || reviewer === 'codex') reviewTimeoutMs(cfg);
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

export function cmdRecord(args) {
  const [id, file] = args;
  if (!id || !file) throw new SpeckError('Usage: speck record <id> <verdict.json> [--reviewer=name] [--tests=file]');
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const reviewer = (args.find(a => a.startsWith('--reviewer=')) || '--reviewer=claude-subagent').slice(11);
  const verdict = parseReply(fs.readFileSync(file, 'utf8'), file);
  const testsSeen = testsMeta((args.find(a => a.startsWith('--tests=')) || '').slice(8));
  requireCommitted(repo, findTicket(repo, id), 'Commit your work before recording a round: the round is saved against the latest commit.');
  // A resumed reviewer keeps the settings it started with, saved by `speck reviewer-settings`.
  const saved = path.join(cacheDir(repo, id), 'reviewer-settings.json');
  const meta = fs.existsSync(saved) ? JSON.parse(fs.readFileSync(saved, 'utf8')) : settingsMeta(reviewerSettings(findTicket(repo, id).fm, cfg));
  const prior = rounds(repo, id);
  // Whether the base branch was merged in only matters after an approval, so it's only looked up then.
  const merge = isMergeRound(prior, prior.at(-1)?.verdict.verdict === 'approve' && reviewSince(repo, cfg, prior).merged);
  const rec = saveRound(repo, id, verdict, { reviewer, ...meta, reviewed_sha: git(['rev-parse', 'HEAD'], repo).trim(), ...(merge ? { merge } : {}), ...testsSeen });
  endRound(repo, findTicket(repo, id).fm.id || id);
  const next = printRound(rec, cfg, rounds(repo, id));
  process.exitCode = { ship: 0, fix: 10, block: 11 }[next.action];
}

export function cmdNext(args) {
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const next = nextAction(rounds(repo, args[0]), cfg);
  console.log(`${next.action}${next.reason ? `: ${next.reason}` : ''}`);
}

// 0223: records that a reviewer subagent is running the next round, for the panel, until `speck record` records it,
// or, with --ended, that the round was given up on.
export function cmdReviewRunning(args) {
  const id = args.find(a => !a.startsWith('--'));
  if (!id) throw new SpeckError('Usage: speck review-running <id> [--ended]');
  const repo = findRepoRoot();
  const t = findTicket(repo, id), pad = t.fm.id || id;
  if (args.includes('--ended')) { endRound(repo, pad); console.log(`No review round of ${pad} is shown as running.`); return; }
  const round = rounds(repo, id).length + 1;
  markSubagentRound(repo, pad, round);
  console.log(`Round ${round} of ${pad} is shown as running until \`speck record\` records it, or \`speck review-running ${pad} --ended\` ends it.`);
}

export function cmdReviewerSettings(args) {
  // The model and effort to start a reviewer with, for reviewers that speck doesn't start itself.
  // Saved so that `speck record` reports what the running reviewer actually uses, even if the ticket changes later.
  const repo = findRepoRoot();
  const s = settingsMeta(reviewerSettings(findTicket(repo, args[0]).fm, loadConfig(repo)));
  fs.writeFileSync(path.join(cacheDir(repo, args[0]), 'reviewer-settings.json'), JSON.stringify(s, null, 2) + '\n');
  console.log(`model: ${s.reviewer_model}\neffort: ${s.reviewer_effort}`);
}

export function cmdPrompt(args) {
  // Prints the round-1 reviewer prompt, for reviewers other than codex (e.g. a Claude subagent).
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const t = findTicket(repo, args[0]);
  const base = git(['merge-base', cfg.base_branch, 'HEAD'], repo).trim();
  const diff = reviewDiff(repo, base);
  const testsArg = args.find(a => a.startsWith('--tests='));
  const tests = testOutput(testsArg?.slice(8), t.fm.id || args[0]);
  const response = readResponse(args.find(a => a.startsWith('--response='))?.slice(11));
  console.log(fullPrompt(repo, t, cfg, diff, tests, response));
}

export function cmdDiff(args) {
  // The changes since the reviewer last looked (or since the base branch, or the whole change after a merge), as a reviewer sees them.
  if (!args[0]) throw new SpeckError('Usage: speck diff <id>');
  const repo = findRepoRoot();
  const { sinceSha } = reviewSince(repo, loadConfig(repo), rounds(repo, args[0]));
  process.stdout.write(reviewDiff(repo, sinceSha));
}
