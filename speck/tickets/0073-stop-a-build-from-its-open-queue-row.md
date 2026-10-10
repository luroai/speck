---
id: "0073"
title: "Stop a build from its open queue row"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0063", "0071", "0072"]                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-10T07:37:17.637Z"

---
# 0073 · Stop a build from its open queue row

**Status:** 🔨 building

## Problem
Stopping a build for good with `speck stop` (0072) means leaving the panel for a terminal. It's also the one control that ends a build, so it shouldn't sit where a stray click hits it.

## Outcome
An open queue ticket with a running or paused build has a Stop build button, which asks first and then stops it.

## Acceptance criteria
1. An open `building` or `reviewing` ticket in the queue whose build `speck run` launched and is running or paused shows a **Stop build** button among its open details. A closed row, and any other ticket, has none.
2. Clicking it asks the user to confirm. Confirming stops the build exactly as `speck stop <id>` does, and cancelling changes nothing. Neither opens nor closes the row.
3. The server accepts the stop request only with the same `Origin` and `X-Speck-Token` checks as Set ready; anything else gets 403 and changes nothing. When the server refuses, the reason shows under the button until the next click on it.

## Out of scope
- Throwing the work away and building the ticket again from scratch.

## Notes
- After 0063, which adds a Full ticket button to the same open details, 0071, which adds the pause and play requests this follows, and 0072, which does the stopping.
- product.md's Queue description needs updating.
- product.md no longer exists (removed by 0068), so README's `speck stop` row says what the panel's Stop build button does instead.
- The server stops the build in its own process, as `speck stop` does, so it answers other requests only once the stop is done (a few seconds at most).
- Self-check: a refused stop's reason is now dropped once its ticket has no Stop build button, so building it again later doesn't show the old reason; test added.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
