---
id: "0568"
title: "List what speck decided for you in the panel"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0564","0565","0567"]                # ticket ids that must be done first
created: 2026-11-08
started: "2026-11-09T00:13:58.642Z"

---
# 0568 · List what speck decided for you in the panel

**Status:** 🔨 building

## Problem
With speck deciding, you need one place to see what it chose and to change any you'd have chosen differently. Today each choice is a line in its ticket's Notes, and `speck status` lists only the last 24 hours.

## Outcome
The panel has a Decided for you list of the recommendations speck took, with a way to change one while its ticket waits to ship.

## Acceptance criteria
1. `speck status --json` lists each recommendation speck took in the last 7 days, newest first: the ticket's id and title, the option, when, and whether the ticket's criteria changed (0565).
2. When speck took at least one in the last 7 days, the panel shows a line under its status saying how many, and pressing it opens the Decided for you list, giving each one's ticket id and title, the option, when, and that it changed a criterion where it did.
3. A decision whose ticket is approved and not shipped has a Change button, which opens Ask for changes for that ticket as its review pack does. Other decisions have none.
4. The list fits a phone-width screen, and closes with its Close button or Escape.
5. No test that passed before this change fails.

## Out of scope
- The panel's new look and taking out the LCD screen, which come later from the mock.
- Changing a decision once its ticket has shipped.

## Notes
- Asked for 2026-11-08: the user goes with speck's recommendation almost every time, so speck should decide and tell them rather than ask ("ticket up 1": the watcher deciding). In this repo 15 of 17 recommendations taken were picked by hand in the panel, and 10 of the watch agent's 13 actions were questions.
- The mock of the panel made on 2026-11-08 shows the intended layout of the Decided for you list.
- Today: "chosen by speck" Notes lines are parsed by `wentWithLines` in `scripts/foreman-took.mjs`; Ask for changes is in `templates/panel-popups.js`.
- Waits for 0564 and 0567, which write the lines it lists, and 0565, which gives `criteria_changed`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: the Decided for you line behind the open list is now held with the rest of the page, so Tab can't reach it; and a shipped ticket's criteria change is read from history, as its branch has gone.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
