---
id: "0686"
title: "Bring a ticket cancelled during its build onto the base branch"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T20:50:22.915Z"

---
# 0686 · Bring a ticket cancelled during its build onto the base branch

**Status:** 🔍 reviewing

## Problem
A ticket can be cancelled on its own branch while it's being built, for example when speck takes a blocked question's recommendation to cancel it. The cancel is committed only on the branch, so the base branch still says `ready`. Once the branch's worktree is gone, every ticket with it in `after:` waits for it to ship for ever, and nothing says why: release 0684 waited this way for 0664 on 15 November.

## Outcome
A ticket cancelled on its branch is cancelled on the base branch too, so nothing waits for it.

## Acceptance criteria
1. When a build ends with its ticket `cancelled` on its branch, speck run, at the check that takes up the build's end, cancels the ticket on the base branch with the same `cancel_reason` and `cancelled` date, moves it to `speck/tickets/done/` and commits only that ticket there, as `speck cancel` does.
2. After that, a ready ticket with the cancelled one in `after:` is reported with the message speck already gives for a cancelled ticket in `after:` (that it was cancelled and should be taken out of `after:`), not as waiting for it.
3. A ticket on the base branch that's already `done` or `cancelled` is left as it is, and a build that ends with its ticket in any status other than `cancelled` is taken up as today.
4. When the base branch's copy can't be changed, for example because the main checkout has uncommitted changes to that ticket, speck run says so once in its log, naming the ticket, and tries again at its next check.

## Out of scope
- A ticket built on a cancelled ticket's approved work (`built_on:`): its ship refusal is a separate inbox note.
- Taking a cancelled ticket out of other tickets' `after:` lists by itself.

## Notes
- Found 2026-11-15: 0664's cancel commit (0c473b3f) is only on its branch; `startWaits` in `scripts/built-on.mjs` saw it as ready.
- `speck cancel` refuses while a ticket is being built (`checkNotBeingBuilt`), so this runs once the build has ended. Committing only the ticket on the base branch: `commitTicketOnly` in `scripts/close.mjs`, as the builder stand-in does.
- Failing before this build: none
- Self-check: no changes. A pending cancel is kept in memory, so one that couldn't be made before speck run restarts is only retried if its build is taken up again (noted as a follow-up).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "ec94e0fa8bcf6688b2510f0a3ae57abc2b957ad7",
    "session": "fresh",
    "thread_id": "01a1e105-9a8a-7752-aab5-20d6572d6244",
    "builder_response": "- Tests run: test/run-cancelled-0686.test.mjs test/build-log-0176.test.mjs test/flaky-0207.test.mjs test/full-suite-0630.test.mjs test/split-0078.test.mjs test/split-0270.test.mjs\n- Before this round, `speck test --related` ran every test file naming a changed file. Its only failures from this change were the 600-line limit on scripts/run.mjs (now back at 600 lines); 0176, 0207 AC2 and 0630 AC3 are timing tests that failed under that run's load and pass in the run above.\n- AC2 is reported where speck run says why a ready ticket isn't building (afterWait, from a new `after_cancelled` field in `speck status --json`), with the same words as `speck start`'s refusal, which the startWaits refactor now shares.\n",
    "seconds": 35,
    "usage": {
      "input_tokens": 149650,
      "cached_input_tokens": 117504,
      "cache_write_input_tokens": 0,
      "output_tokens": 844,
      "reasoning_output_tokens": 74
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 32146,
      "cached": 117504,
      "write": 0,
      "output": 844
    },
    "cost_usd": 0.0844824,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T21:03:58.168Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "cancelOnBase copies cancellation metadata, moves and commits only the ticket. Passing AC1 tests cover metadata, unrelated staged changes and a real speck run build ending."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "statusData supplies after_cancelled; afterWait shares the cancellation message with startWaits. Both AC2 tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cancelOnBase preserves done/cancelled tickets and ignores branches in other statuses. Both AC3 tests passed."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "Passing AC4 tests cover modified files and failed commits, but cancelled-build.mjs:21 swallows ticket lookup errors; the queue then removes the pending retry at line 48."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/cancelled-build.mjs:21",
        "issue": "Ticket lookup failures silently discard the cancellation. For example, locally deleting the base ticket without committing makes findTicket throw. cancelOnBase returns null, so the queue logs nothing and removes its pending entry. Restoring the file does not trigger cancellation at the next check. Duplicate copies or unreadable tickets have the same problem.",
        "suggested_fix": "Propagate lookup failures into the queue's existing log-once and retry handling. Add a test that locally deletes the tracked base ticket, checks that the problem is logged once, restores it and verifies cancellation on the next check.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change handles normal cancellations and explains cancelled dependencies correctly. One recovery gap needs fixing: a locally deleted or unreadable ticket silently stops cancellation retries, leaving the base branch out of sync."
  }
}
```

</details>
