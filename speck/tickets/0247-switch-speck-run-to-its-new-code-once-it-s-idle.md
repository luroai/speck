---
id: "0247"
title: "Switch speck run to its new code once it's idle"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T09:30:55.502Z"
approved: "2026-10-16T10:05:19.569Z"

---
# 0247 · Switch speck run to its new code once it's idle

**Status:** 👍 approved

## Problem
`speck run` keeps running the code it started with. When a ticket that changes `speck run` ships, the change isn't live until someone turns `speck run` off and on, and nothing says so. On 2026-10-16 one `speck run` had been on since the evening before, so parts of seven shipped tickets (0216 to 0220, 0235 and 0245) weren't running.

## Outcome
`speck run` switches to its new code by itself, once no build or ship it's watching is running.

## Acceptance criteria
1. While `speck run` is on, a change to the content of any `.mjs` file in the scripts folder it was started from makes it switch to the new code: once no build or ship it started or adopted is running, a `speck run` on the new code takes its place. A file saved again with the same content doesn't make it switch.
2. From the change until it switches, it starts no new build or ship, and says once in its output that it will switch to the new code when its running builds and ships have ended, naming them. Builds and ships already running carry on, and the new `speck run` carries on from where the old one left off, as a `speck run` started by hand does today.
3. There's never a moment when two `speck run`s are on or neither is: `speck run` stays on in the panel's Auto-build switch throughout, and its output carries on in the same place (the terminal it was started from, or the panel's `run.log`). Started from a terminal, Ctrl-C still stops it after a switch.
4. If the new code can't start, the old `speck run` carries on as before on its own code, says so once with the reason, and tries again at the next change.
5. The brief's description of `speck run` says it switches to new code once it's idle. No test that passed before this change fails.

## Out of scope
- Switching while builds or ships are running.
- `speck panel`, which already switches (0018), and the commands `speck run` starts, which load their code each time.
- Picking up a changed `speck/config.yml`.

## Notes
- The panel's way of noticing a change is `codeStamp()` and `codeHash()` over `panelCode()` in `scripts/panel.mjs`; its handover keeps the process you start waiting until the last server has gone (`cmdPanel`).
- `speck run` is `runOn()` in `scripts/run.mjs`. A `speck run` that starts adopts builds an earlier one launched (`adoptEarlierBuilds()`), and its lock is `takeRunLock()`. The ship queue is `scripts/ship-queue.mjs`; hand-backs wait in the run record, so a new `speck run` carries them out (0194).
- `scripts/run.mjs` is close to the 600-line limit for scripts, which a test checks.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: carried the tickets already launched over to the new code, so a build that never started its ticket isn't launched again after a switch; the new code now runs only when started as speck run's successor, not from an environment variable a user could set; kept `takeRunLock` in run.mjs, where two tests expect it, moving `runState` out instead to stay under 600 lines.

## In plain words
When a ticket that changes speck itself ships, `speck run` now picks up the change on its own. It waits until nothing it's building or shipping is still running, starting nothing new in the meantime, and says once what it's waiting for. Then it carries on with the new version, in the same terminal or panel log. The panel's Auto-build switch stays on throughout, and Ctrl+C still stops it.

To see it, leave `speck run` on while a speck change ships. Its output says the code has changed, then "speck run switched to the new code."

Worth keeping an eye on: if the new version can't start, `speck run` says why once and keeps going on the old version until the next change. A paused build counts as running, so it holds up the switch until it's played or stopped.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The successor announces readiness before its startup work runs.; F2 The tests do not exercise two explicitly required draining paths: adopted builds and running ships.
Round 2 (codex): changes requested.
Round 3 (codex): approve.
Round 4 (codex, merge round): approve.

## Delivery log
- Review rounds: 4, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,110,751
- Elapsed since build started: 34 min
- Changed lines: 213 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (known limits, no inbox notes):
- A paused build counts as running, so `speck run` keeps its old code until the build is played or stopped.
- Builds and ships that this `speck run` didn't start or adopt (a ship from the panel, say) aren't waited for.
- Once the new code has started watching, an error it hits later stops `speck run`, as any error in a running `speck run` does today. Only failures while it gets ready fall back to the old code.
- `scripts/run.mjs` is at the 600-line limit again: the next change to it will need to move something out first.

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
    "reviewed_sha": "f29e6db246e74e53846ae3935f44dd017b30c588",
    "thread_id": "01a14424-678e-7f32-87b2-21eeb6dadfa3",
    "seconds": 38,
    "usage": {
      "input_tokens": 113976,
      "cached_input_tokens": 66432,
      "cache_write_input_tokens": 0,
      "output_tokens": 1140,
      "reasoning_output_tokens": 355
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T09:57:16.249Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "unclear",
        "evidence": "run-0247 tests demonstrate content changes, unchanged saves and repeated switches. No test exercises switching while an adopted build or a ship is running."
      },
      {
        "id": 2,
        "status": "unclear",
        "evidence": "The running-build test verifies draining and launch suppression. Ship coverage only tests waitingSays text; it does not exercise shipQueue.running(), ship completion or suppression of another ship."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The AC3 process tests cover a stable live lock through repeated switches, inherited output, terminal Ctrl-C and the panel's SIGINT stopping the successor."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "run-switch.mjs awaitGo sends ready before start() executes. run.mjs start() then performs adoptEarlierBuilds() and the initial tick. A failure there occurs after the previous runner has relinquished control, so the old code cannot carry on. The test covers only an import syntax error."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "docs/brief.md describes idle switching, and the documentation test verifies it. All seven reported ticket tests passed; the diff provides no identified regression in previously passing tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/run-switch.mjs",
        "issue": "The successor announces readiness before its startup work runs. If adoptEarlierBuilds() or the initial tick throws, the original runner has already stopped its loop (or the previous worker has exited). The successor dies and the host exits, contrary to the promised fallback when new code cannot start.",
        "suggested_fix": "Include fallible startup initialisation in the readiness handshake while keeping launches disabled until ownership transfers. Preserve the old runner on failure, and add a process test for a startup failure after successful module import, including after an earlier successful switch.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/run-0247.test.mjs",
        "issue": "The tests do not exercise two explicitly required draining paths: adopted builds and running ships. Checking the wording with a ship id does not establish that a real ship delays switching or that another ship cannot start during draining.",
        "suggested_fix": "Add behavioural tests for an adopted build and a running ship. Verify they finish before handover, are named once, and no further build or ship starts before the successor takes over.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The main switching flow works in the supplied tests, including repeated updates and stopping from the terminal or panel. However, a successor can report itself ready before startup finishes; a failure then stops auto-build instead of keeping the old version running. Adopted-build and ship draining also need behavioural tests before approval."
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
    "reviewed_sha": "618f468267349fedd5c151cc70b056985bf749ea",
    "thread_id": "01a14424-678e-7f32-87b2-21eeb6dadfa3",
    "seconds": 28,
    "usage": {
      "input_tokens": 223909,
      "cached_input_tokens": 166016,
      "cache_write_input_tokens": 0,
      "output_tokens": 1894,
      "reasoning_output_tokens": 449
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T10:00:18.606Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The passing process tests now cover content changes, unchanged saves, repeated switches, adopted builds and a real running ship. codeSwitch waits on running builds and ships.running()."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "tick returns before scheduling work while codeSwitch is pending. Passing tests exercise build and ship draining, adopted-build launch suppression and the once-only waiting message."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The existing passing process tests retain coverage of lock continuity, inherited output, repeated switches, terminal Ctrl-C and panel SIGINT."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "awaitGo now catches start() failures, but start() runs an unrestricted tick before reporting started. That tick can launch detached builds or ships before a later startup failure. The fallback runner neither adopts that work nor receives its launched-ticket state."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The brief documents idle switching. All ten reported ticket tests passed, with no identified unrelated regression; the whole-suite check remains the shipping gate."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/run-switch.mjs",
        "issue": "The revised handshake preserves the old runner, but startup can now create work before it is accepted. run.mjs start() calls tick(), which can launch detached builds and ships. If startup then throws or exceeds the handshake timeout, startSuccessor kills the successor and resumes the old runner without transferring those launches. Detached work survives, and the old runner can launch the same ready ticket again or exceed its build limit. The new failure test throws before any startup work, so it misses this case.",
        "suggested_fix": "Keep build and ship launches disabled during fallible successor preparation, then enable scheduling after a successful handover. Alternatively, safely reconcile all successor-created work before resuming the old runner. Add a failure test after the initial tick has launched work and verify that fallback neither duplicates nor loses track of it.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/run-0247.test.mjs",
        "issue": "The missing adopted-build and running-ship behavioural coverage has been added.",
        "suggested_fix": "No further change required for this finding.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The new tests confirm that adopted builds and running ships delay the switch correctly. Startup failures now preserve the old runner, but the replacement can launch work before failing. That work survives without being tracked by the old runner, creating a risk of duplicate builds. This remaining fallback issue needs fixing."
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
    "reviewed_sha": "9acf2a7e35013ebd9d00cf6bb524fce2e73ab7ac",
    "thread_id": "01a14424-678e-7f32-87b2-21eeb6dadfa3",
    "seconds": 19,
    "usage": {
      "input_tokens": 349194,
      "cached_input_tokens": 284288,
      "cache_write_input_tokens": 0,
      "output_tokens": 2435,
      "reasoning_output_tokens": 449
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T10:02:15.036Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "codeWatch detects content changes across scripts/*.mjs and ignores unchanged saves. Passing process tests cover repeated switches and waiting for started builds, adopted builds and a real ship."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "codeSwitch blocks tick scheduling while draining and names the running work once. The successor retains launched ticket ids. Passing tests cover draining, launch suppression and continuation."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The original process retains the lock and inherited output throughout handovers. Passing process tests verify repeated switches, lock continuity, terminal Ctrl-C and the panel's SIGINT."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "awaitGo now completes preparation before reporting ready and waits for go before scheduling work. startSuccessor handles preparation failure, premature exit and timeout. Passing tests cover import and preparation failures, fallback before and after a successful switch, exactly-once launches and retry after another change."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "docs/brief.md documents idle switching, verified by the documentation test. All ten reported ticket tests passed; no regression was identified in the reviewed changes. The whole-suite check remains the shipping gate."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/run-switch.mjs",
        "issue": "Resolved: preparation completes before readiness, and the successor cannot schedule builds or ships until ownership transfers.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/run-0247.test.mjs",
        "issue": "Resolved: behavioural tests exercise adopted-build and real ship draining.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The change is ready for the owner's merge decision. It switches to updated code after running work finishes, preserves output and stop controls, and keeps the old runner active if preparation fails. Both earlier findings are resolved, and all ten ticket tests passed."
  }
}
```

</details>

<details><summary>Round 4 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 4,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "43a65114981437918fc62b8c1070f2140d79caee",
    "merge": true,
    "thread_id": "01a14424-678e-7f32-87b2-21eeb6dadfa3",
    "seconds": 11,
    "usage": {
      "input_tokens": 415385,
      "cached_input_tokens": 347904,
      "cache_write_input_tokens": 0,
      "output_tokens": 2818,
      "reasoning_output_tokens": 449
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T10:05:17.004Z"
  },
  "verdict": {
    "round": 4,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Unchanged implementation and ten passing ticket tests cover content detection, unchanged saves, repeated switches and draining started or adopted work."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "codeSwitch suppresses scheduling during draining. Passing behavioural tests cover waiting messages, build and ship completion, launch suppression and continuation."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing process tests verify lock continuity, inherited output, repeated handovers, terminal Ctrl-C and panel SIGINT."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Preparation completes before readiness; scheduling waits for handover. Passing tests verify import and preparation failures, continued operation on old code and retry after another change."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The brief documents idle switching. Adding run-0247.test.mjs to HEAVY addresses the suite failure introduced by this ticket. All 17 reported tests passed, including suite-0233 and the ten ticket tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/run-switch.mjs",
        "issue": "Resolved: successor preparation finishes before readiness, and scheduling begins only after handover.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/run-0247.test.mjs",
        "issue": "Resolved: behavioural tests cover adopted-build and real ship draining.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Approved. The change switches to updated code once running work finishes and preserves the old runner if preparation fails. The additional test-list entry fixes the regression caused by introducing this ticket’s process tests. All 17 reported tests passed."
  }
}
```

</details>
