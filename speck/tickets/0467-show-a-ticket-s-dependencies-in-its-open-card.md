---
id: "0467"
title: "Show a ticket's dependencies in its open card"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0466"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T12:39:41.469Z"

---
# 0467 · Show a ticket's dependencies in its open card

**Status:** 🔨 building

## Problem
An open ticket lists the tickets it waits on, or unlocks, as ids in a line of text. A ticket that waits on many, such as a release ticket waiting on 27, runs to three lines or more on a phone, mostly ids that have already shipped, and you can't see how far along they are.

## Outcome
An open ticket shows its dependencies in a small, even box under its facts table, drawn by their shape, so even a release ticket's are easy to read.

## Acceptance criteria
1. An open ticket whose `after` names two or more tickets shows, under its table, a `Waits on` box: a header counting them as `<n> shipped · <n> building · <n> queued` (leaving out a count of 0), a bar with one equal segment per ticket (green shipped, blue building, grey the rest), and a grid of id chips six to a row for each ticket that hasn't shipped, in id order, followed by one `+<n> shipped` chip two columns wide when any have shipped. Pressing that chip shows the shipped tickets' chips too, and pressing it again hides them.
2. An open ticket whose `after` names one ticket, or that one or more tickets name in theirs, shows a `Chain` box instead: one row of five equal slots, a circle over an id in each. They hold up to two tickets before it (the ticket it waits on, then the one that ticket waits on, when that ticket waits on only one), itself, filled in, and up to two after it (a ticket waiting on it, the lowest id first, then one waiting on that). When more lie beyond either end, that end's last slot shows `+<n>`, counting them. A shipped ticket's circle is green with a tick, one building is blue, and the rest are grey. Its header says `<n> before · <n> after`. A ticket with neither shows no box.
3. Pressing a chip or a circle goes to that ticket, as an id link does today, opening its tab. Every chip and circle keeps to its slot with its id on one line at every width from 320 px, checked in a real browser with 27 tickets in `after`.
4. The full ticket shows the same box under its table (0465). The line of ids after `after`, `unlocks` or `waiting on` is gone from open cards. No test that passed before this change fails.

## Out of scope
- Closed cards, which 0468 marks with a chip.
- Shipped tickets.

## Notes
- Asked for by the user on 2026-10-24, choosing option E in the mock-ups (https://claude.ai/artifact/BANvGzKKYy1p4AjBipypTb): the dependency chain on an expanded ticket, laid out so that one with as many as the 0.15.0 release ticket (0452) still looks good.
- Statuses: shipped is `done`; building is `building`, `reviewing`, `blocked` or `approved`; queued is the rest.
- Today: `ticketHead` and `queuedLine` in `templates/panel.js` draw the ids with `idLinks` and `noteIds`; `goTo` goes to a ticket (0154).
- Waits for 0466, the last ticket before it that changes `templates/panel.js` and `templates/panel.css`, and so 0463 and 0465, which this builds on.
- Failing before this build: none
- Self-check: in the full ticket, which covers the page, a chip or circle now shows its ticket in the pane rather than lighting a card hidden behind it; a loop through after: stops rather than going round; repeated ids in after: count once.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
