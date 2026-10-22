---
id: "0362"
title: "Open a document task's document in a pop-up over the whole panel"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-22-open-a-document-in-a-pop-up-over-the-whole-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0361"]                # ticket ids that must be done first
created: 2026-10-22

---
# 0362 · Open a document task's document in a pop-up over the whole panel

**Status:** 📝 draft

## Problem
A document task's Markdown document opens in the side pane, which is at most 480 px wide. That's narrow for reading a document, and reading it is how you review a document task before you ship it.

## Outcome
Pressing a Markdown document's button in a review pack shows it, formatted, in a pop-up that covers the whole panel window.

## Acceptance criteria
1. Pressing a Markdown file's button at the top of a document task's review pack opens a pop-up that covers the whole panel window at every width, in both looks. It shows the file's path, a Close button and the document formatted as the side pane formats it today, tables included, with its text in a centred column at most 760 px wide. The side pane no longer shows the document.
2. While the pop-up is open, nothing behind it can be clicked, scrolled or reached with Tab, and the focus moves into it. A long document scrolls inside the pop-up, not the page behind it.
3. Close and Escape close the pop-up and leave the review pack open in the side pane as it was, with the focus back on the file's button.
4. While the file is loading, or when it can't be fetched, the pop-up says so, with the same wording as the side pane today. A file that isn't Markdown still opens in a new tab, as today.
5. No test that passed before this change fails, except checks that a Markdown file shows in the side pane with a "Back to the review pack" button, which are changed to check AC1 and AC3.

## Out of scope
- Shipping from the pop-up: 0363.
- The review pack itself, which stays in the side pane.
- The notice board's pop-up (`speck/ideas/2026-10-22-a-scrolling-dot-matrix-notice-board-in-the-header.md`), though it should be able to share this pop-up's look later.

## Notes
- Today: `documentsPart`, `openDocument` and `documentPane` in `templates/panel.html` (0354, 0359). The side pane is `#full-ticket`, made modal in 0060, and focus returns to its opener as in 0326.
- The "Back to the review pack" button goes: closing the pop-up returns to the pack.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
