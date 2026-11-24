// 0648: a build that stopped partway on its agent's usage limit, with the reset more than an hour away or not known,
// is carried on by the first agent on builder_bench that's ready and not limited (standInFor, 0647): a fresh build
// with that agent's own command, in the ticket's worktree on its branch, told it carries on another agent's build. The
// ticket's Notes say who took over, why and when, and its `builder:` records the new agent, committed on its branch
// before the build starts, so its review checks the family of the agent that finishes it. With the reset an hour away
// or less, or no agent free, the build waits for the reset and carries on its own session, as 0622 does.
// 0711: an approved ticket's handed-back build too (0691), whose new agent is also told what the hand-back was for.
import fs from 'node:fs';
import path from 'node:path';
import { sh, syncHeader, SpeckError } from './core.mjs';
import { commitTicketOnly, replaceSection } from './close.mjs';
import { buildTicket } from './build-records.mjs';
import { standInFor } from './builder-stand-in.mjs';
import { configBuilder, buildPlan, launchPlan, standInTicket, standInText } from './ticket-builder.mjs';
import { newBuildKeeps } from './go-with.mjs';
import { providerNamed } from './provider-review.mjs';
import { knownProviders } from './custom-providers.mjs';
import { onPath } from './install.mjs';
import { handBackOf, handBackKeeps } from './hand-back.mjs';

export const TAKE_OVER_MS = 60 * 60000; // a reset further off than this is worth moving the build for
const CLI_NAMES = { claude: 'Claude', codex: 'Codex', cursor: 'Cursor' };
const nameOf = (agent, providers) => providerNamed(agent, providers)?.label ?? (Object.hasOwn(CLI_NAMES, agent) ? CLI_NAMES[agent] : agent);
const utc = ms => `${new Date(ms).toISOString().slice(0, 16).replace('T', ' ')} UTC`;

// Whether a limit kept as `s` (readLimit) resets far enough from `now` to move a build stopped on it.
export const worthMoving = (s, now) => !s?.resets || Date.parse(s.resets) - now > TAKE_OVER_MS;

// What the new agent's build is told: `from` stopped on its limit, and it carries on `from`'s build of `id`.
export const takeOverMessage = (id, from, branch, base) =>
  `Ticket ${id}'s build was started by ${from}, which stopped partway on its usage limit, so speck run has moved it to you: you carry on ${from}'s build of ticket ${id}, in this folder on branch ${branch}. Before you change anything, read the ticket's Notes and the branch's commits (git log ${base}..HEAD), then carry on from where it left off.`;

// 0711: what the agent taking over an approved ticket's handed-back build is told as well: what the hand-back was for, in
// the words `from` was given (handBackOf), and, when those steps merge the base branch, to look for a merge `from` left
// unfinished before starting one.
export const handBackTakeOver = (from, h) =>
  `${from} stopped while carrying out speck run's hand-back of this approved ticket. It had been told:\n${h.message}${h.merges ? `\n${from} may have stopped partway through the merge those steps make, so before you follow them, check for an unfinished merge with git status: if one is in progress, don't start another, but finish it as those steps say.` : ''}`;

// The Notes line saying `to` took over from `from` at `now`, `s` being the limit it stopped on.
export const takeOverNote = (from, to, s, now) =>
  `- Builder: ${to} took over this build from ${from} at ${utc(now)}, because ${from}'s usage limit was reached ${s?.resets ? `until ${utc(Date.parse(s.resets))}, more than an hour away` : 'with no reset time known'}.`;

// 0711: commits the ticket's new `text`, in place of `raw`, on the branch checked out at `at` while a merge is unfinished
// there, which git's own commit refuses: made on the branch's last commit, the branch moved on to it and the ticket's
// index entry and file with it, so the merge is left as it was and its commit takes the ticket along. Only while the
// ticket is as that commit has it, in the merge too, so the commit holds speck's own change and nothing else, as git's
// commit hooks don't run for it. Throws, changing nothing, when it can't.
function commitDuringMerge(at, file, raw, text, message) {
  const rel = path.relative(at, file).split(path.sep).join('/');
  const git = (args, opts = {}) => {
    const r = sh('git', args, { cwd: at, ...opts });
    if (r.status !== 0) throw new SpeckError(`git ${args[0]} failed: ${(r.stderr || '').trim().split('\n')[0]}`);
    return r.stdout.trim();
  };
  const hash = (s, write = false) => git(['hash-object', ...(write ? ['-w'] : []), `--path=${rel}`, '--stdin'], { input: s });
  const head = git(['rev-parse', '--verify', 'HEAD^{commit}']), [mode, , was] = git(['ls-tree', head, '--', rel]).split('\t')[0].split(' ');
  const staged = sh('git', ['rev-parse', '-q', '--verify', `:0:${rel}`], { cwd: at }).stdout.trim();
  if (!was || staged !== was || hash(raw) !== was) throw new SpeckError('it has changes in the unfinished merge');
  const blob = hash(text, true), index = path.resolve(at, git(['rev-parse', '--git-path', 'speck-take-over.index'])), env = { ...process.env, GIT_INDEX_FILE: index };
  let tree;
  try {
    git(['read-tree', head], { env });
    git(['update-index', '--cacheinfo', `${mode},${blob},${rel}`], { env });
    tree = git(['write-tree'], { env });
  } finally { fs.rmSync(index, { force: true }); }
  const commit = git(['commit-tree', tree, '-p', head, '-m', message]);
  git(['update-ref', '-m', `commit: ${message}`, 'HEAD', commit, head]);
  try { git(['update-index', '--cacheinfo', `${mode},${blob},${rel}`]); fs.writeFileSync(file, text); }
  catch (e) {
    sh('git', ['update-ref', '-m', 'speck: take-over undone', 'HEAD', head, commit], { cwd: at });
    sh('git', ['update-index', '--cacheinfo', `${mode},${was},${rel}`], { cwd: at });
    throw e;
  }
  return { status: 0, stdout: '', stderr: '' };
}

// Sets ticket `id`'s builder to `agent` and adds `line` to its Notes where its build left it: its branch, or the base
// branch for a ticket not yet started. Commits only the ticket there. { at, branch } once that's done, or { why }.
// 0711: on its branch with a merge unfinished, as a handed-back build may leave one, under that merge (commitDuringMerge).
export function recordTakeOver(repo, cfg, id, agent, line) {
  const { at, t } = buildTicket(repo, cfg, id);
  const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: at }).stdout.trim();
  if (branch !== cfg.base_branch && !branch.startsWith(`${cfg.branch_prefix}${id}-`))
    return { why: `the checkout at ${at} is on ${branch || 'no branch'}, not ${id}'s branch or ${cfg.base_branch}, so the new builder can't be committed` };
  const own = branch === cfg.base_branch && sh('git', ['branch', '--list', `${cfg.branch_prefix}${id}-*`], { cwd: at }).stdout.trim().replace(/^[*+]?\s*/, '');
  if (own) return { why: `its branch, ${own}, isn't checked out in any folder, so the new builder can't carry it on` };
  let text;
  try { text = syncHeader(standInText(replaceSection(t.raw, 'Notes', old => (old ? `${old}\n${line}` : line), path.relative(at, t.file)), t.fm, agent)); } // 0659
  catch (e) { return { why: e.message.replace(/\.$/, '') }; }
  const message = `speck(${id}): ${agent} takes over the build`;
  const merging = branch !== cfg.base_branch && sh('git', ['rev-parse', '-q', '--verify', 'MERGE_HEAD'], { cwd: at }).status === 0;
  let commit;
  try {
    if (merging) commit = commitDuringMerge(at, t.file, t.raw, text, message);
    else { fs.writeFileSync(t.file, text); commit = commitTicketOnly(at, t.file, t.raw, message); }
  } catch (e) { commit = { status: 1, stderr: e.message }; try { fs.writeFileSync(t.file, t.raw); } catch { /* never written */ } }
  if (commit.status !== 0) return { why: `its ticket couldn't be committed (${(commit.stderr || commit.stdout || '').trim().split('\n').pop()})` };
  return { at, branch };
}

// speck run's side: takeOver(agent, id, rec, current, s) for a build of ticket `id` that stopped on `agent`'s limit,
// kept as `s`, with run record `rec` and speck run's `current` settings. null when it waits for the reset, otherwise
// a function that starts its build on the new agent, called once the build is no longer kept as waiting. Who took it
// over is chosen, and recorded on the ticket, before that. Why one can't move is said once per ticket and reason.
export function buildTakeOver({ repo, runs, startBuild, heldAgent, readyAgents, speak, countStop = () => '', now = Date.now,
  providers = () => knownProviders(repo), installed = onPath, chat, record = recordTakeOver }) {
  const said = new Map();
  const once = (id, why) => { if (said.get(id) !== why) speak(why); said.set(id, why); };
  return (agent, id, rec, { cfg }, s) => {
    const t0 = now();
    if (!worthMoving(s, t0)) return null;
    const known = providers();
    let ready = [];
    try { ready = readyAgents(); } catch { /* none can be read: it waits for the reset */ }
    ready = (Array.isArray(ready) ? ready : []).filter(a => typeof a === 'string' && a !== agent);
    let fm, choice;
    try {
      fm = buildTicket(repo, cfg, id).t.fm;
      choice = standInFor(cfg, fm, { own: configBuilder(cfg), ready, held: heldAgent, providers: known, plan: a => buildPlan(cfg, { id, builder: a }, installed, { repo, providers: known }) });
    } catch (e) { once(id, `${id}: its build stopped on ${nameOf(agent, known)}'s usage limit, but it can't move to builder_bench: ${e.message}`); return null; }
    if (!choice.agent) return null; // it waits for the reset, as 0622's message has said
    const to = choice.agent, from = nameOf(agent, known);
    // 0711: an approved ticket's build here is a handed-back one (inHand, usage-limit.mjs): the new agent is told what for.
    const handBack = fm.status === 'approved' ? handBackOf(rec, id, cfg.base_branch) : null;
    if (fm.status === 'approved' && !handBack) { once(id, `${id}: its handed-back build stopped on ${from}'s usage limit, but its run record doesn't say what it was handed back for, so ${nameOf(to, known)} can't be told and it waits for the reset.`); return null; }
    const plan = launchPlan(cfg, standInTicket({ ...fm, id }, to), { command: '', words: [], repo, failed: new Map(), installed, ...(chat ? { chat } : {}) });
    if (!plan) { once(id, `${id}: its build stopped on ${from}'s usage limit, but ${nameOf(to, known)} couldn't be started for it, so it waits for the reset.`); return null; }
    const done = record(repo, cfg, id, to, takeOverNote(from, nameOf(to, known), s, t0));
    if (done.why) { once(id, `${id}: its build stopped on ${from}'s usage limit, but ${nameOf(to, known)} can't take it over: ${done.why}. It waits for the reset.`); return null; }
    said.delete(id);
    return () => {
      const note = countStop(repo, id); // while its record still has the exit it stopped with
      if (note) console.log(`${id}:${note}`);
      const tag = plan.tag, session = plan.agent === 'codex' ? null : tag, message = `${takeOverMessage(id, from, done.branch, cfg.base_branch)}${handBack ? `\n${handBackTakeOver(from, handBack)}` : ''}`;
      const argv = plan.words.map(w => (w.includes('{id}') ? `${w.replace(/\{id\}/g, id)}: ${message}` : w.replace(/\{session\}/g, tag)));
      const own = plan.agent === 'codex' ? { agent: 'codex', env_session: tag } : { agent: plan.agent };
      const kept = newBuildKeeps(runs(), id), took_over = { from: agent, at: new Date(t0).toISOString() };
      speak(`${id}: ${from}'s usage limit is reached ${s?.resets ? `until ${utc(Date.parse(s.resets))}` : 'with no reset time known'}, so ${nameOf(to, known)}, the first agent on builder_bench that's ready and free, carries on its build.`);
      return startBuild(id, argv, done.at, session, 'w', pid => `${JSON.stringify({ id, session, ...own, cwd: done.at, started: new Date(t0).toISOString(), pid, command: argv, took_over, ...handBackKeeps(rec), ...kept }, null, 2)}\n`, tag); // 0711: its hand-backs. 0726: false when no machine slot
    };
  };
}
