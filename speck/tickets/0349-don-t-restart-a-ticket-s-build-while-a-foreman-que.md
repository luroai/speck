---
id: "0349"
title: "Don't restart a ticket's build while a Foreman question on it is waiting"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0344"]                # ticket ids that must be done first
created: 2026-10-20
started: "2026-10-20T22:04:16.668Z"

---
# 0349 · Don't restart a ticket's build while a Foreman question on it is waiting

**Status:** 🔍 reviewing

## Problem
When a build ends with its ticket still ready, speck run launches it again only once the ticket has been committed since (0327), as setting it ready again does. But a note the Foreman commits to the ticket, such as a question for you, counts as that commit too. So each question the Foreman asked about 0344 (2026-10-20) restarted its build, which stopped at the same unanswered question, and the Foreman asked again: eight times in nine minutes, each costing a build's tokens.

## Outcome
A build that ended with its ticket still ready is launched again only when someone other than the Foreman commits the ticket.

## Acceptance criteria
1. When a build has ended with its ticket still ready, a commit to the ticket by `speck foreman` (one whose message starts `speck(<id>): Foreman:`) doesn't make speck run launch it again.
2. A commit to the ticket that isn't the Foreman's, such as setting it ready again or editing it, still makes speck run launch it again, as 0327 does, including one made after a Foreman commit.
3. No test that passed before this change fails.

## Out of scope
- How often the Foreman asks, or what it does about a stop.
- Tickets whose build `speck stop` ended, which `heldByStop` decides.

## Notes
- Made by the Foreman (2026-10-20 21:27 UTC) while 0344 looped; filled in with the user 2026-10-20.
- `readyAgain` and `lastTicketCommit` in `scripts/build-records.mjs`, and `markStillReady`'s caller in `scripts/run.mjs`. The Foreman's commit subjects come from `foremanSubject` in `scripts/foreman-agent.mjs`; `codeKey` there already skips them the same way (`git log --invert-grep`).
- After 0344, which also changes `scripts/run.mjs`.
- Goes in 0.10.3 (0346).
- Failing before this build: none
- Self-check: no changes (empty, unknown and option-like kept commits, other tickets' Foreman subjects and a Foreman subject later in the line were already covered by the tests).

## In plain words
When a build stops because its ticket was never started, speck run waits for the ticket to change before trying again. A note or question the Foreman adds to the ticket no longer counts as that change, so a waiting question no longer restarts the same build over and over. Setting the ticket ready again, or editing it yourself, still starts it again as before. To see it, let the Foreman ask about a ticket whose build stopped this way: the build stays put until you answer or change the ticket.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "d2e7bc0d22028517b63b90ef72aceca8d7e2214a",
    "thread_id": "01a15b59-8fbc-78c3-9dad-ba86eaf5eee3",
    "seconds": 18,
    "usage": {
      "input_tokens": 127073,
      "cached_input_tokens": 95616,
      "cache_write_input_tokens": 0,
      "output_tokens": 529,
      "reasoning_output_tokens": 16
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T22:06:16.590Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/build-records.mjs readyAgain compares non-Foreman commits at HEAD and at the recorded commit. Passing run-0349 tests cover repeated Foreman notes and a recorded commit that was itself the Foreman's. scripts/run.mjs ownWait uses this decision to hold the build."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing run-0349 AC2 tests exercise ordinary commits before and after Foreman notes, including a later Foreman note that must not hide the ordinary commit. Existing run-0327 tests cover setting ready again and the actual launch path."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Recorded test output reports 157 passed, zero failed and three skipped across the four reported test files. Existing tests were not changed. The whole-suite check remains part of shipping."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Foreman notes no longer restart a build that ended with its ticket still ready. A person's subsequent committed edit still allows it to restart. The tests exercise both behaviours, and I found no blocking issues."
  }
}
```

</details>
