---
id: "0651"
title: "Give QA its own agent"                # one outcome, no "and"
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0645"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T14:39:24.858Z"

---
# 0651 · Give QA its own agent

**Status:** 🔨 building

## Problem
Checks in the running app (0636, 0638) are done by Virgil's watch agent, on its agent and model. A check that clicks through an app suits a different model from one that decides what to do about a stop, and you can't choose it separately.

## Outcome
QA is a team member of its own: app checks run on QA's agent, model and effort, and say QA did them.

## Acceptance criteria
1. `qa_agent`, `qa_model`, `qa_effort` and `qa_bench` are settings of your own, checked as the watch settings are; `qa_agent` blank uses `watch_agent`'s agent, and `qa_model` and `qa_effort` blank use that agent's defaults.
2. A check in the running app runs on QA's agent, model and effort, and while that agent is limited, on the first agent on `qa_bench` that's ready, as 0637 does for the watch agent.
3. The check's line in the ticket's Notes, `speck run`'s log and the Pipeline log say QA checked it.
4. With the QA settings blank, app checks run as they do today.
5. No test that passed before this change fails.

## Out of scope
- QA's character and card: 0650 and 0652.

## Notes
- App checks: `scripts/app-check.mjs`; the watch agent's agent: `foremanAgentOf` in `scripts/foreman-agent.mjs` (at its 600-line limit).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
