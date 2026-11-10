---
id: "0628"
title: "Let the owner-name check skip the price list"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T20:31:22.124Z"
approved: "2026-11-10T20:36:06.882Z"

---
# 0628 · Let the owner-name check skip the price list

**Status:** 👍 approved

## Problem
On a machine whose private words include a word that's also part of a model's name, the check that no tracked file names the owner (0082 AC2, in `test/luro-0082.test.mjs`) fails on `scripts/prices.json`, which holds model names copied from LiteLLM's public price list. On 2026-11-10 a word added to the private words matched Google model names there, so the check fails on `main` on this machine, and every ship's test run with it.

## Outcome
The owner-name check skips the copied price list, and still catches a private word in any other tracked file.

## Acceptance criteria
1. `filesNaming` in `test/support/private-words.mjs` leaves out `scripts/prices.json`, the model names copied from LiteLLM's price list, as 0627 leaves it out of the commit check.
2. 0082 AC2 passes on a machine whose private words match a model name in the price list, and still fails when a private word is in any other tracked file outside `speck/`: the Delivery log says how this was checked, without writing the private word down.
3. No test that passed before this change fails.

## Out of scope
- What counts as a private word.
- The commit check (0627).

## Notes
- Found on 2026-11-10 while rewriting the repo's history to take a private name out: `node --test test/luro-0082.test.mjs` failed on `scripts/prices.json` before and after the rewrite, once the word was in `~/.config/speck/private-words`.
- Today: `filesNaming` runs `git grep -l -i -F … -- . ':!speck/'`; adding `':!scripts/prices.json'` is the likely change.
- Relies on nothing outside this repo.
- Failing before this build: not checked
- Self-check: the AC2 test also checks that a file named prices.json anywhere else, or a near-namesake such as scripts/prices.json.bak, is still caught; no code changes.

## In plain words
The check that keeps your private words out of speck's files no longer trips over the list of model prices speck copies from a public source, where a private word can happen to be part of a model's name. Ships on this machine stop failing on that list. A private word anywhere else in the project is still caught. To see it, run the owner-name check with your private words in place: it now passes. Keep in mind that a private word inside that price list itself is no longer flagged, which is fine as long as the list only holds copied model names.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 AC2 explicitly requires the Delivery log to explain how both behaviours were checked without recording the private word.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 198,113
- Elapsed since build started: 5 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- How AC2 was checked: `test/private-words-0628.test.mjs` picks, at run time, a word from the model names in `scripts/prices.json` that no other tracked file outside `speck/` holds, so the word is never written down. It puts that word in a temporary home's private-words list and runs 0082 AC2 against this repo in a child run: it passes with this change, and failed on `scripts/prices.json` without it (checked by reverting the change). A second test runs `filesNaming` on a temporary repo and finds the word in every other tracked file outside `speck/`, including a `prices.json` at the top or under `docs/scripts/` and `scripts/prices.json.bak`. 0084's existing tests still show 0082 AC2 failing on a listed word in any other tracked file.

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
    "reviewed_sha": "d7c71d9c9db04664c7fc95a32528a10d338621bc",
    "session": "fresh",
    "thread_id": "01a1c72a-f2ae-7522-b4a3-65c60544661c",
    "builder_response": "- Tests run: `speck test --related test/private-words-0628.test.mjs`, which ran test/private-words-0628.test.mjs, test/luro-0082.test.mjs, test/private-words-0084.test.mjs, test/private-words-0506.test.mjs, test/repo-speck-0122.test.mjs and the commands.checks files.\n- Change: `filesNaming` adds the pathspec `:!scripts/prices.json` beside `:!speck/`.\n- AC2's real-repo test picks a word that only scripts/prices.json holds, writes it to a temporary HOME's private-words, and runs 0082 AC2 in a child; it fails without the change (checked by reverting the support file).\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 85067,
      "cached_input_tokens": 51712,
      "cache_write_input_tokens": 0,
      "output_tokens": 561,
      "reasoning_output_tokens": 16
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 33355,
      "cached": 51712,
      "write": 0,
      "output": 561
    },
    "cost_usd": 0.0774912,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T20:34:30.865Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/support/private-words.mjs filesNaming excludes scripts/prices.json. The passing 0628 AC1 test exercises that exclusion; the second 0628 test checks other locations and near-namesakes remain included."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The passing 0628 integration test runs real 0082 AC2 with a temporary private-word list matching the price list. test/private-words-0084.test.mjs also checks that 0082 fails for matches elsewhere. However, the ticket's Delivery log contains only its placeholder and does not describe this verification as required."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The recorded related-test run reports 131 passed, zero failed and three skipped across 134 tests. The code change is limited to the specified exclusion, with no existing tests weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0628-let-the-owner-name-check-skip-the-price-list.md",
        "issue": "AC2 explicitly requires the Delivery log to explain how both behaviours were checked without recording the private word. That log is still empty.",
        "suggested_fix": "Add a Delivery log entry describing the temporary private-word list and real 0082 AC2 passing check, plus the checks proving matches in other tracked files still fail. Record the results without including the selected word.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change correctly skips the copied price list while preserving checks of other tracked files, and the reported tests pass. Before approval, add the verification details to the Delivery log as the ticket requires."
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
    "reviewed_sha": "9f35aab5b4496505c5830675748085a9ec974306",
    "session": "continued",
    "thread_id": "01a1c72a-f2ae-7522-b4a3-65c60544661c",
    "builder_response": "- Tests run: test/private-words-0628.test.mjs (with the commands.checks files)\n- F1: fixed. The ticket's Delivery log now says how AC2 was checked, both the passing and the still-failing side, without naming the word.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 197072,
      "cached_input_tokens": 158464,
      "cache_write_input_tokens": 0,
      "output_tokens": 1041,
      "reasoning_output_tokens": 16
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 5253,
      "cached": 106752,
      "write": 0,
      "output": 480
    },
    "cost_usd": 0.0259812,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T20:36:00.590Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/support/private-words.mjs filesNaming excludes scripts/prices.json. The passing 0628 AC1 test exercises this exclusion."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing tests in test/private-words-0628.test.mjs exercise real 0082 AC2 with a matching temporary private-word list and verify other paths remain checked. Existing 0084 tests cover 0082 failing on matches elsewhere. The ticket's Delivery log now describes both checks without recording the selected word."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The current run reports 111 passed, zero failed and three skipped. The previous related-test run also had zero failures; this round changes only the ticket's records."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0628-let-the-owner-name-check-skip-the-price-list.md",
        "issue": "The required AC2 verification details were missing from the Delivery log.",
        "suggested_fix": "Record how the passing and still-failing behaviours were checked without including the selected private word.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The owner-name check now skips the copied price list while continuing to catch matches in other tracked files. Tests pass, and the required verification details are recorded. Ready for the owner's merge decision."
  }
}
```

</details>
