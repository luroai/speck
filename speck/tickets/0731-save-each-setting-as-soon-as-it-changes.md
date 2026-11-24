---
id: "0731"
title: "Save each setting as soon as it changes"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0730"]                # ticket ids that must be done first
created: 2026-11-24

---
# 0731 · Save each setting as soon as it changes

**Status:** 📋 ready

## Problem
Settings makes you press a Save button fixed to the bottom of the view, and asks what to do with unsaved changes when you close it. Cursor's settings, which the panel sits beside, save each change the moment it's made, and the user found the Save step a let-down. Build levels already save straight away (0661).

## Outcome
Each setting saves the moment it changes, and Settings has no Save button and no unsaved-changes question.

## Acceptance criteria
1. Changing a switch or picking from a list saves that setting straight away; a text or number box saves when you press Enter or leave it with its value changed. Each saves only that setting, where it's saved today (for your machine only, or in `speck/config.yml` with a commit of only that file), and the row shows briefly that it saved.
2. A change speck refuses (an invalid value, a reviewer of the builder's own model, or a project setting while the checkout isn't on the base branch or `speck/config.yml` has uncommitted changes) is not saved: the row goes back to the saved value and shows the reason under it.
3. Turning `auto_ship` on, or adding a risk to `auto_ship_risk` while it's on, first opens today's dialog naming the approved tickets that would then ship without you, and saves only if you confirm; cancelling puts the control back. Unticking the last risk is refused as today.
4. Settings has no Save button, and closing it never asks about unsaved changes.
5. No test that passed before this change fails, except tests of the Save button, saving several settings in one commit, and the unsaved-changes question, which are changed to check saving each setting on its own.

## Out of scope
- How rows and controls look (the two tickets before this one).
- Build levels, which already save straight away.
- `speck config set`, which is unchanged.

## Notes
- Decided by the user on 2026-11-24: settings change instantly, as in Cursor, and the Save button goes.
- Each project setting saved is its own commit of `speck/config.yml`, rather than one commit per Save.
- Today: one Save (`save-all`) posts every change to `/api/settings/save` (`templates/panel-settings.js`, `scripts/settings.mjs` `panelSaveRequest`/`checkChange`), and `settings-unsaved` asks on closing. Levels save straight away through `/api/levels/…` (`levelAction`), which this can follow.
- A change made while an earlier save of the same setting is under way waits for it, so saves land in the order made.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
