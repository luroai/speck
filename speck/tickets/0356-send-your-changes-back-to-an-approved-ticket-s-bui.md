---
id: "0356"
title: "Send your changes back to an approved ticket's build"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-17-review-documents-an-agentic-task-writes.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0355"]                # ticket ids that must be done first
created: 2026-10-21

---
# 0356 · Send your changes back to an approved ticket's build

**Status:** 📝 draft

## Problem
When the user reads an approved result and wants it changed, the only way today is a new ticket. Documents will often need a revision or two, and a new ticket for each one goes round in circles.

## Outcome
The user sends a note back to an approved ticket, its build revises the work, and it comes back approved after another review.

## Acceptance criteria
1. `speck changes <id> "<note>"` on an approved ticket adds the note, dated, to the ticket's Review log as changes asked for by the user and commits it. Until the ticket is approved again, neither `speck ship --auto` nor the ship queue ships it.
2. `speck run` resumes the ticket's build session with a message that contains the note and tells it to make the changes, run the review loop again, and stop once it's approved. The reviewer's next round is given the note to check as well as the acceptance criteria.
3. `speck changes` refuses, changing nothing and saying why, for a ticket that isn't approved, an empty note, or a ticket whose build session can't be resumed.
4. No test that passed before this change fails.

## Out of scope
- The panel's box and button (0357).
- Comments on particular passages or lines.
- Changes asked for on a ticket that's already done: that's still a new ticket.

## Notes
- Agreed with the user 2026-10-21: one note per round on the same ticket, rather than a new ticket per revision. It works for code tickets as well as documents.
- The ship queue's hand-backs (0194) already resume a build session with a message and hold the ticket from shipping meanwhile: `handBackQueue`, `handBackMessage` and `resumeFor` in `scripts/hand-back.mjs`. A new hand-back kind for the user's note fits there.
- The reviewer prompt is built in `scripts/review.mjs` from `templates/reviewer-prompt.md`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
