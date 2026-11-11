---
id: "0656"
title: Make the full suite pass on main again                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-11

---
# 0656 · Make the full suite pass on main again

**Status:** 📋 ready

## Problem
The full suite (`commands.test_full`) fails on `main` at `a95b3c3`, so the panel has shown Needs you since 16:11 on 2026-11-11. Four tests fail: two 0285 AC3 tests of the Auto-build switch in `test/foreman-0285.test.mjs`, since 0646 added a usage request that the fake page answers out of turn; 0161 AC1, as `#settings .sub .win .fill` (0646's usage bar) fills with `--muted` and sets no text colour; and 0427 AC1, as `#full-suite .full-suite-fact .label` (0655) is set at 13 px.

## Outcome
The full suite passes on `main` again, so Needs you clears.

## Acceptance criteria
1. Both 0285 AC3 tests (the Auto-build switch turns speck run on and off; a refused switch shows speck run's own message) pass with Settings asking for usage as 0646 made it, without changing what the switch does.
2. Every coloured background in the subscriptions' usage bars either holds no text or sets its own text colour, so 0161 AC1 passes.
3. The full-suite view's fact labels use a text size the panel allows, so 0427 AC1 passes.
4. `npm test` passes on this change, and no test that passed before it fails.

## Out of scope
- Running these rule tests before ships: 0657.

## Notes
- Raised by speck while looking into 0652's long build; completed 2026-11-11 with the other two failures from the full run at `a95b3c3`.
- Checked 2026-11-11: each fails alone with `node --test` (0161: "#settings .sub .win .fill fills with --muted and sets no text colour"; 0427: "#full-suite .full-suite-fact .label: font-size 13px").

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
