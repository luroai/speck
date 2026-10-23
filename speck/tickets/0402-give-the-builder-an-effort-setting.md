---
id: "0402"
title: "Give the builder an effort setting"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-give-the-builder-an-effort-setting.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0401"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T11:39:09.124Z"

---
# 0402 · Give the builder an effort setting

**Status:** 🔨 building

## Problem
Settings offers how hard the reviewer and the Foreman think. The builder has no effort control, so a Claude Code or Codex build can't be set to high, max or another effort from the panel.

## Outcome
The builder has an effort setting, offered and passed the same way as the reviewer's and the Foreman's.

## Acceptance criteria
1. In Settings, when the builder is Claude Code or Codex, an effort list sits beside the builder's model list, offering the same efforts that agent takes (including ones Codex lists for its model, such as `ultra`). Cursor and a model provider get no effort list, as today for the reviewer.
2. Saving stores `builder_effort` for this machine, as 0387 stores the other role settings. Blank means the builder's own default.
3. A Claude Code build speck run starts or resumes is given that effort as `--effort` when `builder_effort` is set. A Codex build speck run starts with its own command is given it as Codex takes effort today for the Foreman. A Cursor or provider build is not given it.
4. Changing the builder's model redraws the effort list for that model, as changing the reviewer does for `reviewer_effort`. No test that passed before this change fails, except a check that the builder has no effort, which is changed to check criterion 1.

## Out of scope
- Putting effort into the model name for Cursor, which already carries it.
- Naming the default model in the role lists: 0403.

## Notes
- Asked for 2026-10-23 from the builder row ("Opus High/Max/Ultra"). Reviewer and Foreman already show effort for agents that take one (0400); the builder row deliberately has none (`builder_effort` is absent from `EDITABLE` in `scripts/settings.mjs`).
- Checked 2026-10-23: Claude Code's reviewer path uses `--effort {effort}` (`scripts/reviewers.mjs`). Codex Foreman uses `-c model_reasoning_effort=…` (`scripts/foreman-agent.mjs`). Claude Code builds get `--model` from `withBuilderModel` in `scripts/build-model.mjs` and no effort today.
- Waits for 0401: both change Settings in `templates/panel.html` and `scripts/settings.mjs`.
- Failing before this build: none
- Self-check: the brief and README gained a fact about builder_effort, so a test now checks them. Kept as for the reviewer: an effort saved for one builder that the next doesn't offer (Codex's ultra, then Claude Code) stays saved, shown as "(not offered)", and is still passed.
- Existing tests changed: 0400's "the builder has no effort" check now checks criterion 1, and 0257, 0258 and 0386's pinned lists of settings now include builder_effort.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
