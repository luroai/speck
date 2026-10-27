---
id: "0533"
title: "Prove a Claude Code build's spend counts its sub-agents"                # one outcome, no "and"
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
after: ["0532"]                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T18:40:15.395Z"

---
# 0533 · Prove a Claude Code build's spend counts its sub-agents

**Status:** 🔨 building

## Problem
Research tickets will have the Claude Code builder fan out to sub-agents with the Agent tool. speck records a Claude build's spend from the last `result` line of its log, which should cover the sub-agents too, but nobody has checked. If it doesn't, those tickets' costs are understated without anyone knowing.

## Outcome
A Claude Code build's recorded spend is known to include its sub-agents, backed by a test on a real build's log and transcripts.

## Acceptance criteria
1. The test fixtures include the log of a real `claude -p --output-format stream-json` build that started at least two sub-agents with the Agent tool, with its session transcript and its `subagents/*.jsonl` transcripts.
2. For that fixture, the tokens the build records are at least the session's tokens as `sessionSpend` in `scripts/backfill.mjs` counts them, sub-agents included. They exceed that count by less than the smallest sub-agent's own tokens, so a recorded spend that left out any sub-agent fails.
3. If the log's `result` line doesn't cover the sub-agents, the build's recorded spend adds them, so criterion 2 holds.
4. `docs/brief.md`, where it says how `speck run` records a Claude Code build's tokens, says they include the sub-agents the build started. No test that passed before this change fails.

## Out of scope
- Codex builds' sub-agents (0532).
- A Codex run started by a Claude build (0534).

## Notes
- Take the fixture from a small, cheap real run (for example sub-agents on `haiku` writing a paragraph each) and strip anything private from it. The test reads the fixture and runs no real agent.
- Build 0520's log has sub-agent events (`"subagent_type":"fork"`) and one model in its `result` line's `modelUsage`. Its streamed per-message usage can't be summed to check the total, which is why this ticket compares against the transcripts.
- Unverified: that Claude Code's `result` line totals sub-agent usage. It's expected from how Claude Code reports a session's cost, but not checked (that check is this ticket).
- after 0532: both may change `builderSpend` in `scripts/spend.mjs` and the same sentence of the brief.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
