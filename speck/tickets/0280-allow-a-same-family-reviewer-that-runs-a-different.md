---
id: "0280"
title: "Allow a same-family reviewer that runs a different model"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0279"]               # ticket ids that must be done first
created: 2026-10-17

---
# 0280 · Allow a same-family reviewer that runs a different model

**Status:** 📋 ready

## Problem
`allow_same_model_review` doesn't compare models: it compares agents. A Claude builder with a Claude reviewer counts as "the same model" whatever models they run, so an Opus builder can't be reviewed by Fable without turning the setting on, while its name says it's about the same model.

## Outcome
A reviewer from the builder's own family is allowed when the two run different models. The setting is needed only when they'd run the same model, or when that can't be told.

## Acceptance criteria
1. With the builder and reviewer in the same family, and `builder_model` and the ticket's reviewer model both set to different values, `speck lint`, `speck set <id> status ready` and saving `reviewer` in the panel all accept it without `allow_same_model_review`.
2. With the builder and reviewer in the same family, and both models set to the same value, or either one blank (so it's that agent's default and could be the same), the same refusal as today applies unless `allow_same_model_review` is true.
3. The refusal says which models it compared, or that one wasn't set, and what to change.
4. A builder and reviewer from different families are accepted as today, whatever their models.
5. The explanation of `allow_same_model_review` in the Settings view says that it's needed only when the builder and reviewer are in the same family and would run the same model, or when either model is left at its default.

## Out of scope
- Treating two names for one model as the same, such as an alias and the full model name it currently stands for. They count as different.

## Notes
- The check is `modelFamily` in `scripts/core.mjs`, used in `scripts/lint.mjs` and `scripts/settings.mjs`. The ticket's reviewer model falls back to `reviewer_model` in `speck/config.yml`, as `speck reviewer-settings` resolves it.
- Needs `builder_model` from 0279.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
