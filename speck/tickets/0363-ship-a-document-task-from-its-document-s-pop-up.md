---
id: "0363"
title: "Ship a document task from its document's pop-up"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0362"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T15:18:23.341Z"

---
# 0363 · Ship a document task from its document's pop-up

**Status:** 🔨 building

## Problem
To ship a document task you read its document, then go back to the review pack in the side pane to find Ship. Reading and deciding should happen in one place.

## Outcome
An approved document task's document pop-up has the review pack's Ship and Ask for changes controls, so you can read the document and ship it, or ask for changes, without leaving it.

## Acceptance criteria
1. When the ticket is `approved`, its document's pop-up (0362) shows the Ship button, and the box and button for Ask for changes, above the document, as the review pack shows them above the pack.
2. Pressing Ship in the pop-up ships the ticket exactly as the pack's Ship button does. The pop-up then shows that it's shipping and what speck ship said, or why it refused, with the same wording as the pack. While any ship is running, the button can't be pressed, as in the pack.
3. Ask for changes in the pop-up sends the note exactly as the pack's does, and what it said, or why it refused, shows in the pop-up.
4. A ticket that isn't `approved` and isn't shipping shows no Ship or Ask for changes in the pop-up, and the review pack's own Ship and Ask for changes work as before.
5. No test that passed before this change fails.

## Out of scope
- Shipping a document task by itself (`auto_ship`): a document task waits for you, as reading it is its review.
- A Ship button on the queue row (0361 gives the row a Review pack button only).

## Notes
- Today: `shipPart` and `changesPart` in `templates/panel.html` (0133, 0357) draw the pack's controls. Shipping a document task files it as done (0355).
- Ask for changes is included because it's the other answer to reading the document: ship it, or send it back.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
