---
id: "0772"
title: "Let speck serve --stop stop the installed service"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-26-let-speck-serve-stop-stop-the-installed-service.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0771"]                # ticket ids that must be done first
created: 2026-11-26

---
# 0772 · Let speck serve --stop stop the installed service

**Status:** 📋 ready

## Problem
Once `speck serve --install` has made it a service, `speck serve --stop` stops `speck serve`, and the service starts it again a few seconds later, which looks like a bug.

## Outcome
`speck serve --stop` stops an installed `speck serve` and it stays stopped until it's started again.

## Acceptance criteria
1. With the service installed, `speck serve --stop` stops the service itself (systemd on Linux, launchd on a Mac), so `speck serve` stays stopped, and says how to start it again.
2. It also stops every panel `speck serve` started, and leaves each `speck run` on, as `--stop` does today.
3. The service stays installed and starts again at the next boot; `--uninstall` still removes it.
4. Without the service installed, `speck serve --stop` works as today.
5. The brief's `speck serve` row says what `--stop` does with the service installed. No test that passed before this change fails.

## Out of scope
- Restarting the service: `--install` again, or the system's own commands.

## Notes
- From 0759's own note: the service restarts `speck serve` whenever it stops (systemd `Restart=always`, launchd `KeepAlive`).
- Unverified: `systemctl --user stop` and `launchctl bootout` stop it without disabling it at boot; check while building.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
