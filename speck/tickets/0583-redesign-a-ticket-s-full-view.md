---
id: "0583"
title: "Redesign a ticket's full view"                # one outcome, no "and"
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
after: ["0577"]                # ticket ids that must be done first
created: 2026-11-09

---
# 0583 · Redesign a ticket's full view

**Status:** 📝 draft

## Problem
A ticket's full view (the "side pane", `#full-ticket`) still has the LCD-era look, with tags and bordered boxes. In the redesign it's the one place a ticket's detail lives, so it needs to read clearly on a phone and end in the action that's needed.

## Outcome
A ticket's full view reads top to bottom as in the mock and ends in the action it's waiting for.

## Acceptance criteria
1. The full view starts with a back link to the lane it came from, the ticket's id at the right, a status pill (orange when it waits for you, blue while it's being worked on, grey otherwise) and its title.
2. Below the title, a step track shows four bars, Ready, Built, Reviewed and Ship, filled up to where the ticket is, with a step that waits for you in orange.
3. Its facts are a two-column grid: priority, size, risk, whether it ships by itself (and why not, when it won't), the builder and its model, and the reviewer and its model.
4. Then its outcome, its acceptance criteria as a list with a tick on each one the reviewer passed, and rows that open its review pack and its build log. An approved ticket has a bar fixed to the bottom with Ask for changes and, in the accent colour, Ship.
5. Tests that checked the old look of what this changes are updated to the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- A build's live log and Stop button in the full view (0584).
- What changed in its criteria (0588).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today: `fullTicket`, `paneSteps`, `renderFull` in `templates/panel-popups.js`, the track (`trackOf`) and facts (`factsOf`, `factCell`) in `templates/panel.js`, styles in `templates/panel-popups.css` and `templates/panel-cards.css`.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
