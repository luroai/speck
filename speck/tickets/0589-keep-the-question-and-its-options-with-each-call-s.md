---
id: "0589"
title: Keep the whole question with each call speck makes                # one outcome, no "and"
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0576"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T18:30:55.350Z"
approved: "2026-11-09T18:50:31.980Z"

---
# 0589 · Keep the whole question with each call speck makes

**Status:** 👍 approved

## Problem
Decided for you lists only the option speck took. To judge a call, and to change it, you need the question it answered and the options it didn't choose, which today live only in free text in the build's question, if at all.

## Outcome
Each call speck makes keeps its question and its other options, and Decided for you can show them.

## Acceptance criteria
1. The build skill's blocked question has an `Other options:` line beside `Recommended:`, and speck reads it as it reads `Recommended:`.
2. When speck takes a recommendation (watch fix or decide, the watch agent's decide, or a size-guard split), it keeps the question, the option it went with, the other options and the time with the ticket's run record.
3. `speck status --json`'s list of calls gives each one's ticket, question, chosen option, other options, time and whether the ticket's criteria changed.
4. Calls made before this still show, with the question and other options blank.
5. No test that passed before this change fails.

## Out of scope
- How Decided for you shows them (0590).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today: `questionFacts` in `scripts/question-facts.mjs` reads `Recommended:`, `Changes what you'd notice:` and `Clear winner:`; `goWith` in `scripts/go-with.mjs` keeps `go_with`; the list is built in `scripts/foreman-took.mjs` (0568). Waits for 0576, which changes the same lines.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes

## In plain words
When speck makes a call for you, it now remembers the question it answered and the options it turned down, as well as the one it picked and when. Builds also write down the options they don't recommend when they stop to ask something. Nothing looks different yet: the Decided for you list will show this once its redesign lands. To see it now, run `speck status --json` after speck has made a call and look at the list of what it decided. Calls speck made before this still appear, just without the question or the other options.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 callOf includes the original recommendation among other_options only if the chosen text exactly matches a listed alternative.
Round 2 (codex): approve.
Round 3 (codex, merge round): approve.

## Delivery log
- Review rounds: 3, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 377,090
- Elapsed since build started: 20 min
- Changed lines: 75 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Follow-ups (known limits, no ticket needed):
- If the watch agent rewords the recommended option when it decides, the recommended wording also shows among those not chosen, as the two are compared exactly.
- The panel's blocked card, like `Recommended:`, doesn't print the `Other options:` line, so the build skill asks for the options in the question as well.

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
    "reviewed_sha": "75bf81b31ac56309b926230e62ae0e6ace994778",
    "session": "fresh",
    "thread_id": "01a1c199-273c-78d1-849a-61e4d14bef65",
    "builder_response": "- Tests run: test/calls-0589.test.mjs, through speck test --related, which also ran every existing test file naming a file this branch changed.\n- Round 1. Calls are listed from the ticket's Notes as before, and joined by option and minute to what the run record's `calls` kept. `decidedFor` is unchanged, as 0568's test pins its output exactly; `withCalls` adds the two fields in statusData.\n",
    "seconds": 35,
    "usage": {
      "input_tokens": 156180,
      "cached_input_tokens": 110976,
      "cache_write_input_tokens": 0,
      "output_tokens": 1002,
      "reasoning_output_tokens": 162
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 45204,
      "cached": 110976,
      "write": 0,
      "output": 1002
    },
    "cost_usd": 0.1115256,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T18:37:17.010Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The build skill includes Other options beside Recommended. The passing AC1 tests exercise questionFacts parsing and board output."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "goWith and foremanAction retain calls, with passing tests for each requested route. However, callOf drops the unchosen recommendation when the watch agent chooses text outside the listed alternatives."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The passing AC3 test exercises status --json and its required fields, but withCalls exposes the incomplete other_options recorded by callOf (F1)."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing AC4 tests verify that historical Notes entries remain visible with question null and other_options empty."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported related tests: 1704 passed, zero failed, three skipped. No existing tests were weakened in the diff."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/go-with.mjs",
        "issue": "callOf includes the original recommendation among other_options only if the chosen text exactly matches a listed alternative. foremanAction accepts arbitrary choice text. For recommendation 'Keep it', alternatives ['Remove it'], and choice 'Defer the decision', the saved alternatives omit 'Keep it'. Verified by directly calling callOf.",
        "suggested_fix": "Build other_options from the recommendation and listed alternatives, remove the chosen option and duplicates, and test a watch-agent choice outside the listed alternatives.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The main paths work and the reported tests pass. One gap remains: when the watch agent chooses a different option, the saved call can lose the original recommendation. Fix this so users can see all the options speck declined."
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
    "reviewed_sha": "cf3873c982a9270b8a624aeb4e0631023fd1d059",
    "session": "continued",
    "thread_id": "01a1c199-273c-78d1-849a-61e4d14bef65",
    "builder_response": "- Tests run: test/calls-0589.test.mjs\n- F1: fixed. `callOf` in scripts/go-with.mjs now builds other_options from the recommendation and the listed options, without repeats or the chosen option. New test: \"an agent choosing outside the listed options keeps every option it didn't choose\".\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 252509,
      "cached_input_tokens": 203264,
      "cache_write_input_tokens": 0,
      "output_tokens": 1610,
      "reasoning_output_tokens": 162
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 4041,
      "cached": 92288,
      "write": 0,
      "output": 608
    },
    "cost_usd": 0.0233908,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T18:38:00.139Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The build skill includes Other options beside Recommended. Passing AC1 tests exercise questionFacts parsing and board output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "goWith and foremanAction save calls with question, choice, alternatives and time. Passing AC2 tests cover watch fix, decide, size-guard splits, preservation across builds and choices outside the listed options."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "statusData joins decidedFor output with saved calls through withCalls. The passing AC3 CLI test checks every required field in status --json."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests verify historical calls remain visible with question null and other_options empty, and saved calls are matched only once."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Round 2 reports 126 passed, zero failed and three skipped. Round 1 related tests also had zero failures; no existing tests were weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/go-with.mjs",
        "issue": "Choices outside the listed alternatives previously omitted the original recommendation from other_options.",
        "suggested_fix": "Completed: callOf combines the recommendation and alternatives, removes duplicates and excludes the chosen option. A passing regression test exercises this through the watch agent.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Calls now retain their question and unchosen options, including when speck chooses an option outside the original list. Status exposes the details, older calls remain visible, and the reported tests pass. Ready for the owner's merge decision."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "7c00e9ab5aa4e38d80873f92846e7bf5f5d6f3da",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1c199-273c-78d1-849a-61e4d14bef65",
    "builder_response": "- Tests run: test/calls-0589.test.mjs test/go-with-0284.test.mjs test/foreman-fix-0286.test.mjs test/watch-decide-0567.test.mjs\n- Merge round: merged main into the ticket's branch.\n- scripts/go-with.mjs (class: logic, 1 conflict, lines 6-10): both sides added a name to the import from core.mjs. main added `speckSays`, this ticket added `earlierBuilds`. Resolved by importing both; nothing else changed.\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 374922,
      "cached_input_tokens": 312320,
      "cache_write_input_tokens": 0,
      "output_tokens": 2168,
      "reasoning_output_tokens": 162
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 13357,
      "cached": 109056,
      "write": 0,
      "output": 558
    },
    "cost_usd": 0.0431996,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T18:50:28.701Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The build skill specifies Other options beside Recommended; passing AC1 tests exercise questionFacts parsing and board output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "goWith and foremanAction save the question, chosen option, alternatives and time. Passing AC2 tests cover all requested routes and preservation across builds. The merge retains both speckSays and earlierBuilds imports and their uses."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "statusData uses withCalls to enrich decidedFor output. The passing AC3 test invokes status --json and checks all required fields."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests confirm historical calls remain visible with a null question and empty alternatives, and matching consumes each saved call once."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The merge-round tests report 173 passed, zero failed and three skipped, including existing go-with, foreman-fix and watch-decide tests. No tests were weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/go-with.mjs",
        "issue": "Choices outside the listed alternatives previously omitted the original recommendation from other_options.",
        "suggested_fix": "Completed: callOf combines all offered options, removes duplicates and excludes the chosen option. The regression test remains present and passes after the merge.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The merge preserves both sides' behaviour. Calls retain their questions and alternatives, status exposes them, and older calls remain visible. The reported tests pass, with no open blocking findings."
  }
}
```

</details>
