---
id: "0554"
title: "Say why Codex failed a review round"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-28-say-why-codex-failed-a-review-round.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-29
started: "2026-10-29T14:14:01.823Z"
approved: "2026-10-29T14:16:55.164Z"
finished: "2026-10-29T14:41:30.587Z"

---
# 0554 · Say why Codex failed a review round

**Status:** ✅ done

## Problem
When Codex fails during a review round, `speck review` says only "codex exited 1:" with nothing after it, because with `--json` Codex writes its error to standard output as an event, and speck shows only its standard error. A builder or the user can't tell a usage limit from a broken setup or a bad prompt, so a build blocks without saying what to do: in 0540's build the reason only showed when Codex was run by hand.

## Outcome
A failed Codex review round's message gives Codex's own reason.

## Acceptance criteria
1. When `codex exec` exits non-zero during a review round and its JSON lines on standard output include an error event (`turn.failed` or `error`), `speck review`'s message gives that event's error message, for example Codex's usage-limit message with when it resets.
2. When standard output has no error event, the message gives the last lines of standard error, as today. When neither has anything, it says Codex gave no reason, rather than ending after the colon.
3. The message still starts by saying codex exited with its exit code, and no round is recorded, as today.
4. No test that passed before this change fails.

## Out of scope
- The other reviewers' failure messages (`scripts/reviewers.mjs`).
- Retrying a round after a usage limit.

## Notes
- Asked for 2026-10-29 for the 0.21.1 patch release.
- From 0540's own note. The message is thrown in `runCodexReview` in `scripts/review.mjs`, which already parses standard output's JSON lines after a success.
- Quick test: a fake `codex` on the PATH that prints JSON lines and exits 1, as the existing review tests do.
- Checked 2026-10-29: codex-cli 0.159.0 is installed here, and its binary names a `turn.failed` event (the installed binary's strings).
- Checked 2026-10-29: in codex-cli 0.159.0's `exec --json` output, an `error` event holds its message in `message` (`{"type":"error","message":"…"}`) and a `turn.failed` event in `error.message` (`{"type":"turn.failed","error":{"message":"…"}}`), seen by running `codex exec --json` with a model name it refuses. The message can itself be the API's JSON error, with its own `error.message`.
- Failing before this build: none
- Self-check: no changes

## In plain words
When Codex can't finish a review, speck now says why in Codex's own words, for example that you've hit your usage limit and when it resets, instead of an error that stopped after "codex exited 1:". If Codex gives no reason at all, the message says so. To see it, set a reviewer model Codex doesn't offer and start a review: the message names the model it refused. Nothing else about reviews changes.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 88,187
- Elapsed since build started: 3 min
- Changed lines: 14 (limit 5000)
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
    "reviewed_sha": "02e3eaebbbd3de3d8443cb0e9469223b5fc02ed4",
    "session": "fresh",
    "thread_id": "01a18804-eb97-7410-9bba-ec397960b7e9",
    "builder_response": "- Tests run: `speck test --related test/codex-failure-0554.test.mjs` (the ticket's own test file, plus every test file that names scripts/review.mjs or test/support/speck.mjs, which this branch changed): 978 tests, 975 pass, 0 fail, 3 skipped.\n- Field names checked against the installed codex-cli 0.159.0 by running `codex exec --json` with a model it refuses: `{\"type\":\"error\",\"message\":…}` and `{\"type\":\"turn.failed\",\"error\":{\"message\":…}}`; the message itself was the API's JSON error, so its inner `error.message` is given when it parses.\n- `item.completed` events whose item has type `error` are warnings Codex carries on after, so they're ignored.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 87653,
      "cached_input_tokens": 51840,
      "cache_write_input_tokens": 0,
      "output_tokens": 534,
      "reasoning_output_tokens": 0
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 35813,
      "cached": 51840,
      "write": 0,
      "output": 534
    },
    "cost_usd": 0.08215,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-29T14:16:48.708Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/review.mjs: codexFailure extracts turn.failed.error.message and error.message, including wrapped API errors. The passing AC1 unit tests cover both event types; the passing integration test exercises the review command with a failing fake Codex."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "codexFailure falls back to the last five stderr lines and explicitly says Codex gave no reason when empty. The passing AC2 test covers stderr, malformed events and empty output; the integration test also checks the empty-output message."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "runCodexReview throws before saveRound on a non-zero exit. The passing AC1 AC3 integration test checks the exit-code prefix, absence of a recorded round and unchanged tracked files."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0554-tests.txt: 978 tests, 975 passed, 3 skipped and 0 failed. The changes are confined to Codex failure reporting and its test support; existing tests were not weakened."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Failed Codex reviews now show Codex’s reason, including usage-limit reset messages. They retain the stderr fallback and clearly report when no reason was supplied. Tests cover the messages and confirm failed reviews record no round. No blocking concerns found."
  }
}
```

</details>
