---
id: "0600"
title: "Make the lanes match the panel's other views"                # one outcome, no "and"
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
after: ["0599"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T07:58:14.500Z"

---
# 0600 · Make the lanes match the panel's other views

**Status:** 🔨 building

## Problem
After the redesign, the lanes still sit in the old frame: each lane is a bordered card with rounded corners and its own big 22 px title with a coloured dot, which repeats the tab above it, and its rows' titles are 17 px semibold. The Pipeline log, Decided for you and a ticket's full view are flat, edge to edge with hairlines between rows and smaller, lighter type, so moving between them feels like two different apps.

## Outcome
The lanes look like the panel's other views: flat lists in the same margins, with one type scale across rows, log lines and headings.

## Acceptance criteria
1. A lane is no longer framed as a card: it has no border or rounded corners of its own, and its list runs the panel's width inside the same side margins as the Pipeline log, Decided for you and a ticket's full view, with the same hairline between rows as the log's.
2. A lane no longer has its own title or dot, as its tab names it and gives its count; anything else on that title row, such as a lane's own figures or links, is kept, under the tabs.
3. A row's title has the size, weight and line height of the mock's rows (15 px, medium), and its details line the mock's 13 px in the muted colour, in every lane; the Pipeline log's lines, Decided for you's calls and the full view's rows use the same scale for the same kind of text.
4. The Pipeline log's, Decided for you's and a ticket's full view's headings share one size and weight, and so do their back links, at 320 px wide and in both looks.
5. Tests that checked the lane's card, its title or its rows' old type are changed to check the new look, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- How a closed row's title fits on one line (0599).
- The black bar, the tabs and the bridge.
- Showing a cut-off Pipeline log line whole.

## Notes
- Asked for 2026-11-10: "The log view also look slightly different from the main panel in terms of styles."
- Measured on 2026-11-10 in a real browser at 390 px: a lane is a card (`main > section`, `border-radius: 28px / 20px`) with `.lane-title` at 22 px, weight 600, with a dot, and its rows' titles at 17 px, weight 600; the Pipeline log's title is 20 px and its lines 14 px, weight 400, with `.5px` hairlines between them.
- The mock's rows: title 15 px, weight 500, line height about 20 px; details 13 px, muted; side margins 16 px.
- Today: `main > section`, `.lane-title`, `.lane-n` and the row title rules in `templates/panel-cards.css`; the lane title markup in `templates/panel.html`. Waits for 0599, which changes the same row title rules.
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
