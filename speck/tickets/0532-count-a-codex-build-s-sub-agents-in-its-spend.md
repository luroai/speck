---
id: "0532"
title: "Count a Codex build's sub-agents in its spend"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
approved: "2026-10-27T18:35:38.500Z"

---
# 0532 · Count a Codex build's sub-agents in its spend

**Status:** 👍 approved

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
When a build runs on Codex and hands parts of its work to helper agents, the tokens and cost speck records for it now include those helpers, and any helpers they started in turn. Each helper is priced at the model it actually ran on. Before, only the main agent's share was counted, so such builds looked cheaper than they were.

To see it, let a Codex build that uses helper agents finish under `speck run`, then compare its tokens in the panel or `speck spend` with what Codex reports for the whole session. If a helper ran on a model speck has no price for, the build's cost shows as unknown rather than a too-low figure. speck's own watching agent, when it runs on Codex, is counted the same way.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 140,036
- Elapsed since build started: 5 min
- Changed lines: 122 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (Delivery log only, no inbox notes):
  - Known limit: finding a build's sub-agents reads the first line of every rollout file in the Codex sessions folder, once when the build ends. It grows with Codex history; limiting it to day folders from the build's start onwards would keep it small.
  - Watch agent runs on Codex are read the same way, so their recorded spend now includes their sub-agents too.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "c1b16503daa8a9647f31514348b08e731bb946d9",
    "session": "fresh",
    "thread_id": "01a17ea4-e90d-7553-9dde-0b86e0034978",
    "builder_response": "- Tests run: `speck test --related test/spend-0532.test.mjs test/docs-0267.test.mjs` (the ticket's own tests, docs-0267 which failed on an earlier version of the AC5 test, and every test file naming a changed file): 1006 pass, 0 fail.\n- Notes: the sub-agent walk is in `codexSubagents` (scripts/round-cost.mjs), which reads only each rollout file's first line (its session_meta) to find parents, then whole files only for the build's own sub-agents. `builderSpend` (scripts/spend.mjs) returns exactly what it did before when there are none. Watch agent runs on Codex go through the same `builderSpend`, so theirs now include sub-agents too.\n",
    "seconds": 31,
    "usage": {
      "input_tokens": 139171,
      "cached_input_tokens": 87552,
      "cache_write_input_tokens": 0,
      "output_tokens": 865,
      "reasoning_output_tokens": 260
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 51619,
      "cached": 87552,
      "write": 0,
      "output": 865
    },
    "cost_usd": 0.1206432,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-27T18:35:29.571Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/round-cost.mjs codexSubagents traverses parent links recursively and deduplicates session IDs. builderSpend adds each session's last total_token_usage. Three passing AC1 tests cover totals, nested descendants, duplicates, cycles and session fallback."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "builderSpend prices descendants using their recorded models and merges matching models. Passing AC2 tests verify token splits, costs and total_cost_unknown naming builder when rates are missing."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "builderSpend returns its original parent-only result when codexSubagents returns none. The passing AC3 test checks unrelated sessions and a missing sessions folder."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "codexSubagents catches metadata parsing and file-reading failures, and excludes unusable usage. The passing AC4 test covers malformed metadata, junk files and invalid or absent usage while retaining valid spend."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "docs/brief.md's speck run entry explicitly includes sub-agents and their descendants. The AC5 test checks the documented sessions path. Reported related tests passed: 1006 passes, no failures."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change includes a Codex build's sub-agents and deeper descendants in its recorded tokens and cost, using each session's model. Missing rates correctly leave the cost unknown. The tests cover the main behaviours and reported no regressions. No blocking concerns found."
  }
}
```

</details>
