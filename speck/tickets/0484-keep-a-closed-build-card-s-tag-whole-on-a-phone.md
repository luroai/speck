---
id: "0484"
title: "Keep a closed Build card's tag whole on a phone"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-24-keep-a-closed-card-s-bug-or-document-tag-whole-on-a-phone.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0483"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T18:44:36.293Z"

---
# 0484 · Keep a closed Build card's tag whole on a phone

**Status:** 🔨 building

## Problem
On a phone, a closed Build card with a long status line, such as `Foreman will answer · Review 2 · 99:59 · bug`, cuts its bug, fix or document tag off with an ellipsis, sometimes to just `…`. A lone `…` after the time looks as if the time is cut off, and the tag can't be read or tapped until the card is opened.

## Outcome
A closed Build card's bug, fix or document tag always shows whole.

## Acceptance criteria
1. On a closed Build card at every width from 320 px, a bug, fix or document tag at the end of its status line shows whole and can be tapped, as an open card's can.
2. When the status line doesn't fit, its words (such as `Foreman will answer`) are cut short with `…` first, and the stage, the time and the tag stay whole while the words have anything left to give. Checked in a real browser at 320 px and 375 px, in both looks, for a blocked bug ticket whose line is `Foreman will answer · Review 2 · 99:59 · bug` and for a finished document task.
3. A closed card whose status line fits looks as it does today, and open cards don't change. No test that passed before this change fails.

## Out of scope
- What the status line says (0443).
- Plan's cards and their tags.

## Notes
- From the inbox note, raised by the builder on 0443, whose criteria name only the words, stage and time. Decided while ticketing on 2026-10-24: the tag stays on the status line, whole, rather than moving or being dropped.
- Today: `.q:not(.open) .top .progress` and the rules round it under 0443's comment in `templates/panel-cards.css`, and the closed card's status line built in `templates/panel.js` (0443).
- Waits for 0483: both change the closed Build card's update in `templates/panel.js`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
