---
id: "0756"
title: "Run every listed project from one speck service"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "deep"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-11-10-run-a-software-factory-from-one-speck-service.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0755"]                # ticket ids that must be done first
created: 2026-11-25
built_on: "0755"
started: "2026-11-26T09:39:22.799Z"

---
# 0756 · Run every listed project from one speck service

**Status:** 🔨 building

## Problem
Each project needs its own `speck panel`, on its own port, started by hand in its own folder; a panel that stops stays stopped until someone notices. There's no one thing to start that brings up every project on the machine.

## Outcome
`speck serve` starts and looks after a panel for every listed project, each on its own copy of speck, from one command.

## Acceptance criteria
1. `speck serve` starts a panel for every project on `speck projects`' list that has none running, each with that project's own `.speck/` copy, on its own free port on 127.0.0.1, and prints the address of each; a project whose panel is already running is left as it is.
2. While `speck serve` runs, a panel it started that exits is started again within 10 seconds, and a project added to or removed from the list is started or stopped within 10 seconds.
3. `speck serve --background` keeps it running after the shell ends, writing its output to a log in the home folder, and `speck serve --stop` stops it and every panel it started, and nothing else.
4. A project on an older speck, from 1.5.0 on, runs on its own copy and is listed and switched to like any other.
5. The brief's command table describes `speck serve`, `--background` and `--stop`. No test that passed before this change fails.

## Out of scope
- One address in front of them all: the ticket after this.
- Starting each project's `speck run`: a ticket of its own.
- Starting at boot: a ticket of its own.

## Notes
- Step 1 of the factory (see the source idea): one speck service per machine runs every project behind one address, so the user can sign in from any device and see every project, instead of starting a panel and a `speck run` in each project.
- Each project keeps its own panel process and `.speck/` version; this supervises them rather than running them in one process. `speck panel --background` (`scripts/panel-background.mjs`) and the panels registry (`scripts/panel-projects.mjs`) can be reused.
- Only one `speck serve` may run per machine at a time; a second says where the first is and exits.
- Failing before this build: not checked
- Self-check: a restart no longer takes its own panel's server, still going away, for one started by hand; a home folder it can't write to gives a plain message rather than a stack trace; the record is written only when it changes, and a failed write is said once rather than ending speck serve; `--stop` also stops a panel started after it read the record; a process counts as speck's only when `ps` says so; a panel that won't start is tried again when that's due rather than at the next 2-second check; tests added for each panel's `speck/.cache/panel.log`, restarting on the same port and a panel that won't start.
- Pictures: none, because nothing anyone sees in the panel changes: `speck serve` is a command, and the panels it starts are the projects' own.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
