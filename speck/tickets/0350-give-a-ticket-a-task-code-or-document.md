---
id: "0350"
title: "Give a ticket a task: code or document"                # one outcome, no "and"
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
after: []                # ticket ids that must be done first
created: 2026-10-21
started: "2026-10-21T09:51:45.516Z"

---
# 0350 · Give a ticket a task: code or document

**Status:** 🔨 building

## Problem
Every ticket is a code change today, so there's no way to say a ticket's job is to write a document instead. The document task (`speck/ideas/2026-10-19-add-job-kinds-one-at-a-time.md`, first on the roadmap) needs each ticket to say which task it is before anything can treat a document differently.

## Outcome
A ticket says its task, `code` or `document`, and it shows on the board.

## Acceptance criteria
1. `speck lint` accepts a ticket whose `task` is missing, blank, `code` or `document`, and errors on any other value, naming the allowed ones. A missing or blank `task` means `code`.
2. `speck new` writes a `task: code` line in the frontmatter, with a comment listing `code | document`.
3. `speck status --json` gives each ticket's `task`, as `code` when it's missing or blank.
4. In the panel, a ticket card whose task is `document` shows a "document" tag, as a bug ticket shows its "bug" tag. A code ticket's card shows no task tag.
5. No test that passed before this change fails.

## Out of scope
- The `output:` field a document task needs (0351).
- Anything that builds, reviews or ships a document task differently (0352 to 0355).
- Other tasks (posts, research, email drafts): each comes later, one at a time.

## Notes
- Agreed with the user 2026-10-21: the field is called "task", not "kind". `code` is the default, so existing tickets need no change.
- `TYPES` and `ticketType` in `scripts/core.mjs`, `lintTicket` in `scripts/lint.mjs`, `templates/ticket.md`, and `typeTag` in `templates/panel.html` for the tag.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
