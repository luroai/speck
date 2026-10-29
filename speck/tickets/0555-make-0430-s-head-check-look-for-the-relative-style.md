---
id: "0555"
title: "Make 0430's head check look for the relative stylesheet"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-28-make-0430-s-head-check-look-for-the-relative-stylesheet.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-29
started: "2026-10-29T14:17:16.688Z"

---
# 0555 · Make 0430's head check look for the relative stylesheet

**Status:** 🔨 building

## Problem
0430 AC1's check that the Settings stylesheet loads in the page's head looks for `/panel-settings.css`, but since 0543 the page links `panel-settings.css`. The search finds nothing, so the check passes without checking anything, and a stylesheet could slip out of the head unnoticed.

## Outcome
0430 AC1's head check finds the page's link to `panel-settings.css`, and fails when it's missing or outside the head.

## Acceptance criteria
1. 0430 AC1's head check looks for the page's `<link rel="stylesheet" href="panel-settings.css">` and passes with `templates/panel.html` as it is.
2. The check fails when that link is missing from the page, and when it comes after `</head>`: the Delivery log says how this was checked.
3. No test that passed before this change fails.

## Out of scope
- The other stylesheets' links, which 0430 AC1 and 0472's tests already check.

## Notes
- Asked for 2026-10-29 for the 0.21.1 patch release.
- From the reviewer's minor finding F1 in 0543's round 1: `test/panel-0430.test.mjs`, line 18, compares `html.indexOf('/panel-settings.css')`, which is -1, with the head's end.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
