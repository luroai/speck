---
id: "0352"
title: "Write a document task's document into outputs"                # one outcome, no "and"
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
after: ["0351"]                # ticket ids that must be done first
created: 2026-10-21
started: "2026-10-21T10:08:13.414Z"

---
# 0352 · Write a document task's document into outputs

**Status:** 🔨 building

## Problem
A build of a document task would write tests and code. And a document written in the build's worktree would be lost, because `outputs/` isn't in git, so nothing from it is ever merged.

## Outcome
A build of a document task writes the document, from the sources the ticket names, into the ticket's folder in the main checkout's `outputs/`.

## Acceptance criteria
1. `speck output <id>` prints the absolute path of `outputs/<output>/` in the main checkout, making the folders if they're missing, whether it's run from the main checkout or from one of its worktrees.
2. `speck output <id>` refuses, printing why and making nothing, for a code ticket or a document task whose `output` fails `speck lint`.
3. `/speck-build` tells the builder that for a document task it skips "Tests first", writes the document into the folder `speck output <id>` prints, and runs the review loop as usual. (checked by review)
4. `/speck-build` tells the builder that in a document task it only makes new files in that folder or changes files the ticket names, and never deletes or overwrites any other file there. (checked by review)
5. No test that passed before this change fails.

## Out of scope
- What the reviewer is told to check (0353).
- Showing or linking the document (0354).
- Shipping a document task (0355).

## Notes
- Agreed with the user 2026-10-21: document tasks run through `/speck-build`, not a skill of their own, since everything but steps 2 and 3 is the same. The ticket, its review and its run record still go on its branch as usual.
- Nothing in `outputs/` is in git, so there's no undo. That's why criterion 4 matters.
- `scripts/speck.mjs` (the command and its help line), `.claude/skills/speck-build/SKILL.md` sections 2 and 3.
- Failing before this build: none
- Self-check: no changes (tried a file where the folder goes, an unknown id, no id, `.`-style and Windows paths through lint, and running from a worktree). `cmdDiffstat` moved to `scripts/diffstat.mjs` so `scripts/speck.mjs` stays under the 600-line rule.
- Pictures: none, because nothing anyone sees in the panel changes.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
