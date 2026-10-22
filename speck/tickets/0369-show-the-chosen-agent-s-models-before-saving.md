---
id: "0369"
title: "Show the chosen agent's models before saving"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: cursor
reviewer_model: grok-4.7-high       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-calm-the-settings-view-down.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0368"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T20:55:11.777Z"

---
# 0369 · Show the chosen agent's models before saving

**Status:** 🔨 building

## Problem
Picking Cursor as the builder or the reviewer leaves the model list as it was. The reviewer's model becomes a box that says to save Cursor and open Settings again, and the builder's model keeps showing the saved builder's models. You can't pick a Cursor model, such as a Grok model, until you've saved and reopened.

## Outcome
Choosing a builder, reviewer or Foreman agent that can list its models fills that agent's model list straight away, before you save.

## Acceptance criteria
1. Choosing `cursor`, `codex` or `claude` as the builder, while another builder is saved, makes `builder_model` a list of that agent's models, each shown as it is when that builder is already saved. Nothing is saved, and Settings stays open.
2. Choosing `cursor` or `codex` as the reviewer, while another reviewer is saved, does the same for `reviewer_model`. The line that says to save it and open Settings again no longer shows. Choosing `claude` or `claude-subagent` still offers Claude's model names, as today.
3. Choosing another Foreman agent does the same for `foreman_model`, and no longer says to save it and open Settings again.
4. While that list is being read, the model setting says so in one line. When the list can't be read, the setting is a box to type in, with why in one line, as when the saved agent's models can't be read today. A value already chosen that the new list doesn't offer still shows, marked as not offered, and stays until you change it.
5. No test that passed before this change fails, except checks that choosing another reviewer or Foreman agent says to save and open Settings again, which are changed to check criteria 2 and 3.

## Out of scope
- Opening Settings as a full-panel pop-up: 0368.
- Keeping the rest of the view still while the list appears: 0370. This ticket may redraw the view, as changing the reviewer does today.
- Passing the chosen model to a build or a review. Saving still writes the settings as today.

## Notes
- Checked 2026-10-22: `reviewerModels` and `builderModels` in `scripts/settings.mjs` read models only for the reviewer and builder saved in `speck/config.yml`. `modelsWhy` in `templates/panel.html` shows "Save cursor as the reviewer, then open Settings again to pick from its models." when the chosen reviewer isn't the one those models were read for (0347, criterion 4). `foremanModelsWhy` says the same for the Foreman (0348, criterion 4). `builderModelList` keeps showing the saved builder's models when another builder is chosen. Cursor's models come from `agent models`, as `speck agents` reports (`docs/brief.md`).
- The Foreman is included: it has the same save-and-reopen line, on the same view.
- 0370 and 0371 wait for this: they change `templates/panel.html` too. This one also changes `scripts/settings.mjs`.
- Failing before this build: none
- Self-check: the new models request now always answers, with why in one line, when reading an agent's models fails (it could have hung), with a test.
- `scripts/panel.mjs` was at the 600-line limit, so the GET /api/settings model reading moved, unchanged, into `settingsAnswer` in `scripts/settings.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
