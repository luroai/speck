---
id: "0772"
title: "Let speck serve --stop stop the installed service"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
started: "2026-11-27T01:44:03.990Z"

---
# 0772 · Let speck serve --stop stop the installed service

**Status:** 🔨 building

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
- Checked 2026-11-27: `systemctl --user stop` stops a unit without disabling it (systemctl(1): enablement is only changed by enable/disable), and `Restart=always` doesn't restart a unit stopped that way. `launchctl bootout` unloads a launch agent without marking it disabled (launchctl(1): only `launchctl disable` does that), so an agent in ~/Library/LaunchAgents is loaded again at the next login.
- speck (2026-11-27 01:36 UTC) I'll resume 0772 at 02:30 UTC: speck run launched 0772 just as 0771's ship was handed back to its build for a clash in the brief, so speck start refused to begin it; 0771 has since finished its rework and should ship within the hour, so the build should try again then rather than now. Its instruction: Run speck start 0772 again. If 0771 has shipped, or is approved and its work merges cleanly, build 0772 as normal, and check from Apple's own documentation whether launchctl bootout leaves the service set to start at the next login. If speck start still refuses because 0771 isn't done, end without changing anything.
- 2026-11-27: its first build stopped before starting, as speck run started it on 0771's approved work just as 0771 was handed back for a clash. Set ready again once 0771 shipped.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
