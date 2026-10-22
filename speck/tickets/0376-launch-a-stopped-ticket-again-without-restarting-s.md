---
id: "0376"
title: "Launch a stopped ticket again without restarting speck run"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-19-launch-a-stopped-ticket-again-without-restarting-speck-run.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0375"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T23:50:24.940Z"

---
# 0376 · Launch a stopped ticket again without restarting speck run

**Status:** 🔍 reviewing

## Problem
`speck stop` ends a build, and speck run says to set the ticket ready again and commit it. The speck run that launched it never does: it keeps the ticket on its launched list, so nothing starts until speck run itself is restarted.

## Outcome
The speck run that stopped a build launches that ticket again once it is set ready and that change is committed, without a restart.

## Acceptance criteria
1. When speck run launched a build, `speck stop` ends it, and the ticket is afterwards set ready with that change committed, that same speck run launches the build on its next check.
2. Until that commit, the same speck run does not launch it, and still says to set it ready again and commit it.
3. A build that ended with its ticket still ready, which 0327 launches again once the ticket is committed, still does. A ticket `speck stop` did not end is not launched a second time while the build speck run already launched is the one it has.
4. No test that passed before this change fails.

## Out of scope
- How someone sets the ticket ready again.
- A build that was stopped and whose ticket stays blocked.

## Notes
- Checked 2026-10-22: `ownWait` in `scripts/run.mjs` returns while the ticket is still in `launched`, before `heldByStop`. `readyAgain` in `scripts/build-records.mjs` returns false when `speck stop` ended the build, so the launched list is never cleared for it. `heldByStop` already knows a later commit of the ticket.
- Waits for 0375 so it ships in 0.13.1, not in 0.13.0. It changes `scripts/run.mjs`, not the files the 0.13.0 tickets change.
- Failing before this build: none
- Self-check: `speck stop`'s own commit, blocking the ticket, already counts as a commit since the stop, so a ticket set ready in its worktree but not committed would have been launched. It's now launched again only once its last commit has it ready (`readyAfterStop`), and a test covers it with and without worktrees. `heldByStop` moved to `scripts/build-records.mjs` to keep `scripts/run.mjs` under 600 lines.

## In plain words
When you stop a build and later set its ticket ready again, the speck run that's already going now picks it up by itself once that change is committed. You no longer have to restart speck run. Until it's committed, the board still says the build was stopped and asks you to set the ticket ready and commit it. To see it, stop a build that speck run started, set its ticket ready, and commit it: within a check or two it starts again. Worth a look: a speck run that was restarted after the stop is less careful, and is noted as a follow-up.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Inbox: speck/ideas/2026-10-22-hold-a-stopped-ticket-until-it-s-committed-ready-after-a-restart.md. After a restart, `heldByStop` counts the stop's own blocking commit as the ticket being committed again, so with worktrees a stopped ticket set ready but not committed is launched.

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
    "reviewed_sha": "82b2cc53a5cc087ab3c0a535568725ae27e57a59",
    "session": "fresh",
    "thread_id": "01a1660a-881c-7f72-bd18-e878fc2cda60",
    "builder_response": "- Tests run: test/run-0376.test.mjs test/run-0327.test.mjs test/stop-0072.test.mjs (plus the commands.checks files, which speck test --files runs)\n- Round 1. `ownWait` in scripts/run.mjs now takes a ticket off the launched list once it has been committed ready since `speck stop` ended its build (`readyAfterStop` in scripts/build-records.mjs). The stop's own commit blocks the ticket, so it doesn't count. Until then, a launched ticket whose build `speck stop` ended is reported as kind `stopped` (\"ended by speck stop: set it ready again and commit it to build it\").\n- `heldByStop` moved from scripts/run.mjs to scripts/build-records.mjs unchanged apart from taking `runs`, to keep scripts/run.mjs under the 600-line limit (test 0078 AC2).\n- AC3: the 0327 test file still passes; a build launched again after the stop has a new run record, so the stop mark no longer names it (stoppedBySpeck compares pid and session), and the real speck run test checks it isn't launched a third time.\n- AC4: the recorded result for the base commit passed; ship runs the whole suite.\n",
    "seconds": 27,
    "usage": {
      "input_tokens": 146201,
      "cached_input_tokens": 112000,
      "cache_write_input_tokens": 0,
      "output_tokens": 930,
      "reasoning_output_tokens": 113
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T23:55:54.997Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/run.mjs ownWait clears the launched entry when readyAfterStop confirms a committed ready ticket. Both passing 0376 integration tests exercise stopping and relaunching through the same speck run, with and without worktrees."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "readyAfterStop in scripts/build-records.mjs checks the committed ticket status, excluding the stop's blocking commit. Passing unit and integration tests verify that uncommitted ready changes remain held and the reported reason still asks for ready status and a commit."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing test/run-0327.test.mjs exercises the existing committed-ticket relaunch behaviour. The 0376 tests verify that stale stop marks do not release later builds and that the second build is not launched a third time without another ticket commit."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0376-tests.txt: 133 tests, 130 passed, 3 skipped, zero failures, including 0327 and stop regressions. The implementation is narrowly scoped; shipping supplies the required whole-suite check."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Stopped tickets now launch again in the same speck run after being committed ready. Uncommitted changes remain held with the correct explanation. Tests cover both worktree modes and existing relaunch behaviour; no blocking issues found."
  }
}
```

</details>
