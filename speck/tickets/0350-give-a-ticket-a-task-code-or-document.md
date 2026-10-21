---
id: "0350"
title: "Give a ticket a task: code or document"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-17-review-documents-an-agentic-task-writes.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-21
started: "2026-10-21T09:51:45.516Z"
approved: "2026-10-21T09:55:22.967Z"

---
# 0350 · Give a ticket a task: code or document

**Status:** 👍 approved

## Problem
Every ticket is a code change today, so there's no way to say a ticket's job is to write a document instead. The document task (`speck/ideas/2026-10-19-add-job-kinds-one-at-a-time.md`, first on the roadmap) needs each ticket to say which task it is before anything can treat a document differently.

## Outcome
A ticket says its task, `code` or `document`, and it shows on the board.

## Acceptance criteria
1. `speck lint` accepts a ticket whose `task` is missing, blank, `code` or `document`, and errors on any other value, naming the allowed ones. A missing or blank `task` means `code`.
2. `speck new` writes a `task: code` line in the frontmatter, with a comment listing `code | document`.
3. `speck status --json` gives each ticket's `task`, as `code` when it's missing or blank.
4. In the panel, a ticket card whose task is `document` shows a "document" tag, as a bug ticket shows its "bug" tag. A code ticket's card shows no task tag.
5. No test that passed before this change fails.

## Out of scope
- The `output:` field a document task needs (0351).
- Anything that builds, reviews or ships a document task differently (0352 to 0355).
- Other tasks (posts, research, email drafts): each comes later, one at a time.

## Notes
- Agreed with the user 2026-10-21: the field is called "task", not "kind". `code` is the default, so existing tickets need no change.
- `TYPES` and `ticketType` in `scripts/core.mjs`, `lintTicket` in `scripts/lint.mjs`, `templates/ticket.md`, and `typeTag` in `templates/panel.html` for the tag.
- Failing before this build: none
- Self-check: no changes

## In plain words
Each ticket now says what its build makes: code, as before, or a document. New tickets start as code, and existing tickets count as code without any change. To see it, change a ticket's task to document: its card in the panel gets a purple "document" tag, as a bug ticket gets its "bug" tag. Nothing builds, reviews or ships a document ticket differently yet: later tickets do that.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 95,118
- Elapsed since build started: 4 min
- Changed lines: 23 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (no inbox notes: none needs its own ticket yet):
  - The plain `speck status` list shows a bug or fix ticket's type after its id, but not a document task. Worth adding once the document task does something, alongside 0352 to 0355.

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
    "reviewed_sha": "e47cd5271951940f79825f98adc54672686065ec",
    "thread_id": "01a15de2-80de-7cd2-b31b-06b31c44fb1c",
    "seconds": 25,
    "usage": {
      "input_tokens": 94405,
      "cached_input_tokens": 55552,
      "cache_write_input_tokens": 0,
      "output_tokens": 713,
      "reasoning_output_tokens": 13
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-21T09:55:12.329Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/core.mjs ticketTask defaults missing and blank values to code; scripts/lint.mjs lintTicket validates against TASKS. Both AC1 tests passed, covering accepted values and invalid values with allowed names in the error."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/ticket.md includes task: code with the code | document comment. The passing AC2 test invokes speck new and checks the generated frontmatter."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/speck.mjs statusData sets task through ticketTask. The passing AC3 test invokes status --json and checks missing, quoted blank, bare blank, code and document values."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html taskTag renders only document tasks and is included wherever type tags appear. The passing AC4 test executes the panel script and checks document and code cards in Plan, Build and Shipped."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0350-tests.txt reports 329 passed, zero failed and three skipped across 332 tests. Existing tests were not changed, and the implementation introduces no apparent regression."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Tickets can now specify code or document, with existing tickets defaulting to code. New tickets include the field, status JSON reports it, and document tickets show a tag on the board. The tests exercise the requested behaviour and passed. No blocking concerns found."
  }
}
```

</details>
