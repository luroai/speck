---
id: "0604"
title: "Give the black bar room for its whole status"                # one outcome, no "and"
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
after: ["0601"]                # ticket ids that must be done first
created: 2026-11-10

---
# 0604 · Give the black bar room for its whole status

**Status:** 📋 ready

## Problem
On a phone the black bar (0580) fits the status, the project's name, the project menu and Settings on one line, so they're cut off: the user saw "Shipping 05… · s…" and couldn't tell which ticket was shipping or which project it was. The project menu beside them also read "All projects" while the panel was showing speck.

## Outcome
The black bar is a little taller, with a larger speck and room for the whole status, the project and what's waiting, each on a line of its own.

## Acceptance criteria
1. The bar is taller, with speck at about 56 px and three lines of text beside it: the status with the ticket it's about (such as "Shipping 0599" or "Building 4"), the project's name with the base branch (such as "speck · main"), and what's queued and how many need you, the last in orange.
2. The project's name is the project menu: pressing it lists the projects, with All projects when two or more are running, and it always shows the project the panel is showing, never "All projects" unless the bridge is open.
3. At 320 px wide, a status such as "Shipping 0599" or "Waiting: other tickets" and a project name of up to 20 characters show in full; only a longer name is cut off, with an ellipsis, on its own line, and the status never is.
4. The Settings button stays at the bar's right, at least 44 px square, and pressing the status still opens the Pipeline log.
5. Tests that checked the bar's old one-line layout are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- What the status words say, or how speck's mood is chosen.

## Notes
- Asked for 2026-11-10, with a phone screenshot: "make the top bar a little thicker, make the character larger and then have more space/lines to put the text on, because right now I can't see what ticket is shipping in the top bar and the project name has been concatenated."
- Today: the bar's markup is in `templates/panel.html`, drawn by `drawHeader` and the project menu by `drawProjects` and `chooseProject` in `templates/panel-header.js`, styled in `templates/panel-header.css`. The menu is a `select#project` whose visible option was "All projects" (0596's) while the panel showed speck.
- Waits for 0601, which changes the borders in `templates/panel-header.css`.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
