---
id: "0511"
title: "Turn same-model review on or off in Settings"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-26

---
# 0511 · Turn same-model review on or off in Settings

**Status:** 📝 draft

## Problem
Settings shows `allow_same_model_review` but won't change it: since 0258 it's read-only there, because turning it on weakens the independent review. To pick a reviewer running the same model as the builder, the user has to edit `speck/config.yml` or run `speck config set`, which is the only setting in the builder and reviewer group that works that way.

## Outcome
`allow_same_model_review` can be turned on or off in Settings, with a warning before turning it on.

## Acceptance criteria
1. Settings shows `allow_same_model_review` as an on/off switch with the reviewer's settings, saved by the one Save button as one of your own settings for this machine, as `speck config set --machine` saves it, like the other settings there.
2. Turning it on opens a dialog on Save saying that the reviewer may then run the same model as the builder, so a review is no longer by a different model, and nothing is saved unless the user confirms. Turning it off needs no dialog.
3. With it on, in the same Save or an earlier one, a reviewer from the builder's own family running the same model as `builder_model` saves, where today Save refuses it. With it off, Save refuses it as today.
4. The panel accepts the change only from its own page with its token, as for every other setting. `speck config set allow_same_model_review` works as today. No test that passed before this change fails.

## Out of scope
- What the setting does to a build's review, and its default (`false`).

## Notes
- Asked for by the user on 2026-10-26: "I need the setting allow same model review to be toggle-able in the settings. Currently it is not."
- Today: `EDITABLE` in `scripts/settings.mjs` leaves it out on purpose (0258: "allow_same_model_review weakens the independent review"); its explanation is in `SETTING_GROUPS` there, and Save's same-model check near `cfg.allow_same_model_review` in the same file. The dialog can follow 0259's for `auto_ship`, which asks before a change that lets more tickets ship by themselves, in `templates/panel-settings.js`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
