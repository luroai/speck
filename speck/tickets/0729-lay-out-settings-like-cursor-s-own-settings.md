---
id: "0729"
title: "Lay out Settings like Cursor's own settings"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "deep"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T11:55:19.985Z"

---
# 0729 · Lay out Settings like Cursor's own settings

**Status:** 🔨 building

## Problem
The panel mostly runs inside Cursor's browser pane, and its Settings view looks out of place there: raw config keys in a mono font as labels, explanations hidden behind ⓘ buttons, and bordered cards with dividers. Cursor's own settings show a plain name with a muted line under it, rows grouped on soft filled blocks under small section labels, and each control on the right.

## Outcome
Settings reads like a page of Cursor's settings: plain names, a muted line each, and rows grouped on filled blocks under small section labels.

## Acceptance criteria
1. Each setting row shows a plain name in the interface font (such as "Name", "Watch", "Bench"), with a short muted line under it saying what it does, and its control on the right of the row, as in Cursor's settings. No row shows a config key as its label; the key is in the row's tooltip.
2. Rows are grouped on rounded blocks filled with the raised background (`--raise`), with no borders round the blocks and no lines between their rows, each group under a small muted section label (such as "Startup" in Cursor). A team member's group opens with a row holding its character, name and one-line job.
3. No row has an ⓘ button. A setting's full explanation, with its default and where a change is saved, is still reachable from its row in one press, and a machine's own value and its clear option still show as today.
4. At 375 px wide every row fits with no sideways scroll, its name and muted line wrapping and its control staying on the right or going under it, and every control still has a 44 px target.
5. No test that passed before this change fails, except tests that pin the old layout (labels as keys, ⓘ buttons, card borders and dividers), which are changed to check the new one.

## Out of scope
- How controls look (switches, menus, boxes and buttons): a ticket of its own.
- When changes are saved: the Save button stays.
- Which settings Settings shows.

## Notes
- Raised by the user on 2026-11-24 with a screenshot of Cursor's General settings: "It needs to look like it's part of the existing Cursor app."
- Cursor's look in that screenshot: the page heading ("General"); each group a rounded block a shade off the page with no border; small muted labels above groups; a row is a name (about 13 px, regular) over a muted description, with the control right-aligned; generous padding, no dividers.
- The view is `templates/panel-settings.js` and `templates/panel-settings.css`; explanations come from `explainFully` in `scripts/settings.mjs`. The short muted line can be each explanation's first sentence, or a new short line per setting.
- Keep to the panel's own colour tokens in both looks, so the dark look matches Cursor's dark theme the same way.
- Failing before this build: none
- Builder: each setting's plain name and short line come from speck panel with its explanation (`label` and `summary`, beside `explain` in `scripts/settings.mjs` and `scripts/team.mjs`). A setting it gives no name for is named in words made from its key, never the key itself. Appearance and Auto-build, which have no key, have theirs in the view, under a "General" label.
- Builder: the name is a button that shows the full explanation, and its target reaches over the short line under it. A press shows it, the next hides it, and Enter or Space does the same from the keyboard. Nothing shows from the pointer resting on a row or from focus any more, as the name is a far bigger target than the info button was. A model drawn in its agent's row (without a list of your agents' models) is explained with its agent, as a role's effort already was (0405), since it has no name of its own.
- Builder: AC4's 44 px target for every control. Settings' menus and text and number boxes were about 22 px tall, and its switches and Appearance's buttons 26 px, so not every control had one. A menu can't be given a bigger target without being drawn bigger, so menus and boxes are now drawn at least 44 px tall. The switches, a risk's tick box with its word, a level's Remove and Appearance's buttons got invisible 44 px targets, which change nothing in their look. 0730 restyles the controls next and keeps the targets.
- Self-check: a setting named for the engineering manager with no short line would have thrown in speck panel and broken the Settings view, so that's guarded, with a test. Fixed a comment.
- speck (2026-11-24 12:28 UTC) told you: Nothing is stuck. About 19 minutes went on reading the large Settings code and its many older layout tests before writing any code, and about 9 more on proving the new tests fail on the old code, where each failing run sat for 85 to 90 seconds waiting for parts of the page that don't exist yet. On the new code the same tests pass in seconds, and the build is now checking what its browser test measures. Why: The build log's timestamps show where the time went, the slow runs were only the expected failures on the old code, and the machine's load of 85 to 154 slowed everything further.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
