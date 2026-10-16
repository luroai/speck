---
id: "0224"
title: "Keep a queued ticket's tags tappable above a linked id"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-14-keep-a-queued-ticket-s-tags-tappable-above-a-linked-id.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0223"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-16T02:50:06.323Z"

---
# 0224 · Keep a queued ticket's tags tappable above a linked id

**Status:** 🔨 building

## Problem
On a phone, when a queued ticket's line reads "Queued · unlocks 0205" or "Queued · waiting on 0204", the linked id's tap area reaches about 14 px up into the tap areas of the tags above it. A tap on the bottom edge of a tag such as "low" goes to the other ticket instead of showing what the tag means.

## Outcome
On a phone, every part of a queued ticket's tag tap areas works for the tag, even with a linked id just below.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. At viewports under 700 px, on a queued ticket whose line under its tags has a linked id, a tap anywhere in a tag's 44 × 44 px tap area shows that tag's tip rather than going to the linked ticket.
2. A tap on the linked id's own text still goes to the linked ticket, and the space between the tags and that line is the same as today.
3. No test that passed before this change fails.

## Out of scope
- Tap areas at 700 px and wider.

## Notes
- The tags' tap areas come from 0165 and the linked id's from 0164, in the under-700 px rules in `templates/panel.html`. The id is later in the page, so today it wins where they overlap.
- The note's open question is settled as the tag winning where they overlap, without moving the layout (AC2), as 0190 did.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
