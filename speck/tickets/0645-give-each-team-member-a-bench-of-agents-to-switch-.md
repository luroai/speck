---
id: "0645"
title: "Give each team member a bench of agents to switch to"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
approved: "2026-11-11T14:36:49.716Z"

---
# 0645 · Give each team member a bench of agents to switch to

**Status:** 👍 approved

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
You can now give the builder, the reviewer and the watch agent each a bench: the agents, in order, to switch to while its own agent has hit its usage limit. Left blank, a bench is your own agents in the usual order, without the member's own agent and without any pay-per-use API provider. For now only the watch agent uses its bench: while its agent is limited, it looks into stopped work on the first agent on its bench that's ready and not limited itself. The builder's and reviewer's benches are kept for when those can switch too.

To see it, run `speck config show`: each bench appears with what it does. Set one with, for example, `speck config set watch_bench "cursor, codex"`.

Worth knowing: speck refuses a bench naming an agent it doesn't know or the member's own agent, and it also refuses switching a member onto an agent already on its bench (for example, a Codex builder while the watch agent's bench names Codex, as the watch agent follows a Codex builder). If a bench is edited by hand into that state, speck commands stop with a message saying how to fix it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Bench names are not checked when settings are read, contrary to AC1.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 397,152
- Elapsed since build started: 19 min
- Changed lines: 144 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - The 0264 AC3 ship queue test failed once by chance under the 200-file related run: saved as `speck/ideas/2026-11-11-steady-the-0264-ac3-ship-queue-test.md`.
  - docs/brief.md's list of your own settings under `speck config set` doesn't name the three benches (nor 0402's builder_effort). A docs tidy-up, not saved to the inbox.
  - A bench naming a provider you added yourself becomes refused, and stops every speck command, if that provider's entry is deleted by hand from this machine's providers file. speck has no command that removes a provider, so this is a known limit only.

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

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "b26f07be895d922bcab5d63fe6840c59454480f1",
    "session": "continued",
    "thread_id": "01a1cafe-24c1-7b60-9034-b31f841a7156",
    "builder_response": "- Tests run: `speck test --files test/ship-0264.test.mjs test/bench-0645.test.mjs test/watch-fallback-0637.test.mjs test/config-0386.test.mjs` (with the `commands.checks` files): this round's output. Before it I ran `speck test --related` on the same files (200 files, as core.mjs changed): 2062 passed, 1 failed, `0264 AC3` in test/ship-0264.test.mjs (\"Cannot read properties of undefined (reading 'done')\", a launch that hadn't happened yet). It passes alone twice and in this round's run, and touches no bench or setting, so I take it as a timing flake under load.\n- F1: fixed. `loadConfig` now checks every bench as speck uses it (scripts/core.mjs → `checkBenches` in scripts/bench.mjs): an agent speck doesn't know, or the member's own agent as it is now (builder, reviewer, or the watch agent worked out as `foremanAgentOf` does), is refused with a SpeckError saying how to fix it. Only `loadConfig(repo, { benches: false })` skips it, used where `speck config set` and the panel read the settings they're changing, so a bench that's already refused can still be fixed.\n  - So that a member switched after its bench was saved can't leave every command refusing, `speck config set` (for this machine and `--repo`, including `builder`, which also moves the watch agent when watch_agent is blank) and the panel's Save now refuse a change that would leave a bench naming its member's own agent (`refuseBenches` in scripts/config.mjs, `newBenchProblem` in panelSaveSettings). They refuse only a problem the change would add, so one already there can be fixed one bench at a time.\n  - New tests in test/bench-0645.test.mjs: loadConfig and `speck status` refuse an unknown agent, the reviewer's/watch agent's/builder's own agent, including a builder changed after its bench was set; switching builder, reviewer (machine and --repo) and, in the panel, watch_agent onto a bench is refused; a hand-made refused state is fixed with `speck config set`; the watch agent's own agent matches `foremanAgentOf` for several configs.\n",
    "seconds": 33,
    "usage": {
      "input_tokens": 395164,
      "cached_input_tokens": 329472,
      "cache_write_input_tokens": 0,
      "output_tokens": 1988,
      "reasoning_output_tokens": 147
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 15566,
      "cached": 169600,
      "write": 0,
      "output": 778
    },
    "cost_usd": 0.055872,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T14:36:27.148Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "MACHINE_SETTINGS includes all three benches. config.mjs validates values before saving; core.mjs loadConfig now calls checkBenches against effective member agents and known providers. Passing AC1 integration tests cover loadConfig, speck status, conflicting member changes and correcting invalid benches."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "bench.mjs benchOf preserves agent order for blank benches while excluding the member's own agent and model providers. The passing AC2 test exercises defaults for all three members and explicit provider inclusion."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "watch-stand-in.mjs lookOn selects the first ready, unlimited agent from watch_bench. Passing AC3 tests cover ordering, unavailable agents, held agents, providers and exhaustion; existing watch fallback tests also pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "benchRows supplies each bench's value and explanation to cmdConfigShow. The passing AC4 test checks JSON and plain output, including blank defaults and machine-specific values."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Fresh round output confirms 150 passed, zero failed and three skipped. The earlier ship-0264 failure passed in this run; its test was not changed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/core.mjs",
        "issue": "Previously, settings reads accepted unknown agents and a member's own agent in benches. loadConfig now validates all effective benches, with integration coverage for the previously missing paths.",
        "suggested_fix": "Implemented through checkBenches and tests of settings reads, conflicting changes and recovery.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The validation gap is fixed. All three benches can be configured and explained, and watch stand-ins follow the chosen order while skipping unavailable or limited agents. All criteria pass, with no blocking concerns remaining."
  }
}
```

</details>
