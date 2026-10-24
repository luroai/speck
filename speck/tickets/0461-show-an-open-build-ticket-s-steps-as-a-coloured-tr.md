---
id: "0461"
title: "Show an open build ticket's steps as a coloured track"                # one outcome, no "and"
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0459"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T10:33:13.858Z"

---
# 0461 · Show an open build ticket's steps as a coloured track

**Status:** 🔨 building

## Problem
An open ticket in the Build lane says where it is in the pipeline only as a word in a line of facts joined by dots, which wraps untidily on a phone. You can't see at a glance how far through the five steps it is.

## Outcome
An open ticket that's in flight shows a track of its five steps, each in its own colour, so you can see at a glance where it is.

## Acceptance criteria
1. An open ticket that's in flight shows, under its title, a track of five equal bars in one row, each with its step's name under it: Build, Self-check, Review (with its round, such as `Review 2`, once there is one), Approve and Ship, from the steps the panel already works out for it. A closed ticket and a queued ticket don't show it.
2. Each step has its own colour: Build blue, Self-check cyan, Review yellow, Approve green and Ship purple. A finished step's bar and the current step's bar are in that step's colour, and the current step's name is in its colour and bold. A step not reached yet has a grey bar and name. A blocked ticket, or one whose build stopped, has its current step's bar and name in the crimson blocked tickets use.
3. A ticket that's shipping has a purple border to match its Ship bar, where it's green today. Every other card keeps its border.
4. The bars and names keep to one row at every width from 320 px: a name too long for its bar ends in `…`, and nothing wraps. Each colour reaches 3:1 against the card for the bars and the contrast 0161 sets for text, in both looks. Checked in a real browser at 320 px.
5. No test that passed before this change fails.

## Out of scope
- The line of facts under the title, which 0462 turns into a grid.
- Closed and queued tickets, and the Plan and Shipped tabs.

## Notes
- Asked for by the user on 2026-10-24, choosing option D in the mock-ups (https://claude.ai/artifact/BANvGzKKYy1p4AjBipypTb): "make sure the progress tracker changes colour depending on the stage … blue is build … shipping is purple … each bar is its own colour", and "as clean and as uniform as the images".
- The steps are `t.steps` from `progress` in `templates/panel-model.js`: labels `Build`, `Self-check`, `Review`/`Review <n>`, `Approve`, `Ship`, each with a state of `done`, `now` or blank.
- Colours today, in `templates/panel.css`: `.q.at-build` `--blue`, `.q.at-check` `--inbox` (cyan), `.q.at-review` `--yellow`, `.q.at-ship` `--green`, and a ticket waiting to ship `--ok`. Purple is `--idea`. 0440 moved the waiting-to-ship colour off magenta because it was too near the red: the purple chosen must still read as different from `--bad`.
- Waits for 0459, the last open ticket that changes `templates/panel.css` and `templates/panel.js`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
