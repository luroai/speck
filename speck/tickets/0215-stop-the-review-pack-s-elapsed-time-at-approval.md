---
id: "0215"
title: "Stop the review pack's elapsed time at approval"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-12-stop-the-review-packs-elapsed-time-at-approval.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0236"]                # ticket ids that must be done first
created: 2026-10-15

---
# 0215 · Stop the review pack's elapsed time at approval

**Status:** 📝 draft

## Problem
The review pack's "Elapsed since build started" line counts up to the moment the pack is read. For a ticket that has waited to be shipped, it includes the wait, so it disagrees with the panel (which since 0139 stops at approval) and looks wrong to the person deciding whether to ship.

## Outcome
A review pack read after approval shows the build's time up to its approval, not up to when it's read.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. For a ticket with both `started` and `approved`, the review pack (from `speck pack <id>` and the panel's Review pack button) reads `Elapsed since build started: <n> min`, where `<n>` is the whole minutes from `started` to `approved`, rounded as today, however long after approval the pack is read.
2. For a ticket with `started` but no `approved` (still building or reviewing, or shipped before 0139), the line counts from `started` to now, as it does today.
3. For a ticket with no `started`, the line reads `Elapsed: not recorded`, as it does today.
4. The Delivery log line written when `speck close` approves a ticket still counts from `started` to the moment of that approval, including when the ticket already has an `approved` time from an earlier approval.
5. No test that passed before this change fails.

## Out of scope
- The panel's own times, which 0139 already stops at approval.
- Changing the line's wording.

## Notes
- `reviewTotals()` in `scripts/pack.mjs` works out the line for both the review pack and the Delivery log (`scripts/close.mjs`). `speck close` calls it before it sets `approved`, so on a ticket approved before (AC4), the old `approved` time is still in the frontmatter at that point.
- `approved:` is written in the same format as `started:` (0139).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
