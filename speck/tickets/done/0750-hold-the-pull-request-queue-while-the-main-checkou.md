---
id: "0750"
title: "Hold the pull request queue while the main checkout is bare"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 4              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-24-hold-the-pull-request-queue-while-the-main-checkout-is-bare.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T23:49:48.252Z"
approved: "2026-11-25T00:03:41.470Z"
finished: "2026-11-25T00:36:27.154Z"

---
# 0750 · Hold the pull request queue while the main checkout is bare

**Status:** ✅ done

## Problem
In pull request mode, a ship refused because the main checkout is bare counts as a try, so once it's set back the ticket waits until its pull request, the base branch or its branch changes, and auto-ship looks stuck. The local ship queue doesn't count it (0740).

## Outcome
The pull request queue holds while the main checkout is bare and tries again once it's set back.

## Acceptance criteria
1. In pull request mode, while the main checkout's `core.bare` is true, speck run's pull request queue merges nothing and doesn't count it as a try for any ticket.
2. Once `core.bare` is false again, the next check carries on merging as if the hold had never happened.
3. No test that passed before this change fails.

## Out of scope
- The local ship queue, which 0740 covers.

## Notes
- `scripts/pr-queue.mjs`; the check is `bareMain()` in `scripts/bare-main.mjs`.
- Failing before this build: none
- Self-check: a ship refused as the main checkout went bare is now checked after the merged-but-not-pushed case, so that message still shows; the refusal line falls back to the exit code when the log is empty.

## In plain words
When speck ships through pull requests and your main project folder has been switched into git's "bare" state, speck run now waits instead of trying to merge. It says once that shipping is on hold and how to set the folder back. Once you've set it back, the waiting tickets ship on the next check, without needing a new change first. Before, a ticket that was refused during that time sat stuck until something about it changed.

To see it, set `core.bare` to true in the main folder while speck run is shipping in pull request mode: the run log says shipping is on hold and nothing merges. Set it back and the next check merges as normal. Opening pull requests carries on while it's on hold, since that doesn't touch the main folder.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 130,275
- Elapsed since build started: 14 min
- Changed lines: 16 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none to the inbox. Only in this log: in pull request mode, speck status and the panel may not show the bare-main hold as the local ship queue's status does; that wasn't checked here.

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
    "reviewed_sha": "cc7fa8416d4b1f05b7176f90a43af5a57eb5aab4",
    "session": "fresh",
    "thread_id": "01a21003-2dc8-7700-8ed5-bc3ba9b72d4e",
    "builder_response": "Round 1.\n- Tests run: test/pr-queue-bare-0750.test.mjs with --related, which brought in test/pr-conflict-0323.test.mjs, test/pr-private-0552.test.mjs, test/pr-ship-0296.test.mjs, test/pull-request-0295.test.mjs, plus the commands.checks files. 193 pass, 0 fail.\n- The pull request queue checks the main checkout before it looks at any pull request to ship: while it's bare it looks at and merges nothing, sets no looked/shipped entry, and says once that shipping is on hold (the same message as the local ship queue, 0740). Opening pull requests carries on, since that doesn't touch the main checkout.\n- A ship refused while the main checkout is bare (refuseBareMain in speck ship) clears its looked/shipped entries, like exit 15, so it isn't a try and isn't handed back; once set back, the next check merges it.\n",
    "seconds": 39,
    "usage": {
      "input_tokens": 129585,
      "cached_input_tokens": 100352,
      "cache_write_input_tokens": 0,
      "output_tokens": 690,
      "reasoning_output_tokens": 27
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 29233,
      "cached": 100352,
      "write": 0,
      "output": 690
    },
    "cost_usd": 0.0754012,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-25T00:03:31.751Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/pr-queue.mjs: prQueue.check checks bareMain before lookups or merge attempts. Its ship callback clears looked/shipped entries on a bare-checkout refusal. Passing 0750 tests exercise the hold for OPEN and MERGED requests and a checkout becoming bare during shipping."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0750 recovery tests restore core.bare to false and verify that the next check ships with unchanged refs and no clock advance, including after a refused attempt."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Recorded test output confirms 193 passed, 0 failed and 3 skipped, covering the new tests and related pull request, conflict and private-word behaviour. The committed change leaves existing tests and the local ship queue unchanged."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The pull request queue pauses shipping while the main checkout is bare and resumes on the next check after it is restored. Refused attempts do not prevent an immediate retry. The tests exercise both recovery paths, and the related checks pass."
  }
}
```

</details>
