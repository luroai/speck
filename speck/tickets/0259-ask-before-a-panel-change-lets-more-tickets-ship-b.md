---
id: "0259"
title: Let the panel change auto-ship only after you confirm                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-edit-settings-from-the-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0258"]                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-17T09:22:21.680Z"

---
# 0259 · Let the panel change auto-ship only after you confirm

**Status:** 🔨 building

## Problem
`auto_ship` and `auto_ship_risk` decide which approved tickets merge and push to the base branch without you. Turning that on by a slip of the finger, from a page with no login, would let work ship that nobody looked at.

## Outcome
`auto_ship` and `auto_ship_risk` can be changed from the Settings view, and any change that lets more tickets ship by themselves happens only after you confirm it.

## Acceptance criteria
1. In the Settings view, `auto_ship` (on or off) and `auto_ship_risk` (low, high or both) can be changed. A change is saved, committed and refused in the same ways as 0258's settings.
2. Turning `auto_ship` on, or adding `high` to `auto_ship_risk` while `auto_ship` is on, first opens a dialog. It says which tickets would then merge and push to the base branch, named, without waiting for you (for example "approved low-risk tickets"). Nothing is written until you confirm, and cancelling leaves the setting and the view as they were.
3. Turning `auto_ship` off, or removing a risk from `auto_ship_risk`, is saved without a dialog.
4. `auto_ship_risk` can't be left with no risk ticked: the view says to turn `auto_ship` off instead, and nothing is written.

## Out of scope
- Every other setting: 0258.
- Changing what auto-ship does.

## Notes
- `risk: high`: it changes whether work ships without the user.
- `checkConfigValue` in `scripts/config.mjs` already refuses an empty `auto_ship_risk`.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
