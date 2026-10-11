---
id: "0115"
title: "Wait for staged changes to clear before shipping"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-one-build-at-a-time.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T10:49:41.018Z"

---
# 0115 · Wait for staged changes to clear before shipping

**Status:** 🔨 building

## Problem
`speck ship` refuses when the base branch's checkout has staged changes, because git won't merge over a changed index. With one build at a time, the user is often partway through committing tickets on the base branch, so an approved ticket can fail to ship just because of when its build finished.

## Outcome
When staged changes in the base branch's checkout are all that stops a ship, `speck ship` waits for them to clear and then ships.

## Acceptance criteria
1. When staged changes are all that stops `speck ship`, it says once which files are staged and that it's waiting for them to be committed or unstaged. It then checks again at least every 10 seconds and ships as soon as they're gone.
2. It waits at most `ship_wait_minutes` (a new setting in the config template, default 30, which `speck config set` accepts as a whole number of at least 1). After that it refuses as it does today, changing nothing.
3. Uncommitted changes to a file the ticket also changes still refuse at once, as they do today.
4. While it waits, `speck ship` changes nothing in either checkout.

## Out of scope
- Refusing edits to a ticket that's being built (0114).

## Notes
- Assumption: 30 minutes as the default wait. Change it if you'd rather.
- Failing before this build: none

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
