---
id: "0637"
title: "Keep speck's watch agent working when its agent hits a usage limit"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
approved: "2026-11-11T12:00:30.154Z"

---
# 0637 · Keep speck's watch agent working when its agent hits a usage limit

**Status:** 👍 approved

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
When Claude's usage limit is reached, speck's watcher no longer sits idle until it resets. It looks into stopped work on the next of your other agents that's set up and signed in, such as Codex. When the limit resets, it goes back to Claude with your chosen model and effort. Builds and reviews stay on their own agents. speck run's log and the Pipeline log say once when it moves to another agent and why, and once more when it moves back. To see it, wait for Claude's limit while `speck run` is on with watch set to fix or decide, and look for the line saying the watcher moved to another agent. Keep in mind that speck can't yet tell when Codex or Cursor hit their own limits, so a look on one of them that runs into its limit just ends without doing anything.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 224,259
- Elapsed since build started: 8 min
- Changed lines: 80 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- A look on a stand-in that runs into that agent's own usage limit isn't recognised, so it's counted as a look that took no action. Skipped: the ticket puts finding Codex's and Cursor's limits out of scope, and the source idea's later stages cover it (speck/ideas/done/2026-11-10-keep-speck-working-when-an-agent-hits-its-usage-limit.md).
- A model provider counts as ready when its key is set, even if Claude Code, which runs it, isn't installed. The look then says it couldn't start. Known limit, as with any provider set as the watch agent.

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
    "reviewed_sha": "72165cef08d074f4380e5135c3a710db22c874de",
    "session": "fresh",
    "thread_id": "01a1ca7a-1602-78b2-a195-d4562a54991f",
    "builder_response": "- Tests run: test/watch-fallback-0637.test.mjs, with `speck test --related`, which added every test file naming a changed file (listed at the top of the output).\n- Round 1. The stand-in choice lives in the new scripts/watch-stand-in.mjs, so that foreman-agent.mjs stays within 600 lines. speck run's ready-agents reader is readyAgentsEvery in your-agents.mjs. It asks the agents at most once a minute, and only while the watch agent's own agent is held. limitQueues gains holdsAgent, which counts Claude's builder limit and each reviewer's recorded limit. In run.mjs, two lines in runsDir became one, only to keep that file within the 600-line limit.\n",
    "seconds": 56,
    "usage": {
      "input_tokens": 223339,
      "cached_input_tokens": 180096,
      "cache_write_input_tokens": 0,
      "output_tokens": 920,
      "reasoning_output_tokens": 103
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 43243,
      "cached": 180096,
      "write": 0,
      "output": 920
    },
    "cost_usd": 0.1136956,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T12:00:16.554Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "watch-stand-in.mjs lookOn selects the first ready, recognised, unheld alternative and clears watch_model/watch_effort. Passing 0637 AC1 tests exercise selection, provider defaults, readiness and reviewer limit records; run.mjs connects these functions."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0637 AC2 tests cover one move announcement, return announcement, persistence across restarts and changed settings. foremanAgentQueue uses speak for run output; panel-run.mjs and run-log.mjs expose that output in the Pipeline log."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0637 AC3 tests verify that subsequent looks return to Claude with the original model and effort after reset. lookOn returns the original configuration when its agent is no longer held."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing 0637 AC4 test exercises no ready alternatives and all alternatives held, confirming that the queued look waits and starts on the original agent after reset."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Passing 0637 AC5 test verifies that a resumed build retains Claude while watch uses Codex. The fallback configuration is confined to watch launch; reviewer routing is unchanged. Related reviewer-limit and build routing tests passed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The watch agent can use another ready agent during a recorded usage limit, announce the move, and return with its original settings afterwards. Builds and reviewers retain their agents. The reported test run passed 741 tests with three skipped; inspection found no blocking issues."
  }
}
```

</details>
