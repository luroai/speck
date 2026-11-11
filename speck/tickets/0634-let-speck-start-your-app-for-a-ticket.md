---
id: "0634"
title: "Let speck start your app for a ticket"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0634 · Let speck start your app for a ticket

**Status:** 🔍 reviewing

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
