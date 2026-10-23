---
id: "0424"
title: "Set the full ticket out as a document"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0423"] # ticket ids that must be done first
created: 2026-10-23

---
# 0424 · Set the full ticket out as a document

**Status:** 📋 ready

## Problem
The full ticket's text runs together: section headings, paragraphs and lists are close in size and spacing, so it doesn't read as a document with a clear order of parts.

## Outcome
The full ticket and a review pack read as a hierarchical document: a title, section headings, then the text, each clearly set apart.

## Acceptance criteria
1. The ticket's title is the largest text, with its id and status above it in small type, and its priority, size, risk and type on one line under it.
2. Each section (such as Problem, Outcome, Acceptance criteria, Out of scope and Notes) has a heading smaller than the title and larger than the text, with more space above it than between the section's paragraphs.
3. The text is at least 15 px with a line height of at least 1.5. A heading inside a section's text (`#` to `###`) is smaller than the section's heading, and each level is smaller than the one above it.
4. Numbered lists, such as the acceptance criteria, have their numbers hanging to the left of the text, and nested lists are indented under their item.
5. A review pack uses the same sizes for its title, headings, text and lists.

## Out of scope
- What the full ticket and review pack contain.

## Notes
- The user asked for this on 2026-10-23.
- Today: the full ticket's Markdown is drawn by `markdown()` in `templates/panel.html` (0132, 0158).
- Waits for 0423: both change `templates/panel.html`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
