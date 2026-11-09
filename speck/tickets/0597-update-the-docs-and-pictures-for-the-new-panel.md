---
id: "0597"
title: Bring the docs up to date with the new panel                # one outcome, no "and"
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
after: ["0581","0582","0587","0588","0590","0592","0593","0594","0596"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T23:57:45.071Z"

---
# 0597 · Bring the docs up to date with the new panel

**Status:** 🔨 building

## Problem
After the redesign, the brief's long `speck panel` row and the README's demo pictures still describe and show the LCD panel.

## Outcome
The docs and the README's pictures describe and show the redesigned panel.

## Acceptance criteria
1. `docs/brief.md`'s `speck panel` row describes the redesigned panel: the black bar with speck, the tabs, the compact rows, the full view, Decided for you, the Pipeline log view, the Settings view and the bridge, and no longer describes the LCD screen.
2. The README's demo pictures, `docs/images/demo-light.png` and `docs/images/demo-dark.png`, are taken again from the redesigned panel, in each look.
3. The README describes the panel as it now is (checked by review).
4. `docs/brief.md` names no file, function or setting the redesign removed, such as `lcd.js` or Doto.
5. No test that passed before this change fails.

## Out of scope
- The landing page, which lives in its own repo.
- The changelog and release notes (0598).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- The `speck panel` row is one table row of several thousand characters at about line 203 of `docs/brief.md`; it may be split into a section of its own if that reads better.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
