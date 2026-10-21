---
id: "0353"
title: "Tell the reviewer what counts as evidence for a document"                # one outcome, no "and"
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
after: ["0352"]                # ticket ids that must be done first
created: 2026-10-21
started: "2026-10-21T10:15:49.117Z"
approved: "2026-10-21T10:19:50.755Z"
finished: "2026-10-21T10:22:26.019Z"

---
# 0353 · Tell the reviewer what counts as evidence for a document

**Status:** ✅ done

## Problem
The reviewer is told to judge each criterion from code and tests. A document task has no tests, and its document is in the main checkout's `outputs/`, outside the branch the reviewer is shown, so the reviewer wouldn't know where to look or what counts as evidence.

## Outcome
For a document task, the reviewer reads the document and cites the passages that meet each criterion.

## Acceptance criteria
1. For a document task, `speck prompt <id>` names the absolute path of its output folder and lists the files in it, or says the folder is empty or missing.
2. For a document task, `speck prompt <id>` tells the reviewer to judge each criterion by reading the document, cite the passage it relies on as its evidence, and not count a missing test against any criterion. (checked by review)
3. For a code ticket, `speck prompt <id>` is unchanged.
4. No test that passed before this change fails.

## Out of scope
- How the reviewer is started or which reviewer it is.
- The review pack (0354).

## Notes
- `templates/reviewer-prompt.md` and the prompt building in `scripts/review.mjs`. The reviewer prompt already has this rule for criteria marked `(checked by review)`.
- Checked 2026-10-21: Codex's `read-only` sandbox can read files outside the worktree it runs in, such as the main checkout's `outputs/` (codex-cli 0.159.0, `codex exec --sandbox read-only` run in another folder read and listed files under `/tmp` and in the main checkout).
- Failing before this build: none
- Self-check: the folder path no longer ends in a doubled slash when `output` ends in one; an unreadable folder or a file in its place is named as such rather than as missing; added tests for a document task's prompt with a response file and for a later review round, which lists the folder as it is then.
- Pictures: none, because nothing anyone sees in the panel or a page changes.

## In plain words
When the reviewer checks a ticket that writes a document rather than code, it's now told where that document is (the ticket's folder in `outputs/`) and which files are in it, or that the folder is empty or missing. It's also told to judge each criterion by reading the document and quoting the passage it relies on, and not to mark anything down for having no tests. Code tickets are reviewed exactly as before. To see it, build a document task: its review round should quote the document back at you. Worth watching: the reviewer reads the folder as it is at that moment, so anything changed there after a review isn't covered by it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Folders containing more than 200 files receive an incomplete inventory: remaining filenames are replaced with 'and N more'.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 259,554
- Elapsed since build started: 4 min
- Changed lines: 54 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (Delivery log only, none to the inbox):
- A file name containing a backtick shows oddly in the prompt's file list, as each name is wrapped in backticks. Cosmetic.

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
    "reviewed_sha": "7a5a0c2db7cb5bc78cfba14992a35b6cee18da4c",
    "thread_id": "01a15df8-6a30-75e1-b692-a9f1d4232be7",
    "seconds": 26,
    "usage": {
      "input_tokens": 91031,
      "cached_input_tokens": 55552,
      "cache_write_input_tokens": 0,
      "output_tokens": 620,
      "reasoning_output_tokens": 33
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-21T10:19:09.201Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/output.mjs documentWhere lists files recursively, but lines 35 and 53–54 cap the list at 200. The passing AC1 tests cover small folders, missing/empty folders and main-checkout resolution, but not truncation."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/reviewer-document.md instructs: “Judge every acceptance criterion by reading the document as it is now”, cite “the file and the words”, and “Don't count a missing test against any criterion”."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "documentSection returns an empty string for code tickets. The passing '0353 AC3' test compares the resulting prompt byte for byte with the original template filled in."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The recorded test output confirms 126 tests: 123 passed, 3 skipped and none failed. The change and supplied regression coverage show no further regression concern."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/output.mjs:53",
        "issue": "Folders containing more than 200 files receive an incomplete inventory: remaining filenames are replaced with 'and N more'. AC1 requires listing the files in the output folder, with no such limit, and omitted files may contain evidence the reviewer needs.",
        "suggested_fix": "Remove the inventory truncation and add a test with more than 200 files confirming that every filename appears.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The prompt now directs document reviewers to the correct folder and explains how to cite document evidence. Existing checks pass, and code-ticket prompts remain unchanged. One fix is needed: the file list currently hides filenames when a folder contains more than 200 files."
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
    "reviewed_sha": "af70432fddb829032621b3a85d6034698223053d",
    "thread_id": "01a15df8-6a30-75e1-b692-a9f1d4232be7",
    "seconds": 18,
    "usage": {
      "input_tokens": 166832,
      "cached_input_tokens": 128000,
      "cache_write_input_tokens": 0,
      "output_tokens": 1071,
      "reasoning_output_tokens": 33
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-21T10:19:41.667Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/output.mjs documentWhere now lists every discovered file without truncation. Passing tests in test/prompt-0353.test.mjs cover absolute paths, recursive listings, empty/missing folders, main-checkout resolution and all 250 filenames in a large folder."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/reviewer-document.md says to judge every criterion by reading the document, cite 'the file and the words', and 'Don't count a missing test against any criterion'."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "documentSection returns an empty string for code tickets. The passing AC3 test compares the code-ticket prompt byte for byte with the original filled template."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Verified recorded test totals: 127 tests, 124 passed, 3 skipped and no failures. No existing tests were weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/output.mjs",
        "issue": "The file inventory previously omitted filenames beyond the first 200. The limit has now been removed.",
        "suggested_fix": "Completed: every file is listed, with a passing regression test checking all 250 filenames.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Document reviewers now receive the output folder’s absolute path, its complete file list and instructions to cite document passages as evidence. Code-ticket prompts remain unchanged. The earlier truncation issue is fixed, all reviewed criteria pass and no blocking concerns remain."
  }
}
```

</details>
