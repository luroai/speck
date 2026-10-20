---
id: "0342"
title: "Show when each Codex build log entry happened"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0341"]                # ticket ids that must be done first
created: 2026-10-20
started: "2026-10-20T20:41:14.876Z"

---
# 0342 · Show when each Codex build log entry happened

**Status:** 🔍 reviewing

## Problem
Claude Code and Cursor builds' log lines show when they happened (0080, 0340), but Codex builds' can't: Codex's `--json` events carry no time at all. So a Codex build's log is the only one with no times, and someone following it can't tell when anything happened or whether it's stuck.

## Outcome
Lines in a Codex build's log show when they happened, as Claude Code and Cursor builds' lines do.

## Acceptance criteria
1. In a Codex build's log in the panel, each line that starts an entry (an agent message, a command or a file change) begins with the time speck run's build wrote that event, as `HH:MM:SS`, 24-hour, in the local time of the machine the panel runs on, then a space.
2. A Codex build keeps running, and its later lines keep getting times, when speck run stops or switches to its new code, as builds do today.
3. Pausing, stopping, resuming and handing back a Codex build work as before.
4. Claude Code and Cursor build logs still take each line's time from their own events, and show exactly as before.
5. No test that passed before this change fails.

## Out of scope
- Times for Codex logs written before this ships.
- The Foreman's own log, and `speck run`'s output in the terminal.

## Notes
- Builds are started detached, with stdout and stderr written straight to `speck/.cache/runs/<id>.log` (`scripts/run.mjs`, around line 363), so that they outlive speck run. Whatever records the times must keep that: a build mustn't stop, or stop being found by speck run, because speck run did.
- After 0341, which changes the same reader (`scripts/build-log.mjs`).
- Checked 2026-10-20: a Codex build (`codex exec --json`, the CLI on this machine) emitted `thread.started`, `turn.started`, `item.started`, `item.completed` and `turn.completed` events with no time field on any of them or their items.
- Failing before this build: none
- Self-check: added a test that a Codex build leaving a process that holds its output still ends about 2 seconds after Codex exits, rather than waiting for that process.
- Known limit: when the `codex` command can't be found, the build now starts (its times wrapper does) and exits with code 127, the reason in its log, rather than speck run saying the build couldn't start.
- Pictures: none, because the change adds times to Codex log lines only, and no Codex build log was made here to show; the panel's look is unchanged.

## In plain words
A Codex build's log in the panel now shows the time of each step, as Claude Code and Cursor builds' logs already did, so you can tell when something happened and whether a build has gone quiet. speck notes the time each line arrives, since Codex itself doesn't say. To see it, build a ticket with Codex and open its log in the panel: each message, command and file change starts with a time like 14:05:31. Logs from Codex builds made before this change still have no times. One thing to keep an eye on: if Codex isn't installed, its build now shows as ending straight away with the reason in its log, rather than as never starting.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (none sent to the inbox):
- Known limit: with no `codex` command on the PATH, the build now exits with code 127 and the reason in its log, rather than speck run saying it couldn't start.
- Known limit: when Codex exits leaving a process that still holds its output, the times wrapper waits about 2 seconds for its last lines, then ends; anything that process writes later is lost, where before it reached the log.

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
    "reviewed_sha": "7b3c0ed7d708907a0935d48a1afe077ad4b593d7",
    "thread_id": "01a15b11-ebc5-7fa2-b732-1f6667ef605c",
    "seconds": 26,
    "usage": {
      "input_tokens": 179900,
      "cached_input_tokens": 124416,
      "cache_write_input_tokens": 0,
      "output_tokens": 813,
      "reasoning_output_tokens": 113
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T20:48:09.308Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/codex-times.mjs stamps emitted JSON lines; scripts/build-log.mjs formats speck_at in local HH:MM:SS time. Passing 0342 AC1 tests cover messages, commands, file changes, streamed output and invalid timestamps. scripts/panel.mjs requests times."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/run.mjs starts the wrapper detached with log file descriptors. The passing 0342 AC2 test verifies that it continues emitting timestamped events after its starter exits."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0342 AC3 tests exercise process discovery, pause, continuation, stop, final output and exit status. Existing run-codex-0289 tests cover killed-build resumption and hand-back; both paths use run.mjs startBuild and timedCommand."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "timedCommand leaves Claude Code and Cursor commands unchanged; build-log.mjs prioritises their existing timestamp fields. The 0342 AC4 test and existing log regression tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified recorded output: 186 tests, 183 passed, three skipped, zero failed. The scoped changes and exercised regression tests show no new failure; the whole-suite check remains with shipping."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Codex build entries now show local times, including after speck run stops. The tests support that build controls and other agents’ logs still work. No blocking issues found."
  }
}
```

</details>
