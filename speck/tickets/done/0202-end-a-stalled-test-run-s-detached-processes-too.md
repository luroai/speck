---
id: "0202"
title: "End a stalled test run's detached processes too"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-end-a-stalled-test-run-s-detached-processes-too.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T13:43:05.079Z"
approved: "2026-10-15T13:51:53.936Z"
finished: "2026-10-15T14:01:32.910Z"

---
# 0202 · End a stalled test run's detached processes too

**Status:** ✅ done

## Problem
When a test run stalls, speck ends the test command's process group, but not processes the tests started in a group of their own, or whose parent has already exited. Those can run for good, using memory and slowing every later run and build on the machine: the same kind of leak that pushed this machine's load above 100 on 2026-10-14.

## Outcome
When speck ends a stalled test run, every process that run started has ended too.

## Acceptance criteria
1. When a full test run through speck stalls and speck ends it, every process the run started has ended within 10 seconds, including ones the tests started in a process group of their own and ones whose parent had already exited.
2. Processes that the run didn't start, including another build's test run going at the same time, are left running.
3. A run that doesn't stall works as before, and so does the stall limit (`test_stall_minutes`).
4. The reviewer time limit (0180) still ends every process a reviewer started, and the two use the same way of finding a run's processes rather than two copies of it.
5. No test that passed before this change fails.

## Out of scope
- Processes left behind before this ships.
- Killed ships and builds (0174).

## Notes
- Asked for 2026-10-15, for release 0.4.0.
- From the 0180 review: the reviewer limit finds a run's processes by their descendants (through `ps`) and by an environment marker each one carries (`runLimited` in `scripts/reviewers.mjs`). The stall handling in `scripts/stall.mjs` (0152, 0174) still uses the process group alone.
- Failing before this build: none
- Self-check: a run started inside another keeps the outer run's mark, so the outer run still finds its processes, and a value under the mark's name that isn't a list of marks is replaced rather than kept.

## In plain words
When a test run goes quiet for too long and speck stops it, speck now also stops every background program those tests started, including ones that had set themselves apart or whose starting program had already finished. Before, those could keep running for good and slow the machine down. Other builds' test runs, and anything else on the machine, are left alone. Reviewers that take too long are stopped the same way, using the same method. To see it, run a test command that starts a background program and then hangs: once speck says the tests stalled, that program is gone too. Worth a look: a test run that finishes normally still doesn't chase down such programs; that's saved as a follow-up idea.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 176,150
- Elapsed since build started: 9 min
- Changed lines: 99 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - A run that finishes on its own, or whose speck process is killed outright (0174's watch), still ends only its process group: `speck/ideas/2026-10-15-end-a-test-run-s-detached-processes-however-it-ends.md`.

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
    "reviewed_sha": "dca1622aacfe59b3341cfcf14ab08a08a81a4422",
    "thread_id": "01a13fd4-6809-7a52-bb67-211f2669bec5",
    "seconds": 36,
    "usage": {
      "input_tokens": 175186,
      "cached_input_tokens": 133376,
      "cache_write_input_tokens": 0,
      "output_tokens": 964,
      "reasoning_output_tokens": 142
    },
    "saved_at": "2026-10-15T13:51:23.146Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/stall.mjs end() finds descendants and marked orphans, then sends SIGKILL after two seconds. Passing test '0202 AC1, AC2' exercises detached and orphaned processes; existing 0152 tests cover full runs through speck."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing '0202 AC1, AC2' verifies an unrelated process and a concurrent run with its own orphan remain running."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing '0202 AC3' checks continued output and preservation of exit code 3. Existing 0152 tests for test_stall_minutes validation, defaults and output activity also pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "limit.mjs and stall.mjs both use procs.mjs runProcesses(). Existing 0180 tests for reviewer timeout cleanup of detached and orphaned processes pass; new tests cover nested marks and shared discovery."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0202-tests.txt: 1,874 tests, 1,871 passed, three skipped, zero failed or cancelled. Existing tests were not modified."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Stalled test runs now clean up detached and orphaned processes while leaving unrelated runs alone. Process discovery is shared with reviewer timeouts. The full suite passes, and I found no blocking issues."
  }
}
```

</details>
