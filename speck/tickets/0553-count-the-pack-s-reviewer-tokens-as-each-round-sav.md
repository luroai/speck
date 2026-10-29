---
id: "0553"
title: "Count the pack's reviewer tokens as each round saved them"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-28-count-the-pack-s-reviewer-tokens-as-each-round-saved-them.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-29
started: "2026-10-29T14:13:41.438Z"

---
# 0553 · Count the pack's reviewer tokens as each round saved them

**Status:** 🔨 building

## Problem
The review pack's and the Delivery log's "Reviewer tokens" line still adds up each round's raw usage input and output. Since 0546 the panel and `speck status --json` count each round as it saved its tokens, so for a resumed Codex round, a Claude round or a Cursor round the pack and the Delivery log give a different figure from the panel's for the same ticket.

## Outcome
The review pack's and the Delivery log's "Reviewer tokens" figure is the one the panel shows for the same ticket.

## Acceptance criteria
1. The review pack's "Reviewer tokens" line adds up each round's tokens as `speck status --json` counts them since 0546: the tokens the round saved (its uncached and cached input, cache writes and output added up), so it matches the panel's figure for the same ticket.
2. The "Reviewer tokens" line `speck close` writes in the Delivery log at approval gives the same figure as the review pack.
3. A round saved without its own tokens, as rounds were before 0529, counts its usage's input plus output, as today.
4. The line's wording and number format are unchanged, for example `Reviewer tokens: 166,010`.
5. No test that passed before this change fails.

## Out of scope
- Rewriting the Delivery logs of tickets already shipped.
- How rounds save their tokens (0529, 0546).

## Notes
- Asked for 2026-10-29 for the 0.21.1 patch release.
- From 0546's builder note: the line comes from `reviewTotals` in `scripts/pack.mjs`, which `scripts/close.mjs` also uses. 0546's per-round count is in `scripts/spend.mjs`, beside `roundSplit`.
- Shares `scripts/spend.mjs` with 0556, unchained: this one reads the per-round count beside `roundSplit`, 0556 changes how `recordDelegatedSpend` finds Codex sessions.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
