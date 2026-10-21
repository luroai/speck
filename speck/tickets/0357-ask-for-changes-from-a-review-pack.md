---
id: "0357"
title: "Ask for changes from a review pack"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-17-review-documents-an-agentic-task-writes.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0356"]                # ticket ids that must be done first
created: 2026-10-21
started: "2026-10-21T10:52:50.899Z"

---
# 0357 · Ask for changes from a review pack

**Status:** 🔨 building

## Problem
Gate 2 happens in the panel, often on a phone. With `speck changes` (0356) only on the command line, a user reading a document in the panel can ship it but can't ask for changes there.

## Outcome
An approved ticket's review pack in the panel has a box for a note and an "Ask for changes" button that sends it back to the build.

## Acceptance criteria
1. An approved ticket's review pack shows a text box and an "Ask for changes" button next to its Ship button. The button can't be pressed while the box is empty or only spaces.
2. Pressing it runs `speck changes <id>` with the note, through `POST /api/tickets/<id>/changes`, and shows what speck said, as the Ship button shows what `speck ship` said.
3. When `speck changes` refuses, the panel shows its reason and keeps the note in the box.
4. No test that passed before this change fails.

## Out of scope
- Comments on passages of a document.
- Anything `speck changes` itself does (0356).

## Notes
- The Ship button (0133) is the pattern to follow: its route in `scripts/panel.mjs` and its place above the review pack in `templates/panel.html`.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
