---
id: "0546"
title: "Count each review round's tokens as it saved them"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-27-count-reviewer-tokens-as-each-round-saved-them.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0545"]                # ticket ids that must be done first
created: 2026-10-27

---
# 0546 · Count each review round's tokens as it saved them

**Status:** 📝 draft

## Problem
The panel's "Reviewer tokens" figure, and each round's `tokens` in `speck status --json`, add up the raw input and output a round's usage reports. A resumed Codex round's usage covers the whole session, so earlier rounds are counted again; a Claude round's cache reads and writes are left out; and a Cursor round's camelCase usage reads as 0. Anyone looking at what review costs sees the wrong number, and the ticket's total (0526) already counts it differently.

## Outcome
Each review round's tokens are counted as the round saved them, as the ticket's total does, in the panel and in `speck status --json`.

## Acceptance criteria
1. In `speck status --json`, each round's `tokens` is the tokens the round saved when it was recorded (its uncached and cached input, cache writes and output added up), the same figure the ticket's `total_tokens` counts for that round.
2. A round saved without its own tokens, as rounds were before 0529, keeps today's figure: its usage's input plus output.
3. A resumed Codex round counts only its own tokens, not the session's earlier rounds, and a Cursor round's tokens are its real count, not 0.
4. The panel's "Reviewer tokens" figure for a ticket, and the Shipped lane's median of it, add up the rounds' `tokens` as above.
5. No test that passed before this change fails.

## Out of scope
- Re-saving or backfilling old rounds (0528 did the backfill).
- Builder tokens and costs.

## Notes
- From review round 1 of 0526 (F1), which fixed this for `total_tokens` only.
- Today: each round's `tokens` is set in `scripts/speck.mjs` (`rounds:` in the status entry) from `meta.usage`; a round's saved tokens come from `roundTokens` in `scripts/round-cost.mjs` (0529); the panel shows it in `templates/panel.js` ("Reviewer tokens").

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
