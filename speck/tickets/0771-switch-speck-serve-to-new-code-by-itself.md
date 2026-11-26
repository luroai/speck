---
id: "0771"
title: "Switch speck serve to new code by itself"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-26

---
# 0771 · Switch speck serve to new code by itself

**Status:** 📋 ready

## Problem
The panel and `speck run` switch to new code when speck changes, but `speck serve` keeps running the code it started with. On 2026-11-26 the factory floor shipped and stayed a 404 until `speck serve` was restarted by hand, and every update to speck would need the same.

## Outcome
`speck serve` switches to new code by itself, without dropping its address or the panels behind it.

## Acceptance criteria
1. When the code `speck serve` runs from changes and has settled, `speck serve` is running the new code within 10 seconds, and pages it serves (All projects, the factory floor) come from the new code.
2. While it switches, its port and `--url` keep answering: a request made during the switch gets an answer, not a refused connection.
3. The project panels it started keep running through the switch, and the new code goes on looking after them rather than starting second copies.
4. New code that fails to start leaves the old code serving, says why in its log, and the next change tries again.
5. No test that passed before this change fails.

## Out of scope
- The project panels' own switching, which they already do.

## Notes
- Found 2026-11-26: the systemd service runs `scripts/speck.mjs serve` from speck's own repo, so a ship changes the code under it.
- The panel hands its listening socket to a new process and stops the old one (`restart()` in `scripts/panel.mjs`); `speck run` does the same through `scripts/run-switch.mjs`. `speck serve` is `scripts/serve.mjs` and `scripts/serve-front.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
