---
id: "0434"
title: Show each collapsed ticket as two single lines                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0428"] # ticket ids that must be done first
created: 2026-10-23

---
# 0434 · Show each collapsed ticket as two single lines

**Status:** 📋 ready

## Problem
Collapsed tickets are taller and busier than they need to be. A ticket being built starts its details line with a stage sentence such as `Writing tests and code`, then its stage, its time, its priority, size and risk. On a phone each item is a finger-sized box, so the line wraps over three rows. A shipping ticket shows two unlabelled times (`Shipping · 01:08 · 20:12`), and a long title wraps over two lines.

## Outcome
Every collapsed ticket is two single lines: its title, then a short status line. While an agent works on a ticket, a small grid of moving lights shows it's working.

## Acceptance criteria
1. While a ticket's builder or reviewer is at work (writing tests and code, checking its own work, reviewing or fixing a round's findings), its status line starts with a 4 × 4 grid of small dots, no more than 14 px square, with lights moving across it, in place of the stage sentence. The grid's accessible name and tooltip are the sentence it replaces, such as `Writing tests and code`. With reduced motion on, the grid is still, with some of its dots lit. A ticket no agent is working on (queued, blocked, approved, paused, shipping or stopped) shows no grid.
2. A collapsed Build ticket's status line is its grid or words, its stage and one time: the time since its build started, as the card's timer shows it today. For example: `Build · 01:07`, `Review 1 · gpt-6.1-sol · 07:52` (the reviewer's model after the stage), `Shipping · 20:12` or `Queued · waiting on 0426`. A shipping ticket no longer shows how long the ship has been running.
3. A collapsed Build ticket doesn't show its priority, size or risk. An open one shows them, and its priority still opens its menu.
4. Every collapsed ticket in Plan, Build and Shipped shows its title on one line, cut off with an ellipsis when it doesn't fit, with the whole title as its tooltip and in its accessible name. An open ticket shows its whole title, wrapping as needed.
5. At 390 px wide, on a touch screen as well as with a mouse, every collapsed Build ticket is two rows: its title line and its status line.

## Out of scope
- speck's screen (0413, 0414).
- What Plan's and Shipped's second lines show (0419, 0420), apart from their titles.

## Notes
- The user asked for this on 2026-10-23, from phone screenshots of the Build lane: a Cursor-style grid of lights for "working", one time on a shipping ticket, no priority, size or risk on a collapsed Build ticket, and one-line titles on collapsed tickets.
- This replaces 0416's rule that only speck's screen moves, for this grid only. The test for that rule changes to allow it.
- Today: `doing()` gives the stage sentence, and 0419 set out the details line, in `templates/panel.html`.
- Waits for 0428: both change `templates/panel.html`. 0430 waits for it too, as 0430 moves every style.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
