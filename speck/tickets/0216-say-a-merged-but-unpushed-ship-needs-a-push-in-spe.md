---
id: "0216"
title: "Say a merged but unpushed ship needs a push in speck run's log"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-don-t-say-speck-run-will-retry-a-ship-that-merged.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0236"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T23:12:23.185Z"
approved: "2026-10-15T23:13:56.424Z"

---
# 0216 · Say a merged but unpushed ship needs a push in speck run's log

**Status:** 👍 approved

## Problem
When a ship that `speck run` started merges a ticket but can't push it, speck run's log says the ticket "didn't ship" and that it will try again once the base branch or the ticket's branch has a new commit. The ticket is done, so speck run never tries again, and the user waits for a retry that never comes while the remote stays behind.

## Outcome
speck run's log says plainly when a ship merged but wasn't pushed, and how to push it.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. When a ship that `speck run` started merges the ticket but the push fails, speck run's log says `<id> merged into <base> but wasn't pushed:`, followed by the ship's own message, which names the command to run (`git push <remote> <base>`, or `git pull` first when the remote has moved on).
2. In that case the log doesn't say the ticket "didn't ship", and doesn't say speck run will try it again.
3. A ship that fails before it merges is logged as today: `<id> didn't ship: …`, then the line saying speck run will try it again.
4. No test that passed before this change fails, except checks that log a merged but unpushed ship as "didn't ship", which are changed to check AC1 and AC2.

## Out of scope
- Pushing or retrying the push for the user.
- The panel's and `speck status --json`'s wording, which 0204 already changed to "Merged, but not pushed".

## Notes
- The message comes from `ended()` in `scripts/ship-queue.mjs`. The ship record already says whether the ship merged but wasn't pushed (`unpushed`, from 0204 in `scripts/ship.mjs`), and its message already names the push command.
- Failing before this build: none
- Self-check: no changes. A record left by an earlier ship (started before this one) is never read as this ship's, so a refusal of an already merged ticket is still logged as "didn't ship". No test logged an unpushed ship as "didn't ship", so no existing test changed (AC4).

## In plain words
When speck run ships a ticket and the merge works but sending it to the shared copy online fails, its log now says the ticket was merged but not pushed, and repeats the instructions for pushing it by hand. It no longer says the ticket didn't ship or that speck run will try again, since it never would. Other failed ships read as before. To see it, look at speck run's output after a ship whose push was refused. Nothing changes in the panel.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 120,711
- Elapsed since build started: 2 min
- Changed lines: 2 (limit 5000)
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
    "reviewed_sha": "e6930b4aafbdda5bea759a5df6c70c1d90353c23",
    "thread_id": "01a141d7-986c-7b72-9184-118d4a8d1c8f",
    "seconds": 20,
    "usage": {
      "input_tokens": 120131,
      "cached_input_tokens": 83456,
      "cache_write_input_tokens": 0,
      "output_tokens": 580,
      "reasoning_output_tokens": 0
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T23:13:50.674Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/ship-queue.mjs ended() recognises the current ship's unpushed record and includes its message verbatim. Passing test '0216 AC1' checks the wording and recovery command. scripts/ship.mjs supplies git pull/git push advice."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "ended() returns after the merged-but-unpushed message, before the failure and retry lines. Passing test '0216 AC2' checks both unwanted phrases are absent."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The existing pre-merge failure path is unchanged. Passing test '0216 AC3' checks the failure message and retry line; existing 0193 queue tests also pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Verified test output reports all 17 tests passing across run-0216.test.mjs and run-0193.test.mjs. No existing tests were changed, and the production diff is limited to the new logging branch."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The log now clearly says when a ticket merged locally but could not be pushed, preserving the ship's instructions for completing the push. It no longer promises a retry in that case. Ordinary ship failures retain their existing messages. All 17 reported tests passed; no blocking concerns found."
  }
}
```

</details>
