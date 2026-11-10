---
id: "0610"
title: "Put All projects in the project menu's list"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-09-put-all-projects-in-the-project-menu-s-list.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0609"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T10:37:22.396Z"

---
# 0610 · Put All projects in the project menu's list

**Status:** 🔨 building

## Problem
With two or more projects running, All projects is a button beside the project menu's caret in the black bar, taking room from the status on a phone, where the menu's own list is where it belongs.

## Outcome
All projects is an entry in the project menu's list, not a separate button.

## Acceptance criteria
1. With two or more speck panels running, the project menu's list has All projects as its first entry, which opens the bridge, and the projects under it; there's no All projects button beside the menu.
2. With one panel running, the list has no All projects entry, as today.
3. The menu shows the project the panel is showing, or All projects while the bridge is open.
4. Tests that checked the old behaviour are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- The bridge itself (0596).

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- From 0596's build. `test/panel-0516.test.mjs` compares the list's entries exactly; this ticket may change it. Today: `drawProjects`, `chooseProject` in `templates/panel-header.js`. Waits for 0609, which changes the same file.
- Relies on nothing outside this repo.
- Failing before this build: none
- Found at build: 0604 already took the separate All projects button out and put All projects in the menu's list, last. What's left for AC1 is making it the list's first entry; AC2 and AC3 already held and get tests of their own.
- Self-check: added a test that All projects still comes first while the project shown has stopped, above its "(stopped)" entry; no code change needed.
- Pictures: none, because the change is only the order of the entries in the browser's own drop-down list, which headless Chromium doesn't draw in a screenshot; the bar itself looks exactly as before.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
