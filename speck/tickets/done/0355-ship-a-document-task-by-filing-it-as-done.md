---
id: "0355"
title: "Ship a document task by filing it as done"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-17-review-documents-an-agentic-task-writes.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0354"]                # ticket ids that must be done first
created: 2026-10-21
started: "2026-10-21T10:32:16.123Z"
approved: "2026-10-21T10:38:39.394Z"
finished: "2026-10-21T10:41:15.132Z"

---
# 0355 · Ship a document task by filing it as done

**Status:** ✅ done

## Problem
`auto_ship` covers both risks in this project, so a document task would be approved and filed as done before the user had read it. For a document, reading it is the review, and every new task starts with the user holding Gate 2.

## Outcome
A document task waits approved until the user ships it, and shipping it carries only the ticket's own records.

## Acceptance criteria
1. Neither `speck ship <id> --auto` nor `speck run`'s ship queue ships a document task, whatever `auto_ship` and `auto_ship_risk` say. The reason given says a document task waits for you to ship it.
2. `speck ship <id>` on an approved document task whose branch changes only files under `speck/` merges it and files it as done without running the test suite.
3. `speck ship <id>` refuses a document task whose branch changes any file outside `speck/`, naming those files, and ships nothing.
4. A code ticket ships as it does today.
5. No test that passed before this change fails.

## Out of scope
- A per-task `auto_ship` setting, for once the user trusts documents: later, from how many came back unchanged.
- Asking for changes instead of shipping (0356, 0357).

## Notes
- Agreed with the user 2026-10-21: documents never auto-ship to begin with.
- The branch still merges, because it carries the ticket's status, review rounds and logs. The document itself is in `outputs/`, which isn't in git, so there's nothing to test.
- `autoShipWhyNot` and `shipTicket` in `scripts/ship.mjs`; `scripts/ship-queue.mjs`. The panel's Ship button runs `speck ship`, so it needs no change.
- Failing before this build: none
- Self-check: no changes

## In plain words
A document task no longer ships by itself, even with auto-ship on for every risk: once the reviewer approves it, it waits for you to read the document and press Ship. Shipping it is quick, as no tests run: it just files the ticket as done. If its branch has changed anything outside speck's own records, shipping refuses and names those files. To see it, build a document task with auto-ship on: it stays approved, and the auto-ship message says a document task waits for you. Code tickets ship exactly as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Document tasks still run the suite when shipped in PR mode.; F2 The brief test locates content through the exact numbered wording '4.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 413,709
- Elapsed since build started: 6 min
- Changed lines: 32 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none. Round 1's two findings (pull request mode still ran the tests for a document task, and a docs test tied to the brief's wording) were fixed in round 2.

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
    "reviewed_sha": "ee9d481c949e30ec3b8d95bc041fd51280091ac4",
    "thread_id": "01a15e08-1099-7251-bcd4-b02db33b0842",
    "seconds": 34,
    "usage": {
      "input_tokens": 150280,
      "cached_input_tokens": 103296,
      "cache_write_input_tokens": 0,
      "output_tokens": 1060,
      "reasoning_output_tokens": 37
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-21T10:36:22.927Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "ship.mjs autoShipWhyNot blocks document tasks before checking configuration. statusData passes ticketTask through, and shipOrder excludes them. Both AC1 tests passed."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The AC2 test passed for local shipping. However, pr-ship.mjs shipPrTicket still calls testLanding, which unconditionally calls testMerged. The criterion does not exclude PR mode."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "ship.mjs shipChecks rejects branch changes outside speck/, using a null-delimited diff with rename detection disabled. The AC3 integration test passed, verifying named files and unchanged branch tips."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The code-ticket test passed for successful shipping and refusal on failing tests. Existing ship.test.mjs tests cover code auto-shipping; the reported run has no failures."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The reported selected regression run passed 256 tests, with three skipped and no failures. No existing tests were weakened or removed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/pr-ship.mjs",
        "issue": "Document tasks still run the suite when shipped in PR mode. testLanding unconditionally invokes testMerged, so a failing or missing test command prevents an otherwise valid document task from shipping. The builder's added note cannot narrow acceptance criterion 2 to local mode.",
        "suggested_fix": "Skip the suite for document tasks in PR shipping while retaining the existing approval, file-scope, conflict and PR checks. Add coverage proving a document task ships without invoking the test command in PR mode.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/ship-0355.test.mjs:74",
        "issue": "The brief test locates content through the exact numbered wording '4. **Humans hold two gates.**'. Renaming or renumbering that passage breaks the suite even when the documented behaviour remains correct. The review rules explicitly prohibit tests of a document's exact wording or heading order.",
        "suggested_fix": "Remove the prose-dependent assertions. Review the behavioural explanation directly; retain only document tests of concrete facts such as commands, paths or setting names without requiring exact prose or placement.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Local document shipping works and automatic shipping is blocked. Two fixes remain: PR shipping still runs tests for documents, and a new documentation test would break on a harmless wording change."
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
    "reviewed_sha": "bd5409b279e5bb96accb2c56976cbfc0f9a91c73",
    "thread_id": "01a15e08-1099-7251-bcd4-b02db33b0842",
    "seconds": 23,
    "usage": {
      "input_tokens": 260585,
      "cached_input_tokens": 203264,
      "cache_write_input_tokens": 0,
      "output_tokens": 1784,
      "reasoning_output_tokens": 37
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-21T10:38:31.146Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "ship.mjs autoShipWhyNot blocks document tasks before checking configuration. statusData supplies the task type, and shipOrder excludes tickets with auto_ship false. Both AC1 behavioural tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "shipTicket skips tests for document tasks. pr-ship.mjs testLanding now also skips tests after checking merge conflicts. Local and PR integration tests passed with a test command that would leave a marker and fail if invoked; both verify the ticket becomes done."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "shipChecks rejects and names changes outside speck/ before shipping. Passing AC3 tests cover local refusal with unchanged branch tips and PR refusal without opening or merging a pull request."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The document-specific conditions leave code-ticket testing and shipping intact. The AC4 test and existing shipping regression tests passed, including code auto-shipping coverage."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The reported regression run passed 258 tests, with three skipped and no failures. Existing tests were not weakened; the whole-suite landing check remains the shipping gate for code tickets."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/pr-ship.mjs",
        "issue": "PR shipping previously ran the suite for document tasks.",
        "suggested_fix": "Implemented: testLanding skips the suite for document tasks while retaining the conflict check, with passing PR integration coverage.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/ship-0355.test.mjs",
        "issue": "The documentation test previously depended on an exact numbered heading.",
        "suggested_fix": "Implemented: assertions now check setting and folder names without depending on heading wording or numbering.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Document tasks now wait for you to ship them, skip tests in both local and PR shipping, and refuse changes outside speck/. Both previous findings are resolved, and the reported regression tests pass."
  }
}
```

</details>
