---
id: "0584"
title: "Show a build's live details in its full view"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0583"]                # ticket ids that must be done first
created: 2026-11-09

---
# 0584 · Show a build's live details in its full view

**Status:** 📝 draft

## Problem
A building ticket's card holds its live log, its progress, its paused or blocked state and its Stop button. The redesign turns Build cards into compact rows (0585), so those details need a home first, or they'd be lost.

## Outcome
Everything a Build card shows about a running or stopped build is also in the ticket's full view.

## Acceptance criteria
1. A building or reviewing ticket's full view shows its live log with the Full log button, where it is and for how long, whether it's paused (with the `speck play <id>` that carries it on) and its Stop button, as its Build card does today.
2. A blocked ticket's full view shows its question with the Go with the recommendation button, and an engineering manager's question with its Answer box and its Answer and Dismiss buttons, as its card does.
3. These update while the full view is open, as the card's do.
4. Each still does what it does from the card: the same requests, confirmations and messages.
5. No test that passed before this change fails.

## Out of scope
- Taking them off the cards (0585).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today on the card: `progressOf`, `lights`, `stopButton`, `logBox` and the blocked parts of `queueItem` in `templates/panel.js`.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
