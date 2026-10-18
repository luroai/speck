---
id: "0310"
title: "Find Cursor in speck detect by either name"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T22:32:31.875Z"

---
# 0310 · Find Cursor in speck detect by either name

**Status:** 🔨 building

## Problem
Cursor's CLI is now called `agent` (it was `cursor-agent`). `speck agents` finds it by either name (0288), but `speck detect`, which setup reads, still looks only for `cursor-agent`, so setup can say Cursor isn't installed when it is.

## Outcome
`speck detect` finds Cursor's CLI by either name, as `speck agents` does.

## Acceptance criteria
1. With only `agent` on the PATH, `speck detect` reports Cursor's CLI as installed.
2. With only `cursor-agent` on the PATH, it reports it installed, as today.
3. With neither, it reports it missing.
4. `speck detect` and `speck agents` agree on whether Cursor is installed.

## Out of scope
- Other agents.

## Notes
- From `speck/ideas/2026-10-18-speck-detect-finds-cursor-as-agent.md` (inbox, from 0288). `speck detect` looks for `cursor-agent` in `scripts/detect.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
