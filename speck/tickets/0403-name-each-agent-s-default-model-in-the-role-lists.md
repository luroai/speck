---
id: "0403"
title: "Name each agent's default model in the role lists"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-name-each-agent-s-default-model-in-the-role-lists.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0402"]                # ticket ids that must be done first
created: 2026-10-23

---
# 0403 · Name each agent's default model in the role lists

**Status:** 📋 ready

## Problem
Each role's model list has an entry such as "Claude Code · default". That word means nothing next to real names like Opus and Sonnet, so you can't tell which model a blank setting will run, or which one to pick to get the default back.

## Outcome
Each role's list shows every model by name, with "(default)" on the agent's default, and that entry selected when none is set.

## Acceptance criteria
1. Builder, Reviewer and Foreman lists show each of the agent's models by name (for example "Claude Code · Opus"). There is no separate entry labelled only "default", such as "Claude Code · default".
2. The agent's default model is labelled with " (default)" after its name, for example "Claude Code · Opus (default)". When that role's model setting is blank, that entry is selected. Choosing it, or leaving it selected, leaves the model blank on save, so it still means the agent's own default. Choosing another model, then choosing the "(default)" entry again, sets the default back the same way.
3. The default model is the one the agent marks as default when it lists models (Cursor's `(default)`), the provider's default model for a model provider, and for Claude Code the newest Sonnet (`sonnet`). When the agent lists no models, only that named default is offered, still with " (default)" on it.
4. No test that passed before this change fails, except a check that a blank model is labelled "default" with no model name, which is changed to check criteria 1 and 2.

## Out of scope
- The builder's effort setting: 0402.
- Making a long list easier to search: the inbox note from 0400.

## Notes
- Asked for 2026-10-23 from the builder list showing "Claude Code · default", then clarified: show the real models, and mark the default one, e.g. "Claude Code · Opus (default)", so you can see which to pick to restore the default.
- Assumption: Claude Code's own default, when no `--model` is passed, is Sonnet. Cursor marks `(default)` in `agent models`; providers have `defaultModel` in `scripts/providers.mjs`.
- Checked 2026-10-23: `roleEntries` in `templates/panel.html` pushes `${a.name} · default` for `${a.id}|` (blank model). `parseCursorModels` in `scripts/agents.mjs` strips `(default)` and does not keep which model it was.
- Waits for 0402: both change the role lists in `templates/panel.html`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
