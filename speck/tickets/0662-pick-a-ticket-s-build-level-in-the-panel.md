---
id: "0662"
title: "Pick a ticket's build level in the panel"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-10-set-up-your-team-instead-of-settings.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0660"]                # ticket ids that must be done first
created: 2026-11-12
started: "2026-11-12T12:09:58.743Z"

---
# 0662 · Pick a ticket's build level in the panel

**Status:** 🔨 building

## Problem
After 0660, giving a ticket a level means `speck set` or editing the ticket. From the panel on your phone you can already change a ticket's priority, but not the level it's built at.

## Outcome
A ticket's facts in the panel show its level, and you can change it there, as you can its priority.

## Acceptance criteria
1. A ticket's facts in the panel show a Level beside Priority: the level's name with a capital first letter, or "Settings" when the ticket has none.
2. Choosing Level offers each of the project's levels and Settings. Picking one sets the ticket's `level` as `speck set <id> level <name>` does, and Settings blanks it; the facts show the new level without a reload.
3. Changing the level of a ticket that's building, reviewing, blocked or approved is refused with the message `speck set` gives for it, and the ticket keeps its level. A done or cancelled ticket shows its level without offering to change it.

## Out of scope
- Changing the levels themselves: 0661.
- Setting a ticket's own builder model or effort in the panel.

## Notes
- Follow the priority picker: `POST /api/tickets/<id>/priority/<n>` in `scripts/panel.mjs` and `setPriority` in `templates/panel.js`.
- Failing before this build: none
- Self-check: a level from the URL that the project doesn't have, including `constructor` and `__proto__`, is refused before any write; the pane's Level got a 44 px tap area; the Level menu became a short vertical list so its names don't break in a narrow tile; a seventh cell in an open Plan card's table, Type, has its row to itself.
- Pictures: the full view only. This branch's board has no drafts, so the open Plan card's Level isn't pictured; its tests cover it.
- speck (2026-11-12 12:34 UTC) told you: The build is slow, not stuck. It ran the related tests twice, about 3 and 5.5 minutes each over roughly 2,700 tests. The first run failed 5 of them because its own menu CSS made some controls smaller than 44 px. It fixed that and the second run passed. It then checked the menu in a browser and is now re-running the tests after one more CSS change, before its first review. Why: The build log shows steady progress with no step stalling, and the base branch's tests passed at the start. Two full related-test runs on a machine with a load average of about 84 explain most of the extra time.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
