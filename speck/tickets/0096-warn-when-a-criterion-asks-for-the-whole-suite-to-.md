---
id: "0096"
title: "Warn when a criterion asks for the whole suite to pass"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-keep-builders-to-their-own-ticket.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0100"]                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-11T08:18:15.053Z"

---
# 0096 · Warn when a criterion asks for the whole suite to pass

**Status:** 🔨 building

## Problem
A criterion like "the full test suite passes" can't be met when `main` is already broken, so it pushes the builder to fix things outside the ticket. That's how 0090 came to fix an unrelated test.

## Outcome
Tickets ask that no test that passed before the change fails, and `speck lint` warns when a criterion asks for the whole suite to pass.

## Acceptance criteria
1. The `speck-ticket` skill tells the writer to phrase suite-wide criteria as "no test that passed before this change fails", and never as "the full test suite passes" or similar.
2. `speck lint <id>` prints a `!` warning naming the criterion when one asks for the full, whole or entire test suite, or all tests, to pass, and suggests the wording above.
3. As with lint's other warnings, it doesn't make `speck lint` fail or stop `speck set <id> status ready`.
4. A criterion that doesn't ask for the whole suite to pass gets no such warning.

## Out of scope
- Rewording existing tickets.
- Builder and reviewer behaviour (0095).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
