---
id: "0547"
title: "Keep setup's defaults without asking"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-20-keep-setup-s-defaults-for-shipping-and-limits.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-27

---
# 0547 · Keep setup's defaults without asking

**Status:** 📋 ready

## Problem
Setup goes through every shipping, parallel and ticket-limit setting one at a time. For someone setting speck up for the first time, that's a lot of questions about things they don't yet have a view on, and it slows down getting to the first ticket. Seen setting up in Cursor on 2026-10-20.

## Outcome
Setup leaves the shipping, parallel and ticket-limit settings at speck's defaults and doesn't ask about them, while still asking about the agents and their models.

## Acceptance criteria
1. Section 7 of the `speck-setup` skill no longer asks about `ship_mode`, `auto_ship`, `auto_ship_risk`, `max_parallel_builds`, `max_parallel_tests` or the three `limits` settings, and setup runs no `speck config set` for them: they stay at the values `speck init` wrote.
2. Instead, setup tells the user in one or two sentences that these settings are at speck's defaults, that `auto_ship` is off so nothing ships without them, and that they can change any of them later in the panel's Settings view or with `speck config set` (checked by review).
3. When the user says in section 3, step 3 that their base branch needs pull requests, setup still offers pull request mode (`ship_mode: pr`) as that step and the "Pull request mode" paragraph describe today. Otherwise `ship_mode` stays `local`.
4. Setup still asks about the builder, the reviewer and speck's watch agent and their models (sections 5 and 6), as today. When speck was already set up, setup leaves these settings as they are and doesn't list them for changing.
5. No test that passed before this change fails, apart from tests that setup goes through those settings one at a time, which change to check the above.

## Out of scope
- Changing any of speck's defaults.
- The panel's Settings view.

## Notes
- The user's idea, 2026-10-20: "Setup should just carry out the defaults for now, rather than asking what the user wants for each setting. Still ask about the specific models."
- Reverses part of 0269, which added section 7's one-at-a-time questions.
- Decided 2026-10-27: say in a line that the settings exist and where to change them; keep pull request mode only when the base branch needs it; leave `max_parallel_builds` at its default too.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
