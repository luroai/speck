---
id: "0729"
title: "Lay out Settings like Cursor's own settings"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
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

---
# 0729 · Lay out Settings like Cursor's own settings

**Status:** 📝 draft

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

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
