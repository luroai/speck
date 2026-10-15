---
id: "0043"
title: "Build ready tickets automatically with speck run"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T14:27:46.963Z"
finished: "2026-10-09T14:46:19.046Z"

---
# 0043 · Build ready tickets automatically with speck run

**Status:** ✅ done

## Problem
Setting a ticket to ready is meant to start the pipeline, but someone still has to open a session and type `/speck-build <id>` for every ticket. With worktrees, builds can run side by side, but only if someone starts each one.

## Outcome
`speck run` watches the board and starts a non-interactive build for each ready ticket that isn't waiting on another, recording each build's session so it can be picked up later.

## Acceptance criteria
1. `speck run` checks the tickets every 5 seconds and launches a build for each `ready` ticket with an empty `waiting_on`, in `speck status` order, while fewer than `max_parallel_builds` (a new setting in `speck/config.yml`, default 1) of the builds it launched are still running. It prints one line when it launches a build and one when a build exits, with the exit code, and runs until stopped. Stopping it launches nothing more and leaves running builds running.
2. Each build runs `build_command` from `speck/config.yml`, from the repo root and without a shell, with `{id}` replaced by the ticket id and `{session}` by a fresh UUID. The config template's default is `claude -p "/speck-build {id}" --session-id {session} --dangerously-skip-permissions`. A blank or missing `build_command` stops `speck run` with a plain message and a non-zero exit.
3. For each build, speck writes `speck/.cache/runs/<id>.json` with the session id, the folder the command ran from, the start time and the process id, and sends the build's stdout and stderr to `speck/.cache/runs/<id>.log`. Nothing in `speck/tickets/` is changed by `speck run` itself.
4. A ticket is launched at most once by one `speck run`. If a build exits while its ticket is still `ready`, speck says so with the last five lines of its log and doesn't launch it again.
5. `speck run` refuses to start, with a plain message and a non-zero exit, when the checkout isn't on `base_branch` or when another `speck run` is already running in this repo.

## Out of scope
- Showing runs or resume commands in the panel (0044).
- Builders other than through `build_command`.
- Retrying failed builds or stopping running ones.

## Notes
- Decided by the user: builds run with `--dangerously-skip-permissions`, because nobody is there to answer permission prompts. Each build works in its own worktree, but the agent can still run any command on the machine. `speck/product.md` must say so under known limits.
- Decided by the user: `auto_ship` and `auto_ship_risk` are unchanged, so a build that's approved ships as configured.
- A blocked build already writes its question, sets `blocked`, commits and exits, so no extra handling is needed for a build that gets stuck.
- Risk is high: it launches agents that can run any command with no prompts.
- Checked 2026-10-09: `claude -p` runs non-interactively, `--session-id <uuid>` sets the session id and must be a valid UUID, and `--dangerously-skip-permissions` bypasses all permission checks (`claude --help`, Claude Code 2.1.294).
- Checked 2026-10-09: `claude -p "/<skill> <args>"` runs a project skill with its arguments, as typing it in a session does (a throwaway skill in a temporary repo replied with its marker and the argument, Claude Code 2.1.294). Without stdin closed, `claude -p` waits 3 seconds and warns "no stdin data received", so builds get stdin from /dev/null.
- Self-check: a `build_command` with an unclosed quote blamed "the reviewer command", so it now names `build_command` (test added). A log file that couldn't be opened would have crashed speck run, so it's now reported as a build that couldn't start (test added). The "already running" message says which lock file to delete if the process holding it isn't speck run. Also checked: non-string, blank and whitespace `build_command`, invalid `max_parallel_builds`, a stale lock from a killed run, a missing command binary, and that stdin is empty. `speck/config.yml` in this repo gets the same two settings as the template, and `product.md`'s parallel-builds limit now says `speck run` waits on `after:`.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 finished checks the main checkout's ticket rather than its authoritative worktree copy.; F2 takeRunLock is not safe under concurrent startup.; F3 launch does not handle failure to write <id>.json after the detached child starts.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 568,222
- Elapsed since build started: 17 min
- Changed lines: 156 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up idea: `SPECK_RUN_POLL_MS` (used by the tests to shorten the 5-second wait) also works for users but isn't documented. Either document it or make it test-only.
- Follow-up idea: a lock whose pid has since been reused by an unrelated process is treated as a live `speck run`. The message says which file to delete, but speck can't tell the difference itself.
- Follow-up idea: `speck run` reports only to its own terminal. Showing its launches, logs and exits in the panel would make it visible (0044 covers sessions for blocked tickets only).

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
    "reviewed_sha": "28c8c33768f8b4d5470b9145ce1c25c467f405cc",
    "thread_id": "01a1211a-37b2-7452-8c81-edc2dc666587",
    "seconds": 51,
    "usage": {
      "input_tokens": 186486,
      "cached_input_tokens": 117504,
      "cache_write_input_tokens": 0,
      "output_tokens": 1339,
      "reasoning_output_tokens": 95
    },
    "saved_at": "2026-10-09T14:39:39.549Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs cmdRun/tick uses statusData order, waiting_on, running.size and a default 5000 ms interval. test/run.test.mjs AC1 tests exercise scheduling, parallel limits and stopping while children survive; builder reports them passing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdRun/launch uses splitCommand, UUID substitution and spawn without a shell, with repo cwd and ignored stdin. AC2 tests verify actual child arguments, cwd, UUIDs, empty stdin, missing commands and template defaults; reported passing."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "AC3 test verifies normal records, both output streams and unchanged tickets. However, launch writes the JSON record after spawning, outside error handling: a record write failure leaves a running build without its required record and terminates the runner."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "The launched Set prevents repeat launches and the AC4 test verifies five log lines. finished reads findTicket(repo, id), which ignores the worktree copy used by statusData, causing false 'still ready' reports for started builds. Tests explicitly disable worktrees."
      },
      {
        "id": 5,
        "status": "fail",
        "evidence": "AC5 tests cover wrong branches, an established live lock and sequential stale-lock recovery. takeRunLock has races during initial PID publication and concurrent stale-lock takeover, allowing two runners to start."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "finished checks the main checkout's ticket rather than its authoritative worktree copy. With default worktrees enabled, a build exiting blocked or approved leaves the main copy ready, so the runner falsely says the build never started and prints its log as a failure.",
        "suggested_fix": "Resolve completion status through statusTickets or statusData, and add a real worktree test where the build changes its worktree ticket to blocked or approved before exiting.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "takeRunLock is not safe under concurrent startup. Exclusive creation exposes an empty file before the PID is written, which another runner treats as stale. During stale recovery, two contenders can both read the dead PID; one can then delete the other's newly acquired lock. Both runners can launch builds.",
        "suggested_fix": "Use a locking protocol with atomic ownership acquisition and safe stale recovery; never treat an incompletely published lock as immediately stale. Add concurrent startup and concurrent stale-recovery tests proving only one runner launches.",
        "state": "open"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "launch does not handle failure to write <id>.json after the detached child starts. For example, an existing directory at 0001.json makes writeFileSync throw: the runner exits, releases its lock and leaves an unrecorded build running. Restarting can launch the same still-ready ticket again.",
        "suggested_fix": "Prepare the record destination before spawning and handle final record-write failures explicitly so the runner remains coherent and reports the running child's session and PID. Add a test with an unwritable or conflicting JSON destination.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The capability and permission risks are documented appropriately, but the single-run guarantee and worktree-aware completion reporting are not reliable until F1 and F2 are fixed."
    },
    "escalation_question": "",
    "summary": "Automatic builds work on the normal paths, and the tests exercise real processes. Three fixes are needed: read completion status from the build's worktree, prevent simultaneous runners from bypassing the lock, and handle failures to save a running build's session record. Tests were inspected; I did not rerun them because this review environment permits no filesystem writes."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "0179e625b183e6c1628e5f3e5afbe93a644f0d40",
    "thread_id": "01a1211a-37b2-7452-8c81-edc2dc666587",
    "seconds": 38,
    "usage": {
      "input_tokens": 378091,
      "cached_input_tokens": 211200,
      "cache_write_input_tokens": 0,
      "output_tokens": 2306,
      "reasoning_output_tokens": 132
    },
    "saved_at": "2026-10-09T14:44:55.770Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs cmdRun/tick defaults to 5000 ms polling, uses statusData ordering and waiting_on, and enforces running.size against max_parallel_builds. test/run.test.mjs AC1 tests exercise ordering, concurrency, continued operation and stopping without killing builds; all pass in the supplied output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdRun/launch splits build_command and invokes spawn without a shell, from the repo root, with UUID and ticket substitutions and empty stdin. AC2 tests verify actual child arguments, cwd, unique UUIDs, missing or blank commands and template defaults; all reported passing."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "launch writes the session record before spawning, updates its PID afterwards, and redirects stdout and stderr to the log. AC3 verifies record fields, both streams and unchanged tickets. The F3 regression verifies an unwritable record prevents that build starting while another proceeds; both reported passing."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The launched Set prevents repeat launches. finished now reads authoritative status through statusData and prints the last five log lines for tickets remaining ready. AC4 tests cover no retry and log tails; the F1 regression creates a real worktree and blocks the ticket there, verifying no false ready report. All reported passing."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "cmdRun rejects checkouts off base_branch. takeRunLock atomically publishes a complete PID file and serialises stale-lock removal with a recovery lock. AC5 tests cover branch refusal, existing runners and stale recovery; new F2 tests race six runners against fresh and stale locks and verify exactly one launches. All reported passing."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Completion reporting previously read the stale main-checkout ticket instead of the build's worktree copy.",
        "suggested_fix": "Implemented: finished uses statusData; a real-worktree regression verifies blocked status is recognised.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Concurrent startup and stale-lock recovery previously allowed multiple runners to acquire the lock.",
        "suggested_fix": "Implemented: atomic hard-link publication and serialised recovery, with concurrent regression tests.",
        "state": "resolved"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "A record-write failure previously crashed the runner after leaving an unrecorded detached build running.",
        "suggested_fix": "Implemented: pre-write the record before spawning and handle subsequent PID-write failures without terminating the runner; regression verifies record conflicts prevent launch.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The updated spec accurately describes scheduling, records, worktree-aware reporting and permissions bypass risks. Auto-ship settings remain unchanged."
    },
    "escalation_question": "",
    "summary": "The three blocking issues are fixed, with meaningful regression tests. Automatic builds now meet the ticket's requirements, and no blocking concerns remain. The supplied results show all 233 tests passing; I inspected the code and tests but could not rerun tests in this read-only environment."
  }
}
```

</details>
