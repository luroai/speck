---
id: "0441"
title: "Measure the panel's layout in a proportional font"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-measure-the-panel-s-layout-in-a-proportional-font.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T07:32:36.679Z"

---
# 0441 · Measure the panel's layout in a proportional font

**Status:** 🔨 building

## Problem
On the build machine, Chrome draws the panel's interface font (`system-ui` and the rest of 0427's stack) as Liberation Mono, a monospace font. So the browser tests that measure how text wraps and how tall cards are see a panel nobody uses, and 0427 had to ease some of their checks for a monospaced panel.

## Outcome
The tests' browser draws the panel in a proportional font, as people see it.

## Acceptance criteria
1. In the browser the tests start, the panel's interface font draws proportionally: the letters `i` and `m` are different widths, on this machine, with nothing installed beyond what's here today.
2. The checks 0427 eased for a monospaced panel ask what they asked before: 0419's and 0420's long titles wrap on at most the lines they allowed before 0427, and a building ticket's details line has no exception for a monospace font.
3. No test that passed before this change fails.

## Out of scope
- The panel's own fonts (0427).

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- From the builder's note on 0427. Liberation Sans is installed here and is proportional; it's fontconfig's choice for `system-ui` that gives Liberation Mono.
- Changes the test support and the eased tests only, so it waits for nothing.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
