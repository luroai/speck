---
id: "0590"
title: "Redesign Decided for you"                # one outcome, no "and"
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
after: ["0589","0588","0580"]                # ticket ids that must be done first
created: 2026-11-09

---
# 0590 · Redesign Decided for you

**Status:** 📝 draft

## Problem
Decided for you (0568) is a plain list. In the redesign it's where speck reports to you: in its own voice, with its face, showing what it decided, what it didn't choose, and what's waiting for you because of it.

## Outcome
Decided for you reads as speck's report, as in the mock.

## Acceptance criteria
1. Under the bar, when speck made a call in the last 7 days, a line shows speck pleased and says "I made 4 calls for you this week" (the count), with Review, which opens Decided for you.
2. Decided for you opens with speck pleased beside a short speech bubble saying it went with its recommendation and that you can change any you'd have called differently, then lists the calls under Today and Earlier.
3. Each call shows its ticket's id and title, the question, "Went with" and the option, "Not chosen" and the others, and when; one that changed a criterion shows speck sheepish beside "I changed criterion 2, so this one waits for you at Ship."
4. Change does what it does today, for a ticket still waiting to ship.
5. Tests that checked the old look of what this changes are updated to the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Recording the calls (0589).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today: `#decided-open` under the header and `renderDecided`, `decidedRow` in `templates/panel-popups.js`. speck speaks in the first person wherever its face is beside the words, and is called by its chosen name elsewhere (0575, 0576).
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
