---
id: "0567"
title: "Let the watch agent act on its own recommendation"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0564","0566"]                # ticket ids that must be done first
created: 2026-11-08
started: "2026-11-09T00:02:07.058Z"

---
# 0567 · Let the watch agent act on its own recommendation

**Status:** 🔍 reviewing

## Problem
When speck's watch agent looks into a stop, it usually ends by asking you a question with its recommendation, and you go with it: 10 of its 13 actions in this repo were questions. With `watch: decide`, it should act on its recommendation and tell you, rather than wait for you.

## Outcome
With `watch: decide`, the watch agent takes its own recommendation instead of asking, and asks only when it has none or the ticket is high risk.

## Acceptance criteria
1. `speck watch` has a `decide` action that takes a ticket, the option and why. It adds `- Went with the recommendation: <option> (chosen by speck, as watch is decide, <YYYY-MM-DD HH:MM> UTC).` to the ticket's Notes, resumes its build with that option as the Go with the recommendation button does, and is logged as the run's one action.
2. `speck watch decide` refuses, changing nothing, when `watch` isn't `decide` or the ticket's risk is high, saying which.
3. With `watch: decide`, the `speck-watch` skill tells the agent to use `decide` whenever it has a recommendation for a low-risk ticket, and to ask only otherwise (checked by review).
4. A `decide` doesn't count under Needs you; an unanswered `ask` still does.
5. No test that passed before this change fails.

## Out of scope
- `watch: off`, `tell` and `fix`, whose agent behaves as today.

## Notes
- Asked for 2026-11-08: the user goes with speck's recommendation almost every time, so speck should decide and tell them rather than ask ("ticket up 1": the watcher deciding). In this repo 15 of 17 recommendations taken were picked by hand in the panel, and 10 of the watch agent's 13 actions were questions.
- Today: `ACTIONS` in `scripts/foreman-agent.mjs` (about lines 39 to 44) and `foremanAction` (about lines 388 to 435); the agent's instructions are `skills/speck-watch/SKILL.md` section 2, which says "When you're unsure, ask." `goWith` in `scripts/go-with.mjs` resumes a build with a chosen option.
- Waits for 0564, which adds `decide`, and 0566, which changes `scripts/foreman-agent.mjs`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: added the size-guard refusal to the docs, and refused a size guard's block so raising the limit can never be chosen.

## In plain words
With the watch setting on decide, speck no longer stops to ask when it looks into stuck work and already knows what it would recommend. On a low-risk ticket it goes with its recommendation, notes that in the ticket and carries the build on. It still asks when it has no recommendation or the ticket is high risk.

To see it, set watch to decide and leave a build to stop partway. The ticket's notes then say speck went with the recommendation, and speck's status lists it, without adding to Needs you.

Keep an eye on what speck chooses at first, as it now acts without asking. It takes at most 3 recommendations per ticket, and if the build has already carried on when speck's turn comes, it leaves the build as it is.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up: a waiting `speck watch resume` isn't dropped when its ticket moves on, as a waiting `decide` now is (speck/ideas/2026-11-09-drop-a-waiting-watch-resume-once-the-ticket-has-moved-on.md).

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
    "reviewed_sha": "9863d99cfcf27bbbd51ed9ba7f6f4e67b1c97ae9",
    "session": "fresh",
    "thread_id": "01a1bda1-396d-7f51-84f4-13ba8a5e48b3",
    "builder_response": "- Tests run: test/watch-decide-0567.test.mjs, with `speck test --related` adding the 118 existing test files that name a changed file.\n- Design note: the watch agent starts for stops on tickets that usually aren't blocked (a refused ship, a build that ended partway), so `goWith`, which refuses anything not blocked and takes the option from the question, can't be called as it is. `decide` writes goWith's Notes line and sets a blocked ticket building as goWith does, then goes through the same \"once the agent has ended\" resume path as `speck watch resume`, with its own message naming the option.\n- Beyond AC2, `decide` also refuses where goWith with watch: decide does: 3 recommendations already taken, a build still running, a branch not checked out where the build left it. It refuses every size guard block too, so an agent can never choose raising the limit.\n",
    "seconds": 25,
    "usage": {
      "input_tokens": 132930,
      "cached_input_tokens": 81152,
      "cache_write_input_tokens": 0,
      "output_tokens": 893,
      "reasoning_output_tokens": 94
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 51778,
      "cached": 81152,
      "write": 0,
      "output": 893
    },
    "cost_usd": 0.1206012,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T00:07:26.962Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The AC1 tests cover the Notes line, option delivery and one-action limit. However, foremanAgentQueue.finish/check resumes a queued decide without the stale-choice checks that goWithQueue applies; see F1."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cantDecide checks the watch setting and risk before writes. The passing AC2 tests verify refusal messages and unchanged tickets, commits, records and action logs."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "skills/speck-watch/SKILL.md section 2 explicitly requires decide instead of asking for a recommendation on a low-risk ticket, with questions reserved for no recommendation, high risk or a refused decide."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Both passing AC4 tests exercise foremanView: decide leaves agent.asks empty, while an unanswered ask produces Needs you 1."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied related-test run reports 1265 passes, zero failures and three skips. Existing tests were not changed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/foreman-agent.mjs",
        "issue": "A pending decide can resume obsolete work. finish queues only the option and by: decide; check excludes only user answers from stale resumes. If the user carries on the build while the watcher finishes or while no build slot is free, the queued decision later resumes the latest session with the old option. It can even resume a ticket that has since become done or cancelled. The recommendation button's goWithQueue drops choices when the branch has moved or the session is in use and restricts eligible statuses.",
        "suggested_fix": "Record the decision's committed head and relevant session/state, and discard pending decide actions when the ticket has moved on or the build has already carried on. Apply this specifically to decide to preserve the out-of-scope resume behaviour. Add tests for a decision waiting while the branch advances, the session changes, or the ticket finishes.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The new action records and resumes recommendations, and its refusal checks work in the tested cases. One issue needs fixing: a delayed recommendation can restart work after the user has already moved on, including after the ticket has finished."
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
    "reviewed_sha": "e0714271bd87c06dc2a2721654b9424968a133b4",
    "session": "continued",
    "thread_id": "01a1bda1-396d-7f51-84f4-13ba8a5e48b3",
    "builder_response": "- Tests run: test/watch-decide-0567.test.mjs (and the `commands.checks` files, which `speck test --files` adds).\n- F1: fixed. `decide` now records in its logged action the ticket's commit after its Notes commit, its build's session and its status as it now is. `check` in `foremanAgentQueue` drops a waiting decide when the ticket's status differs (so done or cancelled too), the branch's head has moved, the run record has another session, or the session is in use, saying so in speck run's log. It applies only to `by: 'decide'`, so `speck watch resume` behaves as before. New tests cover a decide waiting for a slot while the branch advances, the session changes, the session is in use, and the ticket becomes done, cancelled or reviewing.\n",
    "seconds": 36,
    "usage": {
      "input_tokens": 252790,
      "cached_input_tokens": 191104,
      "cache_write_input_tokens": 0,
      "output_tokens": 1541,
      "reasoning_output_tokens": 94
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 9908,
      "cached": 109952,
      "write": 0,
      "output": 648
    },
    "cost_usd": 0.0372912,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T00:09:15.947Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "foremanAction records the required Notes line and one logged action. foremanAgentQueue resumes with the option after the watcher ends and now drops stale decisions. Passing AC1 tests cover these behaviours, including changes to the branch, session and ticket status."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cantDecide refuses before writes when watch is not decide or risk is high. Passing AC2 tests verify the messages and unchanged state."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "skills/speck-watch/SKILL.md section 2 directs the agent to use decide for a low-risk recommendation and ask only without a recommendation, for high risk or after a refusal."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests verify that decide adds no outstanding question and an unanswered ask still produces Needs you 1."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Round 2 reports 134 passes, zero failures and three skips; the earlier related-test run also had zero failures. Existing tests were not weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/foreman-agent.mjs",
        "issue": "A pending decision could resume obsolete work after the ticket or build had moved on.",
        "suggested_fix": "Implemented: decisions retain their commit, session and resulting status; the queue discards them when these change or the session is in use. Passing regression tests exercise each case.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The watcher can now act on its recommendation for low-risk tickets when watch is decide. Refusal checks and question counts work as required. The delayed-decision issue is fixed, and all reported tests pass."
  }
}
```

</details>
