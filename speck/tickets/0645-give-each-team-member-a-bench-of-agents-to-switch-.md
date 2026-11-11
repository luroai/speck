---
id: "0645"
title: "Give each team member a bench of agents to switch to"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T14:17:41.472Z"

---
# 0645 · Give each team member a bench of agents to switch to

**Status:** 🔍 reviewing

## Problem
When an agent is limited, speck can only wait or, for the watch agent, take your agents in a fixed order (0637). You can't say who should take over for each job, such as Codex for the builder but Cursor for the reviewer.

## Outcome
Each team member has a bench: the agents, in order, that speck switches it to while its own agent is limited.

## Acceptance criteria
1. `builder_bench`, `reviewer_bench` and `watch_bench` are settings of your own, each a list of agents in order (`claude`, `codex`, `cursor` or a model provider's name), set with `speck config set` and checked as speck reads them: an agent speck doesn't know, or the member's own agent, is refused.
2. A bench left blank is your agents in the order `speck agents` lists them, leaving out the member's own agent and any model provider on an API key, as those bill per token.
3. 0637's watch agent takes its stand-in from `watch_bench` in order, skipping agents not ready or held by a limit.
4. `speck config show` shows each bench with what it does, and that blank means your agents in order.
5. No test that passed before this change fails.

## Out of scope
- Switching the builder or reviewer: 0647 to 0649. Editing benches in the panel: 0652.

## Notes
- From `speck/ideas/2026-11-10-set-up-your-team-instead-of-settings.md` (a bench order per member) and stage 2 of `speck/ideas/2026-11-10-keep-speck-working-when-an-agent-hits-its-usage-limit.md`.
- 0637's stand-in is `scripts/watch-stand-in.mjs`. Settings of your own are listed in `scripts/machine.mjs`.
- Failing before this build: none
- AC2 changes 0637's behaviour: a blank watch_bench leaves model providers out, so 0637's test of a provider standing in now puts it on watch_bench. 0386's test of the exact list of your own settings now lists the three benches, as 0402 did for builder_effort.
- Self-check: moved config show's bench rows into scripts/bench.mjs to keep settings.mjs within 600 lines; tested `__proto__`/`constructor` as agent names and a bench that isn't a list in this machine's file.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "5a0a27c5f80e38ead25564fa97581fafb16c3796",
    "session": "fresh",
    "thread_id": "01a1cafe-24c1-7b60-9034-b31f841a7156",
    "builder_response": "- Tests run: `speck test --related test/bench-0645.test.mjs test/watch-fallback-0637.test.mjs test/config-0386.test.mjs` (55 test files, listed at the top of the output), plus the `commands.checks` files.\n- Two existing tests changed, both because the ticket changes what they pinned:\n  - test/watch-fallback-0637.test.mjs: AC2 says a blank bench leaves model providers out, so 0637's \"a model provider of yours stands in\" test now puts deepseek on watch_bench. Its assertions are unchanged.\n  - test/config-0386.test.mjs: its exact list of your own settings now includes the three benches (as 0402 did for builder_effort), with values that aren't the member's own agent.\n- Switching the builder or reviewer is out of scope (0647 to 0649), so builder_bench and reviewer_bench are set, checked and shown here but not yet used. Their explanations say what they're for rather than claiming speck switches them now.\n- \"Checked as speck reads them\": the shape (a list or blank) is checked when this machine's file is read (loadConfig). Which agents it names is checked when a bench is used (benchOf), because the member's own agent can change after the bench is set. The watch stand-in says a refused watch_bench once and waits rather than running on it.\n",
    "seconds": 53,
    "usage": {
      "input_tokens": 209998,
      "cached_input_tokens": 159872,
      "cache_write_input_tokens": 0,
      "output_tokens": 1210,
      "reasoning_output_tokens": 98
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 50126,
      "cached": 159872,
      "write": 0,
      "output": 1210
    },
    "cost_usd": 0.1283392,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T14:24:28.326Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "Setting benches is covered by bench-0645 tests, but loadConfig accepts unknown agents and a member's own agent. machineProblem checks only shape; benchOf validates names but is called only by the watch stand-in."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/bench.mjs benchOf preserves the supplied agent order and excludes the member's own agent and providers for blank benches. Covered by '0645 AC2'."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/watch-stand-in.mjs lookOn selects from watch_bench in order, filtering readiness and usage limits. Covered by '0645 AC3' and the existing watch fallback tests."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "benchRows supplies all three explanatory rows to cmdConfigShow. '0645 AC4' exercises JSON and plain output."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported related-test run passed 624 tests with zero failures and three skipped tests. Existing test changes match the ticket's explicitly changed behaviour."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/machine.mjs",
        "issue": "Bench names are not checked when settings are read, contrary to AC1. A read-only reproduction supplying machine-file contents to loadConfig accepted builder_bench: [gemini] and reviewer_bench: [codex] with reviewer: codex. Builder and reviewer benches never reach benchOf in production, and watch validation happens only once its own agent is limited. The test labelled 'checked as speck reads it' tests the helper directly for names, so it misses this integration gap.",
        "suggested_fix": "Validate all effective benches against known providers and each member's current agent when settings are read. Add loadConfig integration tests for unknown names and self-reference, including a member changed after its bench was saved.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Bench ordering, watch stand-ins and configuration explanations work in the tested paths. However, invalid benches can still be read without being refused. Complete that validation before merge."
  }
}
```

</details>
