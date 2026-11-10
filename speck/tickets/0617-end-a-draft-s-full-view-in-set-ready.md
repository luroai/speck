---
id: "0617"
title: "End a draft's full view in Set ready"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-09-end-a-draft-s-full-view-in-set-ready.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0613","0616"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T17:23:49.145Z"

---
# 0617 · End a draft's full view in Set ready

**Status:** 🔨 building

## Problem
An approved ticket's full view ends in a bar with Ask for changes and Ship, the action it's waiting for. A draft's ends with nothing to do: its Set ready sits at the top with its readiness list, so someone who reads to the end finds no action there.

## Outcome
A draft's full view ends in a bar with Set ready, as an approved ticket's ends in Ship.

## Acceptance criteria
1. A draft's full view has a bar fixed to the bottom with Set ready in the accent colour, which does what the Set ready button does today.
2. When the draft isn't ready to be set ready, the bar's button is disabled and says why in one line, as the readiness list does.
3. The readiness list stays in the view, above the bar.
4. Tests that checked the old behaviour are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- What Set ready checks.

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- Decided: the same kind of fixed bar as an approved ticket's.
- From 0583's build. Today: `fullTicket` in `templates/panel-popups.js` and `setReadyButton`, `readiness` in `templates/panel.js`. Waits for 0613 and 0616, which change the same files.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: a ticket with a ready check error count but no error messages said "Fix the 1 ready check error above first." with nothing listed above; it now says to fix the ready check without pointing at a list, and a test covers it.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
