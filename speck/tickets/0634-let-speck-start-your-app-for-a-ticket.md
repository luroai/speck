---
id: "0634"
title: "Let speck start your app for a ticket"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-11-virgil-checks-the-work-in-the-running-app.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T11:01:27.366Z"
approved: "2026-11-11T11:18:20.629Z"

---
# 0634 · Let speck start your app for a ticket

**Status:** 👍 approved

## Problem
A build that changes how an app looks or behaves often blocks asking you to check it in the running app, and speck has no way to start a project's app itself. Before speck can check anything in the app, it needs to know how to start it and where to open it.

## Outcome
`speck app <id>` starts the project's app from a ticket's checkout on a free port and prints the address to open it at.

## Acceptance criteria
1. With `commands.start` set in `speck/config.yml`, `speck app <id>` runs it from the ticket's worktree (or the main checkout when the ticket has none), with `{port}` in it replaced by a free port, waits until `app_url` (with its `{port}` replaced the same way, default `http://127.0.0.1:{port}/`) answers, and prints that address. The app keeps running after the command returns.
2. When the address doesn't answer within `app_start_seconds` (default 60), `speck app <id>` stops everything it started, prints the last lines the app wrote and exits non-zero.
3. `speck app <id> --stop` stops the app it started for that ticket, with every process it started, and nothing else; with none running, it says so in one line.
4. With `commands.start` blank or missing, `speck app <id>` refuses in one line, saying to set it, and starts nothing.
5. `speck config set` sets `commands.start`, `app_url` and `app_start_seconds`, checking each as speck reads it, and `speck config show` explains them.

## Out of scope
- Logging in: 0635. Speck using it to check a build's question: 0636.

## Notes
- Decided 2026-11-11: a start command and an address in `speck/config.yml`, started from the build's folder on a free port.
- Stop by the process ids it recorded, never by name or pattern, so it can't stop your own apps or panels.
- Failing before this build: not checked
- Self-check: a start command that starts the app in the background and ends is no longer taken as the app failing while the processes it started still run; a blank app_url in speck/config.yml shows as the default in speck config show. The settings sit under Building and reviewing in speck config show, as the group list must match the panel's.
- Pictures: none, because nothing anyone sees in the panel changes: speck app is a command.

## In plain words
speck can now start your project's app for a ticket. Tell it once how to start the app (`commands.start`, with `{port}` where the port goes) and, if it isn't the usual local address, where to open it. Then `speck app <id>` starts the app from that ticket's copy of the code on a free port, waits until it answers, and prints the address to open. `speck app <id> --stop` stops it, along with anything it started, and leaves your own apps and other tickets' apps alone. If the app doesn't answer in time (60 seconds unless you change it), speck stops it and shows you the last lines it printed.

To try it: set `commands.start` with `speck config set`, run `speck app` on a ticket, open the address it prints, then stop it with `--stop`. Nothing uses this by itself yet: later tickets will let speck log in and check a build's question in the running app.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The startup deadline can be exceeded indefinitely.; F2 Concurrent starts for the same ticket can both read no record, await freePort(), launch separate apps and overwrite the same JSON record.
Round 2 (codex): changes requested.
Round 3 (codex): approve.

## Delivery log
- Review rounds: 3
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 481,995
- Elapsed since build started: 17 min
- Changed lines: 188 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Known limits (no idea notes): two `speck app` starts for the same ticket at the very same moment can both start an app; `--stop` stops both. A process the app starts that clears its own environment is still found while the process that started it is running, but not once that one has gone.
- No follow-ups went to the inbox.

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
    "reviewed_sha": "2e25b5ae9daae48080cb63b668684148c8f20354",
    "session": "fresh",
    "thread_id": "01a1ca4e-faec-7d23-ae78-c33f3cd19597",
    "builder_response": "- Tests run: `speck test --related test/app-0634.test.mjs test/config-show-0269.test.mjs` (the ticket's own tests, config-show-0269 which the change first broke, and every related test file it chose, with commands.checks): 2502 tests, 0 failing.\n- Note: tests were written alongside the code rather than first, so they weren't seen failing before the code; each AC test exercises the new command or setting, which didn't exist before.\n- `speck app` runs as its own process in the test helper (test/support/cli.mjs adds `app` to OWN_PROCESS), as it calls process.exit like `speck panel --background`.\n- The app settings appear under \"Building and reviewing\" in `speck config show`, not a group of their own: config-show-0269 requires its groups to match the panel's Settings view, and the panel is unchanged.\n",
    "seconds": 32,
    "usage": {
      "input_tokens": 144341,
      "cached_input_tokens": 87936,
      "cache_write_input_tokens": 0,
      "output_tokens": 872,
      "reasoning_output_tokens": 111
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 56405,
      "cached": 87936,
      "write": 0,
      "output": 872
    },
    "cost_usd": 0.1303236,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T11:12:47.344Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "startApp in scripts/app.mjs selects the ticket checkout, substitutes a free port and leaves the detached app running. Both AC1 tests passed."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The AC2 test passed for a server that never listens, but answers() has an inactivity timeout rather than an absolute deadline. startApp awaits it before checking app_start_seconds again."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The AC3 test passed for a single start. Concurrent starts can overwrite the one saved process record, leaving an app that --stop cannot find."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "startApp rejects blank or missing commands.start before spawning anything; the AC4 test passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "scripts/config.mjs validates and saves the three settings; cmdConfigShow explains them through APP_SETTINGS. The AC5 configuration test passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/app.mjs:71",
        "issue": "The startup deadline can be exceeded indefinitely. answers() uses the HTTP socket inactivity timeout, so a server that continually sends an incomplete response header keeps the request pending. startApp awaits that request and never reaches its deadline check or cleanup.",
        "suggested_fix": "Apply an absolute request deadline bounded by the remaining startup time, destroy the request when it expires, and test a server that trickles an incomplete HTTP response.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/app.mjs:101",
        "issue": "Concurrent starts for the same ticket can both read no record, await freePort(), launch separate apps and overwrite the same JSON record. --stop then stops only the last recorded app, leaving the other running. Concurrent failure cleanup can also delete the other invocation's record.",
        "suggested_fix": "Serialise start and stop operations with a shared per-ticket lock, retain ownership of records during cleanup, and add a concurrent-start test proving that stopping the ticket leaves no app processes running.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The normal start, stop and configuration flows pass their tests. Two lifecycle problems need fixing: a partially responding app can make startup wait forever, and simultaneous starts can leave an app running that speck can no longer stop."
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
    "reviewed_sha": "c93f268cc3a52cfe30c9fb47ca960db8c5d0aa86",
    "session": "continued",
    "thread_id": "01a1ca4e-faec-7d23-ae78-c33f3cd19597",
    "builder_response": "- Tests run: test/app-0634.test.mjs test/config-show-0269.test.mjs (with commands.checks): 0 failing.\n- F1: fixed. `answers(url, ms)` in scripts/app.mjs now has an absolute deadline (a timer that destroys the request), and the start loop passes it the smaller of 1 s and the time left before app_start_seconds. New test \"0634 AC2: an app that keeps sending a response it never finishes…\" starts a server that writes a status line, then a byte every 100 ms forever, and checks speck app fails within app_start_seconds.\n- F2: fixed. Start and stop for a ticket run under a per-ticket lock file in speck/.cache/apps/<id>.lock (`withLock`), created with `wx`; a second start or stop while it's held by a live process refuses in one line, and a lock left by a dead process is taken over. Records are only written, read and removed under the lock. New test \"0634 AC3: two starts at once leave one app…\" runs two starts concurrently, checks only one app address results, then --stop leaves the app's own child process gone and a second --stop finds none. The brief's row says so.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 291424,
      "cached_input_tokens": 216448,
      "cache_write_input_tokens": 0,
      "output_tokens": 1624,
      "reasoning_output_tokens": 141
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 18571,
      "cached": 128512,
      "write": 0,
      "output": 752
    },
    "cost_usd": 0.0575132,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T11:14:33.559Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "startApp and launch select the ticket checkout, substitute a free port, wait for the address and leave the app running. Both AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "answers now enforces an absolute timer bounded by the remaining startup time. Both AC2 tests passed, including the incomplete response regression test; launch reports the last log lines after cleanup."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The ordinary stop and concurrent-start tests passed, but withLock still permits overlapping owners during lock creation or stale-lock recovery, allowing an app record to be overwritten."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "startApp refuses blank or missing commands.start before acquiring a lock or spawning an app. The AC4 test passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "checkConfigValue validates the settings, cmdConfig saves them and cmdConfigShow explains them through APP_SETTINGS. The AC5 configuration test passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/app.mjs:71",
        "issue": "The unbounded readiness request is fixed: answers now destroys the request on an absolute deadline, and launch bounds that deadline by the remaining startup time.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/app.mjs:86",
        "issue": "The lock fix remains racy. writeFileSync with wx creates the file before writing its PID; another process can read the empty file, treat it as stale and unlink a live owner's lock. Also, two processes can both read a stale PID, after which one removes the stale lock and acquires a new one while the other unlinks that new lock using its earlier stale observation. Both can then launch apps and overwrite the same record. The unconditional finally unlink can remove another owner's lock too. The passing concurrent-start test does not force either interleaving.",
        "suggested_fix": "Use a locking protocol that publishes ownership atomically and safely serialises stale-lock recovery. Release only the lock actually owned by the invocation. Add deterministic coverage for contention during ownership publication and simultaneous recovery of a stale lock.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The startup timeout is fixed and its regression test passes. The concurrency fix still has a race that can leave an app running without a record, so speck cannot reliably stop everything it started. That needs fixing before approval."
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
    "reviewed_sha": "07785fd61e47e9b973708f7f57514099a4ae72f1",
    "session": "continued",
    "thread_id": "01a1ca4e-faec-7d23-ae78-c33f3cd19597",
    "builder_response": "- Tests run: test/app-0634.test.mjs test/config-show-0269.test.mjs (with commands.checks): 0 failing.\n- F2: fixed by removing the need for a lock rather than hardening it. The lock and its stale-recovery are gone. Every process an app starts now carries `SPECK_APP_RUN=<ticket mark>:<start id>`, where the ticket mark is a hash of the main checkout's real path and the ticket id. `--stop` ends every process carrying the ticket mark (and anything they started), so it stops every app ever started for the ticket, whether or not its record survived, and two starts at once can't leave an app it can't find. Each start writes its own record and log, `speck/.cache/apps/<id>/<start id>.json|.log`, so no start overwrites another's, and a failed start stops and removes only its own (by its start id). Tests: \"two starts at once, however they interleave, leave nothing running once --stop has run\" (all the addresses either start printed stop answering); \"--stop stops an app whose start record was lost or overwritten\" (deterministic: start, delete the records, start again, --stop: both apps and their child processes are gone); \"--stop for one ticket leaves another ticket's app running\". The brief's row says so.\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 479747,
      "cached_input_tokens": 382976,
      "cache_write_input_tokens": 0,
      "output_tokens": 2248,
      "reasoning_output_tokens": 151
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 21795,
      "cached": 166528,
      "write": 0,
      "output": 624
    },
    "cost_usd": 0.0664828,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T11:18:09.810Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/app.mjs startApp selects the ticket checkout, substitutes a free port, waits for the configured address and leaves the detached app running. Both AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "answers enforces an absolute deadline bounded by the remaining startup time; startApp cleans up its own run and reports its last log lines. Both AC2 tests passed, including the trickling response regression."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "stopApp discovers processes using a mark specific to the repository and ticket, independently of saved records. Passed AC3 tests cover child processes, unrelated processes, concurrent starts, lost records, another ticket's app and the no-app message."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "startApp rejects blank or missing commands.start before creating app state or spawning processes. The AC4 test passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "checkConfigValue validates the settings, cmdConfig saves them and cmdConfigShow explains them through APP_SETTINGS. The AC5 configuration test passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/app.mjs",
        "issue": "Readiness requests now have an absolute deadline, preventing an incomplete response from keeping startup waiting indefinitely.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/app.mjs",
        "issue": "The shared record and lock races are removed. Each start has separate files, and stopping discovers all processes marked for the ticket even when records are lost. Concurrent-start and lost-record regression tests passed.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Approved. Speck can start a ticket's app, print its address and stop its processes. The timeout and concurrent-start problems are resolved, with passing regression tests. All five acceptance criteria pass."
  }
}
```

</details>
