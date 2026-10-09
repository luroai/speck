---
id: "0033"
title: Show everything needed for Gate 1 in Shaping                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T12:47:52.575Z"

---
# 0033 · Show everything needed for Gate 1 in Shaping

**Status:** 🔨 building

## Problem
At Gate 1 you need the whole ticket in front of you, but the panel's Shaping area shows only a criteria count, a lint result and the criteria. Ideas and tickets are also mixed in one list, so it isn't obvious which kind you're looking at.

## Outcome
Shaping shows tickets and ideas separately, with a clear colour for each, and opening a draft ticket shows everything needed to judge it.

## Acceptance criteria
1. `speck status --json` adds, for each ticket: `problem`, `outcome`, `out_of_scope` and `notes` (each section's text without template comments, or `null` when it has no other content), `self_check` (the text after `Self-check:` on the first line of Notes that starts with it, or `null`) and `lint_messages` (`{"errors": [...], "warnings": [...]}` with the same text `speck lint` prints). Each idea gets `body`: the note's full text. Every existing field is unchanged.
2. The page header shows the repo, the base branch and the connection status only. The ticket and idea counts are gone.
3. Shaping has a Tickets / Ideas toggle, with Tickets selected when the page loads, and shows one list at a time. Tickets use one accent colour and ideas a different one, on the toggle, the section's top edge and each item's left edge, so you can tell which list is showing at a glance. The choice survives the 2-second refresh.
4. The Tickets list shows draft tickets in the JSON's order, each with id, title, priority, size, risk, criteria count and lint result. Clicking one opens it, showing its problem, outcome, numbered acceptance criteria, out of scope and notes, and a readiness list: size and risk, criteria count, each lint error and warning in full (or "lint passes"), and each `after:` id marked done or not done. An open ticket stays open through refreshes, and clicking it again closes it.
5. The Ideas list shows every idea, those whose status doesn't start with `ticketed` first, then the rest, each with its title and status. Clicking one shows its note text, as text, under it.

## Out of scope
- The queue (0034) and Shipped (0035).
- Any write action, including setting a ticket to ready. Toggles and opening items are view state only, and nothing is sent to the server.
- Judgement hints from the mockup that speck can't compute, such as overlaps with other tickets or clashes with config.

## Notes
- Builds on the field contract from 0030: add fields, don't rename or remove any.
- Design reference: the expanded ticket and readiness list in `docs/panel-mockup.html`.
- Builds before 0034 and 0035, which change the same page.
- No external facts: everything comes from files speck already reads.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
