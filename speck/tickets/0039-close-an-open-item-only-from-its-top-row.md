---
id: "0039"
title: "Close an open item only from its top row"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09

---
# 0039 · Close an open item only from its top row

**Status:** 📋 ready

## Problem
In the panel's Shaping area, clicking anywhere inside an open ticket or idea closes it, including clicks in its details. So reading a ticket at Gate 1 or selecting a criterion to copy keeps collapsing it.

## Outcome
An open ticket or idea closes only when you click its top row, so you can click in its details and select text there without it closing.

## Acceptance criteria
1. A closed draft ticket opens when you click its top row (id, title, tags and the criteria count and lint line under them). An open ticket closes when you click that same top row.
2. Clicking anywhere in an open ticket's details (its sections and its readiness list) leaves it open.
3. A closed idea opens when you click its top row (title, status and path), and an open idea closes when you click that row. Clicking its note text leaves it open.
4. Selecting text by dragging within an open ticket's details or an open idea's note text leaves it open.
5. Everything else about opening stays the same: more than one item can be open at once, and what's open survives the 2-second refresh.

## Out of scope
- Keeping a text selection through the 2-second refresh (0040).
- Keyboard access to the top row, such as making it a button with `aria-expanded`.
- Capping the height of long details.

## Notes
- Reported as a follow-up in 0033's delivery log.
- The page is `templates/panel.html`. No CLI or JSON change.
- No external facts: everything is in this repo.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
