---
id: "0166"
title: "Leave waiting time out of a ticket's build time"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-14

---
# 0166 · Leave waiting time out of a ticket's build time

**Status:** 📋 ready

## Problem
A ticket's build time still counts time spent waiting for the user. 0139 stopped the clock at approval, but a ticket that blocks with a question keeps counting until the user answers: 0151 blocked overnight, so its time includes hours nobody was building, and the Shipped section's median minutes are skewed by it. The same goes for a build the user pauses.

## Outcome
A ticket's build time counts only the time an agent was working on it: from the start of its build to its approval, minus any time it spent blocked or paused.

## Acceptance criteria
1. When a ticket's status becomes `blocked`, speck records the time; when it leaves `blocked`, speck adds the time it spent blocked to a running total in the ticket's frontmatter (for example `waited_seconds:`), so a ticket that blocks more than once adds each stretch.
2. When a build is paused (`speck pause`) and later played (`speck play`), the time it spent paused is added to the same total.
3. The Build queue's timer for a ticket shows its build time without the waiting: it stops counting while the ticket is blocked or paused, and carries on from the same figure when it resumes.
4. The Shipped section's minutes for a ticket, and the median minutes, use start to approval minus the total waited. A ticket with no record of waiting (shipped before this change) shows its figure as today.
5. No test that passed before this change fails.

## Out of scope
- Working out the waiting for tickets already shipped, such as 0151, from their history.
- Time between Set ready and the build starting, which isn't counted today either.

## Notes
- `started` is set when status becomes `building` and `approved` when it becomes `approved` (`writeField` in `scripts/core.mjs`, 0139). The Shipped minutes come from `panelModel` in `templates/panel.html`; the queue timer from `startCounters` and `tickCounters`.
- A ticket can be resumed from blocked by `/speck-build`, by `speck run` resuming a killed build, or by hand, so the blocked time should be closed off by the status change itself, not by whatever resumed it.
- Reported 2026-10-14: "I just want that timer to be the true build time, not the total elapsed time."

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
