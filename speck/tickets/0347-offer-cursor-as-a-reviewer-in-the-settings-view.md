---
id: "0347"
title: "Offer Cursor as a reviewer in the Settings view"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-20-offer-cursor-as-a-reviewer-in-the-settings-view.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-20

---
# 0347 · Offer Cursor as a reviewer in the Settings view

**Status:** 📋 ready

## Problem
Since 0332, `reviewer: cursor` needs no command, but the panel's Settings view doesn't offer it as a reviewer, and with a Cursor reviewer its `reviewer_model` is a box to type in, where the builder's model is a list of Cursor's models. Someone setting speck up in Cursor, with its many models, has to know each model's exact name.

## Outcome
The Settings view offers Cursor as a reviewer, and offers its models for `reviewer_model` in a list, as it does for a Cursor builder's `builder_model`.

## Acceptance criteria
1. The Settings view offers `cursor` among the reviewer choices when Cursor is installed and signed in, as `speck agents` reports it.
2. With `reviewer: cursor` saved, `reviewer_model` is a list of the models Cursor lists, each shown by its display name, as `builder_model` is for a Cursor builder.
3. When Cursor's models can't be read, `reviewer_model` is a box to type in, with why in one line, as for the builder.
4. Choosing `cursor` in the view while another reviewer is saved says to save it, then open Settings again to pick from its models, as it does for Codex.
5. No test that passed before this change fails.

## Out of scope
- `reviewer_effort` for Cursor, whose model names carry the effort.
- The Foreman's model (0348).

## Notes
- From the user (2026-10-20): the Cursor reviewer's and the Foreman's model should be lists like the builder's.
- `reviewerModels` in `scripts/settings.mjs` lists models only for `claude`, `claude-subagent` and `codex`; `builderModels` reads Cursor's with `agentModelsAsync('cursor')`. The view's lists are `reviewerModelList` and `builderModelList` in `templates/panel.html`. The reviewer choices come from `REVIEWER_AGENTS` (builder's note on 0332).
- Relies on nothing outside this repo: Cursor's models are read the way the builder's already are.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
