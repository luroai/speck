---
id: "0533"
title: "Prove a Claude Code build's spend counts its sub-agents"                # one outcome, no "and"
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
after: ["0532"]                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T18:40:15.395Z"
approved: "2026-10-27T18:43:07.845Z"

---
# 0533 · Prove a Claude Code build's spend counts its sub-agents

**Status:** 👍 approved

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
- Checked 2026-10-27: Claude Code's `result` line totals sub-agent usage. A `claude -p --output-format stream-json` run on `haiku` that started two `general-purpose` sub-agents recorded 82,874 tokens from its `result` line's `modelUsage`, exactly what `sessionSpend` counts over its transcript and both `subagents/*.jsonl` (about 16,500 tokens each); its `usage` alone covered only the last turn. The `result` line also has `subagent_stats` with `spawned: 2`.
- after 0532: both may change `builderSpend` in `scripts/spend.mjs` and the same sentence of the brief.
- Failing before this build: none
- AC2 and AC3's tests passed before any code change: the `result` line's `modelUsage` already covers the sub-agents (the checked fact above), so `builderSpend` is unchanged and criterion 3 needs nothing added. The fixture keeps only the log's `user`, `assistant` and `result` lines and a trimmed `init` line, and only the transcripts' `user` and `assistant` lines, with paths rewritten; the stripped lines held system prompts, memory and request blobs, which the spend code doesn't read.
- Self-check: no changes.

## In plain words
Nothing changes in what speck records: a Claude Code build's cost already included the helpers (sub-agents) it hands work to, and now that's checked rather than assumed. A real small build that used two helpers was saved as test data, and its recorded spend matches what the build and both helpers used, to the token. The design notes now say so. Worth keeping an eye on: the check uses a saved run, so if a future Claude Code version stops counting helpers in its final summary, this test won't notice on its own.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 200,087
- Elapsed since build started: 3 min
- Changed lines: 2 (limit 5000)
Follow-ups (Delivery log only, no inbox notes):
- Known limit: the fixture is a saved run from Claude Code as of 2026-10-27. If a later Claude Code stops including sub-agents in the `result` line's `modelUsage`, the test won't catch it; a fresh real run like the one in Notes would.

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
    "reviewed_sha": "1874b4a776da086b14f12362cacf2c8ded2e1917",
    "session": "fresh",
    "thread_id": "01a17eab-d672-7da3-a594-96c8a9bbe88c",
    "builder_response": "- Tests run: `speck test --related test/spend-0533.test.mjs` (the ticket's own test file plus every existing test file that names `docs/brief.md`): 1023 passed, 0 failed.\n- The fixture in `test/fixtures/claude-subagents-0533/` comes from a real run on 2026-10-27: `claude -p '<ask two haiku general-purpose sub-agents for a paragraph each>' --model haiku --output-format stream-json --verbose` in a scratch folder. It started two sub-agents with the Agent tool. `build.log` is its stream-json log; the `.jsonl` and `<session>/subagents/*.jsonl` are its transcripts from `~/.claude/projects/`. To strip anything private, only `user`, `assistant` and `result` lines (and a trimmed `system`/`init` line in the log) are kept, and paths are rewritten; the dropped lines (`attachment`, `api-request*`, `queue-operation`, etc.) held system prompts, memory and request blobs that neither `builderSpend` nor `sessionSpend` reads. Numbers before and after stripping are identical (82,874 tokens from the `result` line; 82,874 from `sessionSpend`; sub-agents 16,594 and 16,544 on their own).\n- AC2 and AC3 already held before any code change: the `result` line's `modelUsage` covers the sub-agents (its `usage` covers only the last turn). So `builderSpend` is unchanged, and criterion 3's conditional needs nothing added. The tests guard against a regression to a parent-only count.\n- AC4: one sentence added to the `speck run` row of `docs/brief.md`; the test checks only the fact it names (`modelUsage`), not wording.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 199334,
      "cached_input_tokens": 143488,
      "cache_write_input_tokens": 0,
      "output_tokens": 753,
      "reasoning_output_tokens": 45
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 55846,
      "cached": 143488,
      "write": 0,
      "output": 753
    },
    "cost_usd": 0.1335708,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-27T18:42:58.593Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The fixture contains two Agent calls, matching session and sub-agent transcripts, and result.subagent_stats.spawned = 2. The passing AC1 tests check the log and transcripts."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Independently called builderSpend and sessionSpend on the fixture: both count 82,874 tokens. Sub-agents count 16,594 and 16,544. The passing AC2 tests enforce the required bounds and detect omitted sub-agents."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The result line's modelUsage already includes both sub-agents, so no accounting change is needed. The passing AC3 test exercises logSpend and checks totals and each model's token categories against sessionSpend."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md's speck run row explicitly says Claude Code's modelUsage includes sub-agents started with the Agent tool. Its fact test passes; the reported related test run has 1,023 passes and no failures."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The real-run fixture confirms that Claude Code already includes both sub-agents in its recorded tokens. The tests guard against dropping their usage, and the documentation explains this behaviour. No production accounting change is needed."
  }
}
```

</details>
