---
id: "0780"
title: "Fix the full suite failing on main at 2effb67"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-27

---
# 0780 · Fix the full suite failing on main at 2effb67

**Status:** 📋 ready

## Problem
The full suite fails on main at commit 2effb67 (2effb67900d26393168ab59c239a29d6d6a6d852). Failing tests:
- 0151 AC4: at 1280 px in the dark look, every ticket in Plan and idea and inbox note in Capture (0586) is a row with a hairline under it and no gap
- 0151 AC5: at 375 px, opening a ticket, the priority menu, Set ready and Full ticket work as before
- 0151 AC5: at 1280 px, opening a ticket, the priority menu, Set ready and Full ticket work as before
- 0165 AC5: every tag is announced with its meaning
- 0165 AC4: the Plan priority tag keeps its pointer, and the tags that show a tip get the help pointer
- 0177 self-check: a board reader that stops answers with a plain error, and the next reading starts a new one
- 0187 AC3: with four pages open, a change is read once, and each page gets that one board
- 0187 AC3: ten tickets changed at once reach each page as one update
- 0206 AC1 AC2: an unanswered call in the 0149 browser test fails that test, ends its panel and browser, and the others pass
- 0281 AC1 AC2: at every width and pixel ratio, the controls sit on whole pixels, each border at least a device pixel
- 0357 AC2: the panel serves POST /api/tickets/<id>/changes to its own page only
- 0371 AC1, AC4: at the narrowest width, showing an explanation moves nothing and it floats inside the view
- 0372 AC2: in a real browser, choosing dark in Settings switches the page, and it stays dark after a reload
- 0385 AC1, AC2, AC3: in a real browser, the pop-up never moves sideways on a phone, nothing in it is too wide, and a desktop sees it as before
- 0410 AC2: in a real browser, at every width the page doesn't scroll and the open lane's list does, under a header and tab row that stay put
- 0453 AC1 AC3: at every width and pixel ratio, every button sits on whole pixels with a border at least a device pixel on all four sides, and keeps its corners
- 0453 AC2: on a phone at a pixel ratio of 3, Full ticket (0587: on a Plan ticket), Close, a document's button and the Pipeline log's filter show all four sides of their border

## Outcome
The full suite passes on main again.

## Acceptance criteria
1. Each of these tests passes on main again: 0151 AC4: at 1280 px in the dark look, every ticket in Plan and idea and inbox note in Capture (0586) is a row with a hairline under it and no gap, 0151 AC5: at 375 px, opening a ticket, the priority menu, Set ready and Full ticket work as before, 0151 AC5: at 1280 px, opening a ticket, the priority menu, Set ready and Full ticket work as before, 0165 AC5: every tag is announced with its meaning, 0165 AC4: the Plan priority tag keeps its pointer, and the tags that show a tip get the help pointer, 0177 self-check: a board reader that stops answers with a plain error, and the next reading starts a new one, 0187 AC3: with four pages open, a change is read once, and each page gets that one board, 0187 AC3: ten tickets changed at once reach each page as one update, 0206 AC1 AC2: an unanswered call in the 0149 browser test fails that test, ends its panel and browser, and the others pass, 0281 AC1 AC2: at every width and pixel ratio, the controls sit on whole pixels, each border at least a device pixel, 0357 AC2: the panel serves POST /api/tickets/<id>/changes to its own page only, 0371 AC1, AC4: at the narrowest width, showing an explanation moves nothing and it floats inside the view, 0372 AC2: in a real browser, choosing dark in Settings switches the page, and it stays dark after a reload, 0385 AC1, AC2, AC3: in a real browser, the pop-up never moves sideways on a phone, nothing in it is too wide, and a desktop sees it as before, 0410 AC2: in a real browser, at every width the page doesn't scroll and the open lane's list does, under a header and tab row that stay put, 0453 AC1 AC3: at every width and pixel ratio, every button sits on whole pixels with a border at least a device pixel on all four sides, and keeps its corners, 0453 AC2: on a phone at a pixel ratio of 3, Full ticket (0587: on a Plan ticket), Close, a document's button and the Pipeline log's filter show all four sides of their border.
2. No test that passed before this change fails.

## Out of scope
- Changes the failing tests don't need.

## Notes
<!-- Constraints, links and decisions. Optional. -->

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
