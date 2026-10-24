---
id: "0483"
title: "Drop the chain and padlock icons from closed cards"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-24-drop-the-chain-and-padlock-icons-from-closed-cards.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T18:33:27.080Z"

---
# 0483 · Drop the chain and padlock icons from closed cards

**Status:** 🔨 building

## Problem
A closed Plan or Build card shows a chain or padlock icon after its id and, since 0468, a dependency chip at the end of its title row. The two say the same thing twice, and the chain icon (others wait on this ticket) looks like the chip's link icon (this ticket waits on others) while meaning the opposite, so someone scanning the board on a phone can read them the wrong way round.

## Outcome
A closed card shows its dependencies only with the chip, and its title gets the room the icon took.

## Acceptance criteria
1. A closed Plan or Build card shows no chain or padlock icon after its id, whether it waits on others, others wait on it, or it's in flight. Its dependency chip (0468) shows at the end of its title row as today.
2. An open Plan or Build card shows its chain or padlock icon with its hover text, as today. Opening a card adds its icon and closing it takes it away, without a reload, and the 2-second refresh never brings an icon back on a closed card.
3. On a phone at 375 px, a closed card's title starts straight after its id, where the icon was. No test that passed before this change fails.

## Out of scope
- The chip itself and what it says (0468).
- The highlight of a chain on hover (0041, 0185), which doesn't depend on the icons.
- Shipped cards.

## Notes
- From the inbox note, raised by the builder while taking 0468's pictures. Decided while ticketing on 2026-10-24: open cards keep their icons, as the note suggests, and the chain highlight stays as it is.
- Failing before this build: none
- Today: `chainIcon` and the Plan and Build cards' updates in `templates/panel.js` (the queue's update adds the icon after the id whether the card is open or closed), and `.chain, .lock` in `templates/panel-cards.css`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
