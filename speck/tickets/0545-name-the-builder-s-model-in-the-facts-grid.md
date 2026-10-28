---
id: "0545"
title: "Name the builder's model in the facts grid"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-24-name-the-builder-s-model-in-the-facts-grid.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-28T09:43:19.731Z"

---
# 0545 · Name the builder's model in the facts grid

**Status:** 🔨 building

## Problem
An open Build ticket's facts grid names the reviewer by its model while it reviews (such as `gpt-6.1-sol`), but the builder only by its agent's name (such as Claude). Someone watching a build can see which model reviews but not which one builds without looking it up in Settings.

## Outcome
The facts grid's Builder cell names the model the build runs on when speck knows it.

## Acceptance criteria
1. When a ticket's builds run on a known model, its Builder cell shows the agent's name and that model, such as `Claude · opus` or `Codex · gpt-6.1-sol`. The model is `builder_model` from the settings, or, for a model provider you added in Settings, the model speck uses from it.
2. When no model is known (`builder_model` is blank, so the agent uses its own default), the Builder cell shows only the agent's name, as today.
3. `speck status --json` gives each ticket's builder model as `builder_model`, or null when none is known, and the panel reads it from there.
4. The Reviewer cell, and the cell while a round is running, are unchanged. A long model name fits the cell on a phone-width panel without breaking its layout (checked by review).
5. No test that passed before this change fails.

## Out of scope
- The models a finished build actually ran on (`builder_models`, from its spend record).
- Showing the model anywhere else, such as a closed card or the Shipped lane.

## Notes
- From 0462's build: the board gives a ticket's builder and builder_label but no builder model.
- Decided 2026-10-27: with no model set, show only the agent's name.
- Today: the cell is `workerOf` in `templates/panel-model.js`; the board's builder fields are set in `scripts/speck.mjs` (`builder`, `builder_label`); `builder_model` is read by `modelOf` in `scripts/build-model.mjs`; providers you add are in `scripts/custom-providers.mjs` (first model is the default).
- Failing before this build: none
- Self-check: added cases for a ticket built by another builder than the settings' (no builder_model), a build_command of your own (Codex, Cursor and providers get no model), a builder name that's no agent (`constructor`) and a builder_model of only spaces. Moved the board's builder fields into `boardBuilders` in build-model.mjs, as speck.mjs is at its 600-line limit, and dropped `providerLabelHere`, which nothing used after that.
- Not from this build: `0384 AC3: the panel shows the round as running through every exit 12` in test/review-wait-0384.test.mjs fails on main too, most runs on this machine today (timing).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
