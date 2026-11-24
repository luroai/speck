---
id: "0714"
title: "Say QA checked it even with QA's settings blank"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "quick"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-11-say-qa-checked-it-even-with-qa-s-settings-blank.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T13:51:24.136Z"

---
# 0714 · Say QA checked it even with QA's settings blank

**Status:** 🔨 building

## Problem
A check in the running app is described as QA's only once one of QA's settings is set; with all four blank it still reads as the engineering manager's. Now that Settings shows QA as a member of its own, that hides who checked what.

## Outcome
A check in the running app always says QA did it.

## Acceptance criteria
1. With `qa_agent`, `qa_model`, `qa_effort` and `qa_bench` all blank, a check in the running app is described as QA's in the ticket's Notes, speck run's log and the Pipeline log, in the same words as when a QA setting is set.
2. The agent, model and effort the check runs on are unchanged: with QA's settings blank, it still runs on the watch agent's.
3. No test that passed before this change fails, except tests that pin the old wording for blank QA settings (from 0636), which are changed to the new wording.

## Out of scope
- Changing which agent runs QA.

## Notes
- The gate is `qa = !!check && qaOn(c)` in `scripts/foreman-agent.mjs`. Parsers already accept both wordings (`scripts/foreman-took.mjs`, `templates/panel-model.js`). Tests pinning the old wording: `test/app-check-0636.test.mjs`, possibly `test/qa-0651.test.mjs` and `test/app-check-0679.test.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
