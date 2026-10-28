---
id: "0544"
title: "Start speck run in the background from the command line"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-25-turn-speck-run-on-in-the-background-from-the-command-line.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-28T09:43:27.204Z"

---
# 0544 · Start speck run in the background from the command line

**Status:** 🔨 building

## Problem
There's no command to turn `speck run` on in the background, as the panel's switch does. Setup starts it with a shell line (`nohup … run >> run.log &`) and reads the log a few seconds later to guess whether it started, which depends on the agent's shell and on how long it waits. Other agents and scripts have no plain way to do it either.

## Outcome
`speck run --background` turns `speck run` on in the background, as the panel's switch does, and says whether it's on.

## Acceptance criteria
1. `speck run --background` starts `speck run` in its own process, which keeps running after the shell that started it ends, with its output added to `speck/.cache/runs/run.log`. It returns once `speck run` is watching, printing one line that says it's on and where its log is, and exits 0.
2. With `speck run` already running in this repo, it starts nothing, prints that it's already running, and exits 0.
3. If `speck run` refuses or stops before it's watching (for example off the base branch), it prints `speck run`'s own message, leaves nothing running and exits with a non-zero code.
4. Setup's step that turns `speck run` on (section 8, step 5 of the `speck-setup` skill) runs `speck run --background` and reports from what it prints, with no `nohup` line or reading of the log. The brief and `speck help` list `--background` for `speck run`.
5. No test that passed before this change fails.

## Out of scope
- A `--stop` for `speck run`: the panel's switch and Ctrl+C stop it today.
- Changing what `speck run` does once it's on.

## Notes
- From 0510's build: speck had no command for this, so setup copies what the panel's switch does.
- Today: the panel's switch starts it with `panelRunOn` in `scripts/panel-run.mjs` (detached, output to `run.log`, refusal from its own file, 0220); `speck panel --background` is `scripts/panel-background.mjs` (0509), whose messages this should match in style.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
