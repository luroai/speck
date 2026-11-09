---
id: "0589"
title: Keep the whole question with each call speck makes                # one outcome, no "and"
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
after: ["0576"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T18:30:55.350Z"

---
# 0589 · Keep the whole question with each call speck makes

**Status:** 🔍 reviewing

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
