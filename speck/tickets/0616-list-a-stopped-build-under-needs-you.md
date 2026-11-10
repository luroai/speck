---
id: "0616"
title: "List a stopped build under Needs you"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-09-list-a-stopped-build-under-needs-you.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0615"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T11:52:59.104Z"

---
# 0616 · List a stopped build under Needs you

**Status:** 🔨 building

## Problem
A ticket whose build stopped before finishing sits under Building with a grey dot, among the tickets being worked on, even when nothing is going to carry it on. It needs someone, so it's easy to miss there.

## Outcome
A stopped build that nothing will carry on is listed under Needs you.

## Acceptance criteria
1. A ticket whose build stopped before finishing, and that speck won't resume or look into (with `watch` off or `tell`, or once speck has looked and left it), is listed under Needs you with the orange dot and a line saying its build stopped.
2. A stopped build speck is about to resume or look into stays under Building.
3. The bar's needs-you count includes it.
4. Tests that checked the old behaviour are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Resuming stopped builds.

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- Decided: it depends on `watch`, as speck may carry it on with `fix` or `decide`.
- From 0585's build. Today: the grouping in `templates/panel.js` (0585) and the board's facts in `scripts/speck.mjs` and `scripts/foreman.mjs`. Waits for 0615, which changes the same file.
- Relies on nothing outside this repo.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
