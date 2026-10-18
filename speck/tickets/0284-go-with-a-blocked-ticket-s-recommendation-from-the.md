---
id: "0284"
title: "Go with a blocked ticket's recommendation from the panel"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0285"]               # ticket ids that must be done first
created: 2026-10-18

---
# 0284 · Go with a blocked ticket's recommendation from the panel

**Status:** 📋 ready

## Problem
Clearing a blocked ticket means messaging an agent "go with the recommendation" or resuming its session by hand, even when the build has already said what it recommends.

## Outcome
A blocked ticket's question in the panel has a button that takes the build's recommendation and starts the build again.

## Acceptance criteria
1. A blocked ticket whose question has a recommendation (0283) shows a "Go with the recommendation" button beside the question in the panel. A ticket without one shows no button.
2. Pressing it resumes the ticket's own build session, as speck run resumes a build after a hand-back, with a message saying the user chose the recommended option, naming it, and to carry on from where it left off. The ticket shows as building again.
3. The ticket's Notes record that the user took the recommendation, with the option and the time.
4. When the build can't be resumed (no run record, or no session), the button isn't shown, and the question says how to resume it by hand, as the panel does today.

## Out of scope
- Answering with a different option, or in your own words.
- The Foreman doing this by itself: 0286.

## Notes
- speck run's hand-backs resume a build in `scripts/hand-back.mjs` (`resumeArgv`). Panel writes are in `scripts/panel.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
