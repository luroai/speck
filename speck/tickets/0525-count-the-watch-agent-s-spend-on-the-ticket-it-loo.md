---
id: "0525"
title: "Count the watch agent's spend on the ticket it looked into"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0530"]                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T12:26:19.201Z"

---
# 0525 · Count the watch agent's spend on the ticket it looked into

**Status:** 🔨 building

## Problem
When a build stops for a reason speck has no steps for, `speck run` starts the watch agent to look into it. What that agent spends isn't recorded anywhere, and its log (`run.watch.log`) is replaced on its next run.

## Outcome
Each watch agent run's tokens and cost are added to the ticket it looked into.

## Acceptance criteria
1. When a watch agent run that looked into a ticket ends with a final line reporting usage, its spend is kept for that ticket before the next run replaces its log. It's read as a build's is (0530): its model or models, tokens and cost, with the time the run ended.
2. `speck status --json` gives each ticket's `watch_tokens` and `watch_cost_usd`, the sums over every watch agent run for it, or null for a ticket it never looked into.
3. A watch agent run on Codex or Cursor is priced from the price table (0524), as their builds are, and one on a model with no rates keeps its tokens with an unknown cost.
4. A run that ends without such a line, such as one that was killed, adds nothing, and no other ticket's figures change.
5. No test that passed before this change fails.

## Out of scope
- Watch agent runs from before this change: 0528 recovers them.
- A build that a reply to the watch agent's question resumes (`scripts/foreman-answer.mjs`): it resumes the build's own session, so its builder spend already counts it.
- Showing it in the panel: 0526.

## Notes
- The agent is started by `spawnAgent` in `scripts/foreman-agent.mjs`, which opens `run.watch.log` with `'w'`, and its state is in `run.foreman-agent.json`.
- Checked 2026-10-27: the current `speck/.cache/runs/run.foreman-agent.log` starts with Claude Code's `system`/`init` line and has one `result` line, so `builderSpend` reads it as it reads a build log.
- Failing before this build: none
- Self-check: no changes (checked old running records with no command, killed and empty logs, a run recorded twice across speck runs, odd ids and malformed lines; kept speck.mjs within its 600-line limit)
- Pictures: none, because nothing anyone sees changes (the panel is 0526).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
