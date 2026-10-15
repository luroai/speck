---
id: "0200"
title: "Keep each ticket in its place in the Build list until it ships"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0199"]              # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T14:09:54.836Z"

---
# 0200 · Keep each ticket in its place in the Build list until it ships

**Status:** 🔨 building

## Problem
The Build list orders in-flight tickets by priority, so tickets move about as others start, are handed back or ship. On 2026-10-15 the user saw a ticket drop to the bottom of the list when it started shipping, which makes the list hard to follow.

## Outcome
Each ticket keeps its place in the Build list from when its build starts until it has shipped.

## Acceptance criteria
1. In-flight tickets (building, reviewing, blocked, approved or shipping) are listed in the order their builds started, earliest first, whatever their priority. Ready tickets follow, in the order `speck run` will start them.
2. A ticket keeps its place through every stage (build, self-check, review, approved, waiting to ship, shipping, a hand-back after a failed ship) until it leaves the list once shipped. The tickets above and below it keep their order too.
3. A ticket whose build start time isn't recorded goes after those that have one, by id.
4. The order is the same after the page reloads, and on every open page.
5. No test that passed before this change fails, except checks that in-flight tickets are listed by priority, which change to check AC1.

## Out of scope
- The order of the Plan list and of Shipped.
- The order `speck run` starts ready tickets in.

## Notes
- Asked for 2026-10-15: "When a ticket joins the shipped queue, it moved to the bottom of the build panels list. The tickets need to remain in order and arguably just stay where they are."
- `speck status --json` sorts tickets by priority (`byPriority`, `scripts/core.mjs`), and `panelModel()` in `templates/panel.html` lists in-flight tickets in that order. Likely cause: a newly started ticket with a higher priority goes above the ones already in flight. Not reproduced.
- A ticket's build start is its `started` time.
- Failing before this build: none
- Self-check: no changes. Checked a missing, null or unreadable start time, two started at the same moment, a ship running on a done ticket and a hand-back; all covered by the tests.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
