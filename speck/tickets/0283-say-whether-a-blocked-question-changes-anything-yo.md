---
id: "0283"
title: "Say whether a blocked question changes anything you'd notice"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0290", "0293"]               # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T12:25:31.161Z"

---
# 0283 · Say whether a blocked question changes anything you'd notice

**Status:** 🔨 building

## Problem
When a build blocks, its question gives the options and a recommendation, but nothing says whether the choice changes anything the user would notice, or whether the recommendation is a clear winner or a judgement call. So every blocked ticket waits for the user, even though none has ever needed a product decision: on 2026-10-17, 0274 blocked on a test 0270 left behind, and the user just took the recommendation.

## Outcome
Every blocked question says, in a form speck can read, which option the build recommends, whether any option changes what the user would notice, and whether the recommendation is a clear winner.

## Acceptance criteria
1. The build skill (`skills/speck-build/SKILL.md`) has a build that blocks record three things with its question: the option it recommends, whether any option changes something the user would notice (what speck does, shows or ships), and whether the recommendation is a clear winner or the options are close. (checked by review)
2. speck keeps those three on the blocked ticket where programs can read them, and `speck status --json` gives them for each blocked ticket.
3. A ticket blocked without them still blocks and reads as it does today, with the three given as unknown.
4. The panel shows, on a blocked ticket's question, "Changes what you'd notice" or "Doesn't change what you'd notice", and "Clear recommendation" or "Close call", and nothing for an unknown.

## Out of scope
- Acting on them: 0284 (from the panel) and 0286 (the Foreman).

## Notes
- First step of `speck/ideas/2026-10-17-a-foreman-that-keeps-the-work-moving.md`.
- Blocking is in `/speck-build` sections 5 and 6, and `speck set <id> status blocked`. speck run writes a blocked question itself in `scripts/run.mjs` (search for "Blocked question").

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
