---
id: "0634"
title: "Let speck start your app for a ticket"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** 🔨 building

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
