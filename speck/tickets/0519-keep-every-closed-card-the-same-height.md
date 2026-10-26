---
id: "0519"
title: "Keep every closed card the same height"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-26
started: "2026-10-26T21:31:19.850Z"

---
# 0519 · Keep every closed card the same height

**Status:** 🔨 building

## Problem
A closed card's height still depends on what's in it. Build's status line stays on one line (0484), but Plan's details line wraps when it doesn't fit, so a ticket with a `task` tag takes an extra line (carbon's 0009, 2026-10-26), and Plan's cards have empty space under their details. Plan's details also spend their room on the criteria count and lint result, which the user doesn't need on a closed card, spaced widely with ` · ` between them.

## Outcome
Every closed card in every lane is the same height, and a closed Plan card's second row is its priority, size, risk and type as small labels.

## Acceptance criteria
1. A closed Plan card's second row shows only its priority, size and risk, and its type when it has one (bug, fix or task), each as a small boxed label, side by side with a small gap and no ` · ` between them. Its criteria count and lint result aren't on a closed card; an open card shows them as today.
2. The priority label still opens the priority menu and changes the ticket's priority as today, and size, risk and type still show their explanations on hover or tap.
3. A closed card in Plan, Build or Shipped shows its title on one line, cut short with `…` when it doesn't fit, and its second row on one line that never wraps, with no empty space under it.
4. In a real browser at 320 px, 375 px and 420 px wide, in both looks, closed cards in Plan, Build and Shipped are all the same height, including a Plan task ticket with a long title and `after` ids, a blocked Build bug ticket, and a Shipped ticket with a long title. Cards that show a question, a recommendation, a Ship button or a message under their two lines, as 0419 keeps, and open cards, are left out of this.
5. No test that passed before this change fails, apart from earlier tests that check a closed Plan card's details line (its ` · ` separators, criteria count, lint result or wrapping), which change to this.

## Out of scope
- What a closed Build or Shipped card's second row says: they keep their details, now on one line.
- Open cards, and what a closed card shows under its two lines (0419's criterion 4).
- The Plan lane's Tickets, Ideas and Inbox buttons, which 0520 removes.

## Notes
- Asked for 2026-10-26: "did we not make the tickets stay consistent with heights … we need to make it all uniform please", with a screenshot of carbon's Plan lane on a phone: 0007, 0008 and 0010 on two lines with space under them, 0009 on three. Then: "The data we need to show on the second row really is Priority. Size. Risk. Type … in little labels or boxes … no need for the wide spacing. I'd still like to update priorities. I don't need to know criteria or whether lint passes."
- Today: 0419 lets Plan's details line wrap "only when it doesn't fit", with ` · ` between its parts; 0484 cuts Build's status words short with `…` and keeps the stage, time and tag whole; 0420 and 0494 set out Shipped's closed card. A ticket's type is `type:` (bug or fix) or `kind: task`.
- Cards: `templates/panel-cards.css`, and the closed cards in `templates/panel.js` (`ticketItem`, the Build queue's and Shipped's rows).
- Failing before this build: none
## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
