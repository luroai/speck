// The limits on review rounds, split from review.mjs: which rounds are merge rounds (0097), the extra round (0242), the
// rounds your answer allows past max_review_rounds (0680), and what the builder must do next.
import { SpeckError, parseTicket } from './core.mjs';

export const openBlocking = v => v.findings.filter(f => f.severity === 'blocking' && ['open', 'dispute_rejected'].includes(f.state));

// A merge round re-reviews a change made after an approval, such as a merge of the base branch or a fix for a refused
// ship: the round after an approved one, whether or not the branch merged the base branch in since, and each round
// after that until one approves. Merge rounds don't count towards max_review_rounds.
export function isMergeRound(prior) {
  const last = prior[prior.length - 1];
  if (!last) return false;
  return last.verdict.verdict === 'approve' || last.meta?.merge === true;
}

// The merge rounds in a row at the end of `all` since the last approval before them: the ones max_merge_rounds caps.
export function mergeRun(all) {
  let n = 0;
  for (let i = all.length - 1; i >= 0 && all[i].meta?.merge && !(n && all[i].verdict.verdict === 'approve'); i--) n++;
  return n;
}

export const ordinaryRounds = all => all.filter(r => !r.meta?.merge).length;

// 0242: a ticket whose ordinary round at max_review_rounds asked for changes with no more than one blocking finding
// open gets one extra round. It's only ever the round right after that one, so a ticket gets at most one.
export function extraRoundDue(all, cfg) {
  const last = all[all.length - 1];
  return !!last && !last.meta?.merge && ordinaryRounds(all) === cfg.limits.max_review_rounds
    && last.verdict.verdict === 'changes_requested' && openBlocking(last.verdict).length <= 1;
}

// 0680: each answer you give to a question a build asked at the review limit (`Review limit: yes`) allows this many more
// rounds. It's noted in the ticket's Notes with ALLOWED_LINE's words, which only your answer writes: the Go with the
// recommendation button and `speck answer` (or the panel's Answer). limits.max_review_rounds is left as it is.
export const ROUNDS_ALLOWED = 2;
export const allowedLine = (who, when) => `- Review limit: ${who} allowed ${ROUNDS_ALLOWED} more review rounds (${when}).`;
const ALLOWED_LINE = new RegExp(`^\\s*[-*]\\s+Review limit: .+ allowed ${ROUNDS_ALLOWED} more review rounds\\b`);
// How many rounds past the limit a ticket's answers allow, from its text: ROUNDS_ALLOWED for each line in its Notes.
export function allowedRounds(raw) {
  let notes = [];
  try { notes = parseTicket(String(raw ?? '')).sections.notes || []; } catch { return 0; }
  return notes.filter(line => ALLOWED_LINE.test(line)).length * ROUNDS_ALLOWED;
}
const allowedUsed = all => all.filter(r => !r.meta?.merge && r.meta?.allowed).length;

// What the next ordinary round is: { extra } for the extra one (0242), { allowed } for one your answer allowed (0680),
// or neither, refusing it when max_review_rounds is used up and neither is due. `allowed` is allowedRounds(the ticket).
// `speck review` and `speck record` both check this before a reviewer runs or a round is saved.
export function extraRound(prior, cfg, merge, allowed = 0) {
  const past = !merge && ordinaryRounds(prior) >= cfg.limits.max_review_rounds;
  if (past && nextAction(prior, cfg, allowed).action !== 'fix') {
    const used = allowedUsed(prior);
    throw new SpeckError(`Max review rounds (${cfg.limits.max_review_rounds}) reached${prior.at(-1)?.meta?.extra ? ', and the extra round too' : ''}${used ? `, and the ${used} you allowed` : ''}. Block the ticket. Add Review limit: yes beside its question, so the user's answer can allow more rounds.`, 3);
  }
  if (!past) return { extra: false, allowed: false };
  return extraRoundDue(prior, cfg) ? { extra: true, allowed: false } : { extra: false, allowed: true };
}

// Decide what the builder must do next, given all rounds so far. 0680: `allowed` is how many rounds past the limit your
// answers allow (allowedRounds).
export function nextAction(all, cfg, allowed = 0) {
  const last = all[all.length - 1];
  if (!last) return { action: 'review' };
  const v = last.verdict;
  if (v.verdict === 'approve') return { action: 'ship' };
  if (v.verdict === 'escalate') {
    // 0763: an escalation at the review limit that your answer allowed more rounds for goes on to them. An answer
    // allows ROUNDS_ALLOWED, so an escalation counts as answered only when that many are left: fewer is what was left
    // over from an earlier answer, not this one.
    const answered = !last.meta?.merge && ordinaryRounds(all) >= cfg.limits.max_review_rounds && allowed - allowedUsed(all) >= ROUNDS_ALLOWED;
    if (!answered) return { action: 'block', reason: v.escalation_question || 'Reviewer escalated.' };
    return { action: 'fix' };
  }
  const n = cfg.limits.escalate_after_repeat_disputes;
  if (all.length >= n) {
    const recent = all.slice(-n).map(r => new Set(r.verdict.findings.filter(f => f.state === 'dispute_rejected').map(f => f.id)));
    const repeated = [...recent[0]].filter(id => recent.every(s => s.has(id)));
    if (repeated.length) return { action: 'block', reason: `Builder and reviewer disagree on ${repeated.join(', ')} for ${n} rounds in a row. Needs your decision.` };
  }
  if (last.meta?.merge) {
    const run = mergeRun(all);
    if (run >= cfg.limits.max_merge_rounds) return { action: 'block', reason: `No approval after ${run} merge rounds in a row re-reviewing the merge of ${cfg.base_branch || 'the base branch'} (limits.max_merge_rounds).` };
  } else if (ordinaryRounds(all) >= cfg.limits.max_review_rounds && !extraRoundDue(all, cfg) && allowedUsed(all) >= allowed) {
    const used = allowedUsed(all);
    return { action: 'block', reason: `No approval after ${ordinaryRounds(all)} review rounds${used ? `, ${used} of them ${used === 1 ? 'a round' : 'rounds'} you allowed` : last.meta?.extra ? ', the last of them an extra round' : ''}.` };
  }
  return { action: 'fix' };
}

