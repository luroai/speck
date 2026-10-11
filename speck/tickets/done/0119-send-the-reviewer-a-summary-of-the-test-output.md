---
id: "0119"
title: "Send the reviewer a summary of the test output"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-spend-fewer-tokens-per-build.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T11:03:24.826Z"
finished: "2026-10-11T11:11:29.203Z"

---
# 0119 · Send the reviewer a summary of the test output

**Status:** ✅ done

## Problem
Every review round puts the builder's full test output in the reviewer's prompt. Here that's about 245 KB, or about 60,000 tokens, nearly all of it passing tests from other tickets. The reviewer re-reads it on every model call in the round, so it's likely over half of the 280k–1.26M input tokens a ticket's review costs, and it makes each round slower.

## Outcome
The reviewer gets a short summary of the test run that keeps everything it needs, instead of the full output.

## Acceptance criteria
1. When the test output given with `--tests` (to `speck review` or `speck prompt`) is TAP, as `node --test` writes it, the prompt's test output holds only:
   - the run's totals (tests, pass, fail, skipped and any other counts it gives);
   - every failing test, with all of its details;
   - every test whose name contains the ticket's id, with whether it passed.
2. The prompt says the output was summarised and gives the path of the full output file.
3. Passing tests whose names don't contain the ticket's id aren't in the prompt.
4. Test output that isn't TAP is put in the prompt in full, as it is today.
5. The build skill tells the builder to start each new test's name with the ticket's id and criterion number (for example `0119 AC2: …`), so the reviewer sees the ticket's own tests.

## Out of scope
- Letting the reviewer run the tests itself (0024).
- Summarising other test output formats.

## Notes
- Measured 2026-10-11: `/tmp/speck-0113-tests.txt` was 247 KB for 968 tests.
- Most tests in this repo already start with their ticket's id (for example `0077 AC2: …`).
- Failing before this build: none
- Self-check: no changes (checked against this repo's real suite output: 260 KB summarised to 2.4 KB, keeping totals, the one failure and the ticket's tests)

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Ticket matching uses the whole suite ancestry rather than the test's own name.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 265,555
- Elapsed since build started: 7 min
- Changed lines: 82 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Follow-ups:
- A `claude-subagent` reviewer's round 2 onwards still gets the full test output, sent by the builder with SendMessage. Saved to the inbox: speck/ideas/2026-10-11-summarise-test-output-for-claude-subagent-later-rounds.md
- Skipped (duplicate): a missing `--tests` file still ends in a stack trace, as before this ticket. Matches speck/ideas/2026-10-10-say-plainly-when-a-file-given-to-speck-is-missing.md

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
    "reviewed_sha": "e7db495432491ab66bdff4d3665aabf82ab8115a",
    "thread_id": "01a12aa5-edbb-77c0-b3b2-14de20491682",
    "seconds": 41,
    "usage": {
      "input_tokens": 92175,
      "cached_input_tokens": 56576,
      "cache_write_input_tokens": 0,
      "output_tokens": 1092,
      "reasoning_output_tokens": 188
    },
    "saved_at": "2026-10-11T11:08:40.303Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "test/tap-0119.test.mjs covers totals, failure details and ticket tests; the full output confirms these tests passed. However, summariseTap in scripts/tap.mjs:59 selects tests by their full ancestor path, retaining additional passing tests outside the requested selection."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "summariseTap supplies the summary notice and full file path. The AC2 unit test and prompt/review integration test passed in /tmp/speck-0119-tests.txt."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "A read-only reproduction with a suite named '0119 suite' and a passing child named 'unrelated passing child' includes the child in the summary. The existing AC3 test does not cover an ancestor containing the ticket id."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "testOutput returns the original text when summariseTap returns null. The AC4 unit and prompt/review integration tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md explicitly requires names starting with the ticket id and criterion number; the AC5 test verifies this instruction and passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/tap.mjs:59",
        "issue": "Ticket matching uses the whole suite ancestry rather than the test's own name. Consequently, every passing child of a suite containing the ticket id appears in the prompt, even when the child's name does not contain that id. This violates the required filtering and can retain large amounts of unrelated output.",
        "suggested_fix": "Store each result's own name separately and match the ticket id against that name. Keep the ancestor path for display. Add a regression test with a ticket-named suite containing an unrelated passing child.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The summary preserves totals and failure details, identifies the full output file, and leaves other output formats unchanged. The recorded suite passed. One filtering bug needs fixing: a suite named with the ticket id causes unrelated passing children to appear too."
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
    "reviewed_sha": "3af21fb5d8ade47b3e0752903102b2b41bba0297",
    "thread_id": "01a12aa5-edbb-77c0-b3b2-14de20491682",
    "seconds": 21,
    "usage": {
      "input_tokens": 170561,
      "cached_input_tokens": 129920,
      "cache_write_input_tokens": 0,
      "output_tokens": 1727,
      "reasoning_output_tokens": 188
    },
    "saved_at": "2026-10-11T11:10:13.279Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/tap.mjs preserves totals and failure details and now selects ticket tests by their own names. AC1 unit tests and the prompt/review integration test passed in /tmp/speck-0119-tests.txt."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "summariseTap includes the summary notice and full output path; testOutput resolves that path. The AC2 and prompt/review integration tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "summariseTap now matches t.name rather than t.path. The original AC3 test and new AC3 (F1) regression test passed, verifying unrelated passing children are omitted even under a ticket-named suite."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "testOutput returns non-TAP text unchanged. AC4 unit tests and integration tests covering both speck prompt and speck review passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md requires each new test name to start with the ticket id and criterion number. The AC5 test passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/tap.mjs:59",
        "issue": "Matching suite ancestry previously included unrelated passing children. Results now retain their own names, and ticket matching uses those names only.",
        "suggested_fix": "No further change required; the regression test covers the reported case.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The filtering bug is fixed and all five criteria are met. Reviewers receive a compact TAP summary with totals, failure details, ticket tests and the full output path. Other formats remain unchanged. The recorded suite has 1,044 passing tests, three skipped and no failures."
  }
}
```

</details>
