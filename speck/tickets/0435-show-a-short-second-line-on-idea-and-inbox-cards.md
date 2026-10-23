---
id: "0435"
title: "Shorten the second line of Plan's note cards"                # one outcome, no "and"
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0434"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T20:59:20.145Z"

---
# 0435 · Shorten the second line of Plan's note cards

**Status:** 🔨 building

## Problem
Cards in Plan's Ideas and Inbox lists repeat themselves and run long: `idea` (or `inbox`) shows before the title and again on the second line, the second line is the note's full file path, which wraps on a phone, and the touch sizing puts a big gap between them.

## Outcome
A collapsed idea or inbox card is its title and one short line saying when it was captured, with the file path only when it's open.

## Acceptance criteria
1. A collapsed card in Plan's Ideas list shows the idea's title with no `idea` label before it, then one line in smaller type: when it was captured, as `Captured 8 Oct`, with the year when it isn't this year (`Captured 8 Oct 2025`), followed by its status only when that isn't `idea`, as in `Captured 8 Oct · shaped`.
2. A collapsed card in Plan's Inbox list shows the note's title with no `inbox` label before it, then `From <id> · captured <date>`, or `Captured <date>` when it names no ticket, the date written as in criterion 1.
3. A note whose `Captured:` line is missing or doesn't hold a date shows `No capture date` where its date would be.
4. Neither list shows a note's file path on a collapsed card. An open card shows the path in small type above the note's text.
5. At 390 px wide, on a touch screen as well as with a mouse, a collapsed idea or inbox card is two rows: its title line and its second line.

## Out of scope
- One-line titles, which 0434 gives every collapsed card.
- Tickets in Plan's Tickets list (0419).

## Notes
- The user asked for this on 2026-10-23, from a phone screenshot of Plan's Ideas list.
- Today: `ideaItem` and `inboxItem` in `templates/panel.html`. A note's first lines read `Captured: <YYYY-MM-DD> · Status: <status>`, and an inbox note has a `From ticket:` line (`fromTicket`).
- Waits for 0434: both change Plan's cards in `templates/panel.html`. 0430 waits for it too, as 0430 moves every style.
- Failing before this build: none
- Built: a note whose `Captured:` line is missing or unreadable shows `No capture date` in place of the whole `Captured <date>` (or `captured <date>`) part, as in `No capture date · parked` and `From 0140 · No capture date`. An idea with no status shows only its date, as the status line shows a status only when it isn't `idea`.
- Built: the open card's path is 12 px, the panel's smallest type, as 0161 allows nothing smaller.
- Self-check: no changes

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
