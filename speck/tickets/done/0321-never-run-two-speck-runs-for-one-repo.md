---
id: "0321"
title: "Never run two speck runs for one repo"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-19T05:33:51.917Z"
approved: "2026-10-19T05:50:55.337Z"
finished: "2026-10-19T05:53:35.214Z"

---
# 0321 · Never run two speck runs for one repo

**Status:** ✅ done

## Problem
`speck run` keeps a lock so only one runs per repo, yet on 2026-10-18 two ran in this repo for about eight hours. One was the speck run started on 2026-10-16 (process 434685), which had switched to new code and was working through a worker process (2456375) it started. The other (1571492) was started at 14:54 from the Settings view's switch and held `run.lock`. Both launched builds and ships, saw each other's builds as "outside speck run", and took turns writing the Foreman's status, so the header changed every two or three seconds. Two speck runs can start the same build or ship twice.

## Outcome
Only one speck run is ever working in a repo, however it was started and whether or not it has switched to new code.

## Acceptance criteria
1. While a speck run is working in a repo, before or after a switch to new code, starting another one there, from a terminal or the Settings view's switch, is refused with a message naming the one that's running, and nothing else is started.
2. Turning speck run off from the Settings view stops the whole speck run, including any worker it switched to, and the switch shows it off only once all of it has stopped.
3. A speck run that finds it no longer holds the repo's lock, or that the lock names another live speck run, stops launching builds and ships at once, says so once in `run.log`, and exits, leaving its running builds and any ship to carry on.
4. Only the speck run holding the lock writes the Foreman's status.
5. Builds and ships that are running when a speck run stops carry on, and the speck run that remains picks them up, as 0300 and 0301 made it.

## Out of scope
- More than one repo: each repo has its own speck run.

## Notes
- The lock is `run.lock` in `speck/.cache/runs/` (`takeRunLock` and `holdRunLock` in `scripts/run.mjs`). The switch to new code (0247, 0301) is in `scripts/run-switch.mjs`: the process you start hosts a worker on the new code. The Settings view's switch starts speck run with `panelRunOn` in `scripts/panel.mjs`.
- Seen 2026-10-18: `run.lock` named 1571492 while 434685 and its worker 2456375 kept working, and the Foreman's record (`run.foreman.json`) alternated between `"lock": 434685` and `"lock": 1571492`. Stopping 434685 with SIGINT ended it cleanly, leaving its four builds and one ship running.
- How the second one got the lock is not known yet; finding out is part of the build.
- Failing before this build: none
- How the second one got the lock, as far as the evidence shows: `run.log` has 434685 starting from the Settings view's switch, and 1571492 starting at 14:54 without a refusal, about a minute after the ship of 0298 ended (14:52:53), with no line between saying 434685 had stopped. So by 14:54 `run.lock` was gone or named a process that had gone: the panel showed the switch off and the new one took the lock. The only code that removes `run.lock` is the exit handler (only when it names its own pid) and the take-over of a stale lock (only when the process it names has gone), so nothing in speck removes it while its holder is alive. It was most likely removed from outside that code, for example by hand or by an agent following the "delete run.lock" advice. The exact cause can't be found from what's left, so the build makes the outcome hold whatever removed it: the speck run holding the lock checks it on each check and stops once it no longer holds it, and one starting also counts the live speck run the Foreman's record names (`scripts/run-lock.mjs`).
- Self-check: a process whose folder can't be read, or isn't this repo, no longer counts as this repo's speck run, so a pid reused by a speck run in another repo never gets a start refused. Added a test.
- Pictures: none needed. The Settings switch looks the same; only when it shows off changes.

## In plain words
Only one speck run can work in a repo now. If you try to start a second one, from a terminal or from the switch in Settings, it's refused and tells you which one is running, even if the first one's lock file has gone missing. A speck run that finds it has lost its lock stops starting new builds and ships, says so once in its log and stops, while the builds and any ship it had going carry on and are picked up by the speck run that remains. Turning speck run off in Settings now waits for every part of it to stop, including the copy running newer code after an update, and every open page keeps showing it on until then.

To see it: with speck run on, run `speck run` in a terminal and read the refusal. Turn it off in Settings and watch the switch go off only once it has fully stopped.

Worth watching: what removed the lock on 2026-10-18 isn't known for sure (see Notes). Whatever it was, it can no longer lead to two speck runs at once.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Recovery from a missing lock does not refuse a second run on macOS.; F2 Waiting in panelRunOff only delays the requesting page's response.
Round 2 (codex): changes requested: F3 The new macOS lookup test fails on macOS itself.
Round 3 (codex): approve.

## Delivery log
- Review rounds: 3
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,108,855
- Elapsed since build started: 17 min
- Changed lines: 146 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (known limits, no inbox notes):
- The panel remembers a speck run it's turning off only in its own server process, so a panel restart in the middle of a stop forgets it, and the switch then follows the lock alone.
- After a Turn off that ran out of time, the pages switch to off only at the panel's next reading once the last process has gone (any change on the board, or a reload), not the moment it goes.
- The exact cause of the lost lock on 2026-10-18 wasn't found (see Notes). The refusal's advice to delete `run.lock` "if it isn't speck run" is one way a live lock could be removed by hand or by an agent. It's now harmless, but the wording could be looked at.

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
    "reviewed_sha": "901800297957da8f03fd8a93dbbc7664f1b4d37f",
    "thread_id": "01a152b2-4ac1-7312-894a-77e2dace8dc2",
    "seconds": 43,
    "usage": {
      "input_tokens": 263350,
      "cached_input_tokens": 209152,
      "cache_write_input_tokens": 0,
      "output_tokens": 1565,
      "reasoning_output_tokens": 76
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-19T05:47:01.430Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The reported passing AC1 tests cover Linux refusal with and without run.lock. However, scripts/run-lock.mjs:isSpeckRun(pid, repo) requires /proc/<pid>/cwd, so recordedRun always ignores the existing run on supported macOS when its lock disappears."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The two reported passing AC2 tests exercise panelRunOff's response timing. They do not exercise panel state: scripts/panel.mjs:stateOf still uses run-switch.mjs:runState, which reports off once the host exits or its lock disappears, even while a tracked worker remains alive."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/run.mjs:tick checks keepsLock before scheduling work; stop exits without stopping detached builds or ships. Reported passing AC3 tests cover replacement of the lock, disappearance after switching code, one message and process exit."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/run.mjs:foreman checks holding() before saveForeman. The reported passing AC4 test replaces the lock and verifies that no Foreman record is written afterwards."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The reported passing AC3/AC5 test verifies build survival and adoption without relaunch. Shutdown uses the existing stop path; scripts/ship-queue.mjs:launchShip retains detached shipping and existing ship detection. test/run-0193.test.mjs also contains a shipping-survival regression test."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/run-lock.mjs",
        "issue": "Recovery from a missing lock does not refuse a second run on macOS. isSpeckRun(pid, repo) reads /proc/<pid>/cwd and returns false when unavailable. macOS is supported, but recordedRun therefore ignores its live incumbent, allowing another run to take the missing lock and begin work before the incumbent's next check.",
        "suggested_fix": "Implement repo identification on supported macOS as well as Linux, and add coverage for refusing a second run when the incumbent's lock is missing on that platform.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/panel.mjs",
        "issue": "Waiting in panelRunOff only delays the requesting page's response. Board snapshots still derive on/off solely from run.lock and its host PID. If the host exits before its worker, another open or refreshed Settings page shows Auto-build off while the worker remains alive. After a shutdown timeout, the requesting page can also show off despite the surviving worker.",
        "suggested_fix": "Make the panel's shared run state account for workers still stopping, including timeout handling. Add a panel-state test that reads a snapshot after the host exits but before its worker stops; the existing stand-in test checks only the endpoint response.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change detects lost locks and preserves ongoing builds, with the reported tests passing. Two gaps remain: duplicate-start protection fails on macOS when the lock disappears, and Settings can show speck run as off while a worker is still running."
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
    "reviewed_sha": "e7b851db51468af0237e12aafbc52035564c806a",
    "thread_id": "01a152b2-4ac1-7312-894a-77e2dace8dc2",
    "seconds": 21,
    "usage": {
      "input_tokens": 386523,
      "cached_input_tokens": 321792,
      "cache_write_input_tokens": 0,
      "output_tokens": 2501,
      "reasoning_output_tokens": 188
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-19T05:50:07.145Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "run-lock.mjs:processCwd now supports lsof as well as /proc. Reported passing AC1 tests exercise both lookup paths, refusal with a missing lock, refusal after switching code, and exclusion of another repo."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel-run.mjs:panelRunState retains the on state while tracked workers survive, including after timeout; panel.mjs:stateOf uses it. Reported passing AC2 tests cover host-first exit, shared state, refusal to restart and retrying shutdown."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "run.mjs:tick checks keepsLock before scheduling; stop exits without killing detached work. Reported passing AC3 tests cover replaced and missing locks, switched workers, exit and a single diagnostic."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "run.mjs:foreman checks holding() before saveForeman. The reported passing AC4 test verifies no record is written after lock replacement."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The reported passing AC3/AC5 test checks build survival and adoption without duplication. The existing detached ship launch and ship detection remain unchanged, and shutdown retains the existing stop path."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/run-lock.mjs",
        "issue": "The original missing macOS process-folder lookup is fixed: processCwd now uses lsof outside Linux.",
        "suggested_fix": "No further production-code change required for this finding.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/panel.mjs",
        "issue": "Shared panel state now accounts for surviving workers during shutdown and after a timeout.",
        "suggested_fix": "No further change required for the reported shutdown-state issue.",
        "state": "resolved"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "test/run-lock-0321.test.mjs",
        "issue": "The new macOS lookup test fails on macOS itself. It unconditionally asserts that processCwd(run.child.pid, 'linux') returns the repo folder, but that branch reads /proc, which macOS does not provide. Since macOS normally has lsof, the test runs rather than skips and fails.",
        "suggested_fix": "Run the /proc assertion only on Linux. Keep the lsof assertion on supported platforms where lsof is available.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Both previously identified behaviour gaps are fixed, and the reported tests pass. One test correction remains: the new macOS check currently fails when run on macOS because it also requires Linux’s process filesystem."
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
    "reviewed_sha": "b1a293dfa956e41e14ef6717fb9b85cef652b4d2",
    "thread_id": "01a152b2-4ac1-7312-894a-77e2dace8dc2",
    "seconds": 15,
    "usage": {
      "input_tokens": 451788,
      "cached_input_tokens": 385152,
      "cache_write_input_tokens": 0,
      "output_tokens": 3128,
      "reasoning_output_tokens": 188
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-19T05:50:41.081Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "run-lock.mjs:recordedRun and processCwd supplement the atomic lock with repo-specific process identification. Passing AC1 tests cover terminal and Settings refusal, code switching, missing locks, another repo and both process-folder lookup paths."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panelRunOff tracks the host and its workers; panelRunState supplies shared panel state until they stop. Passing AC2 tests cover switched workers, host-first exit, timeout, restart refusal and shutdown retry."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "run.mjs:tick checks keepsLock before scheduling work and exits through stop on lock loss. Passing AC3 tests verify exit, one diagnostic, worker shutdown and preservation of running builds."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "run.mjs:foreman checks holding() before saveForeman. The passing AC4 test verifies no Foreman record is written after lock replacement."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The passing AC3/AC5 test verifies build survival and subsequent adoption without relaunch. Detached shipping and existing ship detection remain unchanged; shutdown uses the existing stop path covered by the shipping-survival regression test."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/run-lock.mjs",
        "issue": "The missing macOS process-folder lookup is fixed through lsof.",
        "suggested_fix": "None required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/panel.mjs",
        "issue": "Shared panel state now accounts for workers surviving their host during shutdown, including after timeout.",
        "suggested_fix": "None required.",
        "state": "resolved"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "test/run-lock-0321.test.mjs",
        "issue": "The /proc assertion is now restricted to Linux, while the lsof assertion remains enabled wherever lsof is installed.",
        "suggested_fix": "None required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The change refuses duplicate runs, stops scheduling when lock ownership is lost, and keeps Settings on until shutdown finishes. Existing builds and ships carry on. All findings are resolved; the reported checks passed with no failures."
  }
}
```

</details>
