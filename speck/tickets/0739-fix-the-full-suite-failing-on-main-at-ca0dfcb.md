---
id: "0739"
title: "Fix the full suite failing on main at ca0dfcb"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T17:46:15.632Z"

---
# 0739 · Fix the full suite failing on main at ca0dfcb

**Status:** 🔨 building

## Problem
The full suite fails on main at commit ca0dfcb (ca0dfcb1c1f0915b47bdc98deacf395f57422cfb). Failing tests:
- 0058 AC3 and AC4: in a real browser the counter ticks between polls, and a selection in or across it stays
- 0164 AC3: in a browser whose pointer can't hover, a tapped card keeps its background, and an opened card keeps its opened colour

## Outcome
The full suite passes on main again.

## Acceptance criteria
1. Each of these tests passes on main again: 0058 AC3 and AC4: in a real browser the counter ticks between polls, and a selection in or across it stays, 0164 AC3: in a browser whose pointer can't hover, a tapped card keeps its background, and an opened card keeps its opened colour.
2. No test that passed before this change fails.

## Out of scope
- Changes the failing tests don't need.

## Notes
Failing before this build: 0058 AC3 and AC4 (in a real browser the counter ticks between polls, and a selection in or across it stays), 0164 AC3 (in a browser whose pointer can't hover, a tapped card keeps its background, and an opened card keeps its opened colour). The recorded output kept only its tail, so these come from the ticket.
Cause, 0058 AC3 and AC4: the test's build started 7 min 58 s ago and the counter shows whole minutes rounded down, so after the test's two one-minute steps it read 9 min or 10 min depending on whether the panel and browser started in under two seconds; the test expects two digits. Fixed in the test: the build starts 8 min 30 s ago, so it reads 10 min after two steps unless startup takes over 30 seconds.
Cause, 0164 AC3: since 0727 took Set ready off a closed Plan row, the title runs further left, right above the details line's tags. The test tapped 4 px inside the title's left end, 2 px above the "low" tag, and Chrome's touch adjustment moved the tap onto that tag (a focusable button), so the card didn't open. Found by bisecting: 61061405 passes, ca0dfcb (0727) fails. Fixed in the test: the tap is in the middle of the title, away from every button.
No product code changes: both were the tests' own assumptions. Pictures: none, because nothing anyone sees changes.
Self-check: no changes

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
