---
id: "0655"
title: "Say under Needs you when the full suite fails on the base branch"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-11-say-in-the-panel-what-a-failing-full-suite-is.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T15:39:36.068Z"

---
# 0655 · Say under Needs you when the full suite fails on the base branch

**Status:** 🔨 building

## Problem
When the full suite fails on the base branch, the panel's bar says Needs you and counts it, but nothing in the panel says what it is: Build's Needs you group shows no ticket for it. On 2026-11-11 it looked like a ticket already dealt with was still counted.

## Outcome
When the full suite fails on the base branch, Build's Needs you group shows it as a row of its own saying so.

## Acceptance criteria
1. While the latest full run (`commands.test_full`) on the base branch failed and counts under Needs you, Build's Needs you group has a row for it, with the orange dot, saying the full suite fails on the base branch, the commit's short id and how many tests fail.
2. Pressing the row opens a view naming each failing test, when the output is TAP, the commit, when it ran and where its log is, with a back link.
3. Once a full run on a newer commit passes, the row goes, as the count under Needs you does.
4. The row fits a phone-width panel in the light and the dark look.

## Out of scope
- The bridge's count: `speck/ideas/2026-11-11-count-a-failing-full-suite-on-the-bridge.md`.

## Notes
- From 0630's follow-up note. `speck status` already prints the line; `speck status --json` should give the panel the same.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
