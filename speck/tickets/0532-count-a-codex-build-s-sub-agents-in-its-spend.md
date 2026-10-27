---
id: "0532"
title: "Count a Codex build's sub-agents in its spend"                # one outcome, no "and"
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
after: []                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T18:30:44.379Z"

---
# 0532 · Count a Codex build's sub-agents in its spend

**Status:** 🔨 building

## Problem
A Codex build that fans work out to Codex sub-agents records only its own thread's tokens, so its ticket's spend is understated. In a test on 27 October, a run with two small sub-agents recorded 75,480 tokens and left out another 30,488 (29%). A research ticket that fans out across many cases would be understated by far more.

## Outcome
A Codex build's recorded tokens and cost include every sub-agent its session started, and their sub-agents in turn, each priced at its own model.

## Acceptance criteria
1. A Codex build whose thread has sub-agent session files in `$CODEX_HOME/sessions` (or `~/.codex/sessions`), each naming the build's thread as its parent, records as its tokens the build's own `turn.completed` tokens plus each sub-agent's last `total_token_usage` (input and output tokens, counted as a Codex build's are). A sub-agent whose parent is another sub-agent of the build counts too, however deep, and each session counts once.
2. Each sub-agent is priced at the model its own session file records and appears in the build's models, summed with any thread on the same model. A sub-agent whose model has no rates leaves the build's cost unknown, so `total_cost_unknown` names `builder`, as for a build with no rates today.
3. A Codex build with no sub-agent session files, or whose sessions folder is missing, records exactly what it records today.
4. A sub-agent session file that can't be read or parsed is left out, and the build's spend is still recorded from the rest.
5. `docs/brief.md`, where it says how `speck run` records a Codex build's tokens, says they include the sub-agents the build started. No test that passed before this change fails.

## Out of scope
- Claude Code builds' sub-agents (0533).
- A Codex run started by a Claude build (0534).
- Splitting a build's spend by sub-agent in the panel.

## Notes
- `builderSpend` and `codexModel` in `scripts/spend.mjs` and `scripts/round-cost.mjs` already read a Codex build's thread id and its session file. Sub-agent spend lands in the same build record, so `speck status --json`, `speck spend` and the panel pick it up without changes of their own.
- Checked 2026-10-27: with codex-cli 0.159.0, `codex features list` shows `multi_agent` stable and on. A `codex exec --json` run that spawned two sub-agents printed one `turn.completed` whose usage (75,480 tokens) covered only the parent thread. Each sub-agent had its own `rollout-*-<thread>.jsonl` in `~/.codex/sessions/YYYY/MM/DD/`, whose `session_meta` has `source.subagent.thread_spawn.parent_thread_id` set to the parent's thread id and whose last `token_count` event has `total_token_usage` (15,271 and 15,217 tokens). Each records its own `"model"` (`gpt-6.1-sol`) (local test in the scratchpad).
- Failing before this build: none
- Self-check: no changes. Watch agent runs on Codex are read the same way, so their recorded spend includes their sub-agents too.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
