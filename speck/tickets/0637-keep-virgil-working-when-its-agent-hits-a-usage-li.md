---
id: "0637"
title: "Keep speck's watch agent working when its agent hits a usage limit"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-10-keep-speck-working-when-an-agent-hits-its-usage-limit.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0636"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T11:52:34.359Z"

---
# 0637 · Keep speck's watch agent working when its agent hits a usage limit

**Status:** 🔨 building

## Problem
When Claude's usage limit is reached, speck's watch agent runs on Claude too, so it can't look into anything until the limit resets, while Codex or Cursor sit connected and idle. On 2026-11-10 that left a stopped build untouched for about five hours.

## Outcome
While the watch agent's own agent is held by a usage limit, speck runs it on the next of your agents that's ready, and goes back once the limit resets.

## Acceptance criteria
1. When the agent the watch agent runs on is held by a recorded usage limit, `speck run` starts each look on the first other agent of yours that's installed, signed in and not held by a limit, in the order `speck agents` lists them, without `watch_model` or `watch_effort`, which are for its own agent.
2. `speck run`'s log and the Pipeline log say, once per limit, which agent it moved to and why, and once more when the limit resets and it moves back.
3. Once the limit has reset, each look runs on the watch agent's own agent, with its model and effort, as before.
4. When every agent of yours is held or none is ready, it waits for the reset as it does today (0625).
5. Builds and reviewers stay on their own agents.

## Out of scope
- Switching builders and reviewers to another agent: a later ticket from the same idea.
- Finding Codex's and Cursor's own limits: only the limits speck records today count.

## Notes
- Limit records: `scripts/usage-limit.mjs` (`holds`, 0622, Claude only today) and `scripts/reviewer-limit.mjs` (0623); the watch agent's agent: `foremanAgentOf` and `foremanArgv` in `scripts/foreman-agent.mjs`.
- Stage 1 of `speck/ideas/2026-11-10-keep-speck-working-when-an-agent-hits-its-usage-limit.md`.
- After 0636, which also changes how `speck run` starts the watch agent in `scripts/foreman-agent.mjs`.
- Failing before this build: none
- Self-check: an agent read back from speck run's record is named only from speck's own names, so a built-in name such as `constructor` reads as itself; a move is forgotten without a word once `watch_agent` changes or watch is turned off, so it never says it moved back to an agent that isn't its own.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
