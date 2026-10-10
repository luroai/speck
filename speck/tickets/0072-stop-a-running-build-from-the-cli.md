---
id: "0072"
title: "Stop a running build from the CLI"                # one outcome, no "and"
status: blocked            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0070"]                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T22:28:19.677Z"

---
# 0072 · Stop a running build from the CLI

**Status:** ⛔ blocked

## Problem
The only way to end a build for good is to kill its process by hand, which leaves the ticket `building` with nothing to say why it stopped or how to carry on.

## Outcome
`speck stop <id>` ends a running build for good and leaves its ticket `blocked`, with its work kept and a way to carry on.

## Acceptance criteria
1. `speck stop <id>`, for a ticket whose build `speck run` launched and is running or paused, ends the build and every process it started, and prints that it's stopped. None of them is left running.
2. It then sets the ticket `blocked` with the blocked question `Stopped by you on <YYYY-MM-DD>.` and commits that, in the build's worktree. The ticket's branch, worktree and the build's commits stay as they were, so the panel shows the resume command for its session as for any blocked ticket.
3. `speck run` doesn't report the stopped build as a build that stopped or failed, and doesn't launch it again.
4. It refuses, with a plain message and a non-zero exit and changing nothing, when the ticket doesn't exist or has no running or paused build launched by `speck run`.

## Out of scope
- Throwing the work away and building the ticket again from scratch.
- The panel's stop button (0073).

## Notes
- After 0070, so a paused build can be stopped too.
- While a build runs, its ticket file lives in the build's worktree, and `speck status` reads it from there.
- product.md's `speck run` description and the list of commands need updating.
- product.md no longer exists (removed by 0068), so README's commands table (its `speck run` row and a new `stop` row) and `speck help` were updated instead.
- Self-check: a stop whose `ps` fails before anything is ended now leaves the build running and unmarked (its stop mark is removed), a partly finished stop says how to finish by hand, and a ticket already approved, done or cancelled is left as it is; tests added for the first and last.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->
Auto-ship hit a merge conflict with main (README.md only; scripts/speck.mjs auto-merged with 0071 and 0075), which I resolved keeping both sides and committed as `speck(0072): merge main`, with all 600 tests passing. The merge needs a review round, but all 3 rounds (`max_review_rounds`) are used. Should I (a) get one more round once you raise `max_review_rounds` to 4 in speck/config.yml, or (b) leave the merge for you to check with `speck pack 0072` and ship with `/speck-ship 0072`? I recommend (a), because scripts/speck.mjs merged with 0071's pause changes in the same area.

## Review log
Round 1 (codex): changes requested: F1 endBuild forgets previously identified processes once they cease to be discoverable.; F2 A matching stopped mark does not prevent launch when speck run restarts.
Round 2 (codex): changes requested.
Round 3 (codex): approve.

## Delivery log
- Review rounds: 3
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 2,108,864
- Elapsed since build started: 17 min
- Changed lines: 128 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Follow-ups:
- A build stopped before it ran `speck start` leaves its ticket blocked in the main checkout with no branch, and `/speck-build` can't pick that up (`speck start` wants a ready ticket). Inbox: speck/ideas/2026-10-09-resume-a-build-stopped-before-it-started.md.
- Known limit: if `speck stop` fails part way after the build's lead process has ended, running it again says there's nothing to stop. Its message says to end what's left and block the ticket by hand.
- Known limit: a `.stopped` mark with no ticket commit recorded (stop failed before it could read one) holds a ready ticket from `speck run` until the ticket is committed again.

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
    "reviewed_sha": "e08c4b2ef82e5fbce8048d8650bfdef04148b641",
    "thread_id": "01a122d1-2f34-7e43-89a5-31ff42d2819f",
    "seconds": 42,
    "usage": {
      "input_tokens": 399170,
      "cached_input_tokens": 311296,
      "cache_write_input_tokens": 0,
      "output_tokens": 1345,
      "reasoning_output_tokens": 257
    },
    "saved_at": "2026-10-09T22:38:58.972Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/speck.mjs endBuild repeatedly calls liveBuildProcesses without retaining discovered PIDs. A detached child with a replaced environment that ignores SIGTERM can disappear from discovery when its parent exits and survive a successful stop. The AC1 tests exercise detached children only with the inherited session environment and default signal handling."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdStop and buildTicket block and commit the ticket in its worktree while preserving the session record. test/stop-0072.test.mjs AC2 tests check the question, commit contents, branch, worktree, earlier commit and session; existing 0044 tests cover the panel resume command."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "cmdRun suppresses ordinary exit reporting for matching stop marks, covered by both AC3 tests. However, adoptEarlierBuilds ignores records already marked exited and does not reserve stopped tickets whose process has gone; tick can therefore relaunch a still-ready stopped ticket on restart."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "runRecord and cmdStop refuse missing tickets and absent, dead or exited builds. The AC4 refusal test checks non-zero exits, plain messages and unchanged tickets, records and HEAD."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "endBuild forgets previously identified processes once they cease to be discoverable. For example, a build starts a detached helper with a replacement environment; the helper ignores SIGTERM. Initially its parent links it to the build, so it is paused and signalled. When the parent exits, the helper loses that link and has no session environment marker. Subsequent discovery omits it, allowing stop to report success while it remains running.",
        "suggested_fix": "Retain the processes identified during freezing and termination, check their liveness throughout shutdown, and kill surviving processes even after their parent exits. Add an integration test with a detached helper using a replacement environment and ignoring SIGTERM.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "A matching stopped mark does not prevent launch when speck run restarts. A build stopped before starting its ticket remains ready until cmdStop updates it. Restarting run during that interval can launch it again. A failed ticket commit makes this permanent because commitTicketOnly restores the ready ticket, while adoption skips its exited record and tick ignores the stop mark.",
        "suggested_fix": "Make startup and launch eligibility honour matching stopped marks independently of ticket status, while allowing an explicitly authorised later build with a new session. Test restarting run after stopping a ready build whose ticket commit fails.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The normal stop flows have meaningful passing tests and preserve the build’s work. Two gaps need fixing: a detached helper can survive while stop reports success, and restarting the runner can relaunch a stopped build before its ticket is blocked or after the ticket commit fails. Tests were inspected but not rerun because they write temporary files and this review is read-only."
  }
}
```

</details>

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "0075b81b9a05ecf872824868e7875c9b42c686e0",
    "thread_id": "01a122d1-2f34-7e43-89a5-31ff42d2819f",
    "seconds": 28,
    "usage": {
      "input_tokens": 668883,
      "cached_input_tokens": 531840,
      "cache_write_input_tokens": 0,
      "output_tokens": 2179,
      "reasoning_output_tokens": 384
    },
    "saved_at": "2026-10-09T22:42:38.937Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs endBuild now retains the PIDs returned by signalBuild and checks them through termination, including after reparenting. The original running/paused AC1 tests and new '0072 AC1 (round 1 F1)' exercise real processes; all pass in the supplied output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdStop and buildTicket still commit the blocked status and dated question in the build's worktree, preserving its branch, earlier commits and session record. Both AC2 integration tests pass; existing 0044 tests cover displaying the resume command."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The original AC3 tests and new F2 test cover exit-report suppression and restart after a failed ticket commit. However, heldByStop compares Git commit timestamps with the stop's wall-clock timestamp, which does not reliably establish whether the ticket was committed after stopping."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "runRecord validates ticket existence and a live, unexited build before cmdStop writes anything. The AC4 test verifies plain refusals, non-zero exits and unchanged records, tickets and HEAD; the early ps-failure test also passes."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Resolved: endBuild retains discovered processes and terminates the stubborn detached helper even after its parent exits. The new integration test directly exercises the previously missed behaviour.",
        "suggested_fix": "No further change required for this finding.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "The restart guard is incomplete because heldByStop uses commit dates as evidence of a later commit. An existing ticket commit dated ahead of the current clock makes heldByStop false immediately, so a stopped, still-ready ticket can relaunch without any subsequent change. Conversely, a deliberate requeue committed within the same second as the stop remains held indefinitely because Git timestamps have second precision whereas the stop timestamp includes milliseconds. The regression test's explicit 1100ms wait avoids this boundary.",
        "suggested_fix": "Record the ticket's commit identity at stop time and detect subsequent committed changes without comparing wall-clock dates. Add tests for a pre-existing future-dated commit and a deliberate requeue committed within the stop's timestamp second.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Process cleanup now addresses the detached-helper problem, and the normal stop and refusal flows remain covered by passing tests. The restart guard still needs fixing: its reliance on timestamps can either restart a stopped build unexpectedly or prevent a deliberately requeued build from starting. I inspected the code and tests; I did not rerun tests in this read-only review."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "edf4da8d756d25fa2d279228cd203971b2723c1e",
    "thread_id": "01a122d1-2f34-7e43-89a5-31ff42d2819f",
    "seconds": 21,
    "usage": {
      "input_tokens": 1034489,
      "cached_input_tokens": 848896,
      "cache_write_input_tokens": 0,
      "output_tokens": 2798,
      "reasoning_output_tokens": 384
    },
    "saved_at": "2026-10-09T22:45:31.390Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs signalBuild and endBuild freeze and terminate the build's processes, retaining discovered PIDs after reparenting and escalating to SIGKILL. The running, paused, orphaned-child and stubborn-child AC1 integration tests all pass in the supplied output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdStop and buildTicket set the dated blocked question and commit the ticket in its build checkout. AC2 tests verify the commit, preserved branch, worktree, earlier commits and session data. Existing 0044 tests cover displaying the blocked ticket's resume command."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cmdRun suppresses ordinary stopped/failed reporting through stoppedBySpeck and prevents automatic relaunch through heldByStop. The AC3 tests cover current and adopted builds, runner restart and failed ticket commits. The updated F2 regression test covers future-dated commits and requeue commits dated within the stop's second; it passes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "runRecord and cmdStop validate ticket existence and a live, unexited build before writing the stop mark. The AC4 integration test checks plain messages, non-zero exits and unchanged tickets, records and HEAD; the early ps-failure test also passes."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Resolved: endBuild retains discovered processes and terminates the stubborn detached helper after its parent exits. The regression test directly exercises this behaviour.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Resolved: cmdStop records the ticket's commit hash, and heldByStop compares commit identities rather than timestamps. The updated regression test verifies restart suppression and subsequent requeue despite misleading commit dates.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The change meets all four criteria. Running and paused builds can be stopped while their work and resume information are preserved, and the runner avoids treating them as failures or restarting them automatically. Both earlier findings are resolved. The supplied suite reports 557 passing tests; I inspected the code and tests without rerunning them in this read-only review."
  }
}
```

</details>

<details><summary>Round 4 · codex · approve</summary>

```json
{
  "meta": {
    "round": 4,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "c309edfef2ad8f137a882ba9763b6d48601533d9",
    "thread_id": "01a122d1-2f34-7e43-89a5-31ff42d2819f",
    "seconds": 80,
    "usage": {
      "input_tokens": 1468148,
      "cached_input_tokens": 1137536,
      "cache_write_input_tokens": 0,
      "output_tokens": 3619,
      "reasoning_output_tokens": 384
    },
    "saved_at": "2026-10-10T07:35:36.230Z"
  },
  "verdict": {
    "round": 4,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "cmdStop ends running and paused builds, retains all discovered process IDs through termination, and removes the paused mark. Panel pause requests use the same pauseBuild function as the CLI, so stopping a panel-paused build follows the reviewed path. Supplied termination regression tests pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The ticket is blocked with the dated question and committed in the checkout holding its build branch. The branch, worktree, previous commits and session record are preserved. Supplied tests verify these properties and the panel's resume data."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Both launched and adopted builds recognise matching stopped marks and suppress ordinary failure reporting. heldByStop compares ticket commit hashes to prevent relaunch after restart without relying on commit dates. The merge preserves priority ordering and these guards; supplied restart and adopted-build tests pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "runRecord and cmdStop reject missing tickets and builds without a live running or paused process before changing records or tickets. Supplied refusal tests verify plain errors, non-zero exits and unchanged state."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Previously identified processes could escape termination after their parent exited. endBuild now retains their IDs and checks their liveness until termination completes.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "A stopped ticket left ready could relaunch after a runner restart. The commit-identity guard remains intact after the merge and handles misleading commit dates.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "All four acceptance criteria pass. The merge preserves panel pause behaviour, priority handling and both sides of the README changes. No new findings. The supplied suite reports 600 passing tests; tests were not rerun in this read-only review."
  }
}
```

</details>
