---
id: "0440"
title: "Tell a ticket waiting for you from one that needs you"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-tell-waiting-for-you-from-needs-you-at-a-glance.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24

---
# 0440 · Tell a ticket waiting for you from one that needs you

**Status:** 📝 draft

## Problem
Since 0426, a ticket waiting for you to ship it is Cursor's magenta and one that needs you is Cursor's red. They're only about 30° apart in hue, so at a glance they look the same, and 0138's check that they differ was eased from 60° to 20° to let them through.

## Outcome
A ticket waiting for you to ship it and one that needs you are clearly different colours.

## Acceptance criteria
1. A ticket waiting for you to ship it (approved, and not covered by auto-ship) shows in Cursor's green (`#70B489` dark, `#1F8A65` light, or the nearest shade that meets 0161's contrast) wherever it shows in magenta today: its edge, its tint and its words. A ticket that needs you stays in Cursor's red.
2. 0138's check that those two states differ in hue is back to at least 60°, in both looks, and passes.
3. Every colour that changes still meets 0161's contrast, and no test that passed before this change fails, except checks of the old magenta, which change to match.

## Out of scope
- Other state colours.

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- Green already means passing checks and shipping in 0426, so "approved, ready to ship" sits with them.
- Waits for nothing: the colour tokens are in `templates/panel.css`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
