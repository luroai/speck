---
id: "0337"
title: "Make the 0108 launch test pass again on main"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-20
started: "2026-10-20T12:27:19.846Z"

---
# 0337 · Make the 0108 launch test pass again on main

**Status:** 🔨 building

## Problem
On main, the test `0108 AC2: a ticket committed as ready on the base branch is launched as before` (`test/ready-0108.test.mjs`) fails every time it runs, so every ticket's ship fails on it (0335 was handed back for it on 2026-10-20). It checks that speck run's output has no line matching `/0001[^\n]*commit/i`. Since 96a05182 (0327), when the test's fake build exits at once with the ticket still ready, speck run prints `0001 is still ready, so the build never started it. speck run won't launch it again until its ticket is set ready again and committed. …`, which matches. The test passes on the commit before 96a05182 and fails on 96a05182 and on main.

## Outcome
The 0108 AC2 test passes on main again, still checking that a ticket committed as ready is launched without speck run saying it's waiting for a commit.

## Acceptance criteria
1. `0108 AC2: a ticket committed as ready on the base branch is launched as before` passes on main, run on its own and in the whole suite.
2. It still fails if speck run says a ticket committed as ready is waiting to be committed before it's launched.
3. No test that passed before this change fails.

## Out of scope
- Changing speck run's messages, unless the builder finds the message itself is wrong.

## Notes
<!-- Constraints, links and decisions. Optional. -->
- Found while handing back 0335 on 2026-10-20: `speck ship` said main's tests pass, but this test failed 6/6 on a checkout of main run on its own.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
