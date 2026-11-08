// Whether a ticket's acceptance criteria are still the ones it was set ready with (0565): a ticket whose build changed
// them doesn't ship by itself, and its review pack shows what changed.

import { SpeckError, sh, git, forkPoint, parseTicket, ticketBranches, padId } from './core.mjs';

// Each acceptance criterion's full text without its number: a numbered line at the start of a line begins one, and
// the lines under it (wrapped text, nested lists) belong to it, so a multi-line criterion comes through whole.
export function criteriaText(lines = []) {
  const items = [];
  for (const line of lines.join('\n').replace(/<!--[\s\S]*?-->/g, '').split('\n')) {
    const m = line.match(/^\d+\.\s+(\S.*)$/);
    if (m) items.push([m[1]]);
    else if (items.length) items[items.length - 1].push(line);
  }
  return items.map(l => l.join('\n').replace(/\s+$/, ''));
}

// The ticket's sections as `ref` has them, or null when it has no such ticket. It's looked for by its id, so renaming
// its file doesn't hide it.
function sectionsAt(repo, ref, pad) {
  const name = git(['ls-tree', '-r', '--name-only', '--full-tree', ref, '--', 'speck/tickets/'], repo).split('\n').find(f => f.startsWith(`speck/tickets/${pad}-`) && f.endsWith('.md'));
  if (!name) return null;
  const shown = sh('git', ['show', `${ref}:${name}`], { cwd: repo });
  return shown.status === 0 ? parseTicket(shown.stdout).sections['acceptance criteria'] ?? [] : null;
}

// Which criteria differ. One whose words are still there is the same criterion, wherever it moved to. The rest are
// paired in order: both sides left is a changed one, and what's over was added or removed.
function changedCriteria(before, now) {
  const left = before.map((text, i) => ({ n: i + 1, text }));
  const fresh = now.map((text, i) => ({ n: i + 1, text })).filter(c => {
    const same = left.findIndex(b => b.text === c.text);
    if (same >= 0) left.splice(same, 1);
    return same < 0;
  });
  const paired = Math.min(left.length, fresh.length);
  return [
    ...fresh.slice(0, paired).map((c, i) => ({ n: c.n, change: 'changed', before: left[i].text, now: c.text })),
    ...fresh.slice(paired).map(c => ({ n: c.n, change: 'added', before: null, now: c.text })),
    ...left.slice(paired).map(c => ({ n: c.n, change: 'removed', before: c.text, now: null })),
  ];
}

// The commit a branch started from: the parent of the oldest commit on its own line. Merging the base branch in later
// doesn't move it, as it does the merge-base. A branch with no commits of its own left has been merged: forkPoint knows.
function branchStart(repo, base, branch) {
  const own = git(['rev-list', '--first-parent', branch, '--not', base], repo).split('\n').filter(Boolean);
  return own.length ? `${own.at(-1)}^` : forkPoint(repo, base, branch);
}

// What changed in the ticket's Acceptance criteria section, between the base branch where its branch started and its
// branch, or null when nothing did or there's nothing to compare: no branch, or no copy of the ticket on either side,
// as for a ticket that isn't being built. Ends of lines aside, any difference counts, even one that leaves every
// criterion's words alone, when `items` is empty.
export function criteriaChange(repo, cfg, id) {
  const pad = padId(id);
  try {
    const [branch] = ticketBranches(repo, cfg, pad);
    if (!branch) return null;
    const was = sectionsAt(repo, branchStart(repo, cfg.base_branch, branch), pad), is = sectionsAt(repo, branch, pad);
    if (!was || !is) return null;
    const text = lines => lines.map(l => l.replace(/\s+$/, '')).join('\n');
    if (text(was) === text(is)) return null;
    const clean = lines => criteriaText(lines).map(c => text(c.split('\n')));
    return { before: text(was).trim(), now: text(is).trim(), items: changedCriteria(clean(was), clean(is)) };
  } catch (e) {
    if (e instanceof SpeckError) return null; // git can't say: ship and the pack report any real trouble themselves
    throw e;
  }
}

const cell = text => (text === null || text === '' ? '(none)' : text.replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|'));

// The review pack's Criteria changed part for `change`, or no lines when it's null.
export function criteriaChangedLines(change) {
  if (!change) return [];
  const rows = change.items.length ? change.items.map(c => [c.n, c.change, c.before, c.now]) : [['', 'order or layout', change.before, change.now]];
  return ['', '### Criteria changed', "These aren't the acceptance criteria this ticket was set ready with, so it doesn't ship by itself.", '',
    '| # | Change | Set ready with | Now |', '|---|---|---|---|',
    ...rows.map(([n, what, before, now]) => `| ${n} | ${what} | ${cell(before)} | ${cell(now)} |`)];
}
