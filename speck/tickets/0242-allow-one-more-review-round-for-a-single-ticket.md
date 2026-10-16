---
id: "0242"
title: "Give a ticket one extra review round when it's one finding from approval"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-allow-one-more-review-round-without-editing-config.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0241"]                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T08:17:30.815Z"

---
# 0242 · Give a ticket one extra review round when it's one finding from approval

**Status:** 🔍 reviewing

## Problem
A build that reaches the review round limit blocks, even when the reviewer has only one finding left. The user then has to step in just to allow one more round, which means raising `limits.max_review_rounds` in `speck/config.yml` for every ticket and putting it back. It happened on 0218 on 2026-10-16, and on 0008, 0011 and 0061 before.

## Outcome
A ticket that's one finding from approval at the round limit gets one more review round by itself, and blocks only if that round doesn't approve.

## Acceptance criteria
1. When a ticket's review rounds that count towards `max_review_rounds` reach it, and the last of them didn't approve but left no more than one blocking finding open, `speck next` says `fix` instead of `block`, and `speck review` and `speck record` accept one more round: the extra round.
2. A ticket gets at most one extra round. If the extra round doesn't approve, `speck next` says `block`. A round at the limit that left two or more blocking findings open blocks as today, and so does an escalation or a repeated dispute, whether or not it's in the extra round.
3. The review pack names the extra round (for example "round 4 of 3, an extra round"), and the ticket's Delivery log, written by `speck close`, says when the ticket had one.
4. The build and review skills say the builder takes the extra round like any other, without asking the user, and never changes `limits.max_review_rounds` in `speck/config.yml` to get past a block.
5. No test that passed before this change fails, except checks that a ticket blocks at `max_review_rounds` with no more than one blocking finding open, which are changed to check AC1.

## Out of scope
- A panel button, a setting or a ticket field for extra rounds.
- Extra merge rounds (`max_merge_rounds`).
- How re-reviews after an approval are counted (0241).

## Notes
- Asked for 2026-10-16: "if it warrants an extra round it should be done automatically, then if we need another after that, then the ticket stops." "Warrants" is read as the round at the limit leaving no more than one blocking finding open.
- The limit is applied in `reviewSetup()` and `nextAction()` in `scripts/review.mjs`, and shown in `scripts/pack.mjs`; the Delivery log's rounds line is `reviewTotals()` in `scripts/pack.mjs`, written by `scripts/close.mjs`.
- 0218 would have qualified: its round 3 left one blocking finding (F2) open.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes

## In plain words
When a ticket reaches its review round limit with only one problem (or none) left for the reviewer, it now gets one more review round by itself instead of stopping to wait for you. If that extra round doesn't approve it, the ticket stops and asks you as before, and a ticket gets only one extra round. You no longer need to raise the round limit for everyone just to let one ticket finish.

To see it, look at a ticket's review pack: an extra round shows as, for example, "round 4 of 3, an extra round", and the ticket's delivery log says which round it was.

Worth keeping an eye on: tickets with two or more open problems at the limit, or where the reviewer escalates or the builder and reviewer keep disagreeing, still stop at the limit as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
- Follow-ups:
  - `speck record` doesn't check `max_merge_rounds`, so a subagent reviewer can record merge rounds past it: saved to the inbox as speck/ideas/2026-10-16-make-speck-record-respect-max-merge-rounds.md.

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
    "reviewed_sha": "b3d6f29c805961ebca8bae012009decbb770c38a",
    "thread_id": "01a143cf-b5f7-7fc3-8228-223fe89ab299",
    "seconds": 31,
    "usage": {
      "input_tokens": 153592,
      "cached_input_tokens": 108672,
      "cache_write_input_tokens": 0,
      "output_tokens": 766,
      "reasoning_output_tokens": 32
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T08:24:39.690Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "extraRoundDue(), nextAction() and reviewSetup() allow the qualifying extra round. Reported passing AC1 tests exercise next, review and record."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "cmdRecord() in scripts/review.mjs:346–364 saves further rounds without checking eligibility. Tests cover refusal by review, but not record."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "pack.mjs and close.mjs display meta.extra; passing AC3 tests check the review pack and Delivery log written by close."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Both skills explicitly require taking the extra round without asking and prohibit changing max_review_rounds. Covered by the passing AC4 test."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "All 63 selected tests reportedly passed. Existing expectation changes match the exception permitted by AC5; no unrelated changes found."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/review.mjs:358",
        "issue": "speck record accepts unlimited extra rounds. With max_review_rounds set to 1, record a changes_requested round, then an unsuccessful extra round, then an approval: cmdRecord saves all three and nextAction returns ship. It also accepts an extra round after two open blocking findings or an escalation because it never checks eligibility.",
        "suggested_fix": "Check ordinary-round eligibility before saving in cmdRecord, sharing the guard used by reviewSetup. Add record tests that refuse another round after an unsuccessful extra round and after a non-qualifying limit round, leaving the recorded history unchanged.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The automatic extra round and its reporting work in the normal review flow. However, manually recorded reviews can bypass the limit and keep going until approval. That path needs the same eligibility check before this is ready to merge."
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
    "reviewed_sha": "fcff82600fa4c18164aca3a1faf19a7712b341d5",
    "thread_id": "01a143cf-b5f7-7fc3-8228-223fe89ab299",
    "seconds": 20,
    "usage": {
      "input_tokens": 254179,
      "cached_input_tokens": 200960,
      "cache_write_input_tokens": 0,
      "output_tokens": 1327,
      "reasoning_output_tokens": 32
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T08:26:09.283Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "extraRoundDue() and nextAction() allow a qualifying extra round. Both reviewSetup() and cmdRecord() use extraRound() to admit it. Passing AC1 tests exercise next, review and record."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The shared extraRound() guard refuses further ordinary rounds before recording. Passing AC2 tests cover an unsuccessful extra round, two open blocking findings, escalation, repeated disputes and unchanged merge-round limits. The new record test verifies refusal leaves the ticket unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "pack.mjs displays meta.extra in the verdict and history; roundsLine() and close.mjs include it in delivery and review logs. Passing AC3 tests exercise the pack and close output."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Both build and review skills require taking the extra round without asking the user and prohibit changing limits.max_review_rounds to bypass a block. The AC4 test passes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The saved test output confirms all 64 selected tests passed. Existing test changes remain within AC5's permitted expectation changes; no unrelated fixes found."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/review.mjs",
        "issue": "speck record previously accepted unlimited extra rounds without checking eligibility.",
        "suggested_fix": "Implemented: cmdRecord() and reviewSetup() now share the extraRound() guard, with regression tests verifying refused recordings leave history unchanged.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Qualifying tickets now automatically receive one extra review round, clearly marked in their reports. Both review paths enforce the limit, including manually recorded reviews. The earlier bypass is fixed, all selected tests pass, and no blocking concerns remain."
  }
}
```

</details>
