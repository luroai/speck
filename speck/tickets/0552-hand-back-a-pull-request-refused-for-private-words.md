---
id: "0552"
title: "Hand back a pull request refused for private words"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-25-hand-back-a-pull-request-refused-for-private-words.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-29
started: "2026-10-29T14:13:39.786Z"
approved: "2026-10-29T14:16:43.968Z"

---
# 0552 · Hand back a pull request refused for private words

**Status:** 👍 approved

## Problem
In pull request mode, when `speck ship --auto` refuses a ticket because a file under `speck/` holds a private word or the home folder's path (exit 17), speck run's pull request queue only says it didn't ship. The ticket waits for the Foreman or the user, though its build has steps to take them out, as it does in local mode.

## Outcome
speck run's pull request queue hands a ticket refused for private words back to its build, as the local ship queue does.

## Acceptance criteria
1. In pull request mode, when speck run's pull request queue ships a ticket and `speck ship <id> --auto` exits 17, the ticket is handed back to its build with the kind `private` and the ship log's last line as the reason, as the local ship queue does for exit 17.
2. While that hand-back is still to run, the pull request queue doesn't try to ship the ticket again, as for a ticket handed back for a conflict today.
3. Exit 13 is still handed back as a conflict, and any other refusal is handled as today: said in one line and tried again once its pull request, the base branch or its branch changes.
4. No test that passed before this change fails.

## Out of scope
- Handing back other exit codes in pull request mode, such as tests (16) or the base branch (14).

## Notes
- Asked for 2026-10-29 for the 0.21.1 patch release.
- From 0506's own note: the private-words check in `scripts/ship.mjs` runs in both modes, but only the local ship queue maps exit 17 to a hand-back (`HAND_BACK` in `scripts/ship-queue.mjs`). The pull request queue hands back only exit 13 (`scripts/pr-queue.mjs`, in its ship callback). 0323 made that conflict hand-back.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes. As with 0323's conflict hand-back, nothing pushes the build's new commit to the pull request afterwards, so the next ship asks for `speck pr`; that's the dropped idea speck/ideas/2026-10-19-push-a-handed-back-pull-request-again.md, left alone here.

## In plain words
In pull request mode, when speck run tries to merge a ticket and finds one of your private words or your home folder's path in its speck files, it now sends the ticket back to the agent that built it to take them out, just as it already does when you ship locally. Before, it only said the ticket didn't ship and left it waiting for you.

To see it, add a word to your private words list that appears in an approved ticket, then let speck run try to ship it in pull request mode: the run's log says it handed the ticket back, and the build's session picks it up.

Worth keeping an eye on: once the build has taken the words out, its new commit still has to reach the pull request on GitHub. Nothing pushes it there automatically yet, so the next try asks for `speck pr` to be run, as it does after a conflict.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 90,136
- Elapsed since build started: 3 min
- Changed lines: 4 (limit 5000)
Follow-ups:
- Skipped, matches speck/ideas/2026-10-19-push-a-handed-back-pull-request-again.md (dropped): pushing the build's new commit to the pull request after a hand-back, which this hand-back needs as much as 0323's conflict one.
- The hand-back message says "speck run's ship queue tries it again", which in pull request mode is its pull request queue. Wording only.

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
    "reviewed_sha": "3c41a2b26cbb94708856b5b3a1b59f82f2562643",
    "session": "fresh",
    "thread_id": "01a18804-ab0c-76e3-a865-11e48328a109",
    "builder_response": "- Tests run: test/pr-private-0552.test.mjs test/pr-conflict-0323.test.mjs test/pr-ship-0296.test.mjs test/pull-request-0295.test.mjs (with `speck test --related`, plus the repo's checks)\n- Round 1. The pull request queue now maps exit 13 to `conflict` and exit 17 to `private`, as the local ship queue's HAND_BACK does. AC2 relies on the existing `waiting(id)` skip, which applies to any hand-back kind.\n- Known limit, out of scope: after a private-words hand-back the build's new commit isn't pushed to the pull request, the same as after 0323's conflict hand-back. The user dropped that idea (speck/ideas/2026-10-19-push-a-handed-back-pull-request-again.md).\n",
    "seconds": 25,
    "usage": {
      "input_tokens": 89428,
      "cached_input_tokens": 51840,
      "cache_write_input_tokens": 0,
      "output_tokens": 708,
      "reasoning_output_tokens": 26
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 37588,
      "cached": 51840,
      "write": 0,
      "output": 708
    },
    "cost_usd": 0.08744,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-29T14:16:34.828Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/pr-queue.mjs maps exit 17 to 'private' and passes lastLine(log) and the branch head to handBack. scripts/run.mjs connects this callback to handBacks.keep. The passing 0552 AC1 test exercises the queue callback and verifies the complete hand-back payload."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "prQueue.check skips tickets when waiting(id) is true. The passing 0552 AC2 test verifies that a pending private hand-back prevents another ship attempt even when the pull request key changes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The mapping retains exit 13 as 'conflict'; other refusal handling and retry keys remain unchanged. The passing 0552 AC3 test verifies conflict hand-back, one-line refusal messages, and retries after a pull request change for exits 1, 12, 14 and 16."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Reported validation passed 155 tests with zero failures and three skips, including the new tests and existing conflict, shipping and pull request tests. No existing tests were changed, and the production change is limited to the refusal mapping."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Pull requests refused for private words now return to their build for correction and wait while that hand-back is pending. Conflict handling and other refusal behaviour remain intact. The tests exercise the change directly and passed. No blocking concerns found."
  }
}
```

</details>
