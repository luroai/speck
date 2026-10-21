---
id: "0354"
title: "Link to the document from its review pack"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-17-review-documents-an-agentic-task-writes.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0353"]                # ticket ids that must be done first
created: 2026-10-21
started: "2026-10-21T10:22:34.885Z"

---
# 0354 · Link to the document from its review pack

**Status:** 🔨 building

## Problem
For a document, Gate 2 is reading the document itself, not a summary of it. Today the review pack shows the reviewer's verdict and evidence but gives no way to open what the build wrote.

## Outcome
A document task's review pack links to each file in its output folder, and the panel opens it.

## Acceptance criteria
1. For a document task, `speck pack <id>` lists each file in its output folder, with its path from the project root. A code ticket's pack is unchanged.
2. In the panel, each file the review pack lists is a link. Pressing a Markdown file shows it formatted in the side pane, as a review pack is, with a way back to the pack. Any other file opens in a new tab, served by the panel.
3. The panel serves only files inside that ticket's output folder: a request for a path that leads outside it, by `..` or by a link, gets a 404.
4. No test that passed before this change fails.

## Out of scope
- Comments on passages of the document: one note for the whole ticket comes with 0356 and 0357.
- Editing the document in the panel.

## Notes
- Agreed with the user 2026-10-21: the review pack links to the document; it doesn't paste it in.
- `reviewPack` and `panelPack` in `scripts/pack.mjs`; the routes in `scripts/panel.mjs` (the pictures route, 0294, is the nearest pattern); the review pack pane in `templates/panel.html`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
