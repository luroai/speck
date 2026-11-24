---
id: "0713"
title: "Show that speck is checking a question in the app"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-11-show-that-speck-is-checking-a-question-in-the-app.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0709"]                # ticket ids that must be done first
created: 2026-11-24

---
# 0713 · Show that speck is checking a question in the app

**Status:** 📋 ready

## Problem
While speck's watch agent is about to check a blocked question in the running app, the ticket says "Waiting for you" and counts under Needs you, though speck may carry on by itself. You may check it by hand for nothing.

## Outcome
Such a ticket says speck is checking it in the app, and counts under Needs you only once the agent asks you.

## Acceptance criteria
1. While speck's watch agent is checking, or will check, a blocked ticket's question in the running app, the ticket's card, its full view and `speck status` say that speck is checking it in the app, not "Waiting for you".
2. Such a ticket isn't counted under Needs you, in the bridge's Needs you, or in `speck status`'s list of what waits for you.
3. Once the agent has asked you, or when speck won't check it (`watch` off or `tell`, a high-risk ticket, or the check already done for this question with no action), the ticket reads "Waiting for you" and counts under Needs you, as today.
4. No test that passed before this change fails.

## Out of scope
- How the check itself runs (0636, 0651).

## Notes
- `fixable`/`decidable` in `scripts/foreman.mjs` exclude questions with a Check in the app line, so `foreman_will` is false for them. The agent's queue (`appCheckable`, `s.checked` in `scripts/foreman-agent.mjs`) never reaches the board.
- Waits for the ticket that keeps a ticket waiting on its base ticket out of Needs you: both change `buildGroup`, `doingNow` and the Needs you counts.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
