---
id: "0223"
title: "Say which review round is running"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-14-say-which-review-round-is-running.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0217"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T23:48:31.710Z"

---
# 0223 · Say which review round is running

**Status:** 🔨 building

## Problem
A ticket stays `reviewing` between review rounds, and its card says "<reviewer> is reviewing · round <n>" with the last recorded round. After round 1 asks for changes, the card still says "round 1" while the builder fixes the findings and while the reviewer runs round 2, so someone watching can't tell who is at work.

## Outcome
A ticket under review says whether the reviewer is running a round, and which one, or whether the builder is fixing the last round's findings.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. While the reviewer is running a review round, the ticket's card in the Build queue says "<reviewer> is reviewing · round <n>", where n is the round being run: 1 for the first, otherwise the last recorded round plus one.
2. While a ticket is reviewing but no review round is running, its card says "<builder> is fixing round <n>'s findings", where n is the last recorded round.
3. The card shows the same after a page reload or a panel restart, and a round that ends, fails or times out no longer counts as running.
4. The stage name ("Review <n>") still uses the last recorded round, as today, and no test that passed before this change fails.

## Out of scope
- Showing how long the current round has been running.

## Notes
- The card's words come from `progress()` and `doing()` in `templates/panel.html`. Nothing records today that a review round is running: speck needs to record when a round starts and ends (`reviewRound()` in `scripts/review.mjs`) and the board feed needs to pass it on (`scripts/board-feed.mjs`).
- Failing before this build: none
- Self-check: a records folder that can't be written no longer stops a review round; the round runs without being recorded as running.
- A board that doesn't say whether a round is running (no `review_running` field, as in older fixtures) keeps the old wording, so the existing card tests still hold (AC4).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
