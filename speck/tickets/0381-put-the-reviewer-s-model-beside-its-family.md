---
id: "0381"
title: "Put each agent's model beside its family"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-put-the-reviewer-s-model-beside-its-family.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0368","0369","0370","0371","0372","0373","0374"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T22:31:49.142Z"

---
# 0381 · Put each agent's model beside its family

**Status:** 🔨 building

## Problem
Settings shows each agent and its model as two rows: the builder, the reviewer and the Foreman. The model looks like a separate setting, so it is hard to see that the second list is the model for the family in the first.

## Outcome
The builder, the reviewer and the Foreman each have their agent and the model it runs on as two dropdowns on one Settings row.

## Acceptance criteria
1. In Settings, each of these pairs sits on one row: `builder` with `builder_model`, `reviewer` with `reviewer_model`, and `foreman` with `foreman_model`. The first dropdown offers the agents that setting offers today. The second offers that agent's models.
2. Choosing an agent in a row's first dropdown fills that row's model dropdown before you save, as 0369 does for the builder, the reviewer and the Foreman. The reviewer's first dropdown still offers `codex`, `claude`, `claude-subagent`, `cursor`, and a reviewer command already set up. The Foreman's first dropdown still offers a blank value.
3. Saving still writes each pair as two settings in `speck/config.yml`. A value that isn't offered stays marked and can't be picked again. The loading line, and a type-in box with why when the models can't be listed, still show for the model dropdown. The builder's note about who builds tickets from now on still shows.
4. `reviewer_effort` and `foreman_effort` stay on their own rows. Changing either dropdown on a row leaves the rest of Settings where it was, as 0370 does.
5. No test that passed before this change fails, except a check that one of these pairs is two setting rows, which is changed to check criterion 1.

## Out of scope
- Putting an effort on the same row as its agent.
- What the review sentence on a ticket says: 0382.

## Notes
- Asked for 2026-10-22 for the reviewer, then for the builder and the Foreman the same way.
- The reviewer's first dropdown keeps `claude-subagent` and a command from `reviewer_options`. The builder's offers `claude`, `codex` and `cursor`. The Foreman's offers blank plus `claude`, `codex` and `cursor`. Blank still means the Foreman follows the builder, as today.
- Checked 2026-10-22: `renderSettings` in `templates/panel.html` draws one `.setting` row per key, so each agent and its model are separate rows (`scripts/settings.mjs`). Once 0369 has shipped, choosing the agent fills that agent's model list before saving.
- Waits for 0368 to 0374. They change `templates/panel.html`, and 0369 also changes `scripts/settings.mjs`. 0375 waits for this, so it ships in 0.13.0.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
