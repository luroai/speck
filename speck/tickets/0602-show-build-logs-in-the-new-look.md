---
id: "0602"
title: "Show build logs in the new look"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0601"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T08:46:04.716Z"

---
# 0602 · Show build logs in the new look

**Status:** 🔨 building

## Problem
A ticket's build log still opens in the LCD-era frame: a dark bezel box with a red-dot title, a small bordered Close button, and a black terminal with a white border, with every wrapped line indented under a time column. A building ticket's full view shows its live log in the same black terminal. Everywhere else the redesign has moved to light, flat views.

## Outcome
A ticket's build log and its live log read like the Pipeline log: flat, in the panel's own colours and type.

## Acceptance criteria
1. A ticket's Build log opens as a full view like the Pipeline log, with a back link to the ticket, a heading such as "0597 build log", and no dark frame, red dot or bordered Close button.
2. Its lines are rows in the Pipeline log's style: the time in the mono font and muted, the text in the panel's font, a tool call's line in the muted colour, a failure in the bad colour, a wrapped line continuing under its own text rather than under a wide indent, in both looks.
3. A building ticket's full view shows its live log in the same style, inside the view rather than in a black box, its newest line last and kept in view as lines arrive, as today.
4. The Full log and Stop build buttons look like the panel's other secondary buttons (0603).
5. Tests that checked the build log's old frame or terminal look are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Formatting the Markdown in a builder's own messages.
- What the build log contains.

## Notes
- Asked for 2026-11-10, with a phone screenshot of a shipped ticket's build log: "It's the old branding", and "I think it will happen elsewhere too."
- Checked on 2026-11-10 in a real browser at 390 px, after 0577 to 0597 shipped: the Pipeline log, Decided for you, the Settings view and the top of a ticket's full view are in the new look; the places below aren't.
- Today: the build log reuses `#foreman` (`renderBuildLog`, `drawBuildLog` in `templates/panel-popups.js`) without the `.log-view` class 0592 gave the Pipeline log, so it keeps `#foreman .top` and `.fm-body` on `var(--bezel)` and `.run-log` on `var(--log-bg)` in `templates/panel-popups.css`. The live log is `.q .log` on `var(--log-bg)` in `templates/panel-cards.css` (`logBox` in `templates/panel.js`).
- Waits for 0601, which changes the borders in the same files.
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
