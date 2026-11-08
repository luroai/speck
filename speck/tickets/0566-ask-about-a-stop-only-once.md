---
id: "0566"
title: "Ask about a stop only once"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-08
started: "2026-11-08T23:01:56.140Z"
approved: "2026-11-08T23:05:46.140Z"

---
# 0566 · Ask about a stop only once

**Status:** 👍 approved

## Problem
speck's watch agent can ask you the same question about a ticket again and again: 0344's macOS question was asked 7 times. `speck run` looks into a stop again whenever the base branch or the ticket's branch gets a new commit, and nothing checks whether it has already asked about that ticket and is waiting on you.

## Outcome
speck asks about a ticket's stop once, and looks into it again only once you've answered or dismissed the question, or the ticket's status has changed.

## Acceptance criteria
1. While the latest watch action on a ticket is a question you haven't answered or dismissed, and the ticket's status is the same as when it was asked, `speck run` doesn't start its agent for that ticket again, even after new commits on the base branch or the ticket's branch.
2. Once that question is answered or dismissed, or the ticket's status changes, `speck run` looks into the ticket again as it does today.
3. The unanswered question still counts once under Needs you, as today.
4. No test that passed before this change fails.

## Out of scope
- What the agent does when it looks into a stop (0567).

## Notes
- Asked for 2026-11-08: the user goes with speck's recommendation almost every time, so speck should decide and tell them rather than ask ("ticket up 1": the watcher deciding). In this repo 15 of 17 recommendations taken were picked by hand in the panel, and 10 of the watch agent's 13 actions were questions.
- Today: `stuck()` in `scripts/foreman-agent.mjs` (about lines 231 to 238) skips a ticket only while `codeKey` (about lines 132 to 141, the base branch's and the ticket branch's heads) is unchanged; `agentView` (about lines 172 to 196) already works out which questions are still open.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: added a test that the default status lookup holds a stop back in a real repo, as an error there would be swallowed.

## In plain words
speck now asks you about a stopped ticket once. While its question is waiting for you, new commits no longer start another look at that ticket, so you won't get the same question again and again. Once you answer or dismiss it, or the ticket's status changes, speck looks into new stops as before. To see it, leave a question from speck unanswered while work carries on: the question stays once under Needs you, and no second one appears. Worth knowing: a stop that happens while the question waits isn't saved up, so after you dismiss the question speck only looks again the next time the ticket stops.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 251,170
- Elapsed since build started: 4 min
- Changed lines: 16 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Known limit: a stop held back while a question waits is dropped rather than kept, so after a dismissal speck looks again only at the ticket's next stop.
Follow-ups: none.

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
    "reviewed_sha": "b2f4966587d31e5b56e99fb56bd2bd256f55ea7a",
    "session": "fresh",
    "thread_id": "01a1bd68-7381-7a21-b0bf-b773d0c22969",
    "builder_response": "- Tests run: test/foreman-once-0566.test.mjs and the related files `speck test --related` chose (115 test files, listed at the top of the test output); 1212 pass, 0 fail, 3 skipped.\n",
    "seconds": 36,
    "usage": {
      "input_tokens": 250339,
      "cached_input_tokens": 203648,
      "cache_write_input_tokens": 0,
      "output_tokens": 831,
      "reasoning_output_tokens": 25
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 46691,
      "cached": 203648,
      "write": 0,
      "output": 831
    },
    "cost_usd": 0.1220568,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-08T23:05:37.074Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/foreman-agent.mjs: stuck() suppresses stops using agentView().asks; check() removes queued stops for unanswered questions. Three passing AC1 tests cover base and ticket commits, an already queued stop, and the default status lookup in a real repository."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "agentView() clears the hold after an answer, dismissal or status change. Passing AC2 tests exercise all three, preserve existing same-commit suppression and verify another ticket can still start."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 test checks that repeated stops leave one agentView() question and foremanView() displays 'Needs you 1'."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Recorded test output reports 1212 passed, 0 failed and 3 skipped across 115 related test files. Existing tests were not changed; the implementation is confined to watch queue suppression."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The watcher now waits for your answer instead of asking the same question again after new commits. Answering, dismissing or changing the ticket’s status releases that hold, and the question still counts once under Needs you. The tests cover these behaviours and report no failures."
  }
}
```

</details>
