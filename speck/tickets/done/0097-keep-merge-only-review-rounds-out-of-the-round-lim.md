---
id: "0097"
title: "Keep merge-only review rounds out of the round limit"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-a-shipping-agent-that-heals-the-build.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T18:38:16.364Z"
finished: "2026-10-10T21:55:21.154Z"

---
# 0097 · Keep merge-only review rounds out of the round limit

**Status:** ✅ done

## Problem
When an approved ticket has to merge the base branch in before it can ship, the reviewer checks the merge in another round, and that round counts towards `max_review_rounds`. A ticket approved in its last allowed round then can't be re-reviewed at all, as 0086 found on 2026-10-10, and someone has to raise the limit by hand.

## Outcome
A review round that checks only a merge after an approval doesn't count towards `max_review_rounds`. Merge rounds have a small limit of their own.

## Acceptance criteria
1. A round is a merge round when the branch merged the base branch in since the previous round and that previous round approved. `speck review` and `speck next` don't count merge rounds towards `max_review_rounds`.
2. A new setting, `limits.max_merge_rounds` (default 2), caps merge rounds in a row. When it's reached without an approval, `speck next` says `block` with a plain reason. `speck config set` accepts it like the other limits.
3. The ticket's Review rounds, its review log and the review pack mark merge rounds as merge rounds.
4. The rule on repeated disputes still applies across merge rounds, and ordinary rounds work as before.

## Out of scope
- Who runs the merge and the round (0101).

## Notes
- speck already detects a merge since the last round (`merged` in `reviewSince`) and tells the reviewer.
- Replaces `speck/ideas/2026-10-09-allow-one-more-review-round-without-editing-config.md`.
- Interpretation of AC1 with AC2: a merge round that doesn't approve is followed by a fix round re-reviewing the same merge. Taken strictly, AC1 would make that an ordinary round, which a ticket approved in its last allowed round can't have (the 0086 problem again), and "merge rounds in a row without an approval" could then never exceed one. So the rounds after a merge round, until one approves, are merge rounds too (`isMergeRound` in `scripts/review.mjs`), and `max_merge_rounds` caps that run. An approval ends the run, so a later merge starts a new one.
- Merge rounds are recorded as `"merge": true` in the round's meta. Rounds saved before this change have no flag and count as ordinary rounds.
- The 0048 test of the Delivery log after a merge re-review now expects `- Review rounds: 2, 1 of them a merge round`, the AC3 wording for its merge round.
- Self-check: `speck record` now looks up whether the base branch was merged in only when the previous round approved, so a record that isn't after an approval can't fail on that lookup.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 reviewSetup refuses a new merge run after the previous merge was approved on its last permitted round.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,112,009
- Elapsed since build started: 71 min
- Changed lines: 79 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox. The idea this ticket replaces, `speck/ideas/2026-10-09-allow-one-more-review-round-without-editing-config.md`, is still in the inbox; the shaping chat can move it to `speck/ideas/done/`.
- Build was interrupted once (machine out of memory with five suites running) and resumed; tests then ran with `--test-concurrency=2`.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "b73e7918ee2e738b412cb331afc643f2e3ea00a6",
    "thread_id": "01a12757-ba38-7dd3-8982-ad795ee93a28",
    "seconds": 30,
    "usage": {
      "input_tokens": 388576,
      "cached_input_tokens": 285568,
      "cache_write_input_tokens": 0,
      "output_tokens": 831,
      "reasoning_output_tokens": 55
    },
    "saved_at": "2026-10-10T19:44:12.884Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/review.mjs: isMergeRound, ordinaryRounds and nextAction exclude merge rounds from the ordinary limit. test/review-0097.test.mjs exercises real Git merges, record and command review; builder reports these tests passing."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The default and config setter are covered, and nextAction caps unsuccessful merge runs. However, reviewSetup also counts the previously approved merge run when admitting a new merge, incorrectly refusing it if the previous run reached the limit."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "roundBlock, reviewLogLines and reviewPack mark merge rounds. The AC3 integration test checks the saved ticket, pack and close-generated logs; builder reports it passing."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "nextAction retains the repeated-dispute check before either limit. AC4 tests exercise repeated disputes across merge rounds and ordinary-round limits; builder reports both passing."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/review.mjs",
        "issue": "reviewSetup refuses a new merge run after the previous merge was approved on its last permitted round. For example, ordinary approval → merge changes requested → merge approval gives mergeRun(prior) = 2. After another base merge, isMergeRound returns true, but reviewSetup rejects it against the default limit of 2. I verified these helper results with a read-only Node command. The existing reset test checks nextAction after a new round is already saved, so it misses the admission failure.",
        "suggested_fix": "When the previous round approved, treat the pending merge as a fresh run with zero consumed rounds. Preserve mergeRun's historical count for pack display. Add a command-review regression covering a second base merge after approval on the previous run's final allowed round.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Merge reviews now have separate limits and clear labels, with meaningful tests covering most behaviour. One bug still prevents a later merge from being reviewed when the previous merge used its full allowance before approval. Fix that reset before merge."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "09edf909d14de3e25ce25d2dbe924d2fa13b4582",
    "thread_id": "01a12757-ba38-7dd3-8982-ad795ee93a28",
    "seconds": 18,
    "usage": {
      "input_tokens": 721207,
      "cached_input_tokens": 552448,
      "cache_write_input_tokens": 0,
      "output_tokens": 1395,
      "reasoning_output_tokens": 55
    },
    "saved_at": "2026-10-10T19:48:53.331Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/review.mjs: isMergeRound, ordinaryRounds, reviewSetup and nextAction classify merge rounds and exclude them from max_review_rounds. AC1 tests in test/review-0097.test.mjs exercise real merges, record and command review; supplied output shows all passing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "loadConfig defaults max_merge_rounds to 2; config.mjs accepts it as a count. reviewSetup and nextAction enforce the limit and reset after approval. AC2 tests, including the new F1 regression using a second real merge and speck review, all pass in supplied output."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "roundBlock, close.mjs reviewLogLines and pack.mjs reviewPack mark merge rounds. AC3 integration tests verify ticket records, review logs and pack labels; supplied output shows them passing."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "nextAction retains repeated-dispute checks across all rounds and counts ordinary rounds separately. AC4 tests cover repeated disputes across merge rounds and ordinary-round behaviour; supplied output shows both passing."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/review.mjs",
        "issue": "Previously, a new merge was refused when the preceding merge run approved on its final allowed round. Resolved: reviewSetup now resets consumed rounds to zero after approval, while preserving historical counts for the pack. The new integration regression exercises the previously failing command path.",
        "suggested_fix": "Implemented; no further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Merge reviews now have their own configurable allowance and clear labels, without consuming ordinary review rounds. The reset bug is fixed and covered by a meaningful regression test. All acceptance criteria pass, with no remaining blocking findings."
  }
}
```

</details>
