---
id: "0601"
title: "Make the panel's border lines a little more visible"                # one outcome, no "and"
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0600"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T08:31:49.058Z"

---
# 0601 · Make the panel's border lines a little more visible

**Status:** 🔨 building

## Problem
The panel's border lines, between rows, round boxes and under headings, are hard to see: they're a very pale grey (#E4E6EA in the light look, #2A2D31 in the dark) and most are drawn half a pixel wide, which a standard-density screen draws fainter still. The user asked for them to be a tiny bit more visible.

## Outcome
The panel's border lines are a little more visible, alike on every screen, in both looks.

## Acceptance criteria
1. The line colours `--line` and `--line-soft` are #D9DCE1 in the light look and #383B41 in the dark look.
2. Every border, divider and row separator drawn in those colours is 1 px wide instead of half a pixel, so it shows the same on a standard and a high-density screen.
3. Nothing else changes colour or size: the black bar, text, buttons' fills and the spacing between rows stay as they are.
4. Tests that checked those colours or widths are changed to the new ones, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Adding borders where there are none.

## Notes
- Asked for 2026-11-10: "Can we make the border lines a tiny bit more visible?"
- Decided: one step darker and a full pixel, rather than a lot darker, as the user asked for "a tiny bit". The new colours stay well below the text's contrast: about 1.37:1 against the light background (from 1.25:1) and 1.67:1 against the dark (from 1.35:1).
- Today: the tokens are in `templates/panel-base.css` (light at about line 13, dark at about line 122); `.5px solid var(--line…)` appears about 70 times across `panel-base.css`, `panel-cards.css`, `panel-popups.css`, `panel-settings.css` and `panel-header.css`.
- Waits for 0600, which changes the lanes' row separators.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes. Borders that start in a line colour and are recoloured on hover or when picked (tags, priority buttons, Close) take the new 1 px with them. The disabled Set ready and Save all buttons keep their half-pixel outline, as it is the enabled button's own width only recoloured, so the button doesn't change size when it is disabled.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
