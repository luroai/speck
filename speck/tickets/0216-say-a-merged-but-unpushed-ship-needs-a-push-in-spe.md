---
id: "0216"
title: "Say a merged but unpushed ship needs a push in speck run's log"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-don-t-say-speck-run-will-retry-a-ship-that-merged.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0236"]                # ticket ids that must be done first
created: 2026-10-15

---
# 0216 · Say a merged but unpushed ship needs a push in speck run's log

**Status:** 📋 ready

## Problem
When a ship that `speck run` started merges a ticket but can't push it, speck run's log says the ticket "didn't ship" and that it will try again once the base branch or the ticket's branch has a new commit. The ticket is done, so speck run never tries again, and the user waits for a retry that never comes while the remote stays behind.

## Outcome
speck run's log says plainly when a ship merged but wasn't pushed, and how to push it.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. When a ship that `speck run` started merges the ticket but the push fails, speck run's log says `<id> merged into <base> but wasn't pushed:`, followed by the ship's own message, which names the command to run (`git push <remote> <base>`, or `git pull` first when the remote has moved on).
2. In that case the log doesn't say the ticket "didn't ship", and doesn't say speck run will try it again.
3. A ship that fails before it merges is logged as today: `<id> didn't ship: …`, then the line saying speck run will try it again.
4. No test that passed before this change fails, except checks that log a merged but unpushed ship as "didn't ship", which are changed to check AC1 and AC2.

## Out of scope
- Pushing or retrying the push for the user.
- The panel's and `speck status --json`'s wording, which 0204 already changed to "Merged, but not pushed".

## Notes
- The message comes from `ended()` in `scripts/ship-queue.mjs`. The ship record already says whether the ship merged but wasn't pushed (`unpushed`, from 0204 in `scripts/ship.mjs`), and its message already names the push command.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
