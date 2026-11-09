---
id: "0567"
title: "Let the watch agent act on its own recommendation"                # one outcome, no "and"
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
after: ["0564","0566"]                # ticket ids that must be done first
created: 2026-11-08
started: "2026-11-09T00:02:07.058Z"

---
# 0567 · Let the watch agent act on its own recommendation

**Status:** 🔨 building

## Problem
When speck's watch agent looks into a stop, it usually ends by asking you a question with its recommendation, and you go with it: 10 of its 13 actions in this repo were questions. With `watch: decide`, it should act on its recommendation and tell you, rather than wait for you.

## Outcome
With `watch: decide`, the watch agent takes its own recommendation instead of asking, and asks only when it has none or the ticket is high risk.

## Acceptance criteria
1. `speck watch` has a `decide` action that takes a ticket, the option and why. It adds `- Went with the recommendation: <option> (chosen by speck, as watch is decide, <YYYY-MM-DD HH:MM> UTC).` to the ticket's Notes, resumes its build with that option as the Go with the recommendation button does, and is logged as the run's one action.
2. `speck watch decide` refuses, changing nothing, when `watch` isn't `decide` or the ticket's risk is high, saying which.
3. With `watch: decide`, the `speck-watch` skill tells the agent to use `decide` whenever it has a recommendation for a low-risk ticket, and to ask only otherwise (checked by review).
4. A `decide` doesn't count under Needs you; an unanswered `ask` still does.
5. No test that passed before this change fails.

## Out of scope
- `watch: off`, `tell` and `fix`, whose agent behaves as today.

## Notes
- Asked for 2026-11-08: the user goes with speck's recommendation almost every time, so speck should decide and tell them rather than ask ("ticket up 1": the watcher deciding). In this repo 15 of 17 recommendations taken were picked by hand in the panel, and 10 of the watch agent's 13 actions were questions.
- Today: `ACTIONS` in `scripts/foreman-agent.mjs` (about lines 39 to 44) and `foremanAction` (about lines 388 to 435); the agent's instructions are `skills/speck-watch/SKILL.md` section 2, which says "When you're unsure, ask." `goWith` in `scripts/go-with.mjs` resumes a build with a chosen option.
- Waits for 0564, which adds `decide`, and 0566, which changes `scripts/foreman-agent.mjs`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: added the size-guard refusal to the docs, and refused a size guard's block so raising the limit can never be chosen.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
