// speck close: write the review and delivery logs, set approved and commit, once the reviewer has approved.

import fs from 'node:fs';
import path from 'node:path';
import { SpeckError, sh, git, findRepoRoot, loadConfig, findTicket, changedLines, posix, writeField } from './core.mjs';
import { rounds, ticketNext } from './review.mjs';
import { changesAsked } from './changes-asked.mjs';
import { who, reviewTotals, roundsLine } from './pack.mjs';
import { prMode, openAndKeep } from './pull-request.mjs';
import { tildePaths } from './private-words.mjs';

// ---------- close (write the logs, set approved and commit, once the reviewer has approved) ----------

// Replaces the body of a `## <name>` section, or throws a plain error if the ticket has no such section.
export function replaceSection(text, name, body, where) {
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
    return `Round ${r.meta.round} (${r.meta.reviewer}${r.meta.merge ? ', merge round' : ''}${r.meta.extra ? ', extra round' : ''}): ${r.verdict.verdict.replace(/_/g, ' ')}${fresh.length ? `: ${fresh.map(f => `${f.id ?? '?'} ${firstSentence(f.issue ?? '')}`).join('; ')}` : ''}.`
      .replace(/\.\.$/, '.');
  });
}

// 0356: the round lines with each change the user asked for kept after the round it followed.
function withChanges(lines, asked) {
  const out = [];
  lines.forEach((line, i) => { out.push(line); for (const c of asked) if (c.after === i + 1) out.push(c.line); });
  return [...out, ...asked.filter(c => c.after < 1 || c.after > lines.length).map(c => c.line)];
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
// `from` is where the ticket was before, when it has just been moved between speck/tickets/ and its done/ folder: a
// copy there that git knows about is committed as removed, so the commit records the move.
// If the commit fails, the file goes back to `original` at `from` and each index entry back exactly as it was (staged
// content kept, or out of the index if it was never added). Returns the failing git result, or { status: 0 }.
export function commitTicketOnly(repo, file, original, message, from = file) {
  const rel = path.relative(repo, file), old = path.relative(repo, from);
  const entryOf = p => git(['ls-files', '-s', '--', p], repo).trim().split('\t')[0].split(' ');
  const entry = entryOf(rel), oldEntry = old !== rel ? entryOf(old) : [];
  const paths = oldEntry.length === 3 ? [rel, old] : [rel];
  const staged = sh('git', ['add', '-A', '--', ...paths], { cwd: repo });
  const commit = staged.status === 0 ? sh('git', ['commit', '-q', '-m', message, '--', ...paths], { cwd: repo }) : staged;
  if (commit.status !== 0) {
    if (old !== rel) fs.renameSync(file, from);
    fs.writeFileSync(from, original);
    if (entry.length === 3) sh('git', ['update-index', '--cacheinfo', `${entry[0]},${entry[1]},${rel}`], { cwd: repo });
    else sh('git', ['reset', '-q', '--', rel], { cwd: repo });
    if (oldEntry.length === 3) sh('git', ['update-index', '--add', '--cacheinfo', `${oldEntry[0]},${oldEntry[1]},${old}`], { cwd: repo });
  }
  return commit;
}

export function cmdClose(args) {
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
  const next = ticketNext(t.raw, all, cfg);
  if (next.action !== 'ship')
    throw new SpeckError(`The review loop says "${next.action}", not "ship"${next.reason ? `: ${next.reason}` : ''}. Close the build once the reviewer has approved.`);
  const outside = changesOutside(repo, rel);
  if (outside.length)
    throw new SpeckError(`These files have uncommitted changes outside the ticket: ${outside.join(', ')}. Commit or remove them (the reviewer must see them first), then run this again.`);

  // Timed to this approval: an `approved` time in the ticket is from an earlier one.
  const { tokens, elapsed } = reviewTotals(t, all, new Date());
  const diff = changedLines(repo, cfg.base_branch);
  const figures = [
    `- ${roundsLine(all)}`,
    `- Reviewer: ${who(all[all.length - 1].meta)}`,
    `- Reviewer tokens: ${tokens}`,
    `- ${elapsed}`,
    `- Changed lines: ${diff.total} (limit ${cfg.limits.max_changed_lines})`,
  ].join('\n');
  let text = replaceSection(t.raw, 'Review log', () => withChanges(reviewLogLines(all), changesAsked(t.raw)).join('\n'), rel);
  // A re-review after merging the base branch closes again, so figures from an earlier close are replaced, not repeated.
  const fresh = old => old.replace(/^- (Review rounds|Reviewer|Reviewer tokens|Elapsed since build started|Elapsed|Changed lines): .*(\n|$)/gm, '').trim();
  text = replaceSection(text, 'Delivery log', old => `${figures}${fresh(old) ? `\n${fresh(old)}` : ''}`, rel);
  const original = t.raw;
  t.raw = tildePaths(text); // 0506: the logs, notes and self-check write a path under the home folder as a `~/` path
  writeField(t, 'status', 'approved');
  // Only the ticket file is committed, so nothing else can ride along with the approval.
  const commit = commitTicketOnly(repo, t.file, original, `speck(${pad}): approved`);
  if (commit.status !== 0)
    throw new SpeckError(`Couldn't commit the ticket, so nothing was changed.\n${(commit.stderr || commit.stdout || '').trim().split('\n').slice(-5).join('\n')}`);
  if (!prMode(cfg)) return console.log(`${pad} approved, committed as speck(${pad}): approved. Next: speck ship ${pad} --auto (or /speck-ship ${pad}).`);
  // 0295: in pull request mode, approval opens the ticket's pull request. A failure leaves it approved, with nothing merged.
  console.log(`${pad} approved, committed as speck(${pad}): approved. ship_mode is pr, so speck is opening its pull request.`);
  try {
    const pr = openAndKeep(repo, cfg, pad);
    console.log(`${pr.found ? 'Its pull request was already open' : 'Opened its pull request'}: ${pr.url}`);
  } catch (e) {
    if (!(e instanceof SpeckError)) throw e;
    console.log(e.opened ? `${e.message.split('\n')[0]} The ticket stays approved and nothing was merged.`
      : `No pull request yet: ${e.message.split('\n')[0]} The ticket stays approved and nothing was merged. speck run tries again, or run \`speck pr ${pad}\`.`);
  }
}
