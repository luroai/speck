---
id: "0011"
title: Keep review rounds in the ticket file                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | done
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: high               # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-08
started: "2026-10-08T19:29:41.797Z"

---
# 0011 · Keep review rounds in the ticket file

**Status:** 👍 approved

## Problem
Review records live in `speck/reviews/<id>/`, apart from the ticket they belong to. When a ticket is filed into `speck/tickets/done/`, its reviews stay behind, so a ticket's history is split across two places, and the planned board would have to put them back together for every card. speck is meant to be lightweight: one ticket should be one file.

## Outcome
Each ticket file holds its own review rounds, so a ticket is the complete record of its work, and `speck/reviews/` no longer exists.

## Acceptance criteria
1. `speck review` and `speck record` add each round to a `## Review rounds` section at the end of the ticket file: one collapsed `<details>` block per round, with a one-line summary (round, reviewer, verdict) and the full round record as a `json` code block. After a round, the ticket file is the only tracked file that has changed.
2. `speck next`, `speck pack`, `speck ship` and round numbering read rounds from the ticket file, and give the same results as they do today for the same rounds.
3. The diff sent to the reviewer and the size count leave out the `## Review rounds` section, but still include any other change to the ticket.
4. `speck lint` reports an error if a block in `## Review rounds` doesn't parse as JSON, or if the round numbers aren't 1, 2, 3… in order.
5. Re-running `speck init` in a repo with the old layout moves each `speck/reviews/<id>/round-N.json` into its ticket (in `speck/tickets/` or `speck/tickets/done/`) and removes `speck/reviews/` once it's empty. Running it again changes nothing. Rounds it can't place, such as an id with no ticket, are left where they are with a message saying which and why, and the rest are still migrated.

## Out of scope
- Generating the hand-written `## Review log` from the rounds (possible follow-up)
- Rebuilding reviewer context when the Codex thread is missing (separate ticket)
- Any board or UI work

## Notes
- Risk is high because `speck init` moves existing review history in users' repos.
- speck owns the `## Review rounds` section. The skills must tell builders never to edit it by hand, as they do for round files today.
- Working files that aren't history (the Codex thread id, `reviewer-settings.json`, `.round-N.out.json`) must no longer be written to `speck/reviews/`. A gitignored `speck/.cache/` is fine. Each round record already stores `thread_id`.
- 8 October 2026, after the build was blocked at the 3-round review limit: the user allowed a fourth round. `limits.max_review_rounds` is raised to 4 on this branch for that round and set back to 3 before approval.
- This repo's own reviews (0004–0007) are migrated on the ticket branch, so the repo matches the new layout as soon as it ships.
- Update `docs/brief.md`, `speck/product.md` and the skills wherever they mention `speck/reviews/`.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->
Round 1 (codex, gpt-6.1-sol): changes_requested: F1 a damaged round block could be silently ignored; F2 ticket edits not counted in the size limit; F3 other tickets' rounds still in the reviewer diff. Round 2: changes_requested: F2 dispute accepted (speck/ is left out of the size count by design), F3 resolved, F1 still open for stray content before the first round. Round 3: changes_requested: F1 still open; F4 an unrelated board idea edit was on the branch. Round 4 (allowed by the user): approved, F1 and F4 resolved.

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- One sitting on `speck/0011-keep-review-rounds-in-the-ticket-file`: tests first from the five acceptance criteria, then the implementation, then this repo's own reviews (0004–0007) migrated with `speck init`. All 9 migrated rounds were checked to be identical to the original files.
- Review rounds: 4, all codex on `gpt-6.1-sol` (effort default). Blocked once at the 3-round limit; the user allowed a fourth round, and `limits.max_review_rounds` is back to 3.
- Reviewer tokens: 861,113 (round 1: 110,437 in / 1,227 out, 51s; round 2: 174,086 / 2,190, 34s; round 3: 244,434 / 3,039, 26s; round 4: 321,857 / 3,843, 28s).
- Wall time: 13 minutes from `building` to `approved`, plus the wait for the decision on the extra round.
- Changed lines: 219 (limit 1000), excluding tests, lockfiles and `speck/`. Test suite: 56 tests, all passing.
- The reviewer could not start its sandbox on this machine (the known limit in `speck/product.md`), so every round was judged from the diff and the test output.
- Round 2 was used up without my seeing it. Codex returned and speck saved the round, but printing it failed because my round-1 F1 fix split rounds on any `<details>`, and the reviewer's own text quoted it. Fixed by splitting only on `<details>` at the start of a line, with a regression test.
- Follow-up ideas: when `speck review` fails after saving a round, it could still print the saved verdict, so a round is never used up unseen. The missing-Codex-thread case (a fresh session given a round-2 prompt) is still open, as noted in the ticket's out of scope.
- A `git add -A` committed someone else's edit to `speck/ideas/2026-10-08-speck-board.md` onto this branch (round 3, F4). It has been taken off the branch and restored as an uncommitted change in the working tree. From now on I stage files by name.

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
    "reviewed_sha": "b7e4925972d0e8bc30f0f63bfb5839f97b8dbb29",
    "thread_id": "01a11d02-5937-78c3-b3fe-ae902cdc650c",
    "seconds": 51,
    "usage": {
      "input_tokens": 110437,
      "cached_input_tokens": 54912,
      "cache_write_input_tokens": 0,
      "output_tokens": 1227,
      "reasoning_output_tokens": 279
    },
    "saved_at": "2026-10-08T19:35:06.867Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "saveRound and appendRounds store collapsed details blocks in the ticket. Supplied passing AC1 tests exercise Codex and record, sequential numbering and the ticket being the only tracked change."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "rounds reads ticketRounds. The supplied passing AC2 integration test exercises next, pack, ship and preservation of rounds when the ticket moves into done/."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The AC3 test adds ordinary ticket notes but asserts that only a.txt counts towards size. reviewDiff also strips rounds only from the current ticket, leaving other tickets' review sections in the reviewer diff."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "ticketRounds parses only matches of its complete ```json fence pattern. A details block with a missing closing code fence is silently ignored, so lint reports no JSON error. The supplied AC4 test covers malformed JSON inside complete fences only."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "migrateReviews supports live and done tickets, preserves unplaceable histories and continues migration. Supplied passing AC5 tests cover migration, repeat init, missing or unreadable tickets, invalid JSON and existing rounds."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Malformed review blocks can disappear from the parsed history without a lint error. ticketRounds ignores blocks whose JSON fence is incomplete or unrecognised, potentially making next report that no review exists.",
        "suggested_fix": "Validate every details block in the owned section and report missing or malformed JSON fences. Add regression coverage for a missing closing fence and verify lint and history-reading commands refuse it.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/speck.test.mjs",
        "issue": "The AC3 size test asserts behaviour contrary to the ticket: ordinary ticket edits are excluded alongside review history. It therefore does not establish that other ticket changes still count.",
        "suggested_fix": "Count ticket changes after stripping only the review section, and test that ordinary ticket edits increase the count while round-only edits do not.",
        "state": "open"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "reviewDiff filters review history only from the requested ticket. Changes to other tickets, including this branch's migrated histories for 0004–0007, are sent to the reviewer with their full review sections.",
        "suggested_fix": "Strip review sections from every ticket represented in the diff while preserving their other changes. Add coverage with a second ticket containing both an ordinary edit and appended rounds.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The claims that review sections are excluded from reviewer diffs and that lint detects invalid round blocks are broader than the implementation."
    },
    "escalation_question": "",
    "summary": "The normal storage and migration flows have meaningful passing tests. Before merge, malformed review blocks must be detected, and diff and size filtering must preserve ordinary ticket changes while excluding review history. Independent repository access failed because the sandbox could not start; this assessment uses the supplied code and test output."
  }
}
```

</details>

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "97de4eec1ae4e8e15f1f09d018052de8a6bc1650",
    "thread_id": "01a11d02-5937-78c3-b3fe-ae902cdc650c",
    "seconds": 34,
    "usage": {
      "input_tokens": 174086,
      "cached_input_tokens": 110080,
      "cache_write_input_tokens": 0,
      "output_tokens": 2190,
      "reasoning_output_tokens": 403
    },
    "saved_at": "2026-10-08T19:37:57.069Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "saveRound and appendRounds write full records in collapsed details blocks in the ticket. Supplied passing AC1 tests exercise review, record, sequential numbering and the ticket being the only tracked change."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "rounds reads ticketRounds. The passing AC2 integration test exercises next, pack, ship and preservation of history when filing the ticket into done/."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "reviewDiff now strips rounds from every changed ticket and excludes legacy review files. Passing AC3 tests verify ordinary edits remain visible and other tickets' histories disappear. The existing size rule excludes all speck/ files; retaining that rule is accepted."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "The new F1 regression covers incomplete details blocks and a standalone stray code block. However, ticketRounds discards everything before the first <details> and checks for stray fences only when there are no details blocks. Invalid JSON in a preceding code block is therefore still silently ignored."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The passing AC5 tests cover live and archived migration, idempotence, removal of the old directory, preserving unplaceable histories and continuing with other tickets."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "The validation fix still ignores code blocks before the first details block. For example, a Review rounds section containing ```json followed by invalid JSON and a closing fence, then a valid round-1 details block, returns one round and no errors. section.split(...).slice(1) discards the invalid prefix, and the stray-code check runs only when blocks.length is zero.",
        "suggested_fix": "Validate the prefix before the first details block, allowing only the heading, expected comment and whitespace. Add a regression with an invalid stray JSON block followed by a valid round, checking both lint and next refuse it.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/speck.test.mjs",
        "issue": "The size count retains the established exclusion of all speck/ files. The builder's explanation distinguishes that existing rule from preserving ordinary ticket edits in the reviewer diff.",
        "suggested_fix": "No change required; the dispute is accepted in the context of the existing size rule.",
        "state": "dispute_accepted"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "reviewDiff now strips history from all changed tickets and excludes deleted legacy review files. The new regression verifies that another ticket's ordinary edit remains visible.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "Diff filtering now matches the specification, but the claim that lint detects invalid round blocks remains incomplete because malformed content before a valid details block is ignored."
    },
    "escalation_question": "",
    "summary": "The diff filtering issue is fixed, and retaining the existing size-count rule is reasonable. One validation gap remains: damaged history before a valid round can still be silently ignored. The supplied suite reports 56 passing tests; independent repository access remains unavailable because the sandbox failed to start."
  }
}
```

</details>

<details><summary>Round 3 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "04bad9854b5fbad9723fcb7bbe0027b9869ea241",
    "thread_id": "01a11d02-5937-78c3-b3fe-ae902cdc650c",
    "seconds": 26,
    "usage": {
      "input_tokens": 244434,
      "cached_input_tokens": 173568,
      "cache_write_input_tokens": 0,
      "output_tokens": 3039,
      "reasoning_output_tokens": 403
    },
    "saved_at": "2026-10-08T19:38:56.176Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "saveRound and appendRounds store full records in collapsed ticket blocks. Passing AC1 tests cover review, record, numbering and tracked-file changes. The new quoted-markup regression verifies records containing <details> remain readable."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "rounds reads ticketRounds. The passing AC2 integration test exercises next, pack, ship and preservation of history when filing the ticket into done/."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "reviewDiff strips review sections from all changed tickets and excludes legacy review files. Passing AC3 tests verify ordinary edits remain visible. The established size rule continues to exclude speck/."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "ticketRounds still discards the prefix with split(...).slice(1), and checks stray code blocks only when no details blocks exist. Invalid JSON before a valid round remains undetected. The new test covers quoted markup, not the outstanding prefix case."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Passing AC5 tests cover live and archived migration, repeat init, old-directory removal, preservation of unplaceable histories and continued migration of other tickets."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "The round-2 finding remains unfixed: an invalid stray JSON code block before a valid round-1 details block is silently discarded. Anchoring the split fixes quoted markup inside records but does not validate the discarded prefix.",
        "suggested_fix": "Validate the prefix before the first details block, permitting only the heading, expected comment and whitespace. Add the specific regression with invalid JSON before a valid round and assert lint and next refuse it.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/speck.test.mjs",
        "issue": "Retaining the established exclusion of speck/ from the size count is accepted. Ordinary ticket edits remain visible in the reviewer diff.",
        "suggested_fix": "No change required.",
        "state": "dispute_accepted"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Filtering now covers every changed ticket and deleted legacy review files, with regression coverage preserving ordinary edits.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F4",
        "severity": "blocking",
        "file": "speck/ideas/2026-10-08-speck-board.md",
        "issue": "This round adds unrelated board architecture and remote-access decisions. Ticket 0011 explicitly excludes board or UI work.",
        "suggested_fix": "Remove this file's changes from the ticket branch and retain them separately for the board work.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The claim that lint detects invalid round blocks remains incomplete because malformed content before a valid details block is ignored."
    },
    "escalation_question": "",
    "summary": "The new fix correctly allows review records to quote markup, but the validation gap reported in round 2 remains. Unrelated board decisions also need removing from this branch. The supplied suite reports 56 passing tests; independent repository access remains unavailable because the sandbox failed to start."
  }
}
```

</details>

<details><summary>Round 4 · codex · approve</summary>

```json
{
  "meta": {
    "round": 4,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "c32129db18092142a9a7387134cb6372bd576b44",
    "thread_id": "01a11d02-5937-78c3-b3fe-ae902cdc650c",
    "seconds": 28,
    "usage": {
      "input_tokens": 321857,
      "cached_input_tokens": 243712,
      "cache_write_input_tokens": 0,
      "output_tokens": 3843,
      "reasoning_output_tokens": 431
    },
    "saved_at": "2026-10-08T19:42:27.197Z"
  },
  "verdict": {
    "round": 4,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "saveRound and appendRounds store full records in collapsed ticket blocks. Passing AC1 tests exercise review, record, numbering and the ticket being the only tracked change."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "rounds reads ticketRounds. The passing AC2 integration test exercises next, pack, ship and preservation of review history when moving into done/."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "reviewDiff strips review sections from every changed ticket and excludes legacy review files. Passing AC3 tests verify ordinary ticket edits remain visible. The established size rule excludes speck/."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "ticketRounds now validates the prefix and each complete round block, parses JSON and checks sequential numbering. Passing AC4 tests cover invalid JSON, gaps, reordered rounds, damaged fences, stray prefix content, quoted markup, and refusal by lint and next."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Passing AC5 tests cover live and archived migration, idempotence, old-directory removal, preservation of unplaceable histories and continued migration of other tickets."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Prefix validation closes the remaining silent-ignore gap. Regression tests exercise invalid content before a valid round and command refusal.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/speck.test.mjs",
        "issue": "Retaining the established exclusion of speck/ from the size count is accepted; ordinary ticket edits remain visible in reviewer diffs.",
        "suggested_fix": "No change required.",
        "state": "dispute_accepted"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Diff filtering covers every changed ticket and deleted legacy review files, with regression coverage preserving ordinary edits.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F4",
        "severity": "blocking",
        "file": "speck/ideas/2026-10-08-speck-board.md",
        "issue": "The supplied reversal restores the unrelated board note to its base-branch contents.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The living specification matches the storage, migration, filtering and validation behaviour."
    },
    "escalation_question": "",
    "summary": "The change is ready for the owner's merge review. Review history stays with each ticket, migration preserves unplaceable records, and malformed history is detected. All findings are resolved or accepted. The supplied suite reports 56 passing tests; independent access remains blocked by sandbox startup failure. Restore the temporarily authorised review limit to 3 during approval close-out, as recorded in the ticket."
  }
}
```

</details>
