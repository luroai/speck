// speck pack: the review pack, and the review totals the delivery log shares.

import { RISKY, SpeckError, sh, git, findRepoRoot, loadConfig, findTicket, parseTicket, lintTicket, changedLines, branchChangedLines, forkPoint, ticketBranches, contentLines, repoPath } from './core.mjs';
import { ticketsRounds, NO_INSPECT, mergeRun, ordinaryRounds } from './review.mjs';

// Whether a round continued the reviewer's session or started fresh. Command rounds record it. Codex rounds resume
// whenever an earlier round saved a session, so that rule gives theirs.
function sessionLabel(r, earlier) {
  if (r.meta.session) return `${r.meta.session} session`;
  if (r.meta.round === 1) return 'fresh session';
  if (r.meta.reviewer === 'codex') return earlier.some(p => p.meta.thread_id) ? 'continued session' : 'fresh session';
  return 'session not recorded';
}

// How many rounds there were, and how many of them re-reviewed a merge of the base branch, for the pack and the delivery log.
export function roundsLine(all) {
  const merges = all.length - ordinaryRounds(all);
  return `Review rounds: ${all.length}${merges ? `, ${merges} of them ${merges === 1 ? 'a merge round' : 'merge rounds'}` : ''}`;
}

export const who = m => `${m.reviewer}, model ${m.reviewer_model || 'default'}, effort ${m.reviewer_effort || 'default'}`;

// The reviewer tokens and elapsed time, worded for both the review pack and the delivery log. The time runs to `end`,
// or else to the ticket's approval, so a pack read later leaves out the wait to ship it (0215), or else to now.
export function reviewTotals(t, all, end) {
  const tokens = all.reduce((n, r) => n + (r.meta.usage?.input_tokens || 0) + (r.meta.usage?.output_tokens || 0), 0);
  const started = t.fm.started ? new Date(t.fm.started) : null;
  const approved = t.fm.approved ? new Date(t.fm.approved) : null;
  const until = end || (approved && !isNaN(approved) ? approved : new Date());
  return {
    tokens: tokens.toLocaleString('en-GB'),
    elapsed: started ? `Elapsed since build started: ${Math.round((until - started) / 60000)} min` : 'Elapsed: not recorded',
  };
}

// The ticket and its changes, wherever the pack is run from. On the ticket's branch: this checkout, uncommitted work
// included. Elsewhere, while the branch exists: the branch's committed changes, and its copy of the ticket, which holds
// the review rounds. Once the branch is gone: this checkout's ticket, and no changes (diff is null).
function packSource(repo, cfg, id) {
  const t = findTicket(repo, id);
  const names = ticketBranches(repo, cfg, id);
  if (names.length > 1)
    throw new SpeckError(`Found ${names.length} branches for ticket ${t.fm.id} (${names.join(', ')}). Delete the extra ones, then run this again.`);
  const branch = names[0];
  if (!branch) return { t, diff: null };
  if (git(['branch', '--show-current'], repo).trim() === branch)
    return { t, diff: changedLines(repo, cfg.base_branch, forkPoint(repo, cfg.base_branch, branch)) };
  const shown = sh('git', ['show', `${branch}:${repoPath(repo, t.file)}`], { cwd: repo });
  return { t: shown.status === 0 ? { file: t.file, ...parseTicket(shown.stdout) } : t, diff: branchChangedLines(repo, cfg.base_branch, branch) };
}

// The risk lines about the ticket's changes. Without its branch, the changed lines are the figure \`speck close\`
// recorded in the delivery log at approval, and the sensitive files can't be listed.
function changeLines(t, cfg, diff) {
  const label = 'Changed lines (excluding tests and lockfiles)';
  if (diff) {
    const risky = diff.files.map(f => f.file).filter(f => RISKY.test(f));
    return [risky.length ? `- Sensitive files touched: ${risky.map(f => `\`${f}\``).join(', ')}` : '- No sensitive file patterns touched',
      `- ${label}: ${diff.total} (limit ${cfg.limits.max_changed_lines})`];
  }
  const recorded = contentLines(t.sections['delivery log']).map(l => l.match(/^- Changed lines: (\d+)\b/)).find(Boolean);
  return ["- Sensitive files touched: can't be listed, because the ticket's branch no longer exists",
    recorded ? `- ${label}: ${recorded[1]}, as recorded at approval (limit ${cfg.limits.max_changed_lines})`
      : `- ${label}: not available, because the ticket's branch no longer exists and its delivery log has no figure`];
}

// What the reviewer was told about the tests in round `r`, as its summary of the test output said (0209): none when the
// round recorded nothing, because its test output wasn't TAP or it was recorded before speck kept this.
function testsLines(r) {
  const t = r.meta.tests;
  if (!t || !Number.isInteger(t.failing) || !Array.isArray(t.second_try)) return [];
  const again = t.second_try.length;
  return ['', '### Tests',
    `- Test output the reviewer was given in round ${r.meta.round}: ${t.failing} failing ${t.failing === 1 ? 'test' : 'tests'}${again ? `, ${again} passed on a second try` : ''}`,
    ...(again ? [`- Passed on a second try: ${t.second_try.map(n => `\`${n}\``).join(', ')}`] : [])];
}

// What reviewPack and plainPack refuse with for a ticket that has no review rounds, so the panel can tell it apart.
export const NO_ROUNDS = 'No review rounds recorded.';

export function reviewPack(repo, id) {
  const cfg = loadConfig(repo);
  const { t, diff } = packSource(repo, cfg, id);
  const all = ticketsRounds(repo, t);
  const last = all[all.length - 1];
  if (!last) throw new SpeckError(NO_ROUNDS);
  const v = last.verdict;
  const ac = lintTicket(t, cfg).acceptanceCriteria;
  const icon = { pass: '✅', fail: '❌', unclear: '⚠️' };
  const findings = all.flatMap(r => r.verdict.findings.map(f => ({ ...f, round: r.meta.round })));
  const latest = new Map(findings.map(f => [f.id, f]));
  const { tokens, elapsed } = reviewTotals(t, all);
  const blind = all.filter(r => r.meta.sandbox_ok === false);
  const lines = [
    `## ${t.fm.id} · ${t.fm.title}`,
    `**Verdict:** ${v.verdict === 'approve' ? '✅ Approved by reviewer' : `⛔ ${v.verdict}`} (${who(last.meta)}, ${last.meta.merge ? `merge round ${mergeRun(all)} of ${cfg.limits.max_merge_rounds}` : `round ${ordinaryRounds(all)} of ${cfg.limits.max_review_rounds}`})`,
    ...(blind.length ? ['', ...blind.map(r => `${NO_INSPECT} (round ${r.meta.round})`)] : []),
    '', `**Summary:** ${v.summary}`, '',
    '### Acceptance criteria', '| # | Criterion | Result | Evidence |', '|---|---|---|---|',
    ...v.criteria.map(c => `| ${c.id} | ${(ac[c.id - 1] || '').replace(/^\d+\.\s+/, '').replace(/\|/g, '\\|')} | ${icon[c.status] || c.status} | ${c.evidence.replace(/\n/g, ' ').replace(/\|/g, '\\|')} |`),
    '', '### Risk', `- Ticket risk: **${t.fm.risk}**`,
    ...changeLines(t, cfg, diff),
    ...testsLines(last),
    '', '### Review history',
    ...all.map((r, i) => {
      const f = r.verdict.findings;
      const open = f.filter(x => x.severity === 'blocking' && ['open', 'dispute_rejected'].includes(x.state)).length;
      const closed = f.filter(x => x.severity === 'blocking').length - open;
      return `- Round ${r.meta.round}${r.meta.merge ? ', merge round' : ''} (${who(r.meta)}): **${r.verdict.verdict}**, ${open} open blocking, ${closed} resolved, ${f.filter(x => x.severity === 'minor').length} minor; ${sessionLabel(r, all.slice(0, i))}`;
    }),
    ...(latest.size ? ['', '<details><summary>Findings</summary>', '',
      ...[...latest.values()].map(f => `- **${f.id}** (${f.severity}, ${f.state}) \`${f.file}\`: ${f.issue}`), '', '</details>'] : []),
    '', '### Actuals',
    `- ${roundsLine(all)}`,
    `- Reviewer tokens: ${tokens}`,
    `- ${elapsed}`,
    '', '_Generated by speck. The merge decision is yours._',
  ];
  return lines.join('\n');
}

// The text of a ticket's section, without its comments, or '' when it's missing or holds only a comment.
const sectionText = (t, name) => (t.sections[name] || []).join('\n').replace(/<!--[\s\S]*?-->/g, '').trim();

// The review pack for someone who doesn't read code: no file paths, finding ids, models, tokens or sessions,
// apart from what the ticket's own text quotes.
export function plainPack(repo, id) {
  const cfg = loadConfig(repo);
  const { t, diff } = packSource(repo, cfg, id);
  const all = ticketsRounds(repo, t);
  const last = all.at(-1);
  if (!last) throw new SpeckError(NO_ROUNDS);
  const v = last.verdict;
  const label = { pass: '✅ passed', fail: '❌ failed', unclear: '⚠️ unclear' };
  // Each numbered criterion, with any lines that continue it.
  const ac = sectionText(t, 'acceptance criteria').split('\n').map(l => l.trim()).filter(Boolean)
    .reduce((all, l) => (/^\d+\.\s/.test(l) || !all.length ? all.push(l) : all[all.length - 1] += ` ${l}`, all), []);
  const why = [t.fm.risk === 'high' && 'is marked high risk',
    diff?.files.some(f => RISKY.test(f.file)) && 'touches sensitive parts of the project, such as sign-in, secrets, payments or deployment'].filter(Boolean);
  return [
    `## ${t.fm.id} · ${t.fm.title}`, '',
    v.verdict === 'approve' ? 'The reviewer approved this change.' : "The reviewer hasn't approved this change yet.",
    ...(why.length ? ['', `This change ${why.join(' and ')}, so it's worth a closer look before you ship it.`] : []),
    // Any round the full pack marks with NO_INSPECT (0222).
    ...(all.some(r => r.meta.sandbox_ok === false) ? ['', 'In at least one review round, the reviewer could only see the change itself, not the rest of the code.'] : []),
    '', '### What it should do', sectionText(t, 'outcome') || "The ticket doesn't say.",
    '', '### In plain words', sectionText(t, 'in plain words') || "The builder didn't write this change up in plain words.",
    '', '### Did it do what was asked?',
    ...ac.map((c, i) => `${i + 1}. ${label[v.criteria.find(x => x.id === i + 1)?.status] || label.unclear}: ${c.replace(/^\d+\.\s+/, '')}`),
  ].join('\n');
}

export function cmdPack(args) {
  if (args.includes('--plain')) console.log(plainPack(findRepoRoot(), args.find(a => a !== '--plain')));
  else console.log(reviewPack(findRepoRoot(), args[0]));
}
