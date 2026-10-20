---
id: "0348"
title: "Pick the Foreman's model from its agent's list in the Settings view"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0347"]                # ticket ids that must be done first
created: 2026-10-20
started: "2026-10-20T21:33:21.240Z"

---
# 0348 · Pick the Foreman's model from its agent's list in the Settings view

**Status:** 🔨 building

## Problem
In the panel's Settings view, `foreman_model` is a box to type in for every agent, where `builder_model` is a list of the builder's models. Someone choosing the Foreman's model has to know its exact name as that agent writes it.

## Outcome
The Settings view offers the Foreman agent's models for `foreman_model` in a list, as it does the builder's for `builder_model`.

## Acceptance criteria
1. In the Settings view, `foreman_model` is a list of the models of the agent the Foreman runs on, each shown by its display name where it has one: Claude's model names for `claude`, the models Codex lists for `codex` and the models Cursor lists for `cursor`.
2. With `foreman` blank, the list is of the agent the Foreman runs on then (the builder when that's Codex or Cursor, and Claude Code otherwise).
3. When that agent's models can't be read, `foreman_model` is a box to type in, with why in one line, as for the builder.
4. Choosing another Foreman agent in the view while one is saved says to save it, then open Settings again to pick from its models, as for the reviewer.
5. No test that passed before this change fails.

## Out of scope
- `foreman_effort`.

## Notes
- From the user (2026-10-20), with 0347, which makes the Cursor reviewer's model a list.
- After 0347, which changes the same Settings code (`scripts/settings.mjs`, `templates/panel.html`). `foremanAgentOf` in `scripts/foreman-agent.mjs` says which agent the Foreman runs on.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
