---
id: "0759"
title: "Start speck serve when the machine starts"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-11-10-run-a-software-factory-from-one-speck-service.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0756"]                # ticket ids that must be done first
created: 2026-11-25
started: "2026-11-26T10:20:32.303Z"

---
# 0759 · Start speck serve when the machine starts

**Status:** 🔨 building

## Problem
After a restart, nothing of speck comes back until someone starts it by hand, so the panel is unreachable from a phone and no work moves.

## Outcome
`speck serve --install` makes `speck serve` start when you log in or the machine starts, and restart if it stops.

## Acceptance criteria
1. On Linux, `speck serve --install` writes a systemd user service that runs `speck serve` with the port and `--url` given, enables it to start at boot (with lingering) and starts it, then prints how to see its status and log.
2. On a Mac, `speck serve --install` writes a launchd agent that runs `speck serve` at login and keeps it running, and loads it.
3. `speck serve --uninstall` stops and removes what `--install` wrote, and nothing else.
4. Running `--install` again replaces the service with the new arguments rather than adding a second.
5. The brief's command table describes `--install` and `--uninstall`. No test that passed before this change fails.

## Out of scope
- Windows.
- Setting up the tunnel or its login.

## Notes
- Step 1 of the factory (see the source idea): one speck service per machine runs every project behind one address, so the user can sign in from any device and see every project, instead of starting a panel and a `speck run` in each project.
- risk: high because it writes and enables a system service on the user's machine.
- Checked 2026-11-26: `systemctl --user` (systemd 259 on the user's Linux box, its user manager running) and `loginctl enable-linger [USER]` (loginctl(1): starts the user's manager at boot and keeps it after logout) as the ticket says. `launchctl bootstrap gui/<uid> <plist>` and `launchctl bootout gui/<uid>/<label>` are launchctl(1)'s way to load and unload a login agent on current macOS; not run here, as this machine is Linux.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
