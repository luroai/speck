---
id: "0130"
title: "Write each change up in plain words when it's approved"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11

---
# 0130 · Write each change up in plain words when it's approved

**Status:** 📋 ready

## Problem
Everything a build leaves behind (the review pack, the review rounds, the delivery log) is written for someone who reads code. A user who doesn't can't tell from it what actually changed for them or how to see it for themselves.

## Outcome
Every ticket the builder takes to approval has a short account of the change in plain words, written into the ticket by the builder.

## Acceptance criteria
1. The ticket template has an `## In plain words` section, empty apart from a comment saying the builder fills it in before approval, so `speck new` creates tickets with it.
2. The `/speck-build` skill tells the builder to fill in `## In plain words` before it runs `speck close`, covering: what's different for someone using the product, how to see the change for yourself, and anything worth keeping an eye on.
3. The skill tells the builder to write that section for someone who doesn't read code: no file paths, code, function names or test names.
4. `speck lint` neither fails nor warns on a ticket whose `## In plain words` section is empty or missing, so draft tickets and tickets made before this change still pass.
5. No test that passed before this change fails.

## Out of scope
- Showing the section in a review pack: that's 0131.
- Making `speck close` refuse a ticket without it.
- Writing it up for tickets already shipped.

## Notes
- The builder writes it, not the reviewer, because the builder knows what it changed and why. The reviewer's summary stays as it is.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
