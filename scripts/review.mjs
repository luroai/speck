// speck review, record, prompt, diff, next, review-running and reviewer-settings: review rounds, kept in each ticket, and the codex reviewer.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TEMPLATES, SpeckError, sh, git, findRepoRoot, loadConfig, parseTicket, setField, reviewerSettings, ticketAgents, settingsMeta, syncHeader, findTicket, ROUNDS_HEADING, splitRounds, ticketRounds, posix, isAncestor } from './core.mjs';
import { providerReady } from './provider-review.mjs';
import { knownProviders } from './custom-providers.mjs';
import { fullPrompt, historyPrompt, reviewerChanged, roundOneFile, runCommandReview, runLimited, reviewTimeoutMs, tookTooLong, reviewerOptions } from './reviewers.mjs';
import { testOutput, testsMeta } from './tap.mjs';
import { markRoundRunning, markSubagentRound, endRound } from './review-running.mjs';
import { documentSection } from './output.mjs';
import { tildePaths, privateWordList, redactPrivateWords } from './private-words.mjs';
import { keepReceipt } from './receipts.mjs';
import { codexSpend } from './round-cost.mjs';
import { changesPending, changesToReview } from './changes-asked.mjs';
import { reviewWaitMs, pendingRound, startRound, waitForRound, keepExitCode } from './review-wait.mjs';
import { REVIEWER_LIMITED, stopOnLimit, holdOnLimit, clearLimit } from './reviewer-limit.mjs';
import { standInFor, standInRound, standInMeta, standInWords } from './review-stand-in.mjs';
import { keepUsage } from './agent-usage.mjs';
import { openBlocking, isMergeRound, mergeRun, ordinaryRounds, extraRound, nextAction, allowedRounds } from './review-limit.mjs';
import { ownBase } from './built-on.mjs';

export { openBlocking, isMergeRound, mergeRun, ordinaryRounds, extraRoundDue, nextAction, ROUNDS_ALLOWED, allowedLine, allowedRounds } from './review-limit.mjs';

// The ticket without its Review rounds section, for the reviewer's diff and prompt.
export function stripRounds(text) {
  const { before, after } = splitRounds(text);
  return (before + after).replace(/\n*$/, '\n');
}

function roundBlock(rec) {
  return `<details><summary>Round ${rec.meta.round} · ${rec.meta.reviewer} · ${rec.verdict.verdict}${rec.meta.merge ? ' · merge round' : ''}${rec.meta.extra ? ' · extra round' : ''}${rec.meta.stand_in?.for ? ` · standing in for ${rec.meta.stand_in.for}` : ''}</summary>\n\n\`\`\`json\n${JSON.stringify(rec, null, 2)}\n\`\`\`\n\n</details>`;
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
  const open = openBlocking(v);
  const notPassing = v.criteria.filter(c => c.status !== 'pass');
  if (v.verdict === 'approve' && (open.length || notPassing.length)) {
    v.verdict = 'changes_requested';
    v.summary = `[speck: approval overridden: ${open.length} open blocking finding(s), ${notPassing.length} criterion/criteria not passing] ${v.summary}`;
  }
  return v;
}

// 0356: nextAction for a ticket as written in `raw`: changes the user asked for since its last round need a review
// round first, so it isn't closed or shipped as it was approved before them.
export function ticketNext(raw, all, cfg) {
  const pending = changesPending(raw, all);
  if (pending.length) return { action: 'review', reason: `the user asked for changes after round ${pending.at(-1).after}. Make them, then run a review round` };
  return nextAction(all, cfg, allowedRounds(raw));
}

// Round 1 also sets a building ticket to reviewing, and any round an approved one, in the same write, so a refused verdict changes nothing.
// 0506: any path under the home folder in the ticket, such as a reviewer's evidence, is written as a `~/` path.
// 0633: and each of your private words in the reviewer's text and the builder's response as `[private]`, so the receipt
// is made from the round without them. The fields speck reads (VERDICT_FIELDS) stay as they are.
// 0629: `receipt` (only for a round speck ran the reviewer for itself) also keeps a receipt for the round as saved.
const VERDICT_FIELDS = ['verdict', 'id', 'status', 'severity', 'state'];
export function saveRound(repo, id, verdict, meta, { receipt = false } = {}) {
  const t = findTicket(repo, id);
  const round = rounds(repo, id).length + 1;
  const list = privateWordList(repo), words = [...list.words, ...list.logins]; // 0635: and each saved test login's password
  const said = meta.builder_response ? { builder_response: redactPrivateWords(meta.builder_response, words) } : {};
  const record = { meta: { round, ...meta, ...said, saved_at: new Date().toISOString() }, verdict: redactPrivateWords(validateVerdict({ ...verdict, round }), words, VERDICT_FIELDS) };
  fs.writeFileSync(t.file, tildePaths(appendRounds(startReviewing(t.raw, round), [record])));
  if (receipt) keepReceipt(repo, t.fm.id || id, rounds(repo, id).at(-1));
  return record;
}

export function reviewerPrompt(repo, ticket, cfg, round, extra) {
  const tpl = fs.readFileSync(path.join(TEMPLATES, 'reviewer-prompt.md'), 'utf8');
  // A task's result is outside the diff: where it is and how to judge it go before the diff (0353).
  const doc = documentSection(repo, ticket.fm ? ticket : parseTicket(ticket.raw));
  if (round === 1) {
    const values = { TICKET: stripRounds(ticket.raw), BASE: cfg.base_branch, DIFF: extra.diff, TESTS: extra.tests };
    // Round 1's response file, when the builder gives one, says which test files it ran (0235). It goes before the
    // test output, which ends the prompt, so a saved round-1 prompt still gives its test output back (savedTests).
    // Each part is filled on its own, so nothing inserted between them is filled in.
    const fill = s => s.replace(/\{\{(TICKET|BASE|DIFF|TESTS)\}\}/g, (_, k) => values[k]);
    const diffAt = doc ? tpl.indexOf('## Diff against') : -1;
    const withDoc = s => diffAt < 0 ? fill(s) : `${fill(s.slice(0, diffAt))}${doc}\n\n${fill(s.slice(diffAt))}`;
    const at = tpl.indexOf('## Test output (from the builder)');
    if (!extra.response || at < 0 || at < diffAt) return withDoc(tpl);
    return `${withDoc(tpl.slice(0, at))}## Builder response\n\n${extra.response.replace(/\n*$/, '')}\n\n${fill(tpl.slice(at))}`;
  }
  return [
    `# Review round ${round}`,
    'The builder has responded to your previous findings. Keep finding ids stable. For each earlier finding, set state to resolved, dispute_accepted or dispute_rejected (or keep it open if the fix is incomplete). Raise new findings only for real problems introduced or missed.',
    '## Builder response', extra.response || '(none provided)',
    ...changesSection(ticket.raw),
    ...(doc ? [doc] : []),
    ...diffSection(cfg, extra),
    '## Test output', '```', extra.tests, '```',
    'Re-check every acceptance criterion against the code as it is now and return the full verdict JSON.',
  ].join('\n\n');
}

// The diff a later round is given, with what it holds. 0673: after a merge of the base branch in a merge round, only
// what changed beyond git's own clean merge, with the command for the whole change.
function diffSection(cfg, extra) {
  const b = cfg.base_branch;
  const block = ['```diff', extra.diff, '```'];
  if (extra.afterMerge) {
    const { last, approved } = extra.afterMerge;
    const short = sha => sha.slice(0, 8);
    const since = last === approved ? 'since you approved it' : `since your last review, at ${short(last)}`;
    return [
      `This round follows a merge of ${b} into the ticket branch, made after you approved commit ${short(approved)}. What ${b} brought in was reviewed in its own tickets, and \`speck ship\` tests the two together as they would land. So the diff below holds only what changed beyond git's own clean merge of ${short(last)} with ${b}: how each conflict was resolved (the conflict markers on its minus side are git's merge), anything else changed by hand in the merge, and every change committed ${since}. A file only ${b} changed isn't in it, nor is any part of the ticket's change that the merge left as it was. Check that each resolved file keeps the intent of both sides. To see the branch's whole change against ${b} as merged, run \`git diff ${extra.base} HEAD\`.`,
      `## Changes beyond a clean merge of ${b} (${short(last)} merged with ${b}..HEAD)`,
      ...(extra.diff.trim() ? block : [`Nothing: the merge changed nothing beyond git's own clean merge, and nothing has been committed ${since}. Check the merge as the builder's response describes it, and run the command above if you need the whole change.`]),
    ];
  }
  return [
    ...(extra.merged ? [`This round follows a merge of ${b} into the ticket branch, made to resolve a conflict when shipping. So the diff below is the branch's whole change against ${b} as merged, which is what would ship, not only the changes since your last review. Check that each resolved file keeps the intent of both sides.`] : []),
    `## ${extra.merged ? `The whole change against ${b} as merged` : 'Changes since your last review'} (${extra.sinceSha.slice(0, 8)}..HEAD)`, ...block,
  ];
}

// 0356: the changes the user asked for after the last approval, for the reviewer to check until a round approves them.
function changesSection(raw) {
  const asked = changesToReview(raw, ticketRounds(raw).rounds);
  if (!asked.length) return [];
  return ['## Changes asked for by the user',
    `The user read the approved result and asked for ${asked.length > 1 ? 'these changes' : 'this change'}:\n\n${asked.map(c => `- ${c.at}: ${c.note}`).join('\n')}`,
    `Check that the change now does what ${asked.length > 1 ? 'each note asks' : 'the note asks'}, as well as every acceptance criterion. Raise a blocking finding for anything it asks that isn't done.`];
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
// 0673: except in a merge round, which starts at git's own clean merge of the last reviewed commit with the base
// branch as merged in, so the reviewer sees only how each conflict was resolved, anything else changed by hand in the
// merge and every change committed since. `afterMerge` names the commits it needs to say so.
// 0674: a ticket built on another (`fm`'s built_on) is measured from where its own change starts, not its merge base.
export function reviewSince(repo, cfg, prior, fm = null) {
  const target = shipBase(repo, cfg.base_branch);
  const own = c => ownBase(repo, cfg, fm, c);
  const meets = git(['merge-base', target, 'HEAD'], repo).trim(), base = own('HEAD') ?? meets;
  const last = prior[prior.length - 1]?.meta?.reviewed_sha;
  if (!last) return { base, sinceSha: base, merged: false };
  const ownWas = own(last);
  const was = ownWas ? { status: 0, stdout: ownWas } : sh('git', ['merge-base', target, last], { cwd: repo });
  const merged = was.status === 0 && was.stdout.trim() !== base;
  if (!merged) return { base, sinceSha: last, merged };
  const clean = isMergeRound(prior) && cleanMerge(repo, last, meets); // commits: `base` may be ownBase's tree
  if (!clean) return { base, sinceSha: base, merged };
  const approved = prior.findLast(r => r.verdict.verdict === 'approve')?.meta?.reviewed_sha || last;
  return { base, sinceSha: clean, merged, afterMerge: { last, approved } };
}

// The tree git's own merge of `a` and `b` gives, conflict markers and all, or null if git can't work it out.
function cleanMerge(repo, a, b) {
  const r = sh('git', ['merge-tree', '--write-tree', a, b], { cwd: repo });
  const tree = r.stdout.split('\n')[0].trim();
  return (r.status === 0 || r.status === 1) && /^[0-9a-f]{40,64}$/.test(tree) ? tree : null;
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
  const { base, sinceSha, merged, afterMerge } = reviewSince(repo, cfg, prior, ticket.fm);
  const merge = isMergeRound(prior);
  // A merge round after an approval starts a new run, so only a run that hasn't approved yet can use up the limit.
  const used = prior.at(-1)?.verdict.verdict === 'approve' ? 0 : mergeRun(prior);
  if (merge && used >= cfg.limits.max_merge_rounds) throw new SpeckError(`Max merge rounds (${cfg.limits.max_merge_rounds}) reached. Block the ticket.`, 3);
  const { extra, allowed } = extraRound(prior, cfg, merge, allowedRounds(ticket.raw));
  requireCommitted(repo, ticket, 'Commit your work before review: the reviewer reviews commits, not the working tree.');
  const head = git(['rev-parse', 'HEAD'], repo).trim();
  const diff = reviewDiff(repo, sinceSha);
  const tests = testOutput(opts.tests, ticket.fm.id || id);
  const testsSeen = testsMeta(opts.tests);
  const response = readResponse(opts.response);
  return { cfg, ticket, prior, round, head, base, sinceSha, merged, afterMerge, merge, extra, allowed, diff, tests, testsSeen, response };
}

// Runs a review round. Round 1 on a building ticket, or any round on an approved one, sets it to reviewing before the
// reviewer starts, and puts the ticket back exactly as it was if the round fails, so only a recorded round leaves the status changed.
// 0623: unless the reviewer's usage limit refused it: the ticket stays reviewing, for speck run to carry on.
// 0223: the round counts as running from then until it's recorded, fails or times out.
function reviewRound(repo, id, opts, run) {
  const s = reviewSetup(repo, id, opts);
  const marked = startReviewing(s.ticket.raw, s.round);
  const ended = markRoundRunning(repo, s.ticket.fm.id || id, s.round);
  try {
    if (marked === s.ticket.raw) return run(s);
    fs.writeFileSync(s.ticket.file, marked);
    try { return run(s); } catch (e) { if (e.code !== REVIEWER_LIMITED) fs.writeFileSync(s.ticket.file, s.ticket.raw); throw e; }
  } finally { ended(); }
}

// 0554: with --json, Codex writes why it failed to standard output, as an `error` event (`message`) or a `turn.failed`
// one (`error.message`), so that is given first, then the last lines of standard error. An API error can come wrapped
// as JSON in the message, when its own message is given.
export function codexFailure(status, stdout, stderr) {
  const said = m => typeof m === 'string' && m.trim() ? m.trim() : '';
  const reasons = String(stdout || '').split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } })
    .map(e => e?.type === 'turn.failed' ? said(e.error?.message) : e?.type === 'error' ? said(e.message) : '').filter(Boolean);
  let reason = reasons.pop() || String(stderr || '').trim().split('\n').slice(-5).join('\n');
  try { reason = said(JSON.parse(reason)?.error?.message) || reason; } catch {}
  return reason ? `codex exited ${status}: ${reason}` : `codex exited ${status} and gave no reason.`;
}

function runCodexReview(repo, id, s) {
  const { cfg, ticket, prior, round, head, sinceSha, merged, afterMerge, merge, extra, allowed, diff, tests, testsSeen, response } = s;
  const out = path.join(cacheDir(repo, id), `round-${round}.out.json`);
  const schema = path.join(TEMPLATES, 'review-verdict.schema.json');
  const sandbox = cfg.reviewer_options?.codex?.sandbox || 'read-only';
  const settings = reviewerSettings(ticket.fm, cfg);
  // Later rounds resume the Codex session recorded with the most recent round that has one. 0388: unless the last
  // round's reviewer or model differs from this one's, when a fresh session gets the full history.
  // 0649: as does every round on a stand-in.
  const fresh = round > 1 ? (s.standIn ? `it stands in for ${s.standIn.for}` : reviewerChanged(prior, 'codex', settings)) : null;
  const lastThread = round > 1 && !fresh ? [...prior].reverse().find(r => r.meta?.thread_id)?.meta.thread_id : undefined;
  if (fresh && prior.some(r => r.meta?.thread_id)) console.log(`Started a fresh codex session with the full history, because ${fresh}.`);
  const prompt = round > 1 && !lastThread ? historyPrompt(repo, s, id) : reviewerPrompt(repo, ticket, cfg, round, { diff, tests, response, sinceSha, merged, afterMerge, base: s.base });
  // 0388: kept, with each round's response, so a later fresh session can be given the full history.
  if (round === 1) fs.writeFileSync(roundOneFile(repo, id), prompt);

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
  keepUsage(repo, 'codex', r.stdout, { thread: round > 1 ? lastThread : undefined }); // 0642: the thread it started, or the one it resumed
  if (r.timedOut) { fs.rmSync(out, { force: true }); throw new SpeckError(tookTooLong('codex', ms)); }
  if (r.error) throw new SpeckError(`codex failed: ${r.error.message}`);
  if (r.status !== 0) { const why = codexFailure(r.status, r.stdout, r.stderr); stopOnLimit(repo, ticket.fm.id || id, 'codex', why); throw new SpeckError(why); }
  const events = r.stdout.split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return {}; } });
  const thread = events.find(e => e.type === 'thread.started')?.thread_id || (round > 1 ? lastThread : undefined);
  const usage = events.filter(e => e.type === 'turn.completed').map(e => e.usage).pop() || {};
  // 0529: a resumed session's usage covers the whole session, so the round it resumed is taken out of it.
  const resumed = lastThread ? [...prior].reverse().find(r => r.meta?.thread_id === lastThread)?.meta : null;
  const spend = codexSpend(usage, { model: settings.model, thread, ...(resumed ? { before: resumed.usage ?? null } : {}) });
  const verdict = JSON.parse(fs.readFileSync(out, 'utf8'));
  fs.rmSync(out);
  return saveRound(repo, id, verdict, { reviewer: 'codex', ...settingsMeta(settings), ...standInMeta(s), reviewed_sha: head, ...(merge ? { merge } : {}), ...(extra ? { extra } : {}), ...(allowed ? { allowed } : {}), session: lastThread ? 'continued' : 'fresh', thread_id: thread, ...(response ? { builder_response: response } : {}), ...(sandboxFailed(events) ? { sandbox_ok: false } : {}), seconds: Math.round((Date.now() - started) / 1000), usage, ...spend, ...testsSeen }, { receipt: true });
}

function printRound(rec, cfg, all, allowed = 0) {
  const v = rec.verdict;
  console.log(`Round ${rec.meta.round}: ${v.verdict}`);
  const stood = standInWords(rec.meta);
  if (stood) console.log(`Ran on ${rec.meta.reviewer}, ${stood}.`);
  console.log(v.summary);
  if (rec.meta.sandbox_ok === false) console.log(NO_INSPECT);
  for (const c of v.criteria) console.log(`  AC${c.id} ${c.status}: ${c.evidence}`);
  for (const f of v.findings) console.log(`  ${f.id} [${f.severity}/${f.state}] ${f.file}: ${f.issue}${f.suggested_fix ? ` → ${f.suggested_fix}` : ''}`);
  const next = nextAction(all, cfg, allowed);
  console.log(`NEXT: ${next.action}${next.reason ? `: ${next.reason}` : ''}`);
  return next;
}

export function cmdReview(args) {
  const started = Date.now();
  const id = args[0];
  if (!id) throw new SpeckError('Usage: speck review <id> [--tests=file] [--response=file] | speck review <id> --wait');
  const opt = k => (args.find(a => a.startsWith(`--${k}=`)) || '').slice(k.length + 3) || undefined;
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const t = findTicket(repo, id);
  const pad = t.fm.id || id;
  // 0384: a round runs in a process of its own, which this waits for, so it can outlast the builder's shell. One that
  // is running already, or has finished without being printed, is waited for rather than another started.
  const worker = Number((args.find(a => a.startsWith('--worker=')) || '').slice(9)) || 0;
  const limitMs = () => { try { return reviewTimeoutMs(cfg); } catch { return 30 * 60 * 1000; } };
  if (!worker && (args.includes('--wait') || pendingRound(repo, pad, limitMs()))) return waitForRound(repo, pad, started + reviewWaitMs(), limitMs());
  const reviewer = ticketAgents(t.fm, cfg).reviewer; // 0388: the ticket's, or else the settings' as this round starts
  const command = reviewerOptions(cfg, reviewer).command;
  const opts = { tests: opt('tests'), response: opt('response') };
  // A bad review_timeout_minutes is refused before the ticket changes or any reviewer runs (0180).
  if ((typeof command === 'string' && command.trim()) || reviewer === 'codex') reviewTimeoutMs(cfg);
  if (!worker) {
    if (!(typeof command === 'string' && command.trim()) && reviewer !== 'codex') unsupported(id, reviewer);
    // 0390: a provider's reviewer with no key, or without Claude Code, fails before the round starts.
    const { provider } = reviewerOptions(cfg, reviewer);
    if (provider) providerReady(repo, provider);
    startRound(repo, pad, rounds(repo, id).length + 1, args.slice(1).filter(a => /^--(tests|response)=/.test(a)), limitMs());
    return waitForRound(repo, pad, started + reviewWaitMs(), limitMs());
  }
  keepExitCode(repo, pad, worker);
  let rec;
  const held = s => { holdOnLimit(repo, pad, reviewer); return s; }; // 0623: inside the round, so the ticket is left as a refused round leaves it
  const runOn = (name, s) => {
    const own = reviewerOptions(s.cfg, name).command;
    return typeof own === 'string' && own.trim() ? runCommandReview(repo, id, name, own, s) : name === 'codex' ? runCodexReview(repo, id, s) : unsupported(id, name);
  };
  if (!(typeof command === 'string' && command.trim()) && reviewer !== 'codex') unsupported(id, reviewer);
  try { rec = reviewRound(repo, id, opts, s => runOn(reviewer, held(s))); } catch (e) {
    // 0649: held by a recorded usage limit, the round runs on the first agent on reviewer_bench that can take it.
    let sub = null;
    if (e.code === REVIEWER_LIMITED) try { sub = standInFor(repo, findTicket(repo, id).fm, cfg); } catch (why) { console.error(`No agent on reviewer_bench could stand in: ${why.message}`); }
    if (!sub) throw e;
    console.log(`The ${reviewer} reviewer's usage limit is reached, so this round runs on ${sub.name}, the first agent on reviewer_bench that can take it, in a fresh session with the full history.`);
    rec = reviewRound(repo, id, opts, s => runOn(sub.name, standInRound(s, sub)));
  }
  clearLimit(repo, pad);
  const next = printRound(rec, cfg, rounds(repo, id), allowedRounds(findTicket(repo, id).raw));
  process.exitCode = { ship: 0, fix: 10, block: 11 }[next.action];
}

function unsupported(id, reviewer) {
  throw new SpeckError(`speck review runs the codex, claude and cursor reviewers, a model provider's (${knownProviders().map(p => p.name).join(', ')}), or a reviewer with a command under reviewer_options in speck/config.yml. For reviewer "${reviewer}", follow the review skill and record the verdict with \`speck record ${id} <file>\`.`);
}

// Where the JSON value starting at the brace at `from` ends, skipping braces inside strings, or -1 if it never closes.
function objectEnd(s, from) {
  let depth = 0, inString = false;
  for (let i = from; i < s.length; i++) {
    const c = s[i];
    if (inString) { if (c === '\\') i++; else if (c === '"') inString = false; }
    else if (c === '"') inString = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return i;
  }
  return -1;
}

// The last unfenced JSON object with a `verdict` key in a reply with prose before, after or between objects (0383).
export function verdictInProse(text) {
  const s = String(text);
  let found = null;
  for (let i = s.indexOf('{'); i !== -1;) {
    const end = objectEnd(s, i);
    let v = null;
    if (end !== -1) try { v = JSON.parse(s.slice(i, end + 1)); } catch { /* not JSON: try the next brace */ }
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (Object.hasOwn(v, 'verdict')) found = v;
      i = s.indexOf('{', end + 1);
    } else i = s.indexOf('{', i + 1);
  }
  return found;
}

// A subagent often wraps its JSON verdict in a ```json fence, even when asked not to, or opens with a line of prose,
// so a reply saved as it was sent is accepted.
function parseReply(text, file) {
  const body = text.trim().replace(/^```[a-z]*\r?\n([\s\S]*?)\r?\n```$/i, '$1');
  let v = null;
  try { v = JSON.parse(body); } catch { v = verdictInProse(text); }
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
  const merge = isMergeRound(prior);
  const { extra, allowed } = extraRound(prior, cfg, merge, allowedRounds(findTicket(repo, id).raw));
  // 0529: a subagent reports no usage, so its round's tokens and cost are unknown.
  const rec = saveRound(repo, id, verdict, { reviewer, ...meta, model: meta.reviewer_model && meta.reviewer_model !== 'default' ? meta.reviewer_model : null, tokens: null, cost_usd: null, reviewed_sha: git(['rev-parse', 'HEAD'], repo).trim(), ...(merge ? { merge } : {}), ...(extra ? { extra } : {}), ...(allowed ? { allowed } : {}), ...testsSeen });
  endRound(repo, findTicket(repo, id).fm.id || id);
  const next = printRound(rec, cfg, rounds(repo, id), allowedRounds(findTicket(repo, id).raw));
  process.exitCode = { ship: 0, fix: 10, block: 11 }[next.action];
}

export function cmdNext(args) {
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const t = findTicket(repo, args[0]);
  const next = ticketNext(t.raw, ticketsRounds(repo, t), cfg);
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
  const base = ownBase(repo, cfg, t.fm) ?? git(['merge-base', cfg.base_branch, 'HEAD'], repo).trim(); // 0674
  const diff = reviewDiff(repo, base);
  const testsArg = args.find(a => a.startsWith('--tests='));
  const tests = testOutput(testsArg?.slice(8), t.fm.id || args[0]);
  const response = readResponse(args.find(a => a.startsWith('--response='))?.slice(11));
  console.log(fullPrompt(repo, t, cfg, diff, tests, response));
}

export function cmdDiff(args) {
  // The changes since the reviewer last looked (or since the base branch, or after a merge what changed beyond a clean merge in a merge round and the whole change before one), as a reviewer sees them.
  if (!args[0]) throw new SpeckError('Usage: speck diff <id>');
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const s = reviewSince(repo, cfg, rounds(repo, args[0]), findTicket(repo, args[0]).fm);
  const diff = reviewDiff(repo, s.sinceSha);
  // 0673: in a merge round after a merge, with what it holds and the command for the whole change, as speck review gives it.
  process.stdout.write(s.afterMerge ? `${diffSection(cfg, { ...s, diff }).join('\n\n')}\n` : diff);
}
