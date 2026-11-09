---
id: "0586"
title: "Show Capture and Plan as compact rows"                # one outcome, no "and"
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
after: ["0585"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T21:24:53.557Z"

---
# 0586 · Show Capture and Plan as compact rows

**Status:** 🔨 building

## Problem
Capture and Plan still show the LCD-era cards. In the redesign they're compact rows like Build's, and an empty lane shows speck resting instead of a blank space.

## Outcome
Capture and Plan list their items as compact rows, and an empty lane shows speck asleep.

## Acceptance criteria
1. Each Capture note is one row: its title, a line saying where it came from (an idea, or the ticket a follow-up came from) and when, and its star, which still marks or unmarks it; pressing the row opens the note's whole text as today.
2. Each Plan draft is one row with its id, title and a line with its priority, size and risk; its Set ready and priority controls stay on the row and do what they do today.
3. An empty lane shows speck asleep with one line saying what lands there, for example "Nothing to plan · Draft tickets wait here for you to set them ready."
4. Each row is at least 44 px tall, and long titles wrap at 320 px wide.
5. Tests that checked the old look of what this changes are updated to the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Adding a way to capture from the panel: notes are still captured in chat.

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today: `captureItem`, `noteItem`, `starButton`, `ticketItem`, `ticketHead`, `priorityPicker`, `readiness`, `setReadyButton` in `templates/panel.js`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: fixed the size and risk sitting under the priority's 44 px tap box, the empty lane's face stopping the render on a page without its script, and a border coming back on the row's labels below a pixel ratio of 2; each has a test.
- AC3's "an empty lane" is read as Capture's and Plan's, as the ticket's title and problem say: Build keeps its 0449 message, and Shipped is 0587's.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Tests updated from the old look (AC5), each to the rows' new look with what it checks otherwise left as it was:
- Empty Capture's new line: `test/panel-0038.test.mjs`, `test/panel-0056.test.mjs`, `test/panel-0520.test.mjs`, `test/panel-0536.test.mjs`.
- A note's new second line ("Idea · 8 Oct", "From 0139 · 9 Oct"): `test/panel-0039.test.mjs` (AC3), `test/panel-0214.test.mjs`, `test/panel-0435.test.mjs`, `test/panel-0537.test.mjs`, `test/panel.test.mjs` (0033 AC5).
- Set ready on the row: `test/panel-0039.test.mjs` (AC1), `test/panel-0062.test.mjs`, `test/panel-0463.test.mjs`, `test/panel-0467.test.mjs`, `test/panel-0419.test.mjs` (AC1), `test/panel.test.mjs` (0042 AC1).
- Rows, not bordered cards: `test/panel-0151.test.mjs` (AC4), `test/panel-0167.test.mjs`, `test/panel-0418.test.mjs`.
- The priority, size and risk as words: `test/panel-0151.test.mjs` (AC3), `test/panel-0419.test.mjs` (AC1), `test/panel-0519.test.mjs`.
- Long titles wrap: `test/panel-0419.test.mjs` (AC1, AC2 and AC5), `test/panel-0434.test.mjs`, `test/panel-0435.test.mjs` (AC5), `test/panel-0468.test.mjs`.
