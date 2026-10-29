---
id: "0551"
title: "Stop speck run when the panel's switch times out"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-28-stop-speck-run-when-the-panel-switch-times-out.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-29
started: "2026-10-29T14:13:40.713Z"

---
# 0551 · Stop speck run when the panel's switch times out

**Status:** 🔍 reviewing

## Problem
When the panel's speck run switch is turned on and speck run doesn't take its lock and say it's watching within 10 seconds, the panel shows an error but leaves the speck run it started running. That speck run can start watching and launch builds a moment later, while the switch shows it off and failed.

## Outcome
A speck run the panel's switch started that didn't say it was watching in time is stopped before the switch reports the time-out, so nothing the switch started is left running.

## Acceptance criteria
1. When the panel's switch is turned on and the speck run it started hasn't taken its lock and said it's watching within the time limit, that speck run and its process group are stopped before the panel answers, and the switch then shows speck run off.
2. The error the panel shows after that time-out says speck run didn't say it was watching in time, that it was stopped, and where its output is.
3. If that speck run is still there after it has been sent SIGTERM and then SIGKILL and waited for, the panel's error names its process id and says to stop that process yourself.
4. `speck run --background` still stops a speck run that didn't say it was watching in time, and exits non-zero with the time-out's message, as it does today.
5. No test that passed before this change fails.

## Out of scope
- The switch's own 10-second limit, and turning speck run off.
- What happens when speck run refuses to start (exit before it's on), which already leaves nothing running.

## Notes
- Asked for 2026-10-29 for the 0.21.1 patch release.
- From 0544's build: `speck run --background` stops the process it started on a time-out (`stopStarted` in `scripts/run-background.mjs`), while the panel's `panelRunOn` in `scripts/panel-run.mjs` only reports it, as a 500 with the child's `pid` in its body. `scripts/run-background.mjs` imports `panel-run.mjs`, so moving or sharing `stopStarted` mustn't make a loop.
- Quick test: call `panelRunOn` directly with a short `ms` and a speck run that never says it's watching, as 0544's tests do for `startBackground`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes
- Pictures: none, because nothing anyone sees changes apart from the wording of the switch's time-out error

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
    "reviewed_sha": "b2f0e4227176004ae93fc2e5fedc8dba75ccb1b7",
    "session": "fresh",
    "thread_id": "01a18804-dfb5-7671-be44-974f7c6a8f42",
    "builder_response": "- Tests run: test/panel-run-0551.test.mjs test/run-background-0544.test.mjs, with --related (also test/panel-0357.test.mjs, test/run-lock-0321.test.mjs, test/setup-0510.test.mjs) and the repo checks\n- stopStarted moved from run-background.mjs to panel-run.mjs (run-background re-exports it), so panel-run doesn't import run-background and there's no loop.\n- AC3 is tested by passing panelRunOn a stop that rejects, since a process that survives SIGKILL can't be made in a test; stopStarted's SIGTERM-then-SIGKILL path stays covered by 0544's test.\n",
    "seconds": 46,
    "usage": {
      "input_tokens": 92547,
      "cached_input_tokens": 54272,
      "cache_write_input_tokens": 0,
      "output_tokens": 962,
      "reasoning_output_tokens": 94
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 38275,
      "cached": 54272,
      "write": 0,
      "output": 962
    },
    "cost_usd": 0.0915972,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-29T14:17:08.710Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/panel-run.mjs: stopStarted sends signals to the group but its gone() checks only pidAlive(pid). It can return when the leader exits while another group member survives. The AC1 test uses a 1 ms timeout without arranging any descendants, so it does not exercise this case."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panelRunOn constructs the timeout error with the watching deadline, confirmation it was stopped, and the log path. The passing '0551 AC1 AC2' test checks that message."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelRunOn handles a rejected stop with the process id and instructions to stop it yourself. The passing '0551 AC3' test exercises this error branch; the existing 0544 test exercises SIGTERM escalation to SIGKILL."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "startBackground awaits panelRunOn and throws SpeckError with code 1 and the timeout message. Passing 0551 AC4 and existing 0544 timeout tests check that the started process has stopped before rejection."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported relevant tests and repository checks total 144 passed, 0 failed and 3 skipped. The diff shows no weakened existing tests or unrelated changes."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/panel-run.mjs",
        "issue": "stopStarted waits only for the process-group leader. If the leader exits after SIGTERM while a descendant ignores it, cleanup returns without sending SIGKILL to that descendant. The panel then claims it stopped everything despite leaving part of the group running, violating AC1.",
        "suggested_fix": "Wait for the process group to stop, escalating to SIGKILL while any live member remains. Add a regression test with a leader that exits on SIGTERM and a child in its group that ignores SIGTERM; assert cleanup resolves only after both have stopped.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The timeout now waits for cleanup and gives a useful error, and the relevant tests pass. However, cleanup can leave a child process running after its parent stops. That gap needs fixing before merge."
  }
}
```

</details>
