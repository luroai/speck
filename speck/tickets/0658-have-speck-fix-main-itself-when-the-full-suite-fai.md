---
id: "0658"
title: "Have speck fix main itself when the full suite fails"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0657"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T17:59:16.015Z"

---
# 0658 · Have speck fix main itself when the full suite fails

**Status:** 🔨 building

## Problem
When the full suite fails on the base branch, speck counts it under Needs you with a row that reads "Full suite fails on main · a95b3c3 · 4 tests fail". You don't read code, so there's nothing you can do with it, and the fix is always the same: a fix ticket for the failing tests. On 2026-11-11 it sat under Needs you for over an hour, and the fix ticket speck did make stayed a draft.

## Outcome
With `watch: fix` or `decide`, speck raises and readies a fix ticket itself when the full suite fails on the base branch, and tells you in plain words; it reaches Needs you only when it can't.

## Acceptance criteria
1. With `watch: fix` or `decide`, when a full run on the base branch fails and no open fix ticket covers it, `speck run` makes one priority-0 fix ticket naming the failing tests and the commit, sets it ready and commits it, as a build does for a broken base branch.
2. While that fix ticket is open, the failing full suite doesn't count under Needs you, and Build's row for it reads in plain words, such as "Some of speck's own checks broke on main. I'm fixing it in <fix ticket>", with the ticket's id.
3. When the fix ticket is blocked or cancelled, or a fix has shipped and the next full run still fails, it counts under Needs you again, as today.
4. With `watch: tell` or `off`, nothing changes from today.
5. No test that passed before this change fails.

## Out of scope
- Fixing the tests without a ticket.

## Notes
- Asked for 2026-11-11, from the screenshot of the row: "No idea what this even means".
- A build that finds the base branch broken already makes a fix ticket and sets it ready (`/speck-build`, exit 14); the watch agent's `speck watch fix` makes only a draft.
- Full runs: `scripts/full-suite.mjs` (0630); the row: 0655.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
