---
id: "0323"
title: "Hand back a pull request that GitHub says conflicts"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-18-hand-back-a-pull-request-github-says-conflicts.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-19
started: "2026-10-19T07:08:40.873Z"
approved: "2026-10-19T07:13:14.815Z"
finished: "2026-10-19T07:17:39.347Z"

---
# 0323 · Hand back a pull request that GitHub says conflicts

**Status:** ✅ done

## Problem
In pull request mode, when GitHub says a ticket's pull request conflicts with the base branch, `speck ship` refuses with an ordinary error instead of a conflict (exit 13). `speck run` then doesn't hand the ticket back to its build to merge the base branch in, so an auto-shipped ticket sits approved with a conflict until someone notices.

## Outcome
In pull request mode, a pull request that GitHub says conflicts is handed back to its build, as a conflict found locally is.

## Acceptance criteria
1. With `ship_mode: pr`, when GitHub reports the ticket's pull request as conflicting with the base branch, `speck ship --auto` refuses with exit 13, naming the conflict, and changes nothing.
2. speck run hands such a ticket back to its build with the conflict steps, as it does for a conflict found by ship's own merge.
3. Pull requests GitHub can't merge for other reasons (checks failing, a review required) are refused as today, and aren't handed back.
4. `ship_mode: local` works as today.

## Out of scope
- Resolving conflicts on GitHub.

## Notes
- From `speck/ideas/2026-10-18-hand-back-a-pull-request-github-says-conflicts.md`. `whyNotMergeable` in `scripts/pr-ship.mjs` refuses a `CONFLICTING` or `DIRTY` pull request before ship's own landing test, which gives exit 13, is reached.
- Failing before this build: none
- Changed an existing test: 0296 AC3's conflict case in `test/pr-ship-0296.test.mjs` now expects the conflict refusal AC1 asks for, instead of "can't be merged yet: it conflicts with the base branch".
- Before refusing a conflict, ship fetches the remote's base branch (as its landing test already does), so `<remote>/<base>`, the ref its message tells the build to merge, is up to date. That moves only the remote-tracking ref.
- Self-check: no changes. Noted one gap outside the ticket: once a handed-back build merges and is approved again, nothing in speck run pushes the new commits to the pull request, so the next ship says to run `speck pr`. Saved as a follow-up.

## In plain words
In pull request mode, when GitHub says a ticket's pull request clashes with newer work on the main branch, speck now treats that the same way as a clash it finds itself. Instead of stopping with a general error, it says the pull request conflicts, and speck run hands the ticket back to the agent that built it, so it can bring in the newer work and get it reviewed again. Pull requests held up for other reasons, such as failing checks or a review GitHub needs, are reported as before. Local shipping hasn't changed.

To see it, make a ticket's pull request clash with the main branch on GitHub while speck run is on: its log says the ticket was handed back to its build.

Worth watching: once the build has sorted out the clash and been approved again, speck run doesn't yet send the new work up to the pull request by itself. The next ship asks you to run `speck pr` for the ticket. That's saved as a follow-up.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 191,454
- Elapsed since build started: 5 min
- Changed lines: 19 (limit 5000)
- Follow-ups:
  - After a handed-back build is approved again, push its new commits to the pull request automatically: `speck/ideas/2026-10-19-push-a-handed-back-pull-request-again.md`.

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
    "reviewed_sha": "bfd16e2bf311ccc702fd519496824aad14204dfa",
    "thread_id": "01a15301-069e-74f1-9937-4e92137c576a",
    "seconds": 33,
    "usage": {
      "input_tokens": 190562,
      "cached_input_tokens": 143872,
      "cache_write_input_tokens": 0,
      "output_tokens": 892,
      "reasoning_output_tokens": 101
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-19T07:12:51.170Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/pr-ship.mjs: shipPrTicket recognises CONFLICTING or DIRTY and refuses with exit 13 before merging. Passing 0323 AC1 tests exercise both fields, mixed case, competing blockers and unchanged branches, files and pull request state."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/pr-queue.mjs: prQueue sends exit 13 to handBack and skips waiting tickets. scripts/run.mjs connects these callbacks to handBackQueue, which resumes the build with the existing Conflict steps. Both 0323 AC2 tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0323 AC3 test exercises failing checks and required reviews through the CLI, confirming ordinary exit 1 refusals, and verifies non-conflict queue exits do not trigger hand-back. Existing 0296 refusal tests also passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing 0323 AC4 test ships in local mode and verifies GitHub is never called. Local shipping code is unchanged."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "GitHub-reported conflicts now return the conflict exit code and cause speck run to resume the ticket’s build with conflict instructions. Other refusals and local shipping retain their behaviour. The recorded tests passed. Automatically pushing rebuilt commits remains a separate follow-up."
  }
}
```

</details>
