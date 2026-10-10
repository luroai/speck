---
id: "0100"
title: "Add fix tickets for a broken main at P0"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-a-shipping-agent-that-heals-the-build.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T18:38:18.271Z"

---
# 0100 · Add fix tickets for a broken main at P0

**Status:** 🔨 building

## Problem
When `main` breaks, every ship stops until it's fixed, so the fix must come before everything else. speck's tickets have only one type besides the default (`bug`) and priorities 1 to 5, so a fix can't be marked or ordered ahead of everything else.

## Outcome
Fix tickets are a ticket type of their own, for a broken `main`, at priority 0 (P0), ahead of everything.

## Acceptance criteria
1. `speck new "<title>" --type=fix` creates a fix ticket with priority 0. `speck lint` accepts `type: fix`.
2. Priority 0 is valid only on a fix ticket: `speck lint` reports it as an error on any other ticket, and `speck set <id> priority 0` refuses on one.
3. Fix tickets sort first wherever tickets are ordered by priority, including the order `speck run` starts them.
4. `speck status` and the panel mark fix tickets (as `fix`), as they mark bug tickets.

## Out of scope
- Creating fix tickets automatically (0101).

## Notes
- Bug tickets (0049) are the model for the type and its mark.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
