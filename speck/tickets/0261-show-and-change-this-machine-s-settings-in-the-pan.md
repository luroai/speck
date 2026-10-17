---
id: "0261"
title: "Manage this machine's settings from the panel"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-edit-settings-from-the-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0259","0260"]                # ticket ids that must be done first
created: 2026-10-16

---
# 0261 · Manage this machine's settings from the panel

**Status:** 📋 ready

## Problem
Once a setting can be set for this machine only, someone looking at the Settings view can't tell whether the value shown is theirs or the repo's, and can't choose which to change.

## Outcome
The Settings view shows which settings use this machine's value, and lets you change or clear this machine's value without changing the repo's.

## Acceptance criteria
1. In the Settings view, `max_parallel_builds` and `max_parallel_tests` each show the value speck uses and say whether it's this machine's or the repo's. With a machine value set, the repo's value is shown too.
2. Changing either one asks whether the change is for "this machine only" or "the repo, for everyone". "This machine only" saves it as `speck config set --machine` does, with no change to `speck/config.yml` and no commit. "The repo" saves it as 0258 does.
3. A machine value can be cleared from the view, after which it shows the repo's value as the one speck uses.
4. A machine-only change is saved even when the checkout isn't on the base branch or `speck/config.yml` has uncommitted changes, since nothing is committed. A request without the panel's token or from another origin is refused with 403 and changes nothing.

## Out of scope
- Making other settings machine-only: 0260 decides which can be.

## Notes
- Builds on 0258 (panel writes for settings) and 0260 (machine values).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
