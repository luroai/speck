---
id: "0353"
title: "Tell the reviewer what counts as evidence for a document"                # one outcome, no "and"
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
after: ["0352"]                # ticket ids that must be done first
created: 2026-10-21
started: "2026-10-21T10:15:49.117Z"

---
# 0353 · Tell the reviewer what counts as evidence for a document

**Status:** 🔨 building

## Problem
The reviewer is told to judge each criterion from code and tests. A document task has no tests, and its document is in the main checkout's `outputs/`, outside the branch the reviewer is shown, so the reviewer wouldn't know where to look or what counts as evidence.

## Outcome
For a document task, the reviewer reads the document and cites the passages that meet each criterion.

## Acceptance criteria
1. For a document task, `speck prompt <id>` names the absolute path of its output folder and lists the files in it, or says the folder is empty or missing.
2. For a document task, `speck prompt <id>` tells the reviewer to judge each criterion by reading the document, cite the passage it relies on as its evidence, and not count a missing test against any criterion. (checked by review)
3. For a code ticket, `speck prompt <id>` is unchanged.
4. No test that passed before this change fails.

## Out of scope
- How the reviewer is started or which reviewer it is.
- The review pack (0354).

## Notes
- `templates/reviewer-prompt.md` and the prompt building in `scripts/review.mjs`. The reviewer prompt already has this rule for criteria marked `(checked by review)`.
- Unverified: that Codex's `read-only` sandbox can read files outside the worktree it runs in, such as the main checkout's `outputs/` (couldn't check without running a review; the builder checks it with a real `speck review` and records the result in Notes).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
