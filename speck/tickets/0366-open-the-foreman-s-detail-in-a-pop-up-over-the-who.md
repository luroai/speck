---
id: "0366"
title: "Open the Foreman's detail in a pop-up over the whole panel"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-a-scrolling-dot-matrix-notice-board-in-the-header.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0365"]                # ticket ids that must be done first
created: 2026-10-22

---
# 0366 · Open the Foreman's detail in a pop-up over the whole panel

**Status:** 📝 draft

## Problem
Pressing the Foreman's button opens its detail at the top of the page, under the header, where it pushes the page down and scrolls away as you scroll. It should stay in view while you read it.

## Outcome
Pressing the notice board opens the Foreman's detail in a pop-up over the whole panel.

## Acceptance criteria
1. Pressing the notice board (0365) opens a pop-up over the whole panel window, in the same look as a document's pop-up (0362), with a Close button and the Foreman's detail: the same sections and wording as the detail under the header today. The detail no longer opens under the header.
2. While the pop-up is open, nothing behind it can be clicked, scrolled or reached with Tab, and the focus moves into it. A long detail scrolls inside the pop-up.
3. Close and Escape close the pop-up, with the focus back on the notice board.
4. The pop-up stays up to date as the panel refreshes, as the detail does today. An answer being typed into one of the Foreman's questions (0318) keeps its text and focus through a refresh, and the Reload page button still reloads the page.
5. No test that passed before this change fails, except checks that the detail opens under the header, which are changed to check AC1.

## Out of scope
- What the notice board scrolls: 0365.
- What the detail says. Its sections and wording stay as they are.

## Notes
- Today: `#foreman`, `foremanOpen` and `renderForeman()` in `templates/panel.html` (0285, 0299, 0317, 0318, 0328).
- Share the pop-up from 0362 rather than making a second kind.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
