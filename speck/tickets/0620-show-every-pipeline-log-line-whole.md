---
id: "0620"
title: "Show every Pipeline log line whole"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-10-show-a-cut-off-pipeline-log-line-whole.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0612"]                # ticket ids that must be done first
created: 2026-11-10

---
# 0620 · Show every Pipeline log line whole

**Status:** 📋 ready

## Problem
In the Pipeline log view a long line is cut off with an ellipsis, such as "speck run will try it again once main or its br…", and there's no way to read the rest from the panel. The cut-off part is often the bit that matters, such as why a ship failed.

## Outcome
Every line in the Pipeline log view shows in full.

## Acceptance criteria
1. A long line in the Pipeline log view wraps onto as many lines as it needs, under its own text, rather than being cut off.
2. Lines still read one to a row, with the time and speck's face where they are today.
3. The bar's one-line summary of the latest line may still be cut short.
4. Tests that checked the old behaviour are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- A ticket's build log (0602).

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- Decided: long lines wrap, now that the log is a full view with room for them, rather than opening when pressed.
- Today lines are shortened by `runCut` in `templates/panel-model.js`, to `RUN_LOG_WIDTH` characters. Waits for 0612, which changes `templates/panel-popups.js` and its styles.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
