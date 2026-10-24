---
id: "0495"
title: "Make speck's caption add to the top row, not repeat it"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24

---
# 0495 · Make speck's caption add to the top row, not repeat it

**Status:** 📋 ready

## Problem
Between events, the caption under speck often repeats the screen's top row: `NEEDS YOU 1` over `1 NEEDS YOU`, `WAITING` over `WAITING`, `BUILDING 1` over `WATCHING 1 BUILD`. Two of the screen's three lines say the same thing.

## Outcome
The caption under speck always says something the top row doesn't: which tickets, or why.

## Acceptance criteria
1. While the top row reads `Needs you <n>`, the caption names the tickets that need you: `<id> HAS A QUESTION` for one, `<id> AND <id> ASK YOU` for two, and `<id> AND <n> MORE ASK YOU` for more, taking the ids from the Foreman's blocked tickets and its questions, lowest id first.
2. While it reads `Building <n>`, the watching caption names the tickets: `WATCHING <id>`, `WATCHING <id> AND <id>`, or `WATCHING <id> AND <n> MORE`, lowest id first. While it reads `Shipping <id>`, the caption is `ON ITS WAY TO <BASE>`, with the base branch's name.
3. While it reads `Waiting`, the caption is the reason the Foreman gives for waiting, in capitals, cut with `…` where it doesn't fit. While it reads `Off`, the caption is `TURN ON AUTO-BUILD`.
4. No caption between events repeats the top row's words, and every caption fits on the screen without scrolling, as 0414 set. Events, pastimes and the nap keep their captions.

## Out of scope
- When speck changes animation (0436, 0446).

## Notes
- From the user's phone screenshot on 2026-10-24: "Says needs you twice on screen. It's a waste."
- Today: `speckRests` in `templates/panel-header.js` (0414, 0436).
- Waits for nothing: no open ticket changes that file. 0452 waits for this one.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
