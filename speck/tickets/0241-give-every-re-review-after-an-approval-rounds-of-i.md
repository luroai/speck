---
id: "0241"
title: "Give every re-review after an approval rounds of its own"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-16-give-a-handed-back-ticket-s-re-review-rounds-of-its-own.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T08:07:24.979Z"

---
# 0241 · Give every re-review after an approval rounds of its own

**Status:** 🔍 reviewing

## Problem
When a ticket's ship is refused after approval and the builder fixes it without merging anything new from the base branch (for example a test its own change broke), its re-review counts towards `max_review_rounds`. A ticket approved in its last allowed round then blocks on a tiny fix, as 0223 did on a three-line rename, and only the user can unblock it.

## Outcome
Every review round that follows an approved round has rounds of its own, whether or not the branch merged the base branch in.

## Acceptance criteria
1. A review round whose previous round approved is a merge round, whether or not the branch merged the base branch in since that round. Like every merge round today, it and the rounds after it until one approves don't count towards `max_review_rounds` and are capped by `limits.max_merge_rounds`. This holds for rounds run with `speck review` and rounds saved with `speck record`.
2. For example, with `max_review_rounds: 3`, a ticket approved in round 3 whose code then changes, with no merge, can have round 4 reviewed and approved, and `speck next` then says `ship`.
3. When the branch didn't merge the base branch in, the reviewer is given the changes since its last review, as in any later round, and isn't told that the round follows a merge.
4. The brief's "Merge rounds" paragraph says a round is a merge round whenever the round before it approved. No test that passed before this change fails, except checks that a round after an approval without a merge counts towards `max_review_rounds`, which are changed to check AC1.

## Out of scope
- One extra review round for a ticket that reaches the round limit one finding from approval (0242).
- Renaming merge rounds, or changing how they're marked in the Review rounds, the review log or the review pack.
- Any change to rounds that don't follow an approval.

## Notes
- The rule is `isMergeRound()` in `scripts/review.mjs`, which today also needs `merged` from `reviewSince()`; `speck record` works it out on its own path in the same file. 0097 set today's rule.
- Seen on 0223 (2026-10-16): its ship failed on a test its own change broke while main hadn't moved, so there was nothing to merge.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes. Noted that `speck next`'s block reason after max_merge_rounds still says "re-reviewing the merge of" the base branch, which reads oddly for a run with no merge (wording, left as a follow-up).

## In plain words
When a ticket has been approved but can't ship straight away and needs a small change, its re-review no longer uses up its ordinary review rounds. Before, this only held when the fix involved bringing in newer work from the main line; a fix to the ticket's own code counted as an ordinary round, so a ticket approved in its last allowed round got stuck and needed you to unblock it. Now any re-review after an approval has its own small allowance (two rounds in a row by default), as re-reviews after a conflict already did. You'll see such rounds labelled "merge round" in the ticket's review history and review pack, even when nothing was merged, which is worth knowing when you read them.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
- Follow-ups:
  - Inbox: speck/ideas/2026-10-16-say-what-a-merge-round-run-re-reviewed-when-it-blocks.md (the block reason after max_merge_rounds still says the run re-reviewed a merge).
  - Known limit: rounds after an approval are still called "merge rounds" even with no merge; renaming them was out of scope.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "e16c217a653d3c86328684accdc4f02a01cd76cd",
    "thread_id": "01a143c2-a0c8-7f33-9fdb-638b06bfbe7c",
    "seconds": 25,
    "usage": {
      "input_tokens": 99422,
      "cached_input_tokens": 59776,
      "cache_write_input_tokens": 0,
      "output_tokens": 546,
      "reasoning_output_tokens": 0
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T08:10:15.591Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/review.mjs: isMergeRound(), reviewSetup() and cmdRecord() apply the same post-approval classification. Existing mergeRun() and nextAction() enforce separate limits. Passing 0241 AC1 tests exercise review, record, continuation and the merge-round cap."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0241 AC2 integration test records approval in round 3, changes code without merging, runs round 4 successfully and verifies next says ship."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "reviewSince() and reviewerPrompt() still use actual merge detection independently of round classification. Passing 0241 AC3 tests capture the reviewer prompt and verify the incremental diff without merge wording, plus preserved behaviour after a merge."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md's Merge rounds paragraph states the required rule, covered by the passing 0241 AC4 test. The full saved output confirms all 20 tests in the two affected test files passed. Changes to existing expectations match the authorised behaviour change."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Fixes after approval now get their own review allowance even when no base-branch merge occurred. The separate cap still applies, and reviewers receive the appropriate changes without misleading merge wording. All 20 targeted tests passed; no blocking concerns found."
  }
}
```

</details>
