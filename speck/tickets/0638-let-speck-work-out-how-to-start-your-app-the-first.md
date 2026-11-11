---
id: "0638"
title: "Let speck work out how to start your app the first time it needs to"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-11

---
# 0638 · Let speck work out how to start your app the first time it needs to

**Status:** 📋 ready

## Problem
speck checks a build's question in the running app only once `commands.start` is set, and every project starts its app differently: this repo's is the panel, another's a CRM. Setting it by hand in each project is a chore you only find out about when a check-in-the-app question comes to you instead.

## Outcome
The first time speck needs a project's app and `commands.start` isn't set, it works out how to start the app from the project, checks that it answers, saves it and carries on with the check.

## Acceptance criteria
1. `speck app <id> --start "<command>"`, with `--url "<address>"` optionally, starts the app with that command and address instead of `commands.start` and `app_url`, for that run only, `{port}` working as in them.
2. When `commands.start` is blank and an app started that way answers, `speck app` saves the command, and the address when one was given, as `commands.start` and `app_url` in `speck/config.yml`, commits only that file on the base branch as `speck: set how to start the app`, and says so in one line. With `commands.start` already set, it saves nothing. When `speck/config.yml` has uncommitted changes on the base branch, it saves nothing, says why, and leaves the app running.
3. With `watch: fix` or `decide` and `commands.start` blank, `speck run` starts its watch agent for a low-risk ticket blocked with a `Check in the app:` line, as it does when `commands.start` is set, with a brief that says first to work out from the project (its README, its package or build files and its scripts) how to start its app on a given port and try it with `speck app <id> --start`, then to check as it does today.
4. When nothing it tries answers, the agent asks you how to start the app, naming each command it tried and the last lines it wrote, and the question waits for you.
5. With `watch: tell` or `off`, or high risk, a question with a `Check in the app:` line waits for you as it does today.

## Out of scope
- Working out a start command when `speck init` or the setup skill runs: speck learns it the first time a check needs it.
- Changing a `commands.start` that's already set, even one that no longer works.

## Notes
- Builds on 0634 (`speck app`, `scripts/app.mjs`) and 0636 (`scripts/app-check.mjs`, which today starts the agent only with `commands.start` set).
- The commit on the base branch works as `speck split-off` commits a ticket: in a short-lived checkout of the base branch when no checkout has it.
- This repo's own `commands.start` was set by hand on 2026-11-11: `node scripts/speck.mjs panel --port {port}`.
- `scripts/foreman-agent.mjs` is at 600 lines, so brief changes may need to live in `scripts/app-check.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
