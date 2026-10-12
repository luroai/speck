---
id: "0139"
title: "Time a build up to its approval, not its ship"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-12

---
# 0139 · Time a build up to its approval, not its ship

**Status:** 📋 ready

## Problem
The panel times a build from when it started to when it shipped. A ticket that waits for the user to ship it, such as a high-risk one, keeps counting the whole time it waits: 0128 shows 89 minutes when the build itself took about 6. That makes the time look wrong and skews the Shipped section's median.

## Outcome
A build's time in the panel runs from when it started to when it was approved, so time spent waiting for the user to ship isn't counted.

## Acceptance criteria
1. When a ticket's status is set to `approved`, speck records the time in the ticket's frontmatter as `approved:`, in the same format as `started:`. If the ticket is approved again later, the field holds the latest approval.
2. In the queue, an approved ticket's timer shows the time from `started` to `approved` and stops counting. A building or reviewing ticket's timer counts as it does today.
3. In the Shipped section, a done ticket with both `started` and `approved` shows the minutes from `started` to `approved`, and the median minutes uses the same figure.
4. A done ticket with no `approved` (shipped before this change) shows the minutes from `started` to `finished`, as it does today. A ticket missing `started` shows no time, as it does today.
5. No test that passed before this change fails, except checks of a done or approved ticket's time that assume it runs to `finished` or to now, which are changed to the new rule.

## Out of scope
- Leaving out other waits, such as time a ticket spends blocked on a question or a paused build.
- Filling in `approved` for tickets already shipped.
- The timer skipping or repeating seconds (`speck/ideas/2026-10-11-keep-build-timers-counting-smoothly.md`).

## Notes
- Today `started` is written when status becomes `building` and `finished` when it becomes `done` (`writeField` in `scripts/core.mjs`). The Shipped minutes are `finished - started` (`panelModel` in `templates/panel.html`).
- 0128: started 19:49:52, review approved 19:55:37, shipped 21:19:13 (UTC, 2026-10-12).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
