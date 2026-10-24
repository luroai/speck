---
id: "0465"
title: "Lay out the full ticket's top like its open card"                # one outcome, no "and"
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
after: ["0464"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T11:54:24.290Z"

---
# 0465 · Lay out the full ticket's top like its open card

**Status:** 🔨 building

## Problem
The full ticket, opened over the whole panel, shows a ticket's tags under its title, while its card (after 0461 to 0464) shows a step track and an even table of facts. The two views of one ticket don't match.

## Outcome
The full ticket shows the same step track and table as the ticket's open card.

## Acceptance criteria
1. Opening a ticket's full view shows, under its title and above its Problem, the step track and table its card shows when open: a ticket in flight as 0461 and 0462 set out, one not started as 0463 does, and a shipped one as 0464 does. They match the open card's exactly, cell for cell.
2. The tags under the title are gone, as the table holds them. The id, status and Close stay where they are.
3. While the full view is open, the track and table change as the ticket moves on, as the card's do, within the panel's 2-second refresh.
4. At 320 px and 390 px, and in the full view's centred column on a wide window, the track and table keep to their rows and every value stays on one line, checked in a real browser. No test that passed before this change fails.

## Out of scope
- The rest of the full ticket, set out as a document (0423, 0424, 0445).
- A review pack.

## Notes
- Asked for by the user on 2026-10-24, after choosing the step track and facts grid for open build tickets (0461, 0462; mock-ups at https://claude.ai/artifact/BANvGzKKYy1p4AjBipypTb): "that layout should just be the template for all tickets in plan and ship. And also when you open a ticket in the full screen mode, like that table should be there as well."
- Today: `fullTicket` in `templates/panel.js` draws the top as id, status, Close, title and `paneTags` (0424).
- Waits for 0464, which waits for 0463, 0462 and 0461: it reuses all three tables and changes the same files.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
