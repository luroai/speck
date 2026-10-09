---
id: "0070"
title: "Pause a running build from the CLI until it's played"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T21:44:55.448Z"

---
# 0070 · Pause a running build from the CLI until it's played

**Status:** 👍 approved

## Problem
Once `speck run` has launched a build, the only way to halt it is to kill its process by hand, which ends it for good. The user sometimes wants a build to hold still for a while (to free the machine, or to look at what it has done so far) and then carry on as if nothing happened.

## Outcome
`speck pause <id>` holds a running build where it is, and `speck play <id>` carries it on from there.

## Acceptance criteria
1. `speck pause <id>`, for a ticket whose build `speck run` launched and is still running, stops the build and every process it started from doing any more work (its log stops growing, and it makes no commits or file changes) until it's played, and prints that it's paused. The ticket's status doesn't change.
2. `speck play <id>`, for a paused build, carries that same build on from where it was paused: the same session, the same worktree and branch with its work so far, and its output going on into the same log. It prints that it's playing.
3. While a build is paused, `speck run` doesn't report it as stopped and doesn't launch another build of the ticket, and it still counts towards `max_parallel_builds`. `speck status --json` gives that ticket `paused: true`, and every other ticket `paused: false`.
4. `speck pause` refuses, with a plain message and a non-zero exit and changing nothing, when the ticket doesn't exist, has no running build launched by `speck run`, or is already paused; `speck play` refuses in the same way when the ticket doesn't exist or isn't paused.
5. A paused build stays paused, and can be played, after the `speck run` that launched it is stopped and started again.

## Out of scope
- Stopping a build for good (0072).
- The panel's pause and play icon (0071).
- Builds started by hand with `/speck-build` rather than by `speck run`: they have no run record.

## Notes
- `speck run` launches each build with `detached: true`, so the build is the leader of its own process group and a signal can reach everything it started, including a Codex reviewer.
- Whatever the mechanism, criterion 2 has to hold for a real build, not only for a test's stand-in build command.
- Checked 2026-10-09: a Claude Code build frozen mid-request with SIGSTOP carries on cleanly after SIGCONT. A real `claude -p … --output-format stream-json` (Claude Code 2.1.296) was frozen mid-reply for 10½ minutes. On SIGCONT, Claude Code found its reply had been cut off, asked the model to resume from where it stopped, in the same session and process, then ran its next tool and ended with `success`. So play doesn't need to end the build and resume its session. Pauses of hours weren't tried.
- Checked 2026-10-09: `claude --resume <session-id>` continues a session by id, and combines with `-p` (`claude --help`, Claude Code 2.1.296).
- product.md's `speck run` description and the list of commands need updating.
- product.md was removed in 0068, so the README's command table and `speck help` were updated instead.
- Checked 2026-10-09: Claude Code runs each Bash command in a session and process group of its own (seen with `ps` during a real build), so a signal to the build's process group alone wouldn't reach its tool commands or a Codex reviewer started from one. Pause and play signal the build's process group, every process carrying the build's session in `SPECK_BUILD_SESSION` (which speck run sets for each build it launches, and which Claude Code passes on to its Bash commands, checked the same way), and everything descended from those.
- Self-check: a build that runs `speck pause` on itself used to stop the pause process too, so the pause never finished or marked the record. Pause now leaves itself out of the processes it signals (test added).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Processes started by a build can escape pause after their immediate parent exits.; F2 cmdPlay removes the paused marker before signalBuild enumerates or resumes processes.
Round 2 (codex): changes requested: F3 After SIGCONT, the build can finish before cmdPlay saves its record.
Round 3 (codex): approve.

## Delivery log
- Review rounds: 3
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,721,078
- Elapsed since build started: 21 min
- Changed lines: 141 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (no inbox notes: each is a known limit or a tidy-up, and the panel icon and stopping a build for good are already 0071 and 0072):
- Known limit: a real Claude Code build was checked carrying on after a 10½-minute pause, not after pauses of hours.
- Known limit: a process that clears its own environment and also leaves the build's process tree can't be found by pause. Catching it would need OS containment such as cgroups.
- Known limit: pause and play refuse on Windows, which has no SIGSTOP or SIGCONT.
- Tidy-up: a `<id>.paused` mark left by a build that died while paused stays in `speck/.cache/runs/` until the ticket is paused again. It's ignored, since it doesn't match the next build's session.

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
    "reviewed_sha": "fa3658cc1ee485e7bd8395bcf6730db4931878d0",
    "thread_id": "01a122ab-b759-7f60-9bf9-6b3552ec5a57",
    "seconds": 36,
    "usage": {
      "input_tokens": 289240,
      "cached_input_tokens": 212736,
      "cache_write_input_tokens": 0,
      "output_tokens": 1039,
      "reasoning_output_tokens": 128
    },
    "saved_at": "2026-10-09T21:57:57.676Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "test/pause-0070.test.mjs AC1 honestly exercises a live build and a detached helper. However, scripts/speck.mjs buildProcesses only finds current descendants or members of the original process group; reparented background processes escape it (F1)."
      },
      {
        "id": 2,
        "status": "unclear",
        "evidence": "The AC2 test verifies same-process continuation and log append using a ticker. The ticket describes a manual Claude experiment, but no inspectable result demonstrates continuation of a real build. cmdPlay also has an unrecoverable signalling failure path (F2)."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "AC3 tests exercise slot retention, no relaunch and true/false JSON flags. cmdRun retains stopped processes through pidAlive; buildPaused reads the persistent marker."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The AC4 test invokes both CLI commands for missing tickets, absent/dead/exited builds, already-paused builds and unpaused builds; checks non-zero exits, plain errors and unchanged records."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The AC5 test stops and restarts the launcher while the build is paused, checks continued inactivity, then plays it successfully. cmdRun adopts the existing live PID without resuming it."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs:2203",
        "issue": "Processes started by a build can escape pause after their immediate parent exits. For example, a Bash tool starts a background helper in its own session and then finishes. The helper is reparented and has a different process group, so buildProcesses cannot associate it with the build; it keeps changing files while pause reports success. The current test keeps the helper's parent alive and misses this case.",
        "suggested_fix": "Track or contain build processes so membership survives reparenting. Add a regression where an intermediate tool exits after launching a detached writer, and verify pause stops that writer and play resumes it.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs:2265",
        "issue": "cmdPlay removes the paused marker before signalBuild enumerates or resumes processes. If that enumeration fails, the build remains stopped but subsequent play refuses because its marker is gone. Likewise, signalBuild silently ignores all signal errors, including permission failures, and can report success without resuming or stopping a live process.",
        "suggested_fix": "Preserve recoverable paused state on signalling failure, distinguish disappeared processes from other signal errors, and roll back partial operations where necessary. Add failure-path tests verifying that a failed play can be retried and never reports a stopped build as playing.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The commands and tests cover ordinary pause, play and launcher restart behaviour well, and the change stays within scope. Two gaps prevent approval: background work can escape the pause, and a failed play can leave a build frozen with no way to retry through the CLI. Real-build continuation also needs inspectable validation. Tests were inspected; I did not rerun tests that write temporary repositories in this read-only review."
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
    "reviewed_sha": "db5c6eec17a88528253a5d2629a66b8afd9fcdaf",
    "thread_id": "01a122ab-b759-7f60-9bf9-6b3552ec5a57",
    "seconds": 30,
    "usage": {
      "input_tokens": 539593,
      "cached_input_tokens": 411648,
      "cache_write_input_tokens": 0,
      "output_tokens": 2054,
      "reasoning_output_tokens": 227
    },
    "saved_at": "2026-10-09T22:02:39.278Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs launch sets SPECK_BUILD_SESSION; buildProcesses combines environment membership, process groups and descendants. AC1 and the F1 regression exercise stopped logs/files, detached writers and unchanged ticket status; supplied results pass."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "AC2 exercises continuation of the same PID, session, folder and log; supplied results pass. The detailed manual Claude experiment supports real-agent continuation. However, cmdPlay can overwrite an exit recorded immediately after continuation (F3)."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "AC3 tests exercise retained capacity, no duplicate launch and paused true/false values. cmdRun watches stopped PIDs as live builds and buildPaused reads the persistent marker."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "AC4 exercises all required refusals and unchanged records. The new F2 tests inject process-list failures and verify pause rollback and retryable play; supplied results pass. signalBuild now distinguishes ESRCH from other signalling errors."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "AC5 stops and restarts speck run, verifies the existing build remains paused, then successfully plays it. The persistent record and adoption logic preserve this behaviour."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs:buildProcesses",
        "issue": "Resolved for detached background processes inheriting the build environment: membership now survives their parent's exit, and a regression exercises that behaviour.",
        "suggested_fix": "No further fix required for the reported case.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs:signalBuild, cmdPause, cmdPlay",
        "issue": "Resolved: signalling failures are reported, failed pauses resume the processes already stopped, and failed plays retain the marker so they can be retried. The new tests exercise actual process-list failures without mocking away pause/play.",
        "suggested_fix": "No further fix required for the reported failure path.",
        "state": "resolved"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "scripts/speck.mjs:cmdPlay",
        "issue": "After SIGCONT, the build can finish before cmdPlay saves its record. speck run then adds exited and exit_code through recordExit, but cmdPlay writes the stale b.rec captured before signalling, removing those exit fields. This loses completion information and can make the board omit a failed build's exit. Resuming before writing introduced this race.",
        "suggested_fix": "Coordinate record updates so clearing paused preserves concurrently recorded exit fields and checks that the record still belongs to the same build. Add a regression where the resumed build exits and its exit is recorded before play clears the marker.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Both earlier problems are fixed and have meaningful regression tests. One new race remains: a build that finishes immediately after play can have its completion record overwritten, hiding its exit result. Fix that before merge. I inspected the updated code and tests; the supplied suite reports 527 passing tests, but I did not rerun it in this read-only review."
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
    "reviewed_sha": "a5e84be93310b2d22a685c9dcece802d162c2e16",
    "thread_id": "01a122ab-b759-7f60-9bf9-6b3552ec5a57",
    "seconds": 23,
    "usage": {
      "input_tokens": 886217,
      "cached_input_tokens": 710656,
      "cache_write_input_tokens": 0,
      "output_tokens": 2935,
      "reasoning_output_tokens": 227
    },
    "saved_at": "2026-10-09T22:06:06.853Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs cmdPause and buildProcesses stop the build, its process group, session-tagged processes and descendants. AC1, self-pause and F1 regression tests exercise halted logs/files, detached background work and unchanged ticket status; supplied results pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdPlay resumes existing processes without replacing their session, folder or log. AC2 verifies identical PID/session/cwd, appended output and an unchanged run record. The F3 regression verifies an immediate exit retains exited and exit_code. Supplied results pass; the ticket also records the manual Claude continuation experiment."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cmdRun continues counting stopped live processes and never relaunches them. buildPaused validates the separate marker against the current session/PID and excludes exited/dead builds. AC3 tests cover capacity, no relaunch, JSON flags and stale markers; supplied results pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "runRecord, cmdPause and cmdPlay enforce the required refusals. AC4 checks plain errors, non-zero exits and unchanged records/markers. F2 tests verify rollback after failed pause and retry after failed play; supplied results pass."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The pause marker persists independently of the launcher. AC5 restarts speck run, verifies continued inactivity and paused status, then successfully plays the existing build; supplied results pass."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs:buildProcesses",
        "issue": "Resolved: inherited session tagging finds detached background processes after their parent exits, with a regression covering pause and play.",
        "suggested_fix": "No further change required for the reported case.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs:signalBuild, cmdPause, cmdPlay",
        "issue": "Resolved: signalling failures are reported, failed pauses roll back and failed plays retain a retryable pause marker.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "scripts/speck.mjs:cmdPlay, buildPaused",
        "issue": "Resolved structurally: pause/play write only the separate marker, so they cannot overwrite speck run's exit record. Tests check record immutability and completion immediately after play.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Approved. Pause and play preserve the running build and survive launcher restarts. All three reported problems are resolved, with meaningful regression coverage and no unrelated changes. The supplied suite reports 528 passing tests; I inspected the code and tests but did not rerun them in this read-only review. Real Claude continuation was manually checked for a 10½-minute pause; pauses lasting hours remain untested."
  }
}
```

</details>
