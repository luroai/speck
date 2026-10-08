---
id: "0004"
title: "Start every ticket with a readable header"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | done
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-08
started: "2026-10-08T16:44:34.053Z"
finished: "2026-10-08T17:16:32.827Z"

---
# 0004 · Start every ticket with a readable header

**Status:** ✅ done

## Problem
A ticket's title and status exist only in the frontmatter. Markdown previews that hide frontmatter (VS Code, Obsidian, GitHub) show neither, and viewers without frontmatter support show the fields as a run-on paragraph. Either way, you can't open a ticket and see at a glance what it is and where it stands.

## Outcome
Every ticket opens with a `# <id> · <title>` heading and a clear status line under it, both kept in sync with the frontmatter by speck.

## Acceptance criteria
1. `speck new "<title>"` writes a ticket whose first lines after the frontmatter are `# <id> · <title>`, then a blank line, then `**Status:** <emoji> <status>` using the emoji in the Notes (for example `**Status:** 🔍 reviewing`).
2. Every speck command that changes a ticket's title or status (`speck set`, `speck ship`) updates the heading and status line to match the frontmatter, and adds them if they're missing.
3. `speck lint` warns when the heading or status line is missing, or doesn't match the frontmatter.
4. Re-running `speck init` adds or corrects the heading and status line in every existing ticket, in `speck/tickets/` and `speck/tickets/done/`, and leaves the rest of each ticket unchanged. This repo's tickets have them once this ships.

## Out of scope
- Changing the frontmatter format, or dropping it.
- Showing other fields (priority, size, risk, reviewer) in the header.
- Fixing frontmatter support in any particular Markdown viewer.

## Notes
- The frontmatter stays the source of truth; the heading and status line are rendered copies, and hand edits to them are overwritten.
- Status emoji, one per status, with the status word after it exactly as in the frontmatter: 📝 draft, 📋 ready, 🔨 building, 🔍 reviewing, ⛔ blocked, 👍 approved (waiting for you to ship), ✅ done. No coloured circles, so approved can't be mistaken for done.
- Keeps the blank line before the closing frontmatter fence.

## Blocked question

## Review log
- Round 1 (codex, gpt-6.1-sol): changes requested. F1: repairing the header could strip empty lines and indentation from the start of the ticket body.
- Round 2: approved. F1 resolved with line-based parsing and byte-for-byte regression tests.

## Delivery log
- Attempts: 1. Review rounds: 2 (of 3). Reviewer tokens: 156,196. Changed lines: about 70 (limit 1,000), excluding tests.
- Tests: the first draft was written by another agent working in the same folder; they were accidentally committed to main in 3ff2605 and reverted in a1b6bf2, then reused here with one added check (a ticket with no header gets one from `speck set`).
- This repo's seven tickets were given their headers by re-running `speck init`.
- Follow-up ideas: none from the review. Hand edits to a ticket's title in the frontmatter leave the heading stale until the next `speck set` or `speck init`; `speck lint` warns about it.

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
    "reviewed_sha": "d30198f64a3190352f41174304ead1b83ff70adf",
    "thread_id": "01a11c6b-2c17-7b11-9166-3c346b7b986f",
    "seconds": 36,
    "usage": {
      "input_tokens": 59416,
      "cached_input_tokens": 29440,
      "cache_write_input_tokens": 0,
      "output_tokens": 869,
      "reasoning_output_tokens": 209
    },
    "saved_at": "2026-10-08T16:49:44.271Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "cmdNew calls syncHeader; the AC1 CLI test checks the exact heading, blank line and status. The emoji test exercises all seven statuses."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "writeField calls syncHeader. The AC2 integration test exercises missing-header repair, title changes and shipping to done."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "lintTicket checks both rendered fields. The AC3 test exercises missing headers, stale titles and stale statuses."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "splitHeader consumes body whitespace with its trailing \\s*, and syncHeader replaces it with two newlines. The AC4 test checks content only from '## Problem' onwards for the live ticket, overlooking changes before that section."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Header repair does not preserve the remaining body. splitHeader's trailing \\s* removes all whitespace before the first body content, including indentation. For example, a body beginning with an indented Markdown code block loses its indentation when init or set repairs the header, changing its meaning. Extra blank lines are also removed, contrary to criterion 4.",
        "suggested_fix": "Identify header lines and their separators without consuming whitespace belonging to the remaining body. Add regression tests that compare the complete preserved body, including extra blank lines and an indented first content line.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The supplied living spec describes the intended capability and command behaviour accurately."
    },
    "escalation_question": "",
    "summary": "The header creation, updates and lint warnings are covered by meaningful tests. Header repair can also remove whitespace from ticket content, so it needs a fix before merge. Independent command checks were blocked by the sandbox failing to start; this review relies on the supplied diff and test output."
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
    "reviewed_sha": "25345b04cdb03a5476fa55fc1723c2af8a3003da",
    "thread_id": "01a11c6b-2c17-7b11-9166-3c346b7b986f",
    "seconds": 22,
    "usage": {
      "input_tokens": 94511,
      "cached_input_tokens": 59136,
      "cache_write_input_tokens": 0,
      "output_tokens": 1400,
      "reasoning_output_tokens": 237
    },
    "saved_at": "2026-10-08T16:51:27.615Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "cmdNew calls syncHeader. The AC1 CLI test checks the exact heading, blank line and draft status; the emoji test exercises all seven status mappings."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "writeField synchronises the header. The AC2 integration test exercises adding a missing header, changing the title and shipping with the done status."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "lintTicket compares the heading and status line with ticketHeader. The AC3 test covers both missing fields and each stale field."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "cmdInit synchronises tickets in both live and done folders. The AC4 integration test covers correction, body preservation and repeated init. The new F1 regression test checks complete output and idempotence for missing and stale headers with blank lines, indentation and nested list content. The supplied repository diff includes headers on all seven tickets."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "The previous header parser consumed whitespace belonging to the ticket body.",
        "suggested_fix": "Implemented: line-based parsing preserves the remaining body, with exact-output regression tests covering indentation and extra blank lines.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The living spec accurately describes header creation, synchronisation, lint warnings and migration."
    },
    "escalation_question": "",
    "summary": "The whitespace-loss issue is fixed and covered by meaningful regression tests. All four acceptance criteria are met, with no remaining blocking findings. The supplied results show 47 passing tests; independent execution remains unavailable because the sandbox failed to start."
  }
}
```

</details>
