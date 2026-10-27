---
id: "0525"
title: "Count the watch agent's spend on the ticket it looked into"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** 🔍 reviewing

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
When speck's own agent looks into a ticket whose work stopped, what that look cost, in tokens and money, is now kept against that ticket instead of being lost when the agent next runs. You can see it in `speck status --json` as each ticket's watch tokens and watch cost; the panel doesn't show it yet (that's ticket 0526). Runs on Codex or Cursor are priced from the price table, and one on a model with no known price keeps its tokens with the cost left unknown. A run that was stopped before it finished adds nothing.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none sent to the inbox. Showing it in the panel is 0526, and recovering earlier runs is 0528.
- Known limit: a run's end time is its log's last write, which for a run that went quiet before ending is a little earlier than it actually ended.

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
    "reviewed_sha": "2831dd849b4c12b3e749a5e7941f0e3178d38ba8",
    "session": "fresh",
    "thread_id": "01a17d57-1e39-7b02-905c-4c949912d82a",
    "builder_response": "- Tests run: `speck test --related test/watch-spend-0525.test.mjs` (the ticket's own test file plus the 182 related test files it chose, and the commands.checks files): 1881 passed, 0 failed, 3 skipped.\n- Design: when speck run sees a watch agent run has ended (`finish` in scripts/foreman-agent.mjs), before it can launch the next run (which reopens `run.watch.log` with 'w'), it reads the log with `builderSpend`, with the command the run started with (now kept in the agent state's `running.command`, without the brief), and appends {id, run token, ended (the log's mtime), tokens, cost_usd, models} to `speck/.cache/runs/run.watch-spend.jsonl`. A run already recorded (same token) is not recorded twice. `watchSpent` sums a ticket's runs for `statusData`'s `watch_tokens` / `watch_cost_usd`.\n- speck.mjs is at its 600-line limit (check 0078), so the new status fields share a line with `ship:`.\n",
    "seconds": 27,
    "usage": {
      "input_tokens": 114799,
      "cached_input_tokens": 69760,
      "cache_write_input_tokens": 0,
      "output_tokens": 615,
      "reasoning_output_tokens": 60
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 45039,
      "cached": 69760,
      "write": 0,
      "output": 615
    },
    "cost_usd": 0.103204,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-27T12:30:50.667Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "foremanAgentQueue.finish records spend before launch can replace the log. recordWatchSpend uses builderSpend and saves models, tokens, cost and log modification time. Both AC1 tests passed, covering persistence, replacement and duplicate prevention."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "statusData exposes watchSpent totals as watch_tokens and watch_cost_usd. The AC2 status test passed for multiple runs, unaffected tickets and absent records."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The saved command reaches builderSpend's existing price-table logic. AC3 tests passed for priced Codex usage and unknown-cost Cursor usage; spend-0530.test.mjs also exercises priced Cursor usage through this shared parser."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "recordWatchSpend adds nothing when builderSpend finds no final usage event. The AC4 test passed for an interrupted run and missing log, while checking another ticket's totals remain unchanged."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported validation completed with 1881 passed, zero failed and three skipped. The changes are confined to watch spend recording, status fields, documentation and relevant tests; no regression is apparent from review."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change keeps each completed watch agent run's tokens and cost against the ticket it investigated before its log is replaced. Status reports the accumulated totals, unknown prices remain unknown, and interrupted runs add nothing. The tests exercise the recording path and ticket isolation. No blocking issues found."
  }
}
```

</details>
