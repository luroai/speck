---
id: "0626"
title: "Use made-up project names in the project menu's tests"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
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
created: 2026-11-10
started: "2026-11-10T20:27:58.622Z"
approved: "2026-11-10T20:30:11.830Z"
finished: "2026-11-10T20:48:27.739Z"

---
# 0626 · Use made-up project names in the project menu's tests

**Status:** ✅ done

## Problem
The project menu's tests (0516) use real project names from the user's machine as their sample projects, so a private name sits in the public repo's test code.

## Outcome
The project menu's tests use made-up project names.

## Acceptance criteria
1. `test/panel-0516.test.mjs` uses made-up names, such as `alpha` and `beta`, for every sample project other than `speck`, and contains no name from the user's private words.
2. Each test still checks what it checked before, with the same results.
3. No test that passed before this change fails.

## Out of scope
- The project menu's behaviour.

## Notes
- Asked for 2026-11-10: remove a private name from everything and "make sure it doesn't happen again … I don't even want a mention of the user's other projects." The name itself is in the user's private words, so it isn't written here.
- Relies on nothing outside this repo.
- Failing before this build: not checked
- Found while building: the project's real name in these tests was another folder beside this repo, not one of the words in the private-words file, so a private-words check alone wouldn't have caught it. The new test checks every sample project's name against a list of made-up ones as well.
- AC2 and AC3 are checked by the 0516 tests themselves: only the names changed, and the file's tests all pass with them. The owner-name check (luro-0082 AC2) fails on the price list, a file this ticket doesn't touch; 0628 covers it.
- Self-check: no changes. With no private-words file the private-words test checks nothing, which the made-up names test covers.

## In plain words
Nothing changes for anyone using speck. The project menu's tests used to name one of the owner's other projects as a sample. They now use made-up names, and a new check fails if a sample project there is ever given a name that isn't on its list of made-up ones. One thing to watch: that project's name wasn't in the private-words list, so the private-words checks wouldn't have caught it anywhere else. Adding it to the list closes that gap.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 128,949
- Elapsed since build started: 2 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up (owner's setup, not code): the name taken out here isn't in the private-words list, so add it there for the private-words checks to catch it elsewhere. No idea note, as it needs no ticket.
- Follow-up: the owner-name check fails on the price list; 0628 covers it.

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
    "reviewed_sha": "b41a56dcadbc0b3acc94c636097f6b77ba9f4492",
    "session": "fresh",
    "thread_id": "01a1c726-ec57-7782-9875-cbf8d4f7af66",
    "builder_response": "- Tests run: test/panel-0626.test.mjs test/panel-0516.test.mjs (with --related, which added the commands.checks files)\n- Round 1. The only real project name in test/panel-0516.test.mjs was another folder beside this repo on the user's machine (two lines), plus a shortened form of it (four lines). Both are now `beta`. That name isn't in ~/.config/speck/private-words, so the new AC1 test checks every sample project name against a list of made-up names, and checks for the private words too.\n- AC2/AC3: only string literals changed in panel-0516. All its tests pass. The one failure in the run is luro-0082 AC2 on scripts/prices.json, a file this ticket doesn't touch (ticket 0628 covers it).\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 128289,
      "cached_input_tokens": 89088,
      "cache_write_input_tokens": 0,
      "output_tokens": 660,
      "reasoning_output_tokens": 18
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 39201,
      "cached": 89088,
      "write": 0,
      "output": 660
    },
    "cost_usd": 0.0939108,
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-11-10T20:30:03.038Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/panel-0516.test.mjs now uses beta for the affected sample projects; the other sample names are fictional or speck. Both AC1 checks in test/panel-0626.test.mjs pass, checking the sample-name allowlist and absence of configured private words."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The diff in test/panel-0516.test.mjs changes only sample-name literals and their matching expectations. All 19 existing 0516 tests pass in /tmp/speck-0626-tests.txt; their assertions retain the original behavioural coverage."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The recorded run has 128 passes, three skips and one unrelated failure. That failure checks owner names and identifies scripts/prices.json; neither that file nor the failing test changes against main. No regression attributable to this change was found."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The project-menu tests now use fictional sample names and retain their existing checks. Added checks guard against reintroducing private names. All affected tests pass. The reported failure concerns an unchanged price-list file and is unrelated to this change."
  }
}
```

</details>
