---
id: "0048"
title: Resolve a ship conflict without stopping the build                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0046"]                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T16:36:57.265Z"

---
# 0048 · Resolve a ship conflict without stopping the build

**Status:** 👍 approved

## Problem
Builds run in parallel, so a ticket often finishes after another has changed the same files on the base branch. Then `speck ship --auto` refuses with a conflict and the build stops, leaving an approved ticket that someone has to merge by hand and get re-reviewed. That happened to 0039 on 9 October, and it will keep happening as more builds run at once.

## Outcome
When a build's ship hits a conflict, the build brings its branch up to date with the base branch, resolves the conflict, gets the result reviewed and ships, without the user stepping in.

## Acceptance criteria
1. When merging into the base branch conflicts, `speck ship` exits with code 13, a new code, names the conflicting files and changes nothing. Every other refusal keeps its code.
2. `speck review <id>` accepts an `approved` ticket: it sets it to `reviewing`, as round 1 does for `building`, and runs the next round.
3. In a round after the ticket branch has merged the base branch, the reviewer's diff is the branch's whole change against the base branch as merged (what would ship), not the diff since its last review, and the prompt says the round follows a merge.
4. `/speck-build` section 5 says that on exit 13 the builder merges the base branch into the ticket branch in its worktree, resolves the conflicts keeping the intent of both sides, runs the tests, commits, runs a review round whose response lists each file it resolved and how, and on `ship` runs `speck close` and `speck ship <id> --auto` again. After two merges that still end in a conflict, it blocks the ticket with the conflicting files in the question.
5. `speck/product.md` describes the conflict exit code and the merge-and-re-review step.

## Out of scope
- Refused ships that wipe uncommitted changes (0046).
- Rebasing or squashing: the branch merges the base branch in, so reviewed commits stay as they are.
- Choosing which tickets to run together to avoid conflicts.

## Notes
- The extra round counts towards `max_review_rounds` as usual, and the loop blocks when it's reached.
- Builds after 0046, which changes the same ship code.
- 0039's conflict was resolved this way by hand on 9 October, and the reviewer approved the merge in one round.
- No external facts: everything is in this repo.
- Self-check: a merge that fails with no conflicting files (a failing merge hook, say) is no longer called a conflict and keeps exit code 1; added a test. `speck close` replaces the figures an earlier close wrote, so the second close after a re-review doesn't repeat them. A round-1 prompt rebuilt from git diffs against the base as it was at round 1, not the newly merged base.
- Existing tests that expected exit 1 on a conflict (ship-0046) now expect 13, and the 0032 product.md check now expects the merge-and-re-review wording instead of "rebuilt on the latest base branch": both are the behaviour this ticket changes.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Recovery cannot resolve a conflict introduced by newly fetched remote commits.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 671,125
- Elapsed since build started: 11 min
- Changed lines: 99 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up idea: `speck close` drops earlier figure lines by their labels (`- Reviewer:`, `- Changed lines:` and so on), so a hand-written Delivery log line starting with one of those labels would go too. A marker around speck's figures would make that exact.

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
    "reviewed_sha": "3d89d9652c9fd4e697fd4d897d11720bb5840cc8",
    "thread_id": "01a1218d-0ae4-7072-8f56-fb4ca95eb833",
    "seconds": 40,
    "usage": {
      "input_tokens": 221249,
      "cached_input_tokens": 139264,
      "cache_write_input_tokens": 0,
      "output_tokens": 975,
      "reasoning_output_tokens": 89
    },
    "saved_at": "2026-10-09T16:44:54.076Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs shipTicket assigns code 13 only when unmerged files exist, after undoing the ship. test/ship-0048.test.mjs covers conflicts, unchanged snapshots, other refusal codes and failing merge hooks."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "startReviewing and reviewRound accept approved tickets and restore their original contents on failure. AC2 tests exercise review, failed review and record."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "reviewSince detects a moved merge base; reviewerPrompt supplies the whole diff and merge explanation. AC3 tests inspect the actual command reviewer's prompt and speck diff, including exclusion of base-only changes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md section 5 contains the required sequence and two-merge limit. The AC4 instruction test checks these requirements; the integration test exercises merge, re-review, close and ship."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "speck/product.md describes exit 13 and merge-and-re-review recovery; the AC5 test checks those descriptions."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "skills/speck-build/SKILL.md",
        "issue": "Recovery cannot resolve a conflict introduced by newly fetched remote commits. shipTicket's undo resets the local base to baseSha, undoing its remote catch-up. Section 5 then tells the builder to merge that unchanged local base. That merge can report already up to date, leaving the remote conflict unresolved; the next ship fetches the same commits and conflicts again. Existing recovery tests advance local main and miss this case.",
        "suggested_fix": "Make recovery incorporate the fetched remote base as well as the local base without weakening ship's rollback guarantee. Ensure reviewSince recognises that merge and supplies the whole shipping diff. Add an integration test where only the remote base advances, the first ship exits 13, and recovery, review, close and the second auto-ship succeed.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The documented recovery works for local base changes, but its general claim omits the remote catch-up case where recovery repeatedly merges an outdated local base."
    },
    "escalation_question": "",
    "summary": "The change handles local branch conflicts and correctly sends the merged result for review. However, a conflict caused by new remote changes cannot be recovered using the supplied instructions. That gap needs fixing before merge. Tests were inspected but not rerun in this read-only review."
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
    "reviewed_sha": "77801f564e6ee4759d7edcacaf0e5e5b49807bd3",
    "thread_id": "01a1218d-0ae4-7072-8f56-fb4ca95eb833",
    "seconds": 26,
    "usage": {
      "input_tokens": 447204,
      "cached_input_tokens": 331904,
      "cache_write_input_tokens": 0,
      "output_tokens": 1697,
      "reasoning_output_tokens": 107
    },
    "saved_at": "2026-10-09T16:47:55.400Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs shipTicket returns 13 for conflicts after rollback and names the files. AC1 tests cover unchanged state, other refusal codes and non-conflict merge failures; supplied results pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "startReviewing and reviewRound transition approved tickets to reviewing and restore them on failure. AC2 review, record and failure tests pass in the supplied results."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "shipBase and reviewSince recognise local and remote base merges; reviewerPrompt explains the whole shipping diff. AC3 and F1 integration tests inspect the actual reviewer prompt and matching speck diff; supplied results pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md section 5 specifies the merge ref, resolution, tests, commit, review response, close, retry and two-merge limit. AC4 instruction and local/remote recovery integration tests cover these requirements."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "speck/product.md documents exit 13, remote recovery and merge-and-re-review. The AC5 documentation test passes in the supplied results."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "skills/speck-build/SKILL.md",
        "issue": "Remote-only conflicts previously directed recovery to an outdated local base. Resolved: ship now names the remote ref, the skill follows it, and reviewSince accounts for the remote base.",
        "suggested_fix": "Implemented and covered by the F1 integration test through conflict, rollback, merge, re-review, close, auto-ship and push.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The documentation now accounts for both local and newly fetched remote conflicts."
    },
    "escalation_question": "",
    "summary": "Conflict recovery now covers both local and remote changes and gets the resolved result independently reviewed before shipping again. The previous blocking issue is fixed. All 311 supplied test results pass; tests were inspected but not rerun during this read-only review."
  }
}
```

</details>
